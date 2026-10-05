"""Shared test fixtures: synthetic DEMs for L1 testing.

All fixtures are named synthetic_* per TESTING_VALIDATION.md.
No real coordinates or data are used.
"""
from __future__ import annotations

import numpy as np
import pytest


@pytest.fixture
def synthetic_tilted_plane() -> np.ndarray:
    """5x5 plane tilted toward the east (column index = elevation).

    Row 0 = north edge. Elevation increases west-to-east.
    Expected: every cell drains eastward; accumulation increases at east edge.
    """
    rows, cols = 5, 5
    return np.fromfunction(lambda r, c: 100.0 - c * 10.0, (rows, cols), dtype=float).astype(np.float32)


@pytest.fixture
def synthetic_v_valley() -> np.ndarray:
    """11x11 V-shaped valley running north-south through the center.

    Elevation = abs(col - center). Valley floor at col=5.
    Expected: highest accumulation along column 5.
    """
    rows, cols = 11, 11
    center = cols // 2
    elev = np.fromfunction(
        lambda r, c: np.abs(c - center).astype(float) + r * 0.1,
        (rows, cols), dtype=float,
    ).astype(np.float32)
    return elev


@pytest.fixture
def synthetic_bowl() -> np.ndarray:
    """11x11 bowl (closed depression) with one low spill point.

    Center is lowest. North edge (row 0) has a dip at col=5 as the spill.
    Expected: depression depth is max at center; fill produces single outlet.
    """
    rows, cols = 11, 11
    cy, cx = rows // 2, cols // 2
    elev = np.fromfunction(
        lambda r, c: ((r - cy) ** 2 + (c - cx) ** 2).astype(float),
        (rows, cols), dtype=float,
    ).astype(np.float32)
    # Lower the spill point at north edge center
    elev[0, cx] = elev[1, cx] - 0.5
    return elev


@pytest.fixture
def synthetic_two_ridge() -> np.ndarray:
    """11x11 grid with a north-south ridge dividing two watersheds.

    Ridge at col=5 (high). West side drains west, east side drains east.
    Expected: cells on each side drain to different outlets.
    """
    rows, cols = 11, 11
    ridge_col = cols // 2
    elev = np.fromfunction(
        lambda r, c: (ridge_col - np.abs(c - ridge_col).astype(float)) * 10.0,
        (rows, cols), dtype=float,
    ).astype(np.float32)
    return elev
