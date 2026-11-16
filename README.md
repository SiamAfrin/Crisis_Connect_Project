# Crisis Connect

Crisis Connect is a centralized emergency response and coordination system for
victims, volunteers, rescue team members, and administrators. Victims submit
emergency requests, administrators review them, verified responders accept
approved requests, and administrators assign one accepted responder to each
request. The assigned responder then accepts and completes the mission, and
administrators see the updated mission status. Victims can follow the current
status of their own requests from review through responder assignment and
mission completion. Any active registered user can report a missing person with an
optional photograph, and active authenticated users can search those reports and
see whether a person has been found.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase Auth and Supabase PostgreSQL
- `@supabase/ssr` for cookie-aware browser and server clients
- Zod for server-side validation

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example` and add the Supabase project URL and
   publishable/anon key:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
   ```

   Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Never add a `NEXT_PUBLIC_`
   prefix to it.

3. Apply all migrations to the Supabase project, in filename order. See
   [`supabase/README.md`](supabase/README.md).

4. In the Supabase dashboard, disable **Authentication → Providers → Email →
   Confirm email**. Crisis Connect uses email/password authentication without
   email verification, OTP, CAPTCHA, or MFA.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000). Use the health route to
   verify the connection:

   ```bash
   curl http://localhost:3000/api/health/supabase
   ```

## Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Landing page |
| `/register` | Public | Victim, volunteer, and rescue team registration |
| `/login` | Public | Email/password login |
| `/account-status` | Authenticated | Pending, active, or rejected account status |
| `/profile` | Authenticated | Edit full name, phone, and address |
| `/victim/dashboard` | Active victim | Victim dashboard with request and mission status |
| `/victim/requests` | Active victim | List and track the victim's own requests |
| `/victim/requests/new` | Active victim | Submit an emergency request |
| `/victim/requests/[requestId]` | Active victim | Request details and current status |
| `/missing-persons` | Active authenticated users | Search and review missing person reports |
| `/missing-persons/new` | Active authenticated users | Report a missing person, with an optional photograph |
| `/missing-persons/[reportId]` | Active authenticated users | Missing person details and status |
| `/volunteer/dashboard` | Active volunteer | Accept approved requests, update mission status, and view own assignments |
| `/rescue/dashboard` | Active rescue team member | Accept approved requests, update mission status, and view own assignments |
| `/admin/dashboard` | Active administrator | Administrator dashboard with approval, request, assignment, and missing person summaries |
| `/admin/responders` | Active administrator | Review and approve or reject responder registrations |
| `/admin/requests` | Active administrator | Review and approve or reject emergency requests |
| `/admin/assignments` | Active administrator | Assign accepted responders to approved requests |
| `/api/health/supabase` | Public | Supabase Auth and schema health check |

## Authentication and account behavior

- Registration collects full name, email, password, confirm password, phone,
  address, and role.
- Public roles are **Victim**, **Volunteer**, and **Rescue Team Member**.
  Administrator registration is not available publicly.
- Rescue team members must choose **Government**, **Hospital**, **Defence**, or
  **NGO**. Defence requires **Police** or **Fire Service**. Other categories and
  non-rescue roles store `NULL` in the rescue-specific columns.
- Victims start **Active**. Volunteers and rescue team members start
  **Pending**.
- Pending and rejected responders can sign in, view their account status, and
  edit their profile, but cannot access responder dashboards.
- Logout calls Supabase `signOut()` immediately with no confirmation step.
- Users can edit only **Full Name**, **Phone**, and **Address**. Email, role,
  rescue category, and account status are read-only.

## Administrator approval behavior

- Only **active administrator** accounts can open the approval queue or call the
  review action.
- Volunteers and rescue team members start **Pending** and appear in
  `/admin/responders`, oldest first.
- Each review card shows the account's role, email, phone, address, registration
  time, **Rescue team category**, and **Defence subcategory** when applicable.
