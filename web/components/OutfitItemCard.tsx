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
      className={`w-full rounded-xl border p-4 text-left transition ${
        selected
          ? "border-lime-400/50 bg-lime-400/5 ring-1 ring-lime-400/20"
          : "border-white/8 bg-black/30 hover:border-white/15"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">{item.label}</p>
          <p className="mt-0.5 font-medium text-white">{item.type}</p>
          {item.brand && (
            <p className="text-sm text-zinc-400">{item.brand}</p>
          )}
        </div>
        {selected && (
          <span className="shrink-0 rounded-full bg-lime-400 px-2 py-0.5 text-[10px] font-semibold uppercase text-black">
            Edit
          </span>
        )}
      </div>

      <dl className="mt-3 grid gap-1 text-sm">
        {item.color && (
          <div className="flex gap-2">
            <dt className="text-zinc-500">Colour</dt>
            <dd className="text-zinc-300">{item.color}</dd>
          </div>
        )}
        {item.pattern && (
          <div className="flex gap-2">
            <dt className="text-zinc-500">Pattern</dt>
            <dd className="text-zinc-300 line-clamp-2">{item.pattern}</dd>
          </div>
        )}
      </dl>

      {item.fleek_lookup.relevant_bundles.length > 0 && (
        <div className="mt-3 border-t border-white/6 pt-3">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Fleek lookup</p>
          <p className="mt-1 text-xs text-zinc-400">{item.fleek_lookup.search_term}</p>
          <ul className="mt-2 space-y-1">
            {item.fleek_lookup.relevant_bundles.slice(0, 2).map((b) => (
              <li key={b.url}>
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-lime-300/90 hover:underline"
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
