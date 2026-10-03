"""Backfill public thumbnails for items with stored full-size images."""

import logging

from storage3.exceptions import StorageException

from . import db
from .config import BUCKET
from .images import UPLOAD_OPTIONS, make_thumbnail

logger = logging.getLogger(__name__)


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    storage = db.client().storage.from_(BUCKET)
    paths = db.image_paths()
    failures = 0
    for path in paths:
        try:
            image = storage.download(path)
            thumbnail = make_thumbnail(image)
            storage.upload(
                f"thumbs/{path}", thumbnail, file_options=UPLOAD_OPTIONS
            )
        except (StorageException, OSError, ValueError) as exc:
            logger.warning("Thumbnail generation failed for %s: %s", path, exc)
            failures += 1
    print(f"thumbnails={len(paths)} failures={failures}")
    return 1 if failures else 0
