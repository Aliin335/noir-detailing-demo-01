function SilverCheck() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path d="M4 12.5L9.5 18L20 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BookingConfirmation({
  vehicle,
  service,
  date,
  time,
  price,
}: {
  vehicle: string;
  service: string;
  date: string;
  time: string;
  price: string;
}) {
  return (
    <div className="border-l border-silver pl-4 md:pl-6">
      <p className="text-3xl font-bold leading-[1.1] tracking-tight text-noir-text sm:text-4xl">
        YOU&apos;RE ALL SET.
      </p>
      <p className="mt-3 max-w-sm text-base text-noir-text-secondary md:text-lg">
        Your appointment is confirmed.
      </p>

      <div className="mt-8 space-y-1">
        <p className="text-xl font-bold tracking-tight text-noir-text">
          {vehicle}
        </p>
        <p className="text-sm tracking-[0.15em] text-noir-text-secondary">
          {service.toUpperCase()}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-2 border-t border-graphite pt-6">
        <span className="text-sm text-noir-text-secondary">{date}</span>
        <span className="text-sm text-noir-text-secondary">{time}</span>
        <span className="text-sm text-noir-text-secondary">{price}</span>
      </div>

      <div className="mt-6 inline-flex items-center gap-2 border border-silver/60 px-3 py-1.5 text-silver">
        <SilverCheck />
        <span className="text-[10px] font-semibold tracking-[0.25em]">
          CONFIRMED
        </span>
      </div>

      <p className="mt-8 text-sm text-noir-text-secondary">
        We&apos;ve saved your appointment.
      </p>
    </div>
  );
}
