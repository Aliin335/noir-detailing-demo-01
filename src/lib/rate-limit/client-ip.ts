import type { NextRequest } from "next/server";

/**
 * NextRequest has no reliable `.ip` off Vercel — Render's proxy sets
 * `x-forwarded-for` instead. Takes the left-most (originating client)
 * address. Falls back to a shared "unknown" bucket if the header is absent
 * rather than throwing — a degraded shared rate limit, not a crash.
 */
export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (!xff) return "unknown";
  const ip = xff.split(",")[0]?.trim();
  return ip || "unknown";
}
