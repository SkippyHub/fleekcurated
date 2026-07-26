"use client";

import { useState } from "react";
import type { CohesiveOutfit, FleekListing, MatchedOutfitSlot, OutfitItem } from "@/lib/types";
import { matchedBundlesForItem } from "@/lib/outfit-matcher";
import { bundleToListing } from "@/lib/fleek-listing";
import FleekListingPicker from "./FleekListingPicker";

const BTN_PRIMARY =
  "w-full rounded-full bg-tiger-gold py-2.5 text-xs font-semibold text-charred-clove transition hover:bg-tiger-gold/90 disabled:cursor-not-allowed disabled:opacity-40";

interface Props {
  outfit: CohesiveOutfit;
  items: OutfitItem[];
  sourceImage?: string;
  selectedItemId?: string;
  selectedListings: Record<string, FleekListing>;
  onSelectItem?: (id: string) => void;
  onSelectListing: (itemId: string, listing: FleekListing) => void;
  onCustomiseItem?: (id: string) => void;
  customizedItemId?: string;
  customizedImageUrl?: string;
  analysisSummary?: string;
  confidence?: number;
  source?: string;
}

function SlotRow({
  slot,
  item,
  selected,
  selectedListing,
  customized,
  customizedImageUrl,
  onSelect,
  onSelectListing,
  onCustomise,
}: {
  slot: MatchedOutfitSlot;
  item?: OutfitItem;
  selected: boolean;
  selectedListing?: FleekListing;
  customized: boolean;
  customizedImageUrl?: string;
  onSelect?: () => void;
  onSelectListing: (listing: FleekListing) => void;
  onCustomise?: () => void;
}) {
  const [browseOpen, setBrowseOpen] = useState(!selectedListing);
  const listings = item
    ? matchedBundlesForItem(item, 6).map((b) => bundleToListing(b))
    : [slot.bundle];
  const displayImage =
    customized && customizedImageUrl
      ? customizedImageUrl
      : selectedListing?.image_url ?? slot.image_url;
  const displayTitle = selectedListing?.title ?? slot.bundle.title;
  const canCustomise = Boolean(selectedListing?.product_id || selectedListing?.image_url);

  return (
    <div
      className={`rounded-md border p-3 transition ${
        selected
          ? "border-tiger-gold bg-tiger-gold/5 ring-1 ring-tiger-gold/25"
          : "border-fleek-border bg-fleek-surface"
      }`}
    >
      <button type="button" onClick={onSelect} className="flex w-full items-stretch gap-3 text-left">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-fleek-border bg-fleek-bg">
          {displayImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayImage} alt={slot.label} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-fleek-muted">
              {slot.label.slice(0, 2)}
            </div>
          )}
          {customized && (
            <span className="absolute -right-0.5 -top-0.5 rounded-full bg-tiger-gold px-1 text-[8px] font-bold text-charred-clove">
              AI
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-fleek-text">{slot.label}</p>
            <span className="text-[10px] text-fleek-muted">{slot.type}</span>
            {slot.color && (
              <span className="rounded-full bg-fleek-bg px-2 py-0.5 text-[10px] text-fleek-muted">
                {slot.color}
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-xs font-medium text-fleek-text">{displayTitle}</p>
          <p className="text-[10px] text-fleek-muted">
            {selectedListing ? "Selected Fleek listing" : slot.cohesion_note}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end justify-center text-right">
          <span className="rounded-full bg-tiger-gold/15 px-2 py-0.5 text-[10px] font-semibold text-fleek-text">
            {Math.round((selectedListing?.match_score ?? slot.match_score) * 100)}%
          </span>
        </div>
      </button>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => setBrowseOpen((o) => !o)}
          className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-tiger-gold hover:underline"
        >
          {browseOpen ? "Hide listings" : "Browse & select Fleek listing"} ({listings.length})
        </button>

        {browseOpen && item && (
          <FleekListingPicker
            itemLabel={slot.label}
            searchTerm={item.fleek_lookup.search_term}
            searchUrl={item.fleek_lookup.search_url}
            listings={listings}
            selected={selectedListing}
            onSelect={(listing) => {
              onSelectListing(listing);
              setBrowseOpen(false);
            }}
            compact
          />
        )}
      </div>

      {onCustomise && (
        <button
          type="button"
          onClick={onCustomise}
          disabled={!canCustomise}
          className={`mt-3 ${BTN_PRIMARY}`}
          title={canCustomise ? undefined : "Select a Fleek listing first"}
        >
          Customise this piece →
        </button>
      )}
    </div>
  );
}

export default function Wardrobe({
  outfit,
  items,
  sourceImage,
  selectedItemId,
  selectedListings,
  onSelectItem,
  onSelectListing,
  onCustomiseItem,
  customizedItemId,
  customizedImageUrl,
  analysisSummary,
  confidence,
  source,
}: Props) {
  return (
    <div className="surface-card rounded-md p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-fleek-text">2. Your curated wardrobe</h3>
            {source && (
              <span className="rounded-full border border-fleek-border bg-fleek-bg px-2 py-0.5 text-[10px] font-medium uppercase text-fleek-muted">
                {source === "gemini" ? "Live match" : `${source} mode`}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-fleek-muted">
            We matched each piece from your look to real Fleek listings — pick the bundle you want
            to source, then customise only if you need a branded preview.
          </p>
          {analysisSummary && (
            <p className="mt-2 text-xs leading-relaxed text-fleek-muted line-clamp-2">
              {analysisSummary}
              {confidence != null && (
                <span className="ml-1 text-fleek-muted/80">
                  · {Math.round(confidence * 100)}% match confidence
                </span>
              )}
            </p>
          )}
        </div>
        <div className="rounded-full border border-tiger-gold/30 bg-tiger-gold/10 px-4 py-2 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wider text-fleek-muted">
            Look cohesion
          </p>
          <p className="text-xl font-bold text-tiger-gold">
            {Math.round(outfit.cohesion_score * 100)}%
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {outfit.theme.palette.map((p) => (
          <span
            key={p}
            className="rounded-full bg-fleek-bg border border-fleek-border px-2.5 py-1 text-[10px] font-medium text-fleek-muted"
          >
            {p}
          </span>
        ))}
        <span className="rounded-full bg-fleek-bg border border-fleek-border px-2.5 py-1 text-[10px] font-medium text-fleek-muted">
          {outfit.theme.style}
        </span>
        {outfit.anchor_brand && (
          <span className="rounded-full bg-tiger-gold/15 px-2.5 py-1 text-[10px] font-semibold text-fleek-text">
            Anchor: {outfit.anchor_brand}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-fleek-text">{outfit.summary}</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {sourceImage && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-fleek-muted">
              Inspiration
            </p>
            <div className="overflow-hidden rounded-md border border-fleek-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sourceImage} alt="Original outfit" className="aspect-[3/4] w-full object-cover" />
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-fleek-muted">
            Curated wardrobe · {outfit.slots.length} piece{outfit.slots.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-3">
            {outfit.slots.map((slot) => (
              <SlotRow
                key={slot.item_id}
                slot={slot}
                item={items.find((i) => i.id === slot.item_id)}
                selected={selectedItemId === slot.item_id}
                selectedListing={selectedListings[slot.item_id]}
                customized={customizedItemId === slot.item_id}
                customizedImageUrl={customizedImageUrl}
                onSelect={onSelectItem ? () => onSelectItem(slot.item_id) : undefined}
                onSelectListing={(listing) => onSelectListing(slot.item_id, listing)}
                onCustomise={onCustomiseItem ? () => onCustomiseItem(slot.item_id) : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
