# Crisis Connect

Crisis Connect is a centralized emergency response and coordination system for
victims, volunteers, rescue team members, and administrators.

This repository is being built in approved chunks. **Chunk 2 (Authentication,
Registration, Profiles, and Protected Routes)** is implemented and pending
review. Emergency request submission, administrator review, responder
assignment, and live tracking are intentionally not implemented yet.

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

3. Apply the initial migration to the Supabase project. See
   [`supabase/README.md`](supabase/README.md).

4. In the Supabase dashboard, disable **Authentication → Providers → Email →
   Confirm email**. Chunk 2 uses email/password authentication without email
   verification, OTP, CAPTCHA, or MFA.

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
| `/victim/dashboard` | Active victim | Victim placeholder dashboard |
| `/volunteer/dashboard` | Active volunteer | Volunteer placeholder dashboard |
| `/rescue/dashboard` | Active rescue team member | Rescue team placeholder dashboard |
| `/admin/dashboard` | Active administrator | Administrator placeholder dashboard |
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

## Protected routes and authorization

Protection is layered:

1. `proxy.ts` refreshes the Supabase session cookie and performs an optimistic
   redirect to `/login` for unauthenticated access to protected paths.
2. The protected layout requires an authenticated user with a profile.
3. Each role dashboard independently requires the correct active role.
4. Server Actions re-check the session before profile updates.
5. RLS policies and column-level grants block direct privilege changes.

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
    victim/dashboard/page.tsx     Victim placeholder dashboard
    volunteer/dashboard/page.tsx  Volunteer placeholder dashboard
    rescue/dashboard/page.tsx     Rescue team placeholder dashboard
    admin/dashboard/page.tsx      Administrator placeholder dashboard
  api/health/supabase/route.ts    Supabase health check
  globals.css                     Tailwind import and base theme
  layout.tsx                      Root layout and metadata
  page.tsx                        Public landing page
components/
  app-shell.tsx                   Protected header, navigation, and logout
  auth/                           Login and registration forms
  dashboard/                      Placeholder dashboard cards
  profile/                        Profile edit form
  ui/                             Logo, fields, alerts, status badge
lib/
  auth/
    actions.ts                    Registration, login, logout, profile actions
    action-state.ts               Form action state helpers
    dal.ts                        Request-scoped session/profile guards
    profile.ts                    Profile read and recovery helpers
    routes.ts                     Role destinations and safe redirects
    schemas.ts                    Zod validation schemas
  constants.ts                    Role, category, and status display constants
  supabase/
    client.ts                     Browser Supabase client
    env.ts                        Environment validation
    health.ts                     Connection and schema checks
    server.ts                     Request-scoped server Supabase client
proxy.ts                          Session refresh and optimistic redirects
supabase/
  migrations/
    20261107000000_initial_schema.sql
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
- Volunteers and rescue team members cannot self-activate.
- Profile updates are restricted to `full_name`, `phone`, and `address` by both
  the Server Action and database column grants.
- The same responder cannot be assigned to the same request more than once.
- Request and assignment reads are limited by role and relationship.
- Assignment writes remain reserved for a later chunk.
- The Supabase service role key is not used by the application.

## Chunk boundary

Chunk 2 does **not** include:

- emergency request submission;
- administrator review or responder approval screens;
- responder assignment or acceptance;
- live status tracking;
- seeded/fake users or requests.

Those features are implemented only after this chunk is explicitly approved.
