import { matchedBundlesForItem } from "./outfit-matcher";
import { resolveProductId } from "./pricing";
import type { CurateResult, FleekListing, OutfitAnalysis, OutfitItem } from "./types";

const FLEEK = "https://www.joinfleek.com";

export const DEMO_SCENARIOS = {
  suit: {
    id: "model-suit",
    label: "Model in blue suit",
    image: "/demo/model-suit.png",
    caption: "Full outfit — extract jacket, shirt, trousers & tie, match each to Fleek",
    primary: true,
    flow: "extract" as const,
  },
  tie: {
    id: "tie-boss",
    label: "Tie close-up (extracted)",
    image: "/demo/tie-boss.png",
    caption: "Gemini crop from the suit photo — the piece you customise",
    primary: false,
    flow: "customize" as const,
  },
} as const;

export const MOCK_OUTFIT_SUIT: OutfitAnalysis = {
  input_type: "image",
  confidence: 0.94,
  summary:
    "Sharp business-formal ensemble: mid-blue textured suit jacket and trousers, light blue dress shirt, dark blue geometric tie, pocket square and leather belt.",
  items: [
    {
      id: "jacket",
      label: "Jacket",
      type: "Suit jacket",
      color: "Mid-to-dark blue",
      pattern: "Crosshatch / linen-like slub texture",
      brand: "Formal menswear",
      details: "Single-breasted, notched lapels",
      fleek_lookup: {
        search_term: "mens blazer suit jacket wholesale",
        relevant_bundles: [
          {
            product_id: "fleek-polo-ralph-lauren-blazers",
            title: "Polo Ralph Lauren Blazers",
            url: `${FLEEK}/products/polo-ralph-lauren-blazers`,
            price: "Wholesale bundle",
            match_score: 0.9,
          },
          {
            product_id: "fleek-mens-blazer-mix",
            title: "Men's Blazer & Suit Jacket Mix",
            url: `${FLEEK}/products/mens-blazer-suit-jacket-mix`,
            price: "Wholesale bundle",
            match_score: 0.85,
          },
        ],
      },
    },
    {
      id: "shirt",
      label: "Shirt",
      type: "Dress shirt",
      color: "Light blue",
      brand: "Hugo Boss",
      details: "Structured spread collar",
      fleek_lookup: {
        search_term: "Hugo Boss formal dress shirts",
        relevant_bundles: [
          {
            product_id: "fleek-hugo-boss-formal-shirts",
            title: "Hugo Boss Formal Shirts Bundle",
            url: `${FLEEK}/products/hugo-boss-formal-shirts-bundle`,
            price: "Grade AB — formal line",
            match_score: 0.92,
          },
          {
            product_id: "fleek-hugo-boss-shirts",
            title: "Hugo Boss Shirts Bundle",
            url: `${FLEEK}/products/hugo-boss-shirts`,
            price: "Wholesale bundle",
            match_score: 0.88,
          },
        ],
      },
    },
    {
      id: "trousers",
      label: "Trousers",
      type: "Dress trousers",
      color: "Mid-to-dark blue",
      pattern: "Matching crosshatch texture",
      brand: "Formal menswear",
      details: "Flat front, creased leg",
      fleek_lookup: {
        search_term: "mens formal trousers dress pants wholesale",
        relevant_bundles: [
          {
            product_id: "fleek-mens-formal-trousers",
            title: "Men's Formal Trousers Mix",
            url: `${FLEEK}/products/mens-formal-trousers-mix`,
            price: "Wholesale bundle",
            match_score: 0.88,
          },
          {
            product_id: "fleek-ralph-lauren-trousers",
            title: "Ralph Lauren Trousers",
            url: `${FLEEK}/products/ralph-lauren-trousers`,
            price: "Wholesale bundle",
            match_score: 0.86,
          },
        ],
      },
    },
    {
      id: "tie",
      label: "Tie",
      type: "Necktie",
      color: "Dark blue",
      pattern: "Geometric white & light blue medallion grid",
      brand: "Hugo Boss",
      customization_intent: "Add embroidered 'join fleek' branding, keep pattern and BOSS logo",
      image_url: "/demo/tie-boss.png",
      fleek_lookup: {
        search_term: "Hugo Boss ties neckwear",
        relevant_bundles: [
          {
            product_id: "fleek-hugo-boss-tie",
            title: "Designer Ties Bundle (500 pcs)",
            url: `${FLEEK}/products/designer-ties-bundle-set-of-500`,
            price: "Bulk wholesale",
            match_score: 0.95,
          },
          {
            product_id: "fleek-mix-neckwear",
            title: "Men's Mix Brand Tie & Neckwear (23 pcs)",
            url: `${FLEEK}/products/men-s-mix-brand-tie-neckwear-23-pieces`,
            price: "Wholesale bundle",
            match_score: 0.88,
          },
        ],
      },
    },
    {
      id: "pocket-square",
      label: "Pocket square",
      type: "Accessory",
      color: "Light blue / white",
      fleek_lookup: {
        search_term: "Menswear pocket square accessories",
        relevant_bundles: [],
      },
    },
  ],
};

