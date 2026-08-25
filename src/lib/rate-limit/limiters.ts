import { createRateLimiter, type RateLimiter } from "./limiter";

/**
 * Public tiers protect against abuse from the browser widget (keyed by IP);
 * trusted tiers apply once a valid AUTOMATION_API_KEY is presented (keyed by
 * the key itself). Availability is a cheap read a single conversation may
 * poll several times, so it gets more headroom than bookings, which performs
 * a real DB write. The trusted tier isn't scaled per-caller — it's one shared
 * budget for every concurrent server-to-server caller using that key.
 */
const RATE_LIMITS = {
  availabilityPublic: { windowMs: 60_000, max: 30 },
  availabilityTrusted: { windowMs: 60_000, max: 120 },
  bookingsPublic: { windowMs: 60_000, max: 5 },
  bookingsTrusted: { windowMs: 60_000, max: 20 },
  // Services is a single cheap, param-less read — same tier as availability
  // (another simple read) makes sense; it stays well above bookings, which
  // performs a real DB write.
  servicesPublic: { windowMs: 60_000, max: 30 },
  servicesTrusted: { windowMs: 60_000, max: 120 },
  // Public only — this proxies to an external, metered LLM workflow (n8n),
  // not something a trusted server-to-server caller would ever hit.
  aiMessagePublic: { windowMs: 60_000, max: 20 },
} as const;

type LimiterName = keyof typeof RATE_LIMITS;
type RateLimitOptionsEntry = (typeof RATE_LIMITS)[LimiterName];

function createLimiters(): Record<LimiterName, RateLimiter> {
  const entries = Object.entries(RATE_LIMITS) as [LimiterName, RateLimitOptionsEntry][];
  return Object.fromEntries(
    entries.map(([name, options]) => [name, createRateLimiter(options)])
  ) as Record<LimiterName, RateLimiter>;
}

const globalForRateLimit = globalThis as unknown as {
  rateLimiters?: Record<LimiterName, RateLimiter>;
};

// Reuse the same limiter instances across Next.js dev-server hot reloads, the
// same way src/lib/db/client.ts reuses its Prisma client — otherwise every
// reload would reset (and leak) everyone's in-flight rate-limit counters.
export const rateLimiters = globalForRateLimit.rateLimiters ?? createLimiters();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.rateLimiters = rateLimiters;
}
