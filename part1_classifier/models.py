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
    """Structured description of what the customer wants."""

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


class AnalyzeResponse(BaseModel):
    classification: ClassificationResult
    description: PromptDescription
