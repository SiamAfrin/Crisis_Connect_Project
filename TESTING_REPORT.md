# Crisis Connect — Testing Report (Chunks 6–8)

**Date:** 12 November 2026
**Scope:** Testing, security review, bug fixing, and documentation for the
registration, profile, role access, administrator approval, emergency request,
responder acceptance, and one-responder assignment flows.

**Constraints observed:** No fake users or emergency requests were created. No
database data was reset, deleted, or modified. No destructive SQL was executed.
No Supabase service-role credential was read or exposed. No new product feature
was added, and no commit or push was performed.

## 1. Result summary

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm run build` | Pass |
| Server-side validation and routing unit checks | 36 passed, 0 failed |
| Live Supabase Auth and schema probe | Pass |
| Anonymous RLS denial probe | Pass |
| Protected-route redirect probe | Pass |
| Open-redirect sanitization probe | Pass |
| Authenticated end-to-end browser flows | Not executed — no real test accounts were available, and fake accounts were forbidden |
| Confirmed application-code bugs | None |
| Confirmed documentation bugs | 6, fixed in `README.md` |
| Database changes executed | None |
| Corrective one-responder migration status | Applied — confirmed by a live read-only RPC probe |

## 2. Environment and commands

The following commands were run from the project root:

```text
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

The production build completed successfully with Next.js 16.4.5 (Turbopack),
including TypeScript checking and static/dynamic route generation.

A server was already listening on `http://localhost:3000` during route testing.
The background `npm run start` attempt exited with `EADDRINUSE`; the existing
process was left untouched, and the route checks below were performed against
the already-running instance.

## 3. Server-side validation and routing checks

A temporary Node script (outside the repository) imported the real TypeScript
schemas and routing helpers with Node's built-in TypeScript stripping. It did
not use the database, create files in the repository, or add dependencies.

**Result: 36 passed, 0 failed.**

Covered cases:

- Registration accepts a valid victim.
- Registration lowercases email addresses.
- Registration rejects the `administrator` role.
- Registration rejects mismatched passwords.
- Registration rejects passwords shorter than 8 characters.
- Registration rejects a rescue team member without a category.
- Registration accepts a Government rescue team member.
- Registration rejects Defence without Police/Fire Service.
- Registration accepts Defence + Police.
- Registration rejects rescue fields on a non-rescue role.
- Login accepts and lowercases email addresses.
- Login rejects an empty password.
- Profile update accepts valid values.
- Profile update rejects a too-short phone number.
- Profile recovery metadata rejects an `administrator` role.
- Profile recovery metadata accepts a valid victim seed.
- Request submission accepts valid input and converts affected people to a number.
- Request submission rejects zero affected people.
- Request submission rejects non-numeric affected people.
- Request submission rejects more than 1,000,000 affected people.
- Request submission rejects an invalid severity.
- Request submission rejects an empty description.
- Request ID validation accepts a UUID and rejects a non-UUID.
- Responder review accepts `active` and rejects `approved`.
- Request review accepts `approved` and rejects `active`.
- Assignment validation accepts UUID references and rejects invalid references.
- Role-home routing is correct for all four roles.
- Pending and rejected profiles route to `/account-status`.
- Active profiles route to their role home.
- Safe `next` paths are preserved.
- Protocol-relative, absolute-URL, backslash, login-loop, register, and empty
  `next` paths are rejected.
- `getLoginPath` encodes safe targets and drops unsafe targets.

## 4. Live Supabase schema and RLS probe

The probe read only the public URL and publishable/anon key from `.env.local`.
The key was never printed, and no write operation was performed.

| Probe | Result | Interpretation |
| --- | --- | --- |
| `GET /auth/v1/health` | `200` | Supabase Auth is reachable. |
| Anonymous `profiles` select | `401`, PostgreSQL `42501` | Table exists; anonymous access is denied as intended. |
| Anonymous `emergency_acceptances` select | `401`, PostgreSQL `42501` | Chunk 5 table exists; anonymous access is denied. |
| Anonymous `emergency_assignments` select | `401`, PostgreSQL `42501` | Assignment table exists; anonymous access is denied. |
| Anonymous `list_assigned_request_ids` RPC | `401`, PostgreSQL `42501` with the function's custom message | The corrective migration is applied and the function correctly rejects non-responder/non-admin callers. |

