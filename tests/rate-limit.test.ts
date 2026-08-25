import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit/limiter";

const FIXED_NOW = new Date("2026-08-19T09:00:00.000Z");

describe("rate limiter", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 3 });
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(true);
  });

  it("blocks the request that pushes the count over max", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 2 });
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(true);
    const blocked = limiter.check("a");
    expect(blocked.allowed).toBe(false);
  });

  it("reports a positive integer retryAfterSeconds consistent with the window", () => {
    const limiter = createRateLimiter({ windowMs: 30_000, max: 1 });
    limiter.check("a");
    const blocked = limiter.check("a");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(30);
    expect(Number.isInteger(blocked.retryAfterSeconds)).toBe(true);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets the window once resetAt has passed", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(false);

    vi.setSystemTime(new Date(FIXED_NOW.getTime() + 60_001));

    expect(limiter.check("a").allowed).toBe(true);
  });

  it("tracks different keys independently", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(false); // "a" is now exhausted
    expect(limiter.check("b").allowed).toBe(true); // "b" is unaffected
  });

  it("decreases remaining correctly as requests are consumed", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 3 });
    expect(limiter.check("a").remaining).toBe(2);
    expect(limiter.check("a").remaining).toBe(1);
    expect(limiter.check("a").remaining).toBe(0);
    expect(limiter.check("a").remaining).toBe(0); // never goes negative
  });
});
