-- ============================================================================
-- Crisis Connect
-- Migration: initial database foundation
-- Chunk: 1
--
-- Apply this migration with the Supabase SQL Editor or the Supabase CLI.
-- It creates the application enums, tables, constraints, indexes, helper
-- functions, grants, and Row Level Security policies.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------

create type public.user_role as enum (
  'victim',
  'volunteer',
  'rescue_team_member',
  'administrator'
);

create type public.rescue_team_category as enum (
  'government',
  'hospital',
  'defence',
  'ngo'
);

create type public.defence_subcategory as enum (
  'police',
  'fire_service'
);

create type public.account_status as enum (
  'pending',
  'active',
  'rejected'
);

create type public.emergency_severity as enum (
  'low',
  'medium',
  'high',
  'critical'
);

create type public.request_status as enum (
  'pending',
  'approved',
  'rejected'
);

create type public.assignment_status as enum (
  'pending',
  'accepted',
  'declined',
  'cancelled',
  'completed'
);

comment on type public.user_role is
  'The four application roles. Rescue team categories are not roles.';
comment on type public.rescue_team_category is
  'Government, Hospital, Defence, and NGO are rescue team categories.';
comment on type public.defence_subcategory is
  'Required only when the rescue team category is Defence.';

-- ----------------------------------------------------------------------------
-- Shared trigger function
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Maintains the updated_at timestamp on mutable application records.';

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  role public.user_role not null,
  rescue_team_category public.rescue_team_category,
  defence_subcategory public.defence_subcategory,
  account_status public.account_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_full_name_check
    check (char_length(btrim(full_name)) between 1 and 120),
  constraint profiles_email_check
    check (char_length(btrim(email)) between 3 and 320),
  constraint profiles_phone_check
    check (char_length(btrim(phone)) between 7 and 30),
  constraint profiles_address_check
    check (char_length(btrim(address)) between 3 and 500),

  -- Only rescue team members may have rescue-specific fields.
  constraint profiles_rescue_fields_check
    check (
      (
        role = 'rescue_team_member'
        and rescue_team_category is not null
      )
      or (
        role <> 'rescue_team_member'
        and rescue_team_category is null
        and defence_subcategory is null
      )
    ),

  -- Defence requires Police or Fire Service. Other categories keep it NULL.
  constraint profiles_defence_subcategory_check
    check (
      (
        rescue_team_category = 'defence'
        and defence_subcategory in ('police', 'fire_service')
      )
      or (
        rescue_team_category is distinct from 'defence'
        and defence_subcategory is null
      )
    )
);

comment on table public.profiles is
  'Application profile data linked one-to-one with auth.users.';
comment on column public.profiles.account_status is
  'Victims start Active. Volunteers and rescue team members start Pending.';

create unique index profiles_email_unique_idx
  on public.profiles (lower(email));

create index profiles_role_idx
  on public.profiles (role);

create index profiles_account_status_idx
  on public.profiles (account_status);

create index profiles_responder_approval_idx
  on public.profiles (role, account_status)
  where role in ('volunteer', 'rescue_team_member');

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- emergency_requests
-- ----------------------------------------------------------------------------

create table public.emergency_requests (
  request_id uuid primary key default gen_random_uuid(),
  victim_id uuid not null
    references public.profiles (id) on delete restrict,
  emergency_type text not null,
  description text not null,
  location text not null,
  affected_people integer not null,
  severity public.emergency_severity not null,
  request_status public.request_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_by uuid
    references public.profiles (id) on delete restrict,
  reviewed_at timestamptz,

  constraint emergency_requests_type_check
    check (char_length(btrim(emergency_type)) between 1 and 100),
  constraint emergency_requests_description_check
    check (char_length(btrim(description)) between 1 and 5000),
  constraint emergency_requests_location_check
    check (char_length(btrim(location)) between 1 and 500),
  constraint emergency_requests_affected_people_check
    check (affected_people between 1 and 1000000),

  -- A review must record both the administrator and the review time.
  constraint emergency_requests_review_state_check
    check (
      (
        request_status = 'pending'
        and reviewed_by is null
        and reviewed_at is null
      )
      or (
        request_status in ('approved', 'rejected')
        and reviewed_by is not null
        and reviewed_at is not null
      )
    ),

  constraint emergency_requests_reviewed_at_check
    check (reviewed_at is null or reviewed_at >= created_at)
);

comment on table public.emergency_requests is
  'Emergency requests submitted by victims and reviewed by administrators.';

create index emergency_requests_victim_created_idx
  on public.emergency_requests (victim_id, created_at desc);

create index emergency_requests_status_created_idx
  on public.emergency_requests (request_status, created_at desc);

create index emergency_requests_created_at_idx
  on public.emergency_requests (created_at desc);

create index emergency_requests_reviewed_by_idx
  on public.emergency_requests (reviewed_by)
  where reviewed_by is not null;

-- ----------------------------------------------------------------------------
-- emergency_assignments
-- ----------------------------------------------------------------------------

