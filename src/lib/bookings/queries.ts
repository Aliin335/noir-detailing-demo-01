import { prisma } from "@/lib/db/client";
import { nowInBusinessTimezone } from "@/lib/availability/timezone";
import type { Booking } from "@/generated/prisma/client";

/**
 * Read-only booking queries for the admin dashboard.
 *
 * These call Prisma directly rather than going through an HTTP API — the
 * dashboard pages are Server Components, so there's no client/server
 * boundary to cross for the initial render, and a same-process fetch call
 * to our own API would just add latency for no benefit. `RefreshButton`
 * (a Client Component) triggers a re-fetch via `router.refresh()`, which
 * re-runs these Server Component queries directly. This mirrors the
 * pattern already used by the public site's Server Components; it is not
 * a new architecture.
 *
 * This file does NOT touch booking creation, availability, or conflict
 * logic — see src/lib/availability/slots.ts and
 * src/lib/bookings/create-booking.ts for that.
 */

export type AppointmentFilter = "all" | "upcoming" | "past" | "confirmed" | "cancelled";

function todayDate(): string {
  return nowInBusinessTimezone().date;
}

export function getFilteredBookings(filter: AppointmentFilter): Promise<Booking[]> {
  const today = todayDate();
  const where =
    filter === "upcoming"
      ? { date: { gte: today } }
      : filter === "past"
        ? { date: { lt: today } }
        : filter === "confirmed"
          ? { status: "CONFIRMED" }
          : filter === "cancelled"
            ? { status: "CANCELLED" }
            : {};

  return prisma.booking.findMany({
    where,
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export function getUpcomingBookings(limit: number): Promise<Booking[]> {
  const today = todayDate();
  return prisma.booking.findMany({
    where: { date: { gte: today }, status: { not: "CANCELLED" } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take: limit,
  });
}

export type DashboardStats = {
  todayCount: number;
  upcomingCount: number;
  bookedValue: number;
  nextAppointment: { date: string; startTime: string; isToday: boolean } | null;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = todayDate();
  const upcoming = await prisma.booking.findMany({
    where: { date: { gte: today }, status: { not: "CANCELLED" } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const todayCount = upcoming.filter((b) => b.date === today).length;
  const bookedValue = upcoming.reduce((sum, b) => sum + b.price, 0);
  const next = upcoming[0] ?? null;

  return {
    todayCount,
    upcomingCount: upcoming.length,
    bookedValue,
    nextAppointment: next
      ? { date: next.date, startTime: next.startTime, isToday: next.date === today }
      : null,
  };
}
