from io import BytesIO

from PIL import Image

from terpsdining_scraper.images import make_thumbnail, title_matches, title_words


def test_make_thumbnail_resizes_to_webp():
    with BytesIO() as source:
        Image.new("RGB", (480, 320), color="red").save(source, format="PNG")
        result = make_thumbnail(source.getvalue())

    with Image.open(BytesIO(result)) as thumbnail:
        assert thumbnail.format == "WEBP"
        assert max(thumbnail.size) == 160


def test_title_matches_requires_shared_name_word():
    pasta = title_words("Grilled Chicken Penne Pasta White Cheddar Sauce")
    assert not title_matches(pasta, "Cute dog training tips")
    assert title_matches(pasta, "White Cheddar Chicken Pasta (The Ultimate Creamy Recipe)")
    assert title_matches(title_words("Tacos"), "Crispy Taco Shell")
    assert not title_matches(title_words("Tacos"), None)
    assert title_matches(title_words("& (GF)"), "anything")
