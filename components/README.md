# Components

Reusable React components belong in this directory.

Organisation:

- `components/ui/` — buttons, fields, badges, icons, page headers, stat cards, and other layout primitives.
- `components/auth/` — registration and login forms.
- `components/admin/` — responder approval, request review, and assignment cards and actions.
- `components/requests/` — emergency request forms, victim and responder cards, accept actions, assignment cards, and status badges.
- `components/responder/` — the shared responder dashboard.
- `components/profile/` — the profile form.

Components should stay presentational where practical. Server-side authorization
must remain in Server Actions, Route Handlers, database policies, and other
server-only code rather than being enforced only by hidden UI.
