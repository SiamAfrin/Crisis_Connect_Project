# Crisis Connect — Testing Report (Chunks 6–9)

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

## 14. Chunk 9 addendum — missing person management

**Date:** 15 November 2026
**Scope:** PB-13, PB-14, and PB-15 missing person management.

**Constraints observed:** One new migration file was written but was not executed
against Supabase. No users, missing person reports, requests, assignments, or
other records were created, modified, or deleted. No destructive SQL was run. No
secret was read or exposed. No commit or push was performed.

> **Correction (16 November 2026):** This section records the original Chunk 9
> implementation, which allowed only active victims to submit and had no photo
> support. Those statements are superseded by the correction addendum at the end
> of this report. The current implementation allows every active registered role
> and supports an optional private photo.

### Executed checks

| Check | Result |
| --- | --- |
| `npm.cmd run typecheck` | Pass |
| `npm.cmd run lint` | Pass |
| `npm.cmd run build` | Pass |
| Missing person validation checks | 18 passed, 0 failed |
| Missing person SQL and authorization static checks | 35 passed, 0 failed |
| Live authenticated browser E2E | Not performed — no real test accounts were available |
| Migration executed against live Supabase | No — pending manual review and application |

The validation checks covered valid submission, optional age, invalid age,
empty and over-length names, invalid gender, empty and over-length descriptions,
empty and over-length last seen locations, future and impossible last seen
times, non-ISO last seen times, valid and invalid report ids, and valid and
invalid status updates.

The static checks confirmed that:

- The migration enables RLS on `missing_persons`.
- The select policy covers active victims, active responders, and active
  administrators.
- The insert policy requires the caller to be the reporter, an active victim,
  and a missing unresolved report.
- The last-seen constraint permits only a five-minute clock skew after creation.
- `update_missing_person_status` is `SECURITY DEFINER`, uses an empty
  `search_path`, locks the report row, rejects a null status, and allows only
  the reporter or an administrator to update it.
- Only administrators can reopen a found report.
- There is no direct update or delete grant and no anonymous select grant.
- The directory filters by status and searches full name and last seen location.
- Search input is sanitized before it is used in the PostgREST `or` filter,
  including commas, parentheses, wildcard characters, backslashes, and quotes.
- The list and detail pages require an active account; the new report page
  requires an active victim.
- The detail page loads reporter contact only when the viewer is the reporter or
  an administrator.
- The create action requires an active victim and derives the reporter from the
  session; the status action requires an active account and calls the RPC.
- Navigation, the proxy matcher, and the protected route prefixes include
  `/missing-persons`.
- The database types include the table, both enums, and the RPC.

The production build generated `/missing-persons`, `/missing-persons/new`, and
`/missing-persons/[reportId]` in addition to the existing routes.

### Migration notes

`supabase/migrations/20261116000000_missing_person_management.sql` adds:

- The `missing_person_status` and `missing_person_gender` enums.
- The `missing_persons` table, constraints, indexes, and `updated_at` trigger.
- RLS select and insert policies.
- The `update_missing_person_status` `SECURITY DEFINER` function.
- Column grants that exclude status, resolution, and audit columns.

It reuses the existing `is_active_victim`, `is_active_responder`, `is_admin`, and
`set_updated_at` helpers. It does not change existing tables, policies, or
functions.

### Manual steps still required

1. Review and apply
   `supabase/migrations/20261116000000_missing_person_management.sql` in the
   Supabase SQL Editor or with the Supabase CLI.
2. Sign in as an active victim; open `/missing-persons/new` and submit a report.
3. Confirm the report appears in `/missing-persons` with the **Missing** status.
4. Search by name and by last seen location; confirm the matching report appears.
5. Filter by **Found** and **All**; confirm the list changes correctly.
6. As the reporter, open the report and mark it **Found**; confirm the status and
   found time update and the report leaves the default missing list.
7. As an administrator, reopen the found report; confirm it returns to
   **Missing** and the resolution fields are cleared.
8. As another active victim or a responder, confirm the report details are
   visible but the reporter's name and phone are not.
9. As a pending or rejected responder, confirm `/missing-persons` redirects to
   `/account-status`.
