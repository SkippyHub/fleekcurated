"""Part 2 pipeline — connects Part 1 description to customizer + product lookup."""

from __future__ import annotations

from part1_classifier.models import PromptDescription
from part2_customizer.customizer import customize_product
from part2_customizer.models import CurateResponse, CustomizationResult, ProductMatch
from part2_customizer.product_lookup import find_matching_product


def run_customization(
    product_id: str,
    description: PromptDescription,
) -> tuple[CustomizationResult, ProductMatch]:
    customization = CustomizationResult.model_validate(
        customize_product(product_id, description)
    )
    matched = ProductMatch.model_validate(
        find_matching_product(description, product_id=product_id)
    )
    return customization, matched
