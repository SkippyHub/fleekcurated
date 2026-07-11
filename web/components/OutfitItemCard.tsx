import type { OutfitItem } from "@/lib/types";

interface Props {
  item: OutfitItem;
  selected: boolean;
  onSelect: () => void;
}

export default function OutfitItemCard({ item, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-md border p-4 text-left transition ${
        selected
          ? "border-tiger-gold bg-tiger-gold/5 ring-1 ring-tiger-gold/30"
          : "border-fleek-border bg-fleek-surface hover:border-tiger-gold/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-fleek-muted">
            {item.label}
          </p>
          <p className="mt-0.5 font-semibold text-fleek-text">{item.type}</p>
          {item.brand && <p className="text-sm text-fleek-muted">{item.brand}</p>}
        </div>
        {selected && (
          <span className="shrink-0 rounded-full bg-tiger-gold px-2 py-0.5 text-[10px] font-bold uppercase text-charred-clove">
            Edit
          </span>
        )}
      </div>

      <dl className="mt-3 grid gap-1 text-sm">
        {item.color && (
          <div className="flex gap-2">
            <dt className="text-fleek-muted">Colour</dt>
            <dd className="text-fleek-text">{item.color}</dd>
          </div>
        )}
        {item.pattern && (
          <div className="flex gap-2">
            <dt className="text-fleek-muted">Pattern</dt>
            <dd className="text-fleek-text line-clamp-2">{item.pattern}</dd>
          </div>
        )}
      </dl>

      {item.fleek_lookup.relevant_bundles.length > 0 && (
        <div className="mt-3 border-t border-fleek-border pt-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-fleek-muted">
            Fleek lookup
          </p>
          <p className="mt-1 text-xs text-fleek-muted">{item.fleek_lookup.search_term}</p>
          <ul className="mt-2 space-y-1">
            {item.fleek_lookup.relevant_bundles.slice(0, 2).map((b) => (
              <li key={b.url}>
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-medium text-fleek-text hover:text-tiger-gold hover:underline"
                >
                  {b.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </button>
  );
}
