# Crisis Connect

Crisis Connect is a centralized emergency response and coordination system for
victims, volunteers, rescue team members, and administrators.

This repository is being built in approved chunks. **Chunk 4 (Victim Emergency
Request and Admin Review)** is implemented and pending review. Chunks 1–3
(project foundation, authentication and profiles, and administrator responder
approval) remain in place. Responder assignment and acceptance are **Chunk 5**
and are not implemented yet.

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

3. Apply all three migrations to the Supabase project, in filename order. See
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
| `/victim/dashboard` | Active victim | Victim dashboard with request summary (Chunk 4 work) |
| `/victim/requests` | Active victim | List and track the victim's own requests (Chunk 4 work) |
| `/victim/requests/new` | Active victim | Submit an emergency request (Chunk 4 work) |
| `/victim/requests/[requestId]` | Active victim | Request details and review status (Chunk 4 work) |
| `/volunteer/dashboard` | Active volunteer | Volunteer placeholder dashboard |
| `/rescue/dashboard` | Active rescue team member | Rescue team placeholder dashboard |
| `/admin/dashboard` | Active administrator | Administrator dashboard with approval summary |
| `/admin/responders` | Active administrator | Review and approve or reject responder registrations |
| `/admin/requests` | Active administrator | Review and approve or reject emergency requests |
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

## Emergency request behavior (Chunk 4)

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
- The victim dashboard shows request counts by status and the five most recent
  submissions.
- Only **active administrators** can open `/admin/requests` or call the review
  action. Pending requests appear oldest first with the victim's contact details.
- **Approve** sets the request to **Approved**; **Reject** sets it to
  **Rejected**. The reviewing administrator and review time are recorded.
- Decisions are applied by the `review_emergency_request` `SECURITY DEFINER`
  function, which re-checks the administrator role and only reviews pending
  requests. Authenticated users have no direct update grant on
  `emergency_requests`.
- Only approved requests become readable by active volunteers and rescue team
  members. Their dashboards list approved requests read-only; assignment and
  acceptance are **Chunk 5** work.

## Protected routes and authorization

Protection is layered:

1. `proxy.ts` refreshes the Supabase session cookie and performs an optimistic
   redirect to `/login` for unauthenticated access to protected paths.
2. The protected layout requires an authenticated user with a profile.
3. Each role dashboard and request page independently requires the correct
   active role.
4. Server Actions re-check the session and active role before profile updates,
   request submission, or responder review decisions.
5. RLS policies and column-level grants block direct privilege changes and
   cross-victim request access.

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
      dashboard/page.tsx          Victim dashboard with request summary
      requests/page.tsx           Victim request list
      requests/new/page.tsx       New emergency request form
      requests/[requestId]/page.tsx Request details and review status
    volunteer/dashboard/page.tsx  Volunteer placeholder dashboard
    rescue/dashboard/page.tsx     Rescue team placeholder dashboard
    admin/
      dashboard/page.tsx          Administrator dashboard with approval and request summaries
      responders/page.tsx         Responder approval queue
      requests/page.tsx           Emergency request review queue
  api/health/supabase/route.ts    Supabase health check
  globals.css                     Tailwind import and base theme
  layout.tsx                      Root layout and metadata
  page.tsx                        Public landing page
components/
  app-shell.tsx                   Protected header, navigation, and logout
  admin/                          Responder approval and emergency request review cards
  auth/                           Login and registration forms
  dashboard/                      Placeholder dashboard cards
  profile/                        Profile edit form
  requests/                       Request form, victim cards, approved-request card, and badges
  ui/                             Logo, fields, alerts, status badge
lib/
  admin/
    actions.ts                    Responder approval and request review Server Actions
    data.ts                       Responder and emergency request queries and counts
    format.ts                     Registration date formatting
    schemas.ts                    Review validation and id checks
  auth/
    actions.ts                    Registration, login, logout, profile actions
    action-state.ts               Form action state helpers
    dal.ts                        Request-scoped session/profile guards
    profile.ts                    Profile read and recovery helpers
    routes.ts                     Role destinations and safe redirects
    schemas.ts                    Zod validation schemas
  requests/
    actions.ts                    Emergency request Server Action
    data.ts                       Victim and responder request queries and counts
    format.ts                     Date and number formatting
    schemas.ts                    Request validation and id checks
  constants.ts                    Role, category, status, and severity constants
  supabase/
    client.ts                     Browser Supabase client
    env.ts                        Environment validation
    health.ts                     Connection and schema checks
    server.ts                     Request-scoped server Supabase client
proxy.ts                          Session refresh and optimistic redirects
supabase/
  migrations/
    20261107000000_initial_schema.sql
    20261108000000_admin_responder_approval.sql
    20261109000000_admin_request_review.sql
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

## Security notes

- RLS is enabled on `profiles`, `emergency_requests`, and
  `emergency_assignments`.
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
- Emergency requests have no victim update or delete grant, so submitted
  details and review fields cannot be changed from the client.
- The same responder cannot be assigned to the same request more than once.
- Request and assignment reads are limited by role and relationship.
- Assignment writes remain reserved for a later chunk.
- The Supabase service role key is not used by the application.

## Chunk boundary

Chunk 4 does **not** include:

- responder assignment or acceptance (Chunk 5);
- live response tracking (Chunk 6);
- testing, final security review, or documentation beyond Chunk 4 verification
  (Chunk 6);
- live GPS tracking, real-time chat, SMS alerts, or automatic disaster alerts;
- seeded/fake users or requests.

Those features are implemented only after this chunk is explicitly approved.
