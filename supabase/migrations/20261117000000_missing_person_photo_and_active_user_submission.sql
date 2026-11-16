-- ============================================================================
-- Crisis Connect
-- Migration: missing person photo support and active-user submission
-- Chunk: 9 correction (PB-13)
--
-- This migration is additive. It does not modify or rerun
-- 20261116000000_missing_person_management.sql, which has already been applied.
--
-- It:
--   1. Adds public.is_active_account(), a helper for "any active account".
--   2. Adds a nullable missing_persons.photo_path reference.
--   3. Replaces the victim-only insert policy with an active-account policy.
--   4. Grants insert on the new photo_path column.
--   5. Widens update_missing_person_status to every active reporter role.
--   6. Creates a private Storage bucket and its object policies.
--
-- PB-13: any active registered user can report a missing person, with an
--        optional photograph. Photographs are stored privately and are only
--        readable through short-lived signed URLs.
-- PB-14 and PB-15 are unchanged.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Active account helper
-- ----------------------------------------------------------------------------

create or replace function public.is_active_account()
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
      and p.account_status = 'active'
  )
$$;

comment on function public.is_active_account() is
  'True for any signed-in profile whose account_status is active.';

revoke all on function public.is_active_account() from public;
grant execute on function public.is_active_account() to authenticated;

-- ----------------------------------------------------------------------------
-- 2. Optional photo column
-- ----------------------------------------------------------------------------

alter table public.missing_persons
  add column if not exists photo_path text;

alter table public.missing_persons
  drop constraint if exists missing_persons_photo_path_check;

alter table public.missing_persons
  add constraint missing_persons_photo_path_check
  check (photo_path is null or char_length(photo_path) between 1 and 500);

comment on column public.missing_persons.photo_path is
  'Private Storage object path for an optional photograph. NULL when no photo was uploaded.';

comment on table public.missing_persons is
  'Missing person reports submitted by active registered users and managed by reporters and administrators.';

-- ----------------------------------------------------------------------------
-- 3. Active-account insert policy
--
-- The optional photo is still optional, but a report may only reference an
-- object in the reporter's own Storage folder:
--   <auth.uid()>/<random-name>.<extension>
-- This prevents a report from attaching another user's photo.
-- ----------------------------------------------------------------------------

drop policy if exists "missing_persons_insert_own" on public.missing_persons;

create policy "missing_persons_insert_own"
on public.missing_persons
for insert
to authenticated
with check (
  reporter_id = auth.uid()
  and public.is_active_account()
  and status = 'missing'
  and resolved_at is null
  and resolved_by is null
  and (
    photo_path is null
    or photo_path like auth.uid()::text || '/%'
  )
);

-- ----------------------------------------------------------------------------
-- 4. Column privileges
-- ----------------------------------------------------------------------------

-- Column grants are additive, so the existing report-detail grants remain in
-- place and authenticated users gain insert access to photo_path only.
grant insert (photo_path) on table public.missing_persons to authenticated;

-- ----------------------------------------------------------------------------
-- 5. Status updates for every active reporter role
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

  -- The reporter may be any active role. Administrators can update any report.
  if not caller_is_admin then
    if not public.is_active_account() or report_reporter_id <> caller_id then
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
  'Lets an active reporter or an active administrator mark a report found; only administrators can reopen a found report.';

revoke all on function public.update_missing_person_status(
  uuid,
  public.missing_person_status
) from public;
grant execute on function public.update_missing_person_status(
  uuid,
  public.missing_person_status
) to authenticated;

-- ----------------------------------------------------------------------------
-- 6. Private photo storage
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'missing-person-photos',
  'missing-person-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Uploads must live under the uploader's own folder:
--   <auth.uid()>/<random-name>.<extension>
drop policy if exists "missing_person_photos_insert_own" on storage.objects;
create policy "missing_person_photos_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'missing-person-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_active_account()
);

-- Any active user who can read a report can request a short-lived signed URL
-- for its photo. The bucket itself stays private.
drop policy if exists "missing_person_photos_select_active_users" on storage.objects;
create policy "missing_person_photos_select_active_users"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'missing-person-photos'
  and public.is_active_account()
);

-- The uploader can remove their own object. The Server Action uses this to
-- clean up a file when the report insert fails.
drop policy if exists "missing_person_photos_delete_own" on storage.objects;
create policy "missing_person_photos_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'missing-person-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_active_account()
);

-- Administrators can remove any missing-person photo.
drop policy if exists "missing_person_photos_delete_admin" on storage.objects;
create policy "missing_person_photos_delete_admin"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'missing-person-photos'
  and public.is_admin()
);

-- Ask PostgREST to refresh its schema cache immediately after applying DDL.
notify pgrst, 'reload schema';
