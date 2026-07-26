"""Load mock Fleek catalogue — handoff data for Part 2."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field

DATA_PATH = Path(__file__).resolve().parent / "data" / "mock_products.json"


class MockProduct(BaseModel):
    id: str
    title: str
    category: str
    slots: list[str] = Field(default_factory=list)
    brands: list[str] = Field(default_factory=list)
    search_keywords: list[str] = Field(default_factory=list)
    formality: list[str] = Field(default_factory=list)
    colors: list[str] = Field(default_factory=list)
    style_tags: list[str] = Field(default_factory=list)
    price: str
    url: str
    image_url: str
    price_amount: float | None = None
    price_currency: str = "USD"
    unit: str = "bundle"
    pieces: int | None = None


class MockCatalogue(BaseModel):
    source: str
    products: list[MockProduct]


@lru_cache
def load_catalogue() -> MockCatalogue:
    raw: dict[str, Any] = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    return MockCatalogue.model_validate(raw)


def get_product(product_id: str) -> MockProduct:
    for product in load_catalogue().products:
        if product.id == product_id:
            return product
    raise KeyError(f"Unknown product: {product_id}")


def list_products() -> list[MockProduct]:
    return load_catalogue().products
