import { prisma } from "@/lib/db/client";
import { getActiveServiceById } from "@/lib/services";
import { appError } from "@/lib/errors";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { businessHoursFor } from "./business-hours";
import {
  isPastDate,
  isValidDateString,
  minutesToTime,
  nowInBusinessTimezone,
  timeToMinutes,
  weekdayOf,
} from "./timezone";

const SLOT_INTERVAL_MINUTES = 30;
/** Only PENDING/CONFIRMED bookings hold a slot — CANCELLED ones don't block it. */
const BLOCKING_STATUSES = ["PENDING", "CONFIRMED"];

export type Slot = { start: string; end: string };

/** Either the plain client or an interactive-transaction client — lets the
 * final conflict re-check in create-booking.ts run on the same Postgres
 * transaction/connection that holds the per-date advisory lock. */
type Db = PrismaClient | Prisma.TransactionClient;

function intervalsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Existing booked [start,end) intervals (in minutes-since-midnight) for a date. */
async function getBookedIntervals(
  db: Db,
  date: string
): Promise<{ start: number; end: number }[]> {
  const bookings = await db.booking.findMany({
    where: { date, status: { in: BLOCKING_STATUSES } },
    select: { startTime: true, endTime: true },
  });
  return bookings.map((b) => ({
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime),
  }));
}

/**
 * All open, conflict-free slots for a service on a date. Throws AppError for
 * invalid input (bad date format, past date, unknown/inactive service) —
 * a closed day or a day with no remaining slots is a *valid* result: `[]`.
 */
export async function getAvailableSlots(date: string, serviceId: string): Promise<Slot[]> {
  if (!isValidDateString(date)) {
    throw appError("INVALID_DATE", `"${date}" is not a valid date (expected YYYY-MM-DD).`);
  }

  const service = await getActiveServiceById(serviceId);
  if (!service) {
    throw appError("SERVICE_NOT_FOUND", `No active service with id "${serviceId}".`);
  }

  const now = nowInBusinessTimezone();
  if (isPastDate(date, now)) {
    throw appError("PAST_DATE", `"${date}" is in the past.`);
  }

  const hours = businessHoursFor(weekdayOf(date));
  if (!hours) return []; // closed that day

  const openMin = timeToMinutes(hours.open);
  const closeMin = timeToMinutes(hours.close);
  const duration = service.durationMinutes;
  const isToday = date === now.date;
  const nowMin = timeToMinutes(now.time);

  const booked = await getBookedIntervals(prisma, date);

  const slots: Slot[] = [];
  for (let start = openMin; start + duration <= closeMin; start += SLOT_INTERVAL_MINUTES) {
    if (isToday && start <= nowMin) continue; // already passed today

    const end = start + duration;
    const conflicts = booked.some((b) => intervalsOverlap(start, end, b.start, b.end));
    if (conflicts) continue;

    slots.push({ start: minutesToTime(start), end: minutesToTime(end) });
  }

  return slots;
}

/**
 * Re-checks a specific [startTime, startTime+duration) slot against current
 * bookings. Pass the active transaction client when called from within a
 * locked transaction (see create-booking.ts) so this read is guaranteed to
 * happen after the advisory lock is held, on the same connection.
 */
export async function isSlotStillAvailable(
  db: Db,
  date: string,
  startTime: string,
  durationMinutes: number
): Promise<boolean> {
  const start = timeToMinutes(startTime);
  const end = start + durationMinutes;
  const booked = await getBookedIntervals(db, date);
  return !booked.some((b) => intervalsOverlap(start, end, b.start, b.end));
}
