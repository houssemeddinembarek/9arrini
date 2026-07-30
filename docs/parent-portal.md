# Parent Portal

Read-only portal that lets a **parent** follow their children's progress. Built on
the existing auth (JWT), dashboard layout + role-based `Sidebar`, notification
system, and UI primitives — no new model was introduced (the `User` model was
extended).

## Roles & linking

- New role: `parent` (added to `User.role`, JWT payload, and the auth store).
- **Many-to-many** link: a parent stores `children: ObjectId[]`; a student stores a
  `linkCode` (unguessable 8-char code, unique-indexed).
- **Flow:** a student opens their profile → "Inviter un parent" → shares the code.
  A parent registers (role = parent, auto-approved) → `/parent` → "Lier un enfant"
  → enters the code → linked. A parent can link several children; a child can be
  followed by several parents.

## Data model (`src/models/User.ts`)

| Field | Type | For |
|---|---|---|
| `role` | `+ "parent"` | all |
| `children` | `ObjectId[]` (ref User) | parent → linked students |
| `linkCode` | `string` (indexed, sparse) | student's share code |

## APIs

| Route | Method | Guard | Purpose |
|---|---|---|---|
| `/api/student/link-code` | GET / POST | student | read (GET) / rotate (POST) the share code |
| `/api/parent/link` | POST | parent | redeem a code → add child to `children` (notifies the child) |
| `/api/parent/children` | GET | parent | list linked children + quick stats |
| `/api/parent/children/[id]` | GET | parent + **owns child** | full report (grades, courses, quizzes, assignments, meetings) |
| `/api/parent/children/[id]` | DELETE | parent | unlink a child |

**Security:** every parent route checks `session.role === "parent"`; the report/unlink
routes additionally verify the child is in the caller's `children` (IDOR guard).
Parents are read-only — the only writes are linking/unlinking their own children.

## UI

- `src/app/(dashboard)/parent/page.tsx` — overview: add-by-code + children cards.
- `src/app/(dashboard)/parent/children/[id]/page.tsx` — per-child report (4 sections).
- `src/components/parent/link-parent-card.tsx` — student profile "Inviter un parent".
- Register page gains a Parent role option; login/register/social redirect parents to `/parent`.

## Not included (future)

Parent↔teacher messaging (waits on the Messaging module), attendance section,
email-invite linking.
