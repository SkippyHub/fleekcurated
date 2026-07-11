"""Part 2 — map customised result back to a Fleek product."""

from __future__ import annotations

from part1_classifier.catalogue import get_product, list_products
from part1_classifier.models import PromptDescription


def _score_product(product, description: PromptDescription) -> float:
    score = 0.0
    item = (description.clothing_item or "").lower()
    if item and item in product.category.lower():
        score += 0.5
    if item and item in product.title.lower():
        score += 0.2

    desc_tags = {t.lower() for t in description.style_tags}
    product_tags = {t.lower() for t in product.style_tags}
    overlap = desc_tags & product_tags
    if overlap:
        score += min(0.3, 0.1 * len(overlap))

    intent = (description.customization_intent or description.summary).lower()
    for tag in product_tags:
        if tag in intent:
            score += 0.1

    return min(score, 1.0)


def find_matching_product(
    description: PromptDescription,
    *,
    product_id: str | None = None,
    site: str = "https://joinfleek.com",
) -> dict:
    """
    Find the best-matching Fleek listing for the customised look.

    TODO: replace mock scoring with real catalogue search when available.
    """
    if product_id:
        product = get_product(product_id)
        return {
            "product_id": product.id,
            "title": product.title,
            "url": product.url,
            "price": product.price,
            "image_url": product.image_url,
            "match_score": 1.0,
        }

    best = max(list_products(), key=lambda p: _score_product(p, description))
    return {
        "product_id": best.id,
        "title": best.title,
        "url": best.url or site,
        "price": best.price,
        "image_url": best.image_url,
        "match_score": _score_product(best, description),
    }
