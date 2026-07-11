"""Turn a classified prompt into a structured clothing-customisation description."""

from __future__ import annotations

import base64
import json
import os
import re
from typing import Any

from part1_classifier.models import InputType, PromptDescription

# Keywords for lightweight fallback when no LLM key is configured
CLOTHING_KEYWORDS = {
    "hoodie": "hoodie",
    "jacket": "jacket",
    "coat": "coat",
    "jeans": "jeans",
    "trousers": "trousers",
    "pants": "trousers",
    "shirt": "shirt",
    "t-shirt": "t-shirt",
    "tee": "t-shirt",
    "dress": "dress",
    "skirt": "skirt",
    "sweater": "sweater",
    "jumper": "sweater",
    "shorts": "shorts",
    "sneakers": "sneakers",
    "trainers": "sneakers",
    "boots": "boots",
}

STYLE_KEYWORDS = {
    "vintage": "vintage",
    "streetwear": "streetwear",
    "minimal": "minimal",
    "minimalist": "minimal",
    "y2k": "y2k",
    "grunge": "grunge",
    "preppy": "preppy",
    "sporty": "sporty",
    "athleisure": "athleisure",
    "luxury": "luxury",
    "casual": "casual",
    "formal": "formal",
}


def describe_prompt(
    input_type: InputType,
    *,
    text: str | None = None,
    image_bytes: bytes | None = None,
    image_url: str | None = None,
) -> PromptDescription:
    """
    Describe what the customer wants.

    Uses OpenAI when OPENAI_API_KEY is set; otherwise falls back to rule-based parsing.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        return _describe_with_llm(
            input_type,
            text=text,
            image_bytes=image_bytes,
            image_url=image_url,
            api_key=api_key,
        )
    return _describe_with_rules(input_type, text=text, image_url=image_url)


def _describe_with_llm(
    input_type: InputType,
    *,
    text: str | None,
    image_bytes: bytes | None,
    image_url: str | None,
    api_key: str,
) -> PromptDescription:
    from openai import OpenAI

    client = OpenAI(api_key=api_key)
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    system = (
        "You help Fleek (joinfleek.com) understand clothing upsell requests. "
        "Extract: summary, clothing_item, customization_intent, style_tags (array). "
        "Return JSON only with those keys."
    )

    if input_type == InputType.TEXT:
        user_content: str | list[dict[str, Any]] = text or ""
    else:
        parts: list[dict[str, Any]] = []
        if text:
            parts.append({"type": "text", "text": text or "Describe this clothing reference image."})
        if image_bytes:
            b64 = base64.standard_b64encode(image_bytes).decode("ascii")
            mime = "image/jpeg"
            parts.append(
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{mime};base64,{b64}"},
                }
            )
        elif image_url:
            parts.append({"type": "image_url", "image_url": {"url": image_url}})
        else:
            parts.append({"type": "text", "text": "Describe this clothing reference."})
        user_content = parts

    response = client.chat.completions.create(
        model=model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_content},
        ],
        max_tokens=400,
    )

    raw = response.choices[0].message.content or "{}"
    data = json.loads(raw)

    return PromptDescription(
        input_type=input_type,
        summary=data.get("summary", "Clothing customisation request"),
        clothing_item=data.get("clothing_item"),
        customization_intent=data.get("customization_intent"),
        style_tags=data.get("style_tags") or [],
        raw_input=text,
        image_url=image_url,
    )


def _describe_with_rules(
    input_type: InputType,
    *,
    text: str | None,
    image_url: str | None,
) -> PromptDescription:
    normalized = (text or "").strip().lower()

    clothing_item = _extract_clothing_item(normalized)
    style_tags = _extract_style_tags(normalized)
    customization_intent = _extract_customization_intent(normalized)

    if input_type == InputType.IMAGE:
        summary = "Customer shared a reference image for clothing customisation."
        if text:
            summary = f"Customer shared an image with note: {text.strip()}"
        if not customization_intent and text:
            customization_intent = text.strip()
    else:
        summary = text.strip() if text else "Empty text prompt"
        if clothing_item and customization_intent:
            summary = f"Customise a {clothing_item}: {customization_intent}"
        elif clothing_item:
            summary = f"Looking for {clothing_item} options on Fleek"

    return PromptDescription(
        input_type=input_type,
        summary=summary,
        clothing_item=clothing_item,
        customization_intent=customization_intent,
        style_tags=style_tags,
        raw_input=text,
        image_url=image_url,
    )


def _extract_clothing_item(text: str) -> str | None:
    for keyword, item in CLOTHING_KEYWORDS.items():
        if re.search(rf"\b{re.escape(keyword)}\b", text):
            return item
    return None


def _extract_style_tags(text: str) -> list[str]:
    tags: list[str] = []
    for keyword, tag in STYLE_KEYWORDS.items():
        if re.search(rf"\b{re.escape(keyword)}\b", text):
            tags.append(tag)
    return tags


def _extract_customization_intent(text: str) -> str | None:
    if not text:
        return None

    patterns = [
        r"(?:make it|change to|turn it|customi[sz]e(?: it)? to)\s+(.+)",
        r"(?:add|with)\s+(a\s+)?(.+(?:print|logo|embroidery|patch|colour|color).*)",
        r"(?:in|as)\s+(.+(?:red|blue|green|black|white|pink|purple|orange|yellow|beige|navy|cream).*)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip().rstrip(".")

    # If they gave a full sentence, use it when we didn't find a clothing keyword-only message
    if len(text.split()) >= 4:
        return text.strip()

    return None