10. Confirm an anonymous request to `/missing-persons` redirects to `/login`.
11. Confirm a direct authenticated update or delete on `missing_persons` is
    denied by the column grants and RLS.

### Chunk 9 files

| File | Change |
| --- | --- |
| `supabase/migrations/20261116000000_missing_person_management.sql` | New enums, table, RLS policies, grants, and status RPC. |
| `types/database.ts` | Added the missing person table, enums, relationships, and RPC types. |
| `lib/constants.ts` | Added missing person status, gender labels, and gender options. |
| `lib/auth/dal.ts` | Added `requireActiveAccount` for shared active-user pages. |
| `lib/auth/routes.ts` | Added `/missing-persons` to the protected route prefixes. |
| `proxy.ts` | Added `/missing-persons` to the session matcher. |
| `lib/missing-persons/schemas.ts` | New report and status validation. |
| `lib/missing-persons/data.ts` | New search, detail, reporter, and count queries. |
| `lib/missing-persons/actions.ts` | New report submission and status Server Actions. |
| `components/missing-persons/missing-person-form.tsx` | New missing person report form. |
| `components/missing-persons/missing-person-card.tsx` | New search result card. |
| `components/missing-persons/missing-person-status-badge.tsx` | New missing/found badge. |
| `components/missing-persons/missing-person-status-controls.tsx` | New mark-found and reopen controls. |
| `app/(app)/missing-persons/page.tsx` | New search and list page. |
| `app/(app)/missing-persons/new/page.tsx` | New victim report page. |
| `app/(app)/missing-persons/[reportId]/page.tsx` | New detail and status page. |
| `components/app-shell.tsx` | Added the Missing persons navigation item for active users. |
| `app/(app)/victim/dashboard/page.tsx` | Added a report-missing-person action. |
| `app/(app)/admin/dashboard/page.tsx` | Added missing person counts and a queue link. |
| `README.md` | Documented missing person behavior, routes, structure, and security notes. |
| `supabase/README.md` | Documented the migration, schema, RLS, and lifecycle. |
| `components/README.md` | Documented the missing person components. |
| `TESTING_REPORT.md` | Added this Chunk 9 addendum. |

---

# Chunk 9 correction — optional photo and all-active-user submission

**Date:** 16 November 2026

**Scope:** PB-13 correction only. The report form now supports an optional
photograph, and every active registered role can submit a report. PB-14, PB-15,
the existing status controls, reporter-contact privacy, and administrator reopen
behavior are unchanged. Chunk 10/PB-16 was not started.

**Constraints observed:** No database SQL was executed, no migration was applied,
no data was deleted, no excluded feature was added, and no commit or push was
performed.

## Result summary

| Check | Result |
| --- | --- |
| TypeScript (`tsc --noEmit`) | Pass |
| ESLint (`eslint .`) | Pass |
| Production build (`next build`) | Pass |
| Automated photo/submission tests (`node --test tests`) | 13 passed, 0 failed |
| Migration `20261117000000_missing_person_photo_and_active_user_submission.sql` | Created, not applied |
| Live authenticated browser E2E | Not executed — no real test accounts were available |

## Automated coverage

`tests/missing-person-photo.test.ts` imports the real validation modules with
Node's TypeScript stripping and covers:

- Report text fields validate without a photo field.
- A missing file input plans a report with `photo_path = NULL`.
- An untouched browser file input plans a report with `photo_path = NULL`.
- An empty-string photo field (multipart-decoded untouched input) plans a report with `photo_path = NULL`.
- The server-decoded untouched input (`File` named `"undefined"`) plans a report with `photo_path = NULL`.
- Valid PNG, JPEG, and WebP files plan uploads with the correct extension.
- A non-image MIME type is rejected.
- A renamed non-image file is rejected by its signature.
- An empty image file is rejected.
- A file larger than 5 MB is rejected.
- A non-file form value is rejected.

The suite does not replace live Storage/RLS testing. It verifies the decision
logic for both submission paths; the manual matrix below verifies the actual
Supabase Storage and RLS behavior.

## Manual test matrix

Apply the new migration first, then sign in with real accounts.

### A. Submit without a photograph

1. Sign in as an active victim, volunteer, rescue team member, and administrator
   in turn.
