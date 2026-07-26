"""Part 1 Step 3 — Fleek search lookup (URLs + garment-aware catalogue match)."""

from __future__ import annotations

import re
from urllib.parse import quote_plus

from part1_classifier.catalogue import MockProduct, load_catalogue
from part1_classifier.catalogue_reranker import rerank_matches
from part1_classifier.models import FleekBundleHit, OutfitAnalysisResult, OutfitItem

FLEEK_BASE = "https://www.joinfleek.com"
FLEEK_SEARCH = f"{FLEEK_BASE}/search"

SLOT_ALIASES: dict[str, str] = {
    "suit-jacket": "jacket",
    "blazer": "jacket",
    "sport-coat": "jacket",
    "coat": "jacket",
    "dress-shirt": "shirt",
    "formal-shirt": "shirt",
    "button-up": "shirt",
    "necktie": "tie",
    "pants": "trousers",
    "dress-trousers": "trousers",
    "dress-pants": "trousers",
    "pocket-square": "accessory",
    "accessory": "accessory",
    "belt": "accessory",
    "shoes": "accessory",
}

GARMENT_RULES: dict[str, dict[str, list[str]]] = {
    "jacket": {
        "categories": ["jacket"],
        "include": ["jacket", "blazer", "suit"],
        "exclude": ["tie", "neckwear", "t-shirt", "tee", "polo shirt", "trouser", "pant", "jeans", "shirt"],
    },
    "shirt": {
        "categories": ["shirt"],
        "include": ["shirt", "dress", "button", "collared", "polo"],
        "exclude": ["tie", "neckwear", "jacket", "blazer", "trouser", "jeans", "hoodie"],
    },
    "trousers": {
        "categories": ["trousers", "pants", "jeans"],
        "include": ["trouser", "pant", "chino", "dress pant", "formal"],
        "exclude": ["tie", "neckwear", "t-shirt", "tee", "polo", "jacket", "blazer", "shirt"],
    },
    "tie": {
        "categories": ["tie"],
        "include": ["tie", "neckwear", "necktie"],
        "exclude": ["t-shirt", "tee", "polo", "jacket", "shirt", "trouser", "jeans", "upcycled"],
    },
    "accessory": {
        "categories": ["accessory"],
        "include": ["pocket square", "handkerchief", "accessory", "belt"],
        "exclude": ["jacket", "blazer", "shirt", "trouser", "tie dye", "upcycled"],
    },
}

COLOR_ALIASES: dict[str, list[str]] = {
    "blue": ["blue", "navy", "royal", "mid-blue", "light blue", "dark blue"],
    "navy": ["navy", "blue", "dark blue"],
    "white": ["white", "cream", "ivory", "light"],
    "black": ["black", "charcoal"],
}


def build_fleek_search_url(query: str) -> str:
    q = quote_plus(query.strip())
    return f"{FLEEK_SEARCH}?q={q}&options[prefix]=last"


def normalize_slot(item_id: str, garment_type: str) -> str:
    slug = item_id.strip().lower().replace(" ", "-")
    if slug in SLOT_ALIASES:
        return SLOT_ALIASES[slug]
    if slug in GARMENT_RULES:
        return slug

    lower = garment_type.lower()
    if re.search(r"jacket|blazer|sport coat", lower):
        return "jacket"
    if re.search(r"dress shirt|formal shirt|button.?up", lower):
        return "shirt"
    if re.search(r"trouser|pant|chino", lower):
        return "trousers"
    if re.search(r"tie|necktie|neckwear", lower):
        return "tie"
    if re.search(r"pocket square|accessory|belt", lower):
        return "accessory"
    return slug


def _rules_for_slot(slot: str) -> dict[str, list[str]]:
    return GARMENT_RULES.get(slot, {"categories": [], "include": [], "exclude": []})


