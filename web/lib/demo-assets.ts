import { DEMO_SCENARIOS } from "./demo";
import type { OutfitAnalysis, OutfitItem } from "./types";

export async function demoImageFile(
  scenario: keyof typeof DEMO_SCENARIOS
): Promise<File> {
  const asset = DEMO_SCENARIOS[scenario];
  const res = await fetch(asset.image);
  if (!res.ok) throw new Error(`Failed to load demo image: ${asset.image}`);
  const blob = await res.blob();
  const ext = asset.image.split(".").pop() ?? "png";
  return new File([blob], `${scenario}.${ext}`, { type: blob.type || "image/png" });
}

function isTieItem(item: OutfitItem): boolean {
  return item.id.includes("tie") || /tie|necktie/i.test(item.type);
}

/** Attach known demo crop URLs after Gemini extraction (Gemini describes, we supply crops). */
export function enrichDemoAssets(
  analysis: OutfitAnalysis,
  scenario: keyof typeof DEMO_SCENARIOS
): OutfitAnalysis {
  const items = analysis.items.map((item) => {
    if (scenario === "suit" && isTieItem(item)) {
      return {
        ...item,
        image_url: item.image_url ?? "/demo/tie-boss.png",
        customization_intent:
          item.customization_intent ??
          "Add embroidered 'join fleek' branding make it stand out, keep pattern and BOSS logo",
      };
    }
    if (scenario === "tie" && isTieItem(item)) {
      return {
        ...item,
        image_url: item.image_url ?? "/demo/tie-boss.png",
        customization_intent:
          item.customization_intent ??
          "Add subtle 'join fleek' embroidery, keep pattern exact",
      };
    }
    return item;
  });

  return { ...analysis, items };
}