2. Open `/missing-persons/new` from the directory button or the dashboard action.
3. Leave **Photograph** empty and submit a valid report.
4. Confirm the report is created, the detail page opens, and the placeholder is
   shown on both the detail page and the directory card.
5. Confirm `missing_persons.photo_path` is `NULL` for the new row.

### B. Submit with a photograph

1. Repeat the role check with a real JPG, PNG, and WebP file under 5 MB.
2. Confirm the preview appears before submission.
3. Submit and confirm the detail page and directory card show the photo.
4. Confirm `photo_path` is set and the object exists under
   `missing-person-photos/<reporter-uuid>/`.
5. Copy the object path and try to open a public Storage URL without a signature;
   confirm it is denied.
6. Confirm the signed URL works for an active user and expires.

### C. Validation and failure handling

1. Try a `.txt` file renamed to `.png`; confirm the server rejects it.
2. Try a file larger than 5 MB; confirm the server rejects it.
3. As a pending or rejected account, confirm `/missing-persons/new` redirects to
   `/account-status`.
4. Confirm a direct insert as a pending account is denied by RLS.
5. Confirm a direct insert with another user's `reporter_id` is denied.
6. Confirm a direct update or delete on `missing_persons` is denied.
7. Confirm the existing PB-14 search/filter and PB-15 mark-found/reopen flows
   still work.

## Migration instructions

1. Open the Supabase project → **SQL Editor**.
2. Paste the full contents of
   `supabase/migrations/20261117000000_missing_person_photo_and_active_user_submission.sql`.
3. Run it once. It is additive and does not rerun
   `20261116000000_missing_person_management.sql`.
4. Confirm the verification queries in `supabase/README.md` show the nullable
   `photo_path` column, the private bucket, four storage policies, and the
   `is_active_account` function.

## Correction files

| File | Change |
| --- | --- |
| `supabase/migrations/20261117000000_missing_person_photo_and_active_user_submission.sql` | New additive migration: `photo_path`, active-account helper/policies, private bucket, storage policies, widened status RPC. |
| `lib/missing-persons/photos.ts` | New optional-photo validation, path building, upload, cleanup, and signed URL helpers. |
| `lib/missing-persons/actions.ts` | Active-account submission, optional upload, insert cleanup, and updated error messages. |
| `lib/missing-persons/data.ts` | Signed photo URLs for list and detail queries. |
| `components/missing-persons/missing-person-photo.tsx` | New photo display with a no-photo placeholder. |
| `components/missing-persons/missing-person-form.tsx` | Optional file input, preview, and validation feedback. |
| `components/missing-persons/missing-person-card.tsx` | Photo/placeholder in search results. |
| `app/(app)/missing-persons/page.tsx` | Report action for every active role. |
| `app/(app)/missing-persons/new/page.tsx` | Active-account authorization. |
| `app/(app)/missing-persons/[reportId]/page.tsx` | Photo/placeholder on the detail page. |
| `app/(app)/admin/dashboard/page.tsx` | Report-missing-person action for administrators. |
| `components/responder/responder-dashboard.tsx` | Report-missing-person action for responders. |
| `types/database.ts` | Added nullable `photo_path`. |
| `tests/missing-person-photo.test.ts` | New automated coverage for both submission paths. |
| `tests/package.json` | Scopes the test directory to ESM. |
| `package.json` | Added the `npm test` script. |
| `tsconfig.json` | Enabled `allowImportingTsExtensions` for the test imports. |
| `next.config.ts` | Raised the Server Action body limit to 6 MB for the 5 MB photo cap. |
| `README.md` | Updated routes, behavior, scripts, testing, and security notes. |
| `supabase/README.md` | Documented the new migration, photo column, bucket, policies, and lifecycle. |
| `components/README.md` | Documented the photo component. |
| `TESTING_REPORT.md` | Added this correction addendum. |

## Remaining user actions

1. Review and apply the new migration in Supabase.
2. Run the manual matrix with real accounts for all four active roles, with and
   without photos.
3. Confirm Storage policies behave as expected for pending/rejected accounts and
   cross-user paths.
4. Approve Chunk 10/PB-16 separately when ready.

---

# Chunk 9 correction — Bangladesh local-time display and input

**Date:** 16 November 2026

