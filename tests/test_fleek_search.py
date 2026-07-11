"""Tests for Fleek search URL builder and catalogue matching."""

from part1_classifier.fleek_search import build_fleek_search_url, enrich_outfit, match_catalogue
from part1_classifier.models import OutfitAnalysisResult, OutfitItem


def test_build_fleek_search_url():
    url = build_fleek_search_url("hugo boss shirt")
    assert "joinfleek.com/search" in url
    assert "hugo" in url.lower()
    assert "boss" in url.lower()


def test_match_catalogue_hugo_boss_tie():
    hits = match_catalogue("hugo boss tie designer", "Necktie", item_id="tie")
    assert len(hits) >= 1
    assert any("tie" in h.title.lower() for h in hits)


def test_match_catalogue_jacket_not_tshirt():
    hits = match_catalogue("mens blazer suit jacket", "Suit jacket", item_id="jacket")
    assert len(hits) >= 1
    for h in hits:
        assert "t-shirt" not in h.title.lower()
        assert "tie" not in h.title.lower()
        assert "jacket" in h.title.lower() or "blazer" in h.title.lower()


def test_match_catalogue_dress_shirt_not_tee():
    hits = match_catalogue("hugo boss formal dress shirts", "Dress shirt", item_id="shirt")
    assert len(hits) >= 1
    for h in hits:
        assert "t-shirt" not in h.title.lower()


def test_enrich_outfit_adds_search_url():
    outfit = OutfitAnalysisResult(
        input_type="text",
        confidence=0.9,
        summary="Test",
        items=[
            OutfitItem(
                id="tie",
                label="Tie",
                type="Necktie",
                fleek_search_term="hugo boss tie",
            )
        ],
    )
    enriched = enrich_outfit(outfit)
    assert enriched.items[0].fleek_search_url
    assert "joinfleek.com/search" in enriched.items[0].fleek_search_url
