"use server";

import { redirect } from "next/navigation";
import { sanitizeCallbackUrl } from "./callback-url";
import { getAdminCredentials } from "./credentials";
import { verifyPassword } from "./password";
import { createSessionCookie, deleteSessionCookie } from "./session";

export interface LoginState {
  error: string | null;
}

const GENERIC_ERROR: LoginState = { error: "Invalid credentials." };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = sanitizeCallbackUrl(String(formData.get("callbackUrl") ?? ""));

  if (!email || !password) {
    return GENERIC_ERROR;
  }

  let credentials;
  try {
    credentials = getAdminCredentials();
  } catch {
    // Auth not configured server-side — never reveal this to the client.
    return GENERIC_ERROR;
  }

  // Evaluate both checks unconditionally (no early return between them) so
  // a wrong email doesn't skip the password comparison and leak timing.
  const emailMatches = email === credentials.email;
  const passwordMatches = verifyPassword(password, credentials.passwordHash);

  if (!emailMatches || !passwordMatches) {
    return GENERIC_ERROR;
  }

  await createSessionCookie(credentials.email);
  redirect(callbackUrl);
}

export async function logoutAction(): Promise<void> {
  await deleteSessionCookie();
  redirect("/admin/login");
}
