from part1_classifier.catalogue import get_product, list_products
from part1_classifier.models import InputType
from part1_classifier.pipeline import analyze
from part2_customizer.curate_pipeline import curate
from part2_customizer.models import CurateResponse


def test_mock_catalogue_loads():
    products = list_products()
    assert len(products) >= 3
    assert products[0].id


def test_get_product():
    product = get_product("fleek-black-hoodie")
    assert product.category == "hoodie"


def test_curate_text_pipeline():
    result: CurateResponse = curate(
        product_id="fleek-black-hoodie",
        text="Customise this black hoodie with a neon logo, streetwear vibe",
    )
    assert result.analysis.classification.input_type == InputType.TEXT
    assert result.analysis.description.clothing_item == "hoodie"
    assert result.customization.product_id == "fleek-black-hoodie"
    assert result.customization.status == "mock"
    assert result.matched_product.product_id == "fleek-black-hoodie"
    assert result.matched_product.match_score == 1.0


def test_analyze_still_works():
    result = analyze(text="Turn this jacket Y2K pink")
    assert result.description.clothing_item == "jacket"
