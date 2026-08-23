import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "noir_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export interface SessionData {
  email: string;
  exp: number; // unix seconds
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set. Admin authentication cannot run without it.");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
}

/**
 * Stateless session: `base64url(payload).base64url(hmacSignature)`. The
 * payload only ever contains the admin's email and an expiry — no password
 * or secret data — so signing (not encryption) is sufficient; the HttpOnly
 * flag, not confidentiality of the payload, is what keeps it out of client JS.
 */
export function createSessionToken(email: string): { token: string; expiresAt: Date } {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const data: SessionData = { email, exp };
  const payload = Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
  const signature = sign(payload);
  return { token: `${payload}.${signature}`, expiresAt: new Date(exp * 1000) };
}

export function verifySessionToken(token: string | undefined | null): SessionData | null {
  if (!token) return null;

  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex <= 0) return null;

  const payload = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  if (!payload || !signature) return null;

  let expectedSignature: string;
  try {
    expectedSignature = sign(payload);
  } catch {
    return null;
  }

  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  let data: SessionData;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof data.email !== "string" || typeof data.exp !== "number") return null;
  if (Date.now() / 1000 > data.exp) return null;

  return data;
}

const COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/admin",
};

export async function createSessionCookie(email: string): Promise<void> {
  const { token, expiresAt } = createSessionToken(email);
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, { ...COOKIE_BASE_OPTIONS, expires: expiresAt });
}

export async function deleteSessionCookie(): Promise<void> {
  const store = await cookies();
  // Overwrite with an already-expired cookie using the same attributes it
  // was set with, rather than relying on `.delete()` to guess the path.
  store.set(SESSION_COOKIE_NAME, "", { ...COOKIE_BASE_OPTIONS, maxAge: 0 });
}
