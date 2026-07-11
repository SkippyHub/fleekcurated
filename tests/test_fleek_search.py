"""Tests for Fleek search URL builder and catalogue matching."""

from part1_classifier.fleek_search import build_fleek_search_url, enrich_outfit, match_catalogue
from part1_classifier.models import OutfitAnalysisResult, OutfitItem


def test_build_fleek_search_url():
    url = build_fleek_search_url("hugo boss shirt")
    assert "joinfleek.com/search" in url
    assert "hugo" in url.lower()
    assert "boss" in url.lower()


def test_match_catalogue_hugo_boss_tie():
    hits = match_catalogue("hugo boss tie designer", "Necktie")
    assert len(hits) >= 1
    assert any("tie" in h.title.lower() or "hugo" in h.title.lower() for h in hits)


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