- **Approve** sets the account to **Active**; **Reject** sets it to **Rejected**.
  Approved responders can then reach their role dashboard, while rejected
  responders remain blocked.
- Only pending volunteer and rescue team registrations can be reviewed. Victim
  and administrator profiles are outside the approval queue.
- Decisions are applied by the `review_responder_account` `SECURITY DEFINER`
  function, which re-checks the administrator role and the target role.
  Authenticated users still have no direct update grant on `account_status`.
- No seeded or fake accounts are created for review.

## Emergency request behavior

- Only **active victim** accounts can submit emergency requests.
- A request collects emergency type, location, description, severity, and the
  number of affected people.
- The server always sets the owner to the signed-in victim and starts the
  request in **Pending**. The form cannot set the owner, review fields, or
  status.
- Victims can list and open only their own requests. RLS and the explicit
  `victim_id` filter both enforce ownership.
- Requests are read-only after submission. There is no update or delete grant
  for victims, so review decisions remain under administrator control.
- The victim dashboard shows the five most recent submissions; the full list is
  available at `/victim/requests`.
- Only **active administrators** can open `/admin/requests` or call the review
  action. Pending requests appear oldest first with the victim's contact details.
- **Approve** sets the request to **Approved**; **Reject** sets it to
  **Rejected**. The reviewing administrator and review time are recorded.
- Decisions are applied by the `review_emergency_request` `SECURITY DEFINER`
  function, which re-checks the administrator role and only reviews pending
  requests. Authenticated users have no direct update grant on
  `emergency_requests`.
- Only approved requests become readable by active volunteers and rescue team
  members.

## Responder acceptance and assignment behavior

- Only **active volunteer and rescue team member** accounts can accept approved
  requests. Pending and rejected responders cannot reach the dashboards, and the
  acceptance function re-checks active responder status.
- Acceptance records the responder from the session, the request, and the
  acceptance time in `emergency_acceptances`. The client never supplies the
  responder id.
- A responder can accept a request only once. Duplicate acceptance is blocked by
  a unique constraint and reported as an error.
- Only **approved** requests can be accepted. Rejected, pending, or deleted
  requests are refused.
- Accepting does not assign the responder. It makes the responder eligible for
  administrator assignment.
- Responders see victim contact details only for requests assigned to them,
  through a dedicated RLS policy. Contact details are not exposed for
  unaccepted or unassigned requests.
- Only **active administrators** can open `/admin/assignments` or call the
  assignment action. The page lists approved requests with their accepted
  responders. Once a request is assigned, it remains visible with the assigned
  responder and no assign action.
- Only responders who **accepted that request** and are still **active** can be
  assigned. The function re-checks both conditions.
- A request can have at most one assigned responder. Multiple responders may
  accept before assignment, but the first successful assignment closes the
  request to every other responder.
- A unique `request_id` constraint and a request-row lock enforce one assignment
  per request, including concurrent administrator requests.
- The assigning administrator and assignment time are recorded by the database.
  New assignments start with the `pending` assignment status.
- Responders see only their own assignments; RLS and the request-scoped query
  filter both enforce this. Their dashboard also hides approved requests that
  already have an assigned responder by calling `list_assigned_request_ids`,
  without revealing which responder was assigned.

## Mission status behavior

- An assignment is the mission record for an emergency request. New assignments
  start with the `pending` status.
- Only the **assigned responder** can update that mission's status. Other
  responders, victims, administrators, and anonymous users cannot call the
  update function.
- The supported transitions are `pending` → `accepted` and `accepted` →
  `completed`. A completed mission is terminal.
- **Accept mission** records the responder's acceptance time and marks the
  mission `accepted`. **Mark as completed** closes the mission and marks it
  `completed`.
