import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// No "server-only" guard here: this module is pure, stateless scrypt
// hashing (no secrets, no env access) and is also imported by the
// standalone scripts/hash-admin-password.mts CLI script outside of Next's
// bundler. The modules that actually read auth secrets/env vars
// (credentials.ts, session.ts) carry the "server-only" guard instead.

const KEY_LENGTH = 64;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

/**
 * Self-describing hash format so the scrypt cost parameters can change later
 * without invalidating hashes already stored in ADMIN_PASSWORD_HASH:
 * scrypt:N:r:p:saltBase64:hashBase64
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt:${SCRYPT_N}:${SCRYPT_R}:${SCRYPT_P}:${salt.toString("base64")}:${derivedKey.toString("base64")}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }

  const [, nRaw, rRaw, pRaw, saltB64, hashB64] = parts;
  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return false;
  }

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltB64, "base64");
    expected = Buffer.from(hashB64, "base64");
  } catch {
    return false;
  }
  if (expected.length === 0) {
    return false;
  }

  const actual = scryptSync(password, salt, expected.length, { N, r, p });
  return timingSafeEqual(expected, actual);
}
