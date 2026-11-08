-- ============================================================================
-- Crisis Connect
-- Migration: administrator responder approval
-- Chunk: 3
--
-- Adds one auditable write path for administrators to approve or reject
-- volunteer and rescue team registrations. The function is SECURITY DEFINER
-- and re-checks the caller's role, so authenticated users still have no direct
-- update grant on profiles.account_status.
-- ============================================================================

create or replace function public.review_responder_account(
  target_profile_id uuid,
  decision public.account_status
)
returns public.account_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role public.user_role;
  current_status public.account_status;
begin
  if not public.is_admin() then
    raise exception 'Only active administrators can review responder accounts.'
      using errcode = '42501';
  end if;

  if decision not in ('active', 'rejected') then
    raise exception 'A review decision must approve or reject the account.'
      using errcode = '22023';
  end if;

  select p.role, p.account_status
  into target_role, current_status
  from public.profiles as p
  where p.id = target_profile_id
  for update;

  if not found then
    raise exception 'Responder account not found.'
      using errcode = 'P0002';
  end if;

  if target_role not in ('volunteer', 'rescue_team_member') then
    raise exception 'Only volunteer and rescue team registrations can be reviewed.'
      using errcode = '42501';
  end if;

  if current_status <> 'pending' then
    raise exception 'Only pending registrations can be reviewed.'
      using errcode = '22023';
  end if;

  update public.profiles
  set account_status = decision
  where id = target_profile_id;

  return decision;
end;
$$;

comment on function public.review_responder_account(uuid, public.account_status) is
  'Approves or rejects a pending volunteer or rescue team registration. Callable only by active administrators.';

revoke all on function public.review_responder_account(uuid, public.account_status) from public;
grant execute on function public.review_responder_account(uuid, public.account_status) to authenticated;

-- Ask PostgREST to refresh its schema cache immediately after applying DDL.
notify pgrst, 'reload schema';
