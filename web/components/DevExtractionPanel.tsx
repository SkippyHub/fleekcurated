import type { CohesiveOutfit, OutfitAnalysis } from "@/lib/types";
import FleekLookupPanel from "./FleekLookupPanel";
import OutfitItemCard from "./OutfitItemCard";

interface Props {
  analysis: OutfitAnalysis;
  cohesiveOutfit: CohesiveOutfit | null;
  source: string;
  selectedItemId?: string;
  onSelectItem?: (id: string) => void;
  defaultOpen?: boolean;
}

/** Developer / demo view — raw extraction + lookup contract. Hidden in product mode. */
export default function DevExtractionPanel({
  analysis,
  cohesiveOutfit,
  source,
  selectedItemId,
  onSelectItem,
  defaultOpen = false,
}: Props) {
  return (
    <details className="rounded-md border border-dashed border-fleek-border bg-fleek-bg" open={defaultOpen}>
      <summary className="cursor-pointer px-4 py-3 text-xs font-medium text-fleek-muted hover:text-fleek-text">
        Developer view — extraction &amp; API contract
        <span className="ml-2 font-normal text-fleek-muted/80">
          ({analysis.items.length} pieces · {source})
        </span>
      </summary>
      <div className="space-y-4 border-t border-fleek-border px-4 pb-4 pt-3">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-tiger-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase">
            {analysis.input_type}
          </span>
          <span className="text-[10px] text-fleek-muted">
            {Math.round(analysis.confidence * 100)}% confidence
          </span>
        </div>
        <p className="text-xs leading-relaxed text-fleek-muted">{analysis.summary}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {analysis.items.map((item) => (
            <OutfitItemCard key={item.id} item={item} />
          ))}
        </div>
        <FleekLookupPanel
          items={analysis.items}
          cohesiveOutfit={cohesiveOutfit}
          selectedItemId={selectedItemId}
          onSelectItem={onSelectItem}
        />
        <pre className="max-h-48 overflow-auto rounded-md bg-fleek-surface p-3 text-[10px] text-fleek-muted">
          {JSON.stringify(analysis, null, 2)}
        </pre>
      </div>
    </details>
  );
}
