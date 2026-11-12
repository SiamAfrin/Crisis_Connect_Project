-- ============================================================================
-- Crisis Connect
-- Migration: enforce one responder assignment per emergency request
--
-- Corrective migration for Chunk 5. It does not drop tables or delete data.
--
--   * Replaces the per-responder uniqueness on emergency_assignments with a
--     request-level uniqueness constraint, so a request can only ever have one
--     assignment.
--   * Locks the emergency_requests row inside both workflow functions and
--     rejects acceptance or assignment once the request has an assignment.
--   * Restricts victim contact details to the responder assigned to the
--     victim's request (administrators keep their existing access).
--   * Adds a read-only helper that lets responders learn which approved
--     requests are already assigned without exposing the assigned responder.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Pre-flight: refuse to continue if legacy duplicate assignments exist.
--
-- A unique constraint cannot be added while a request has more than one
-- assignment. This migration intentionally does not delete or merge those rows;
-- resolve them deliberately, then re-run this migration.
-- ----------------------------------------------------------------------------

do $$
declare
  duplicate_request_ids text;
begin
  select string_agg(duplicate.request_id::text, ', ' order by duplicate.request_id)
  into duplicate_request_ids
  from (
    select assignment.request_id
    from public.emergency_assignments as assignment
    group by assignment.request_id
    having count(*) > 1
  ) as duplicate;

  if duplicate_request_ids is not null then
    raise exception
      'Cannot enforce one assignment per request. Resolve duplicate assignments for request_id(s): %',
      duplicate_request_ids
      using errcode = '23505';
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- One assignment per request
-- ----------------------------------------------------------------------------

-- The pair constraint allowed one row per (request, responder), which still
-- allowed several responders on the same request. The request-level constraint
-- below is stricter and makes the pair constraint redundant.
alter table public.emergency_assignments
  drop constraint if exists emergency_assignments_unique_responder;

alter table public.emergency_assignments
  drop constraint if exists emergency_assignments_unique_request;

alter table public.emergency_assignments
  add constraint emergency_assignments_unique_request
  unique (request_id);

comment on constraint emergency_assignments_unique_request
  on public.emergency_assignments is
  'Ensures an emergency request has at most one assigned responder.';

-- ----------------------------------------------------------------------------
-- Accept an approved emergency request
--
-- Multiple responders may still accept before assignment. Once an assignment
-- exists, every other acceptance is rejected. The request row lock serializes
-- acceptance against assignment so the boundary is deterministic.
-- ----------------------------------------------------------------------------

create or replace function public.accept_emergency_request(
  target_request_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  target_status public.request_status;
  new_acceptance_id uuid;
begin
  if not public.is_active_responder() then
    raise exception 'Only active responders can accept emergency requests.'
      using errcode = '42501';
  end if;

  select request.request_status
  into target_status
  from public.emergency_requests as request
  where request.request_id = target_request_id
  for update;

  if not found then
    raise exception 'Emergency request not found.'
      using errcode = 'P0002';
  end if;

  if target_status <> 'approved' then
    raise exception 'Only approved emergency requests can be accepted.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.emergency_acceptances as acceptance
    where acceptance.request_id = target_request_id
      and acceptance.responder_id = caller_id
  ) then
    raise exception 'You have already accepted this emergency request.'
      using errcode = '23505';
  end if;

  if exists (
    select 1
    from public.emergency_assignments as assignment
    where assignment.request_id = target_request_id
  ) then
    raise exception 'This request already has an assigned responder.'
      using errcode = 'CC001';
  end if;

  insert into public.emergency_acceptances (
    request_id,
    responder_id,
    accepted_at
  )
  values (
    target_request_id,
    caller_id,
    now()
  )
  returning acceptance_id into new_acceptance_id;

  return new_acceptance_id;
end;
$$;

comment on function public.accept_emergency_request(uuid) is
  'Records that the signed-in active responder accepted an approved emergency request. Rejects acceptance once the request has an assigned responder.';

