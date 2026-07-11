import { DEMO_SCENARIOS } from "@/lib/demo";

const FLOW_STEPS = [
  { step: "1", title: "Inspire", desc: "Share a look, mood board, or reference photo" },
  { step: "2", title: "Extract", desc: "Gemini identifies every garment in the outfit" },
  { step: "3", title: "Wardrobe", desc: "Pick real Fleek listings for each piece" },
  { step: "4", title: "Customise", desc: "Optional — preview branding or alterations" },
] as const;

const USE_CASES = [
  {
    title: "Your unique look",
    desc: "Individuals curating a personal style — source pieces that match your vision, then tweak one item.",
    icon: "✦",
  },
  {
    title: "Film & set wardrobe",
    desc: "Costume departments building cohesive looks for cast, scenes, and shoots from a single reference.",
    icon: "🎬",
  },
  {
    title: "Mass brand & wholesale",
    desc: "Companies and resellers sourcing branded bundles at scale, with optional logo or embroidery previews.",
    icon: "◈",
  },
] as const;

export default function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-8 pt-10 sm:pt-14">
      <div className="max-w-3xl">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-tiger-gold/30 bg-tiger-gold/10 px-3 py-1 text-xs font-medium text-fleek-text">
          <span className="h-1.5 w-1.5 rounded-full bg-tiger-gold" />
          AI curation · personal, film, &amp; wholesale
        </p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-fleek-text sm:text-4xl sm:leading-tight">
          Curate any look into a{" "}
          <span className="text-tiger-gold">sourceable Fleek wardrobe</span>
        </h2>
        <p className="mt-4 text-base leading-relaxed text-fleek-muted sm:text-lg">
          Whether you&apos;re styling yourself, dressing a film set, or branding at wholesale
          scale — upload a reference look. Gemini extracts each piece, matches real listings on{" "}
          <a
            href="https://joinfleek.com"
            className="font-medium text-fleek-text underline-offset-2 hover:text-tiger-gold hover:underline"
          >
            joinfleek.com
          </a>
          , and lets you select the exact bundle before any customisation.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {USE_CASES.map(({ title, desc, icon }) => (
          <div key={title} className="surface-card rounded-md p-4">
            <p className="text-lg" aria-hidden>
              {icon}
            </p>
            <p className="mt-2 text-sm font-semibold text-fleek-text">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-fleek-muted">{desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FLOW_STEPS.map(({ step, title, desc }) => (
          <div key={step} className="surface-card rounded-md p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-tiger-gold">
              Step {step}
            </p>
            <p className="mt-1 text-sm font-semibold text-fleek-text">{title}</p>
            <p className="mt-1 text-xs text-fleek-muted">{desc}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-fleek-muted">
        Demo: start with{" "}
        <span className="font-medium text-fleek-text">{DEMO_SCENARIOS.suit.label}</span> — a
        business-formal look you could use for a personal wardrobe, a TV set, or a branded
        corporate line.
      </p>
    </section>
  );
}
