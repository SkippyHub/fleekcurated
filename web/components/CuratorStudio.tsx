"use client";

import { useCallback, useState } from "react";
import { analyzePrompt } from "@/lib/api";
import type { AnalyzeResponse } from "@/lib/types";

type InputMode = "text" | "image";

export default function CuratorStudio() {
  const [mode, setMode] = useState<InputMode>("text");
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const onImageChange = useCallback((file: File | null) => {
    setImage(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
  }, [preview]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (mode === "text" && !text.trim()) {
      setError("Describe what you want to customise.");
      return;
    }
    if (mode === "image" && !image) {
      setError("Upload a reference image.");
      return;
    }

    setLoading(true);
    try {
      const data = await analyzePrompt({
        text: text.trim() || undefined,
        image: mode === "image" ? image ?? undefined : undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-2">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
        <h2 className="mb-1 text-lg font-semibold tracking-tight">Your brief</h2>
        <p className="mb-6 text-sm text-zinc-400">
          Text or image — Part 1 classifies your prompt and extracts the customisation intent.
        </p>

        <div className="mb-6 flex gap-2 rounded-full bg-white/5 p-1">
          {(["text", "image"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMode(tab)}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === tab
                  ? "bg-lime-400 text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab === "text" ? "Text prompt" : "Reference image"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "text" ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="e.g. Customise this black hoodie with a vintage wash and streetwear vibe"
              className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-lime-400/60 focus:outline-none focus:ring-1 focus:ring-lime-400/40"
            />
          ) : (
            <div className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/30 px-6 py-10 transition hover:border-lime-400/40 hover:bg-black/50">
                <span className="mb-2 text-sm font-medium text-zinc-300">
                  Drop a reference outfit photo
                </span>
                <span className="text-xs text-zinc-500">PNG, JPG, WEBP</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
                />
              </label>
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Reference preview"
                  className="max-h-56 w-full rounded-xl object-cover"
                />
              )}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                placeholder="Optional caption — e.g. Make something like this but in navy"
                className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-lime-400/60 focus:outline-none"
              />
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-lime-400 py-3 text-sm font-semibold text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Analysing…" : "Analyse prompt"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Part 1 — Classification</h2>

          {!result && !loading && (
            <p className="text-sm text-zinc-500">
              Results appear here after you analyse a prompt.
            </p>
          )}

          {loading && (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-1/3 rounded bg-white/10" />
              <div className="h-16 rounded bg-white/10" />
              <div className="h-24 rounded bg-white/10" />
            </div>
          )}

          {result && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-lime-400/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-lime-300">
                  {result.classification.input_type}
                </span>
                <span className="text-xs text-zinc-500">
                  {Math.round(result.classification.confidence * 100)}% confidence
                </span>
              </div>

              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-zinc-500">Summary</p>
                <p className="text-sm leading-relaxed text-zinc-200">
                  {result.description.summary}
                </p>
              </div>

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <Field label="Clothing item" value={result.description.clothing_item} />
                <Field
                  label="Customisation"
                  value={result.description.customization_intent}
                />
              </dl>

              {result.description.style_tags.length > 0 && (
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">Style tags</p>
                  <div className="flex flex-wrap gap-2">
                    {result.description.style_tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-dashed border-lime-400/25 bg-lime-400/[0.04] p-6 sm:p-8">
          <h2 className="mb-2 text-lg font-semibold tracking-tight">Part 2 — Customisation</h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            Your hackathon piece: take the Fleek product image, run AI customisation using the
            intent above, then look up the new product on{" "}
            <a
              href="https://joinfleek.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lime-300 underline-offset-2 hover:underline"
            >
              joinfleek.com
            </a>
            .
          </p>
          {result && (
            <pre className="mt-4 overflow-x-auto rounded-xl bg-black/50 p-4 text-xs text-zinc-400">
              {JSON.stringify(result.description, null, 2)}
            </pre>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl bg-black/30 px-4 py-3">
      <dt className="text-xs uppercase tracking-wider text-zinc-500">{label}</dt>
      <dd className="mt-1 text-zinc-200">{value ?? "—"}</dd>
    </div>
  );
}
