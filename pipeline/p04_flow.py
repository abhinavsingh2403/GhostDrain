"""P4: Compute D8 flow direction and accumulation.

Input:  data/interim/dem_cond.tif
Output: data/interim/fdir_d8.tif, data/interim/accum.tif

Method: D8 steepest-descent routing. Slope = drop / distance,
with distance = cell_size for cardinal, cell_size * sqrt(2) for diagonal.
See docs/HYDROLOGY_SPEC.md section 5.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import rasterio
import whitebox

from .config_loader import load_config

PROJECT_ROOT = Path(__file__).parent.parent


def compute_flow(
    dem_path: Path,
    fdir_path: Path,
    accum_path: Path,
    nodata: float = -9999.0,
) -> dict[str, int]:
    """Compute D8 flow direction and accumulation from conditioned DEM.

    Args:
        dem_path: Path to filled/conditioned DEM.
        fdir_path: Output path for D8 flow direction raster.
        accum_path: Output path for flow accumulation raster.
        nodata: Nodata sentinel.

    Returns:
        Dict with total_cells and max_accumulation.
    """
    fdir_path.parent.mkdir(parents=True, exist_ok=True)
    accum_path.parent.mkdir(parents=True, exist_ok=True)

    wbt = whitebox.WhiteboxTools()
    wbt.set_verbose_mode(False)

    dem_abs = str(dem_path.resolve())
    fdir_abs = str(fdir_path.resolve())
    accum_abs = str(accum_path.resolve())

    ret_fdir = wbt.d8_pointer(dem_abs, fdir_abs)
    ret_accum = wbt.d8_flow_accumulation(dem_abs, accum_abs, out_type="cells")

    if ret_fdir != 0 or ret_accum != 0:
        raise RuntimeError("WhiteboxTools D8 flow computation failed")

    with rasterio.open(accum_path) as src:
        accum_arr = src.read(1)

    valid = accum_arr[accum_arr != nodata]
    return {
        "total_cells": int(valid.size),
        "max_accumulation": int(np.max(valid)) if valid.size > 0 else 0,
    }


def run() -> None:
    """Execute P4: flow direction and accumulation."""
    cfg = load_config()
    nodata = cfg["grid"]["nodata"]
    interim = PROJECT_ROOT / cfg["paths"]["interim"]

    stats = compute_flow(
        dem_path=interim / "dem_cond.tif",
        fdir_path=interim / "fdir_d8.tif",
        accum_path=interim / "accum.tif",
        nodata=nodata,
    )
    print(f"P4 complete: {stats['total_cells']} cells, max accum = {stats['max_accumulation']}")


if __name__ == "__main__":
    run()