- Status changes are applied by the `SECURITY DEFINER` function
  `update_mission_status`. It derives the caller from the session, locks the
  assignment row, and re-checks that the caller is the assigned active responder.
  Authenticated users still have no direct update grant on
  `emergency_assignments`.
- Responder dashboards refresh after a status change. Administrators see the
  current assignment status and acceptance time on `/admin/assignments`.
- Mission status updates do not change the emergency request's review status or
  the one-responder-per-request rule.

## Victim request status behavior

- Victims can see the current status of their own requests on
  `/victim/dashboard`, `/victim/requests`, and
  `/victim/requests/[requestId]`.
- The displayed status combines the administrator review status with the actual
  assignment/mission status:
  - **Awaiting review** — the request is still pending administrator review.
  - **Not approved** — the request was rejected.
  - **Awaiting responder** — the request is approved but no responder is assigned.
  - **Responder assigned** — a responder is assigned but has not started the
    mission.
  - **Responder responding** — the assigned responder accepted the mission.
  - **Mission completed** — the assigned responder completed the mission.
  - **Response closed** — a legacy declined or cancelled assignment is present.
- The detail page also shows the raw review status, mission status, assignment
  time, and acceptance time when available.
- Victims read assignment rows only for their own requests through RLS. The
  victim queries select only the assignment status and timestamps; responder
  identity is not selected or displayed.
- The status is derived from the same request and assignment rows used by the
  administrator and responder views, so it stays consistent with review,
  assignment, and mission updates.

## Missing person behavior

- Any **active registered user** (victim, volunteer, rescue team member, or
  administrator) can report a missing person. Pending and rejected accounts
  cannot open the form or call the submission Server Action.
- The form collects the person's full name, optional age, gender, description,
  last seen location, and last seen time. A photograph is optional.
- Photographs are optional. JPG, PNG, and WebP files up to 5 MB are accepted. The
  server checks the declared MIME type, the file signature, and the size before
  uploading, so a report submits successfully with or without a photo. The
  Server Action body limit is raised to 6 MB so the 5 MB cap can reach server
  validation.
- Photos are stored in the private `missing-person-photos` Storage bucket under
  the reporter's own folder. The database stores a nullable `photo_path`. The
  application never creates a public URL; the directory and detail page request
  short-lived signed URLs for active users.
- If an upload succeeds but the report insert fails, the Server Action removes
  the uploaded object again. A Storage signing failure degrades to the
  placeholder rather than failing the directory.
- Reports without a photo show a neutral placeholder on the list and detail
  pages.
- The server always sets the reporter to the signed-in user and starts the
  report as **Missing**. The form cannot set the reporter, status, or resolution
  fields.
- Active victims, active volunteers, active rescue team members, and active
  administrators can search and open missing person reports. Pending and
  rejected accounts cannot.
- The directory searches by full name or last seen location and filters by
  **Missing**, **Found**, or **All**. Missing reports are the default view.
- The reporter can mark their own report **Found**. Administrators can mark any
  report **Found** and can reopen a found report as **Missing**.
- Marking a report found records the resolving profile and time. Reopening
  clears both fields.
- Status changes are applied by the `update_missing_person_status`
  `SECURITY DEFINER` function, which re-checks the caller and locks the report
  row. Authenticated users have no direct update or delete grant on
  `missing_persons`.
- Reporter contact details come from the reporter's profile and are shown only
  to the reporter and administrators. Other active users can see the report
  details but not the reporter's name or phone.
- Missing person reports do not create emergency requests, assignments, or
  missions. They are a separate community-search record.

## Protected routes and authorization

Protection is layered:

1. `proxy.ts` refreshes the Supabase session cookie and performs an optimistic
   redirect to `/login` for unauthenticated access to protected paths.
2. The protected layout requires an authenticated user with a profile.
3. Each role dashboard, request page, and missing person page independently
   requires the correct active role or an active account.
4. Server Actions re-check the session and active role before profile updates,
   request submission, responder review decisions, request acceptance, responder
   assignment, mission status updates, or missing person report submission and
   status updates.
