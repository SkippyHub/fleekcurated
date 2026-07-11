import { matchedBundlesForItem } from "./outfit-matcher";
import { resolveProductId } from "./pricing";
import type { CurateResult, OutfitAnalysis, OutfitItem } from "./types";

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
    caption: "Crop from the suit photo — ready for join fleek embroidery",
    primary: false,
    flow: "customize" as const,
  },
  pile: {
    id: "tie-pile",
    label: "Wholesale tie pile",
    image: "/demo/tie-pile.png",
    caption: "Pick the best Hugo Boss tie from a Fleek bundle",
    primary: false,
    flow: "select" as const,
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
            title: "Men's Blazer & Suit Jacket Mix",
            url: `${FLEEK}/search?q=mens+blazer+suit+jacket&options[prefix]=last`,
            price: "Wholesale bundle",
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
            title: "Hugo Boss Formal Shirts Bundle",
            url: `${FLEEK}/search?q=Hugo+Boss+formal+dress+shirts&options[prefix]=last`,
            price: "Grade AB — formal line",
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
            title: "Men's Formal Trousers Mix",
            url: `${FLEEK}/search?q=mens+formal+trousers&options[prefix]=last`,
            price: "Wholesale bundle",
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
            title: "Designer Ties Bundle (500 pcs)",
            url: `${FLEEK}/products/designer-ties-bundle-set-of-500`,
            price: "Bulk wholesale",
          },
          {
            title: "Men's Mix Brand Tie & Neckwear",
            url: `${FLEEK}/products/men-s-mix-brand-tie-neckwear-23-pieces`,
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
            title: "Designer Ties Bundle (500 pcs)",
            url: `${FLEEK}/products/designer-ties-bundle-set-of-500`,
            price: "Bulk wholesale",
          },
        ],
      },
    },
  ],
};

export const MOCK_OUTFIT_PILE: OutfitAnalysis = {
  input_type: "image",
  confidence: 0.91,
  summary:
    "Wholesale designer tie bundle: Hugo Boss, Giorgio Armani, Kenzo, Moschino, Burberry, Versace, Balmain.",
  items: [
    {
      id: "tie-selected",
      label: "Selected tie",
      type: "Necktie",
      color: "Dark navy",
      pattern: "Blue geometric lattice (Hugo Boss)",
      brand: "Hugo Boss",
      customization_intent: "Best match for navy suit — add 'join fleek' embroidery",
      image_url: "/demo/tie-boss.png",
      fleek_lookup: {
        search_term: "Hugo Boss ties neckwear",
        relevant_bundles: [
          {
            title: "Designer Ties Bundle (500 pcs)",
            url: `${FLEEK}/products/designer-ties-bundle-set-of-500`,
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
}): CurateResult {
  const item =
    params.analysis.items.find((i) => i.id === params.selectedItemId) ??
    params.analysis.items[0];

  const original = item.image_url ?? "/demo/tie-boss.png";
  const matched = matchedBundlesForItem(item, 1)[0] ?? item.fleek_lookup.relevant_bundles[0];
  const productId = resolveProductId(item.id);

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
      title: matched?.title ?? `${item.brand ?? ""} ${item.type}`.trim(),
      url: matched?.url ?? FLEEK,
      price: matched?.price ?? "See Fleek listing",
      image_url: original,
      match_score: 0.92,
    },
  };
}

export function analysisFromText(text: string): OutfitAnalysis {
  const lower = text.toLowerCase();
  if (lower.includes("tie") && (lower.includes("boss") || lower.includes("fleek") || lower.includes("embroid"))) {
    return { ...MOCK_OUTFIT_TIE, summary: text };
  }
  if (lower.includes("pile") || lower.includes("bundle") || lower.includes("select")) {
    return { ...MOCK_OUTFIT_PILE, summary: text };
  }
  return { ...MOCK_OUTFIT_SUIT, summary: text, input_type: "text" };
}

export function analysisFromDemoScenario(
  scenarioId: keyof typeof DEMO_SCENARIOS
): OutfitAnalysis {
  if (scenarioId === "tie") return MOCK_OUTFIT_TIE;
  if (scenarioId === "pile") return MOCK_OUTFIT_PILE;
  return MOCK_OUTFIT_SUIT;
}

export function defaultSelectedItem(items: OutfitItem[]): string {
  return items.find((i) => i.id === "tie")?.id ?? items.find((i) => i.customization_intent)?.id ?? items[0]?.id ?? "";
}

export function selectedItemLabel(items: OutfitItem[], selectedId: string): string {
  return items.find((i) => i.id === selectedId)?.label ?? "Item";
}
