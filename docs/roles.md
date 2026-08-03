# Roles

Roles live on the user document (`users.role`) and are copied into the JWT at
login, so a role change only takes effect after the user signs in again.

| Role | Where it comes from | Scope |
| --- | --- | --- |
| `student` | signup | own courses, classes, quizzes, meetings |
| `teacher` | signup (needs admin approval) | own teaching space |
| `parent` | signup, linked to a child by code | children's reports |
| `admin` | granted by a super admin | admin dashboard, all non-admin users |
| `superadmin` | **set manually in the database** | everything, admins included |

## Granting super admin

Nothing in the app hands out `superadmin` — the API rejects it explicitly. Set
it directly on the document:

```js
// mongosh
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "superadmin" } })
```

The user must log out and log back in for the new role to reach their token.

## Rules the code enforces

All checks go through `src/lib/roles.ts` — never compare `role === "admin"`
by hand, because that silently locks super admins out.

- `isAdmin(role)` — true for `admin` **and** `superadmin`. Every "admins only"
  gate (API routes, `src/proxy.ts`, dashboard links) uses this.
- `isSuperAdmin(role)` — true for `superadmin` only.
- `canManageUser(actor, target)` — a super admin may act on anyone; a plain
  admin may only act on non-admin accounts.
- `ADMIN_ROLE_QUERY` — the Mongo filter for "notify every admin", so super
  admins receive admin notifications too.

Concretely: a plain admin cannot delete, edit, or demote an `admin` or
`superadmin`, and cannot grant admin rights. A super admin can delete or demote
any account except their own, and reaches the teacher and parent spaces from
their sidebar.
