import { prisma } from "@/lib/db/client";
import { appError } from "@/lib/errors";
import { getActiveServiceById } from "@/lib/services";
import { businessHoursFor, fitsWithinBusinessHours } from "@/lib/availability/business-hours";
import { isSlotStillAvailable } from "@/lib/availability/slots";
import {
  isPastDate,
  minutesToTime,
  nowInBusinessTimezone,
  timeToMinutes,
  weekdayOf,
} from "@/lib/availability/timezone";
import { parseCreateBookingInput, type CreateBookingInput } from "./validation";
import type { Booking } from "@/generated/prisma/client";

/**
 * Validates and creates a booking end-to-end. Price and duration are always
 * read from the server-side Service record — never trusted from the client,
 * even if a request body includes them (parseCreateBookingInput doesn't
 * even look at those fields).
 *
 * The conflict re-check + insert run inside a Postgres transaction holding
 * a `pg_advisory_xact_lock` keyed by date: every request for the same date,
 * from any process or server instance, serializes on that lock at the
 * database level (not in JS process memory), so the second request's
 * availability re-check always runs after the first has committed and
 * correctly sees the slot as taken. The lock is released automatically when
 * the transaction commits or rolls back.
 */
export async function createBooking(rawInput: unknown): Promise<Booking> {
  const input: CreateBookingInput = parseCreateBookingInput(rawInput);

  const service = await getActiveServiceById(input.serviceId);
  if (!service) {
    throw appError("SERVICE_NOT_FOUND", `No active service with id "${input.serviceId}".`);
  }

  const now = nowInBusinessTimezone();
  if (isPastDate(input.date, now)) {
    throw appError("PAST_DATE", `"${input.date}" is in the past.`);
  }
  if (input.date === now.date && timeToMinutes(input.startTime) <= timeToMinutes(now.time)) {
    throw appError("PAST_TIME", `"${input.startTime}" has already passed today.`);
  }

  const hours = businessHoursFor(weekdayOf(input.date));
  if (!fitsWithinBusinessHours(hours, input.startTime, service.durationMinutes)) {
    throw appError(
      "BUSINESS_CLOSED",
      `${service.name} starting at ${input.startTime} does not fit within business hours on ${input.date}.`
    );
  }

  const endTime = minutesToTime(timeToMinutes(input.startTime) + service.durationMinutes);

  return prisma.$transaction(async (tx) => {
    // Blocks until any other transaction holding the same date's lock
    // commits or rolls back. Released automatically at the end of this
    // transaction — no separate unlock call needed.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.date}))`;

    const stillAvailable = await isSlotStillAvailable(
      tx,
      input.date,
      input.startTime,
      service.durationMinutes
    );
    if (!stillAvailable) {
      throw appError("SLOT_UNAVAILABLE", "That time is no longer available.");
    }

    return tx.booking.create({
      data: {
        customerName: input.customerName,
        phone: input.phone,
        email: input.email,
        vehicleDescription: input.vehicleDescription,
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
        durationMinutes: service.durationMinutes,
        date: input.date,
        startTime: input.startTime,
        endTime,
        status: "CONFIRMED",
      },
    });
  });
}
