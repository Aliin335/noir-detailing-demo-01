import "server-only";
import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export type ApiKeyCheck = "valid" | "invalid" | "absent";

/** Parses an `Authorization: Bearer <token>` header. Case-insensitive on the
 * scheme, trims surrounding whitespace from the token. */
export function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return null;
  const token = match[1].trim();
  return token || null;
}

/**
 * Checks a request's Authorization header against AUTOMATION_API_KEY, the
 * shared secret trusted server-to-server callers (e.g. the future n8n
 * workflow) use to identify themselves.
 *
 * - No header at all -> "absent": today's public/unauthenticated flow,
 *   left untouched by this check.
 * - A header is present but AUTOMATION_API_KEY isn't configured server-side,
 *   or the value doesn't match -> "invalid". Fails closed rather than
 *   silently downgrading a presented-but-unverifiable credential to public,
 *   mirroring AUTH_SECRET's fail-closed precedent in session.ts.
 * - A header is present and matches -> "valid".
 */
export function checkAutomationApiKey(request: NextRequest): ApiKeyCheck {
  const provided = getBearerToken(request);
  if (!provided) return "absent";

  const expected = process.env.AUTOMATION_API_KEY;
  if (!expected) return "invalid";

  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return "invalid";
  return timingSafeEqual(providedBuf, expectedBuf) ? "valid" : "invalid";
}
