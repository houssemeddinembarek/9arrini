import { cookies } from "next/headers";
import { verifyToken, type JWTPayload } from "./jwt";

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

export async function requireRole(role: "teacher" | "admin"): Promise<JWTPayload> {
  const session = await requireAuth();
  if (session.role !== role && session.role !== "admin") {
    throw new Error("Forbidden");
  }
  return session;
}
