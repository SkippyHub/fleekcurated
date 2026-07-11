"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { curate, customizeCuratedPiece } from "@/lib/api";
import { DEMO_SCENARIOS } from "@/lib/demo";
import {
  analysisFromDemoScenario,
  defaultSelectedItem,
  selectedItemLabel,
} from "@/lib/mock-data";
import { buildCohesiveOutfit } from "@/lib/outfit-matcher";
import { defaultSelectionsFromAnalysis } from "@/lib/fleek-listing";
import type { CurateResult, FleekListing } from "@/lib/types";
import FleekLookupPanel from "./FleekLookupPanel";
import OutfitItemCard from "./OutfitItemCard";
import Wardrobe from "./Wardrobe";
import OrderReview from "./OrderReview";

type InputMode = "text" | "image" | "demo";
type Step = 1 | 2 | 3 | 4;

const TIE_PRODUCT_ID = "fleek-hugo-boss-tie";

function resolveProductId(result: CurateResult): string {
  const id = result.matched_product.product_id;
  if (id.startsWith("fleek-")) return id;
  if (id === "tie" || id === "tie-selected") return TIE_PRODUCT_ID;
  return TIE_PRODUCT_ID;
}

export default function CuratorStudio() {
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<InputMode>("demo");
  const [demoScenario, setDemoScenario] = useState<keyof typeof DEMO_SCENARIOS>("suit");
  const [text, setText] = useState("");
  const [customPrompt, setCustomPrompt] = useState(
    "Add elegant embroidered branding that reads 'join fleek' on the tie make the branding stand out. Keep the original blue colour, geometric pattern, and Hugo Boss logo. Make the embroidery look premium and subtle."
  );
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [loading, setLoading] = useState(false);
  const [altering, setAltering] = useState(false);
  const [customising, setCustomising] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CurateResult | null>(null);
  const [source, setSource] = useState<"demo" | "api" | "gemini">("demo");
  const [selectedListings, setSelectedListings] = useState<Record<string, FleekListing>>({});

  const previewAnalysis = useMemo(() => {
    if (mode !== "demo") return null;
    return analysisFromDemoScenario(demoScenario);
  }, [mode, demoScenario]);

  useEffect(() => {
    if (mode === "demo" && previewAnalysis) {
      const nextId = defaultSelectedItem(previewAnalysis.items);
      setSelectedItemId(nextId);
    }
  }, [mode, demoScenario, previewAnalysis]);

  const cohesiveOutfit = useMemo(() => {
    if (!result?.analysis) return null;
    const outfit = buildCohesiveOutfit(result.analysis);
    return outfit.slots.length > 0 ? outfit : null;
  }, [result?.analysis]);

  const sourceOutfitImage =
    mode === "demo" ? DEMO_SCENARIOS[demoScenario].image : preview ?? undefined;

  const onImageChange = useCallback(
    (file: File | null) => {
      setImage(file);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(file ? URL.createObjectURL(file) : null);
    },
    [preview]
  );

  async function runCurate(itemId?: string) {
    setLoading(true);
    setError(null);
    try {
      const { result: data, source: src } = await curate({
        text: mode === "text" ? text : undefined,
        image: mode === "image" ? image ?? undefined : undefined,
        demoScenario: mode === "demo" ? demoScenario : undefined,
        selectedItemId: itemId ?? selectedItemId,
        customizationPrompt: customPrompt,
      });
      setResult(data);
      setSource(src);
      setSelectedListings(defaultSelectionsFromAnalysis(data.analysis.items));
      setSelectedItemId(itemId ?? defaultSelectedItem(data.analysis.items));
      const wardrobe = buildCohesiveOutfit(data.analysis);
      setStep(wardrobe.slots.length > 0 ? 3 : 2);
      setCustomising(false);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Something went wrong.";
      try {
        const parsed = JSON.parse(raw) as { detail?: string };
        setError(parsed.detail ?? raw);
      } catch {
        setError(raw);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "text" && !text.trim()) {
      setError("Enter a prompt or pick a demo scenario.");
      return;
    }
    if (mode === "image" && !image) {
      setError("Upload a reference image.");
      return;
    }
    await runCurate();
  }

  function handleWardrobeSelect(itemId: string) {
    setSelectedItemId(itemId);
  }

  function handleSelectListing(itemId: string, listing: FleekListing) {
    setSelectedListings((prev) => ({ ...prev, [itemId]: listing }));
    setSelectedItemId(itemId);
    setError(null);
  }

  function handleCustomiseItem(itemId: string) {
    const listing = selectedListings[itemId];
    if (!listing?.product_id && !listing?.image_url) {
      setError("Select a Fleek listing for this piece first — browse listings in your wardrobe.");
      return;
    }
    setSelectedItemId(itemId);
    setCustomising(true);
    setStep(4);
    setError(null);
    const items = result?.analysis.items ?? [];
    const item = items.find((i) => i.id === itemId);
    if (item?.customization_intent) {
      setCustomPrompt(item.customization_intent);
    }
  }

  async function handleGenerateAlteration() {
    if (!result?.analysis) return;
    setAltering(true);
    setError(null);
    setStep(4);
    try {
      const listing = selectedListings[selectedItemId];
      const productId =
        listing?.product_id?.startsWith("fleek-") ? listing.product_id : TIE_PRODUCT_ID;

      const { result: customized, source: src } = await customizeCuratedPiece({
        source,
        analysis: result.analysis,
        selectedItemId,
        customizationPrompt: customPrompt,
        productId,
        listing,
        clothingItem: selectedItemId.includes("tie") ? "tie" : undefined,
        image: mode === "image" ? image ?? undefined : undefined,
      });
      setResult((prev) => (prev ? { ...prev, ...customized } : prev));
      setSource(src);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Alteration failed.");
    } finally {
      setAltering(false);
    }
  }

  function reset() {
    setStep(1);
    setResult(null);
    setError(null);
    setCustomising(false);
    setSelectedListings({});
  }

  const activeListing = selectedListings[selectedItemId];

  const displayItems = result?.analysis.items ?? [];
  const activeItemLabel = selectedItemLabel(displayItems, selectedItemId);

  const hasCustomizationPreview = Boolean(result?.customization.customized_image_url);
  const demoImage = mode === "demo" ? DEMO_SCENARIOS[demoScenario].image : preview;
  const showDemoPreview = mode === "demo" || (mode === "image" && preview);

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16">
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2 text-sm">
        {([1, 2, 3, 4] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                step >= s ? "bg-tiger-gold text-charred-clove" : "bg-fleek-border text-fleek-muted"
              }`}
            >
              {s}
            </span>
            <span className={`hidden sm:inline ${step >= s ? "font-medium text-fleek-text" : "text-fleek-muted"}`}>
              {s === 1
                ? "Inspire"
                : s === 2
                  ? "Extract"
                  : s === 3
                    ? "Wardrobe"
                    : "Customise"}
            </span>
            {s < 4 && <span className="mx-1 text-fleek-border">/</span>}
          </div>
        ))}
        {result && (
          <button
            type="button"
            onClick={reset}
            className="ml-auto text-xs text-fleek-muted hover:text-fleek-text"
          >
            Start over
          </button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left — input */}
        <section className="lg:col-span-2">
          <div className="surface-card rounded-md p-6 sm:p-7">
            <h3 className="text-lg font-semibold">1. Share a look</h3>
            <p className="mt-1 text-sm text-fleek-muted">
              Your outfit photo, a film costume reference, or a brand mood board — we extract
              each piece and curate matching Fleek listings. Customisation comes after you pick
              a listing.
            </p>

            <div className="mt-4 flex gap-1 rounded-full bg-fleek-bg p-1 border border-fleek-border">
              {(
                [
                  ["demo", "Demo"],
                  ["text", "Text"],
                  ["image", "Upload"],
                ] as const
              ).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setMode(tab)}
                  className={`flex-1 rounded-full px-3 py-2 text-xs font-medium transition sm:text-sm ${
                    mode === tab
                      ? "bg-tiger-gold text-charred-clove"
                      : "text-fleek-muted hover:text-fleek-text"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleAnalyze} className="mt-5 space-y-4">
              {mode === "demo" && (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-md border border-fleek-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={DEMO_SCENARIOS[demoScenario].image}
                      alt={DEMO_SCENARIOS[demoScenario].label}
                      className="w-full object-cover max-h-44"
                    />
                    <div className="border-t border-fleek-border bg-fleek-bg px-3 py-2">
                      <p className="text-sm font-semibold text-fleek-text">
                        {DEMO_SCENARIOS[demoScenario].label}
                      </p>
                      <p className="text-xs text-fleek-muted">
                        {DEMO_SCENARIOS[demoScenario].caption}
                      </p>
                    </div>
                  </div>

                  <p className="border-t border-fleek-border pt-3 text-[10px] text-fleek-muted">
                    Switch demo:{" "}
                    {(["suit", "tie"] as const).map((key, i) => (
                      <span key={key}>
                        {i > 0 && " · "}
                        <button
                          type="button"
                          onClick={() => setDemoScenario(key)}
                          className={
                            demoScenario === key
                              ? "font-semibold text-tiger-gold"
                              : "hover:text-fleek-text hover:underline"
                          }
                        >
                          {key === "suit" ? "full outfit" : "tie crop"}
                        </button>
                      </span>
                    ))}
                  </p>
                </div>
              )}

              {mode === "text" && (
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  placeholder="e.g. Add embroidered 'join fleek' branding on this Hugo Boss tie"
                  className="input-fleek w-full resize-none rounded-md px-4 py-3 text-sm placeholder:text-fleek-muted"
                />
              )}

              {mode === "image" && (
                <label className="flex cursor-pointer flex-col items-center rounded-md border border-dashed border-fleek-border bg-fleek-bg px-4 py-8 hover:border-tiger-gold/40">
                  <span className="text-sm text-fleek-muted">Drop outfit or product photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}

              {showDemoPreview && mode !== "demo" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={demoImage ?? undefined}
                  alt="Preview"
                  className="w-full rounded-xl object-cover max-h-48"
                />
              )}

              {error && (
                <p className="rounded-lg bg-chili-red/10 px-3 py-2 text-sm text-chili-red">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-tiger-gold py-3 text-sm font-semibold text-charred-clove hover:bg-tiger-gold/90 disabled:opacity-50"
              >
                {loading ? "Gemini is analysing your outfit…" : "Curate Fleek wardrobe"}
              </button>
            </form>
          </div>
        </section>

        {/* Right — results */}
        <section className="space-y-4 lg:col-span-3">
          {/* Part 1 */}
          <div className="surface-card rounded-md p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">2. Extract pieces</h3>
              {result && (
                <span className="rounded-full bg-fleek-bg border border-fleek-border px-2 py-0.5 text-[10px] font-medium uppercase text-fleek-muted">
                  {source === "gemini" ? "Gemini · live" : `${source} mode`}
                </span>
              )}
            </div>

            {!result && !loading && (
              <p className="mt-4 text-sm text-fleek-muted">
                Extracted pieces and Fleek matches appear here after curation.
              </p>
            )}

            {loading && (
              <div className="mt-4 space-y-3 animate-pulse">
                <div className="h-4 w-1/4 rounded bg-fleek-border" />
                <div className="h-20 rounded bg-fleek-border" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="h-32 rounded bg-fleek-border" />
                  <div className="h-32 rounded bg-fleek-border" />
                </div>
              </div>
            )}

            {result && (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-tiger-gold/15 px-3 py-1 text-xs font-semibold uppercase text-fleek-text">
                    {result.analysis.input_type}
                  </span>
                  <span className="text-xs text-fleek-muted">
                    {Math.round(result.analysis.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-fleek-text">
                  {result.analysis.summary}
                </p>

                <p className="text-xs font-medium uppercase tracking-wider text-fleek-muted">
                  Extracted pieces
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {result.analysis.items.map((item) => (
                    <OutfitItemCard key={item.id} item={item} />
                  ))}
                </div>

                <FleekLookupPanel
                  items={result.analysis.items}
                  cohesiveOutfit={cohesiveOutfit}
                  selectedItemId={selectedItemId}
                  onSelectItem={handleWardrobeSelect}
                />

                <details className="rounded-md border border-fleek-border bg-fleek-bg p-4">
                  <summary className="cursor-pointer text-xs text-fleek-muted">
                    View raw JSON (classifier contract)
                  </summary>
                  <pre className="mt-3 overflow-x-auto text-[11px] text-fleek-muted">
                    {JSON.stringify(result.analysis, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>

          {cohesiveOutfit && result && (
            <Wardrobe
              outfit={cohesiveOutfit}
              items={result.analysis.items}
              sourceImage={sourceOutfitImage}
              selectedItemId={selectedItemId}
              selectedListings={selectedListings}
              onSelectItem={handleWardrobeSelect}
              onSelectListing={handleSelectListing}
              onCustomiseItem={handleCustomiseItem}
              customizedItemId={
                result?.customization.status === "generated" ||
                result?.customization.status === "cached"
                  ? result.customization.item_id
                  : undefined
              }
              customizedImageUrl={
                result?.customization.status === "generated" ||
                result?.customization.status === "cached"
                  ? result.customization.customized_image_url
                  : undefined
              }
            />
          )}

          {/* Part 2 — only after user picks a piece to customise */}
          <div className="surface-accent rounded-md p-6 sm:p-7">
            <h3 className="text-lg font-semibold text-fleek-text">4. Customise piece</h3>
            {!customising ? (
              <p className="mt-4 text-sm text-fleek-muted">
                Your curated wardrobe is ready. Choose a piece above and click{" "}
                <span className="font-medium text-fleek-text">Customise this piece</span> to
                preview AI alterations and see wholesale pricing.
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm text-fleek-muted">
                  Preview an AI alteration on{" "}
                  <span className="font-medium text-fleek-text">
                    {activeListing?.title ?? activeItemLabel.toLowerCase()}
                  </span>
                  , then order the Fleek bundle.
                </p>

                {activeListing?.image_url && (
                  <div className="mt-3 flex items-center gap-3 rounded-md border border-fleek-border bg-fleek-bg p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeListing.image_url}
                      alt=""
                      className="h-16 w-16 rounded-md object-cover"
                    />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-fleek-muted">
                        Selected Fleek listing
                      </p>
                      <p className="text-sm font-semibold text-fleek-text">{activeListing.title}</p>
                    </div>
                  </div>
                )}

                <label className="mt-4 block">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-fleek-muted">
                    Customisation brief
                  </span>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                    className="input-fleek w-full resize-none rounded-md px-4 py-3 text-sm"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleGenerateAlteration}
                  disabled={altering}
                  className="mt-4 w-full rounded-full bg-tiger-gold py-3 text-sm font-semibold text-charred-clove hover:bg-tiger-gold/90 disabled:opacity-50"
                >
                  {altering ? "Generating with Gemini…" : `Generate ${activeItemLabel.toLowerCase()} preview`}
                </button>
              </>
            )}

            {customising && altering && (
              <div className="mt-4 space-y-3 animate-pulse">
                <div className="h-40 rounded bg-fleek-border" />
                <div className="h-40 rounded bg-fleek-border" />
              </div>
            )}

            {customising && hasCustomizationPreview && result && !altering && (
              <div className="mt-5 space-y-5">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium uppercase ${
                    result.customization.status === "generated" ||
                    result.customization.status === "cached"
                      ? "bg-tiger-gold/20 text-tiger-gold"
                      : result.customization.status === "quota_exceeded"
                        ? "bg-chili-red/15 text-chili-red"
                        : "bg-tiger-gold/15 text-fleek-text"
                  }`}
                >
                  {result.customization.status === "cached" ? "cached (no API cost)" : result.customization.status}
                </span>

                {result.customization.edit_instruction && (
                  <p className="text-xs text-fleek-muted">
                    Edit: {result.customization.edit_instruction}
                  </p>
                )}
                {result.customization.error && (
                  <p className="text-sm text-chili-red">{result.customization.error}</p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <ImageCompare label="Original" src={result.customization.original_image_url} />
                  <ImageCompare
                    label={
                      result.customization.status === "generated" ||
                      result.customization.status === "cached"
                        ? result.customization.status === "cached"
                          ? "Customised (cached)"
                          : "Customised (Gemini)"
                        : "Customised"
                    }
                    src={result.customization.customized_image_url}
                    demoTint={
                      result.customization.status !== "generated" &&
                      result.customization.status !== "cached" &&
                      source === "demo"
                    }
                  />
                </div>

                <div className="surface-card rounded-md p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-fleek-muted">
                    Matched Fleek bundle
                  </p>
                  <p className="mt-2 text-lg font-semibold text-fleek-text">{result.matched_product.title}</p>
                  <p className="font-semibold text-tiger-gold">{result.matched_product.price}</p>
                  <a
                    href={result.matched_product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-tiger-gold px-5 py-2.5 text-sm font-semibold text-charred-clove hover:bg-tiger-gold/90"
                  >
                    View on joinfleek.com →
                  </a>
                </div>

                <OrderReview
                  compact
                  itemId={selectedItemId}
                  itemLabel={activeItemLabel}
                  productId={
                    activeListing?.product_id?.startsWith("fleek-")
                      ? activeListing.product_id
                      : resolveProductId(result)
                  }
                  customizationPrompt={customPrompt}
                  productTitle={activeListing?.title ?? result.matched_product.title}
                  productUrl={activeListing?.url ?? result.matched_product.url}
                  includePreview={
                    result.customization.status === "generated" ||
                    result.customization.status === "cached"
                  }
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ImageCompare({
  label,
  src,
  demoTint,
}: {
  label: string;
  src: string;
  demoTint?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-fleek-muted">{label}</p>
      <div className="relative overflow-hidden rounded-md border border-fleek-border bg-fleek-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={label}
          className={`aspect-[4/5] w-full object-cover ${demoTint ? "hue-rotate-[320deg] saturate-150" : ""}`}
        />
        {demoTint && (
          <span className="absolute bottom-2 right-2 rounded bg-fleek-surface/90 px-2 py-0.5 text-[10px] text-fleek-muted shadow-sm">
            CSS demo tint
          </span>
        )}
      </div>
    </div>
  );
}
