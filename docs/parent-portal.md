# Parent Portal

Read-only portal that lets a **parent** follow their children's progress. Built on
the existing auth (JWT), dashboard layout + role-based `Sidebar`, notification
system, and UI primitives — no new model was introduced (the `User` model was
extended).

## Roles & linking

- New role: `parent` (added to `User.role`, JWT payload, and the auth store).
- **Many-to-many** link: a parent stores `children: ObjectId[]`; a student stores a
  `linkCode` (unguessable 8-char code, unique-indexed).
- **Flow (administration-driven):** the code belongs to the administration, not to
  the student — **a student never sees their own code**. An admin opens
  `/admin/users` → student row → *View details* → reads the code, then emails it
  (or the pre-filled sign-up link) to the parent. The parent registers at
  `/register/parent`, where the code is redeemed on sign-up; they can also enter
  it later from `/parent`. A parent can link several children; a child can be
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
| `/api/admin/users/[id]/link-code` | GET / POST | admin | read (GET) / rotate (POST) a student's code + list linked parents |
| `/api/admin/users/[id]/invite-parent` | POST | admin | email the parent a pre-filled invite (`/register/parent?code=…`) |
| `/api/parent/link` | POST | parent | redeem a code → add child to `children` (notifies the child) |
| `/api/parent/children` | GET | parent | list linked children + quick stats |
| `/api/parent/children/[id]` | GET | parent + **owns child** | full report (grades, courses, quizzes, assignments, meetings, attendance) |
| `/api/parent/children/[id]` | DELETE | parent | unlink a child |
| `/api/meetings/[id]/attendance` | GET / POST | teacher (meeting owner) | read roster + marks / save attendance |

Shared helper: `src/lib/link-code.ts` (`makeLinkCode`, `generateUniqueLinkCode`).

## Attendance

New `Attendance` model — one mark per `(meeting, student)`: `present | late | absent`,
`recordedBy`. Teachers take attendance from the **calendar meeting modal → "Présences"**
(`/teacher/meetings/[id]/attendance`, roster = the meeting's `students`). Parents see
each child's marks + a present/total tile on the child report.

## Linking options

Both start with an admin reading the code from the student's detail dialog:

1. **Code** — the admin passes the code to the parent, who enters it at sign-up or
   later in `/parent`.
2. **Email** — the admin sends the invite from the same dialog; the parent clicks
   through to `/register/parent?code=…`, which redeems the code on sign-up.

Rotating the code (same dialog) invalidates the old one without unlinking parents
who are already attached.

**Security:** every parent route checks `session.role === "parent"`; the report/unlink
routes additionally verify the child is in the caller's `children` (IDOR guard).
Parents are read-only — the only writes are linking/unlinking their own children.

## UI

- `src/app/(dashboard)/parent/page.tsx` — overview: add-by-code + children cards.
- `src/app/(dashboard)/parent/children/[id]/page.tsx` — per-child report (4 sections).
- `src/app/(dashboard)/admin/users/page.tsx` — student detail dialog holds the code
  (copy / rotate / email to the parent) and the list of linked parents.
- Sign-up is split per role: `/register` (student), `/register/teacher`,
  `/register/parent` — all three render `src/components/auth/register-form.tsx`.
  Login/register/social redirect parents to `/parent`.

## Not included (future)

Parent↔teacher messaging (waits on the Messaging module).
