"""Validate data manifest and check file checksums."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


def load_manifest(path: Path) -> dict[str, Any]:
    """Load and return manifest.json."""
    if not path.exists():
        raise FileNotFoundError(f"Manifest not found: {path}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_dataset(manifest: dict[str, Any], dataset_id: str) -> dict[str, Any]:
    """Return the dataset entry matching `dataset_id`, or raise."""
    for ds in manifest.get("datasets", []):
        if ds.get("id") == dataset_id:
            return ds
    raise ValueError(f"Dataset {dataset_id} not found in manifest")


def verify_checksum(file_path: Path, expected_sha256: str | None) -> bool:
    """Verify SHA-256 checksum of a file against the manifest value.

    Returns True if checksum matches or expected is None (not yet set).
    Raises ValueError on mismatch.
    """
    if expected_sha256 is None:
        return True  # Not yet fetched; skip verification
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    actual = h.hexdigest()
    if actual != expected_sha256:
        raise ValueError(
            f"Checksum mismatch for {file_path}: "
            f"expected {expected_sha256}, got {actual}"
        )
    return True
