export function StatsCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-graphite p-6">
      <p className="text-[10px] font-semibold tracking-[0.25em] text-noir-text-secondary">
        {label}
      </p>
      <p className="mt-4 text-3xl font-bold tracking-tight text-noir-text md:text-4xl">
        {value}
      </p>
    </div>
  );
}
