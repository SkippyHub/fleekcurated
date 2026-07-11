import type { CohesiveOutfit, FleekListing, MatchedOutfitSlot, OutfitAnalysis, OutfitItem, OutfitTheme } from "./types";
import { bundleToListing } from "./fleek-listing";
import {
  FLEEK_SLOT_BUNDLES,
  pickBestBundle,
  pickBestBundles,
  type FleekBundle,
} from "./garment-match";

function fleekSearchUrl(term: string): string {
  const q = encodeURIComponent(term.trim()).replace(/%20/g, "+");
  return `https://joinfleek.com/search?q=${q}&options[prefix]=last`;
}

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

/** Bundles from Part 1 Fleek lookup (Gemini search term + catalogue matches). */
function lookupBundlesForItem(item: OutfitItem): FleekBundle[] {
  return item.fleek_lookup.relevant_bundles.map((b) => ({
    title: b.title,
    url: b.url,
    price: b.price,
    product_id: b.product_id,
    match_score: b.match_score,
    image_url: b.image_url,
    pieces: b.pieces,
    price_amount: b.price_amount,
  }));
}

/** Offline/demo fallback when lookup returned no catalogue hits. */
function fallbackBundlesForItem(item: OutfitItem): FleekBundle[] {
  return FLEEK_SLOT_BUNDLES[item.id] ?? [];
}

function candidatesForItem(item: OutfitItem): FleekBundle[] {
  const fromLookup = lookupBundlesForItem(item);
  if (fromLookup.length > 0) return fromLookup;

  const fromSlot = fallbackBundlesForItem(item);
  const seen = new Set<string>();
  const merged: FleekBundle[] = [];
  for (const b of fromSlot) {
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

  if (candidates.length > 0) {
    const picked = pickBestBundle(candidates, item.id, item.type, searchTerm);
    if (picked) {
      const fromLookup = lookupBundlesForItem(item).length > 0;
      const brandMatch =
        anchorBrand && picked.bundle.title.toLowerCase().includes(anchorBrand.toLowerCase());
      const note = fromLookup
        ? brandMatch
          ? `Fleek lookup · ${anchorBrand} line`
          : `Fleek lookup · ${item.fleek_lookup.search_term}`
        : brandMatch
          ? `${item.type} match · ${anchorBrand} line`
          : `${item.type} match · ${theme.palette[0]?.toLowerCase() ?? "coordinated"} palette`;

      return { bundle: picked.bundle, score: picked.score, note };
    }
  }

  if (searchTerm.trim()) {
    return {
      bundle: {
        title: `Search on Fleek · ${searchTerm}`,
        url: fleekSearchUrl(searchTerm),
      },
      score: 0.4,
      note: `${item.type} · no catalogue hit yet — search on Fleek`,
    };
  }

  return null;
}

/** Build wardrobe slots directly from extracted items + their Fleek lookup results. */
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
      bundle: bundleToListing(picked.bundle),
      match_score: picked.score,
      cohesion_note: picked.note,
    });
  }

  const cohesion_score =
    slots.length > 0
      ? Math.round((slots.reduce((s, sl) => s + sl.match_score, 0) / slots.length) * 100) / 100
      : 0;

  const summary = anchor
    ? `Curated ${slots.length}-piece wardrobe anchored on ${anchor} — ${theme.style.toLowerCase()}, ${theme.palette.join(" + ").toLowerCase()}`
    : `Curated ${slots.length}-piece wardrobe — ${theme.style.toLowerCase()}, cohesive ${theme.palette.join(" + ").toLowerCase()}`;

  return {
    theme,
    slots,
    cohesion_score,
    summary,
    anchor_brand: anchor,
  };
}

/** Same bundles as wardrobe — keeps extract lookup panel in sync. */
export function matchedBundlesForItem(item: OutfitItem, limit = 6) {
  const candidates = candidatesForItem(item);
  return pickBestBundles(candidates, item.id, item.type, item.fleek_lookup.search_term, limit);
}

export function outfitHasMultipleSlots(analysis: OutfitAnalysis): boolean {
  return analysis.items.filter((i) => {
    const bundles = matchedBundlesForItem(i, 1);
    return bundles.length > 0 || Boolean(i.fleek_lookup.search_term.trim());
  }).length > 1;
}