The application health route returned:

```json
{
  "status": "ok",
  "auth": "reachable",
  "database": "ready"
}
```

This confirms the corrective one-responder migration is live in the configured
Supabase project. No database change was needed during Chunk 6.

## 5. Route protection and redirect checks

| Route | Result |
| --- | --- |
| `/` | `200` |
| `/login` | `200` |
| `/register` | `200` |
| `/victim/dashboard` | `307` → `/login?next=%2Fvictim%2Fdashboard` |
| `/volunteer/dashboard` | `307` → `/login?next=%2Fvolunteer%2Fdashboard` |
| `/rescue/dashboard` | `307` → `/login?next=%2Frescue%2Fdashboard` |
| `/admin/dashboard` | `307` → `/login?next=%2Fadmin%2Fdashboard` |
| `/admin/requests` | `307` → `/login?next=%2Fadmin%2Frequests` |
| `/admin/assignments` | `307` → `/login?next=%2Fadmin%2Fassignments` |
| `/profile` | `307` → `/login?next=%2Fprofile` |
| `/account-status` | `307` → `/login?next=%2Faccount-status` |
| `/api/health/supabase` | `200`, status `ok` |

Login-page `next` sanitization was also checked in rendered HTML:

| `next` value | Rendered hidden field |
| --- | --- |
| `//evil.example` | No |
| `https://evil.example` | No |
| `/%5Cevil.example` (decodes to a backslash) | No |
| `/login?next=/admin` | No |
| `/admin/requests` | Yes |

## 6. Security review

### Authentication and server-side authorization

- `proxy.ts` is an optimistic session refresher and redirect only; it is not the
  authorization boundary.
- `requireProfile`, `requireActiveRole`, and `requireActiveResponder` re-check
  the session, active account status, and role on the server.
- Every protected page and Server Action independently re-checks authorization.
- Pending and rejected responder accounts are redirected to `/account-status`.
- Cross-role access redirects to the signed-in user's own role home.
- Server Actions derive the victim, responder, and administrator from the
  session; the client never supplies those identities.

### Row Level Security and grants

- RLS is enabled on `profiles`, `emergency_requests`, `emergency_assignments`,
  and `emergency_acceptances`.
- `profiles`: users read their own profile; active administrators read all
  profiles; only the assigned responder reads the victim contact profile.
- `profiles` insert policy prevents administrator self-registration and unsafe
  initial statuses.
- `profiles` update is restricted to `full_name`, `phone`, and `address` by both
  the policy and column-level grants.
- `emergency_requests`: victims read their own requests, active responders read
  approved requests, and administrators read all requests. Only active victims
  can insert their own pending, unreviewed request. There is no update or delete
  grant.
- `emergency_assignments`: responders read their own assignments, victims read
  assignments for their own requests, and administrators read all assignments.
  There is no direct insert, update, or delete grant.
- `emergency_acceptances`: responders read their own acceptances and
  administrators read all of them. There is no direct insert, update, or delete
  grant.

### Database functions and constraints

- `review_responder_account`, `review_emergency_request`,
  `accept_emergency_request`, `assign_emergency_responder`, and
  `list_assigned_request_ids` are `SECURITY DEFINER` with
  `search_path = ''`, restricted `EXECUTE` grants, and internal role checks.
- One responder assignment per request is enforced by
  `unique (request_id)` on `emergency_assignments` plus request-row locking in
  both workflow functions.
- Multiple responders may accept before assignment; acceptance is rejected with
  `CC001` after assignment.
- Duplicate acceptance is blocked by `unique (request_id, responder_id)`.
- `emergency_requests` enforces the review state (reviewer and time together),
  valid statuses, severity values, and length/range checks.
