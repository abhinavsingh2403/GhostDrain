"""P2: Clip DEM to study bbox and reproject to metric CRS.

Input:  data/raw/*.tif (DEM tiles in EPSG:4326)
Output: data/interim/dem_utm.tif (EPSG:32643, UTM zone 43N)
See docs/ARCHITECTURE.md section 4, row P2.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import rasterio
from rasterio.merge import merge
from rasterio.warp import calculate_default_transform, reproject, Resampling

from .config_loader import load_config, require

PROJECT_ROOT = Path(__file__).parent.parent


def clip_and_reproject(
    input_paths: list[Path],
    output_path: Path,
    target_crs: str,
    bbox: list[float],
) -> dict[str, Any]:
    """Merge DEM tiles, clip to bbox, reproject to target CRS.

    Args:
        input_paths: Paths to raw DEM GeoTIFFs.
        output_path: Path for the output reprojected raster.
        target_crs: Target CRS string, e.g. 'EPSG:32643'.
        bbox: [lon_min, lat_min, lon_max, lat_max] in EPSG:4326.

    Returns:
        Dict with metadata (shape, transform, crs, bounds).
    """
    # Open and merge tiles
    datasets = [rasterio.open(p) for p in input_paths]
    mosaic, mosaic_transform = merge(datasets, bounds=tuple(bbox))
    for ds in datasets:
        ds.close()

    src_crs = "EPSG:4326"
    height, width = mosaic.shape[1], mosaic.shape[2]

    # Calculate transform for target CRS
    dst_transform, dst_width, dst_height = calculate_default_transform(
        src_crs, target_crs, width, height,
        left=bbox[0], bottom=bbox[1], right=bbox[2], top=bbox[3],
    )

    dst_data = np.empty((1, dst_height, dst_width), dtype=np.float32)

    reproject(
        source=mosaic,
        destination=dst_data,
        src_transform=mosaic_transform,
        src_crs=src_crs,
        dst_transform=dst_transform,
        dst_crs=target_crs,
        resampling=Resampling.bilinear,
        src_nodata=-9999.0,
        dst_nodata=-9999.0,
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    profile = {
        "driver": "GTiff",
        "dtype": "float32",
        "width": dst_width,
        "height": dst_height,
        "count": 1,
        "crs": target_crs,
        "transform": dst_transform,
        "nodata": -9999.0,
    }
    with rasterio.open(output_path, "w", **profile) as dst:
        dst.write(dst_data)

    return {
        "shape": (dst_height, dst_width),
        "crs": target_crs,
        "transform": list(dst_transform)[:6],
        "bounds": rasterio.transform.array_bounds(dst_height, dst_width, dst_transform),
    }


def run() -> None:
    """Execute P2: clip and reproject the selected DEM."""
    cfg = load_config()
    dem_source = require(cfg, "dem_source")
    target_crs = require(cfg, "crs", "analysis")
    bbox = cfg["study_bbox"]

    raw_dir = PROJECT_ROOT / cfg["paths"]["raw"]
    interim_dir = PROJECT_ROOT / cfg["paths"]["interim"]
    interim_dir.mkdir(parents=True, exist_ok=True)

    # Find raw DEM files for the selected source
    dem_files = sorted(raw_dir.glob("*.tif"))
    if not dem_files:
        raise FileNotFoundError(f"No .tif files in {raw_dir}")

    output = interim_dir / "dem_utm.tif"
    meta = clip_and_reproject(dem_files, output, target_crs, bbox)
    print(f"P2 complete: {output} -> {meta['shape']}, CRS={meta['crs']}")


if __name__ == "__main__":
    run()
