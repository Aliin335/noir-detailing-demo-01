"use client";

import { useState } from "react";
import { AppointmentRow } from "./appointment-row";
import { AppointmentDetail } from "./appointment-detail";
import type { DisplayBooking } from "@/lib/bookings/display";

export function AppointmentsTable({
  bookings,
  emptyState,
}: {
  bookings: DisplayBooking[];
  emptyState: { title: string; body: string };
}) {
  const [selected, setSelected] = useState<DisplayBooking | null>(null);

  if (bookings.length === 0) {
    return (
      <div className="border border-graphite px-8 py-16 text-center">
        <p className="text-sm font-semibold tracking-[0.2em] text-noir-text">
          {emptyState.title}
        </p>
        <p className="mt-3 text-sm text-noir-text-secondary">{emptyState.body}</p>
      </div>
    );
  }

  return (
    <>
      <div className="border border-graphite">
        <div className="hidden grid-cols-[90px_70px_1fr_1fr_1fr_80px_120px] gap-4 border-b border-graphite px-6 py-3 text-[10px] font-semibold tracking-[0.2em] text-noir-text-secondary md:grid">
          <span>DATE</span>
          <span>TIME</span>
          <span>CUSTOMER</span>
          <span>VEHICLE</span>
          <span>SERVICE</span>
          <span>PRICE</span>
          <span>STATUS</span>
        </div>
        <div className="divide-y divide-graphite">
          {bookings.map((booking) => (
            <AppointmentRow
              key={booking.id}
              booking={booking}
              onSelect={() => setSelected(booking)}
            />
          ))}
        </div>
      </div>

      {selected && (
        <AppointmentDetail booking={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
