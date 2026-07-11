export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#080808]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime-400 text-sm font-bold text-black">
            F
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-lime-400/90">
              Fleek Curated
            </p>
            <h1 className="text-lg font-semibold tracking-tight">AI Upsell Studio</h1>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-zinc-400 sm:flex">
          <span className="text-zinc-500">Describe</span>
          <span className="text-zinc-600">→</span>
          <span className="text-zinc-500">Lookup</span>
          <span className="text-zinc-600">→</span>
          <span className="text-zinc-500">Customise</span>
        </nav>
        <a
          href="https://joinfleek.com"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-white/12 px-4 py-2 text-sm text-zinc-300 transition hover:border-lime-400/40 hover:text-white"
        >
          joinfleek.com
        </a>
      </div>
    </header>
  );
}