**Scope:** Timestamp presentation only. Database timestamps stay `timestamptz`
(UTC internally); no schema, migration, policy, or existing record changed.
Chunk 10/PB-16 was not started.

## Result summary

| Check | Result |
| --- | --- |
| TypeScript (`tsc --noEmit`) | Pass |
| ESLint (`eslint .`) | Pass |
| Automated tests (`node --test tests`) | 19 passed, 0 failed |
| Production build (`next build`) | Pass |

## Behavior

- All displayed timestamps now use `Asia/Dhaka` (Bangladesh Standard Time,
  UTC+6) and end with the `BST` label instead of `UTC`.
- `formatDateTime` and `formatRegistrationDate` keep explicit `timeZone`
  settings, so server rendering is deterministic and there is no hydration
  mismatch.
- A missing-person `datetime-local` value is now interpreted as Bangladesh
  wall-clock time before conversion to UTC for storage.
- Impossible dates (for example 30 February) are still rejected, and the
  existing five-minute future tolerance is preserved.

## Changed files

| File | Change |
| --- | --- |
| `lib/requests/format.ts` | Format in `Asia/Dhaka`; suffix `BST`. |
| `lib/admin/format.ts` | Same timezone and label for registration dates. |
| `lib/missing-persons/schemas.ts` | Parse `lastSeenAt` as UTC+6; guard the future check against invalid input. |
| `components/missing-persons/missing-person-form.tsx` | Hint now says “Use Bangladesh time (BST, UTC+6)”. |
| `tests/missing-person-timestamp.test.ts` | New conversion and input-parsing coverage. |
| `TESTING_REPORT.md` | Added this addendum. |

---

# Chunk 10 — PB-16: Administrator monitoring dashboard

**Date:** 16 November 2026

**Scope:** PB-16 only. Administrators can monitor emergency requests, users,
rescue missions and their statuses, emergency counts, and completed mission and
missing-person records. No PB-17 reporting, real-time updates, live responder
tracking, schema change, or migration was added.

## Result summary

| Check | Result |
| --- | --- |
| TypeScript (`tsc --noEmit`) | Pass |
| ESLint (`eslint .`) | Pass |
| Automated tests (`node --test tests`) | 25 passed, 0 failed |
| Production build (`next build`) | Pass — 22/22 pages generated |

## Implemented behavior

### Administrator monitoring dashboard

`/admin/dashboard` now requires an active administrator and shows current
database counts from the request-scoped Supabase client:

- **Emergency requests:** pending, approved, rejected, and total counts, plus a
  breakdown by low, medium, high, and critical severity.
- **Users:** total accounts, victims, volunteers, rescue team members,
  administrators, active responders, responder accounts awaiting approval, and
  rejected responder accounts.
- **Rescue missions:** assignments awaiting start, in progress, completed,
  closed, and total, plus the newest active and completed mission records.
- **Missing persons:** missing, found, and total counts, plus the five most
  recently found reports.
- **Action queues:** links to responder approvals, emergency request review,
  responder assignments, and missing persons.
- **Recent activity:** the five newest emergency requests across all review
  statuses.

Every number comes from a Supabase count or list query. No sample, seeded, or
hard-coded statistics are displayed.

### Mission monitoring

`/admin/assignments` now includes:

- A mission status summary for awaiting start, in progress, completed, closed,
  and total missions.
- Filters for **All missions**, **Awaiting start**, **In progress**,
  **Completed**, and **Closed**.
- Mission cards showing the emergency request, assigned responder, victim
  contact details, request severity, assignment time, mission acceptance time,
  and current mission status.
- The existing accepted-request assignment queue remains available so
  administrators can still assign an accepted responder.

Completed missions remain readable as records. The page does not add an
administrator mission-status write path; `update_mission_status` remains
restricted to the assigned active responder.

### Missing-person and completed-record visibility

- Found missing-person reports are linked from the dashboard.
- `/missing-persons?status=found` lists resolved records.
- Administrators can open a report to mark it found or reopen it, using the
  existing PB-15 status controls.
- No missing-person or mission record is deleted.

## Authorization and data security

- Both changed pages call `requireActiveRole("administrator")`.
- Every read uses the request-scoped Supabase client and existing RLS:
  - administrators may read all profiles, emergency requests, assignments,
    acceptances, and missing-person reports;
  - no service-role key is used;
  - no policy, grant, function, table, or column was changed.
