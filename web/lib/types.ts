export type InputType = "text" | "image";

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

export interface CustomizationResult {
  product_id: string;
  original_image_url: string;
  customized_image_url: string;
  prompt_used: string;
  status: string;
}

export interface ProductMatch {
  product_id: string;
  title: string;
  url: string;
  price: string;
  image_url: string;
  match_score: number;
}

export interface CurateResponse {
  analysis: AnalyzeResponse;
  customization: CustomizationResult;
  matched_product: ProductMatch;
}

export interface ProductsResponse {
  products: MockProduct[];
}
