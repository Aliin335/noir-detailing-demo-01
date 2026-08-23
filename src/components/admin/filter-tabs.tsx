import Link from "next/link";
import type { AppointmentFilter } from "@/lib/bookings/queries";

const TABS: { key: AppointmentFilter; label: string }[] = [
  { key: "upcoming", label: "UPCOMING" },
  { key: "past", label: "PAST" },
  { key: "confirmed", label: "CONFIRMED" },
  { key: "cancelled", label: "CANCELLED" },
  { key: "all", label: "ALL" },
];

export function FilterTabs({ active }: { active: AppointmentFilter }) {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3 border-b border-graphite pb-4">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.key === "upcoming" ? "/admin/appointments" : `/admin/appointments?filter=${tab.key}`}
          className={`border-b pb-1 text-xs font-semibold tracking-[0.18em] transition-colors ${
            active === tab.key
              ? "border-silver text-noir-text"
              : "border-transparent text-noir-text-secondary hover:text-noir-text"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
