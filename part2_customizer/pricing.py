"""Mock pricing + cost estimation for AI alterations and Fleek bundles."""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone

from part1_classifier.catalogue import MockProduct, get_product
from part2_customizer.models import MockOrder, PriceEstimate, PriceLineItem

# Gemini 3.1 Flash Image — standard 1K output (~$0.067/image)
# https://ai.google.dev/gemini-api/docs/pricing
GEMINI_IMAGE_COST_USD = 0.067
GEMINI_STYLING_COST_USD = 0.003  # flash-lite instruction pass
USD_TO_GBP = 0.79

# Reseller-facing customization preview fee (covers API + handling margin)
CUSTOMIZATION_BASE_GBP = 4.99

# Category fallbacks when catalogue has no numeric price
CATEGORY_BUNDLE_GBP: dict[str, float] = {
    "tie": 328.0,
    "t-shirt": 103.0,
    "hoodie": 119.0,
    "jeans": 109.0,
    "jacket": 409.0,
    "shorts": 135.0,
}

PROMO_CODES: dict[str, dict[str, float | str]] = {
    "APPFIRSTORDER": {"discount_gbp": 20.0, "label": "£20 off first app order"},
}

COMPLEXITY_KEYWORDS = {
    "high": ("recolour", "recolor", "pattern", "logo", "remove", "replace", "full"),
    "medium": ("embroid", "brand", "colour", "color", "print", "monogram"),
}


def _parse_price_amount(price: str) -> float | None:
    match = re.search(r"[\d,.]+", price.replace(",", ""))
    if not match:
        return None
    try:
        return float(match.group())
    except ValueError:
        return None


def _bundle_price_gbp(product: MockProduct) -> tuple[float, str]:
    if product.price_amount is not None:
        amount = product.price_amount
        currency = product.price_currency.upper()
        if currency == "USD":
            return round(amount * USD_TO_GBP, 2), product.price
        return round(amount, 2), product.price

    parsed = _parse_price_amount(product.price)
    if parsed is not None:
        return round(parsed * USD_TO_GBP, 2), product.price

    fallback = CATEGORY_BUNDLE_GBP.get(product.category, 150.0)
    return fallback, product.price


def _customization_complexity(prompt: str) -> str:
    lower = prompt.lower()
    if any(k in lower for k in COMPLEXITY_KEYWORDS["high"]):
        return "high"
    if any(k in lower for k in COMPLEXITY_KEYWORDS["medium"]):
        return "medium"
    return "low"


def _customization_fee_gbp(prompt: str, *, include_preview: bool) -> float:
    if not include_preview:
        return 0.0
    tier = _customization_complexity(prompt)
    multipliers = {"low": 1.0, "medium": 1.25, "high": 1.5}
    return round(CUSTOMIZATION_BASE_GBP * multipliers[tier], 2)


def _api_cost_gbp() -> float:
    total_usd = GEMINI_IMAGE_COST_USD + GEMINI_STYLING_COST_USD
    return round(total_usd * USD_TO_GBP, 2)


def estimate_order(
    *,
    product_id: str,
    customization_prompt: str,
    promo_code: str | None = None,
    include_preview: bool = True,
    quantity: int = 1,
) -> PriceEstimate:
    """Build a mock order estimate with transparent Gemini API cost."""
    product = get_product(product_id)
    bundle_gbp, bundle_label = _bundle_price_gbp(product)
    customization_gbp = _customization_fee_gbp(customization_prompt, include_preview=include_preview)
    api_gbp = _api_cost_gbp() if include_preview else 0.0

    qty = max(1, quantity)
    bundle_total = round(bundle_gbp * qty, 2)

    line_items: list[PriceLineItem] = [
        PriceLineItem(
            label=f"{product.title} × {qty} bundle{'s' if qty > 1 else ''}",
            amount=bundle_total,
            currency="GBP",
            kind="bundle",
            detail=bundle_label
            + (
                f" · ~£{(bundle_gbp / product.pieces):.2f}/pc · {product.pieces} pcs/bundle"
                if product.pieces
                else ""
            ),
        ),
    ]

    if include_preview:
        line_items.append(
            PriceLineItem(
                label="AI alteration preview",
                amount=customization_gbp,
                currency="GBP",
                kind="customization",
                detail=f"Gemini styling + image edit (~£{api_gbp:.2f} API cost)",
            )
        )

    subtotal = round(sum(item.amount for item in line_items), 2)
    discount = 0.0
    discount_label: str | None = None

    if promo_code:
        promo = PROMO_CODES.get(promo_code.strip().upper())
        if promo:
            discount = float(promo["discount_gbp"])
            discount_label = str(promo["label"])
            line_items.append(
                PriceLineItem(
                    label=discount_label,
                    amount=-discount,
                    currency="GBP",
                    kind="discount",
                )
            )

    total = round(max(subtotal - discount, 0.0), 2)
    total_pieces = (product.pieces or 0) * qty if product.pieces else None
    per_piece = round(bundle_gbp / product.pieces, 2) if product.pieces else None

    notes = [
        f"Ordering {qty} bundle(s)" + (f" = {total_pieces} pieces total" if total_pieces else ""),
        f"Bundle sourced from {product.url}",
        "AI preview uses gemini-3.1-flash-image at 1K (~$0.067/image per Google pricing).",
    ]
    if per_piece and product.pieces:
        notes.append(f"~£{per_piece:.2f}/piece on {product.pieces}-piece bundle (MOQ).")

    return PriceEstimate(
        line_items=line_items,
        subtotal=subtotal,
        discount=discount,
        total=total,
        currency="GBP",
        api_cost_gbp=api_gbp,
        customization_fee_gbp=customization_gbp,
        bundle_price_gbp=bundle_total,
        promo_applied=discount_label,
        notes=notes,
        quantity=qty,
        unit_price_gbp=bundle_gbp,
        price_per_piece_gbp=per_piece or 0.0,
        pieces_per_bundle=product.pieces,
        total_pieces=total_pieces,
    )


def create_mock_order(
    *,
    product_id: str,
    customization_prompt: str,
    promo_code: str | None = None,
    include_preview: bool = True,
    quantity: int = 1,
) -> MockOrder:
    product = get_product(product_id)
    estimate = estimate_order(
        product_id=product_id,
        customization_prompt=customization_prompt,
        promo_code=promo_code,
        include_preview=include_preview,
        quantity=quantity,
    )
    order_id = f"ord_{uuid.uuid4().hex[:10]}"
    checkout_url = product.url

    return MockOrder(
        order_id=order_id,
        status="confirmed",
        product_id=product_id,
        product_title=product.title,
        customization_prompt=customization_prompt,
        estimate=estimate,
        checkout_url=checkout_url,
        created_at=datetime.now(timezone.utc).isoformat(),
        message=f"Mock order for {estimate.quantity} bundle(s) ({estimate.total_pieces or '?'} pcs) — complete on Fleek.",
    )
