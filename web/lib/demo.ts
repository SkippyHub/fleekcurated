import {
  analysisFromDemoScenario,
  analysisFromText,
  buildDemoCurateResult,
  DEMO_SCENARIOS,
} from "./mock-data";
import type { CurateResult, FleekListing, OutfitAnalysis } from "./types";

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
}): Promise<OutfitAnalysis> {
  return demoAnalyze(params);
}

export async function demoCustomize(params: {
  analysis: OutfitAnalysis;
  selectedItemId: string;
  customizationPrompt: string;
  listing?: FleekListing;
}): Promise<CurateResult> {
  await wait(DEMO_DELAY_MS);
  return buildDemoCurateResult(params);
}

export { DEMO_SCENARIOS };
