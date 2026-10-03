"""Find a food image, resize it, and store a public WebP thumbnail."""

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
                    image.thumbnail((480, 480))
                    with BytesIO() as output:
                        image.save(output, format="WEBP", quality=75)
                        path = f"{item_id}.webp"
                        sb.storage.from_(BUCKET).upload(
                            path,
                            output.getvalue(),
                            file_options={
                                "content-type": "image/webp",
                                "upsert": "true",
                            },
                        )
                return path
            except RatelimitException:
                raise
            except (httpx.HTTPError, OSError, ValueError, Image.DecompressionBombError, StorageException) as exc:
                logger.warning("Image candidate failed for %s: %s", item_id, exc)
                continue
    return None
