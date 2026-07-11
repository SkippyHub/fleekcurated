import {
  analysisFromDemoScenario,
  analysisFromText,
  buildDemoCurateResult,
  defaultSelectedItem,
  DEMO_SCENARIOS,
} from "./mock-data";
import type { CurateResult, OutfitAnalysis } from "./types";

const DEMO_DELAY_MS = 900;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
}

export async function demoAnalyze(params: {
  text?: string;
  demoScenario?: keyof typeof DEMO_SCENARIOS;
}): Promise<OutfitAnalysis> {
  await wait(DEMO_DELAY_MS);
  if (params.demoScenario) {
    return analysisFromDemoScenario(params.demoScenario);
  }
  return analysisFromText(params.text ?? "");
}

export async function demoCurate(params: {
  text?: string;
  demoScenario?: keyof typeof DEMO_SCENARIOS;
  selectedItemId?: string;
  customizationPrompt?: string;
}): Promise<CurateResult> {
  const analysis = await demoAnalyze(params);
  const selectedItemId =
    params.selectedItemId ?? defaultSelectedItem(analysis.items);
  return buildDemoCurateResult({
    analysis,
    selectedItemId,
    customizationPrompt:
      params.customizationPrompt ??
      params.text ??
      "Add embroidered 'join fleek' branding, preserve pattern and logo",
  });
}

export { DEMO_SCENARIOS };
