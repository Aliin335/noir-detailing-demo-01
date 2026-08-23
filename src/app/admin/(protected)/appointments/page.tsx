import { AppointmentsTable } from "@/components/admin/appointments-table";
import { FilterTabs } from "@/components/admin/filter-tabs";
import { RefreshButton } from "@/components/admin/refresh-button";
import { toDisplayBooking } from "@/lib/bookings/display";
import { getFilteredBookings, type AppointmentFilter } from "@/lib/bookings/queries";

const VALID_FILTERS: AppointmentFilter[] = ["all", "upcoming", "past", "confirmed", "cancelled"];

export const dynamic = "force-dynamic";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = (VALID_FILTERS as string[]).includes(params.filter ?? "")
    ? (params.filter as AppointmentFilter)
    : "upcoming";

  const bookings = await getFilteredBookings(filter);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.5em] text-noir-text-secondary">
            NOIR ADMIN
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-noir-text md:text-5xl">
            Appointments
          </h1>
        </div>
        <RefreshButton />
      </div>

      <div className="mt-10">
        <FilterTabs active={filter} />
      </div>

      <div className="mt-6">
        <AppointmentsTable
          bookings={bookings.map(toDisplayBooking)}
          emptyState={{
            title: "NO APPOINTMENTS",
            body: "Appointments created through NOIR AI will appear here automatically.",
          }}
        />
      </div>
    </div>
  );
}
