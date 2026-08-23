import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken, type SessionData } from "./session";

/** Cached per-request so multiple components can call this without re-verifying. */
export const getCurrentAdmin = cache(async (): Promise<SessionData | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
});

/** Server-side guard for protected admin pages/layouts: redirects if there is no valid session. */
export async function requireAdmin(callbackPath: string): Promise<SessionData> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    const params = new URLSearchParams({ callbackUrl: callbackPath });
    redirect(`/admin/login?${params.toString()}`);
  }
  return admin;
}
