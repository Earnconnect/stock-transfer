import { NextResponse } from "next/server";
import { verifySession, COOKIE_NAME } from "@/lib/session";

// Routes that do NOT require authentication.
const PUBLIC = ["/login"];

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = await verifySession(token);

  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // Logged-in users shouldn't see the login page.
  if (session && isPublic) {
    return NextResponse.redirect(new URL(session.role === "ADMIN" ? "/admin" : "/", request.url));
  }

  // Unauthenticated users are sent to login.
  if (!session && !isPublic) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  // Admin area requires the ADMIN role.
  if (pathname.startsWith("/admin") && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except static assets and Next internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
