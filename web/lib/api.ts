import { demoCurate, isDemoMode } from "./demo";
import type { ApiCurateResponse, ApiCustomizeResponse, CurateResult } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

function mapApiResponse(data: ApiCurateResponse): CurateResult {
  const d = data.analysis.description;
  return {
    analysis: {
      input_type: data.analysis.classification.input_type,
      confidence: data.analysis.classification.confidence,
      summary: d.summary,
      items: [
        {
          id: "primary",
          label: d.clothing_item ?? "Item",
          type: d.clothing_item ?? "Clothing",
          customization_intent: d.customization_intent ?? undefined,
          fleek_lookup: { search_term: d.summary, relevant_bundles: [] },
        },
      ],
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

export { apiReachable, API_BASE };
