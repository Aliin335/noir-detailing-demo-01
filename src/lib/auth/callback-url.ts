/**
 * Restricts post-login redirects to same-site paths under /admin, so a
 * crafted `?callbackUrl=` query param can't be used as an open redirect.
 */
export function sanitizeCallbackUrl(raw: string | null | undefined): string {
  if (!raw) return "/admin";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/admin";
  if (raw.includes("://")) return "/admin";
  if (!raw.startsWith("/admin")) return "/admin";
  return raw;
}
