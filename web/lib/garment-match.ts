/**
 * Garment-type aware Fleek bundle matching — prevents jackets → t-shirt mismatches.
 * When the API already scored bundles, preserve that order after slot filtering.
 */

export interface FleekBundle {
  title: string;
  url: string;
  price?: string;
  product_id?: string;
  match_score?: number;
  image_url?: string;
  pieces?: number;
  price_amount?: number;
}

const GARMENT_RULES: Record<
  string,
  { include: string[]; exclude: string[]; categories: string[] }
> = {
  jacket: {
    include: ["jacket", "blazer", "suit", "sport coat", "menswear", "formal"],
    exclude: ["tie", "neckwear", "t-shirt", "tee", "polo shirt", "hoodie", "jeans", "trouser", "pant", "shirt"],
    categories: ["jacket"],
  },
  shirt: {
    include: ["dress shirt", "formal shirt", "button", "shirt", "hugo boss", "polo"],
    exclude: ["tie", "neckwear", "t-shirt", "tee", "baby tee", "hoodie", "jacket", "blazer", "jeans", "trouser"],
    categories: ["shirt"],
  },
  trousers: {
    include: ["trouser", "pant", "chino", "dress pant", "formal", "suit"],
    exclude: ["tie", "neckwear", "t-shirt", "tee", "polo", "hoodie", "jacket", "blazer", "shirt"],
    categories: ["trousers", "pants"],
  },
  tie: {
    include: ["tie", "necktie", "neckwear", "designer tie"],
    exclude: ["t-shirt", "tee", "polo", "hoodie", "jacket", "shirt", "trouser", "jeans", "tie dye", "upcycled"],
    categories: ["tie"],
  },
  accessory: {
    include: ["pocket square", "accessory", "handkerchief", "belt"],
    exclude: ["tie dye", "upcycled tie", "jacket", "blazer", "shirt", "trouser"],
    categories: ["accessory"],
  },
};

const SLOT_ALIASES: Record<string, string> = {
  "suit-jacket": "jacket",
  blazer: "jacket",
  necktie: "tie",
  pants: "trousers",
  "dress-trousers": "trousers",
  "pocket-square": "accessory",
};

function normalizeSlot(itemId: string, garmentType: string): string {
  const slug = itemId.trim().toLowerCase();
  if (SLOT_ALIASES[slug]) return SLOT_ALIASES[slug];
  if (GARMENT_RULES[slug]) return slug;
  const lower = garmentType.toLowerCase();
  if (/jacket|blazer/.test(lower)) return "jacket";
  if (/dress shirt|formal shirt|button/.test(lower)) return "shirt";
  if (/trouser|pant|chino/.test(lower)) return "trousers";
  if (/tie|necktie/.test(lower)) return "tie";
  if (/pocket square|accessory/.test(lower)) return "accessory";
  return slug;
}

function rulesForItem(itemId: string, garmentType: string) {
  const slot = normalizeSlot(itemId, garmentType);
  return GARMENT_RULES[slot] ?? { include: [], exclude: [], categories: [] };
}

export function scoreBundleForGarment(
  bundle: FleekBundle,
  itemId: string,
  garmentType: string,
  searchTerm: string
): number {
  const rules = rulesForItem(itemId, garmentType);
  const haystack = `${bundle.title} ${searchTerm}`.toLowerCase();

  for (const ex of rules.exclude) {
    if (haystack.includes(ex)) return -1;
  }

  let score = 0.2;
  for (const inc of rules.include) {
    if (haystack.includes(inc)) score += 0.18;
  }

  if (normalizeSlot(itemId, garmentType) === "shirt" || /dress shirt/i.test(garmentType)) {
    if (/t-shirt|tee\b|baby tee|polo t-shirt/i.test(bundle.title)) return -1;
    if (/dress|formal|button/i.test(bundle.title)) score += 0.25;
  }

  if (normalizeSlot(itemId, garmentType) === "accessory") {
    if (!/pocket square|handkerchief|belt|accessory/i.test(bundle.title)) return -1;
  }

  return Math.min(score, 1);
}

