"""L3: Data integrity checks.

Verify manifest structure and dataset entries.
See docs/TESTING_VALIDATION.md section 4.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).parent.parent.parent
MANIFEST_PATH = PROJECT_ROOT / "data" / "manifest.json"


class TestManifest:
    """Manifest structure and content validation."""

    @pytest.fixture(autouse=True)
    def load_manifest(self) -> None:
        """Load manifest.json before each test."""
        if not MANIFEST_PATH.exists():
            pytest.skip("manifest.json not found")
        with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
            self.manifest = json.load(f)

    def test_has_datasets_key(self) -> None:
        """Manifest contains a 'datasets' list."""
        assert "datasets" in self.manifest
        assert isinstance(self.manifest["datasets"], list)

    def test_each_dataset_has_required_fields(self) -> None:
        """Every dataset entry has id, name, license, attribution."""
        required = ["id", "name", "license", "attribution"]
        for ds in self.manifest["datasets"]:
            for field in required:
                assert field in ds, f"Dataset {ds.get('id', '?')} missing {field}"

    def test_no_duplicate_ids(self) -> None:
        """No duplicate dataset IDs."""
        ids = [ds["id"] for ds in self.manifest["datasets"]]
        assert len(ids) == len(set(ids)), f"Duplicate IDs: {ids}"

    def test_known_datasets_present(self) -> None:
        """Critical datasets DS-01, DS-03, DS-09 exist."""
        ids = {ds["id"] for ds in self.manifest["datasets"]}
        for required_id in ["DS-01", "DS-03", "DS-09"]:
            assert required_id in ids, f"{required_id} missing from manifest"


class TestFloodSitesGeoJSON:
    """Validation ground truth dataset checks."""

    FLOOD_SITES_PATH = PROJECT_ROOT / "data" / "processed" / "flood_sites.geojson"
    BBOX = [77.45, 12.85, 77.75, 13.10]

    @pytest.fixture(autouse=True)
    def load_geojson(self) -> None:
        """Load flood_sites.geojson."""
        if not self.FLOOD_SITES_PATH.exists():
            pytest.skip("flood_sites.geojson not found")
        with open(self.FLOOD_SITES_PATH, "r", encoding="utf-8") as f:
            self.data = json.load(f)

    def test_is_feature_collection(self) -> None:
        """Root structure is FeatureCollection with features list."""
        assert self.data.get("type") == "FeatureCollection"
        assert len(self.data.get("features", [])) >= 9

    def test_all_points_valid_and_within_bounds(self) -> None:
        """Points have [lon, lat] within Bengaluru study bounds."""
        for feat in self.data["features"]:
            geom = feat.get("geometry", {})
            assert geom.get("type") == "Point"
            coords = geom.get("coordinates")
            assert isinstance(coords, list) and len(coords) == 2
            lon, lat = coords
            # Axis order check: lon ~ 77.6, lat ~ 12.9
            assert 77.4 <= lon <= 77.8, f"Lon out of bounds: {lon} in {feat['properties']['name']}"
            assert 12.8 <= lat <= 13.15, f"Lat out of bounds: {lat} in {feat['properties']['name']}"

    def test_every_feature_has_citable_source_url(self) -> None:
        """Every feature must have a real source URL."""
        for feat in self.data["features"]:
            props = feat.get("properties", {})
            url = props.get("source_url")
            assert url is not None, f"Missing source_url in {props.get('name')}"
            assert url.startswith("http"), f"Invalid source_url: {url}"

    def test_no_duplicate_site_ids(self) -> None:
        """Each flood site has a unique ID."""
        ids = [f["id"] for f in self.data["features"]]
        assert len(ids) == len(set(ids))

