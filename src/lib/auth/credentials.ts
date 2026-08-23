import "server-only";

export interface AdminCredentials {
  email: string;
  passwordHash: string;
}

/**
 * Reads the single demo admin account from environment variables. Throws
 * (fail-closed) rather than falling back to a default, so a missing
 * configuration can never silently accept any credentials.
 */
export function getAdminCredentials(): AdminCredentials {
  const email = process.env.ADMIN_EMAIL;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!email || !passwordHash) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD_HASH must be set to enable admin authentication."
    );
  }

  return { email: email.trim().toLowerCase(), passwordHash };
}
