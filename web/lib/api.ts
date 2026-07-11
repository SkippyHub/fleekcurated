import { demoCurate, isDemoMode } from "./demo";
import type { ApiCurateResponse, CurateResult } from "./types";

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
      status: data.customization.status as CurateResult["customization"]["status"],
    },
    matched_product: data.matched_product,
  };
}

export async function curate(params: {
  productId?: string;
  text?: string;
  image?: File;
  demoScenario?: "suit" | "tie" | "pile";
  selectedItemId?: string;
  customizationPrompt?: string;
}): Promise<{ result: CurateResult; source: "demo" | "api" }> {
  const useDemo = isDemoMode() || !(await apiReachable());

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
  form.append("product_id", params.productId ?? "fleek-black-hoodie");
  if (params.text?.trim()) form.append("text", params.text.trim());
  if (params.image) form.append("image", params.image);

  const res = await fetch(`${API_BASE}/curate`, { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Curate failed (${res.status})`);
  }

  const data: ApiCurateResponse = await res.json();
  return { result: mapApiResponse(data), source: "api" };
}
