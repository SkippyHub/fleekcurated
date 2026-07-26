"""Tests for Fleek search URL builder and catalogue matching."""

from part1_classifier.fleek_search import (
    build_fleek_search_url,
    enrich_outfit,
    match_catalogue,
    normalize_slot,
)
from part1_classifier.models import OutfitAnalysisResult, OutfitItem


def test_build_fleek_search_url():
    url = build_fleek_search_url("hugo boss shirt")
    assert "joinfleek.com/search" in url
    assert "hugo" in url.lower()
    assert "boss" in url.lower()


def test_normalize_slot_aliases():
    assert normalize_slot("suit-jacket", "Suit jacket") == "jacket"
    assert normalize_slot("necktie", "Necktie") == "tie"
    assert normalize_slot("pocket-square", "Accessory") == "accessory"


def test_match_catalogue_hugo_boss_tie():
    hits = match_catalogue(
        "hugo boss tie designer",
        "Necktie",
        item_id="tie",
        brand="Hugo Boss",
        color="blue",
        outfit_formality={"formal", "business"},
    )
    assert len(hits) >= 1
    assert hits[0].product_id in {"fleek-hugo-boss-tie", "fleek-mix-neckwear"}
    for h in hits:
        assert "tie" in h.title.lower()


def test_match_catalogue_jacket_not_tshirt_or_carhartt_for_formal():
    hits = match_catalogue(
        "mens blue blazer suit jacket",
        "Suit jacket",
        item_id="jacket",
        color="blue",
        outfit_formality={"formal", "business"},
    )
    assert len(hits) >= 1
    top_ids = [h.product_id for h in hits[:3]]
    assert "fleek-carhartt-jacket" not in top_ids
    for h in hits:
        assert "t-shirt" not in h.title.lower()
        assert "tie" not in h.title.lower()


def test_match_catalogue_hugo_boss_shirt_brand_boost():
    hits = match_catalogue(
        "hugo boss formal dress shirts light blue",
        "Dress shirt",
        item_id="shirt",
        brand="Hugo Boss",
        color="light blue",
        outfit_formality={"formal", "business"},
    )
    assert len(hits) >= 1
    assert hits[0].product_id in {"fleek-hugo-boss-formal-shirts", "fleek-hugo-boss-shirts"}
    for h in hits:
        assert "t-shirt" not in h.title.lower()


def test_match_catalogue_pocket_square_no_jacket_fallback():
    hits = match_catalogue(
        "pocket square menswear",
        "Accessory",
        item_id="pocket-square",
        outfit_formality={"formal", "business"},
    )
    assert hits == []


def test_enrich_outfit_adds_search_url():
    outfit = OutfitAnalysisResult(
        input_type="text",
        confidence=0.9,
        summary="Business formal blue suit",
        items=[
            OutfitItem(
                id="tie",
                label="Tie",
                type="Necktie",
                brand="Hugo Boss",
                fleek_search_term="hugo boss tie",
            )
        ],
    )
    enriched = enrich_outfit(outfit)
    assert enriched.items[0].fleek_search_url
    assert "joinfleek.com/search" in enriched.items[0].fleek_search_url
    assert len(enriched.items[0].fleek_matches) >= 1
