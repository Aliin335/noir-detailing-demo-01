import { AppointmentsTable } from "@/components/admin/appointments-table";
import { RefreshButton } from "@/components/admin/refresh-button";
import { StatsCard } from "@/components/admin/stats-card";
import { nowInBusinessTimezone } from "@/lib/availability/timezone";
import { toDisplayBooking, formatFullDate, formatShortDate } from "@/lib/bookings/display";
import { getDashboardStats, getUpcomingBookings } from "@/lib/bookings/queries";

// This page reads live booking data on every request — it must never be
// statically prerendered/cached, or the dashboard would freeze at
// whatever data existed at build time.
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [stats, upcoming] = await Promise.all([
    getDashboardStats(),
    getUpcomingBookings(8),
  ]);
  const now = nowInBusinessTimezone();

  const nextAppointmentValue = !stats.nextAppointment
    ? "—"
    : stats.nextAppointment.isToday
      ? stats.nextAppointment.startTime
      : `${formatShortDate(stats.nextAppointment.date)} · ${stats.nextAppointment.startTime}`;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.5em] text-noir-text-secondary">
            NOIR ADMIN
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-noir-text md:text-5xl">
            Overview
          </h1>
          <p className="mt-3 text-sm text-noir-text-secondary">
            {formatFullDate(now.date)} · {now.time}
          </p>
        </div>
        <RefreshButton />
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="TODAY'S APPOINTMENTS"
          value={String(stats.todayCount).padStart(2, "0")}
        />
        <StatsCard
          label="UPCOMING BOOKINGS"
          value={String(stats.upcomingCount).padStart(2, "0")}
        />
        <StatsCard label="BOOKED VALUE" value={`€${stats.bookedValue.toLocaleString()}`} />
        <StatsCard label="NEXT APPOINTMENT" value={nextAppointmentValue} />
      </div>

      <div className="mt-16">
        <p className="text-xs font-semibold tracking-[0.3em] text-noir-text-secondary">
          UPCOMING APPOINTMENTS
        </p>
        <div className="mt-6">
          <AppointmentsTable
            bookings={upcoming.map(toDisplayBooking)}
            emptyState={{
              title: "NO UPCOMING APPOINTMENTS",
              body: "Appointments created through NOIR AI will appear here automatically.",
            }}
          />
        </div>
      </div>
    </div>
  );
}
