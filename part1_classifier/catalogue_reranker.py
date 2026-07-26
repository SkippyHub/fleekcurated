"""Optional Gemini rerank — pick best catalogue IDs from scored candidates."""

from __future__ import annotations

import json

from part1_classifier.catalogue import MockProduct, load_catalogue
from part1_classifier.gemini_client import get_client, text_model
from part1_classifier.models import FleekBundleHit, OutfitItem

RERANK_PROMPT = """You match extracted wardrobe pieces to Fleek wholesale BUNDLES (not individual SKUs).

Fleek sells vintage wholesale lots — pick the closest bundle a buyer could actually source.

Return JSON only:
{"product_ids": ["id1", "id2", ...]}

Rules:
- Only use product_ids from the candidate list (max 3).
- Prefer brand match when the piece mentions a brand (e.g. Hugo Boss tie → Hugo Boss tie bundle).
- Prefer formality match (business suit → formal blazers, not Carhartt workwear).
- Prefer garment slot match (shirt → shirt bundles, never t-shirts for dress shirt).
- If nothing is a good fit, return the least-worst wholesale bundle for that slot.
"""


def rerank_matches(
    item: OutfitItem,
    *,
    candidates: list[FleekBundleHit],
    outfit_summary: str = "",
    limit: int = 3,
) -> list[FleekBundleHit]:
    """Re-order candidates with Gemini when available; otherwise return as-is."""
    if len(candidates) <= 1:
        return candidates[:limit]

    client = get_client()
    if not client:
        return candidates[:limit]

    by_id = {c.product_id: c for c in candidates if c.product_id}
    if not by_id:
        return candidates[:limit]

    catalogue = {p.id: p for p in load_catalogue().products}
    candidate_lines: list[str] = []
    for hit in candidates:
        if not hit.product_id:
            continue
        product = catalogue.get(hit.product_id)
        if not product:
            candidate_lines.append(f"- {hit.product_id}: {hit.title}")
            continue
        brands = ", ".join(product.brands) if product.brands else "mixed brands"
        keywords = ", ".join(product.search_keywords[:8]) if product.search_keywords else ""
        formality = ", ".join(product.formality) if product.formality else ""
        candidate_lines.append(
            f"- {product.id}: {product.title} | brands={brands} | formality={formality} | keywords={keywords}"
        )

    if not candidate_lines:
        return candidates[:limit]

    user = f"""Outfit context: {outfit_summary or "n/a"}

Piece to source:
- id: {item.id}
- type: {item.type}
- brand: {item.brand or "unknown"}
- color: {item.color or "unknown"}
- search term: {item.fleek_search_term}

Candidates (pick up to {limit} product_ids in best-first order):
{chr(10).join(candidate_lines)}
"""

    try:
        from google.genai import types

        response = client.models.generate_content(
            model=text_model(),
            contents=user,
            config=types.GenerateContentConfig(
                system_instruction=RERANK_PROMPT,
                response_mime_type="application/json",
            ),
        )
        data = json.loads(response.text or "{}")
        picked_ids = [str(x) for x in (data.get("product_ids") or []) if str(x) in by_id]
        if not picked_ids:
            return candidates[:limit]

        ordered = [by_id[pid] for pid in picked_ids]
        seen = set(picked_ids)
        for hit in candidates:
            if hit.product_id and hit.product_id not in seen:
                ordered.append(hit)
                seen.add(hit.product_id)
        return ordered[:limit]
    except Exception:
        return candidates[:limit]
