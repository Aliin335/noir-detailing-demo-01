import { StatusBadge } from "./status-badge";
import { formatShortDate } from "@/lib/bookings/display";
import type { DisplayBooking } from "@/lib/bookings/display";

export function AppointmentRow({
  booking,
  onSelect,
}: {
  booking: DisplayBooking;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="block w-full px-6 py-4 text-left transition-colors hover:bg-card focus:bg-card focus:outline-none"
    >
      {/* Desktop row */}
      <div className="hidden grid-cols-[90px_70px_1fr_1fr_1fr_80px_120px] items-center gap-4 md:grid">
        <span className="text-sm text-noir-text-secondary">{formatShortDate(booking.date)}</span>
        <span className="text-sm text-noir-text">{booking.startTime}</span>
        <span className="truncate text-sm text-noir-text">{booking.customerName}</span>
        <span className="truncate text-sm text-noir-text-secondary">{booking.vehicleDescription}</span>
        <span className="truncate text-sm text-noir-text-secondary">{booking.serviceName}</span>
        <span className="text-sm text-noir-text">€{booking.price}</span>
        <StatusBadge status={booking.status} />
      </div>

      {/* Mobile card */}
      <div className="flex flex-col gap-2 md:hidden">
        <div className="flex items-center justify-between gap-4">
          <span className="truncate text-sm font-semibold text-noir-text">
            {booking.customerName}
          </span>
          <StatusBadge status={booking.status} />
        </div>
        <div className="flex items-center gap-3 text-xs text-noir-text-secondary">
          <span>{formatShortDate(booking.date)}</span>
          <span aria-hidden>·</span>
          <span>{booking.startTime}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-xs text-noir-text-secondary">
          <span className="truncate">
            {booking.vehicleDescription} — {booking.serviceName}
          </span>
          <span className="shrink-0 text-noir-text">€{booking.price}</span>
        </div>
      </div>
    </button>
  );
}