def infer_outfit_formality(summary: str, items: list[OutfitItem]) -> set[str]:
    text = summary.lower()
    for item in items:
        text += f" {item.type} {item.details or ''} {' '.join(item.style_tags)}".lower()
    formality: set[str] = set()
    if re.search(r"business|formal|suit|office|dress shirt", text):
        formality.update(["formal", "business", "smart"])
    if re.search(r"casual|street|y2k|hoodie|tee", text):
        formality.add("casual")
    if re.search(r"workwear|carhartt", text):
        formality.add("streetwear")
    return formality or {"smart"}


def _color_tokens(color: str | None) -> set[str]:
    if not color:
        return set()
    lower = color.lower()
    tokens = set(re.findall(r"[a-z]+", lower))
    for key, aliases in COLOR_ALIASES.items():
        if any(a in lower for a in aliases):
            tokens.add(key)
    return tokens


def _brand_tokens(brand: str | None) -> set[str]:
    if not brand:
        return set()
    return {t for t in re.findall(r"[a-z0-9]+", brand.lower()) if len(t) > 2}


def _product_haystack(product: MockProduct) -> str:
    parts = [
        product.title,
        product.category,
        " ".join(product.style_tags),
        " ".join(product.brands),
        " ".join(product.search_keywords),
        " ".join(product.formality),
        " ".join(product.colors),
        " ".join(product.slots),
    ]
    return " ".join(parts).lower()


def _slot_allowed(product: MockProduct, slot: str) -> bool:
    rules = _rules_for_slot(slot)
    haystack = _product_haystack(product)
    title = product.title.lower()

    for ex in rules.get("exclude", []):
        if ex in haystack or ex in title:
            return False

    if slot == "shirt" and re.search(r"t-shirt|tee\b|baby tee", title):
        return False

    if slot == "tie" and re.search(r"tie dye|upcycled tie", title):
        return False

    if product.slots and slot in product.slots:
        return True

    allowed = rules.get("categories", [])
    if allowed and product.category.lower() in allowed:
        return True

    if slot == "trousers" and product.category == "jeans":
        return True

    for inc in rules.get("include", []):
        if inc in title:
            return True

    return not allowed


def _score_product(
    *,
    product: MockProduct,
    slot: str,
    search_term: str,
    garment_type: str,
    brand: str | None,
    color: str | None,
    style_tags: list[str],
    outfit_formality: set[str],
) -> float:
    if not _slot_allowed(product, slot):
        return -1.0

    haystack = _product_haystack(product)
    title = product.title.lower()
    score = 0.1

    query = f"{search_term} {garment_type} {brand or ''} {' '.join(style_tags)}".lower()
    for token in re.findall(r"[a-z0-9]+", query):
        if len(token) < 3:
            continue
        if token in title:
            score += 0.14
        if token in haystack:
            score += 0.06

    for kw in product.search_keywords:
        if kw.lower() in query or kw.lower() in search_term.lower():
            score += 0.1

    brand_tokens = _brand_tokens(brand)
    for pb in product.brands:
        pb_lower = pb.lower()
        if pb_lower in query or any(t in pb_lower for t in brand_tokens):
            score += 0.32

    color_tokens = _color_tokens(color)
    for pc in product.colors:
        if pc in color_tokens or pc in (color or "").lower():
            score += 0.12

    product_formality = set(product.formality)
    if outfit_formality and product_formality:
        overlap = outfit_formality & product_formality
        if overlap:
            score += 0.18 * len(overlap)
        elif "formal" in outfit_formality and "casual" in product_formality:
            score -= 0.35
        elif "business" in outfit_formality and "streetwear" in product_formality:
            score -= 0.4

    rules = _rules_for_slot(slot)
    for inc in rules.get("include", []):
        if inc in title:
            score += 0.08

    if slot == "shirt" and re.search(r"dress shirt|formal shirt", garment_type, re.I):
        if re.search(r"dress|formal|button", title):
            score += 0.22
        elif re.search(r"polo", title) and not re.search(r"dress|button", title):
            score -= 0.28

    if slot == "accessory":
        if not any(k in haystack for k in ("pocket square", "handkerchief", "belt", "accessory")):
            return -1.0

    return max(score, 0.0)


