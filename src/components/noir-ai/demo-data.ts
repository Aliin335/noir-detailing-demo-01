import type { Day } from "./types";

/**
 * The AI's recommendation logic is still deterministic/mock for this phase
 * (per spec: availability + booking must be real, the recommendation can
 * stay controlled) — but `serviceId` ties it to a real seeded Service row,
 * so availability/booking calls against it are genuine.
 */
export const RECOMMENDATION = {
  serviceId: "full-detail",
  service: "Full Detail",
  items: ["Deep interior clean", "Exterior decontamination", "Paint enhancement"],
  price: "€180",
  duration: "approximately 3 hours",
};

export const DAY_LABELS: Record<Day, string> = {
  today: "TODAY",
  tomorrow: "TOMORROW",
  weekend: "THIS WEEKEND",
};

const BUSINESS_TIMEZONE = "Europe/Dublin";

/**
 * Every date here is a UTC-midnight-anchored `Date` representing a pure
 * calendar date (no time-of-day) — never the viewer's local wall-clock
 * time. This mirrors the server's Europe/Dublin strategy: "today" is read
 * from Dublin's current calendar date (via Intl, not the browser's own
 * timezone), and day-arithmetic + display formatting both stay pinned to
 * UTC so a viewer in a different timezone never sees a shifted date.
 */
function dublinToday(): Date {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  return new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function nextSaturday(base: Date): Date {
  const day = base.getUTCDay();
  const diff = (6 - day + 7) % 7 || 7;
  return addDays(base, diff);
}

/** Resolves a demo day choice to an actual calendar date, anchored to Dublin's "today". */
export function resolveDate(day: Day, today: Date = dublinToday()): Date {
  switch (day) {
    case "today":
      return today;
    case "tomorrow":
      return addDays(today, 1);
    case "weekend":
      return nextSaturday(today);
  }
}

/** "YYYY-MM-DD", for the availability/booking APIs. */
export function toIsoDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "24 August 2026", for display — formatted in UTC to match the anchored date above. */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Formats a server-returned "YYYY-MM-DD" string the same way as `formatDate`. */
export function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return formatDate(new Date(Date.UTC(y, m - 1, d)));
}

export type AvailabilitySlot = { start: string; end: string };

export type AvailabilityResult =
  | { ok: true; slots: AvailabilitySlot[] }
  | { ok: false; code: string; message: string };

/** Calls the real availability API — see src/app/api/availability/route.ts. */
export async function fetchAvailability(
  date: string,
  serviceId: string
): Promise<AvailabilityResult> {
  try {
    const res = await fetch(
      `/api/availability?date=${encodeURIComponent(date)}&serviceId=${encodeURIComponent(serviceId)}`
    );
    const body = await res.json();
    if (!res.ok) {
      return { ok: false, code: body.error ?? "INTERNAL_ERROR", message: body.message ?? "Something went wrong." };
    }
    return { ok: true, slots: body.slots as AvailabilitySlot[] };
  } catch {
    return { ok: false, code: "NETWORK_ERROR", message: "Could not reach the server." };
  }
}

export type CreateBookingPayload = {
  customerName: string;
  phone: string;
  email: string;
  vehicleDescription: string;
  serviceId: string;
  date: string;
  startTime: string;
};

export type CreateBookingResult =
  | { ok: true; booking: { id: string; date: string; startTime: string; endTime: string; price: number; serviceName: string } }
  | { ok: false; code: string; message: string };

/** Calls the real booking API — see src/app/api/bookings/route.ts. */
export async function submitBooking(payload: CreateBookingPayload): Promise<CreateBookingResult> {
  try {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) {
      return { ok: false, code: body.error ?? "INTERNAL_ERROR", message: body.message ?? "Something went wrong." };
    }
    return { ok: true, booking: body.booking };
  } catch {
    return { ok: false, code: "NETWORK_ERROR", message: "Could not reach the server." };
  }
}
