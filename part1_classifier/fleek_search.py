"""Part 1 Step 3 — Fleek search lookup (URLs + garment-aware catalogue match)."""

from __future__ import annotations

import re
from urllib.parse import quote_plus

from part1_classifier.catalogue import load_catalogue
from part1_classifier.models import FleekBundleHit, OutfitAnalysisResult, OutfitItem

FLEEK_BASE = "https://www.joinfleek.com"
FLEEK_SEARCH = f"{FLEEK_BASE}/search"

# Garment slot → allowed catalogue categories & title exclusions
GARMENT_RULES: dict[str, dict[str, list[str]]] = {
    "jacket": {
        "categories": ["jacket"],
        "include": ["jacket", "blazer", "suit"],
        "exclude": ["tie", "neckwear", "t-shirt", "tee", "polo", "trouser", "pant", "jeans"],
    },
    "shirt": {
        "categories": ["shirt"],
        "include": ["shirt", "formal", "dress"],
        "exclude": ["tie", "neckwear", "t-shirt", "tee", "polo", "jacket", "blazer", "trouser", "jeans"],
    },
    "trousers": {
        "categories": ["trousers", "pants", "jeans"],
        "include": ["trouser", "pant", "formal", "dress"],
        "exclude": ["tie", "neckwear", "t-shirt", "tee", "polo", "jacket", "blazer", "shirt"],
    },
    "tie": {
        "categories": ["tie"],
        "include": ["tie", "neckwear", "necktie"],
        "exclude": ["t-shirt", "tee", "polo", "jacket", "shirt", "trouser", "jeans"],
    },
}


def build_fleek_search_url(query: str) -> str:
    q = quote_plus(query.strip())
    return f"{FLEEK_SEARCH}?q={q}&options[prefix]=last"


def _rules_for_item(item_id: str, garment_type: str) -> dict[str, list[str]]:
    if item_id in GARMENT_RULES:
        return GARMENT_RULES[item_id]
    lower = garment_type.lower()
    if "jacket" in lower or "blazer" in lower:
        return GARMENT_RULES["jacket"]
    if "dress shirt" in lower or "formal shirt" in lower:
        return GARMENT_RULES["shirt"]
    if "trouser" in lower or "pant" in lower:
        return GARMENT_RULES["trousers"]
    if "tie" in lower or "necktie" in lower:
        return GARMENT_RULES["tie"]
    return {"categories": [], "include": [], "exclude": []}


def _score_product(
    *,
    query: str,
    product_title: str,
    category: str,
    tags: list[str],
    item_id: str,
    garment_type: str,
) -> float:
    rules = _rules_for_item(item_id, garment_type)
    haystack = f"{product_title} {query} {' '.join(tags)}".lower()

    for ex in rules.get("exclude", []):
        if ex in haystack or ex in product_title.lower():
            return -1.0

    allowed = rules.get("categories", [])
    if allowed and category.lower() not in allowed:
        # Jeans ok for trousers slot only
        if not (item_id == "trousers" and category == "jeans"):
            return -1.0

    score = 0.15
    for token in re.findall(r"[a-z0-9]+", query.lower()):
        if len(token) < 3:
            continue
        if token in product_title.lower():
            score += 0.2
        if token in category.lower():
            score += 0.15
        if any(token in t for t in tags):
            score += 0.1

    for inc in rules.get("include", []):
        if inc in product_title.lower():
            score += 0.12

    if item_id == "shirt" and re.search(r"t-shirt|tee\b|polo", product_title, re.I):
        return -1.0

    return min(score, 1.0)


def match_catalogue(
    search_term: str,
    garment_type: str | None = None,
    item_id: str = "",
    limit: int = 3,
) -> list[FleekBundleHit]:
    query = f"{search_term} {garment_type or ''}".strip()
    scored: list[tuple[float, FleekBundleHit]] = []

    for product in load_catalogue().products:
        score = _score_product(
            query=query,
            product_title=product.title,
            category=product.category,
            tags=product.style_tags,
            item_id=item_id,
            garment_type=garment_type or "",
        )
        if score <= 0:
            continue
        scored.append(
            (
                score,
                FleekBundleHit(
                    product_id=product.id,
                    title=product.title,
                    url=product.url,
                    price=product.price,
                    match_score=round(score, 2),
                ),
            )
        )

    scored.sort(key=lambda x: x[0], reverse=True)
    return [hit for _, hit in scored[:limit]]


def enrich_item(item: OutfitItem) -> OutfitItem:
    term = item.fleek_search_term or f"{item.brand or ''} {item.type}".strip()
    item.fleek_search_url = build_fleek_search_url(term)
    item.fleek_matches = match_catalogue(term, item.type, item_id=item.id)
    return item


def enrich_outfit(outfit: OutfitAnalysisResult) -> OutfitAnalysisResult:
    outfit.items = [enrich_item(item) for item in outfit.items]
    return outfit
