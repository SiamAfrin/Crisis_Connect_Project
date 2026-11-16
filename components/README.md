# Components

Reusable React components belong in this directory.

Organisation:

- `components/ui/` — buttons, fields, badges, icons, page headers, and other layout primitives.
- `components/auth/` — registration and login forms.
- `components/admin/` — monitoring stat cards, mission cards, responder approval, request review, and assignment cards and actions.
- `components/missing-persons/` — missing person report form, optional photo field and display, cards, status badge, and status controls.
- `components/requests/` — emergency request forms, victim and responder cards, victim status panels, accept and mission status actions, assignment cards, and status badges.
- `components/responder/` — the shared responder dashboard.
- `components/profile/` — the profile form.

Components should stay presentational where practical. Server-side authorization
must remain in Server Actions, Route Handlers, database policies, and other
server-only code rather than being enforced only by hidden UI.
