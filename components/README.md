# Components

Reusable React components belong in this directory.

Suggested organisation for the next chunks:

- `components/ui/` — buttons, fields, badges, cards, and layout primitives.
- `components/auth/` — registration, login, and account-status components.
- `components/admin/` — user approval and request-review components.
- `components/emergency/` — request forms and request cards.
- `components/responder/` — assignment and acceptance components.

Components should stay presentational where practical. Server-side authorization
must remain in Server Actions, Route Handlers, database policies, and other
server-only code rather than being enforced only by hidden UI.
