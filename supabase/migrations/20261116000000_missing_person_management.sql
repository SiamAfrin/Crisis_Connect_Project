-- ============================================================================
-- Crisis Connect
-- Migration: missing person management
-- Chunk: 9 (PB-13, PB-14, PB-15)
--
-- Adds the missing person report table, its enums, indexes, RLS policies,
-- column grants, and one SECURITY DEFINER function for status changes.
--
-- PB-13: active victims can report a missing person.
-- PB-14: active authenticated users can read and search missing person reports.
-- PB-15: the reporter or an administrator can mark a report found, and an
--        administrator can reopen a found report.
--
-- Authenticated users have no direct update or delete grant on missing_persons,
-- so status changes can only happen through update_missing_person_status.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------

create type public.missing_person_status as enum (
  'missing',
  'found'
);

create type public.missing_person_gender as enum (
  'female',
  'male',
  'other',
  'unknown'
);

comment on type public.missing_person_status is
  'Whether a missing person report is active or the person has been found.';
comment on type public.missing_person_gender is
  'Gender description for a missing person report. Unknown is the default.';

-- ----------------------------------------------------------------------------
-- missing_persons
-- ----------------------------------------------------------------------------

create table public.missing_persons (
  report_id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null
    references public.profiles (id) on delete restrict,
  full_name text not null,
  age integer,
  gender public.missing_person_gender not null default 'unknown',
  description text not null,
  last_seen_location text not null,
  last_seen_at timestamptz not null,
  status public.missing_person_status not null default 'missing',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid
    references public.profiles (id) on delete restrict,

  constraint missing_persons_full_name_check
    check (char_length(btrim(full_name)) between 1 and 120),
  constraint missing_persons_age_check
    check (age is null or age between 0 and 120),
  constraint missing_persons_description_check
    check (char_length(btrim(description)) between 1 and 2000),
  constraint missing_persons_last_seen_location_check
    check (char_length(btrim(last_seen_location)) between 1 and 500),
  constraint missing_persons_last_seen_at_check
    check (last_seen_at <= created_at + interval '5 minutes'),

  -- A resolution must record both the resolving profile and the time.
  constraint missing_persons_resolution_state_check
    check (
      (
        status = 'missing'
        and resolved_at is null
        and resolved_by is null
      )
      or (
        status = 'found'
        and resolved_at is not null
        and resolved_by is not null
      )
    )
);

comment on table public.missing_persons is
  'Missing person reports submitted by victims and managed by reporters and administrators.';
comment on column public.missing_persons.status is
  'Missing reports are active; found reports are closed and record who resolved them.';

create index missing_persons_reporter_created_idx
  on public.missing_persons (reporter_id, created_at desc);

create index missing_persons_status_created_idx
  on public.missing_persons (status, created_at desc);

create index missing_persons_created_at_idx
  on public.missing_persons (created_at desc);

create index missing_persons_resolved_by_idx
  on public.missing_persons (resolved_by)
  where resolved_by is not null;

create trigger missing_persons_set_updated_at
before update on public.missing_persons
for each row
execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------

alter table public.missing_persons enable row level security;

-- Active victims, active responders, and active administrators can read
-- missing person reports. Pending and rejected accounts cannot.
create policy "missing_persons_select_active_users"
on public.missing_persons
for select
to authenticated
using (
  public.is_active_victim()
  or public.is_active_responder()
  or public.is_admin()
);

-- Only active victims can create a report, and the reporter must be the caller.
-- The status and resolution columns are not insertable by authenticated users,
-- so the database defaults keep a new report missing and unresolved.
create policy "missing_persons_insert_own"
on public.missing_persons
for insert
to authenticated
with check (
  reporter_id = auth.uid()
  and public.is_active_victim()
  and status = 'missing'
  and resolved_at is null
  and resolved_by is null
);

-- ----------------------------------------------------------------------------
-- Status updates
-- ----------------------------------------------------------------------------

create or replace function public.update_missing_person_status(
  target_report_id uuid,
  new_status public.missing_person_status
)
returns public.missing_person_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_is_admin boolean := public.is_admin();
  current_status public.missing_person_status;
  report_reporter_id uuid;
begin
  if caller_id is null then
    raise exception 'Sign in to update a missing person report.'
      using errcode = '42501';
  end if;

  -- Lock the report row so two status changes cannot interleave.
  select report.status, report.reporter_id
  into current_status, report_reporter_id
  from public.missing_persons as report
  where report.report_id = target_report_id
  for update;

  if not found then
    raise exception 'Missing person report not found.'
      using errcode = 'P0002';
  end if;

  if not caller_is_admin then
    if not public.is_active_victim() or report_reporter_id <> caller_id then
      raise exception 'Only the reporter or an administrator can update this report.'
        using errcode = '42501';
    end if;
  end if;

  if new_status is null or new_status not in ('missing', 'found') then
    raise exception 'Missing person status can only be missing or found.'
      using errcode = '22023';
  end if;

  if current_status = new_status then
    raise exception 'This report already has that status.'
      using errcode = '22023';
  end if;

  -- The reporter can close their own report, but only an administrator can
  -- reopen a report after the person has been found.
  if not caller_is_admin and new_status = 'missing' then
    raise exception 'Only an administrator can reopen a found report.'
      using errcode = '22023';
  end if;

  update public.missing_persons
  set
    status = new_status,
    resolved_at = case when new_status = 'found' then now() else null end,
    resolved_by = case when new_status = 'found' then caller_id else null end
  where report_id = target_report_id;

  return new_status;
end;
$$;

comment on function public.update_missing_person_status(
  uuid,
  public.missing_person_status
) is
  'Lets the reporter or an active administrator mark a report found; only administrators can reopen a found report.';

revoke all on function public.update_missing_person_status(
  uuid,
  public.missing_person_status
) from public;
grant execute on function public.update_missing_person_status(
  uuid,
  public.missing_person_status
) to authenticated;

-- ----------------------------------------------------------------------------
-- Table privileges
-- ----------------------------------------------------------------------------

revoke all on table public.missing_persons from anon, authenticated;
grant select on table public.missing_persons to authenticated;
grant insert (
  reporter_id,
  full_name,
  age,
  gender,
  description,
  last_seen_location,
  last_seen_at
) on table public.missing_persons to authenticated;

-- Status changes are reserved for update_missing_person_status. Authenticated
-- users have no direct update or delete grant on missing_persons.

-- Ask PostgREST to refresh its schema cache immediately after applying DDL.
notify pgrst, 'reload schema';
