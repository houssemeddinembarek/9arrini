import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { isAdmin } from "@/lib/roles";

const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

const PROTECTED_PREFIXES = ["/dashboard", "/teacher", "/admin", "/parent", "/profile", "/ai-assistant", "/bookings"];

// Students have no dashboard of their own — their hub is the profile screen.
function homeFor(role?: string) {
  if (isAdmin(role)) return "/admin";
  if (role === "parent") return "/parent";
  if (role === "teacher") return "/teacher";
  return "/profile";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("skillora-token")?.value;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isAuthPath && token) {
    try {
      const payload = verifyToken(token);
      return NextResponse.redirect(new URL(homeFor(payload.role), request.url));
    } catch {
      // token invalid, let them through
    }
  }

  // Sign-up is split per role: /register is the role chooser, each actor has
  // its own page underneath it. Marketing CTAs and older invitations point at
  // /register?role=…&code=… — send those straight to the right form.
  if (pathname === "/register") {
    const role = request.nextUrl.searchParams.get("role");
    if (role === "parent" || role === "teacher" || role === "student") {
      const target = new URL(`/register/${role}`, request.url);
      const code = request.nextUrl.searchParams.get("code");
      if (code) target.searchParams.set("code", code);
      return NextResponse.redirect(target);
    }
  }

  if (isProtected) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    try {
      const payload = verifyToken(token);

      // Bare /dashboard no longer exists — send everyone to their hub.
      if (pathname === "/dashboard") {
        return NextResponse.redirect(new URL(homeFor(payload.role), request.url));
      }
      // Superadmins outrank admins and are allowed everywhere, so every gate
      // below is expressed as "is this role allowed", never "is it exactly X".
      if (pathname.startsWith("/admin") && !isAdmin(payload.role)) {
        return NextResponse.redirect(new URL(homeFor(payload.role), request.url));
      }
      if (pathname.startsWith("/teacher") && payload.role === "student") {
        return NextResponse.redirect(new URL(homeFor(payload.role), request.url));
      }
      if (pathname.startsWith("/parent") && payload.role !== "parent" && !isAdmin(payload.role)) {
        return NextResponse.redirect(new URL(homeFor(payload.role), request.url));
      }

      const response = NextResponse.next();
      response.headers.set("x-user-id", payload.userId);
      response.headers.set("x-user-role", payload.role);
      return response;
    } catch {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("skillora-token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
