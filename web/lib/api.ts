import type { AnalyzeResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
