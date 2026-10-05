"""Fetch real Bengaluru waterways and lakes from OpenStreetMap Overpass API (DS-05)."""
from __future__ import annotations

import json
import urllib.request
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
PUBLIC_DIR = PROJECT_ROOT / "web" / "public" / "data"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

BBOX = "12.85,77.45,13.10,77.75"

# Query waterways (streams, canals, drains, rajakaluves)
OVERPASS_QUERY = f"""
[out:json][timeout:35];
(
  way["waterway"~"stream|drain|canal|river"]({BBOX});
  way["natural"="water"]({BBOX});
  relation["natural"="water"]({BBOX});
);
out geom;
"""

def main():
    print("Querying Overpass API for Bengaluru waterways and lakes...")
    url = "https://overpass-api.de/api/interpreter"
    req = urllib.request.Request(url, data=OVERPASS_QUERY.encode("utf-8"), headers={"User-Agent": "GhostDrainsResearch/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=40) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Overpass API error: {e}")
        return

    elements = data.get("elements", [])
    print(f"Retrieved {len(elements)} elements from OSM.")

    waterways_features = []
    lakes_features = []

    for el in elements:
        tags = el.get("tags", {})
        geometry = el.get("geometry", [])
        if not geometry:
            continue

        coords = [[pt["lon"], pt["lat"]] for pt in geometry if "lon" in pt and "lat" in pt]
        if len(coords) < 2:
            continue

        if tags.get("waterway"):
            name = tags.get("name", tags.get("waterway", "Unnamed drain"))
            waterways_features.append({
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": coords
                },
                "properties": {
                    "name": name,
                    "waterway": tags.get("waterway"),
                    "drain_class": "primary" if tags.get("waterway") in ["river", "canal"] else "secondary",
                    "source": "OpenStreetMap contributors"
                }
            })
        elif tags.get("natural") == "water" or tags.get("water"):
            name = tags.get("name", "Lake / Water body")
            # If closed ring
            if coords[0] == coords[-1] and len(coords) >= 4:
                geom_type = "Polygon"
                geom_coords = [coords]
            else:
                geom_type = "LineString"
                geom_coords = coords

            lakes_features.append({
                "type": "Feature",
                "geometry": {
                    "type": geom_type,
                    "coordinates": geom_coords
                },
                "properties": {
                    "name": name,
                    "type": "water_body",
                    "source": "OpenStreetMap contributors"
                }
            })

    print(f"Extracted {len(waterways_features)} waterway line features.")
    print(f"Extracted {len(lakes_features)} lake features.")

    # Save waterways as official_swd.geojson and ghost_drains.geojson
    if waterways_features:
        fc_waterways = {
            "type": "FeatureCollection",
            "features": waterways_features
        }
        for out_dir in [PROCESSED_DIR, PUBLIC_DIR]:
            with open(out_dir / "official_swd.geojson", "w", encoding="utf-8") as f:
                json.dump(fc_waterways, f)
            with open(out_dir / "ghost_drains.geojson", "w", encoding="utf-8") as f:
                json.dump(fc_waterways, f)
        print("Wrote official_swd.geojson and ghost_drains.geojson")

    if lakes_features:
        fc_lakes = {
            "type": "FeatureCollection",
            "features": lakes_features
        }
        for out_dir in [PROCESSED_DIR, PUBLIC_DIR]:
            with open(out_dir / "lakes.geojson", "w", encoding="utf-8") as f:
                json.dump(fc_lakes, f)
        print("Wrote lakes.geojson")

if __name__ == "__main__":
    main()
