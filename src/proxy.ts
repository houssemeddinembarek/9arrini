import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

const PROTECTED_PREFIXES = ["/dashboard", "/teacher", "/admin", "/profile", "/ai-assistant", "/bookings"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("skillora-token")?.value;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isAuthPath && token) {
    try {
      verifyToken(token);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch {
      // token invalid, let them through
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

      if (pathname.startsWith("/admin") && payload.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (pathname.startsWith("/teacher") && payload.role === "student") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
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
