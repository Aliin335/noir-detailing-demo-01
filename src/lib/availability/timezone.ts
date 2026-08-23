/**
 * Timezone strategy
 * ------------------
 * The business operates in Europe/Dublin. All availability and business-hours
 * logic must use *that* clock, never the browser's or the server host's local
 * timezone (a server could be running in UTC, US-East, anywhere).
 *
 * Rather than constructing JS `Date` objects "in" a timezone (a classic
 * source of off-by-one-hour/DST bugs — `Date` is always an absolute instant,
 * it has no timezone of its own), we represent business dates and times as
 * plain strings — "YYYY-MM-DD" and "HH:mm" — and do all comparison /
 * arithmetic on those directly. `Intl.DateTimeFormat` with an explicit
 * `timeZone` is used only at the boundary, to read the *current* wall-clock
 * date/time in Dublin from a real `Date` instant. This sidesteps DST and UTC
 * offset entirely: the string values themselves are the source of truth.
 */

export const BUSINESS_TIMEZONE = "Europe/Dublin";

const dublinDateTimeFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** The current Europe/Dublin business date ("YYYY-MM-DD") and time ("HH:mm"). */
export function nowInBusinessTimezone(referenceInstant: Date = new Date()): {
  date: string;
  time: string;
} {
  const parts = dublinDateTimeFormat.formatToParts(referenceInstant);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    time: `${map.hour}:${map.minute}`,
  };
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidDateString(date: string): boolean {
  if (!DATE_PATTERN.test(date)) return false;
  const [year, month, day] = date.split("-").map(Number);
  const asUtc = new Date(Date.UTC(year, month - 1, day));
  // Round-trips only for real calendar dates (rejects e.g. 2026-02-30).
  return (
    asUtc.getUTCFullYear() === year &&
    asUtc.getUTCMonth() === month - 1 &&
    asUtc.getUTCDate() === day
  );
}

export function isValidTimeString(time: string): boolean {
  return TIME_PATTERN.test(time);
}

/**
 * 0 = Sunday ... 6 = Saturday, computed from the calendar date alone
 * (independent of any timezone — a date's weekday doesn't shift with
 * server locale as long as we parse it as UTC midnight consistently).
 */
export function weekdayOf(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** True if `date` is strictly before today in the business timezone. */
export function isPastDate(date: string, now = nowInBusinessTimezone()): boolean {
  return date < now.date;
}