revoke all on function public.accept_emergency_request(uuid) from public;
grant execute on function public.accept_emergency_request(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Assign a responder who already accepted the request
--
-- The request row lock serializes concurrent assignments. The unique request
-- constraint remains the final guard if two transactions still race.
-- ----------------------------------------------------------------------------

create or replace function public.assign_emergency_responder(
  target_request_id uuid,
  target_responder_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_status public.request_status;
  responder_role public.user_role;
  responder_status public.account_status;
  new_assignment_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only active administrators can assign responders.'
      using errcode = '42501';
  end if;

  select request.request_status
  into target_status
  from public.emergency_requests as request
  where request.request_id = target_request_id
  for update;

  if not found then
    raise exception 'Emergency request not found.'
      using errcode = 'P0002';
  end if;

  if target_status <> 'approved' then
    raise exception 'Only approved emergency requests can be assigned.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.emergency_assignments as assignment
    where assignment.request_id = target_request_id
  ) then
    raise exception 'This request already has an assigned responder.'
      using errcode = 'CC001';
  end if;

  select profile.role, profile.account_status
  into responder_role, responder_status
  from public.profiles as profile
  where profile.id = target_responder_id;

  if not found then
    raise exception 'Responder account not found.'
      using errcode = 'P0002';
  end if;

  if responder_role not in ('volunteer', 'rescue_team_member')
    or responder_status <> 'active' then
    raise exception 'Only active responders can be assigned.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.emergency_acceptances as acceptance
    where acceptance.request_id = target_request_id
      and acceptance.responder_id = target_responder_id
  ) then
    raise exception 'Only responders who accepted this request can be assigned.'
      using errcode = '22023';
  end if;

  insert into public.emergency_assignments (
    request_id,
    responder_id,
    responder_role,
    assignment_status,
    assigned_by,
    assigned_at
  )
  values (
    target_request_id,
    target_responder_id,
    responder_role,
    'pending',
    auth.uid(),
    now()
  )
  returning assignment_id into new_assignment_id;

  return new_assignment_id;
end;
$$;

comment on function public.assign_emergency_responder(uuid, uuid) is
  'Assigns an active responder who accepted the request. Callable only by active administrators. Rejects a request that already has an assigned responder.';

revoke all on function public.assign_emergency_responder(uuid, uuid) from public;
grant execute on function public.assign_emergency_responder(uuid, uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Victim contact is visible only to the assigned responder
--
-- Replaces the Chunk 5 policy that exposed victim contact to every responder
-- who accepted. Administrators keep access through their existing policy.
-- ----------------------------------------------------------------------------

drop policy if exists "profiles_select_request_victim_for_accepted_responders"
  on public.profiles;

create policy "profiles_select_request_victim_for_assigned_responders"
on public.profiles
for select
to authenticated
using (
  public.is_active_responder()
  and exists (
    select 1
    from public.emergency_assignments as assignment
    join public.emergency_requests as request
      on request.request_id = assignment.request_id
    where request.victim_id = profiles.id
      and assignment.responder_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- Assigned-request lookup for responder dashboards
--
-- Returns only request ids, never responder identities, so responders can hide
-- the accept action for requests another responder already owns.
-- ----------------------------------------------------------------------------

create or replace function public.list_assigned_request_ids()
returns setof uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (public.is_active_responder() or public.is_admin()) then
    raise exception 'Only active responders and administrators can list assigned requests.'
      using errcode = '42501';
  end if;

  return query
    select assignment.request_id
    from public.emergency_assignments as assignment
    join public.emergency_requests as request
      on request.request_id = assignment.request_id
    where request.request_status = 'approved';
end;
$$;

comment on function public.list_assigned_request_ids() is
  'Returns the ids of approved requests that already have an assigned responder. Does not expose responder identities.';

revoke all on function public.list_assigned_request_ids() from public;
grant execute on function public.list_assigned_request_ids() to authenticated;

-- Ask PostgREST to refresh its schema cache immediately after applying DDL.
notify pgrst, 'reload schema';
