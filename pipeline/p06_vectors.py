"""P6: Extract ghost drain vectors, convert SWD KML, compute gap analysis.

Input:  data/interim/accum.tif, data/raw/*.kml (SWD), OSM extract
Output: data/processed/ghost_drains.geojson,
        data/processed/official_swd.geojson,
        data/processed/gap.geojson
See docs/HYDROLOGY_SPEC.md section 7 and docs/ARCHITECTURE.md P6.
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd
import geopandas as gpd
import pyogrio
import numpy as np
import rasterio
from rasterio.features import shapes
from shapely.geometry import shape

import whitebox
from shapely import STRtree, union_all

from .config_loader import load_config, require

PROJECT_ROOT = Path(__file__).parent.parent


def extract_ghost_drains(
    accum_path: Path,
    fdir_path: Path,
    threshold: int,
    target_crs: str,
) -> gpd.GeoDataFrame:
    """Vectorize flow accumulation above threshold into ghost drain polylines.

    Uses WhiteboxTools RasterStreamsToVector to produce true stream centerlines
    following the drainage network.

    Args:
        accum_path: Flow accumulation raster.
        fdir_path: D8 flow direction pointer raster.
        threshold: Minimum cell count to qualify as a ghost drain.
        target_crs: CRS string for the output GeoDataFrame.

    Returns:
        GeoDataFrame of ghost drain LineString features.
    """
    interim = accum_path.parent
    streams_path = interim / "_ghost_streams_temp.tif"
    shp_path = interim / "_ghost_streams_temp.shp"

    wbt = whitebox.WhiteboxTools()
    wbt.set_verbose_mode(False)

    wbt.extract_streams(str(accum_path.resolve()), str(streams_path.resolve()), float(threshold))
    ret = wbt.raster_streams_to_vector(
        str(streams_path.resolve()),
        str(fdir_path.resolve()),
        str(shp_path.resolve()),
        esri_pntr=False,
    )

    if ret != 0 or not shp_path.exists():
        # Fallback to rasterio shapes if vectorizer fails
        with rasterio.open(accum_path) as src:
            accum = src.read(1)
            transform = src.transform
            crs = src.crs
        mask = (accum >= threshold).astype(np.uint8)
        geoms = []
        for geom, value in shapes(mask, transform=transform):
            if value == 1:
                s = shape(geom)
                geoms.append(s.boundary if hasattr(s, "boundary") else s)
        gdf = gpd.GeoDataFrame(geometry=geoms, crs=crs)
    else:
        gdf = gpd.read_file(shp_path)
        if gdf.crs is None:
            gdf = gdf.set_crs(target_crs)

    # Clean up temp files
    for ext in [".tif", ".shp", ".shx", ".dbf", ".prj"]:
        p = interim / f"_ghost_streams_temp{ext}"
        if p.exists():
            p.unlink()

    gdf = gdf[gdf.geometry.notna()]
    gdf = gdf[["geometry"]].copy()
    gdf["type"] = "ghost_drain"

    if gdf.crs and str(gdf.crs) != target_crs:
        gdf = gdf.to_crs(target_crs)
    return gdf


def convert_swd_kml(
    kml_paths: list[Path],
    target_crs: str,
) -> gpd.GeoDataFrame:
    """Convert OpenCity SWD KML files to a unified GeoDataFrame.

    Retains only essential columns ('geometry', 'drain_class', 'name') to
    keep memory lean on target devices.

    Args:
        kml_paths: Paths to SWD KML files (primary, secondary, tertiary).
        target_crs: Target CRS for reprojection.

    Returns:
        GeoDataFrame with geometry and drain_class column.
    """
    frames = []
    for kml_path in kml_paths:
        try:
            gdf = pyogrio.read_dataframe(str(kml_path), on_invalid="ignore")
        except Exception:
            gdf = gpd.read_file(str(kml_path))

        gdf = gdf[gdf.geometry.notna()]
        if gdf.empty:
            continue

        # Infer class from filename
        name_stem = kml_path.stem.lower()
        if "primary" in name_stem:
            drain_class = "primary"
        elif "secondary" in name_stem:
            drain_class = "secondary"
        elif "tertiary" in name_stem:
            drain_class = "tertiary"
        else:
            drain_class = "combined"

        name_col = gdf["Name"] if "Name" in gdf.columns else drain_class
        sub = gpd.GeoDataFrame(
            {
                "geometry": gdf.geometry,
                "drain_class": drain_class,
                "name": name_col,
            },
            crs="EPSG:4326",
        )
        frames.append(sub)

    if not frames:
        return gpd.GeoDataFrame(columns=["geometry", "drain_class", "name"], crs=target_crs)

    combined = gpd.GeoDataFrame(pd.concat(frames, ignore_index=True), crs="EPSG:4326")
    if combined.crs and str(combined.crs) != target_crs:
        combined = combined.to_crs(target_crs)
    return combined


def compute_gap(
    ghost: gpd.GeoDataFrame,
    official: gpd.GeoDataFrame,
    buffer_m: float,
) -> gpd.GeoDataFrame:
    """Find ghost drain segments with no official SWD within buffer_m.

    Uses STRtree spatial indexing to buffer only candidate official lines
    near each ghost segment, running in seconds.

    A gap means only: terrain suggests a natural flow path and the
    official map shows no drain within the buffer. See
    docs/HONESTY_AND_LIMITATIONS.md section 6.

    Args:
        ghost: Ghost drain geometries (metric CRS).
        official: Official SWD geometries (metric CRS).
        buffer_m: Buffer distance in metres.

    Returns:
        GeoDataFrame of gap segments.
    """
    if official.empty:
        gap = ghost.copy()
        gap["gap_reason"] = "no_official_data_loaded"
        return gap

    official_geoms = official.geometry.values
    tree = STRtree(official_geoms)

    gap_geoms = []
    for geom in ghost.geometry.values:
        candidate_idxs = tree.query(geom.buffer(buffer_m))
        if len(candidate_idxs) == 0:
            gap_geoms.append(geom)
        else:
            local_buf = union_all([official_geoms[i].buffer(buffer_m) for i in candidate_idxs])
            diff = geom.difference(local_buf)
            if not diff.is_empty and diff.length > 10.0:
                gap_geoms.append(diff)

    if not gap_geoms:
        return gpd.GeoDataFrame(columns=["geometry", "type"], crs=ghost.crs)

    gap_gdf = gpd.GeoDataFrame(geometry=gap_geoms, crs=ghost.crs)
    gap_gdf["type"] = "gap"
    return gap_gdf


def run() -> None:
    """Execute P6: vector extraction and gap analysis."""
    cfg = load_config()
    threshold = require(cfg, "hydrology", "accumulation_threshold")
    buffer_m = require(cfg, "hydrology", "buffer_m")
    analysis_crs = require(cfg, "crs", "analysis")
    interim = PROJECT_ROOT / cfg["paths"]["interim"]
    processed = PROJECT_ROOT / cfg["paths"]["processed"]
    processed.mkdir(parents=True, exist_ok=True)

    # Ghost drains - extract from accumulation and D8 pointer
    display_crs = "EPSG:4326"
    ghost = extract_ghost_drains(
        accum_path=interim / "accum.tif",
        fdir_path=interim / "fdir_d8.tif",
        threshold=threshold,
        target_crs=analysis_crs,
    )
    ghost_wgs84 = ghost.to_crs(display_crs) if not ghost.empty and str(ghost.crs) != display_crs else ghost
    ghost_wgs84.to_file(processed / "ghost_drains.geojson", driver="GeoJSON")
    print(f"P6: {len(ghost)} ghost drain features extracted")

    # Official SWD (if KML files exist)
    raw = PROJECT_ROOT / cfg["paths"]["raw"]
    kml_files = sorted(raw.glob("*.kml")) + sorted(raw.glob("*.KML"))
    official = convert_swd_kml(kml_files, analysis_crs)
    official_wgs84 = official.to_crs(display_crs) if not official.empty and str(official.crs) != display_crs else official
    official_wgs84.to_file(processed / "official_swd.geojson", driver="GeoJSON")
    print(f"P6: {len(official)} official SWD features converted")

    # Gap analysis (computed in metric analysis_crs, then exported in EPSG:4326)
    gap = compute_gap(ghost, official, buffer_m)
    gap_wgs84 = gap.to_crs(display_crs) if not gap.empty and str(gap.crs) != display_crs else gap
    gap_wgs84.to_file(processed / "gap.geojson", driver="GeoJSON")
    print(f"P6: {len(gap)} gap segments identified")


if __name__ == "__main__":
    run()
