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
