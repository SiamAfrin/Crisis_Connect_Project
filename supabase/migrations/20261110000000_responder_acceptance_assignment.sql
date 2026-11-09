-- ============================================================================
-- Crisis Connect
-- Migration: responder acceptance and administrator assignment
-- Chunk: 5
--
-- Adds one table that records a responder accepting an approved request, and
-- two SECURITY DEFINER functions:
--
--   * accept_emergency_request  - an active responder accepts an approved
--                                 request. The responder id always comes from
--                                 the session, never from the client.
--   * assign_emergency_responder - an active administrator assigns a responder
--                                 who has already accepted the request. The
--                                 assigning administrator always comes from the
--                                 session.
--
-- Authenticated users receive no direct insert/update/delete grant on either
-- table, so acceptance and assignment can only happen through these functions.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Responder acceptances
-- ----------------------------------------------------------------------------

create table public.emergency_acceptances (
  acceptance_id uuid primary key default gen_random_uuid(),
  request_id uuid not null
    references public.emergency_requests (request_id) on delete cascade,
  responder_id uuid not null
    references public.profiles (id) on delete restrict,
  accepted_at timestamptz not null default now(),

  -- The same responder cannot accept the same request twice.
  constraint emergency_acceptances_unique_responder
    unique (request_id, responder_id)
);

comment on table public.emergency_acceptances is
  'Records that an active responder accepted an approved emergency request.';
comment on constraint emergency_acceptances_unique_responder
  on public.emergency_acceptances is
  'Prevents a responder from accepting the same request more than once.';

create index emergency_acceptances_request_idx
  on public.emergency_acceptances (request_id);

create index emergency_acceptances_responder_idx
  on public.emergency_acceptances (responder_id);

alter table public.emergency_acceptances enable row level security;

-- Responders read their own acceptances; administrators read all of them.
-- Victims do not need acceptance rows, and nobody can read another responder's
-- acceptance through the API.
create policy "emergency_acceptances_select_own_or_admin"
on public.emergency_acceptances
for select
to authenticated
using (
  responder_id = auth.uid()
  or public.is_admin()
);

revoke all on table public.emergency_acceptances from anon, authenticated;
grant select on table public.emergency_acceptances to authenticated;

-- Responders who accepted a request may read that victim's contact details.
-- This keeps victim contact information available only after a responder has
-- committed to the request, while administrators already read all profiles.
create policy "profiles_select_request_victim_for_accepted_responders"
on public.profiles
for select
to authenticated
using (
  public.is_active_responder()
  and exists (
    select 1
    from public.emergency_requests as request
    join public.emergency_acceptances as acceptance
      on acceptance.request_id = request.request_id
    where request.victim_id = profiles.id
      and acceptance.responder_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- Accept an approved emergency request
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
  where request.request_id = target_request_id;

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
  'Records that the signed-in active responder accepted an approved emergency request.';

revoke all on function public.accept_emergency_request(uuid) from public;
grant execute on function public.accept_emergency_request(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Assign a responder who already accepted the request
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
  where request.request_id = target_request_id;

  if not found then
    raise exception 'Emergency request not found.'
      using errcode = 'P0002';
  end if;

  if target_status <> 'approved' then
    raise exception 'Only approved emergency requests can be assigned.'
      using errcode = '22023';
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

  if exists (
    select 1
    from public.emergency_assignments as assignment
    where assignment.request_id = target_request_id
      and assignment.responder_id = target_responder_id
  ) then
    raise exception 'This responder is already assigned to the request.'
      using errcode = '23505';
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
  'Assigns an active responder who accepted the request. Callable only by active administrators.';

revoke all on function public.assign_emergency_responder(uuid, uuid) from public;
grant execute on function public.assign_emergency_responder(uuid, uuid) to authenticated;

-- Ask PostgREST to refresh its schema cache immediately after applying DDL.
notify pgrst, 'reload schema';
