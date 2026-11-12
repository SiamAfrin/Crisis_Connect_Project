# Supabase setup

## 1. Environment

The application reads the public project configuration from `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is accepted as a fallback for older Supabase
projects. The service role/secret key is not used by the application. Keep it
server-only if it is ever added for administrative maintenance.

## 2. Apply the migrations

Apply the migrations in filename order:

```text
supabase/migrations/20261107000000_initial_schema.sql
supabase/migrations/20261108000000_admin_responder_approval.sql
supabase/migrations/20261109000000_admin_request_review.sql
supabase/migrations/20261110000000_responder_acceptance_assignment.sql
supabase/migrations/20261112000000_single_responder_assignment.sql
```

The first creates the schema, policies, and grants. The second adds the
administrator responder-approval function. The third adds the administrator
emergency-request review function. The fourth adds responder acceptances, the
victim-contact policy for accepted responders, and the acceptance and assignment
functions. The fifth is a corrective migration that limits each request to one
assigned responder, adds row locking to the acceptance and assignment functions,
and restricts victim contact to the assigned responder.

### Option A — Supabase Dashboard

1. Open the Supabase project.
2. Open **SQL Editor**.
3. Paste the full contents of the migration file.
4. Run the query.
5. Confirm the output reports success.

The migration ends with `notify pgrst, 'reload schema';` so PostgREST should
pick up the new tables immediately.

### Option B — Supabase CLI

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The CLI may ask for database credentials. Do not put database passwords in
client-side environment variables.

## 3. Authentication settings

The application uses email/password authentication without email verification,
OTP, CAPTCHA, or MFA. In the Supabase dashboard, set:

- **Authentication → Providers → Email → Confirm email:** disabled.
- Keep email/password enabled.

If email confirmation is left enabled, registration creates an Auth user but
returns an error instead of a session, so the application profile cannot be
created. The sign-up metadata is retained and the profile is repaired on a later
successful login.

## 4. Verify the database

Run these in the SQL Editor:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'emergency_requests',
    'emergency_assignments',
    'emergency_acceptances'
  )
order by tablename;

select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select indexname, tablename
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'profiles',
    'emergency_requests',
    'emergency_assignments',
    'emergency_acceptances'
  )
order by tablename, indexname;

select proname, prosecdef
from pg_proc
where proname in (
  'review_responder_account',
  'review_emergency_request',
  'accept_emergency_request',
  'assign_emergency_responder',
  'list_assigned_request_ids'
)
order by proname;
```

The function result should return five rows with `prosecdef = true`, confirming
that the administrator approval, request review, request acceptance, responder
assignment, and assigned-request lookup functions exist and are
`SECURITY DEFINER`.

Then call the application health route:

```text
GET /api/health/supabase
```

Expected result after the migration:

```json
{
  "status": "ok",
  "auth": "reachable",
  "database": "ready",
  "checkedAt": "..."
}
```

The health check treats PostgREST error `42501` (`permission denied for table
profiles`) as evidence that the table exists and that anonymous access is
intentionally blocked. A missing table still reports `migration_required`.

## 5. Schema summary

### `profiles`

- Primary key `id` references `auth.users(id)` with `on delete cascade`.
- Four roles only: `victim`, `volunteer`, `rescue_team_member`, `administrator`.
- Rescue categories: `government`, `hospital`, `defence`, `ngo`.
- Defence subcategories: `police`, `fire_service`.
- Account statuses: `pending`, `active`, `rejected`.
- Rescue fields are `NULL` for victims, volunteers, and administrators.
- Non-defence rescue categories must have a `NULL` defence subcategory.

### `review_responder_account(target_profile_id, decision)`

- `SECURITY DEFINER` function that approves or rejects a pending volunteer or
  rescue team profile.
- Requires an active administrator caller and a target role of `volunteer` or
  `rescue_team_member`.
- Accepts only `active` or `rejected` as the decision and only reviews profiles
  whose current status is `pending`.
- Execute is granted to `authenticated`; the function itself enforces the
  administrator check, and authenticated users have no direct
  `account_status` update grant.

### `review_emergency_request(target_request_id, decision)`

- `SECURITY DEFINER` function that approves or rejects a pending emergency
  request.
- Requires an active administrator caller and a request whose current status is
  `pending`.
- Accepts only `approved` or `rejected` as the decision, records
  `reviewed_by = auth.uid()` and `reviewed_at = now()`, and returns the new
  status.
- Execute is granted to `authenticated`; the function itself enforces the
  administrator check, and authenticated users have no direct update grant on
  `emergency_requests`.

### `accept_emergency_request(target_request_id)`

