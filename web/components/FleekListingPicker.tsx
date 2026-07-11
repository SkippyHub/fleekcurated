"use client";

import type { FleekListing } from "@/lib/types";
import { fleekSearchUrl, listingBundleGbp, listingPricePerPieceGbp } from "@/lib/fleek-listing";
import { formatGbp } from "@/lib/pricing";

interface Props {
  itemLabel: string;
  searchTerm: string;
  searchUrl?: string;
  listings: FleekListing[];
  selected?: FleekListing | null;
  onSelect: (listing: FleekListing) => void;
  compact?: boolean;
}

export default function FleekListingPicker({
  itemLabel,
  searchTerm,
  searchUrl,
  listings,
  selected,
  onSelect,
  compact = false,
}: Props) {
  const search = searchUrl ?? fleekSearchUrl(searchTerm);

  if (listings.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-fleek-border bg-fleek-bg p-3 text-center">
        <p className="text-xs text-fleek-muted">No listings matched — browse on Fleek</p>
        <a
          href={search}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs font-semibold text-tiger-gold hover:underline"
        >
          Search &quot;{searchTerm}&quot; on joinfleek.com →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-fleek-muted">
          Pick a Fleek listing · {itemLabel}
        </p>
        <a
          href={search}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-medium text-tiger-gold hover:underline"
        >
          View all on Fleek →
        </a>
      </div>

      <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
        {listings.map((listing) => {
          const isSelected =
            selected?.url === listing.url ||
            (selected?.product_id != null && selected.product_id === listing.product_id);
          const bundleGbp = listing.bundle_gbp ?? listingBundleGbp(listing);
          const ppc = listing.price_per_piece_gbp ?? listingPricePerPieceGbp(listing);

          return (
            <div
              key={listing.product_id ?? listing.url}
              className={`overflow-hidden rounded-md border transition ${
                isSelected
                  ? "border-tiger-gold ring-2 ring-tiger-gold/30"
                  : "border-fleek-border hover:border-tiger-gold/40"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(listing)}
                className="flex w-full flex-col text-left"
              >
                <div className="relative aspect-[4/5] bg-fleek-bg">
                  {listing.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={listing.image_url}
                      alt={listing.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-fleek-muted">
                      No image
                    </div>
                  )}
                  {isSelected && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-tiger-gold px-2 py-0.5 text-[9px] font-bold uppercase text-charred-clove">
                      Selected
                    </span>
                  )}
                  {listing.match_score != null && (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-fleek-surface/90 px-1.5 py-0.5 text-[9px] font-semibold text-fleek-text">
                      {Math.round(listing.match_score * 100)}%
                    </span>
                  )}
                </div>
                <div className="space-y-1 p-2">
                  <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-fleek-text">
                    {listing.title}
                  </p>
                  {bundleGbp != null && (
                    <p className="text-xs font-bold text-fleek-text">{formatGbp(bundleGbp)}</p>
                  )}
                  {ppc != null && (
                    <p className="text-[10px] text-fleek-muted">{formatGbp(ppc)}/pc · shipping inc.</p>
                  )}
                </div>
              </button>
              <a
                href={listing.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block border-t border-fleek-border py-1.5 text-center text-[10px] font-medium text-fleek-muted hover:bg-fleek-bg hover:text-tiger-gold"
              >
                Open listing →
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
