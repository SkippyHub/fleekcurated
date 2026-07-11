import type { AnalyzeResponse, CurateResponse, ProductsResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchProducts(): Promise<ProductsResponse> {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) throw new Error(`Failed to load products (${res.status})`);
  return res.json();
}

export async function analyzePrompt(params: {
  text?: string;
  image?: File;
}): Promise<AnalyzeResponse> {
  const form = new FormData();
  if (params.text?.trim()) form.append("text", params.text.trim());
  if (params.image) form.append("image", params.image);

  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Analysis failed (${res.status})`);
  }

  return res.json();
}

export async function curatePrompt(params: {
  productId: string;
  text?: string;
  image?: File;
}): Promise<CurateResponse> {
  const form = new FormData();
  form.append("product_id", params.productId);
  if (params.text?.trim()) form.append("text", params.text.trim());
  if (params.image) form.append("image", params.image);

  const res = await fetch(`${API_BASE}/curate`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Curate failed (${res.status})`);
  }

  return res.json();
}
