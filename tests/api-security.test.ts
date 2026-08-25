import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as getAvailability } from "@/app/api/availability/route";
import { POST as createBooking } from "@/app/api/bookings/route";
import { GET as getServices } from "@/app/api/services/route";
import { clearBookings, seedTestServices, validBookingInput } from "./helpers";

// Same fixed "now" used by availability.test.ts / bookings.test.ts, so dates
// below fall on a real weekday within business hours.
const FIXED_NOW = new Date("2026-08-19T09:00:00.000Z"); // Wed 2026-08-19 10:00 Dublin
const TOMORROW = "2026-08-20";

// Each test uses its own synthetic IP (and, where relevant, its own unique
// API key) so it gets a fresh rate-limit bucket — the limiters are real
// module-level singletons shared across this whole (non-parallel) file.
let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `10.99.0.${ipCounter}`;
}

function availabilityRequest(opts: { ip: string; auth?: string; params?: Record<string, string> }): NextRequest {
  const params = new URLSearchParams(opts.params ?? { date: TOMORROW, serviceId: "full-detail" });
  const headers = new Headers({ "x-forwarded-for": opts.ip });
  if (opts.auth) headers.set("authorization", opts.auth);
  return new NextRequest(`http://localhost/api/availability?${params.toString()}`, { headers });
}

function servicesRequest(opts: { ip: string; auth?: string }): NextRequest {
  const headers = new Headers({ "x-forwarded-for": opts.ip });
  if (opts.auth) headers.set("authorization", opts.auth);
  return new NextRequest("http://localhost/api/services", { headers });
}

function bookingRequest(opts: { ip: string; auth?: string; body?: unknown }): NextRequest {
  const headers = new Headers({ "x-forwarded-for": opts.ip, "content-type": "application/json" });
  if (opts.auth) headers.set("authorization", opts.auth);
  return new NextRequest("http://localhost/api/bookings", {
    method: "POST",
    headers,
    body: JSON.stringify(opts.body ?? {}), // {} is intentionally invalid input — see wiring-test notes below
  });
}

