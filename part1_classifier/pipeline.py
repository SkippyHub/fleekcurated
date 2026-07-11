"""End-to-end Part 1 pipeline — classify then describe."""

from __future__ import annotations

from part1_classifier.classifier import classify_input
from part1_classifier.describer import describe_prompt
from part1_classifier.models import AnalyzeResponse


def analyze(
    *,
    text: str | None = None,
    image_bytes: bytes | None = None,
    image_path: str | None = None,
    image_url: str | None = None,
    content_type: str | None = None,
) -> AnalyzeResponse:
    classification = classify_input(
        text=text,
        image_bytes=image_bytes,
        image_path=image_path,
        content_type=content_type,
    )

    description = describe_prompt(
        classification.input_type,
        text=text,
        image_bytes=image_bytes,
        image_url=image_url,
    )

    return AnalyzeResponse(classification=classification, description=description)
