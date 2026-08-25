export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms
  retryAfterSeconds: number; // 0 when allowed
}

export interface RateLimiter {
  check(key: string): RateLimitResult;
}

type Bucket = { count: number; resetAt: number };

/** Caps how many distinct keys (IPs/API keys) a limiter tracks at once, evicting
 * the oldest bucket first — bounds memory growth on a long-lived process without
 * needing a background sweep. */
const MAX_BUCKETS = 5000;

/** Fixed-window in-memory rate limiter. Each `check(key)` call increments that
 * key's counter within the current window and reports whether it's still under
 * `max`. Framework-agnostic and side-effect-free besides its own Map, so it's
 * fully unit-testable with fake timers. */
export function createRateLimiter({ windowMs, max }: RateLimitOptions): RateLimiter {
  const buckets = new Map<string, Bucket>();

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      let bucket = buckets.get(key);

      if (!bucket || now >= bucket.resetAt) {
        bucket = { count: 0, resetAt: now + windowMs };
        buckets.delete(key); // re-insert below so it's ordered last (insertion order = recency)
        if (buckets.size >= MAX_BUCKETS) {
          const oldestKey = buckets.keys().next().value;
          if (oldestKey !== undefined) buckets.delete(oldestKey);
        }
        buckets.set(key, bucket);
      }

      bucket.count += 1;
      const allowed = bucket.count <= max;

      return {
        allowed,
        remaining: Math.max(0, max - bucket.count),
        resetAt: bucket.resetAt,
        retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      };
    },
  };
}
