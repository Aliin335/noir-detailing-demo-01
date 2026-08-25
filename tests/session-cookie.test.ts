import { describe, expect, it } from "vitest";
import { COOKIE_BASE_OPTIONS } from "@/lib/auth/session";

/**
 * RFC 6265 §5.1.4 path-match: a cookie is attached to a request if the
 * cookie's Path is a prefix of the request path, ending exactly at the
 * cookie path itself or at a "/" boundary. Reimplemented here (not
 * imported from application code) so this test independently verifies the
 * real browser rule, rather than trusting the fix's own reasoning.
 *
 * This is the regression this file guards against: the admin session
 * cookie was previously scoped to path "/admin". A real browser correctly
 * sent it on /admin/services (page load — path matches), but silently
 * withheld it from fetch() calls to /api/admin/services (mutation routes —
 * path does NOT match "/admin"), so admin create/edit/toggle all looked
 * unauthenticated with no visible cause. Route-level tests that set the
 * Cookie header directly on a constructed NextRequest (see
 * tests/admin-services-api.test.ts) never exercise this — they bypass real
 * cookie-path matching entirely — which is exactly why that bug shipped
 * past them.
 */
function cookieSentOn(cookiePath: string, requestPath: string): boolean {
  if (!requestPath.startsWith(cookiePath)) return false;
  return (
    requestPath.length === cookiePath.length ||
    cookiePath.endsWith("/") ||
    requestPath[cookiePath.length] === "/"
  );
}

const ADMIN_MUTATION_PATHS = [
  "/api/admin/services",
  "/api/admin/services/full-detail",
  "/api/admin/services/full-detail/active",
];
const ADMIN_PAGE_PATHS = ["/admin", "/admin/services", "/admin/appointments"];

describe("admin session cookie path", () => {
  it("is sent on every /api/admin/... mutation route", () => {
    for (const path of ADMIN_MUTATION_PATHS) {
      expect(cookieSentOn(COOKIE_BASE_OPTIONS.path, path)).toBe(true);
    }
  });

  it("is still sent on admin pages", () => {
    for (const path of ADMIN_PAGE_PATHS) {
      expect(cookieSentOn(COOKIE_BASE_OPTIONS.path, path)).toBe(true);
    }
  });

  it("documents the bug: the old path: \"/admin\" scoping would NOT have sent the cookie to mutation routes", () => {
    const oldBuggyPath = "/admin";
    for (const path of ADMIN_MUTATION_PATHS) {
      expect(cookieSentOn(oldBuggyPath, path)).toBe(false);
    }
    // ...while still (correctly) matching the page routes, which is exactly
    // why the bug was invisible from the page loading fine.
    for (const path of ADMIN_PAGE_PATHS) {
      expect(cookieSentOn(oldBuggyPath, path)).toBe(true);
    }
  });
});
