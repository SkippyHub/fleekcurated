"use client";

import type { CohesiveOutfit, MatchedOutfitSlot } from "@/lib/types";

interface Props {
  outfit: CohesiveOutfit;
  sourceImage?: string;
  selectedItemId?: string;
  onSelectItem?: (id: string) => void;
  customizedItemId?: string;
  customizedImageUrl?: string;
}

function SlotRow({
  slot,
  selected,
  customized,
  customizedImageUrl,
  onSelect,
}: {
  slot: MatchedOutfitSlot;
  selected: boolean;
  customized: boolean;
  customizedImageUrl?: string;
  onSelect?: () => void;
}) {
  const Wrapper = onSelect ? "button" : "div";
  return (
    <Wrapper
      type={onSelect ? "button" : undefined}
      onClick={onSelect}
      className={`flex w-full items-stretch gap-3 rounded-md border p-3 text-left transition ${
        selected
          ? "border-tiger-gold bg-tiger-gold/5 ring-1 ring-tiger-gold/25"
          : "border-fleek-border bg-fleek-surface hover:border-tiger-gold/30"
      } ${onSelect ? "cursor-pointer" : ""}`}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-fleek-border bg-fleek-bg">
        {(customized && customizedImageUrl) || slot.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={customized && customizedImageUrl ? customizedImageUrl : slot.image_url}
            alt={slot.label}
            className="h-full w-full object-cover"
          />
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
        <p className="mt-1 truncate text-xs font-medium text-fleek-text">{slot.bundle.title}</p>
        <p className="text-[10px] text-fleek-muted">{slot.cohesion_note}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between text-right">
        <span className="rounded-full bg-tiger-gold/15 px-2 py-0.5 text-[10px] font-semibold text-fleek-text">
          {Math.round(slot.match_score * 100)}%
        </span>
        {slot.bundle.price && (
          <span className="text-[10px] font-medium text-tiger-gold">{slot.bundle.price}</span>
        )}
        <a
          href={slot.bundle.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[10px] font-medium text-fleek-text hover:text-tiger-gold hover:underline"
        >
          Fleek →
        </a>
      </div>
    </Wrapper>
  );
}

export default function OutfitRemerge({
  outfit,
  sourceImage,
  selectedItemId,
  onSelectItem,
  customizedItemId,
  customizedImageUrl,
}: Props) {
  return (
    <div className="surface-card rounded-md p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-fleek-text">3. Re-merge outfit</h3>
          <p className="mt-1 text-sm text-fleek-muted">
            Match similar Fleek bundles across every piece so the full look coordinates
          </p>
        </div>
        <div className="rounded-full border border-tiger-gold/30 bg-tiger-gold/10 px-4 py-2 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wider text-fleek-muted">
            Outfit cohesion
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
              Original look
            </p>
            <div className="overflow-hidden rounded-md border border-fleek-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sourceImage} alt="Original outfit" className="aspect-[3/4] w-full object-cover" />
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-fleek-muted">
            Fleek-matched outfit
          </p>
          <div className="space-y-2">
            {outfit.slots.map((slot) => (
              <SlotRow
                key={slot.item_id}
                slot={slot}
                selected={selectedItemId === slot.item_id}
                customized={customizedItemId === slot.item_id}
                customizedImageUrl={customizedImageUrl}
                onSelect={onSelectItem ? () => onSelectItem(slot.item_id) : undefined}
              />
            ))}
          </div>

          {outfit.slots.length > 1 && (
            <p className="mt-3 text-xs text-fleek-muted">
              Each slot picks bundles that share brand, colour family &amp; formality — tap a
              piece to customise it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
