import type { Booking } from "@/generated/prisma/client";

/**
 * Client-safe view of a Booking — Prisma's `createdAt` is a `Date`, which
 * can't cross the Server -> Client Component boundary as a prop, so this
 * flattens it to an ISO string. Everything else is passed straight
 * through: the dashboard reuses the same booking data model end-to-end
 * rather than redefining it.
 */
export type DisplayBooking = {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  vehicleDescription: string;
  serviceName: string;
  price: number;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
};

export function toDisplayBooking(booking: Booking): DisplayBooking {
  return {
    id: booking.id,
    customerName: booking.customerName,
    phone: booking.phone,
    email: booking.email,
    vehicleDescription: booking.vehicleDescription,
    serviceName: booking.serviceName,
    price: booking.price,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
  };
}

const MONTH_ABBR = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

/** "24 AUG", from a "YYYY-MM-DD" business date. */
export function formatShortDate(iso: string): string {
  const [, month, day] = iso.split("-").map(Number);
  return `${String(day).padStart(2, "0")} ${MONTH_ABBR[month - 1]}`;
}

/** "24 August 2026", from a "YYYY-MM-DD" business date. */
export function formatFullDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/** "23 Aug 2026, 20:15", from an ISO instant, in the business timezone. */
export function formatCreatedAt(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Dublin",
  }).format(new Date(iso));
}