- `profiles` enforces role-specific rescue fields and Defence subcategories.

### Validation and error handling

- Zod validates registration, login, profile updates, request submission,
  request ids, review decisions, and assignment references on the server.
- Lengths and ranges match the database `CHECK` constraints.
- Workflow errors are mapped to safe user-facing messages for missing functions
  (`PGRST202`), permission denial (`42501`), missing rows (`P0002`), invalid
  state (`22023`), already-assigned (`CC001`), and duplicate (`23505`).
- Unsafe redirect targets are rejected before being placed in the login form.

### Secret handling

- The application reads only the public Supabase URL and publishable/anon key.
- The service-role key is not imported or read by application code.
- The live probe did not print the public key or any credential.

### Residual risks and hardening notes

- **Low-risk profile email integrity:** the `profiles` insert policy allows a
  self-registered user to insert their own profile row with an email string that
  differs from their Auth email. This does not grant privileges and does not
  affect authentication, but it could make the admin review UI display a
  different contact email. If email integrity is required, add a database check
  against the Auth email or derive the profile email in a trigger. This was not
  changed in Chunk 6 because it requires a database policy/trigger decision.
- **Live authenticated E2E not executed:** the project has no test accounts and
  the instructions forbid creating fake users or requests. The manual checklist
  in section 9 covers the remaining browser-level verification.
- **No automated test runner:** verification currently relies on typecheck,
  lint, build, the temporary unit checks, live probes, and manual testing.
- **Unused exports:** `getVictimRequestStats` in `lib/requests/data.ts` and
  `requireUser` in `lib/auth/dal.ts` are currently unused. They were left in
  place to avoid unnecessary removals.
- **Victim assignment visibility:** victims can read assignment rows for their
  own requests (including responder/administrator UUIDs), but the `profiles`
  RLS policy prevents them from resolving those UUIDs to names or contact
  details. This is accepted as low risk.

## 7. Bugs fixed

No confirmed application-code bug was found. The following confirmed
documentation defects were corrected in `README.md`:

1. Victim dashboard description no longer claims request counts are shown; it
   now states that the five most recent requests are shown and the full list is
   at `/victim/requests`.
2. The introduction now states that one accepted responder is assigned to each
   request.
3. Victim contact is now documented as visible only to the assigned responder,
   not to every responder who accepted.
4. The multi-assignment statement was replaced with the one-assignment rule,
   unique constraint, and request-row locking.
5. The admin assignment queue is documented as keeping assigned requests visible
   with the assigned responder and no assign action.
6. The responder dashboard is documented as using `list_assigned_request_ids` to
   hide requests assigned to another responder without revealing who was
   assigned.

Additional README corrections:

- The security notes now describe one assignment per request and
  assigned-responder contact visibility.
- The project-structure migration list now includes
  `20261112000000_single_responder_assignment.sql`.
- A Testing section links to this report.

## 8. Files created or modified

| File | Change |
| --- | --- |
| `README.md` | Corrected one-responder, victim-contact, dashboard, migration-list, and testing documentation. |
| `TESTING_REPORT.md` | New Chunk 6 testing, security, and manual-verification report. |

No application source file, component, Server Action, schema, or migration was
modified in Chunk 6.

## 9. Manual end-to-end checklist for real accounts

These checks require existing real accounts. Do not create fake users or
requests to satisfy them.

### Registration, login, logout, and profile

- [ ] Register a victim; confirm immediate Active status and victim dashboard.
- [ ] Register a volunteer and a rescue team member; confirm Pending status and
      `/account-status`.
- [ ] Manipulate the registration role to `administrator`; confirm rejection.
- [ ] Register with mismatched passwords, a short password, and an invalid
      rescue/Defence combination; confirm field errors.
