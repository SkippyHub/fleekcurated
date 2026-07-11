"""Part 1 Step 2 — Gemini LLM outfit extraction (text or image → structured JSON)."""

from __future__ import annotations

import json
from io import BytesIO

from PIL import Image

from part1_classifier.models import InputType, OutfitAnalysisResult, OutfitItem, PromptDescription
from part1_classifier.gemini_client import get_client, text_model

SYSTEM_PROMPT = """You are Fleek Curated — Part 1 outfit classifier for joinfleek.com wholesale.

Given a customer text prompt and/or reference image, extract what they want to source or customise.

Return JSON only with this shape:
{
  "summary": "plain language summary",
  "occasion": "e.g. beach summer, dinner party, office formal — or null",
  "confidence": 0.0-1.0,
  "items": [
    {
      "id": "unique slug e.g. tie, dress, jacket",
      "label": "short label",
      "type": "garment type",
      "color": "colour or null",
      "pattern": "pattern or null",
      "brand": "brand if visible or mentioned, else null",
      "details": "extra details or null",
      "customization_intent": "what to change/add, or null if sourcing only",
      "style_tags": ["y2k", "formal", ...],
      "fleek_search_term": "best query for Fleek wholesale search e.g. hugo boss shirt vintage"
    }
  ]
}

Rules:
- For FULL OUTFIT images: extract EVERY visible garment (jacket, shirt, trousers, tie, dress, shoes if clear).
- For single product images: one item.
- For text like "party wear for dinner" or "summer beach dress": infer likely garments and search terms even without a photo.
- fleek_search_term must be short, Fleek-searchable (brand + garment + style), no full sentences.
- Use British spelling in summary if natural.
"""


def analyze_with_gemini(
    input_type: InputType,
    *,
    text: str | None = None,
    image_bytes: bytes | None = None,
) -> OutfitAnalysisResult | None:
    """Call Gemini. Returns None if client unavailable or call fails."""
    client = get_client()
    if not client:
        return None

    user_parts: list = []
    if text and text.strip():
        user_parts.append(f"Customer text: {text.strip()}")
    if input_type == InputType.IMAGE and image_bytes:
        user_parts.append("Analyse the clothing in this reference image.")
    elif input_type == InputType.IMAGE:
        user_parts.append("Customer uploaded a reference image (describe typical extraction for formal menswear if unknown).")

    if not user_parts:
        user_parts.append("Describe a generic vintage wholesale clothing sourcing request.")

    try:
        from google.genai import types

        contents: list = ["\n".join(user_parts)]
        if image_bytes:
            pil = Image.open(BytesIO(image_bytes))
            contents.append(pil)

        response = client.models.generate_content(
            model=text_model(),
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
            ),
        )
        data = json.loads(response.text or "{}")
        return _parse_gemini_outfit(data, input_type)
    except Exception:
        return None


def _parse_gemini_outfit(data: dict, input_type: InputType) -> OutfitAnalysisResult:
    items: list[OutfitItem] = []
    for i, raw in enumerate(data.get("items") or []):
        item_id = str(raw.get("id") or f"item-{i + 1}").strip().lower().replace(" ", "-")
        search_term = (
            raw.get("fleek_search_term")
            or raw.get("search_term")
            or f"{raw.get('brand') or ''} {raw.get('type') or raw.get('label') or 'clothing'}".strip()
        )
        items.append(
            OutfitItem(
                id=item_id,
                label=str(raw.get("label") or item_id),
                type=str(raw.get("type") or "Clothing"),
                color=raw.get("color"),
                pattern=raw.get("pattern"),
                brand=raw.get("brand"),
                details=raw.get("details"),
                customization_intent=raw.get("customization_intent"),
                style_tags=raw.get("style_tags") or [],
                fleek_search_term=search_term,
            )
        )

    if not items:
        items.append(
            OutfitItem(
                id="primary",
                label="Clothing",
                type="Garment",
                fleek_search_term=data.get("summary", "vintage clothing wholesale"),
            )
        )

    return OutfitAnalysisResult(
        input_type=input_type,
        confidence=float(data.get("confidence") or 0.85),
        summary=str(data.get("summary") or "Clothing sourcing request"),
        occasion=data.get("occasion"),
        items=items,
    )


def outfit_to_legacy_description(
    outfit: OutfitAnalysisResult,
    *,
    text: str | None,
    image_url: str | None,
) -> PromptDescription:
    """Map rich outfit JSON to slim Part 2 handoff fields."""
    primary = outfit.items[0]
    customizable = next((i for i in outfit.items if i.customization_intent), primary)
    tags: list[str] = []
    for item in outfit.items:
        tags.extend(item.style_tags)
    tags = list(dict.fromkeys(tags))

    return PromptDescription(
        input_type=outfit.input_type,
        summary=outfit.summary,
        clothing_item=customizable.type or customizable.label,
        customization_intent=customizable.customization_intent,
        style_tags=tags,
        raw_input=text,
        image_url=image_url,
    )