export const MOCK_OUTFIT_TIE: OutfitAnalysis = {
  input_type: "image",
  confidence: 0.97,
  summary:
    "Extracted Hugo Boss silk tie — royal blue with white geometric diamond grid and BOSS keeper loop (crop from full outfit).",
  items: [
    {
      id: "tie",
      label: "Tie",
      type: "Necktie",
      color: "Royal blue",
      pattern: "White geometric diamond grid with circular motifs",
      brand: "Hugo Boss",
      customization_intent: "Add subtle 'join fleek' embroidery, keep pattern exact",
      image_url: "/demo/tie-boss.png",
      fleek_lookup: {
        search_term: "Hugo Boss ties neckwear",
        relevant_bundles: [
          {
            product_id: "fleek-hugo-boss-tie",
            title: "Designer Ties Bundle (500 pcs)",
            url: `${FLEEK}/products/designer-ties-bundle-set-of-500`,
            price: "Bulk wholesale",
            match_score: 0.95,
          },
          {
            product_id: "fleek-mix-neckwear",
            title: "Men's Mix Brand Tie & Neckwear (23 pcs)",
            url: `${FLEEK}/products/men-s-mix-brand-tie-neckwear-23-pieces`,
            price: "Wholesale bundle",
            match_score: 0.88,
          },
        ],
      },
    },
  ],
};

export function buildDemoCurateResult(params: {
  analysis: OutfitAnalysis;
  selectedItemId: string;
  customizationPrompt: string;
  listing?: FleekListing;
}): CurateResult {
  const item =
    params.analysis.items.find((i) => i.id === params.selectedItemId) ??
    params.analysis.items[0];

  const listing = params.listing;
  const fallback =
    matchedBundlesForItem(item, 1)[0] ?? item.fleek_lookup.relevant_bundles[0];
  const original = listing?.image_url ?? item.image_url ?? "/demo/tie-boss.png";
  const productId =
    listing?.product_id?.startsWith("fleek-") ? listing.product_id : resolveProductId(item.id);

  return {
    analysis: params.analysis,
    customization: {
      item_id: item.id,
      original_image_url: original,
      customized_image_url: original,
      prompt_used: params.customizationPrompt || item.customization_intent || params.analysis.summary,
      status: "demo",
    },
    matched_product: {
      product_id: productId,
      title: listing?.title ?? fallback?.title ?? `${item.brand ?? ""} ${item.type}`.trim(),
      url: listing?.url ?? fallback?.url ?? FLEEK,
      price: listing?.price ?? fallback?.price ?? "See Fleek listing",
      image_url: original,
      match_score: listing?.match_score ?? 0.92,
    },
  };
}

export function analysisFromText(text: string): OutfitAnalysis {
  const lower = text.toLowerCase();
  if (lower.includes("tie") && (lower.includes("boss") || lower.includes("fleek") || lower.includes("embroid"))) {
    return { ...MOCK_OUTFIT_TIE, summary: text };
  }
  return { ...MOCK_OUTFIT_SUIT, summary: text, input_type: "text" };
}

export function analysisFromDemoScenario(
  scenarioId: keyof typeof DEMO_SCENARIOS
): OutfitAnalysis {
  if (scenarioId === "tie") return MOCK_OUTFIT_TIE;
  return MOCK_OUTFIT_SUIT;
}

export function defaultSelectedItem(items: OutfitItem[]): string {
  return items.find((i) => i.id === "tie")?.id ?? items.find((i) => i.customization_intent)?.id ?? items[0]?.id ?? "";
}

export function selectedItemLabel(items: OutfitItem[], selectedId: string): string {
  return items.find((i) => i.id === selectedId)?.label ?? "Item";
}
