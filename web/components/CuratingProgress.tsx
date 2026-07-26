/** Shown while Gemini extracts pieces — product-facing, not dev panels. */
export default function CuratingProgress({ pieceHint }: { pieceHint?: string }) {
  return (
    <div className="surface-card rounded-md p-6 sm:p-8">
      <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-6">
        <div className="relative h-20 w-20 shrink-0">
          <span className="absolute inset-0 animate-ping rounded-full bg-tiger-gold/20" />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-tiger-gold/15 text-2xl font-bold text-tiger-gold">
            AI
          </span>
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-fleek-text">Building your wardrobe</h3>
            <p className="mt-1 text-sm text-fleek-muted">
              Gemini is reading your look, matching each piece to Fleek listings, and assembling a
              coordinated wardrobe you can source today.
            </p>
          </div>
          <ul className="flex flex-wrap justify-center gap-2 sm:justify-start text-[10px] font-medium uppercase tracking-wider text-fleek-muted">
            <li className="rounded-full bg-fleek-bg px-2.5 py-1">Identify garments</li>
            <li className="rounded-full bg-fleek-bg px-2.5 py-1">Match listings</li>
            <li className="rounded-full bg-fleek-bg px-2.5 py-1">Score cohesion</li>
          </ul>
          {pieceHint && (
            <p className="text-xs text-fleek-muted">{pieceHint}</p>
          )}
        </div>
      </div>
      <div className="mt-6 space-y-2 animate-pulse">
        <div className="h-3 w-1/3 rounded bg-fleek-border" />
        <div className="h-16 rounded-md bg-fleek-border" />
        <div className="h-16 rounded-md bg-fleek-border" />
        <div className="h-16 rounded-md bg-fleek-border" />
      </div>
    </div>
  );
}
