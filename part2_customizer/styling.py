"""Part 2a — Gemini reasoning: turn user intent into a precise image-edit instruction."""

from __future__ import annotations

import json

from part1_classifier.models import PromptDescription
from part2_customizer.gemini_client import get_client, text_model


def build_edit_instruction(
    description: PromptDescription,
    *,
    user_prompt: str | None = None,
) -> str:
    """
    Produce a tight edit prompt for Banana image generation.

    Falls back to a rule-based prompt if Gemini is unavailable.
    """
    client = get_client()
    base_intent = user_prompt or description.customization_intent or description.summary

    if not client:
        return _fallback_instruction(description, base_intent)

    system = (
        "You write image-edit instructions for clothing product photos on Fleek. "
        "Output JSON only: "
        '{"edit_instruction": "...", "preserve": ["pattern", "logo", ...]}'
    )
    user = (
        f"Item: {description.clothing_item or 'clothing'}\n"
        f"Summary: {description.summary}\n"
        f"User request: {base_intent}\n"
        f"Style tags: {', '.join(description.style_tags)}\n"
        "Write a precise edit_instruction for an image model. "
        "Be explicit about what must NOT change (pattern, branding, texture)."
    )

    try:
        from google.genai import types

        r = client.models.generate_content(
            model=text_model(),
            contents=user,
            config=types.GenerateContentConfig(
                system_instruction=system,
                response_mime_type="application/json",
            ),
        )
        data = json.loads(r.text or "{}")
        instruction = data.get("edit_instruction", "").strip()
        preserve = data.get("preserve", [])
        if instruction:
            if preserve:
                instruction += " Preserve exactly: " + ", ".join(preserve) + "."
            return instruction
    except Exception:
        pass

    return _fallback_instruction(description, base_intent)


def _fallback_instruction(description: PromptDescription, intent: str) -> str:
    item = description.clothing_item or "clothing item"
    return (
        f"Edit this {item}: {intent}. "
        "Change only what is requested. Keep the exact pattern, branding, fabric texture, "
        "lighting, and background unchanged."
    )