def _slot_fit_strength(product: MockProduct, slot: str, garment_type: str) -> float:
    title = product.title.lower()
    if slot == "shirt" and re.search(r"dress shirt|formal shirt", garment_type, re.I):
        if re.search(r"dress|formal|button-up|button up", title):
            return 1.0
        if re.search(r"polo", title):
            return 0.2
    if slot == "jacket" and re.search(r"blazer|suit jacket", garment_type, re.I):
        if re.search(r"blazer|suit jacket", title):
            return 1.0
    if slot == "tie" and re.search(r"tie|necktie", garment_type, re.I):
        if re.search(r"tie|neckwear", title) and "tie dye" not in title:
            return 1.0
    return 0.5


def _brand_match_strength(product: MockProduct, brand: str | None) -> float:
    if not brand:
        return 0.0
    brand_tokens = _brand_tokens(brand)
    for pb in product.brands:
        pb_lower = pb.lower()
        if pb_lower in brand.lower() or brand.lower() in pb_lower:
            return 1.0
        if any(t in pb_lower for t in brand_tokens):
            return 0.8
    return 0.0


def match_catalogue(
    search_term: str,
    garment_type: str | None = None,
    item_id: str = "",
    *,
    brand: str | None = None,
    color: str | None = None,
    style_tags: list[str] | None = None,
    outfit_formality: set[str] | None = None,
    limit: int = 6,
) -> list[FleekBundleHit]:
    slot = normalize_slot(item_id, garment_type or "")
    formality = outfit_formality or {"smart"}
    tags = style_tags or []
    scored: list[tuple[float, float, float, FleekBundleHit]] = []

    for product in load_catalogue().products:
        score = _score_product(
            product=product,
            slot=slot,
            search_term=search_term,
            garment_type=garment_type or "",
            brand=brand,
            color=color,
            style_tags=tags,
            outfit_formality=formality,
        )
        if score <= 0:
            continue
        brand_strength = _brand_match_strength(product, brand)
        slot_fit = _slot_fit_strength(product, slot, garment_type or "")
        final_score = min(score, 1.0)
        scored.append(
            (
                final_score,
                brand_strength,
                slot_fit,
                FleekBundleHit(
                    product_id=product.id,
                    title=product.title,
                    url=product.url,
                    price=product.price,
                    image_url=product.image_url,
                    pieces=product.pieces,
                    price_amount=product.price_amount,
                    price_currency=product.price_currency,
                    match_score=round(final_score, 2),
                ),
            )
        )

    scored.sort(key=lambda x: (x[0], x[1], x[2], x[3].title), reverse=True)
    return [hit for _, _, _, hit in scored[:limit]]


def enrich_item(item: OutfitItem, *, outfit_summary: str = "", outfit_items: list[OutfitItem] | None = None) -> OutfitItem:
    term = item.fleek_search_term or f"{item.brand or ''} {item.type}".strip()
    item.fleek_search_url = build_fleek_search_url(term)
    formality = infer_outfit_formality(outfit_summary, outfit_items or [item])

    hits = match_catalogue(
        term,
        item.type,
        item_id=item.id,
        brand=item.brand,
        color=item.color,
        style_tags=item.style_tags,
        outfit_formality=formality,
        limit=8,
    )

    if hits:
        hits = rerank_matches(item, candidates=hits, outfit_summary=outfit_summary, limit=6)

    item.fleek_matches = hits
    return item


def enrich_outfit(outfit: OutfitAnalysisResult) -> OutfitAnalysisResult:
    outfit.items = [
        enrich_item(item, outfit_summary=outfit.summary, outfit_items=outfit.items) for item in outfit.items
    ]
    return outfit
