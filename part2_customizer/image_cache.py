"""File cache for Gemini image edits — avoids repeat API calls during dev/demo."""

from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / "generated" / "cache"
INDEX_PATH = CACHE_DIR / "index.json"


def cache_enabled() -> bool:
    return os.getenv("GEMINI_IMAGE_CACHE", "true").lower() not in ("0", "false", "no")


def cache_key(product_id: str, edit_instruction: str, source_bytes: bytes) -> str:
    img_hash = hashlib.sha256(source_bytes).hexdigest()[:16]
    prompt_hash = hashlib.sha256(edit_instruction.encode("utf-8")).hexdigest()[:16]
    return f"{product_id}_{img_hash}_{prompt_hash}"


def _load_index() -> dict[str, dict]:
    if not INDEX_PATH.exists():
        return {}
    try:
        return json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def _save_index(index: dict[str, dict]) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    INDEX_PATH.write_text(json.dumps(index, indent=2), encoding="utf-8")


def get_cached(
    product_id: str,
    edit_instruction: str,
    source_bytes: bytes,
    *,
    base_url: str,
) -> dict | None:
    """Return cached customization result or None."""
    if not cache_enabled():
        return None

    key = cache_key(product_id, edit_instruction, source_bytes)
    entry = _load_index().get(key)
    if not entry:
        return None

    customized_rel = entry.get("customized_path")
    original_rel = entry.get("original_path")
    if not customized_rel:
        return None

    customized_full = ROOT / "generated" / Path(customized_rel).name
    if not customized_full.exists():
        return None

    original_full_url = f"{base_url}{original_rel}" if original_rel else f"{base_url}{customized_rel}"
    return {
        "product_id": product_id,
        "original_image_url": original_full_url,
        "customized_image_url": f"{base_url}{customized_rel}",
        "prompt_used": edit_instruction,
        "edit_instruction": edit_instruction,
        "status": "cached",
    }


def store_cached(
    product_id: str,
    edit_instruction: str,
    source_bytes: bytes,
    *,
    original_rel: str,
    customized_rel: str,
) -> None:
    if not cache_enabled():
        return

    key = cache_key(product_id, edit_instruction, source_bytes)
    index = _load_index()
    index[key] = {
        "product_id": product_id,
        "original_path": original_rel,
        "customized_path": customized_rel,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _save_index(index)
