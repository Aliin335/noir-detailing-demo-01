import "server-only";
import type { NextRequest } from "next/server";
import { appError } from "@/lib/errors";
import { SESSION_COOKIE_NAME, verifySessionToken, type SessionData } from "./session";

/**
 * Session check for admin *API routes* (as opposed to admin *pages*, which
 * use requireAdmin() in dal.ts). Reads the session cookie directly off the
 * NextRequest — the same technique src/proxy.ts uses — instead of via
 * next/headers' cookies(), because next/headers requires a real Next.js
 * request-processing context that doesn't exist when a route handler is
 * called directly in a test. This is not a new auth mechanism: it calls the
 * exact same verifySessionToken()/SESSION_COOKIE_NAME that create the
 * session cookie at login — just a different call site for reading it.
 *
 * Deliberately does NOT accept AUTOMATION_API_KEY / Authorization header —
 * admin mutations are a separate trust boundary from n8n/public callers.
 */
export function requireAdminSession(request: NextRequest): SessionData {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) {
    throw appError("UNAUTHORIZED", "Admin session required.");
  }
  return session;
}
