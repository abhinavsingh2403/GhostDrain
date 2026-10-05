"""P8: Package artifacts for the web client.

Input:  data/processed/*.f32.bin, *.geojson
Output: web/public/data/* + grid.meta.json

Copies binary rasters and vectors to the web public directory
and writes grid.meta.json with the shared metadata contract.
See docs/ARCHITECTURE.md section 5.
"""
from __future__ import annotations

import json
import math
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from pyproj import Transformer

from .config_loader import load_config

PROJECT_ROOT = Path(__file__).parent.parent


def get_git_sha() -> str:
    """Get current git commit SHA, or 'unknown' if not in a repo."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            capture_output=True, text=True, cwd=PROJECT_ROOT,
        )
        return result.stdout.strip() if result.returncode == 0 else "unknown"
    except FileNotFoundError:
        return "unknown"


def run() -> None:
    """Execute P8: package artifacts for the web client."""
    cfg = load_config()
    bbox_4326 = cfg["study_bbox"]
    width = cfg["grid"]["width"]
    height = cfg["grid"]["height"]
    nodata = cfg["grid"]["nodata"]
    dem_source = cfg.get("dem_source", "unknown")

    processed = PROJECT_ROOT / cfg["paths"]["processed"]
    output_dir = PROJECT_ROOT / cfg["paths"]["output"]
    output_dir.mkdir(parents=True, exist_ok=True)

    # Compute grid metadata
    transformer = Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True)
    x_min, y_min = transformer.transform(bbox_4326[0], bbox_4326[1])
    x_max, y_max = transformer.transform(bbox_4326[2], bbox_4326[3])
    cell_x = (x_max - x_min) / width
    cell_y = (y_max - y_min) / height
    lat0 = (bbox_4326[1] + bbox_4326[3]) / 2.0

    meta = {
        "id": "bengaluru-core-v1",
        "crs": "EPSG:3857",
        "bbox_3857": [x_min, y_min, x_max, y_max],
        "width": width,
        "height": height,
        "cell_size_3857_m": round((cell_x + cell_y) / 2.0, 4),
        "lat0_deg": round(lat0, 6),
        "ground_scale_k": round(math.cos(math.radians(lat0)), 6),
        "nodata": nodata,
        "dem_source_id": dem_source,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "pipeline_git_sha": get_git_sha(),
    }

    # Write grid.meta.json
    meta_path = output_dir / "grid.meta.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(f"P8: wrote {meta_path}")

    # Copy binary rasters
    for bin_file in processed.glob("*.f32.bin"):
        shutil.copy2(bin_file, output_dir / bin_file.name)
        print(f"P8: copied {bin_file.name}")

    # Copy GeoJSON vectors
    for geojson_file in processed.glob("*.geojson"):
        shutil.copy2(geojson_file, output_dir / geojson_file.name)
        print(f"P8: copied {geojson_file.name}")

    print(f"P8 complete: {len(list(output_dir.iterdir()))} files in {output_dir}")


if __name__ == "__main__":
    run()
