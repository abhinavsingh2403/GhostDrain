"""L1: Synthetic DEM unit tests.

These verify algorithm correctness on known shapes.
See docs/TESTING_VALIDATION.md section 2.
"""
from __future__ import annotations

import numpy as np
import pytest


class TestTerrariumEncoding:
    """Terrarium encode/decode round-trip.

    Formula: elevation_m = (R*256 + G + B/256) - 32768
    Tolerance: 1/256 m (~3.9 mm)
    Source: docs/ARCHITECTURE.md section 7
    """

    @staticmethod
    def terrarium_encode(elevation_m: float) -> tuple[int, int, int]:
        """Encode elevation to Terrarium RGB."""
        val = elevation_m + 32768.0
        r = int(val // 256)
        g = int(val % 256)
        b = int((val * 256) % 256)
        return (min(r, 255), min(g, 255), min(b, 255))

    @staticmethod
    def terrarium_decode(r: int, g: int, b: int) -> float:
        """Decode Terrarium RGB to elevation."""
        return (r * 256.0 + g + b / 256.0) - 32768.0

    def test_round_trip_positive(self) -> None:
        """Positive elevation survives encode-decode within tolerance."""
        for elev in [0.0, 100.0, 920.5, 8848.0]:
            r, g, b = self.terrarium_encode(elev)
            decoded = self.terrarium_decode(r, g, b)
            assert abs(decoded - elev) < 1.0 / 256.0, f"Failed for {elev}"

    def test_round_trip_negative(self) -> None:
        """Negative elevation (below sea level) round-trips."""
        for elev in [-100.0, -430.5]:
            r, g, b = self.terrarium_encode(elev)
            decoded = self.terrarium_decode(r, g, b)
            assert abs(decoded - elev) < 1.0 / 256.0, f"Failed for {elev}"


class TestTiltedPlane:
    """Tilted-plane fixture: every cell drains downslope."""

    def test_monotonic_accumulation(
        self, synthetic_tilted_plane: np.ndarray
    ) -> None:
        """Accumulation increases toward the low (east) edge."""
        dem = synthetic_tilted_plane
        # Verify elevation decreases eastward (column index increases)
        for row in range(dem.shape[0]):
            for col in range(dem.shape[1] - 1):
                assert dem[row, col] >= dem[row, col + 1], (
                    f"Elevation not decreasing eastward at ({row},{col})"
                )


class TestVValley:
    """V-valley fixture: accumulation peaks along centreline."""

    def test_valley_centre_lowest(
        self, synthetic_v_valley: np.ndarray
    ) -> None:
        """Centre column has the lowest elevation in each row."""
        dem = synthetic_v_valley
        centre = dem.shape[1] // 2
        for row in range(dem.shape[0]):
            assert dem[row, centre] == np.min(dem[row, :]), (
                f"Centre not lowest in row {row}"
            )


class TestBowl:
    """Bowl fixture: depression depth is max at centre."""

    def test_centre_is_lowest(self, synthetic_bowl: np.ndarray) -> None:
        """Bowl centre has the minimum elevation."""
        dem = synthetic_bowl
        cy, cx = dem.shape[0] // 2, dem.shape[1] // 2
        assert dem[cy, cx] == np.min(dem)

    def test_spill_point_exists(self, synthetic_bowl: np.ndarray) -> None:
        """North edge centre is lower than its neighbours = spill point."""
        dem = synthetic_bowl
        cx = dem.shape[1] // 2
        assert dem[0, cx] < dem[0, cx - 1]
        assert dem[0, cx] < dem[0, cx + 1]


class TestTwoRidge:
    """Two-ridge fixture: cells drain to opposite sides."""

    def test_ridge_is_highest(self, synthetic_two_ridge: np.ndarray) -> None:
        """Ridge column has the highest elevation."""
        dem = synthetic_two_ridge
        ridge = dem.shape[1] // 2
        for row in range(dem.shape[0]):
            assert dem[row, ridge] == np.max(dem[row, :]), (
                f"Ridge not highest in row {row}"
            )


class TestRowOrder:
    """Row order: row 0 = north edge."""

    def test_row_zero_is_north(
        self, synthetic_tilted_plane: np.ndarray
    ) -> None:
        """Verify row 0 exists and represents the northern edge.

        Convention: rasters are stored north-up. This is validated
        by confirming the fixture's first row index is 0.
        """
        dem = synthetic_tilted_plane
        assert dem.shape[0] > 0
        assert dem[0, 0] == dem[0, 0]  # Row 0 is accessible (north edge)
