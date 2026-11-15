-- ============================================================================
-- Crisis Connect
-- Migration: mission status updates for assigned responders
-- Chunk: 7 (PB-11)
--
-- Adds one SECURITY DEFINER function that lets the responder assigned to an
-- emergency request move that mission through the supported statuses:
--
--   pending  -> accepted   (the responder starts the mission)
--   accepted -> completed  (the responder finishes the mission)
--
-- The assignment row is the mission record. Authenticated users still have no
-- direct update grant on emergency_assignments, so this function is the only
-- write path for mission status changes.
-- ============================================================================

create or replace function public.update_mission_status(
  target_assignment_id uuid,
  new_status public.assignment_status
)
returns public.assignment_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  current_status public.assignment_status;
  assigned_responder_id uuid;
  current_accepted_at timestamptz;
begin
  if not public.is_active_responder() then
    raise exception 'Only active responders can update mission status.'
      using errcode = '42501';
  end if;

  -- Lock the assignment row so two status updates cannot interleave.
  select assignment.assignment_status,
         assignment.responder_id,
         assignment.accepted_at
  into current_status, assigned_responder_id, current_accepted_at
  from public.emergency_assignments as assignment
  where assignment.assignment_id = target_assignment_id
  for update;

  if not found then
    raise exception 'Mission assignment not found.'
      using errcode = 'P0002';
  end if;

  -- The responder id always comes from the session. A responder can only
  -- update the mission assigned to them.
  if assigned_responder_id <> caller_id then
    raise exception 'Only the assigned responder can update this mission.'
      using errcode = '42501';
  end if;

  if new_status not in ('accepted', 'completed') then
    raise exception 'Mission status can only be accepted or completed.'
      using errcode = '22023';
  end if;

  if current_status = 'completed' then
    raise exception 'Completed missions cannot be changed.'
      using errcode = '22023';
  end if;

  if new_status = current_status then
    raise exception 'This mission already has that status.'
      using errcode = '22023';
  end if;

  if new_status = 'accepted' and current_status <> 'pending' then
    raise exception 'Only pending missions can be accepted.'
      using errcode = '22023';
  end if;

  if new_status = 'completed' and current_status <> 'accepted' then
    raise exception 'A mission must be accepted before it can be completed.'
      using errcode = '22023';
  end if;

  -- The table constraint requires accepted_at for accepted and completed
  -- missions. Keep the original acceptance time when the mission is completed.
  update public.emergency_assignments
  set assignment_status = new_status,
      accepted_at = coalesce(current_accepted_at, now())
  where assignment_id = target_assignment_id;

  return new_status;
end;
$$;

comment on function public.update_mission_status(uuid, public.assignment_status) is
  'Lets the assigned active responder move a mission from pending to accepted and from accepted to completed.';

revoke all on function public.update_mission_status(uuid, public.assignment_status)
  from public;
grant execute on function public.update_mission_status(uuid, public.assignment_status)
  to authenticated;

-- Ask PostgREST to refresh its schema cache immediately after applying DDL.
notify pgrst, 'reload schema';