describe("API security wiring", () => {
  beforeAll(async () => {
    await seedTestServices();
  });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    await clearBookings();
  });

  describe("GET /api/availability", () => {
    it("under the public limit, no header -> 200 with the unchanged response shape", async () => {
      const res = await getAvailability(availabilityRequest({ ip: nextIp() }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({ date: TOMORROW, serviceId: "full-detail" });
      expect(Array.isArray(body.slots)).toBe(true);
    });

    it("one request over the public limit, no header -> 429 with Retry-After", async () => {
      const ip = nextIp();
      // Public availability limit is 30/min. Use an invalid query (no DB
      // hit) for the allowed requests — only the wiring is under test here.
      for (let i = 0; i < 30; i++) {
        const res = await getAvailability(availabilityRequest({ ip, params: {} }));
        expect(res.status).toBe(400); // INVALID_INPUT, not rate-limited yet
      }
      const blocked = await getAvailability(availabilityRequest({ ip, params: {} }));
      expect(blocked.status).toBe(429);
      expect(blocked.headers.get("Retry-After")).toMatch(/^\d+$/);
      const body = await blocked.json();
      expect(body.error).toBe("RATE_LIMITED");
    });

    it("a correct key allows more requests than the public limit", async () => {
      const key = `test-key-availability-${Math.random()}`;
      vi.stubEnv("AUTOMATION_API_KEY", key);
      const ip = nextIp();
      // 31 requests would 429 on the public limiter (max 30); with a valid
      // key it should keep returning past the public ceiling.
      for (let i = 0; i < 31; i++) {
        const res = await getAvailability(
          availabilityRequest({ ip, auth: `Bearer ${key}`, params: {} })
        );
        expect(res.status).toBe(400); // still just INVALID_INPUT, never 429
      }
    });

    it("wrong key -> 401 UNAUTHORIZED", async () => {
      vi.stubEnv("AUTOMATION_API_KEY", "correct-key");
      const res = await getAvailability(
        availabilityRequest({ ip: nextIp(), auth: "Bearer wrong-key" })
      );
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("UNAUTHORIZED");
    });

    it("wrong key repeated past the public threshold -> 429, not 401, once it crosses", async () => {
      vi.stubEnv("AUTOMATION_API_KEY", "correct-key");
      const ip = nextIp();
      for (let i = 0; i < 30; i++) {
        const res = await getAvailability(
          availabilityRequest({ ip, auth: "Bearer wrong-key", params: {} })
        );
        expect(res.status).toBe(401);
      }
      const blocked = await getAvailability(
        availabilityRequest({ ip, auth: "Bearer wrong-key", params: {} })
      );
      expect(blocked.status).toBe(429);
    });
  });

  describe("POST /api/bookings", () => {
    it("under the public limit, no header -> 201 with the unchanged response shape", async () => {
      const res = await createBooking(
        bookingRequest({ ip: nextIp(), body: validBookingInput({ date: TOMORROW, startTime: "10:00" }) })
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.booking).toMatchObject({ date: TOMORROW, startTime: "10:00" });
    });

    it("one request over the public limit, no header -> 429 with Retry-After", async () => {
      const ip = nextIp();
      // Public bookings limit is 5/min. An empty body (invalid input, no DB
      // write) is enough to exercise just the rate-limit wiring.
      for (let i = 0; i < 5; i++) {
        const res = await createBooking(bookingRequest({ ip, body: {} }));
        expect(res.status).toBe(400); // INVALID_INPUT, not rate-limited yet
      }
      const blocked = await createBooking(bookingRequest({ ip, body: {} }));
      expect(blocked.status).toBe(429);
      expect(blocked.headers.get("Retry-After")).toMatch(/^\d+$/);
      const body = await blocked.json();
      expect(body.error).toBe("RATE_LIMITED");
    });

    it("a correct key allows more requests than the public limit", async () => {
      const key = `test-key-bookings-${Math.random()}`;
      vi.stubEnv("AUTOMATION_API_KEY", key);
      const ip = nextIp();
      // 6 requests would 429 on the public limiter (max 5); with a valid
      // key it should keep returning past the public ceiling.
      for (let i = 0; i < 6; i++) {
        const res = await createBooking(bookingRequest({ ip, auth: `Bearer ${key}`, body: {} }));
        expect(res.status).toBe(400); // still just INVALID_INPUT, never 429
      }
    });

    it("wrong key -> 401 UNAUTHORIZED", async () => {
      vi.stubEnv("AUTOMATION_API_KEY", "correct-key");
      const res = await createBooking(bookingRequest({ ip: nextIp(), auth: "Bearer wrong-key" }));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("UNAUTHORIZED");
    });

    it("wrong key repeated past the public threshold -> 429, not 401, once it crosses", async () => {
      vi.stubEnv("AUTOMATION_API_KEY", "correct-key");
      const ip = nextIp();
      for (let i = 0; i < 5; i++) {
        const res = await createBooking(bookingRequest({ ip, auth: "Bearer wrong-key", body: {} }));
        expect(res.status).toBe(401);
      }
      const blocked = await createBooking(bookingRequest({ ip, auth: "Bearer wrong-key", body: {} }));
      expect(blocked.status).toBe(429);
    });
  });

  describe("GET /api/services", () => {
    it("returns only active services, with the exact expected shape", async () => {
      const res = await getServices(servicesRequest({ ip: nextIp() }));
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(Array.isArray(body.services)).toBe(true);
      const ids = body.services.map((s: { id: string }) => s.id);
      expect(ids).toEqual(expect.arrayContaining(["essential-detail", "full-detail"]));
      expect(ids).not.toContain("inactive-service"); // seeded inactive by seedTestServices

      const fullDetail = body.services.find((s: { id: string }) => s.id === "full-detail");
      expect(fullDetail).toEqual({
        id: "full-detail",
        name: "Full Detail",
        description: "test",
        price: 180,
        durationMinutes: 180,
      });
      // No `active` field or any other DB-internal detail leaked.
      expect(Object.keys(fullDetail).sort()).toEqual(
        ["description", "durationMinutes", "id", "name", "price"].sort()
      );
    });

    it("under the public limit, no header -> 200", async () => {
      const res = await getServices(servicesRequest({ ip: nextIp() }));
      expect(res.status).toBe(200);
    });

    it("one request over the public limit, no header -> 429 with Retry-After", async () => {
      const ip = nextIp();
      // Public services limit is 30/min. Every allowed request is a real
      // (cheap) DB read since there's no invalid-input path to short-circuit.
      for (let i = 0; i < 30; i++) {
        const res = await getServices(servicesRequest({ ip }));
        expect(res.status).toBe(200);
      }
      const blocked = await getServices(servicesRequest({ ip }));
      expect(blocked.status).toBe(429);
      expect(blocked.headers.get("Retry-After")).toMatch(/^\d+$/);
      const body = await blocked.json();
      expect(body.error).toBe("RATE_LIMITED");
    });

    it("a correct key allows more requests than the public limit", async () => {
      const key = `test-key-services-${Math.random()}`;
      vi.stubEnv("AUTOMATION_API_KEY", key);
      const ip = nextIp();
      // 31 requests would 429 on the public limiter (max 30); with a valid
      // key it should keep returning 200 past the public ceiling.
      for (let i = 0; i < 31; i++) {
        const res = await getServices(servicesRequest({ ip, auth: `Bearer ${key}` }));
        expect(res.status).toBe(200);
      }
    });

    it("wrong key -> 401 UNAUTHORIZED", async () => {
      vi.stubEnv("AUTOMATION_API_KEY", "correct-key");
      const res = await getServices(servicesRequest({ ip: nextIp(), auth: "Bearer wrong-key" }));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("UNAUTHORIZED");
    });

    it("wrong key repeated past the public threshold -> 429, not 401, once it crosses", async () => {
      vi.stubEnv("AUTOMATION_API_KEY", "correct-key");
      const ip = nextIp();
      for (let i = 0; i < 30; i++) {
        const res = await getServices(servicesRequest({ ip, auth: "Bearer wrong-key" }));
        expect(res.status).toBe(401);
      }
      const blocked = await getServices(servicesRequest({ ip, auth: "Bearer wrong-key" }));
      expect(blocked.status).toBe(429);
    });

    it("rejects non-GET methods", async () => {
      const { POST, PUT, PATCH, DELETE } = (await import(
        "@/app/api/services/route"
      )) as Record<string, unknown>;
      expect(POST).toBeUndefined();
      expect(PUT).toBeUndefined();
      expect(PATCH).toBeUndefined();
      expect(DELETE).toBeUndefined();
    });
  });
});