export function pickBestBundles(
  candidates: FleekBundle[],
  itemId: string,
  garmentType: string,
  searchTerm: string,
  limit = 2
): FleekBundle[] {
  const hasApiScores = candidates.some((b) => (b.match_score ?? 0) > 0);

  const scored = candidates
    .map((b) => ({
      bundle: b,
      garmentScore: scoreBundleForGarment(b, itemId, garmentType, searchTerm),
      apiScore: b.match_score ?? 0,
    }))
    .filter((x) => x.garmentScore >= 0);

  scored.sort((a, b) => {
    if (hasApiScores && a.apiScore !== b.apiScore) return b.apiScore - a.apiScore;
    if (b.garmentScore !== a.garmentScore) return b.garmentScore - a.garmentScore;
    return b.apiScore - a.apiScore;
  });

  return scored.slice(0, limit).map((x) => x.bundle);
}

export function pickBestBundle(
  candidates: FleekBundle[],
  itemId: string,
  garmentType: string,
  searchTerm: string
): { bundle: FleekBundle; score: number } | null {
  const best = pickBestBundles(candidates, itemId, garmentType, searchTerm, 1);
  if (!best.length) return null;
  const garmentScore = scoreBundleForGarment(best[0], itemId, garmentType, searchTerm);
  const score = best[0].match_score ?? Math.max(garmentScore, 0.55);
  return { bundle: best[0], score };
}

/** Curated Fleek bundles per slot — offline fallback with real joinfleek.com URLs */
export const FLEEK_SLOT_BUNDLES: Record<string, FleekBundle[]> = {
  jacket: [
    {
      product_id: "fleek-polo-ralph-lauren-blazers",
      title: "Polo Ralph Lauren Blazers",
      url: "https://www.joinfleek.com/products/polo-ralph-lauren-blazers",
      price: "Wholesale bundle",
      match_score: 0.9,
    },
    {
      product_id: "fleek-mens-blazer-mix",
      title: "Men's Blazer & Suit Jacket Mix",
      url: "https://www.joinfleek.com/products/mens-blazer-suit-jacket-mix",
      price: "Wholesale bundle",
      match_score: 0.85,
    },
  ],
  shirt: [
    {
      product_id: "fleek-hugo-boss-formal-shirts",
      title: "Hugo Boss Formal Shirts Bundle",
      url: "https://www.joinfleek.com/products/hugo-boss-formal-shirts-bundle",
      price: "Grade AB — formal line",
      match_score: 0.92,
    },
    {
      product_id: "fleek-rl-dress-shirts",
      title: "Ralph Lauren Button-Up Shirts Bundle",
      url: "https://www.joinfleek.com/products/ralph-lauren-button-up-shirts-bundle-tl-40",
      price: "Wholesale bundle",
      match_score: 0.88,
    },
  ],
  trousers: [
    {
      product_id: "fleek-ralph-lauren-trousers",
      title: "Ralph Lauren Trousers",
      url: "https://www.joinfleek.com/products/ralph-lauren-trousers",
      price: "Wholesale bundle",
      match_score: 0.9,
    },
    {
      product_id: "fleek-mens-formal-trousers",
      title: "Men's Formal Trousers Mix",
      url: "https://www.joinfleek.com/products/mens-formal-trousers-mix",
      price: "Wholesale bundle",
      match_score: 0.85,
    },
  ],
  tie: [
    {
      product_id: "fleek-hugo-boss-tie",
      title: "Designer Ties Bundle (500 pcs)",
      url: "https://www.joinfleek.com/products/designer-ties-bundle-set-of-500",
      price: "Bulk wholesale",
      match_score: 0.95,
    },
    {
      product_id: "fleek-mix-neckwear",
      title: "Men's Mix Brand Tie & Neckwear (23 pcs)",
      url: "https://www.joinfleek.com/products/men-s-mix-brand-tie-neckwear-23-pieces",
      price: "Wholesale bundle",
      match_score: 0.88,
    },
  ],
};
