export type InputType = "text" | "image";

export interface FleekLookup {
  search_term: string;
  relevant_bundles: { title: string; url: string; price?: string }[];
}

export interface OutfitTheme {
  palette: string[];
  brands: string[];
  style: string;
  formality: string;
}

/** One extracted slot matched to a Fleek bundle that fits the overall outfit */
export interface MatchedOutfitSlot {
  item_id: string;
  label: string;
  type: string;
  color?: string;
  image_url?: string;
  bundle: { title: string; url: string; price?: string };
  match_score: number;
  cohesion_note: string;
}

/** Full outfit re-merged from individually matched, style-coherent Fleek bundles */
export interface CohesiveOutfit {
  theme: OutfitTheme;
  slots: MatchedOutfitSlot[];
  cohesion_score: number;
  summary: string;
  anchor_brand: string | null;
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
  edit_instruction?: string | null;
  status: "demo" | "mock" | "generated" | "cached" | "quota_exceeded" | "error";
  error?: string | null;
}

export interface ProductMatch {
  product_id: string;
  title: string;
  url: string;
  price: string;
  image_url: string;
  match_score: number;
}

export interface PriceLineItem {
  label: string;
  amount: number;
  currency: string;
  kind: "bundle" | "customization" | "discount" | "shipping";
  detail?: string | null;
}

export interface PriceEstimate {
  line_items: PriceLineItem[];
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  api_cost_gbp: number;
  customization_fee_gbp: number;
  bundle_price_gbp: number;
  promo_applied?: string | null;
  notes: string[];
}

export interface MockOrder {
  order_id: string;
  status: "draft" | "confirmed" | "redirected";
  product_id: string;
  product_title: string;
  customization_prompt: string;
  estimate: PriceEstimate;
  checkout_url: string;
  created_at: string;
  message: string;
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
    edit_instruction?: string | null;
    status: string;
    error?: string | null;
  };
  matched_product: ProductMatch;
}

export interface ApiCustomizeResponse {
  customization: ApiCurateResponse["customization"];
  matched_product: ProductMatch;
}

export interface ApiEstimateResponse {
  product_id: string;
  estimate: PriceEstimate;
}

export interface ApiOrderResponse {
  order: MockOrder;
}
