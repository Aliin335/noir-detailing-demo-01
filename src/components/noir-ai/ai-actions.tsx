export type ActionItem = {
  label: string;
  onClick: () => void;
  selected?: boolean;
  arrow?: boolean;
};

export function AiActions({
  items,
  heading,
}: {
  items: ActionItem[];
  heading?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="border-l border-transparent pl-4 md:pl-6">
      {heading && (
        <p className="mb-3 text-[10px] font-semibold tracking-[0.25em] text-noir-text-secondary">
          {heading}
        </p>
      )}
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            aria-pressed={item.selected}
            className={`inline-flex items-center gap-2 border-b pb-1 text-xs font-semibold tracking-[0.18em] transition-colors ${
              item.selected
                ? "border-silver text-noir-text"
                : "border-transparent text-noir-text-secondary hover:border-graphite hover:text-noir-text"
            }`}
          >
            {item.label}
            {item.arrow && <span aria-hidden>→</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
