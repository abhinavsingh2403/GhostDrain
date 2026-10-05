"""P7: Resample rasters from UTM to Web-Mercator-aligned display grid.

Input:  data/interim/*.tif (UTM)
Output: data/processed/*.f32.bin (EPSG:3857-aligned grid)

The display grid dimensions and cell size come from config.yaml.
Resampling is bilinear. See docs/ARCHITECTURE.md section 6.
"""
from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling
from pyproj import Transformer

from .config_loader import load_config, require

PROJECT_ROOT = Path(__file__).parent.parent


def compute_display_grid_params(
    bbox_4326: list[float],
    width: int,
    height: int,
) -> dict:
    """Compute the Web-Mercator display grid bounds and transform.

    Args:
        bbox_4326: [lon_min, lat_min, lon_max, lat_max] in WGS84.
        width: Grid width in pixels.
        height: Grid height in pixels.

    Returns:
        Dict with bbox_3857, transform, cell_size_m, ground_scale_k.
    """
    transformer = Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True)
    x_min, y_min = transformer.transform(bbox_4326[0], bbox_4326[1])
    x_max, y_max = transformer.transform(bbox_4326[2], bbox_4326[3])

    cell_x = (x_max - x_min) / width
    cell_y = (y_max - y_min) / height

    lat0 = (bbox_4326[1] + bbox_4326[3]) / 2.0
    ground_scale_k = math.cos(math.radians(lat0))

    return {
        "bbox_3857": [x_min, y_min, x_max, y_max],
        "cell_size_3857_m": (cell_x + cell_y) / 2.0,
        "lat0_deg": lat0,
        "ground_scale_k": round(ground_scale_k, 6),
    }


def resample_to_display_grid(
    input_path: Path,
    output_path: Path,
    bbox_3857: list[float],
    width: int,
    height: int,
    nodata: float = -9999.0,
) -> None:
    """Resample a UTM raster to the display grid (EPSG:3857).

    Output is a raw float32 binary file, row-major, north-up (row 0 = north).

    Args:
        input_path: UTM raster (GeoTIFF).
        output_path: Output .f32.bin file.
        bbox_3857: [xmin, ymin, xmax, ymax] in Web Mercator.
        width: Display grid width.
        height: Display grid height.
        nodata: Nodata value.
    """
    from rasterio.transform import from_bounds

    dst_transform = from_bounds(
        bbox_3857[0], bbox_3857[1], bbox_3857[2], bbox_3857[3],
        width, height,
    )

    dst_data = np.full((1, height, width), nodata, dtype=np.float32)

    with rasterio.open(input_path) as src:
        reproject(
            source=rasterio.band(src, 1),
            destination=dst_data,
            dst_transform=dst_transform,
            dst_crs="EPSG:3857",
            resampling=Resampling.bilinear,
            dst_nodata=nodata,
        )

    # Write as raw little-endian float32, row-major, row 0 = north
    output_path.parent.mkdir(parents=True, exist_ok=True)
    dst_data[0].astype("<f4").tofile(output_path)


def run() -> None:
    """Execute P7: resample all rasters to display grid."""
    cfg = load_config()
    bbox_4326 = cfg["study_bbox"]
    width = cfg["grid"]["width"]
    height = cfg["grid"]["height"]
    nodata = cfg["grid"]["nodata"]
    interim = PROJECT_ROOT / cfg["paths"]["interim"]
    processed = PROJECT_ROOT / cfg["paths"]["processed"]

    grid_params = compute_display_grid_params(bbox_4326, width, height)
    bbox_3857 = grid_params["bbox_3857"]

    raster_pairs = [
        ("dem_cond.tif", "dem.f32.bin"),
        ("accum.tif", "accum.f32.bin"),
        ("hand.tif", "hand.f32.bin"),
        ("depress_depth.tif", "depress.f32.bin"),
    ]

    for src_name, dst_name in raster_pairs:
        src_path = interim / src_name
        if not src_path.exists():
            print(f"P7: skipping {src_name} (not found)")
            continue
        dst_path = processed / dst_name
        resample_to_display_grid(src_path, dst_path, bbox_3857, width, height, nodata)
        print(f"P7: {src_name} -> {dst_name}")


if __name__ == "__main__":
    run()
