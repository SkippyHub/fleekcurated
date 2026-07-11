import { DEMO_SCENARIOS } from "@/lib/demo";

export default function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-8 pt-10 sm:pt-14">
      <div className="max-w-2xl">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-tiger-gold/30 bg-tiger-gold/10 px-3 py-1 text-xs font-medium text-fleek-text">
          <span className="h-1.5 w-1.5 rounded-full bg-tiger-gold" />
          Powered by Gemini · Wholesale bundles
        </p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-fleek-text sm:text-4xl sm:leading-tight">
          Where resellers turn looks into{" "}
          <span className="text-tiger-gold">Fleek upsells</span>
        </h2>
        <p className="mt-4 text-base leading-relaxed text-fleek-muted sm:text-lg">
          Upload a full outfit photo — we extract jacket, shirt, trousers &amp; tie, match each
          piece to bundles on{" "}
          <a
            href="https://joinfleek.com"
            className="font-medium text-fleek-text underline-offset-2 hover:text-tiger-gold hover:underline"
          >
            joinfleek.com
          </a>
          , then preview AI customisations with{" "}
          <span className="font-medium text-fleek-text">join fleek</span> branding.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {(["suit", "tie", "pile"] as const).map((key) => {
          const s = DEMO_SCENARIOS[key];
          return (
          <div key={key} className="surface-card rounded-md p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-fleek-muted">
              {key === "suit" ? "Start here" : "Also try"}
            </p>
            <p className="mt-1 text-sm font-semibold text-fleek-text">{s.label}</p>
            <p className="mt-1 text-xs text-fleek-muted line-clamp-2">{s.caption}</p>
          </div>
          );
        })}
      </div>
    </section>
  );
}
