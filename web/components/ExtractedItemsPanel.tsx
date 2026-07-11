import { matchedBundlesForItem } from "@/lib/outfit-matcher";
import type { OutfitItem } from "@/lib/types";

interface Props {
  items: OutfitItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  compact?: boolean;
}

export default function ExtractedItemsPanel({
  items,
  selectedId,
  onSelect,
  compact = false,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-fleek-muted">
          Extracted pieces ({items.length})
        </p>
        <p className="text-[10px] text-fleek-muted">Matched to Fleek bundles</p>
      </div>

      <ul className={`space-y-2 ${compact ? "" : "max-h-64 overflow-y-auto pr-1"}`}>
        {items.map((item) => {
          const selected = selectedId === item.id;
          const bundleCount = matchedBundlesForItem(item, 1).length;
          const customizable = Boolean(item.customization_intent || item.image_url);

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={`flex w-full items-center gap-3 rounded-md border p-2.5 text-left transition ${
                  selected
                    ? "border-tiger-gold bg-tiger-gold/5 ring-1 ring-tiger-gold/25"
                    : "border-fleek-border bg-fleek-surface hover:border-tiger-gold/30"
                }`}
              >
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-fleek-border bg-fleek-bg">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase text-fleek-muted">
                      {item.label.slice(0, 2)}
                    </div>
                  )}
                  {customizable && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-tiger-gold ring-2 ring-fleek-surface" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-fleek-text">{item.label}</p>
                    {selected && (
                      <span className="rounded-full bg-tiger-gold px-1.5 py-0.5 text-[9px] font-bold uppercase text-charred-clove">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-fleek-muted">
                    {item.type}
                    {item.brand ? ` · ${item.brand}` : ""}
                  </p>
                  {bundleCount > 0 ? (
                    <p className="mt-0.5 text-[10px] font-medium text-tiger-gold">
                      {bundleCount} Fleek {bundleCount === 1 ? "match" : "matches"}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[10px] text-fleek-muted">No bundle match yet</p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
