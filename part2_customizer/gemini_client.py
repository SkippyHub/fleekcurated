"""Re-export shared Gemini client from Part 1."""

from part1_classifier.gemini_client import get_api_key, get_client, image_model, text_model

__all__ = ["get_api_key", "get_client", "image_model", "text_model"]
