"""P1: Fetch raw datasets listed in the manifest.

Downloads DEM tiles and SWD KML files to data/raw/.
Verifies checksums against manifest entries.
See docs/ARCHITECTURE.md section 4, row P1.
"""
from __future__ import annotations

import sys
from pathlib import Path

from .config_loader import load_config
from .manifest import load_manifest, get_dataset, verify_checksum

PROJECT_ROOT = Path(__file__).parent.parent


def run() -> None:
    """Fetch all raw datasets from manifest URLs.

    For S3 (Copernicus), uses AWS CLI with --no-sign-request.
    For HTTP URLs, uses urllib or requests.
    """
    cfg = load_config()
    manifest_path = PROJECT_ROOT / cfg["paths"]["manifest"]
    manifest = load_manifest(manifest_path)
    raw_dir = PROJECT_ROOT / cfg["paths"]["raw"]
    raw_dir.mkdir(parents=True, exist_ok=True)

    # TODO: Implement per-dataset fetch logic after bbox is finalized
    # - DS-01: aws s3 cp --no-sign-request s3://copernicus-dem-30m/<tiles>
    # - DS-02: FABDEM download (URL to confirm [U])
    # - DS-03: HTTP download from OpenCity.in KML links
    # - DS-05: Overpass API query for Bengaluru bbox
    print("P1 fetch: not yet implemented (awaiting bbox finalization)")


if __name__ == "__main__":
    run()
