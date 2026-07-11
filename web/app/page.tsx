import CuratorStudio from "@/components/CuratorStudio";

export default function Home() {
  return (
    <div className="min-h-full bg-[#0c0c0c] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-lime-400">
              Hackathon demo
            </p>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Fleek Curated
            </h1>
          </div>
          <a
            href="https://joinfleek.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-300 transition hover:border-lime-400/50 hover:text-white"
          >
            joinfleek.com →
          </a>
        </div>
      </header>

      <main className="px-6 py-10 sm:py-14">
        <div className="mx-auto mb-10 max-w-6xl">
          <p className="max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            AI-powered clothing upselling for Fleek. Describe a look in words or upload a
            reference image — we classify the prompt and extract what to customise before swapping
            the product.
          </p>
        </div>
        <CuratorStudio />
      </main>

      <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-zinc-600">
        Part 1 classifier · Part 2 customisation (in progress)
      </footer>
    </div>
  );
}
