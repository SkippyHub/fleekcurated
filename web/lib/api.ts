import { demoCurate, demoCustomize, DEMO_SCENARIOS, isDemoMode } from "./demo";
import { demoImageFile, enrichDemoAssets } from "./demo-assets";
import { demoCreateMockOrder, demoEstimateOrder } from "./pricing";
import type {
  AnalyzeResponse,
  ApiCurateResponse,
  ApiCustomizeResponse,
  ApiEstimateResponse,
  ApiOrderResponse,
  ApiOutfitItem,
  CurateResult,
  FleekListing,
  MockOrder,
  OutfitAnalysis,
  OutfitItem,
  PriceEstimate,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TIE_PRODUCT_ID = "fleek-hugo-boss-tie";

async function apiReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

function curationOnlyResult(analysis: OutfitAnalysis): CurateResult {
  return {
    analysis,
    customization: {
      item_id: "",
      original_image_url: "",
      customized_image_url: "",
      prompt_used: "",
      status: "mock",
    },
    matched_product: {
      product_id: "",
      title: "",
      url: "https://joinfleek.com",
      price: "",
      image_url: "",
      match_score: 0,
    },
  };
}

function mapAnalyzeToOutfit(data: AnalyzeResponse): OutfitAnalysis {
  const outfit = data.outfit;
  const d = data.description;
  const items = outfit?.items.length
    ? outfit.items.map(mapOutfitItem)
    : [
        {
          id: "primary",
          label: d.clothing_item ?? "Item",
          type: d.clothing_item ?? "Clothing",
          customization_intent: d.customization_intent ?? undefined,
          fleek_lookup: { search_term: d.summary, relevant_bundles: [] },
        },
      ];

  return {
    input_type: outfit?.input_type ?? data.classification.input_type,
    confidence: outfit?.confidence ?? data.classification.confidence,
    summary: outfit?.summary ?? d.summary,
    items,
  };
}

/** Part 1 — Gemini outfit extraction + Fleek lookup (curation only) */
export async function analyzeOutfit(params: {
  text?: string;
  image?: File;
  demoScenario?: "suit" | "tie";
}): Promise<{ analysis: OutfitAnalysis; source: "gemini" | "demo" }> {
  let image = params.image;
  let imageUrl: string | undefined;

  if (params.demoScenario && !image) {
    image = await demoImageFile(params.demoScenario);
    imageUrl = DEMO_SCENARIOS[params.demoScenario].image;
  }

  const apiUp = await apiReachable();
  if (apiUp && (image || params.text?.trim())) {
    try {
      const form = new FormData();
      if (params.text?.trim()) form.append("text", params.text.trim());
      if (image) form.append("image", image);
      if (imageUrl) form.append("image_url", imageUrl);

      const res = await fetch(`${API_BASE}/analyze`, { method: "POST", body: form });
      if (res.ok) {
        const data: AnalyzeResponse = await res.json();
        let analysis = mapAnalyzeToOutfit(data);
        if (params.demoScenario) {
          analysis = enrichDemoAssets(analysis, params.demoScenario);
        }
        return { analysis, source: "gemini" };
      }
    } catch {
      // fall through to offline mock
    }
  }

  const analysis = await demoCurate({
    text: params.text,
    demoScenario: params.demoScenario,
  });
  return { analysis, source: "demo" };
}

function mapOutfitItem(item: ApiOutfitItem): OutfitItem {
  return {
    id: item.id,
    label: item.label,
    type: item.type,
    color: item.color ?? undefined,
    pattern: item.pattern ?? undefined,
    brand: item.brand ?? undefined,
    details: item.details ?? undefined,
    customization_intent: item.customization_intent ?? undefined,
    image_url: item.image_url ?? undefined,
    fleek_lookup: {
      search_term: item.fleek_search_term,
      search_url: item.fleek_search_url ?? undefined,
      relevant_bundles: item.fleek_matches.map((m) => ({
        title: m.title,
        url: m.url,
        price: m.price ?? undefined,
        match_score: m.match_score,
        product_id: m.product_id ?? undefined,
        image_url: m.image_url ?? undefined,
        pieces: m.pieces ?? undefined,
        price_amount: m.price_amount ?? undefined,
      })),
    },
  };
}

function mapApiResponse(data: ApiCurateResponse): CurateResult {
  const d = data.analysis.description;
  const outfit = data.analysis.outfit;
  const items = outfit?.items.length
    ? outfit.items.map(mapOutfitItem)
    : [
        {
          id: "primary",
          label: d.clothing_item ?? "Item",
          type: d.clothing_item ?? "Clothing",
          customization_intent: d.customization_intent ?? undefined,
          fleek_lookup: { search_term: d.summary, relevant_bundles: [] },
        },
      ];

  return {
    analysis: {
      input_type: outfit?.input_type ?? data.analysis.classification.input_type,
      confidence: outfit?.confidence ?? data.analysis.classification.confidence,
      summary: outfit?.summary ?? d.summary,
      items,
    },
    customization: {
      item_id: "primary",
      original_image_url: data.customization.original_image_url,
      customized_image_url: data.customization.customized_image_url,
      prompt_used: data.customization.prompt_used,
      edit_instruction: data.customization.edit_instruction,
      status: data.customization.status as CurateResult["customization"]["status"],
      error: data.customization.error,
    },
    matched_product: data.matched_product,
  };
}

function mapCustomizeResponse(data: ApiCustomizeResponse): Pick<CurateResult, "customization" | "matched_product"> {
  return {
    customization: {
      item_id: data.customization.product_id,
      original_image_url: data.customization.original_image_url,
      customized_image_url: data.customization.customized_image_url,
      prompt_used: data.customization.prompt_used,
      edit_instruction: data.customization.edit_instruction,
      status: data.customization.status as CurateResult["customization"]["status"],
      error: data.customization.error,
    },
    matched_product: data.matched_product,
  };
}

/** Part 2 only — Gemini Banana alteration */
export async function customizeProduct(params: {
  productId: string;
  customizationPrompt: string;
  clothingItem?: string;
  image?: File;
}): Promise<{ data: ApiCustomizeResponse; source: "api" }> {
  const form = new FormData();
  form.append("product_id", params.productId);
  form.append("customization_prompt", params.customizationPrompt);
  if (params.clothingItem) form.append("clothing_item", params.clothingItem);
  if (params.image) form.append("image", params.image);

  const res = await fetch(`${API_BASE}/customize`, { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Customize failed (${res.status})`);
  }

  const data: ApiCustomizeResponse = await res.json();
  return { data, source: "api" };
}

export async function curate(params: {
  productId?: string;
  text?: string;
  image?: File;
  demoScenario?: "suit" | "tie";
  selectedItemId?: string;
  customizationPrompt?: string;
}): Promise<{ result: CurateResult; source: "demo" | "api" | "gemini" }> {
  // Demo tab → send demo photo to Gemini via /analyze when API is up
  if (params.demoScenario || params.image || params.text?.trim()) {
    const { analysis, source } = await analyzeOutfit({
      text: params.text,
      image: params.image,
      demoScenario: params.demoScenario,
    });
    return { result: curationOnlyResult(analysis), source };
  }

  const apiUp = await apiReachable();
  const useDemo = isDemoMode() && !apiUp;

  if (useDemo) {
    const analysis = await demoCurate({ text: params.text });
    return { result: curationOnlyResult(analysis), source: "demo" };
  }

  const form = new FormData();
  form.append("product_id", params.productId ?? "fleek-hugo-boss-tie");
  if (params.text?.trim()) form.append("text", params.text.trim());
  if (params.customizationPrompt?.trim()) {
    form.append("customization_prompt", params.customizationPrompt.trim());
  }
  if (params.image) form.append("image", params.image);

  const res = await fetch(`${API_BASE}/curate`, { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Curate failed (${res.status})`);
  }

  const data: ApiCurateResponse = await res.json();
  const mapped = mapApiResponse(data);
  // Curation step — strip customization until user explicitly customises
  return {
    result: {
      ...mapped,
      customization: curationOnlyResult(mapped.analysis).customization,
      matched_product: curationOnlyResult(mapped.analysis).matched_product,
    },
    source: "api",
  };
}

/** Demo or API customization after wardrobe curation */
export async function customizeCuratedPiece(params: {
  source: "demo" | "api" | "gemini";
  analysis: OutfitAnalysis;
  selectedItemId: string;
  customizationPrompt: string;
  productId?: string;
  listing?: FleekListing;
  clothingItem?: string;
  image?: File;
}): Promise<{ result: Pick<CurateResult, "customization" | "matched_product">; source: "demo" | "api" | "gemini" }> {
  const apiUp = await apiReachable();
  const useDemo = params.source === "demo" || !apiUp;

  if (useDemo) {
    const full = await demoCustomize({
      analysis: params.analysis,
      selectedItemId: params.selectedItemId,
      customizationPrompt: params.customizationPrompt,
      listing: params.listing,
    });
    return {
      result: {
        customization: full.customization,
        matched_product: full.matched_product,
      },
      source: "demo",
    };
  }

  const { data } = await customizeProduct({
    productId: params.productId ?? TIE_PRODUCT_ID,
    customizationPrompt: params.customizationPrompt,
    clothingItem: params.clothingItem,
    image: params.image,
  });
  const mapped = mapCustomizeResponse(data);
  if (params.listing) {
    mapped.matched_product = {
      ...mapped.matched_product,
      product_id: params.listing.product_id ?? mapped.matched_product.product_id,
      title: params.listing.title,
      url: params.listing.url,
      image_url: params.listing.image_url ?? mapped.matched_product.image_url,
    };
    if (params.listing.image_url && !params.image) {
      mapped.customization = {
        ...mapped.customization,
        item_id: params.selectedItemId,
        original_image_url: params.listing.image_url,
      };
    }
  }
  return { result: mapped, source: params.source === "gemini" ? "gemini" : "api" };
}

/** Mock pricing estimate — bundle + AI alteration cost */
export async function estimateOrder(params: {
  productId: string;
  itemId?: string;
  customizationPrompt: string;
  promoCode?: string;
  includePreview?: boolean;
  productTitle?: string;
  productUrl?: string;
  quantity?: number;
}): Promise<{ estimate: PriceEstimate; source: "demo" | "api" }> {
  const apiUp = await apiReachable();
  const useDemo = isDemoMode() && !apiUp;

  if (useDemo) {
    return {
      estimate: demoEstimateOrder(params),
      source: "demo",
    };
  }

  const form = new FormData();
  form.append("product_id", params.productId);
  form.append("customization_prompt", params.customizationPrompt);
  if (params.promoCode) form.append("promo_code", params.promoCode);
  form.append("include_preview", String(params.includePreview !== false));
  form.append("quantity", String(Math.max(1, params.quantity ?? 1)));

  const res = await fetch(`${API_BASE}/estimate`, { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Estimate failed (${res.status})`);
  }

  const data: ApiEstimateResponse = await res.json();
  return { estimate: data.estimate, source: "api" };
}

/** Place mock order — returns confirmation + Fleek checkout URL */
export async function placeMockOrder(params: {
  productId: string;
  itemId?: string;
  customizationPrompt: string;
  promoCode?: string;
  includePreview?: boolean;
  productTitle?: string;
  productUrl?: string;
  quantity?: number;
}): Promise<{ order: MockOrder; source: "demo" | "api" }> {
  const apiUp = await apiReachable();
  const useDemo = isDemoMode() && !apiUp;

  if (useDemo) {
    return {
      order: demoCreateMockOrder(params),
      source: "demo",
    };
  }

  const form = new FormData();
  form.append("product_id", params.productId);
  form.append("customization_prompt", params.customizationPrompt);
  if (params.promoCode) form.append("promo_code", params.promoCode);
  form.append("include_preview", String(params.includePreview !== false));
  form.append("quantity", String(Math.max(1, params.quantity ?? 1)));

  const res = await fetch(`${API_BASE}/orders/mock`, { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Order failed (${res.status})`);
  }

  const data: ApiOrderResponse = await res.json();
  return { order: data.order, source: "api" };
}

export { apiReachable, API_BASE };