- `SECURITY DEFINER` function that records that the signed-in active responder
  accepted an approved request.
- Derives the responder from `auth.uid()`; the client never supplies a responder
  id.
- Locks the request row, then requires `public.is_active_responder()`, an
  existing request whose current status is `approved`, no previous acceptance by
  the same responder, and no existing assignment for the request.
- Multiple different responders may accept the same request before an
  administrator assigns it. Once an assignment exists, acceptance is rejected.
- Returns the new `acceptance_id` and raises `42501` for non-responders, `P0002`
  for missing requests, `22023` for non-approved requests, `23505` for duplicate
  acceptance, and `CC001` when the request already has an assigned responder.
- Execute is granted to `authenticated`; authenticated users have no direct
  insert, update, or delete grant on `emergency_acceptances`.

### `assign_emergency_responder(target_request_id, target_responder_id)`

- `SECURITY DEFINER` function that assigns a responder who already accepted the
  request.
- Locks the request row, then requires `public.is_admin()`, an existing approved
  request with no existing assignment, an active `volunteer` or
  `rescue_team_member` target, and a matching acceptance row.
- Records `assigned_by = auth.uid()` and `assigned_at = now()`, starts the
  assignment at `pending`, and returns the new `assignment_id`.
- Raises `42501` for non-administrators, `P0002` for missing requests or
  responders, `22023` for non-approved requests or ineligible responders, and
  `CC001` when the request already has an assigned responder. A concurrent
  unique violation also surfaces as `23505`.
- Execute is granted to `authenticated`; authenticated users have no direct
  insert, update, or delete grant on `emergency_assignments`.

### `list_assigned_request_ids()`

- `SECURITY DEFINER` function that returns the ids of approved requests that
  already have an assigned responder.
- Returns only request ids, never responder identities, so responder dashboards
  can hide the accept action without exposing who owns the request.
- Raises `42501` for callers who are not active responders or administrators.

### `emergency_requests`

- UUID `request_id`.
- Foreign keys to the victim profile and reviewing administrator.
- Request statuses: `pending`, `approved`, `rejected`.
- Review records require both `reviewed_by` and `reviewed_at`.
- Severity values: `low`, `medium`, `high`, `critical`.

### `emergency_assignments`

- UUID `assignment_id`.
- Foreign keys to the request, responder, and assigning profile.
- Unique `request_id` constraint ensures a request has at most one assigned
  responder.
- Responder roles are limited to `volunteer` and `rescue_team_member`.
- Assignment statuses: `pending`, `accepted`, `declined`, `cancelled`,
  `completed`.
- New assignments are created only through `assign_emergency_responder`, which
  records the assigning administrator and assignment time.

### `emergency_acceptances`

- UUID `acceptance_id`.
- Foreign keys to the request and the accepting responder profile.
- Unique `(request_id, responder_id)` constraint prevents duplicate acceptance.
- `accepted_at` records when the responder accepted the approved request.
- Indexed by `request_id` and `responder_id`.
- Responders read only their own acceptances; administrators read all of them.
  There is no victim access to acceptance rows.

## 6. RLS notes

- `profiles`: users read their own profile; active administrators read all
  profiles. Active responders can also read the contact details of victims whose
  request is assigned to them, so victim contact information becomes available
  only after assignment. Users insert only their own profile and cannot
  self-register as administrators or set an unsafe initial approval state.
  Column-level grants restrict profile updates to `full_name`, `phone`, and
  `address`.
- `profiles.account_status`: authenticated users have no direct update grant.
  Administrators approve or reject pending volunteer and rescue team accounts
  through `review_responder_account`, which re-checks the caller with
  `public.is_admin()` and rejects victim or administrator targets.
- `emergency_requests`: victims read their own requests, active responders read
  approved requests, and administrators read all requests. Only active victims
  can insert their own pending requests. The insert column grant covers only the
  request details; status and review columns remain server-controlled, and
  authenticated users have no update or delete grant. Administrators approve or
  reject pending requests through `review_emergency_request`, which re-checks the
  caller with `public.is_admin()` and records the reviewer and review time.
- `emergency_assignments`: responders read their own assignments, victims read
  assignments for their requests, and administrators read all assignments.
  Assignment creation is reserved for `assign_emergency_responder`, which
  re-checks the administrator role, the approved request, the responder's active
  status, the responder's acceptance, and the absence of an existing assignment.
- `emergency_acceptances`: responders read only their own acceptance rows and
  administrators read all of them. Acceptance creation is reserved for
  `accept_emergency_request`, which derives the responder from `auth.uid()` and
  re-checks active responder status and request approval. Authenticated users
  have no direct insert, update, or delete grant.

