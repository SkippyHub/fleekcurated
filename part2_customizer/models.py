"""Part 2 response models — shared contract between classifier and customizer."""

from pydantic import BaseModel, Field

from part1_classifier.models import AnalyzeResponse, PromptDescription


class CustomizationResult(BaseModel):
    product_id: str
    original_image_url: str
    customized_image_url: str
    prompt_used: str
    status: str = Field(description="mock | generated")


class ProductMatch(BaseModel):
    product_id: str
    title: str
    url: str
    price: str
    image_url: str
    match_score: float = Field(ge=0.0, le=1.0)


class CurateResponse(BaseModel):
    """Full Part 1 → Part 2 handoff."""

    analysis: AnalyzeResponse
    customization: CustomizationResult
    matched_product: ProductMatch
