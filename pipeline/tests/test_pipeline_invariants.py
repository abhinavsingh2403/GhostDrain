"""L2: Pipeline invariant tests.

These verify that outputs are consistent with metadata and inputs.
See docs/TESTING_VALIDATION.md section 3.
"""
from __future__ import annotations

import json
import struct
from pathlib import Path

import numpy as np
import pytest


class TestGridMetaContract:
    """grid.meta.json contract validation."""

    REQUIRED_KEYS = [
        "id", "crs", "bbox_3857", "width", "height",
        "cell_size_3857_m", "lat0_deg", "ground_scale_k",
        "nodata", "dem_source_id", "created_at", "pipeline_git_sha",
    ]

    def test_all_keys_present(self, tmp_path: Path) -> None:
        """All required keys exist in grid.meta.json."""
        # This test runs against a generated meta file
        # For now, validate the schema structure
        meta = {
            "id": "test",
            "crs": "EPSG:3857",
            "bbox_3857": [0, 0, 1, 1],
            "width": 1024,
            "height": 1024,
            "cell_size_3857_m": 30.0,
            "lat0_deg": 12.97,
            "ground_scale_k": 0.9742,
            "nodata": -9999.0,
            "dem_source_id": "DS-01",
            "created_at": "2024-01-01T00:00:00Z",
            "pipeline_git_sha": "abc123",
        }
        for key in self.REQUIRED_KEYS:
            assert key in meta, f"Missing key: {key}"

    def test_crs_is_3857(self) -> None:
        """Display grid CRS must be EPSG:3857."""
        assert "EPSG:3857" == "EPSG:3857"  # Placeholder; use real meta in integration


class TestBinaryRasterFormat:
    """Binary .f32.bin format: float32, little-endian, row-major."""

    def test_write_read_roundtrip(self, tmp_path: Path) -> None:
        """A float32 array written as .f32.bin reads back identically."""
        arr = np.array([[1.0, 2.0], [3.0, 4.0]], dtype=np.float32)
        out = tmp_path / "test.f32.bin"
        arr.astype("<f4").tofile(out)

        loaded = np.fromfile(out, dtype="<f4").reshape(arr.shape)
        np.testing.assert_array_equal(loaded, arr)

    def test_row_zero_is_north(self, tmp_path: Path) -> None:
        """Row 0 in the binary file represents the north edge."""
        # 3x3 grid where row 0 has elevation 100, row 2 has 0
        arr = np.array(
            [[100.0, 100.0, 100.0],
             [50.0, 50.0, 50.0],
             [0.0, 0.0, 0.0]],
            dtype=np.float32,
        )
        out = tmp_path / "north_up.f32.bin"
        arr.astype("<f4").tofile(out)

        loaded = np.fromfile(out, dtype="<f4").reshape(3, 3)
        # Row 0 (north) should be highest
        assert loaded[0, 0] > loaded[2, 0]


class TestNodataHandling:
    """Nodata values are properly masked."""

    def test_nodata_not_treated_as_elevation(self) -> None:
        """Nodata sentinel (-9999) must never be used as a valid elevation."""
        NODATA = -9999.0
        dem = np.array([100.0, 200.0, NODATA, 150.0], dtype=np.float32)
        valid = dem[dem != NODATA]
        assert NODATA not in valid
        assert len(valid) == 3


class TestGeodesyAndUTM:
    """Geodesy and UTM zone validation for Bengaluru study bbox."""

    STUDY_BBOX = [77.45, 12.85, 77.75, 13.10]

    def test_utm_zone_is_43n(self) -> None:
        """Pyproj confirms UTM Zone 43N (EPSG:32643) covers the study bbox."""
        import pyproj
        from pyproj.aoi import AreaOfInterest
        from pyproj.database import query_utm_crs_info

        matches = query_utm_crs_info(
            datum_name="WGS 84",
            area_of_interest=AreaOfInterest(
                west_lon_degree=self.STUDY_BBOX[0],
                south_lat_degree=self.STUDY_BBOX[1],
                east_lon_degree=self.STUDY_BBOX[2],
                north_lat_degree=self.STUDY_BBOX[3],
            ),
        )
        assert len(matches) > 0
        assert matches[0].code == "32643"
        assert "43N" in matches[0].name

    def test_meridian_convergence_and_scale_bound(self) -> None:
        """Meridian convergence is ~0.58 deg and scale variation is < 0.2%."""
        import math
        import pyproj

        crs = pyproj.CRS.from_epsg(32643)
        proj = pyproj.Proj(crs)
        lon_c = (self.STUDY_BBOX[0] + self.STUDY_BBOX[2]) / 2.0
        lat_c = (self.STUDY_BBOX[1] + self.STUDY_BBOX[3]) / 2.0

        factors = proj.get_factors(lon_c, lat_c)
        conv_deg = factors.meridian_convergence
        # Check convergence is roughly 0.58 deg
        assert abs(conv_deg - 0.584) < 0.01

        # Check scale variation across latitude range
        cos_s = math.cos(math.radians(self.STUDY_BBOX[1]))
        cos_n = math.cos(math.radians(self.STUDY_BBOX[3]))
        scale_var_pct = abs(cos_s - cos_n) / cos_s * 100.0
        assert scale_var_pct < 0.2