- [ ] Register with an existing email; confirm a friendly error.
- [ ] Log in with valid and invalid credentials; confirm correct routing/error.
- [ ] Log in as a pending or rejected responder; confirm `/account-status`.
- [ ] Log out; confirm redirect to `/login` and that protected routes redirect
      again.
- [ ] Update full name, phone, and address; confirm success and that email,
      role, rescue fields, and account status are unchanged.
- [ ] Confirm profile validation errors for empty name, short phone, and short
      address.

### Role access

- [ ] Victim can reach victim pages and is redirected away from volunteer,
      rescue, and admin pages.
- [ ] Volunteer can reach the volunteer dashboard and is redirected away from
      victim, rescue, and admin pages.
- [ ] Rescue team member can reach the rescue dashboard and is redirected away
      from victim, volunteer, and admin pages.
- [ ] Administrator can reach admin pages and is redirected away from victim and
      responder dashboards.
- [ ] Pending and rejected responders cannot reach any responder dashboard.
- [ ] Unauthenticated requests to all protected routes redirect to `/login` with
      a safe `next` value.

### Administrator approval and rejection

- [ ] Pending volunteer and rescue team registrations appear in
      `/admin/responders`, oldest first.
- [ ] Victim and administrator profiles do not appear in the approval queue.
- [ ] Approve a responder; confirm Active status and dashboard access.
- [ ] Reject a responder; confirm Rejected status and blocked dashboard access.
- [ ] Attempt to review an already-reviewed account; confirm a safe error.
- [ ] Confirm the review card shows role, contact details, category, and Defence
      subcategory when applicable.

### Emergency request submission and review

- [ ] Victim submits a request; confirm it starts Pending with the signed-in
      victim as owner.
- [ ] Confirm the form cannot set owner, status, reviewer, or review time.
- [ ] Confirm the victim sees the request on the dashboard and request list.
- [ ] Confirm a victim cannot open another victim's request by URL.
- [ ] Admin approves a request; confirm Approved status, reviewer, and review
      time.
- [ ] Admin rejects a request; confirm Rejected status.
- [ ] Confirm only pending requests can be reviewed.
- [ ] Confirm approved requests appear to active responders; pending and
      rejected requests do not.

### Acceptance, assignment, and one-responder enforcement

- [ ] Two active responders accept the same approved request; confirm both
      acceptances are recorded.
- [ ] Confirm a responder cannot accept the same request twice.
- [ ] Confirm a responder cannot accept a pending or rejected request.
- [ ] Admin assigns one accepting active responder; confirm the assignment is
      recorded with the assigning administrator and time.
- [ ] Confirm the assigned responder sees the assignment and the victim contact
      details.
- [ ] Confirm the other responder no longer sees an accept action for that
      request and cannot see the victim contact details.
- [ ] Confirm the admin queue still shows the assigned request with the assigned
      responder and no assign buttons.
- [ ] Attempt to assign a second responder; confirm the friendly
      "already has an assigned responder" error (`CC001`).
- [ ] Attempt to assign a responder who did not accept; confirm rejection.
- [ ] Attempt to assign an inactive responder; confirm rejection.

### Direct API / RLS checks with authenticated test accounts

- [ ] Attempt to update own `role` or `account_status`; confirm permission
      denied.
- [ ] Attempt to insert a request with `request_status = 'approved'` or another
      victim's id; confirm permission denied.
- [ ] Attempt to read another victim's request; confirm no rows or denial.
- [ ] Attempt to read another responder's acceptances or assignments; confirm no
      rows or denial.
- [ ] Attempt to insert directly into `emergency_acceptances` or
      `emergency_assignments`; confirm permission denied.
- [ ] Call an admin RPC as a non-administrator; confirm `42501`.
- [ ] Call a responder RPC as a victim; confirm `42501`.
- [ ] Call `list_assigned_request_ids` as a victim; confirm `42501`.

### Concurrency

- [ ] Have two administrators assign different accepted responders to the same
      request at nearly the same time; confirm exactly one assignment succeeds
      and the other receives `CC001` or `23505`.
