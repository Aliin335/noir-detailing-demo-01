import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/client";
import { createBooking } from "@/lib/bookings/create-booking";
import { getAvailableSlots } from "@/lib/availability/slots";
import { clearBookings, seedTestServices, validBookingInput } from "./helpers";

const FIXED_NOW = new Date("2026-08-19T09:00:00.000Z"); // Wed 2026-08-19 10:00 Dublin
const TOMORROW = "2026-08-20";

describe("bookings", () => {
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

  it("5b. rejects a booking that would finish after closing", async () => {
    await expect(
      createBooking(validBookingInput({ date: TOMORROW, startTime: "16:00" }))
    ).rejects.toMatchObject({ code: "BUSINESS_CLOSED" });
  });

  it("2b. rejects a booking on a past date", async () => {
    await expect(
      createBooking(validBookingInput({ date: "2026-08-18", startTime: "10:00" }))
    ).rejects.toMatchObject({ code: "PAST_DATE" });
  });

  it("3b. rejects a booking at a time already passed today", async () => {
    await expect(
      createBooking(validBookingInput({ date: "2026-08-19", startTime: "09:00" }))
    ).rejects.toMatchObject({ code: "PAST_TIME" });
  });

  it("9b. rejects booking an unknown service", async () => {
    await expect(
      createBooking(validBookingInput({ serviceId: "does-not-exist" }))
    ).rejects.toMatchObject({ code: "SERVICE_NOT_FOUND" });
  });

  it("10. rejects malformed input (missing/invalid fields)", async () => {
    await expect(createBooking({})).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(
      createBooking(validBookingInput({ email: "not-an-email" }))
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(
      createBooking(validBookingInput({ customerName: "A" }))
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(
      createBooking(validBookingInput({ date: "20-08-2026" }))
    ).rejects.toMatchObject({ code: "INVALID_DATE" });
    await expect(
      createBooking(validBookingInput({ startTime: "25:00" }))
    ).rejects.toMatchObject({ code: "INVALID_TIME" });
  });

  it("6b. rejects a booking that overlaps an existing one", async () => {
    await createBooking(validBookingInput({ date: TOMORROW, startTime: "12:00" }));
    await expect(
      createBooking(validBookingInput({ date: TOMORROW, startTime: "14:00" }))
    ).rejects.toMatchObject({ code: "SLOT_UNAVAILABLE" });
  });

  it("7b. accepts an adjacent booking right after an existing one", async () => {
    await createBooking(validBookingInput({ date: TOMORROW, startTime: "12:00" })); // 12:00-15:00
    const second = await createBooking(
      validBookingInput({ date: TOMORROW, startTime: "15:00" })
    ); // 15:00-18:00
    expect(second.startTime).toBe("15:00");
  });

  it("12. persists a successful booking and removes the slot from availability", async () => {
    const booking = await createBooking(
      validBookingInput({ date: TOMORROW, startTime: "10:00", customerName: "Jordan Lee" })
    );

    expect(booking.id).toBeTruthy();
    expect(booking.status).toBe("CONFIRMED");
    expect(booking.price).toBe(180); // server-derived, not client-trusted
    expect(booking.durationMinutes).toBe(180);
    expect(booking.endTime).toBe("13:00");

    const persisted = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(persisted?.customerName).toBe("Jordan Lee");

    const slots = await getAvailableSlots(TOMORROW, "full-detail");
    expect(slots.some((s) => s.start === "10:00")).toBe(false);
  });

  it("does not trust client-supplied price/duration/serviceName", async () => {
    const booking = await createBooking(
      validBookingInput({
        date: TOMORROW,
        startTime: "09:00",
        price: 1,
        durationMinutes: 5,
        serviceName: "Hacked Service",
      })
    );
    expect(booking.price).toBe(180);
    expect(booking.durationMinutes).toBe(180);
    expect(booking.serviceName).toBe("Full Detail");
  });

  it("11. double-booking race: only one of two concurrent requests for the same slot succeeds", async () => {
    const attempt = () =>
      createBooking(validBookingInput({ date: TOMORROW, startTime: "10:00" }));

    const results = await Promise.allSettled([attempt(), attempt()]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
      code: "SLOT_UNAVAILABLE",
    });

    const allForDate = await prisma.booking.findMany({ where: { date: TOMORROW } });
    expect(allForDate).toHaveLength(1);
  });
});
