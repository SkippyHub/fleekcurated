from unittest.mock import patch

from part2_customizer.pipeline import customize_only


MOCK_CUSTOMIZE = {
    "product_id": "fleek-hugo-boss-tie",
    "original_image_url": "http://localhost:8000/generated/original-test.png",
    "customized_image_url": "http://localhost:8000/generated/customized-test.png",
    "prompt_used": "Recolour to burgundy",
    "edit_instruction": "Recolour to burgundy. Preserve pattern.",
    "status": "generated",
}


def test_customize_only_pipeline():
    with patch("part2_customizer.pipeline.customize_product", return_value=MOCK_CUSTOMIZE):
        result = customize_only(
            product_id="fleek-hugo-boss-tie",
            customization_prompt="Recolour to burgundy, keep Hugo Boss pattern",
            clothing_item="tie",
        )
    assert result.customization.status == "generated"
    assert result.customization.edit_instruction
    assert result.matched_product.product_id == "fleek-hugo-boss-tie"


def test_get_hugo_boss_tie_product():
    from part1_classifier.catalogue import get_product

    product = get_product("fleek-hugo-boss-tie")
    assert product.category == "tie"
    assert "joinfleek.com" in product.url
