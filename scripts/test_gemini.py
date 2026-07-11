#!/usr/bin/env python3
"""Quick Gemini API smoke test. Run: python scripts/test_gemini.py"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")


def main() -> int:
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        print("FAIL: set GEMINI_API_KEY in .env")
        return 1

    print("=== Gemini API test ===")
    print("Key present: yes")

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=key)
    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    print(f"\n--- Text ({model}) ---")
    try:
        r = client.models.generate_content(
            model=model,
            contents="Reply with exactly one word: working",
        )
        print(f"OK  -> {(r.text or '').strip()!r}")
    except Exception as e:
        msg = str(e)
        if "429" in msg:
            print("429 QUOTA — key works, but rate limit / quota exceeded")
            print("    Check: https://aistudio.google.com/ → Usage & billing")
        elif "401" in msg or "403" in msg:
            print(f"AUTH FAIL -> {msg[:200]}")
            return 1
        else:
            print(f"ERR -> {msg[:200]}")
            return 1

    print("\n--- JSON ---")
    try:
        r = client.models.generate_content(
            model=model,
            contents="Navy Hugo Boss tie as JSON: color, pattern, brand",
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        print(f"OK  -> {(r.text or '')[:200]}")
    except Exception as e:
        print(f"ERR -> {str(e)[:200]}")

    image_model = os.getenv("GEMINI_IMAGE_MODEL", "gemini-2.0-flash-preview-image-generation")
    print(f"\n--- Image ({image_model}) ---")
    try:
        r = client.models.generate_content(
            model=image_model,
            contents="Simple red circle on white background",
            config=types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"]),
        )
        parts = r.candidates[0].content.parts if r.candidates else []
        has_image = any(getattr(p, "inline_data", None) for p in parts)
        print(f"OK  -> image_returned={has_image}")
    except Exception as e:
        print(f"ERR -> {str(e)[:200]}")

    print("\n=== Done ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
