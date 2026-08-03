import { cookies } from "next/headers";
import { verifyToken, type JWTPayload } from "./jwt";
import { isAdmin, isSuperAdmin } from "./roles";

export async function getServerSession(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("skillora-token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<JWTPayload> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

// Admins (and superadmins, who outrank them) satisfy every role requirement.
export async function requireRole(role: "teacher" | "admin"): Promise<JWTPayload> {
  const session = await requireAuth();
  if (session.role !== role && !isAdmin(session.role)) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function requireAdmin(): Promise<JWTPayload> {
  const session = await requireAuth();
  if (!isAdmin(session.role)) throw new Error("Forbidden");
  return session;
}

export async function requireSuperAdmin(): Promise<JWTPayload> {
  const session = await requireAuth();
  if (!isSuperAdmin(session.role)) throw new Error("Forbidden");
  return session;
}
