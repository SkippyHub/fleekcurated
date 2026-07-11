export type InputType = "text" | "image";

export interface FleekLookup {
  search_term: string;
  relevant_bundles: { title: string; url: string; price?: string }[];
}

export interface OutfitItem {
  id: string;
  label: string;
  type: string;
  color?: string;
  pattern?: string;
  brand?: string;
  details?: string;
  customization_intent?: string;
  fleek_lookup: FleekLookup;
  image_url?: string;
}

export interface OutfitAnalysis {
  input_type: InputType;
  confidence: number;
  summary: string;
  items: OutfitItem[];
}

export interface CustomizationResult {
  item_id: string;
  original_image_url: string;
  customized_image_url: string;
  prompt_used: string;
  status: "demo" | "mock" | "generated";
}

export interface ProductMatch {
  product_id: string;
  title: string;
  url: string;
  price: string;
  image_url: string;
  match_score: number;
}

export interface CurateResult {
  analysis: OutfitAnalysis;
  customization: CustomizationResult;
  matched_product: ProductMatch;
}

// Legacy API types (when backend is running)
export interface ClassificationResult {
  input_type: InputType;
  confidence: number;
  reason: string;
}

export interface PromptDescription {
  input_type: InputType;
  summary: string;
  clothing_item: string | null;
  customization_intent: string | null;
  style_tags: string[];
  raw_input: string | null;
  image_url: string | null;
}

export interface AnalyzeResponse {
  classification: ClassificationResult;
  description: PromptDescription;
}

export interface MockProduct {
  id: string;
  title: string;
  category: string;
  style_tags: string[];
  price: string;
  url: string;
  image_url: string;
}

export interface ApiCurateResponse {
  analysis: AnalyzeResponse;
  customization: {
    product_id: string;
    original_image_url: string;
    customized_image_url: string;
    prompt_used: string;
    status: string;
  };
  matched_product: ProductMatch;
}
