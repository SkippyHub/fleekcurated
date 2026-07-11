"""Part 2 pipeline — connects Part 1 description to customizer + product lookup."""

from __future__ import annotations

from part1_classifier.models import InputType, PromptDescription
from part2_customizer.customizer import customize_product
from part2_customizer.models import CustomizationResult, CustomizeResponse, ProductMatch
from part2_customizer.product_lookup import find_matching_product


def _description_from_prompt(
    customization_prompt: str,
    *,
    clothing_item: str | None = None,
) -> PromptDescription:
    return PromptDescription(
        input_type=InputType.TEXT,
        summary=customization_prompt,
        clothing_item=clothing_item,
        customization_intent=customization_prompt,
        style_tags=[],
        raw_input=customization_prompt,
        image_url=None,
    )


def run_customization(
    product_id: str,
    description: PromptDescription,
    *,
    user_prompt: str | None = None,
    image_bytes: bytes | None = None,
    image_path: str | None = None,
    base_url: str = "http://localhost:8000",
) -> tuple[CustomizationResult, ProductMatch]:
    customization = CustomizationResult.model_validate(
        customize_product(
            product_id,
            description,
            user_prompt=user_prompt,
            image_bytes=image_bytes,
            image_path=image_path,
            base_url=base_url,
        )
    )
    matched = ProductMatch.model_validate(
        find_matching_product(description, product_id=product_id)
    )
    return customization, matched


def customize_only(
    *,
    product_id: str,
    customization_prompt: str,
    image_bytes: bytes | None = None,
    clothing_item: str | None = None,
    base_url: str = "http://localhost:8000",
) -> CustomizeResponse:
    """Part 2 entry point — skip Part 1, run alteration directly."""
    description = _description_from_prompt(
        customization_prompt,
        clothing_item=clothing_item,
    )
    customization, matched = run_customization(
        product_id,
        description,
        user_prompt=customization_prompt,
        image_bytes=image_bytes,
        base_url=base_url,
    )
    return CustomizeResponse(customization=customization, matched_product=matched)
