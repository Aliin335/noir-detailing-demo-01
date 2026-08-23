// Generates an ADMIN_PASSWORD_HASH value for .env — never put the plaintext
// password itself into source control.
//
// Usage:
//   npm run auth:hash-password -- "your-password-here"
import { hashPassword } from "../src/lib/auth/password";

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run auth:hash-password -- "your-password-here"');
  process.exit(1);
}

console.log(hashPassword(password));
