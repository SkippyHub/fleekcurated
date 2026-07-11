"""Detect whether customer input is text or an image."""

from __future__ import annotations

import mimetypes
from io import BytesIO
from pathlib import Path
from typing import Union

from PIL import Image

from part1_classifier.models import ClassificationResult, InputType

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".heic", ".heif"}
IMAGE_MIME_PREFIXES = ("image/",)


def classify_input(
    *,
    text: str | None = None,
    image_bytes: bytes | None = None,
    image_path: str | Path | None = None,
    content_type: str | None = None,
) -> ClassificationResult:
    """
    Classify customer input as text or image.

    Priority: image bytes/path > text. Raises ValueError if nothing usable is provided.
    """
    has_text = bool(text and text.strip())
    has_image = image_bytes is not None or image_path is not None

    if not has_text and not has_image:
        raise ValueError("Provide either text or an image.")

    if has_image:
        return _classify_as_image(image_bytes=image_bytes, image_path=image_path, content_type=content_type)

    return ClassificationResult(
        input_type=InputType.TEXT,
        confidence=1.0,
        reason="Non-empty text prompt provided with no image.",
    )


def _classify_as_image(
    *,
    image_bytes: bytes | None,
    image_path: str | Path | None,
    content_type: str | None,
) -> ClassificationResult:
    if image_bytes is not None:
        if not _is_valid_image_bytes(image_bytes):
            raise ValueError("Uploaded file is not a valid image.")
        reason = "Valid image bytes detected."
        if content_type and content_type.startswith("image/"):
            reason = f"Content-Type is {content_type}."
        return ClassificationResult(input_type=InputType.IMAGE, confidence=1.0, reason=reason)

    path = Path(image_path)  # type: ignore[arg-type]
    if not path.exists():
        raise ValueError(f"Image path does not exist: {path}")

    suffix = path.suffix.lower()
    mime, _ = mimetypes.guess_type(str(path))
    if suffix not in IMAGE_EXTENSIONS and not (mime and mime.startswith("image/")):
        return ClassificationResult(
            input_type=InputType.TEXT,
            confidence=0.4,
            reason=f"Path '{path.name}' does not look like an image; treating as text reference.",
        )

    if not _is_valid_image_bytes(path.read_bytes()):
        raise ValueError(f"File at {path} is not a valid image.")

    return ClassificationResult(
        input_type=InputType.IMAGE,
        confidence=1.0,
        reason=f"Valid image file: {path.name}",
    )


def _is_valid_image_bytes(data: bytes) -> bool:
    try:
        with Image.open(BytesIO(data)) as img:
            img.load()
        return True
    except Exception:
        return False


def infer_input_from_upload(filename: str | None, content_type: str | None) -> InputType | None:
    """Helper for multipart uploads — guess type from filename / MIME before reading body."""
    if content_type and any(content_type.startswith(p) for p in IMAGE_MIME_PREFIXES):
        return InputType.IMAGE
    if filename and Path(filename).suffix.lower() in IMAGE_EXTENSIONS:
        return InputType.IMAGE
    return None
