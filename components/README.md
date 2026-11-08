# Components

Reusable React components belong in this directory.

Suggested organisation for the next chunks:

- `components/ui/` — buttons, fields, badges, cards, and layout primitives.
- `components/auth/` — registration, login, and account-status components.
- `components/admin/` — responder approval and emergency request review cards and actions.
- `components/requests/` — Chunk 4 emergency request forms, victim cards, approved-request card, and status badges.
- `components/responder/` — assignment and acceptance components (Chunk 5).

Components should stay presentational where practical. Server-side authorization
must remain in Server Actions, Route Handlers, database policies, and other
server-only code rather than being enforced only by hidden UI.
