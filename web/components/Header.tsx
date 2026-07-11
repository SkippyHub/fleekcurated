export default function Header() {
  return (
    <>
      <div className="bg-tiger-gold px-4 py-2 text-center text-xs font-medium text-charred-clove">
        Enjoy <strong>£20 off</strong> on Fleek — use code <strong>APPFIRSTORDER</strong>
      </div>
      <header className="sticky top-0 z-50 border-b border-fleek-border bg-fleek-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-tiger-gold text-sm font-bold text-charred-clove">
              F
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fleek-muted">
                Fleek Curated
              </p>
              <h1 className="font-display text-lg font-semibold tracking-tight text-fleek-text">
                AI Upsell Studio
              </h1>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-fleek-muted sm:flex">
            <span>Describe</span>
            <span className="text-fleek-border">→</span>
            <span>Lookup</span>
            <span className="text-fleek-border">→</span>
            <span className="font-medium text-fleek-text">Customise</span>
          </nav>
          <a
            href="https://joinfleek.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-tiger-gold px-4 py-2 text-sm font-semibold text-charred-clove transition hover:brightness-105"
          >
            joinfleek.com
          </a>
        </div>
      </header>
    </>
  );
}
