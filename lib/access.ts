import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

// Access model: no database. A paid Stripe Checkout Session ID *is* the key.
// /access?session_id=… verifies it with Stripe and sets a signed cookie.
// The same link restores access on any device, so the success page tells
// customers to bookmark it.

export const ACCESS_COOKIE = "tir_access";
const ONE_YEAR = 60 * 60 * 24 * 365;
const MAX_AGE = ONE_YEAR * 2;

function secret(): string {
  const s = process.env.ACCESS_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("ACCESS_SECRET is not set");
  return "dev-only-secret";
}

const sign = (value: string) =>
  createHmac("sha256", secret()).update(value).digest("base64url");

export function accessToken(sessionId: string): string {
  return `${sessionId}.${sign(sessionId)}`;
}

export function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 1) return null;
  const id = token.slice(0, i);
  const a = Buffer.from(token.slice(i + 1));
  const b = Buffer.from(sign(id));
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}

export function grantAccess(res: NextResponse, sessionId: string) {
  res.cookies.set(ACCESS_COOKIE, accessToken(sessionId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return res;
}

/** Returns the Checkout Session ID that unlocked access, or null. */
export async function currentAccess(): Promise<string | null> {
  return verifyToken((await cookies()).get(ACCESS_COOKIE)?.value);
}
