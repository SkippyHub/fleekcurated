import { demoCurate, isDemoMode } from "./demo";
import { demoCreateMockOrder, demoEstimateOrder } from "./pricing";
import type {
  ApiCurateResponse,
  ApiCustomizeResponse,
  ApiEstimateResponse,
  ApiOrderResponse,
  ApiOutfitItem,
  CurateResult,
  MockOrder,
  OutfitItem,
  PriceEstimate,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
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
      relevant_bundles: item.fleek_matches.map((m) => ({
        title: m.title,
        url: m.url,
        price: m.price ?? undefined,
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
  demoScenario?: "suit" | "tie" | "pile";
  selectedItemId?: string;
  customizationPrompt?: string;
}): Promise<{ result: CurateResult; source: "demo" | "api" }> {
  const apiUp = await apiReachable();
  const useDemo = isDemoMode() && !apiUp;

  if (useDemo) {
    const result = await demoCurate({
      text: params.text,
      demoScenario: params.demoScenario,
      selectedItemId: params.selectedItemId,
      customizationPrompt: params.customizationPrompt,
    });
    return { result, source: "demo" };
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
  return { result: mapApiResponse(data), source: "api" };
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
