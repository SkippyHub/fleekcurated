"""End-to-end Part 1 + Part 2 pipeline."""

from __future__ import annotations

from part1_classifier.models import AnalyzeResponse
from part1_classifier.pipeline import analyze
from part2_customizer.models import CurateResponse
from part2_customizer.pipeline import run_customization


def curate(
    *,
    product_id: str,
    text: str | None = None,
    image_bytes: bytes | None = None,
    image_path: str | None = None,
    image_url: str | None = None,
    content_type: str | None = None,
) -> CurateResponse:
    analysis: AnalyzeResponse = analyze(
        text=text,
        image_bytes=image_bytes,
        image_path=image_path,
        image_url=image_url,
        content_type=content_type,
    )
    customization, matched_product = run_customization(product_id, analysis.description)
    return CurateResponse(
        analysis=analysis,
        customization=customization,
        matched_product=matched_product,
    )
