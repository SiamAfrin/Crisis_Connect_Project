-- ============================================================================
-- Crisis Connect
-- Migration: administrator emergency request review
-- Chunk: 4
--
-- Adds one auditable write path for administrators to approve or reject a
-- pending emergency request. The function is SECURITY DEFINER and re-checks
-- the caller's role, so authenticated users still have no direct update grant
-- on emergency_requests.
-- ============================================================================

create or replace function public.review_emergency_request(
  target_request_id uuid,
  decision public.request_status
)
returns public.request_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status public.request_status;
begin
  if not public.is_admin() then
    raise exception 'Only active administrators can review emergency requests.'
      using errcode = '42501';
  end if;

  if decision not in ('approved', 'rejected') then
    raise exception 'A review decision must approve or reject the request.'
      using errcode = '22023';
  end if;

  select r.request_status
  into current_status
  from public.emergency_requests as r
  where r.request_id = target_request_id
  for update;

  if not found then
    raise exception 'Emergency request not found.'
      using errcode = 'P0002';
  end if;

  if current_status <> 'pending' then
    raise exception 'Only pending emergency requests can be reviewed.'
      using errcode = '22023';
  end if;

  update public.emergency_requests
  set
    request_status = decision,
    reviewed_by = auth.uid(),
    reviewed_at = now()
  where request_id = target_request_id;

  return decision;
end;
$$;

comment on function public.review_emergency_request(uuid, public.request_status) is
  'Approves or rejects a pending emergency request. Callable only by active administrators.';

revoke all on function public.review_emergency_request(uuid, public.request_status) from public;
grant execute on function public.review_emergency_request(uuid, public.request_status) to authenticated;

-- Ask PostgREST to refresh its schema cache immediately after applying DDL.
notify pgrst, 'reload schema';
