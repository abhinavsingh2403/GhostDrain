"""P3: Condition DEM — fill depressions, preserve depression depth.

Input:  data/interim/dem_utm.tif
Output: data/interim/dem_cond.tif (filled), data/interim/depress_depth.tif

Method: Priority-Flood (Wang and Liu 2006 / Barnes et al. 2014)
via WhiteboxTools (Rust-based engine, pre-compiled standalone binary).
Depressions are filled to their spill level, but the depth map
(filled - original) is saved as its own layer for the ponding view.
See docs/HYDROLOGY_SPEC.md section 4.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import rasterio
import whitebox

from .config_loader import load_config

PROJECT_ROOT = Path(__file__).parent.parent


def condition_dem(
    input_path: Path,
    output_filled: Path,
    output_depth: Path,
    nodata: float = -9999.0,
) -> dict[str, float]:
    """Fill depressions and compute depression depth using WhiteboxTools.

    Args:
        input_path: Path to the UTM-projected DEM.
        output_filled: Path for the filled (conditioned) DEM.
        output_depth: Path for the depression depth raster.
        nodata: Nodata sentinel value.

    Returns:
        Dict with max_depression_depth_m and fill_volume_m3.
    """
    output_filled.parent.mkdir(parents=True, exist_ok=True)
    output_depth.parent.mkdir(parents=True, exist_ok=True)

    wbt = whitebox.WhiteboxTools()
    wbt.set_verbose_mode(False)
    wbt.work_dir = str(input_path.parent.resolve())

    # Priority-Flood filling (Wang & Liu 2006)
    in_name = input_path.name
    filled_temp = output_filled.parent / ("_temp_" + output_filled.name)

    ret = wbt.fill_depressions_wang_and_liu(
        str(input_path.resolve()),
        str(filled_temp.resolve()),
        flat_increment=0.001,
    )
    if ret != 0 or not filled_temp.exists():
        raise RuntimeError(f"WhiteboxTools FillDepressionsWangAndLiu failed with return code {ret}")

    # Read original and filled data to compute depth map
    with rasterio.open(input_path) as src_orig:
        profile = src_orig.profile.copy()
        dem_orig = src_orig.read(1)
        cell_size = abs(src_orig.transform.a)

    with rasterio.open(filled_temp) as src_filled:
        dem_filled = src_filled.read(1)

    # Clean up temp file
    if filled_temp.exists():
        filled_temp.unlink()

    # Mask nodata
    mask = (dem_orig == nodata) | ~np.isfinite(dem_orig)
    dem_filled[mask] = nodata

    # Compute depression depth: filled - original (>= 0 everywhere)
    depth = dem_filled - dem_orig
    depth[mask] = nodata
    depth[depth < 0] = 0.0

    # Write output rasters
    for out_path, data in [(output_filled, dem_filled), (output_depth, depth)]:
        with rasterio.open(out_path, "w", **profile) as dst:
            dst.write(data, 1)

    valid_depth = depth[~mask]
    return {
        "max_depression_depth_m": float(np.max(valid_depth)) if valid_depth.size > 0 else 0.0,
        "fill_volume_m3": float(np.sum(valid_depth[valid_depth > 0]) * cell_size * cell_size),
    }


def run() -> None:
    """Execute P3: condition the DEM."""
    cfg = load_config()
    nodata = cfg["grid"]["nodata"]
    interim = PROJECT_ROOT / cfg["paths"]["interim"]

    stats = condition_dem(
        input_path=interim / "dem_utm.tif",
        output_filled=interim / "dem_cond.tif",
        output_depth=interim / "depress_depth.tif",
        nodata=nodata,
    )
    print(f"P3 complete: max depression = {stats['max_depression_depth_m']:.2f} m")


if __name__ == "__main__":
    run()
