"""Part 2 — AI clothing customisation (mock stub; swap in your image model)."""

from part1_classifier.catalogue import get_product
from part1_classifier.models import PromptDescription


def _build_prompt(description: PromptDescription) -> str:
    parts: list[str] = []
    if description.clothing_item:
        parts.append(description.clothing_item)
    if description.customization_intent:
        parts.append(description.customization_intent)
    if description.style_tags:
        parts.append(", ".join(description.style_tags) + " style")
    if not parts:
        parts.append(description.summary)
    return " — ".join(parts)


def customize_product(product_id: str, description: PromptDescription) -> dict:
    """
    Generate a customised version of a Fleek product.

    TODO: replace mock with your image model (OpenAI, Replicate, etc.).
    """
    product = get_product(product_id)
    prompt_used = _build_prompt(description)

    # Mock: echo original image until Part 2 AI is wired
    return {
        "product_id": product_id,
        "original_image_url": product.image_url,
        "customized_image_url": product.image_url,
        "prompt_used": prompt_used,
        "status": "mock",
    }
