/**
 * Garment-type aware Fleek bundle matching — prevents jackets → t-shirt mismatches.
 */

export interface FleekBundle {
  title: string;
  url: string;
  price?: string;
  product_id?: string;
}

/** Slot id or garment type → what the bundle title/search must align with */
const GARMENT_RULES: Record<
  string,
  { include: string[]; exclude: string[]; categories: string[] }
> = {
  jacket: {
    include: ["jacket", "blazer", "suit", "sport coat", "menswear", "formal"],
    exclude: ["tie", "neckwear", "t-shirt", "tee", "polo", "hoodie", "jeans", "trouser", "pant"],
    categories: ["jacket"],
  },
  shirt: {
    include: ["dress shirt", "formal shirt", "button", "shirt", "hugo boss"],
    exclude: ["tie", "neckwear", "t-shirt", "tee", "polo", "hoodie", "jacket", "blazer", "jeans", "trouser"],
    categories: ["shirt"],
  },
  trousers: {
    include: ["trouser", "pant", "chino", "dress pant", "formal", "suit"],
    exclude: ["tie", "neckwear", "t-shirt", "tee", "polo", "hoodie", "jacket", "blazer", "jeans", "shirt"],
    categories: ["trousers", "pants"],
  },
  tie: {
    include: ["tie", "necktie", "neckwear", "designer tie"],
    exclude: ["t-shirt", "tee", "polo", "hoodie", "jacket", "shirt", "trouser", "jeans"],
    categories: ["tie"],
  },
  "tie-selected": {
    include: ["tie", "necktie", "neckwear", "designer tie"],
    exclude: ["t-shirt", "tee", "polo", "hoodie", "jacket", "shirt", "trouser", "jeans"],
    categories: ["tie"],
  },
  "pocket-square": {
    include: ["pocket square", "accessory", "handkerchief"],
    exclude: ["tie", "t-shirt", "jacket"],
    categories: ["accessory"],
  },
};

function rulesForItem(itemId: string, garmentType: string) {
  if (GARMENT_RULES[itemId]) return GARMENT_RULES[itemId];
  const lower = garmentType.toLowerCase();
  if (/jacket|blazer/.test(lower)) return GARMENT_RULES.jacket;
  if (/dress shirt|formal shirt/.test(lower)) return GARMENT_RULES.shirt;
  if (/trouser|pant/.test(lower)) return GARMENT_RULES.trousers;
  if (/tie|necktie/.test(lower)) return GARMENT_RULES.tie;
  return { include: [], exclude: [], categories: [] };
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

  // Dress shirt must not match plain "t-shirt" title
  if (itemId === "shirt" || /dress shirt/i.test(garmentType)) {
    if (/t-shirt|tee\b|polo/i.test(bundle.title)) return -1;
    if (/dress|formal|button/i.test(bundle.title)) score += 0.25;
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
  const scored = candidates
    .map((b) => ({
      bundle: b,
      score: scoreBundleForGarment(b, itemId, garmentType, searchTerm),
    }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score);

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
  const score = scoreBundleForGarment(best[0], itemId, garmentType, searchTerm);
  return { bundle: best[0], score: Math.max(score, 0.55) };
}

/** Curated Fleek bundles per slot — garment-correct for blue formal suit demo */
export const FLEEK_SLOT_BUNDLES: Record<string, FleekBundle[]> = {
  jacket: [
    {
      product_id: "fleek-mens-blazer-mix",
      title: "Men's Blazer & Suit Jacket Mix",
      url: "https://www.joinfleek.com/search?q=mens+blazer+suit+jacket&options[prefix]=last",
      price: "Wholesale bundle",
    },
  ],
  shirt: [
    {
      product_id: "fleek-hugo-boss-formal-shirts",
      title: "Hugo Boss Formal Shirts Bundle",
      url: "https://www.joinfleek.com/search?q=Hugo+Boss+formal+dress+shirts&options[prefix]=last",
      price: "Grade AB — formal line",
    },
  ],
  trousers: [
    {
      product_id: "fleek-mens-formal-trousers",
      title: "Men's Formal Trousers Mix",
      url: "https://www.joinfleek.com/search?q=mens+formal+trousers&options[prefix]=last",
      price: "Wholesale bundle",
    },
  ],
  tie: [
    {
      product_id: "fleek-hugo-boss-tie",
      title: "Designer Ties Bundle (500 pcs)",
      url: "https://www.joinfleek.com/products/designer-ties-bundle-set-of-500",
      price: "Bulk wholesale",
    },
    {
      product_id: "fleek-mix-neckwear",
      title: "Men's Mix Brand Tie & Neckwear (23 pcs)",
      url: "https://www.joinfleek.com/products/men-s-mix-brand-tie-neckwear-23-pieces",
      price: "Wholesale bundle",
    },
  ],
  "tie-selected": [
    {
      product_id: "fleek-hugo-boss-tie",
      title: "Designer Ties Bundle (500 pcs)",
      url: "https://www.joinfleek.com/products/designer-ties-bundle-set-of-500",
      price: "Bulk wholesale",
    },
  ],
};
