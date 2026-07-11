#!/usr/bin/env python3
"""Gemini API smoke test. Run: python scripts/test_gemini.py"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

# Current models (July 2026) — old 2.0 image models are shut down
TEXT_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.0-flash",
]
IMAGE_MODELS = [
    "gemini-3.1-flash-image",       # Nano Banana 2 — best for tie edits
    "gemini-3.1-flash-lite-image",  # Nano Banana 2 Lite — cheapest
    "gemini-2.5-flash-image",       # legacy Banana
]


def classify_error(exc: Exception) -> str:
    msg = str(exc)
    if "429" in msg:
        return "429 quota/rate-limit (key is valid — wait or check billing)"
    if "404" in msg:
        return "404 model not found or not available in your region"
    if "401" in msg or "403" in msg:
        return "auth failed — check GEMINI_API_KEY"
    return msg[:160]


def try_generate(client, model: str, contents, config=None) -> tuple[bool, str]:
    from google.genai import types

    try:
        kwargs = {"model": model, "contents": contents}
        if config:
            kwargs["config"] = config
        r = client.models.generate_content(**kwargs)
        if hasattr(r, "text") and r.text:
            return True, (r.text or "").strip()[:80]
        parts = r.candidates[0].content.parts if r.candidates else []
        has_image = any(getattr(p, "inline_data", None) for p in parts)
        text = next((p.text for p in parts if p.text), "")
        return True, f"image={has_image} text={text[:40]!r}"
    except Exception as e:
        return False, classify_error(e)


def main() -> int:
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        print("FAIL: set GEMINI_API_KEY in .env")
        return 1

    print("=== Gemini API test ===")
    print("Key present: yes\n")

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=key)

    # List models your key can see
    print("--- Models on your account (image-capable) ---")
    image_capable: list[str] = []
    try:
        for m in client.models.list():
            name = (getattr(m, "name", "") or "").replace("models/", "")
            methods = getattr(m, "supported_generation_methods", None) or []
            if "image" in name or "generateContent" in str(methods):
                if "image" in name:
                    image_capable.append(name)
                    print(f"  {name}")
        if not image_capable:
            print("  (none with 'image' in name — will probe defaults below)")
    except Exception as e:
        print(f"  list failed: {classify_error(e)}")

    # Text
    print("\n--- Text models ---")
    text_ok = None
    env_model = os.getenv("GEMINI_MODEL")
    candidates = ([env_model] if env_model else []) + TEXT_MODELS
    seen: set[str] = set()
    for model in candidates:
        if not model or model in seen:
            continue
        seen.add(model)
        ok, detail = try_generate(client, model, "Reply with one word: working")
        status = "OK " if ok else "ERR"
        print(f"{status} {model} -> {detail}")
        if ok and not text_ok:
            text_ok = model

    # JSON
    if text_ok:
        print(f"\n--- JSON via {text_ok} ---")
        ok, detail = try_generate(
            client,
            text_ok,
            "Navy Hugo Boss tie as JSON keys: color, pattern, brand",
            types.GenerateContentConfig(response_mime_type="application/json"),
        )
        print(f"{'OK ' if ok else 'ERR'} -> {detail}")
    else:
        print("\n--- JSON --- skipped (no working text model)")

    # Image / Banana
    print("\n--- Image models (Banana) ---")
    env_image = os.getenv("GEMINI_IMAGE_MODEL")
    img_candidates = ([env_image] if env_image else []) + IMAGE_MODELS + image_capable
    seen_img: set[str] = set()
    image_ok = None
    for model in img_candidates:
        if not model or model in seen_img:
            continue
        seen_img.add(model)
        ok, detail = try_generate(
            client,
            model,
            "Simple red circle on white background",
            types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"]),
        )
        status = "OK " if ok else "ERR"
        print(f"{status} {model} -> {detail}")
        if ok and not image_ok:
            image_ok = model

    print("\n=== Summary ===")
    if text_ok:
        print(f"Text model to use:  GEMINI_MODEL={text_ok}")
    else:
        print("Text: blocked (likely 429 quota) — key still authenticates")
        print("  → https://aistudio.google.com/ → Usage & billing → wait 1 min, retry")

    if image_ok:
        print(f"Image model to use: GEMINI_IMAGE_MODEL={image_ok}")
    else:
        print("Image: update .env — old gemini-2.0-flash-preview-image-generation is SHUT DOWN")
        print("  → use gemini-3.1-flash-image or gemini-3.1-flash-lite-image")

    print("\n=== Done ===")
    return 0 if (text_ok or image_ok) else 1


if __name__ == "__main__":
    sys.exit(main())
