import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/client";
import { getAvailableSlots } from "@/lib/availability/slots";
import { AppError } from "@/lib/errors";
import { clearBookings, seedTestServices } from "./helpers";

// Wednesday 2026-08-19, 10:00 Europe/Dublin (IST, UTC+1) = 09:00 UTC.
const FIXED_NOW = new Date("2026-08-19T09:00:00.000Z");
const TOMORROW = "2026-08-20"; // Thursday
const PAST_DATE = "2026-08-18"; // Tuesday, before FIXED_NOW
const FUTURE_SUNDAY = "2026-08-23";

describe("availability", () => {
  beforeAll(async () => {
    await seedTestServices();
  });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(async () => {
    vi.useRealTimers();
    await clearBookings();
  });

  it("1. returns a normal available slot with no conflicts", async () => {
    const slots = await getAvailableSlots(TOMORROW, "full-detail");
    expect(slots.length).toBeGreaterThan(0);
    expect(slots).toContainEqual({ start: "10:00", end: "13:00" });
  });

  it("2. rejects a past date", async () => {
    await expect(getAvailableSlots(PAST_DATE, "full-detail")).rejects.toMatchObject({
      code: "PAST_DATE",
    } satisfies Partial<AppError>);
  });

  it("3. excludes times already passed today", async () => {
    // "today" per FIXED_NOW is 2026-08-19, current time 10:00.
    const slots = await getAvailableSlots("2026-08-19", "full-detail");
    expect(slots.some((s) => s.start <= "10:00")).toBe(false);
    expect(slots.some((s) => s.start === "10:30")).toBe(true);
  });

  it("4. Sunday is closed — no slots", async () => {
    const slots = await getAvailableSlots(FUTURE_SUNDAY, "full-detail");
    expect(slots).toEqual([]);
  });

  it("5. excludes a start time that would finish after closing", async () => {
    // Full Detail = 180min, weekday closes 18:00. 15:00+180=18:00 fits;
    // 16:00+180=19:00 does not, per the spec's own example.
    const slots = await getAvailableSlots(TOMORROW, "full-detail");
    expect(slots.some((s) => s.start === "15:00")).toBe(true);
    expect(slots.some((s) => s.start === "16:00")).toBe(false);
  });

  it("6. excludes a slot that overlaps an existing booking", async () => {
    await prisma.booking.create({
      data: {
        customerName: "A",
        phone: "1",
        email: "a@example.com",
        vehicleDescription: "car",
        serviceId: "full-detail",
        serviceName: "Full Detail",
        price: 180,
        durationMinutes: 180,
        date: TOMORROW,
        startTime: "12:00",
        endTime: "15:00",
        status: "CONFIRMED",
      },
    });

    const slots = await getAvailableSlots(TOMORROW, "full-detail");
    // 14:00-17:00 would overlap the 12:00-15:00 booking.
    expect(slots.some((s) => s.start === "14:00")).toBe(false);
  });

  it("7. accepts an adjacent (touching, non-overlapping) slot", async () => {
    await prisma.booking.create({
      data: {
        customerName: "A",
        phone: "1",
        email: "a@example.com",
        vehicleDescription: "car",
        serviceId: "full-detail",
        serviceName: "Full Detail",
        price: 180,
        durationMinutes: 180,
        date: TOMORROW,
        startTime: "12:00",
        endTime: "15:00",
        status: "CONFIRMED",
      },
    });

    const slots = await getAvailableSlots(TOMORROW, "full-detail");
    // 15:00-18:00 starts exactly when the existing booking ends — valid.
    expect(slots.some((s) => s.start === "15:00")).toBe(true);
  });

  it("8. correctly overlaps bookings of a different duration than the requested service", async () => {
    // Essential Detail (120min) booking blocks part of a Full Detail (180min) window.
    await prisma.booking.create({
      data: {
        customerName: "A",
        phone: "1",
        email: "a@example.com",
        vehicleDescription: "car",
        serviceId: "essential-detail",
        serviceName: "Essential Detail",
        price: 90,
        durationMinutes: 120,
        date: TOMORROW,
        startTime: "13:00",
        endTime: "15:00",
        status: "CONFIRMED",
      },
    });

    const slots = await getAvailableSlots(TOMORROW, "full-detail");
    // 12:00-15:00 overlaps 13:00-15:00 -> excluded.
    expect(slots.some((s) => s.start === "12:00")).toBe(false);
    // 10:00-13:00 ends exactly when the booking starts -> fine.
    expect(slots.some((s) => s.start === "10:00")).toBe(true);
    // 15:00-18:00 starts exactly when the booking ends -> fine.
    expect(slots.some((s) => s.start === "15:00")).toBe(true);
  });

  it("9. rejects an unknown/inactive service", async () => {
    await expect(getAvailableSlots(TOMORROW, "does-not-exist")).rejects.toMatchObject({
      code: "SERVICE_NOT_FOUND",
    });
    await expect(getAvailableSlots(TOMORROW, "inactive-service")).rejects.toMatchObject({
      code: "SERVICE_NOT_FOUND",
    });
  });
});
