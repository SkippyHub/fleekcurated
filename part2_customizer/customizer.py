"""Part 2b — Gemini Banana image alterations."""

from __future__ import annotations

import uuid
from io import BytesIO
from pathlib import Path

import httpx
from PIL import Image

from part1_classifier.catalogue import get_product
from part1_classifier.models import PromptDescription
from part2_customizer.gemini_client import get_client, image_model
from part2_customizer.image_cache import get_cached, store_cached
from part2_customizer.styling import build_edit_instruction

ROOT = Path(__file__).resolve().parents[1]
GENERATED_DIR = ROOT / "generated"
DATA_DIR = ROOT / "part1_classifier" / "data"

LOCAL_ASSETS: dict[str, Path] = {
    "fleek-hugo-boss-tie": DATA_DIR / "tie-boss.png",
}


def _ensure_generated_dir() -> Path:
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    return GENERATED_DIR


def _load_image_bytes(
    *,
    product_id: str,
    image_bytes: bytes | None = None,
    image_path: str | Path | None = None,
) -> tuple[bytes, str]:
    if image_bytes:
        return image_bytes, "image/jpeg"

    if image_path:
        path = Path(image_path)
        data = path.read_bytes()
        mime = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
        return data, mime

    product = get_product(product_id)

    local = LOCAL_ASSETS.get(product_id)
    if local and local.exists():
        return local.read_bytes(), "image/png"

    if product.image_url.startswith("/"):
        path = ROOT / "web" / "public" / product.image_url.lstrip("/")
        if path.exists():
            return path.read_bytes(), "image/png"

    resp = httpx.get(product.image_url, timeout=30.0, follow_redirects=True)
    resp.raise_for_status()
    mime = resp.headers.get("content-type", "image/jpeg").split(";")[0]
    return resp.content, mime


def _save_png(data: bytes, prefix: str) -> str:
    out_dir = _ensure_generated_dir()
    filename = f"{prefix}-{uuid.uuid4().hex[:12]}.png"
    path = out_dir / filename
    path.write_bytes(data)
    return f"/generated/{filename}"


def _save_original_copy(image_bytes: bytes) -> str:
    return _save_png(image_bytes, "original")


def customize_product(
    product_id: str,
    description: PromptDescription,
    *,
    user_prompt: str | None = None,
    image_bytes: bytes | None = None,
    image_path: str | Path | None = None,
    base_url: str = "http://localhost:8000",
) -> dict:
    """
    Generate a customised product image via Gemini Banana.

    Returns dict compatible with CustomizationResult.
    """
    source_bytes, mime = _load_image_bytes(
        product_id=product_id,
        image_bytes=image_bytes,
        image_path=image_path,
    )
    edit_instruction = build_edit_instruction(description, user_prompt=user_prompt)

    cached = get_cached(
        product_id,
        edit_instruction,
        source_bytes,
        base_url=base_url,
    )
    if cached:
        return cached

    original_url = _save_original_copy(source_bytes)
    original_full = f"{base_url}{original_url}"

    client = get_client()
    if not client:
        return {
            "product_id": product_id,
            "original_image_url": original_full,
            "customized_image_url": original_full,
            "prompt_used": edit_instruction,
            "edit_instruction": edit_instruction,
            "status": "mock",
        }

    try:
        from google.genai import types

        pil_image = Image.open(BytesIO(source_bytes))
        response = client.models.generate_content(
            model=image_model(),
            contents=[edit_instruction, pil_image],
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )

        parts = response.candidates[0].content.parts if response.candidates else []
        image_data: bytes | None = None
        for part in parts:
            if getattr(part, "inline_data", None) and part.inline_data.data:
                image_data = part.inline_data.data
                break

        if not image_data:
            raise ValueError("Gemini returned no image — try again or check quota")

        customized_url = _save_png(image_data, "customized")
        store_cached(
            product_id,
            edit_instruction,
            source_bytes,
            original_rel=original_url,
            customized_rel=customized_url,
        )
        return {
            "product_id": product_id,
            "original_image_url": original_full,
            "customized_image_url": f"{base_url}{customized_url}",
            "prompt_used": edit_instruction,
            "edit_instruction": edit_instruction,
            "status": "generated",
        }

    except Exception as exc:
        msg = str(exc)
        status = "quota_exceeded" if "429" in msg else "error"
        return {
            "product_id": product_id,
            "original_image_url": original_full,
            "customized_image_url": original_full,
            "prompt_used": edit_instruction,
            "edit_instruction": edit_instruction,
            "status": status,
            "error": msg[:300],
        }