- [ ] Accept a request while an assignment is in progress; confirm the request
      never ends up with two assignments.

### Health

- [ ] `GET /api/health/supabase` returns `status: "ok"`, `auth: "reachable"`,
      and `database: "ready"`.

## 10. Database changes

None were executed during Chunk 6.

The corrective migration
`supabase/migrations/20261112000000_single_responder_assignment.sql` is already
applied to the configured project, confirmed by the live read-only RPC probe.

For a fresh deployment, apply all migrations in filename order:

```text
20261107000000_initial_schema.sql
20261108000000_admin_responder_approval.sql
20261109000000_admin_request_review.sql
20261110000000_responder_acceptance_assignment.sql
20261112000000_single_responder_assignment.sql
```

The corrective migration is non-destructive but includes a pre-flight check. If
the database already contains more than one assignment for a request, it raises
`23505` and lists the affected request ids instead of deleting or merging data.
Resolve those rows deliberately before re-running it.

## 11. Remaining issues

1. Authenticated browser-level E2E testing remains outstanding because no real
   test accounts were available and fake data was forbidden. Use section 9.
2. No automated test runner is configured. The project currently relies on
   typecheck, lint, build, temporary unit checks, live probes, and manual tests.
3. `getVictimRequestStats` and `requireUser` are unused exports.
4. The low-risk profile email-integrity note in section 6 remains a possible
   hardening item if the project needs the profile email to be provably equal to
   the Auth email.
5. No commit or push was performed, per the Chunk 6 instructions.

## 12. Chunk 7 addendum — mission status updates

**Date:** 15 November 2026
**Scope:** PB-11 mission status updates and completion for assigned responders.

**Constraints observed:** The new migration was not executed against the live
Supabase project. No users, requests, assignments, or other records were created,
modified, or deleted. No destructive SQL was run. No secret was read or exposed.
No commit or push was performed.

### Executed checks

| Check | Result |
| --- | --- |
| `npm.cmd run typecheck` | Pass |
| `npm.cmd run lint` | Pass |
| `npm.cmd run build` | Pass |
| Mission status Zod validation checks | 7 passed, 0 failed |
| Migration static security checks | 10 passed, 0 failed |
| Direct `UPDATE` grant on `emergency_assignments` | None found |
| Direct `UPDATE` policy on `emergency_assignments` | None found |
| Live migration execution | Not performed |
| Authenticated browser E2E | Not performed — no real test accounts were available, and the migration is not applied yet |

The validation checks used a temporary Node script outside the repository. They
imported the real `updateMissionStatusSchema` and confirmed that `accepted` and
`completed` are accepted, while `pending`, `declined`, invalid ids, and empty ids
are rejected. A trimmed valid UUID is accepted.

The migration static checks confirmed `SECURITY DEFINER`, an empty `search_path`,
the active-responder check, the assigned-responder identity check, assignment-row
locking, both transition guards, the terminal completed guard, and restricted
`EXECUTE` grants.

### Manual steps still required

1. Review and apply
   `supabase/migrations/20261115000000_mission_status_updates.sql` in the
   Supabase SQL Editor or with the Supabase CLI.
2. Sign in as an assigned responder, accept a mission, and confirm the status
   changes to `accepted` and `accepted_at` is recorded.
3. Mark the mission completed and confirm the status changes to `completed`.
4. Confirm the administrator assignment page shows `Accepted` or `Completed`.
5. Confirm another responder, a victim, and an administrator cannot update the
   mission, and that direct updates to `emergency_assignments` are denied.
6. Confirm a completed mission cannot be changed again.

### Chunk 7 files

