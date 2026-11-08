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

## 2. Apply the initial migration

The migration is:

```text
supabase/migrations/20261107000000_initial_schema.sql
```

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

Chunk 2 uses email/password authentication without email verification, OTP,
CAPTCHA, or MFA. In the Supabase dashboard, set:

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
  and tablename in ('profiles', 'emergency_requests', 'emergency_assignments')
order by tablename;

select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select indexname, tablename
from pg_indexes
where schemaname = 'public'
  and tablename in ('profiles', 'emergency_requests', 'emergency_assignments')
order by tablename, indexname;
```

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

### `emergency_requests`

- UUID `request_id`.
- Foreign keys to the victim profile and reviewing administrator.
- Request statuses: `pending`, `approved`, `rejected`.
- Review records require both `reviewed_by` and `reviewed_at`.
- Severity values: `low`, `medium`, `high`, `critical`.

### `emergency_assignments`

- UUID `assignment_id`.
- Foreign keys to the request, responder, and assigning profile.
- Unique `(request_id, responder_id)` constraint prevents duplicate
  assignments.
- Responder roles are limited to `volunteer` and `rescue_team_member`.
- Assignment statuses: `pending`, `accepted`, `declined`, `cancelled`,
  `completed`.

## 6. RLS notes

- `profiles`: users read their own profile; active administrators read all
  profiles. Users insert only their own profile and cannot self-register as
  administrators or set an unsafe initial approval state. Column-level grants
  restrict profile updates to `full_name`, `phone`, and `address`.
- `emergency_requests`: victims read their own requests, active responders read
  approved requests, and administrators read all requests. Only active victims
  can insert their own pending requests.
- `emergency_assignments`: responders read their own assignments, victims read
  assignments for their requests, and administrators read all assignments.
  Assignment writes are reserved for the responder workflow chunk.

## 7. Chunk 2 profile lifecycle

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

## 8. Operational note

No service-role key is configured for this project. The application therefore
cannot delete Auth users or bypass RLS from server code. If a test or abandoned
account must be removed, use the Supabase dashboard or the Admin API with a
service-role key in a trusted server environment.
