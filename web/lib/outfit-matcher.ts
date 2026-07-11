import type { CohesiveOutfit, MatchedOutfitSlot, OutfitAnalysis, OutfitItem, OutfitTheme } from "./types";

const FLEEK = "https://www.joinfleek.com";

/** Curated Fleek bundles keyed by slot — cohesive blue formal menswear set */
const COHESIVE_BUNDLE_OVERRIDES: Record<
  string,
  { title: string; url: string; price: string }[]
> = {
  jacket: [
    {
      title: "Hugo Boss Polos and T-Shirt",
      url: `${FLEEK}/products/hugo-boss-polos-and-t-shirt`,
      price: "Wholesale bundle",
    },
    {
      title: "Men's Mix Brand Tie & Neckwear (23 pcs)",
      url: `${FLEEK}/products/men-s-mix-brand-tie-neckwear-23-pieces`,
      price: "Grade AB",
    },
  ],
  shirt: [
    {
      title: "Hugo Boss T-Shirts Bundle 0001",
      url: `${FLEEK}/products/hugo-boss-t-shirts0001`,
      price: "Grade AB vintage",
    },
    {
      title: "Hugo Boss Polos and T-Shirt",
      url: `${FLEEK}/products/hugo-boss-polos-and-t-shirt`,
      price: "Wholesale bundle",
    },
  ],
  trousers: [
    {
      title: "Hugo Boss Polos and T-Shirt",
      url: `${FLEEK}/products/hugo-boss-polos-and-t-shirt`,
      price: "Matching formal line",
    },
  ],
  tie: [
    {
      title: "Designer Ties Bundle (500 pcs)",
      url: `${FLEEK}/products/designer-ties-bundle-set-of-500`,
      price: "Bulk wholesale",
    },
  ],
  "pocket-square": [],
  "tie-selected": [
    {
      title: "Designer Ties Bundle (500 pcs)",
      url: `${FLEEK}/products/designer-ties-bundle-set-of-500`,
      price: "Bulk wholesale",
    },
  ],
};

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

function bundleBrandScore(title: string, brand: string | null): number {
  if (!brand) return 0;
  return title.toLowerCase().includes(brand.toLowerCase()) ? 0.35 : 0;
}

function bundlePaletteScore(title: string, palette: string[]): number {
  const t = title.toLowerCase();
  if (palette.some((p) => p.includes("Blue")) && /blue|navy|polo|formal/.test(t)) return 0.15;
  return 0.05;
}

function pickCohesiveBundle(
  item: OutfitItem,
  theme: OutfitTheme,
  anchorBrand: string | null
): { bundle: { title: string; url: string; price?: string }; score: number; note: string } | null {
  const candidates = [
    ...(COHESIVE_BUNDLE_OVERRIDES[item.id] ?? []),
    ...item.fleek_lookup.relevant_bundles,
  ];

  if (candidates.length === 0) return null;

  let best = candidates[0];
  let bestScore = 0;

  for (const bundle of candidates) {
    let score = 0.45;
    score += bundleBrandScore(bundle.title, anchorBrand);
    score += bundleBrandScore(bundle.title, item.brand ?? null);
    score += bundlePaletteScore(bundle.title, theme.palette);
    if (theme.formality === "Formal" && /dress|formal|polo|suit|tie|shirt/.test(bundle.title.toLowerCase())) {
      score += 0.1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = bundle;
    }
  }

  const note = anchorBrand && best.title.toLowerCase().includes(anchorBrand.toLowerCase())
    ? `Matches ${anchorBrand} anchor across outfit`
    : `Coordinated ${theme.palette[0]?.toLowerCase() ?? "style"} palette`;

  return { bundle: best, score: Math.min(bestScore, 0.98), note };
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

export function outfitHasMultipleSlots(analysis: OutfitAnalysis): boolean {
  return analysis.items.filter((i) => i.fleek_lookup.relevant_bundles.length > 0 || COHESIVE_BUNDLE_OVERRIDES[i.id]).length > 1;
}
