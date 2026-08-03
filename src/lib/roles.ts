// Roles are stored on the user document and copied into the JWT.
// "superadmin" is granted manually from the database — nothing in the app
// promotes a user to it. A superadmin is a strict superset of "admin":
// every admin check must also pass for a superadmin.
export type Role = "student" | "teacher" | "admin" | "parent" | "superadmin";

export const ROLES: Role[] = ["student", "teacher", "admin", "parent", "superadmin"];

// Roles allowed anywhere the app says "admins only".
export const ADMIN_ROLES = ["admin", "superadmin"] as const;

export function isSuperAdmin(role?: string | null): boolean {
  return role === "superadmin";
}

export function isAdmin(role?: string | null): boolean {
  return role === "admin" || role === "superadmin";
}

export function isTeacher(role?: string | null): boolean {
  return role === "teacher";
}

// Mongo filter for "every account that can act as an admin" — used when
// fanning out admin notifications.
export const ADMIN_ROLE_QUERY = { role: { $in: ADMIN_ROLES } };

// A superadmin outranks everyone; an admin outranks non-admins only.
// Used to decide whether an actor may modify or delete a target user.
export function canManageUser(actorRole?: string | null, targetRole?: string | null): boolean {
  if (isSuperAdmin(actorRole)) return true;
  if (!isAdmin(actorRole)) return false;
  return !isAdmin(targetRole);
}
