"""Tests for Gemini image edit file cache."""

from part2_customizer.image_cache import cache_key, get_cached, store_cached


def test_cache_roundtrip(tmp_path, monkeypatch):
    generated = tmp_path / "generated"
    cache_dir = generated / "cache"
    cache_dir.mkdir(parents=True)

    import part2_customizer.image_cache as cache_mod

    monkeypatch.setattr(cache_mod, "ROOT", tmp_path)
    monkeypatch.setattr(cache_mod, "CACHE_DIR", cache_dir)
    monkeypatch.setattr(cache_mod, "INDEX_PATH", cache_dir / "index.json")
    monkeypatch.setenv("GEMINI_IMAGE_CACHE", "true")

    source = b"fake-image-bytes"
    instruction = "Add join fleek embroidery"
    key = cache_key("fleek-hugo-boss-tie", instruction, source)
    assert key.startswith("fleek-hugo-boss-tie_")

    png = generated / "customized-test.png"
    png.write_bytes(b"png-data")
    store_cached(
        "fleek-hugo-boss-tie",
        instruction,
        source,
        original_rel="/generated/original-test.png",
        customized_rel="/generated/customized-test.png",
    )

    hit = get_cached(
        "fleek-hugo-boss-tie",
        instruction,
        source,
        base_url="http://localhost:8000",
    )
    assert hit is not None
    assert hit["status"] == "cached"
    assert "customized-test.png" in hit["customized_image_url"]

    miss = get_cached(
        "fleek-hugo-boss-tie",
        "Different instruction",
        source,
        base_url="http://localhost:8000",
    )
    assert miss is None
