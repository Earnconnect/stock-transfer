// Session helpers usable from both the Edge middleware and Node server.
// Only depends on `jose` (edge-safe). No Prisma here.
import { SignJWT, jwtVerify } from "jose";

if (!process.env.AUTH_SECRET && process.env.NODE_ENV === "production") {
  // Fail loudly rather than signing sessions with a guessable default in prod.
  throw new Error("AUTH_SECRET is not set. Set it in your environment before deploying.");
}

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "insecure-dev-secret-please-set-AUTH_SECRET"
);
export const COOKIE_NAME = "meridian_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function signSession(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(SECRET);
}

export async function verifySession(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload; // { sub, email, name, role }
  } catch {
    return null;
  }
}

export const cookieOptions = {
  name: COOKIE_NAME,
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: MAX_AGE,
  secure: process.env.NODE_ENV === "production",
};
