"""Part 1: Classify prompts as text or image, then describe the request."""

from part1_classifier.classifier import classify_input, InputType
from part1_classifier.describer import describe_prompt
from part1_classifier.models import ClassificationResult, PromptDescription

__all__ = [
    "classify_input",
    "InputType",
    "describe_prompt",
    "ClassificationResult",
    "PromptDescription",
]
