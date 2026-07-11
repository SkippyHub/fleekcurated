from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class InputType(str, Enum):
    TEXT = "text"
    IMAGE = "image"


class ClassificationResult(BaseModel):
    input_type: InputType
    confidence: float = Field(ge=0.0, le=1.0, description="How confident we are in the classification")
    reason: str


class PromptDescription(BaseModel):
    """Structured description of what the customer wants (slim Part 2 handoff)."""

    input_type: InputType
    summary: str = Field(description="Plain-language summary of the request")
    clothing_item: Optional[str] = Field(default=None, description="e.g. hoodie, jacket, t-shirt")
    customization_intent: Optional[str] = Field(
        default=None,
        description="What the customer wants changed — colour, print, fit, etc.",
    )
    style_tags: list[str] = Field(default_factory=list, description="e.g. vintage, streetwear, minimal")
    raw_input: Optional[str] = Field(default=None, description="Original text prompt, if any")
    image_url: Optional[str] = Field(default=None, description="Reference image URL, if any")


class FleekBundleHit(BaseModel):
    product_id: str | None = None
    title: str
    url: str
    price: str | None = None
    match_score: float = Field(default=0.0, ge=0.0, le=1.0)


class OutfitItem(BaseModel):
    """One extracted garment + Fleek lookup (Part 1 JSON contract)."""

    id: str
    label: str
    type: str
    color: str | None = None
    pattern: str | None = None
    brand: str | None = None
    details: str | None = None
    customization_intent: str | None = None
    style_tags: list[str] = Field(default_factory=list)
    fleek_search_term: str = Field(description="Query for joinfleek.com search")
    fleek_search_url: str | None = Field(default=None, description="Ready-to-open Fleek search URL")
    fleek_matches: list[FleekBundleHit] = Field(default_factory=list)


class OutfitAnalysisResult(BaseModel):
    """Full Part 1 output — matches frontend OutfitAnalysis + Fleek lookups."""

    input_type: InputType
    confidence: float = Field(ge=0.0, le=1.0)
    summary: str
    occasion: str | None = None
    items: list[OutfitItem] = Field(default_factory=list)


class AnalyzeResponse(BaseModel):
    classification: ClassificationResult
    description: PromptDescription
    outfit: OutfitAnalysisResult | None = Field(
        default=None,
        description="Rich multi-item analysis + Fleek search (Part 1 full contract)",
    )
