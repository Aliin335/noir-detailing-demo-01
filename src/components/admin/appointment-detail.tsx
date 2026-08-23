"use client";

import { useEffect } from "react";
import { StatusBadge } from "./status-badge";
import { formatCreatedAt, formatFullDate } from "@/lib/bookings/display";
import type { DisplayBooking } from "@/lib/bookings/display";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.25em] text-noir-text-secondary">
        {label}
      </p>
      <p className="mt-2 text-base text-noir-text">{value}</p>
    </div>
  );
}

export function AppointmentDetail({
  booking,
  onClose,
}: {
  booking: DisplayBooking;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-obsidian/80"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Booking details"
        className="h-full w-full max-w-md overflow-y-auto border-l border-graphite bg-charcoal px-8 py-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <p className="text-xs font-semibold tracking-[0.3em] text-noir-text-secondary">
            BOOKING DETAILS
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-noir-text-secondary transition-colors hover:text-noir-text"
          >
            ✕
          </button>
        </div>

        <div className="mt-8 space-y-6">
          <Field label="CUSTOMER" value={booking.customerName} />
          <Field label="VEHICLE" value={booking.vehicleDescription} />
          <Field label="SERVICE" value={booking.serviceName} />
          <Field label="DATE" value={formatFullDate(booking.date)} />
          <Field label="TIME" value={`${booking.startTime} — ${booking.endTime}`} />
          <Field label="PRICE" value={`€${booking.price}`} />
          <Field label="PHONE" value={booking.phone} />
          <Field label="EMAIL" value={booking.email} />
          <div>
            <p className="text-[10px] font-semibold tracking-[0.25em] text-noir-text-secondary">
              STATUS
            </p>
            <div className="mt-2">
              <StatusBadge status={booking.status} />
            </div>
          </div>
          <Field label="CREATED" value={formatCreatedAt(booking.createdAt)} />
        </div>
      </div>
    </div>
  );
}
