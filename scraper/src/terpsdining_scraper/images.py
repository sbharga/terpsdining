"""Find food images, resize them, and store public WebP images and thumbnails."""

import logging
import re
from io import BytesIO

import httpx
from ddgs import DDGS
from ddgs.exceptions import DDGSException, RatelimitException
from PIL import Image
from storage3.exceptions import StorageException
from supabase import Client

from .config import BUCKET

THUMB_SIZE = 160
FULL_SIZE = 480
UPLOAD_OPTIONS = {
    "content-type": "image/webp",
    "upsert": "true",
    "cache-control": "604800",
}


def webp_bytes(image: Image.Image, size: int) -> bytes:
    resized = image.copy()
    resized.thumbnail((size, size))
    with BytesIO() as output:
        resized.save(output, format="WEBP", quality=75)
        return output.getvalue()


def make_thumbnail(data: bytes) -> bytes:
    with Image.open(BytesIO(data)) as original, original.convert("RGB") as image:
        return webp_bytes(image, THUMB_SIZE)


logger = logging.getLogger(__name__)


def fetch_and_store_image(
    client: httpx.Client, sb: Client, item_id: str, name: str
) -> str | None:
    query = re.sub(r"\s*\([^)]*\)", "", name).strip() + " food"
    try:
        results = DDGS().images(query, max_results=5, safesearch="moderate")
    except RatelimitException:
        raise
    except DDGSException as exc:
        logger.warning("Image search failed for %s: %s", item_id, exc)
        return None

    for result in results:
        for field in ("thumbnail", "image"):
            url = result.get(field)
            if not url:
                continue
            try:
                response = client.get(url, timeout=10, follow_redirects=True)
                if response.status_code != 200 or len(response.content) > 5 * 1024 * 1024:
                    continue
                with Image.open(BytesIO(response.content)) as original, original.convert("RGB") as image:
                    path = f"{item_id}.webp"
                    storage = sb.storage.from_(BUCKET)
                    storage.upload(
                        path,
                        webp_bytes(image, FULL_SIZE),
                        file_options=UPLOAD_OPTIONS,
                    )
                    storage.upload(
                        f"thumbs/{path}",
                        webp_bytes(image, THUMB_SIZE),
                        file_options=UPLOAD_OPTIONS,
                    )
                return path
            except RatelimitException:
                raise
            except (httpx.HTTPError, OSError, ValueError, Image.DecompressionBombError, StorageException) as exc:
                logger.warning("Image candidate failed for %s: %s", item_id, exc)
                continue
    return None


