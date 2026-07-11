import type { CurateResult, OutfitAnalysis, OutfitItem } from "./types";

const FLEEK = "https://www.joinfleek.com";

export const DEMO_SCENARIOS = {
  suit: {
    id: "model-suit",
    label: "Model in blue suit",
    image: "/demo/model-suit.png",
    caption: "Describe this outfit and find Fleek bundles for each piece",
  },
  tie: {
    id: "tie-boss",
    label: "Hugo Boss tie",
    image: "/demo/tie-boss.png",
    caption: "Recolour this Hugo Boss tie to burgundy, keep the geometric pattern",
  },
  pile: {
    id: "tie-pile",
    label: "Designer tie bundle",
    image: "/demo/tie-pile.png",
    caption: "Pick the best Hugo Boss tie from this pile for a navy suit",
  },
} as const;

export const MOCK_OUTFIT_SUIT: OutfitAnalysis = {
  input_type: "image",
  confidence: 0.94,
  summary:
    "Sharp business-formal ensemble: mid-blue textured suit, light blue dress shirt, dark blue geometric tie, pocket square and leather belt.",
  items: [
    {
      id: "suit",
      label: "Suit",
      type: "Two-piece suit",
      color: "Mid-to-dark blue",
      pattern: "Crosshatch / linen-like slub texture",
      brand: "Formal menswear",
      details: "Single-breasted jacket, notched lapels, creased trousers",
      fleek_lookup: {
        search_term: "Hugo Boss suit menswear",
        relevant_bundles: [
          {
            title: "Men's Mix Brand Tie & Neckwear (23 pcs)",
            url: `${FLEEK}/products/men-s-mix-brand-tie-neckwear-23-pieces`,
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
        search_term: "Hugo Boss shirts menswear",
        relevant_bundles: [
          {
            title: "Hugo Boss T-Shirts Bundle 0001",
            url: `${FLEEK}/products/hugo-boss-t-shirts0001`,
            price: "Grade AB vintage",
          },
          {
            title: "Hugo Boss Polos and T-Shirt",
            url: `${FLEEK}/products/hugo-boss-polos-and-t-shirt`,
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
      customization_intent: "Recolour to burgundy, preserve pattern and BOSS branding",
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
    "Hugo Boss silk tie in royal blue with white geometric diamond grid and BOSS keeper loop.",
  items: [
    {
      id: "tie",
      label: "Tie",
      type: "Necktie",
      color: "Royal blue",
      pattern: "White geometric diamond grid with circular motifs",
      brand: "Hugo Boss",
      customization_intent: "Recolour base to burgundy, keep pattern exact",
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
      customization_intent: "Best match for navy suit — recolour to burgundy",
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
  const bundle = item.fleek_lookup.relevant_bundles[0];

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
      product_id: item.id,
      title: bundle?.title ?? `${item.brand ?? ""} ${item.type}`.trim(),
      url: bundle?.url ?? FLEEK,
      price: bundle?.price ?? "See Fleek listing",
      image_url: original,
      match_score: 0.92,
    },
  };
}

export function analysisFromText(text: string): OutfitAnalysis {
  const lower = text.toLowerCase();
  if (lower.includes("tie") && (lower.includes("boss") || lower.includes("burgundy"))) {
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
  return items.find((i) => i.id === "tie")?.id ?? items[0]?.id ?? "";
}
