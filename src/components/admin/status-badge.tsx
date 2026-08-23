export function StatusBadge({ status }: { status: string }) {
  const isCancelled = status === "CANCELLED";

  return (
    <span
      className={`inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] ${
        isCancelled ? "text-graphite line-through" : "text-noir-text-secondary"
      }`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${isCancelled ? "bg-graphite" : "bg-silver"}`}
      />
      {status}
    </span>
  );
}
