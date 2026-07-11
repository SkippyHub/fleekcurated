"""Tests for mock pricing and order estimation."""

from part2_customizer.pricing import create_mock_order, estimate_order


def test_estimate_hugo_boss_tie_includes_bundle_and_customization():
    estimate = estimate_order(
        product_id="fleek-hugo-boss-tie",
        customization_prompt="Add embroidered 'join fleek' branding on the tie",
        include_preview=True,
    )
    assert estimate.currency == "GBP"
    assert estimate.bundle_price_gbp > 0
    assert estimate.customization_fee_gbp >= 4.99
    assert estimate.api_cost_gbp > 0
    assert estimate.total == estimate.subtotal - estimate.discount
    kinds = {item.kind for item in estimate.line_items}
    assert "bundle" in kinds
    assert "customization" in kinds


def test_promo_code_applies_discount():
    estimate = estimate_order(
        product_id="fleek-hugo-boss-tie",
        customization_prompt="Add join fleek embroidery",
        promo_code="APPFIRSTORDER",
    )
    assert estimate.discount == 20.0
    assert estimate.promo_applied is not None
    assert estimate.total < estimate.subtotal


def test_create_mock_order_returns_confirmed_order():
    order = create_mock_order(
        product_id="fleek-hugo-boss-tie",
        customization_prompt="Keep blue pattern, add join fleek",
        promo_code="APPFIRSTORDER",
    )
    assert order.order_id.startswith("ord_")
    assert order.status == "confirmed"
    assert "joinfleek.com" in order.checkout_url
    assert order.estimate.total >= 0
