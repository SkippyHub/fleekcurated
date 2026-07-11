"use client";

import type { CohesiveOutfit, MatchedOutfitSlot, OutfitItem } from "@/lib/types";
import { matchedBundlesForItem } from "@/lib/outfit-matcher";
import { formatGbp, resolvePiecePricing } from "@/lib/pricing";

function fleekSearchUrl(term: string): string {
  const q = encodeURIComponent(term.trim()).replace(/%20/g, "+");
  return `https://joinfleek.com/search?q=${q}&options[prefix]=last`;
}

interface LookupRow {
  item_id: string;
  label: string;
  type: string;
  search_term: string;
  search_url: string;
  bundles: { title: string; url: string; price?: string }[];
  match_score?: number;
}

function rowsFromCohesive(outfit: CohesiveOutfit, items: OutfitItem[]): LookupRow[] {
  return outfit.slots.map((slot: MatchedOutfitSlot) => {
    const item = items.find((i) => i.id === slot.item_id);
    const search_term =
      item?.fleek_lookup.search_term ?? `${slot.label} ${slot.type} ${slot.color ?? ""}`.trim();
    return {
      item_id: slot.item_id,
      label: slot.label,
      type: slot.type,
      search_term,
      search_url: fleekSearchUrl(search_term),
      bundles: [{ title: slot.bundle.title, url: slot.bundle.url, price: slot.bundle.price }],
      match_score: slot.match_score,
    };
  });
}

function rowsFromItems(items: OutfitItem[]): LookupRow[] {
  return items
    .filter((i) => i.fleek_lookup.search_term || i.fleek_lookup.relevant_bundles.length > 0)
    .map((item) => {
      const bundles = matchedBundlesForItem(item, 2);
      return {
        item_id: item.id,
        label: item.label,
        type: item.type,
        search_term: item.fleek_lookup.search_term,
        search_url: fleekSearchUrl(item.fleek_lookup.search_term),
        bundles: bundles.length > 0 ? bundles : item.fleek_lookup.relevant_bundles,
      };
    })
    .filter((row) => row.bundles.length > 0 || row.search_term);
}

interface Props {
  items: OutfitItem[];
  cohesiveOutfit?: CohesiveOutfit | null;
  selectedItemId?: string;
  onSelectItem?: (id: string) => void;
}

export default function FleekLookupPanel({
  items,
  cohesiveOutfit,
  selectedItemId,
  onSelectItem,
}: Props) {
  const rows = cohesiveOutfit ? rowsFromCohesive(cohesiveOutfit, items) : rowsFromItems(items);

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-fleek-border bg-fleek-bg p-4 text-center">
        <p className="text-xs text-fleek-muted">
          Fleek matches appear here after extraction
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-fleek-muted">
          Fleek lookup ({rows.length})
        </p>
        <p className="text-[10px] text-fleek-muted">
          {cohesiveOutfit ? "Synced with wardrobe below" : "Matched bundles on joinfleek.com"}
        </p>
      </div>

      <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {rows.map((row) => {
          const selected = selectedItemId === row.item_id;
          return (
            <li
              key={row.item_id}
              className={`rounded-md border p-3 transition ${
                selected
                  ? "border-tiger-gold/40 bg-tiger-gold/5"
                  : "border-fleek-border bg-fleek-surface"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelectItem?.(row.item_id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="text-sm font-semibold text-fleek-text">{row.label}</p>
                  <p className="text-[10px] text-fleek-muted">{row.type}</p>
                </button>
                {row.match_score != null && (
                  <span className="shrink-0 rounded-full bg-tiger-gold/15 px-2 py-0.5 text-[10px] font-semibold text-fleek-text">
                    {Math.round(row.match_score * 100)}%
                  </span>
                )}
              </div>

              <p className="mt-2 text-[10px] text-fleek-muted">
                Search:{" "}
                <span className="font-medium text-fleek-text">{row.search_term}</span>
              </p>

              <a
                href={row.search_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-[10px] font-medium text-tiger-gold hover:underline"
              >
                Search on joinfleek.com →
              </a>

              {row.bundles.length > 0 && (
                <ul className="mt-2 space-y-1.5 border-t border-fleek-border pt-2">
                  {row.bundles.slice(0, 2).map((b) => {
                    const pricing = resolvePiecePricing({
                      itemId: row.item_id,
                      productTitle: b.title,
                      productUrl: b.url,
                    });
                    return (
                    <li key={b.url}>
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-md bg-fleek-bg px-2.5 py-2 hover:bg-tiger-gold/5"
                      >
                        <p className="text-xs font-medium text-fleek-text line-clamp-2">
                          {b.title}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2 text-[10px]">
                          <span className="font-semibold text-tiger-gold">
                            {formatGbp(pricing.bundleGbp)}/bundle
                          </span>
                          <span className="text-fleek-muted">
                            ~{formatGbp(pricing.pricePerPieceGbp)}/pc
                          </span>
                          {b.price && (
                            <span className="text-fleek-muted">({b.price})</span>
                          )}
                        </div>
                      </a>
                    </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
