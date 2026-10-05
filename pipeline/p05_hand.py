"""P5: Compute Height Above Nearest Drainage (HAND).

Input:  data/interim/dem_cond.tif, fdir_d8.tif, accum.tif
Output: data/interim/hand.tif

HAND = elevation of cell minus elevation of the drainage cell it flows to,
following the flow path downstream. A susceptibility index, NOT flood depth.
See docs/HYDROLOGY_SPEC.md section 6.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import rasterio
import whitebox

from .config_loader import load_config, require

PROJECT_ROOT = Path(__file__).parent.parent


def compute_hand(
    dem_path: Path,
    fdir_path: Path,
    accum_path: Path,
    hand_path: Path,
    stream_threshold: int,
    nodata: float = -9999.0,
) -> dict[str, float]:
    """Compute HAND raster.

    Args:
        dem_path: Conditioned DEM.
        fdir_path: D8 flow direction raster.
        accum_path: Flow accumulation raster.
        hand_path: Output HAND raster path.
        stream_threshold: Accumulation threshold defining stream cells.
        nodata: Nodata sentinel.

    Returns:
        Dict with max_hand_m and mean_hand_m.
    """
    hand_path.parent.mkdir(parents=True, exist_ok=True)
    wbt = whitebox.WhiteboxTools()
    wbt.set_verbose_mode(False)

    dem_abs = str(dem_path.resolve())
    accum_abs = str(accum_path.resolve())
    streams_path = hand_path.parent / "_temp_streams.tif"
    streams_abs = str(streams_path.resolve())
    hand_abs = str(hand_path.resolve())

    # Extract streams from flow accumulation threshold
    ret_streams = wbt.extract_streams(accum_abs, streams_abs, float(stream_threshold))
    # Compute elevation above stream (HAND)
    ret_hand = wbt.elevation_above_stream(dem_abs, streams_abs, hand_abs)

    if ret_streams != 0 or ret_hand != 0:
        raise RuntimeError("WhiteboxTools HAND computation failed")

    # Clean up temp streams
    if streams_path.exists():
        streams_path.unlink()

    with rasterio.open(hand_path) as src:
        hand_arr = src.read(1)

    valid = hand_arr[(hand_arr != nodata) & np.isfinite(hand_arr)]
    return {
        "max_hand_m": float(np.max(valid)) if valid.size > 0 else 0.0,
        "mean_hand_m": float(np.mean(valid)) if valid.size > 0 else 0.0,
    }


def run() -> None:
    """Execute P5: HAND computation."""
    cfg = load_config()
    nodata = cfg["grid"]["nodata"]
    threshold = require(cfg, "hydrology", "accumulation_threshold")
    interim = PROJECT_ROOT / cfg["paths"]["interim"]

    stats = compute_hand(
        dem_path=interim / "dem_cond.tif",
        fdir_path=interim / "fdir_d8.tif",
        accum_path=interim / "accum.tif",
        hand_path=interim / "hand.tif",
        stream_threshold=threshold,
        nodata=nodata,
    )
    print(f"P5 complete: max HAND = {stats['max_hand_m']:.1f} m, mean = {stats['mean_hand_m']:.1f} m")


if __name__ == "__main__":
    run()
