import { matchedBundlesForItem } from "@/lib/outfit-matcher";
import type { OutfitItem } from "@/lib/types";

interface Props {
  item: OutfitItem;
}

export default function OutfitItemCard({ item }: Props) {
  const bundles = matchedBundlesForItem(item, 2);

  return (
    <div className="rounded-md border border-fleek-border bg-fleek-surface p-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-fleek-muted">
          {item.label}
        </p>
        <p className="mt-0.5 font-semibold text-fleek-text">{item.type}</p>
        {item.brand && <p className="text-sm text-fleek-muted">{item.brand}</p>}
      </div>

      <dl className="mt-3 grid gap-1 text-sm">
        {item.color && (
          <div className="flex gap-2">
            <dt className="text-fleek-muted">Colour</dt>
            <dd className="text-fleek-text">{item.color}</dd>
          </div>
        )}
        {item.pattern && (
          <div className="flex gap-2">
            <dt className="text-fleek-muted">Pattern</dt>
            <dd className="text-fleek-text line-clamp-2">{item.pattern}</dd>
          </div>
        )}
      </dl>

      {bundles.length > 0 && (
        <div className="mt-3 border-t border-fleek-border pt-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-fleek-muted">
            Fleek match
          </p>
          <p className="mt-1 text-xs text-fleek-muted">{item.fleek_lookup.search_term}</p>
          <ul className="mt-2 space-y-1">
            {bundles.map((b) => (
              <li key={b.url}>
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-fleek-text hover:text-tiger-gold hover:underline"
                >
                  {b.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