create table public.emergency_assignments (
  assignment_id uuid primary key default gen_random_uuid(),
  request_id uuid not null
    references public.emergency_requests (request_id) on delete cascade,
  responder_id uuid not null
    references public.profiles (id) on delete restrict,
  responder_role public.user_role not null,
  assignment_status public.assignment_status not null default 'pending',
  accepted_at timestamptz,
  assigned_by uuid not null
    references public.profiles (id) on delete restrict,
  assigned_at timestamptz not null default now(),

  -- Only responders can be assigned to an emergency request.
  constraint emergency_assignments_responder_role_check
    check (responder_role in ('volunteer', 'rescue_team_member')),

  -- The same responder cannot be assigned twice to the same request.
  constraint emergency_assignments_unique_responder
    unique (request_id, responder_id),

  constraint emergency_assignments_accepted_at_check
    check (
      assignment_status not in ('accepted', 'completed')
      or accepted_at is not null
    ),

  constraint emergency_assignments_accepted_after_assignment_check
    check (accepted_at is null or accepted_at >= assigned_at)
);

comment on table public.emergency_assignments is
  'Assignments connecting responders to emergency requests.';
comment on constraint emergency_assignments_unique_responder
  on public.emergency_assignments is
  'Prevents duplicate request/responder assignment pairs.';

create index emergency_assignments_request_idx
  on public.emergency_assignments (request_id);

create index emergency_assignments_responder_idx
  on public.emergency_assignments (responder_id);

create index emergency_assignments_status_idx
  on public.emergency_assignments (assignment_status);

create index emergency_assignments_assigned_by_idx
  on public.emergency_assignments (assigned_by);

-- ----------------------------------------------------------------------------
-- Authorization helpers
--
-- These are SECURITY DEFINER functions so policies can check the caller's
-- application role without recursively invoking the profiles RLS policy.
-- ----------------------------------------------------------------------------

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles as p
  where p.id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as p
    where p.id = auth.uid()
      and p.role = 'administrator'
      and p.account_status = 'active'
  )
$$;

create or replace function public.is_active_responder()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as p
    where p.id = auth.uid()
      and p.role in ('volunteer', 'rescue_team_member')
      and p.account_status = 'active'
  )
$$;

create or replace function public.is_active_victim()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as p
    where p.id = auth.uid()
      and p.role = 'victim'
      and p.account_status = 'active'
  )
$$;

comment on function public.is_admin() is
  'True only for active administrator profiles.';
comment on function public.is_active_responder() is
  'True only for active volunteers and rescue team members.';

revoke all on function public.current_user_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_active_responder() from public;
revoke all on function public.is_active_victim() from public;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_active_responder() to authenticated;
grant execute on function public.is_active_victim() to authenticated;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.emergency_requests enable row level security;
alter table public.emergency_assignments enable row level security;

-- Profiles -------------------------------------------------------------------

create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_admin()
);

create policy "profiles_insert_self_with_safe_status"
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and role <> 'administrator'
  and (
    (role = 'victim' and account_status = 'active')
    or (role in ('volunteer', 'rescue_team_member') and account_status = 'pending')
  )
);

create policy "profiles_update_own_basics"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Emergency requests ---------------------------------------------------------

create policy "emergency_requests_select_related"
on public.emergency_requests
for select
to authenticated
using (
  victim_id = auth.uid()
  or public.is_admin()
  or (
    request_status = 'approved'
    and public.is_active_responder()
  )
);

create policy "emergency_requests_insert_own"
on public.emergency_requests
for insert
to authenticated
with check (
  victim_id = auth.uid()
  and public.is_active_victim()
  and request_status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);

-- Emergency assignments ------------------------------------------------------

create policy "emergency_assignments_select_related"
on public.emergency_assignments
for select
to authenticated
using (
  responder_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.emergency_requests as request
    where request.request_id = emergency_assignments.request_id
      and request.victim_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- Table privileges
--
-- RLS controls which rows are visible. Column privileges provide a second
-- layer of protection so authenticated users cannot change email, role, or
-- account status through a direct Supabase request.
-- ----------------------------------------------------------------------------

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant insert (
  id,
  full_name,
  email,
  phone,
  address,
  role,
  rescue_team_category,
  defence_subcategory,
  account_status
) on table public.profiles to authenticated;
grant update (full_name, phone, address) on table public.profiles to authenticated;

revoke all on table public.emergency_requests from anon, authenticated;
grant select on table public.emergency_requests to authenticated;
grant insert (
  victim_id,
  emergency_type,
  description,
  location,
  affected_people,
  severity
) on table public.emergency_requests to authenticated;

revoke all on table public.emergency_assignments from anon, authenticated;
grant select on table public.emergency_assignments to authenticated;

-- Assignment creation and acceptance are intentionally reserved for the
-- server-side responder workflow introduced in a later chunk. Until then,
-- authenticated users can read related assignments but cannot write them.

-- Ask PostgREST to refresh its schema cache immediately after applying DDL.
notify pgrst, 'reload schema';
