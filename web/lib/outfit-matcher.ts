import type { CohesiveOutfit, MatchedOutfitSlot, OutfitAnalysis, OutfitItem, OutfitTheme } from "./types";
import {
  FLEEK_SLOT_BUNDLES,
  pickBestBundle,
  pickBestBundles,
  type FleekBundle,
} from "./garment-match";

function inferPalette(items: OutfitItem[]): string[] {
  const colors = items.map((i) => i.color?.toLowerCase() ?? "").join(" ");
  const palette: string[] = [];
  if (/blue|navy|royal/.test(colors)) palette.push("Blue tones");
  if (/white|light/.test(colors)) palette.push("Light neutrals");
  if (/black|charcoal/.test(colors)) palette.push("Dark neutrals");
  return palette.length ? palette : ["Neutral"];
}

function inferStyle(summary: string): string {
  const lower = summary.toLowerCase();
  if (/business|formal|suit|office/.test(lower)) return "Business formal";
  if (/y2k|street|casual/.test(lower)) return "Streetwear";
  if (/vintage|wholesale|bundle/.test(lower)) return "Vintage wholesale";
  return "Smart casual";
}

function inferFormality(summary: string): string {
  const lower = summary.toLowerCase();
  if (/formal|suit|business|dress shirt/.test(lower)) return "Formal";
  if (/casual|tee|hoodie/.test(lower)) return "Casual";
  return "Smart";
}

function deriveTheme(analysis: OutfitAnalysis): OutfitTheme {
  const brands = [
    ...new Set(
      analysis.items.map((i) => i.brand).filter((b): b is string => Boolean(b))
    ),
  ];
  return {
    palette: inferPalette(analysis.items),
    brands,
    style: inferStyle(analysis.summary),
    formality: inferFormality(analysis.summary),
  };
}

function dominantBrand(theme: OutfitTheme): string | null {
  return theme.brands.find((b) => /hugo boss|ralph lauren|carhartt|levi/i.test(b)) ?? theme.brands[0] ?? null;
}

function candidatesForItem(item: OutfitItem): FleekBundle[] {
  const fromSlot = FLEEK_SLOT_BUNDLES[item.id] ?? [];
  const fromLookup = item.fleek_lookup.relevant_bundles.map((b) => ({
    title: b.title,
    url: b.url,
    price: b.price,
  }));
  // De-dupe by URL, slot bundles first (curated garment-correct)
  const seen = new Set<string>();
  const merged: FleekBundle[] = [];
  for (const b of [...fromSlot, ...fromLookup]) {
    if (seen.has(b.url)) continue;
    seen.add(b.url);
    merged.push(b);
  }
  return merged;
}

function pickCohesiveBundle(
  item: OutfitItem,
  theme: OutfitTheme,
  anchorBrand: string | null
): { bundle: FleekBundle; score: number; note: string } | null {
  const searchTerm = item.fleek_lookup.search_term;
  const candidates = candidatesForItem(item);
  if (candidates.length === 0) return null;

  const picked = pickBestBundle(candidates, item.id, item.type, searchTerm);
  if (!picked) return null;

  const brandMatch =
    anchorBrand && picked.bundle.title.toLowerCase().includes(anchorBrand.toLowerCase());
  const note = brandMatch
    ? `${item.type} match · ${anchorBrand} line`
    : `${item.type} match · ${theme.palette[0]?.toLowerCase() ?? "coordinated"} palette`;

  return { bundle: picked.bundle, score: picked.score, note };
}

export function buildCohesiveOutfit(analysis: OutfitAnalysis): CohesiveOutfit {
  const theme = deriveTheme(analysis);
  const anchor = dominantBrand(theme);
  const slots: MatchedOutfitSlot[] = [];

  for (const item of analysis.items) {
    const picked = pickCohesiveBundle(item, theme, anchor);
    if (!picked) continue;

    slots.push({
      item_id: item.id,
      label: item.label,
      type: item.type,
      color: item.color,
      image_url: item.image_url,
      bundle: picked.bundle,
      match_score: picked.score,
      cohesion_note: picked.note,
    });
  }

  const cohesion_score =
    slots.length > 0
      ? Math.round((slots.reduce((s, sl) => s + sl.match_score, 0) / slots.length) * 100) / 100
      : 0;

  const summary = anchor
    ? `Re-merged ${slots.length}-piece look anchored on ${anchor} — ${theme.style.toLowerCase()}, ${theme.palette.join(" + ").toLowerCase()}`
    : `Re-merged ${slots.length}-piece look — ${theme.style.toLowerCase()}, cohesive ${theme.palette.join(" + ").toLowerCase()}`;

  return {
    theme,
    slots,
    cohesion_score,
    summary,
    anchor_brand: anchor,
  };
}

/** Filter lookup bundles to garment-appropriate matches only */
export function matchedBundlesForItem(item: OutfitItem, limit = 2) {
  const candidates = candidatesForItem(item);
  return pickBestBundles(candidates, item.id, item.type, item.fleek_lookup.search_term, limit);
}

export function outfitHasMultipleSlots(analysis: OutfitAnalysis): boolean {
  return analysis.items.filter((i) => {
    const bundles = matchedBundlesForItem(i, 1);
    return bundles.length > 0 || (FLEEK_SLOT_BUNDLES[i.id]?.length ?? 0) > 0;
  }).length > 1;
}