- The mission monitor cannot change mission status, assign a second responder,
  edit requests, or delete records.
- Dashboard counts and lists are limited to what the current administrator
  session can read through RLS.
- No real-time subscriptions, websockets, or live tracking were added. The data
  refreshes when the page is requested.

## Database changes

**None.** PB-16 required only read queries over the existing schema. No migration
file was created or applied, and no SQL was executed. Existing indexes cover
profile role/account status, request review status, and assignment status; the
severity count uses the current request table.

## New files

| File | Purpose |
| --- | --- |
| `components/admin/admin-stat-card.tsx` | Real count card used by the dashboard and mission monitor. |
| `components/admin/admin-mission-card.tsx` | Full and compact mission record cards with request, responder, victim, and status. |
| `lib/admin/mission-filters.ts` | Mission filter normalization and status mapping, including the closed group. |
| `tests/admin-mission-filters.test.ts` | Six tests for filter normalization, status grouping, and count formatting. |

## Modified files

| File | Change |
| --- | --- |
| `lib/admin/data.ts` | Added user, severity, and mission counts; recent request query; mission list query; shared victim attachment helper. |
| `lib/admin/format.ts` | Added grouped count formatting. |
| `lib/missing-persons/data.ts` | Added lightweight found-report summaries for monitoring. |
| `app/(app)/admin/dashboard/page.tsx` | Replaced the queue-only dashboard with the PB-16 monitoring dashboard. |
| `app/(app)/admin/assignments/page.tsx` | Added mission counts, status filters, and mission record cards. |
| `README.md` | Documented monitoring routes, counts, mission monitor, and limitations. |
| `supabase/README.md` | Documented that PB-16 is read-only and adds no schema objects. |
| `components/README.md` | Documented the new monitoring components. |
| `TESTING_REPORT.md` | Added this Chunk 10 report. |

## Verification

| Check | Result |
| --- | --- |
| `node .\node_modules\typescript\bin\tsc --noEmit` | Pass |
| `node .\node_modules\eslint\bin\eslint.js .` | Pass |
| `node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests` | 25 passed, 0 failed |
| `node .\node_modules\next\dist\bin\next build` | Pass — 22/22 pages generated |

## Manual verification checklist

1. Sign in as an active administrator and open `/admin/dashboard`.
2. Confirm every count matches the corresponding Supabase table filtered by the
   same status or role.
3. Confirm pending, approved, and rejected request counts and the severity
   breakdown update after a request is reviewed or submitted.
4. Confirm volunteer, rescue team, active responder, pending, and rejected counts
   match the profiles table.
5. Confirm mission counts match `emergency_assignments.assignment_status`.
6. Confirm the newest active and completed missions appear and link to the
   mission monitor.
7. Open `/admin/assignments` and test each status filter, including closed.
8. Confirm a completed mission shows its request, responder, victim, assignment
   time, mission acceptance time, and completed status.
9. Confirm the accepted-request assignment queue still assigns a responder.
10. Confirm found missing-person reports open from the dashboard and can be
    marked found or reopened by an administrator.
11. Sign in as a victim, volunteer, rescue team member, pending account, or
    rejected account and confirm `/admin/dashboard` and
    `/admin/assignments` redirect away.
12. Confirm no administrator action can change or delete a mission record or
    missing-person record from these pages.

## Limitations

- Mission completion time is not stored separately. The monitor shows
  `assigned_at`, `accepted_at`, and the `completed` status; it does not claim a
  completion timestamp.
- Lists are capped at 100 rows, consistent with the existing admin pages. Counts
  reflect all rows visible through RLS.
- No pagination, date-range filtering, charts, CSV export, or generated reports
  were added. Those are PB-17 scope and were intentionally not implemented.
- Monitoring is request-based, not real-time. Real-time dashboard updates and
  live responder tracking remain excluded.
- Administrators cannot edit or delete completed missions or missing-person
  records. Mission status stays responder-controlled, and missing-person records
  retain the existing found/reopen workflow.
- The dashboard issues multiple exact count queries. This is appropriate for the
  current project scale; a much larger dataset would benefit from database
  aggregate views or an RPC added in a later, separately approved chunk.