5. RLS policies and column-level grants block direct privilege changes,
   cross-victim request access, cross-reporter missing person changes, and other
   responders' acceptance or assignment rows.

The UI is never the only authorization layer. Hiding a navigation link is not
treated as access control.

## Project structure

```text
app/
  (auth)/
    layout.tsx                    Authentication split-screen layout
    login/page.tsx                Login page
    register/page.tsx             Registration page
  (app)/
    layout.tsx                    Protected application shell
    account-status/page.tsx       Account status page
    profile/page.tsx              Profile page
    victim/
      dashboard/page.tsx          Victim dashboard with request and mission status
      requests/page.tsx           Victim request list with current status
      requests/new/page.tsx       New emergency request form
      requests/[requestId]/page.tsx Request details and current status
    volunteer/dashboard/page.tsx  Volunteer accept, mission status, and assignment dashboard
    rescue/dashboard/page.tsx     Rescue team accept, mission status, and assignment dashboard
    admin/
      dashboard/page.tsx          Administrator dashboard with approval, request, assignment, and missing person summaries
      responders/page.tsx         Responder approval queue
      requests/page.tsx           Emergency request review queue
      assignments/page.tsx        Accepted-request assignment queue
    missing-persons/
      page.tsx                    Missing person search and list
      new/page.tsx                Missing person report form
      [reportId]/page.tsx         Missing person details and status
  api/health/supabase/route.ts    Supabase health check
  globals.css                     Tailwind import and base theme
  layout.tsx                      Root layout and metadata
  page.tsx                        Public landing page
components/
  app-nav.tsx                     Role-aware application navigation
  app-shell.tsx                   Protected header, navigation, and logout
  admin/                          Responder approval, request review, and assignment cards
  auth/                           Login and registration forms
  missing-persons/                Missing person form, photo, cards, status badge, and status controls
  profile/                        Profile edit form
  requests/                       Request forms, victim/responder cards, victim status panels, accept and mission status actions, and badges
  responder/                      Shared responder dashboard
  ui/                             Icons, buttons, logo, fields, alerts, badges, headers, and cards
lib/
  admin/
    actions.ts                    Responder approval, request review, and assignment Server Actions
    data.ts                       Responder, request, acceptance, and assignment queries and counts
    format.ts                     Registration date formatting
    schemas.ts                    Review and assignment validation
  auth/
    actions.ts                    Registration, login, logout, profile actions
    action-state.ts               Form action state helpers
    dal.ts                        Request-scoped session/profile guards
    profile.ts                    Profile read and recovery helpers
    routes.ts                     Role destinations and safe redirects
    schemas.ts                    Zod validation schemas
  missing-persons/
    actions.ts                    Missing person submission and status Server Actions
    data.ts                       Missing person queries, signed photo URLs, and counts
    photos.ts                     Optional photo validation, Storage upload, cleanup, and signed URLs
    schemas.ts                    Missing person validation
  requests/
    actions.ts                    Emergency request submission, acceptance, and mission status Server Actions
    data.ts                       Victim, responder workspace, and assignment queries
    format.ts                     Date and number formatting
    schemas.ts                    Request validation and id checks
    status.ts                     Victim-facing request and mission status derivation
  constants.ts                    Role, category, status, and severity constants
  supabase/
    client.ts                     Browser Supabase client
    env.ts                        Environment validation
    health.ts                     Connection and schema checks
    server.ts                     Request-scoped server Supabase client
proxy.ts                          Session refresh and optimistic redirects
tests/
  missing-person-photo.test.ts    Optional-photo validation and both submission paths
TESTING_REPORT.md                 Chunks 6–9 testing report and manual test matrix
supabase/
  migrations/
    20261107000000_initial_schema.sql
    20261108000000_admin_responder_approval.sql
    20261109000000_admin_request_review.sql
    20261110000000_responder_acceptance_assignment.sql
    20261112000000_single_responder_assignment.sql
    20261115000000_mission_status_updates.sql
    20261116000000_missing_person_management.sql
    20261117000000_missing_person_photo_and_active_user_submission.sql
  README.md                       Migration, auth settings, and RLS notes
types/
  database.ts                     Typed Supabase database schema
```

