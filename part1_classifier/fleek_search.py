"""Part 1 Step 3 — Fleek search lookup (URLs + catalogue match, no fragile scraping)."""

from __future__ import annotations

import re
from urllib.parse import quote_plus

from part1_classifier.catalogue import load_catalogue
from part1_classifier.models import FleekBundleHit, OutfitAnalysisResult, OutfitItem

FLEEK_BASE = "https://www.joinfleek.com"
FLEEK_SEARCH = f"{FLEEK_BASE}/search"


def build_fleek_search_url(query: str) -> str:
    """Public Fleek search URL — same pattern as site search bar."""
    q = quote_plus(query.strip())
    return f"{FLEEK_SEARCH}?q={q}&options[prefix]=last"


def _score_product(query: str, product_title: str, category: str, tags: list[str]) -> float:
    q = query.lower()
    title = product_title.lower()
    score = 0.0
    for token in re.findall(r"[a-z0-9]+", q):
        if len(token) < 3:
            continue
        if token in title:
            score += 0.25
        if token in category.lower():
            score += 0.15
        if any(token in t for t in tags):
            score += 0.1
    return min(score, 1.0)


def match_catalogue(search_term: str, garment_type: str | None = None, limit: int = 3) -> list[FleekBundleHit]:
    """Match mock/local catalogue — swap for Fleek API when available."""
    query = f"{search_term} {garment_type or ''}".strip()
    scored: list[tuple[float, FleekBundleHit]] = []

    for product in load_catalogue().products:
        score = _score_product(query, product.title, product.category, product.style_tags)
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
    item.fleek_matches = match_catalogue(term, item.type)
    return item


def enrich_outfit(outfit: OutfitAnalysisResult) -> OutfitAnalysisResult:
    """Attach Fleek search URLs + catalogue hits to every extracted item."""
    outfit.items = [enrich_item(item) for item in outfit.items]
    return outfit
