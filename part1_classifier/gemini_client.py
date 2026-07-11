"""Shared Gemini client helpers — used by Part 1 and Part 2."""

from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


def get_api_key() -> str | None:
    return os.getenv("GEMINI_API_KEY")


@lru_cache
def get_client():
    from google import genai

    key = get_api_key()
    if not key:
        return None
    return genai.Client(api_key=key)


def text_model() -> str:
    return os.getenv("GEMINI_REASONING_MODEL", "gemini-3.1-flash-lite")


def image_model() -> str:
    return os.getenv("GEMINI_IMAGE_MODEL", "gemini-3.1-flash-image")
