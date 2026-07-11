"use client";

import { useCallback, useState } from "react";
import { curate, customizeProduct } from "@/lib/api";
import { DEMO_SCENARIOS } from "@/lib/demo";
import { defaultSelectedItem } from "@/lib/mock-data";
import type { CurateResult } from "@/lib/types";
import OutfitItemCard from "./OutfitItemCard";

type InputMode = "text" | "image" | "demo";
type Step = 1 | 2 | 3;

const TIE_PRODUCT_ID = "fleek-hugo-boss-tie";

export default function CuratorStudio() {
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<InputMode>("demo");
  const [demoScenario, setDemoScenario] = useState<keyof typeof DEMO_SCENARIOS>("tie");
  const [text, setText] = useState("");
  const [customPrompt, setCustomPrompt] = useState(
    "Add elegant embroidered branding that reads 'join fleek' on the tie. Keep the original blue colour, geometric pattern, and Hugo Boss logo. Make the embroidery look premium and subtle."
  );
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [loading, setLoading] = useState(false);
  const [altering, setAltering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CurateResult | null>(null);
  const [source, setSource] = useState<"demo" | "api">("demo");

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
      setSelectedItemId(itemId ?? defaultSelectedItem(data.analysis.items));
      setStep(itemId ? 3 : 2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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

  function handleItemSelect(itemId: string) {
    setSelectedItemId(itemId);
    setStep(3);
  }

  async function handleGenerateAlteration() {
    setAltering(true);
    setError(null);
    setStep(3);
    try {
      const { data } = await customizeProduct({
        productId: TIE_PRODUCT_ID,
        customizationPrompt: customPrompt,
        clothingItem: "tie",
        image: mode === "image" ? image ?? undefined : undefined,
      });
      const mapped = {
        customization: {
          item_id: data.customization.product_id,
          original_image_url: data.customization.original_image_url,
          customized_image_url: data.customization.customized_image_url,
          prompt_used: data.customization.prompt_used,
          edit_instruction: data.customization.edit_instruction,
          status: data.customization.status as CurateResult["customization"]["status"],
          error: data.customization.error,
        },
        matched_product: data.matched_product,
      };
      setResult((prev) => ({
        analysis: prev?.analysis ?? {
          input_type: "text",
          confidence: 1,
          summary: customPrompt,
          items: [
            {
              id: "tie",
              label: "Tie",
              type: "Necktie",
              brand: "Hugo Boss",
              customization_intent: customPrompt,
              fleek_lookup: {
                search_term: "Hugo Boss ties",
                relevant_bundles: [
                  {
                    title: data.matched_product.title,
                    url: data.matched_product.url,
                    price: data.matched_product.price,
                  },
                ],
              },
            },
          ],
        },
        ...mapped,
      }));
      setSource("api");
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
  }

  const demoImage = mode === "demo" ? DEMO_SCENARIOS[demoScenario].image : preview;
  const showDemoPreview = mode === "demo" || (mode === "image" && preview);

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16">
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2 text-sm">
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                step >= s ? "bg-lime-400 text-black" : "bg-white/10 text-zinc-500"
              }`}
            >
              {s}
            </span>
            <span className={step >= s ? "text-zinc-300" : "text-zinc-600"}>
              {s === 1 ? "Input" : s === 2 ? "Analyse & lookup" : "Customise"}
            </span>
            {s < 3 && <span className="mx-1 text-zinc-700">/</span>}
          </div>
        ))}
        {result && (
          <button
            type="button"
            onClick={reset}
            className="ml-auto text-xs text-zinc-500 hover:text-zinc-300"
          >
            Start over
          </button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left — input */}
        <section className="lg:col-span-2">
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 sm:p-7">
            <h3 className="text-lg font-semibold">1. Your brief</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Demo works offline. Classifier API plugs in later.
            </p>

            <div className="mt-5 flex gap-1 rounded-full bg-white/5 p-1">
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
                      ? "bg-lime-400 text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleAnalyze} className="mt-5 space-y-4">
              {mode === "demo" && (
                <div className="space-y-3">
                  {(
                    Object.entries(DEMO_SCENARIOS) as [
                      keyof typeof DEMO_SCENARIOS,
                      (typeof DEMO_SCENARIOS)[keyof typeof DEMO_SCENARIOS],
                    ][]
                  ).map(([key, s]) => (
                    <label
                      key={key}
                      className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
                        demoScenario === key
                          ? "border-lime-400/40 bg-lime-400/5"
                          : "border-white/8 hover:border-white/15"
                      }`}
                    >
                      <input
                        type="radio"
                        name="demo"
                        checked={demoScenario === key}
                        onChange={() => setDemoScenario(key)}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{s.label}</p>
                        <p className="text-xs text-zinc-500">{s.caption}</p>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.image}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-lg object-cover"
                      />
                    </label>
                  ))}
                </div>
              )}

              {mode === "text" && (
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  placeholder="e.g. Add embroidered 'join fleek' branding on this Hugo Boss tie"
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm placeholder:text-zinc-600 focus:border-lime-400/50 focus:outline-none"
                />
              )}

              {mode === "image" && (
                <label className="flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-white/12 bg-black/30 px-4 py-8 hover:border-lime-400/30">
                  <span className="text-sm text-zinc-400">Drop outfit or product photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}

              {showDemoPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={demoImage ?? undefined}
                  alt="Preview"
                  className="w-full rounded-xl object-cover max-h-48"
                />
              )}

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
                  Customisation prompt (Part 2)
                </span>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm focus:border-lime-400/50 focus:outline-none"
                />
              </label>

              {error && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-lime-400 py-3 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-50"
              >
                {loading ? "Analysing…" : "Analyse outfit"}
              </button>
            </form>
          </div>
        </section>

        {/* Right — results */}
        <section className="space-y-4 lg:col-span-3">
          {/* Part 1 */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">2. Classifier output</h3>
              {result && (
                <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] uppercase text-zinc-400">
                  {source} mode
                </span>
              )}
            </div>

            {!result && !loading && (
              <p className="mt-4 text-sm text-zinc-500">
                Structured outfit JSON and Fleek lookups appear here.
              </p>
            )}

            {loading && (
              <div className="mt-4 space-y-3 animate-pulse">
                <div className="h-4 w-1/4 rounded bg-white/10" />
                <div className="h-20 rounded bg-white/10" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="h-32 rounded bg-white/10" />
                  <div className="h-32 rounded bg-white/10" />
                </div>
              </div>
            )}

            {result && (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-lime-400/15 px-3 py-1 text-xs uppercase text-lime-300">
                    {result.analysis.input_type}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {Math.round(result.analysis.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-zinc-300">
                  {result.analysis.summary}
                </p>

                <p className="text-xs uppercase tracking-wider text-zinc-500">
                  Items — tap to customise
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {result.analysis.items.map((item) => (
                    <OutfitItemCard
                      key={item.id}
                      item={item}
                      selected={selectedItemId === item.id}
                      onSelect={() => handleItemSelect(item.id)}
                    />
                  ))}
                </div>

                <details className="rounded-xl bg-black/40 p-4">
                  <summary className="cursor-pointer text-xs text-zinc-500">
                    View raw JSON (classifier contract)
                  </summary>
                  <pre className="mt-3 overflow-x-auto text-[11px] text-zinc-400">
                    {JSON.stringify(result.analysis, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>

          {/* Part 2 */}
          <div className="rounded-2xl border border-lime-400/20 bg-lime-400/[0.03] p-6 sm:p-7">
            <h3 className="text-lg font-semibold">3. AI alteration (Gemini Banana)</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Part 2 — calls <code className="text-lime-300/80">POST /customize</code> with your prompt
            </p>

            <button
              type="button"
              onClick={handleGenerateAlteration}
              disabled={altering}
              className="mt-4 w-full rounded-full bg-lime-400 py-3 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-50"
            >
              {altering ? "Generating with Gemini…" : "Generate tie alteration"}
            </button>

            {!result && !altering && (
              <p className="mt-4 text-sm text-zinc-600">
                Uses Hugo Boss tie + your customisation prompt above.
              </p>
            )}

            {altering && (
              <div className="mt-4 space-y-3 animate-pulse">
                <div className="h-40 rounded bg-white/10" />
                <div className="h-40 rounded bg-white/10" />
              </div>
            )}

            {result && !altering && (
              <div className="mt-5 space-y-5">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium uppercase ${
                    result.customization.status === "generated"
                      ? "bg-lime-400/20 text-lime-300"
                      : result.customization.status === "quota_exceeded"
                        ? "bg-red-400/15 text-red-300"
                        : "bg-amber-400/15 text-amber-200"
                  }`}
                >
                  {result.customization.status}
                </span>

                {result.customization.edit_instruction && (
                  <p className="text-xs text-zinc-500">
                    Edit: {result.customization.edit_instruction}
                  </p>
                )}
                {result.customization.error && (
                  <p className="text-sm text-red-300">{result.customization.error}</p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <ImageCompare label="Original" src={result.customization.original_image_url} />
                  <ImageCompare
                    label={
                      result.customization.status === "generated"
                        ? "Customised (Gemini)"
                        : "Customised"
                    }
                    src={result.customization.customized_image_url}
                    demoTint={
                      result.customization.status !== "generated" &&
                      source === "demo"
                    }
                  />
                </div>

                <div className="rounded-xl border border-white/8 bg-black/40 p-5">
                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    Matched Fleek bundle
                  </p>
                  <p className="mt-2 text-lg font-medium">{result.matched_product.title}</p>
                  <p className="text-lime-300">{result.matched_product.price}</p>
                  <a
                    href={result.matched_product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-lime-300"
                  >
                    View on joinfleek.com →
                  </a>
                </div>
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
      <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <div className="relative overflow-hidden rounded-xl bg-zinc-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={label}
          className={`aspect-[4/5] w-full object-cover ${demoTint ? "hue-rotate-[320deg] saturate-150" : ""}`}
        />
        {demoTint && (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-[10px] text-zinc-400">
            CSS demo tint
          </span>
        )}
      </div>
    </div>
  );
}
