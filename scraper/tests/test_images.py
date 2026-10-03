from io import BytesIO

from PIL import Image

from terpsdining_scraper.images import make_thumbnail


def test_make_thumbnail_resizes_to_webp():
    with BytesIO() as source:
        Image.new("RGB", (480, 320), color="red").save(source, format="PNG")
        result = make_thumbnail(source.getvalue())

    with Image.open(BytesIO(result)) as thumbnail:
        assert thumbnail.format == "WEBP"
        assert max(thumbnail.size) == 160
