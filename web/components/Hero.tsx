import { DEMO_SCENARIOS } from "@/lib/demo";

export default function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-8 pt-10 sm:pt-14">
      <div className="max-w-2xl">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-lime-400/20 bg-lime-400/5 px-3 py-1 text-xs text-lime-300">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
          Demo mode — works without the classifier API
        </p>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Turn any look into a Fleek upsell
        </h2>
        <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
          Upload an outfit or tie photo, get a structured breakdown, match each piece to
          wholesale bundles on{" "}
          <a
            href="https://joinfleek.com"
            className="text-zinc-200 underline-offset-2 hover:underline"
          >
            joinfleek.com
          </a>
          , then preview AI customisations before you wire the classifier.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {Object.entries(DEMO_SCENARIOS).map(([key, s]) => (
          <div
            key={key}
            className="rounded-xl border border-white/8 bg-white/[0.02] p-4"
          >
            <p className="text-xs uppercase tracking-wider text-zinc-500">Try demo</p>
            <p className="mt-1 text-sm font-medium text-zinc-200">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
