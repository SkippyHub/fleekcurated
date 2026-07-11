"""End-to-end Part 1 pipeline — classify → Gemini extract → Fleek lookup."""

from __future__ import annotations

from pathlib import Path

from part1_classifier.classifier import classify_input
from part1_classifier.describer import describe_prompt
from part1_classifier.fleek_search import enrich_outfit
from part1_classifier.gemini_analyzer import analyze_with_gemini, outfit_to_legacy_description
from part1_classifier.models import AnalyzeResponse, InputType


def analyze(
    *,
    text: str | None = None,
    image_bytes: bytes | None = None,
    image_path: str | None = None,
    image_url: str | None = None,
    content_type: str | None = None,
) -> AnalyzeResponse:
    if image_bytes is None and image_path is not None:
        image_bytes = Path(image_path).read_bytes()

    classification = classify_input(
        text=text,
        image_bytes=image_bytes,
        image_path=image_path,
        content_type=content_type,
    )

    outfit = analyze_with_gemini(
        classification.input_type,
        text=text,
        image_bytes=image_bytes,
    )

    if outfit:
        outfit = enrich_outfit(outfit)
        description = outfit_to_legacy_description(outfit, text=text, image_url=image_url)
    else:
        description = describe_prompt(
            classification.input_type,
            text=text,
            image_bytes=image_bytes,
            image_url=image_url,
        )
        outfit = None

    return AnalyzeResponse(
        classification=classification,
        description=description,
        outfit=outfit,
    )