## 7. Profile lifecycle

There is no database trigger that creates profiles. The application owns profile
creation so the deployed schema does not need an extra migration:

1. Registration calls Supabase Auth `signUp()` with the profile seed in
   `user_metadata`.
2. With email confirmation disabled, Supabase returns a session immediately.
3. The authenticated client inserts the matching `profiles` row. The database
   requires victims to be `active` and responders to be `pending`.
4. If the profile insert fails, the application signs the browser out and
   reports an error. The Auth user remains, and the seed is still in metadata.
5. On login, the application reads the profile. If it is missing and the
   metadata contains a valid seed, it recreates the profile. The role is
   validated and the status is derived again; administrator roles are rejected
   by both the seed schema and the RLS insert policy.

This keeps profile creation recoverable without a service-role key or an
additional migration.

## 8. Responder approval lifecycle

- Only active administrators can open `/admin/responders` or invoke the review
  action.
- Pending volunteer and rescue team profiles appear in the queue, oldest first.
- The review card shows role, contact details, rescue team category, and Defence
  subcategory.
- Approving sets `account_status` to `active`; rejecting sets it to `rejected`.
- Only `pending` volunteer or rescue team profiles can be reviewed. Victim and
  administrator profiles are excluded.
- The Server Action re-checks the administrator role, then calls
  `review_responder_account`.
- The function is `SECURITY DEFINER` with `search_path = ''` and raises `42501`
  for non-administrators, `P0002` for missing profiles, and `22023` for
  non-pending profiles or invalid decisions.
- No service-role key is used.

## 9. Request lifecycle

- Only active victim profiles can insert emergency requests.
- The Server Action derives `victim_id` from the session and never accepts it
  from the form.
- `request_status` is not part of the authenticated insert column grant, so the
  database default `pending` applies and a client cannot approve its own
  request.
- `reviewed_by` and `reviewed_at` are not insertable by authenticated users.
- Victims read their own requests. The victim pages also filter by `victim_id`
  as a second, request-scoped guard.
- Authenticated users have no update or delete grant on `emergency_requests`, so
  submitted details and review fields remain server-controlled.
- Only active administrators can open `/admin/requests` or invoke the review
  action. Pending requests are listed oldest first with victim contact details.
- Approving sets `request_status` to `approved`; rejecting sets it to `rejected`.
  The function records `reviewed_by` and `reviewed_at`.
- Only `pending` requests can be reviewed. The function raises `42501` for
  non-administrators, `P0002` for missing requests, and `22023` for invalid
  decisions or already-reviewed requests.
- Active responders can read approved requests through the select policy. Their
  dashboards list approved requests and offer the accept action.
- No service-role key is used.

## 10. Acceptance and assignment lifecycle

- Only active volunteers and rescue team members can open their responder
  dashboards or call the acceptance action. Pending and rejected responders are
  redirected to the account-status page.
- The Server Action derives the responder from the session, validates the
  request id, then calls `accept_emergency_request`. The function repeats the
  active responder check and derives the responder from `auth.uid()`.
- Only approved requests can be accepted. A unique `(request_id, responder_id)`
  constraint and an explicit existence check reject duplicate acceptance.
- Multiple different responders may accept the same request before assignment.
- Accepting does not create an assignment. It only makes the responder eligible
  for administrator assignment.
- Once an administrator assigns a responder, `accept_emergency_request` rejects
  every other acceptance for that request.
- Only the assigned responder gains read access to that victim's contact profile
  through the `profiles` select policy. The policy requires active responder
  status and a matching assignment row; administrators retain their existing
  access.
- Only active administrators can open `/admin/assignments` or call the
  assignment action. The queue lists approved requests that have at least one
  acceptance, with responder role, rescue category, Defence subcategory,
  acceptance time, and assignment status.
- `assign_emergency_responder` requires an approved request with no existing
  assignment, an active volunteer/rescue target, and a matching acceptance row.
  It records `assigned_by = auth.uid()` and `assigned_at = now()`.
- A unique `request_id` constraint and a request-row lock enforce one assignment
  per request, including concurrent administrator requests.
- Responders see only their own assignments. RLS and the request-scoped
  `responder_id` filter both enforce this. Responder dashboards call
  `list_assigned_request_ids` to hide the accept action for requests another
  responder already owns, without exposing that responder's identity.
- No service-role key is used.

## 11. Operational note

No service-role key is configured for this project. The application therefore
cannot delete Auth users or bypass RLS from server code. If a test or abandoned
account must be removed, use the Supabase dashboard or the Admin API with a
service-role key in a trusted server environment.
