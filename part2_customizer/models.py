"""Part 2 response models — shared contract between classifier and customizer."""

from pydantic import BaseModel, Field

from part1_classifier.models import AnalyzeResponse


class CustomizationResult(BaseModel):
    product_id: str
    original_image_url: str
    customized_image_url: str
    prompt_used: str
    edit_instruction: str | None = None
    status: str = Field(description="mock | generated | cached | quota_exceeded | error")
    error: str | None = None


class ProductMatch(BaseModel):
    product_id: str
    title: str
    url: str
    price: str
    image_url: str
    match_score: float = Field(ge=0.0, le=1.0)


class PriceLineItem(BaseModel):
    label: str
    amount: float
    currency: str = "GBP"
    kind: str = Field(description="bundle | customization | discount | shipping")
    detail: str | None = None


class PriceEstimate(BaseModel):
    line_items: list[PriceLineItem]
    subtotal: float
    discount: float = 0.0
    total: float
    currency: str = "GBP"
    api_cost_gbp: float = 0.0
    customization_fee_gbp: float = 0.0
    bundle_price_gbp: float = 0.0
    promo_applied: str | None = None
    notes: list[str] = Field(default_factory=list)


class MockOrder(BaseModel):
    order_id: str
    status: str = Field(description="draft | confirmed | redirected")
    product_id: str
    product_title: str
    customization_prompt: str
    estimate: PriceEstimate
    checkout_url: str
    created_at: str
    message: str


class CustomizeResponse(BaseModel):
    """Part 2 only — AI alteration + product match."""

    customization: CustomizationResult
    matched_product: ProductMatch


class CurateResponse(BaseModel):
    """Full Part 1 → Part 2 handoff."""

    analysis: AnalyzeResponse
    customization: CustomizationResult
    matched_product: ProductMatch


class EstimateResponse(BaseModel):
    product_id: str
    estimate: PriceEstimate


class OrderResponse(BaseModel):
    order: MockOrder
