// Server-side auth helpers (Node runtime — uses Prisma + bcrypt).
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signSession, verifySession, cookieOptions, COOKIE_NAME } from "@/lib/session";

export async function hashPassword(pw) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw, hash) {
  return bcrypt.compare(pw, hash);
}

// Create the session cookie for a user record.
export async function createUserSession(user) {
  const token = await signSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  const store = await cookies();
  store.set({ ...cookieOptions, value: token });
}

export async function destroySession() {
  const store = await cookies();
  store.set({ ...cookieOptions, value: "", maxAge: 0 });
}

// Returns the decoded session payload, or null. Does not hit the DB.
export async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return verifySession(token);
}

// Returns the full user from the DB for the current session, or null.
export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.sub) return null;
  return prisma.user.findUnique({ where: { id: session.sub } });
}

// Like getCurrentUser, but redirects to /login if there is no live user
// record (e.g. a stale cookie after the account was removed). Guarantees a
// non-null return for page components.
export async function requireUserRecord() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Guard helpers for server components / actions.
export async function requireUser() {
  const session = await getSession();
  if (!session?.sub) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session?.sub) redirect("/login");
  if (session.role !== "ADMIN") redirect("/");
  return session;
}
