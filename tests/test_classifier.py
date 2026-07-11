from io import BytesIO

from PIL import Image

from part1_classifier.classifier import classify_input
from part1_classifier.describer import describe_prompt
from part1_classifier.models import InputType
from part1_classifier.pipeline import analyze


def test_classify_text_only():
    result = classify_input(text="Make this hoodie vintage red")
    assert result.input_type == InputType.TEXT
    assert result.confidence == 1.0


def test_describe_text_rules():
    desc = describe_prompt(InputType.TEXT, text="Customise my black hoodie with a neon logo, streetwear vibe")
    assert desc.clothing_item == "hoodie"
    assert "streetwear" in desc.style_tags
    assert desc.customization_intent is not None


def test_analyze_pipeline_text():
    response = analyze(text="Turn this jacket into Y2K pink")
    assert response.classification.input_type == InputType.TEXT
    assert response.description.summary
    assert "jacket" in (response.description.clothing_item or "")


def test_classify_image_bytes():
    buf = BytesIO()
    Image.new("RGB", (1, 1), color="red").save(buf, format="PNG")
    result = classify_input(image_bytes=buf.getvalue(), content_type="image/png")
    assert result.input_type == InputType.IMAGE