## Scripts

| Command             | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Start the Next.js development server         |
| `npm run build`     | Create a production build                    |
| `npm run start`     | Run the production build                     |
| `npm run lint`      | Run ESLint                                   |
| `npm run typecheck` | Run TypeScript without emitting files        |
| `npm test`          | Run the Node test runner over `tests/`       |

## Testing

`npm test` runs the Node test runner over `tests/` using native TypeScript type
stripping (Node 22.6 or newer; this project was verified on Node 26). The current
suite covers optional-photo validation and both missing person submission paths
(with and without a photo). Verification also uses `npm run typecheck`,
`npm run lint`, and `npm run build`, plus the manual and live checks recorded in
[`TESTING_REPORT.md`](TESTING_REPORT.md).

## Security notes

- RLS is enabled on `profiles`, `emergency_requests`, `emergency_assignments`,
  `emergency_acceptances`, and `missing_persons`.
- Public registration cannot create an administrator profile.
- Volunteers and rescue team members cannot self-activate. Authenticated users
  have no direct update grant on `account_status`.
- Approval decisions are applied by a `SECURITY DEFINER` function that requires
  an active administrator and a pending volunteer or rescue team target.
- Profile updates are restricted to `full_name`, `phone`, and `address` by both
  the Server Action and database column grants.
- Only active victims can insert emergency requests, and the insert policy
  requires the caller to be the owner with a pending, unreviewed request.
- Emergency request review decisions are applied by a `SECURITY DEFINER`
  function that requires an active administrator and a pending request.
- Victims can read only their own requests; administrators can read all
  requests; active responders can read approved requests.
- Victims can read the assignment/mission status for their own requests through
  the existing assignment RLS policy. The victim status queries select only
  status and timestamps, not the assigned responder's identity.
- Emergency requests have no victim update or delete grant, so submitted
  details and review fields cannot be changed from the client.
- A request can have at most one assigned responder, enforced by a unique
  `request_id` constraint and request-row locking. The same responder cannot
  accept the same request more than once.
- Request, acceptance, and assignment reads are limited by role and relationship.
- Acceptance is applied by a `SECURITY DEFINER` function that derives the
  responder from the session and requires active responder status and an
  approved request.
- Assignment is applied by a `SECURITY DEFINER` function that requires an active
  administrator, an approved request, an active responder, and a matching
  acceptance, and records the assigning administrator and time.
- Mission status is updated only through a `SECURITY DEFINER` function that
  requires an active responder, locks the assignment row, and confirms the
  caller is the responder assigned to that mission. The function only allows
  `pending` → `accepted` → `completed`.
- Victim contact details are readable by a responder only after that responder
  is assigned to the victim's request.
- Any active registered user can insert only their own missing person reports,
  and new reports must start missing and unresolved. Pending and rejected
  accounts cannot insert. Authenticated users have no direct update or delete
  grant on `missing_persons`.
- Active victims, responders, and administrators can read missing person
  reports. Reporter contact details remain protected by profile RLS and are
  visible only to the reporter and administrators.
- Missing person photographs live in the private `missing-person-photos` Storage
  bucket. Uploads must use the caller's own folder, reads are limited to active
  accounts, and the application only displays short-lived signed URLs. The
  uploader can remove their own object; administrators can remove any
  missing-person photo.
- Missing person status changes are applied by `update_missing_person_status`,
  which requires an active reporter or an active administrator and locks the
  report row. Only administrators can reopen a found report.
- The Supabase service role key is not used by the application.