| File | Change |
| --- | --- |
| `supabase/migrations/20261115000000_mission_status_updates.sql` | New mission status update function and grants. |
| `types/database.ts` | Added the RPC signature. |
| `lib/requests/schemas.ts` | Added mission status validation. |
| `lib/requests/actions.ts` | Added the mission status Server Action and error mapping. |
| `components/requests/mission-status-controls.tsx` | New responder status controls. |
| `components/requests/assigned-request-card.tsx` | Added status controls and acceptance time. |
| `components/admin/emergency-assignment-card.tsx` | Added acceptance time to the admin view. |
| `components/responder/responder-dashboard.tsx` | Updated assignment guidance for mission status. |
| `app/(app)/volunteer/dashboard/page.tsx` | Updated the dashboard introduction. |
| `app/(app)/rescue/dashboard/page.tsx` | Updated the dashboard introduction. |
| `README.md` | Documented mission status behavior and the new migration. |
| `supabase/README.md` | Documented the function, migration, and lifecycle. |
| `components/README.md` | Documented the mission status action component. |
| `TESTING_REPORT.md` | Added this Chunk 7 addendum. |

## 13. Chunk 8 addendum — victim emergency request status

**Date:** 15 November 2026
**Scope:** PB-12 victim-facing emergency request status.

**Constraints observed:** No database schema change or migration was required. No
users, requests, assignments, or other records were created, modified, or
deleted. No destructive SQL was run. No secret was read or exposed. No commit or
push was performed.

### Executed checks

| Check | Result |
| --- | --- |
| `npm.cmd run typecheck` | Pass |
| `npm.cmd run lint` | Pass |
| `npm.cmd run build` | Pass |
| Victim status derivation checks | 9 passed, 0 failed |
| Victim query and authorization static checks | All passed |
| Live authenticated browser E2E | Not performed — no real test accounts were available |

The derivation checks covered pending, rejected, approved-without-assignment,
approved-with-unknown-assignment, assignment pending, assignment accepted,
assignment completed, assignment declined, and assignment cancelled.

The static checks confirmed that:

- Victim request queries filter by `victim_id`.
- The single-request query filters by both `request_id` and `victim_id`.
- Victim assignment queries filter by the victim's request ids.
- Victim assignment queries select only `request_id`, `assignment_status`,
  `assigned_at`, and `accepted_at`, not the responder's identity.
- The detail page loads the assignment only after confirming request ownership.
- All three victim pages require the active victim role.
- The dashboard and list pass the assignment status into the request card.
- The card and detail panel render the derived victim status.
- The status helper handles pending, accepted, and completed mission states.

The existing `emergency_assignments_select_related` RLS policy was inspected and
still allows a victim to read assignment rows only for their own requests. No
policy or grant was changed in Chunk 8.

### Manual steps still required

1. Sign in as a victim with a pending request; confirm **Awaiting review**.
2. Have an administrator reject a request; confirm **Not approved**.
3. Have an administrator approve a request; confirm **Awaiting responder**.
4. Have an administrator assign a responder; confirm **Responder assigned**.
5. Have the assigned responder accept the mission; confirm
   **Responder responding**.
6. Have the assigned responder complete the mission; confirm
   **Mission completed**.
7. Confirm the detail page shows the review status, mission status, assignment
   time, and acceptance time.
8. Open another victim's request by URL; confirm the page returns not found and
   does not reveal the request or assignment.

### Chunk 8 files

| File | Change |
| --- | --- |
| `lib/requests/status.ts` | New victim-facing status derivation and assignment type. |
| `lib/requests/data.ts` | Added victim assignment queries and included assignments in the victim request list. |
| `components/requests/victim-request-status.tsx` | New victim status badge and detail panel. |
| `components/requests/request-card.tsx` | Added current status badge and summary. |
| `app/(app)/victim/dashboard/page.tsx` | Passed assignment status into recent request cards. |
| `app/(app)/victim/requests/page.tsx` | Passed assignment status into the request list. |
| `app/(app)/victim/requests/[requestId]/page.tsx` | Added current status badge and status panel with assignment details. |
| `README.md` | Documented victim request status behavior and updated route descriptions. |
| `supabase/README.md` | Documented the victim status read scope. |
| `components/README.md` | Documented the victim status components. |
| `TESTING_REPORT.md` | Added this Chunk 8 addendum. |
