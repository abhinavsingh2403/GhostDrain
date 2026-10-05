"""Build the verified Sept 2022 reported flood sites GeoJSON layer.

Every site is geocoded from OpenStreetMap with a primary source URL.
Selection bias: news mostly reports roads and apartments, not all flooding.
Source: docs/DATA_SOURCES.md section 3, docs/HONESTY_AND_LIMITATIONS.md.
"""
from __future__ import annotations

import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent

# Geocoded from OSM Nominatim with primary sources
SITES_DATA = [
    {
        "id": "FS-01",
        "name": "Bellandur Lake Overflow",
        "locality": "Bellandur",
        "coordinates": [77.67202, 12.93714],
        "date": "2022-09-05",
        "source_publisher": "The Quint",
        "source_url": "https://www.thequint.com/south-india/rains-in-bengaluru-continue-to-wreak-havoc-three-lakes-overflow-into-homes",
        "notes": "Lake overflow into surrounding roads and apartments",
    },
    {
        "id": "FS-02",
        "name": "Outer Ring Road near Ecospace",
        "locality": "Bellandur / ORR",
        "coordinates": [77.68117, 12.92803],
        "date": "2022-09-05",
        "source_publisher": "The News Minute",
        "source_url": "https://www.thenewsminute.com/article/bengaluru-flooded-again-after-rains-marathahalli-orr-under-water-167535",
        "notes": "Severe waterlogging on tech corridor arterial road",
    },
    {
        "id": "FS-03",
        "name": "Rainbow Drive Layout",
        "locality": "Sarjapur Road",
        "coordinates": [77.68683, 12.90622],
        "date": "2022-09-05",
        "source_publisher": "Citizen Matters",
        "source_url": "https://citizenmatters.in/rainbow-drive-layout-or-lake-bengaluru-flood-prone-neighbourhoods/",
        "notes": "Inundated valley layout requiring boat and tractor evacuation",
    },
    {
        "id": "FS-04",
        "name": "Whitefield Main Road",
        "locality": "Whitefield",
        "coordinates": [77.74884, 12.96551],
        "date": "2022-09-05",
        "source_publisher": "The Hindu",
        "source_url": "https://www.thehindu.com/news/national/karnataka/bengaluru-rains-mahadevapura-zone-severely-affected-by-flooding-says-bbmp-chief-commissioner/article65856481.ece",
        "notes": "Arterial road inundation impacting commute in Mahadevapura zone",
    },
    {
        "id": "FS-05",
        "name": "Yemalur Main Road",
        "locality": "Yemalur",
        "coordinates": [77.68055, 12.94546],
        "date": "2022-09-05",
        "source_publisher": "Down To Earth",
        "source_url": "https://www.downtoearth.org.in/climate-change/bengaluru-floods-city-s-stormwater-drains-are-not-good-enough-government-has-known-it-for-long-84800",
        "notes": "Waterlogging near Bellandur lake backwaters and natural catchment",
    },
    {
        "id": "FS-06",
        "name": "Central Silk Board Junction",
        "locality": "Silk Board / BTM",
        "coordinates": [77.62237, 12.91682],
        "date": "2022-09-05",
        "source_publisher": "The Indian Express",
        "source_url": "https://indianexpress.com/article/cities/bangalore/bengaluru-rain-halt-floods-waterlogging-sarjapur-koramangala-madiwala-8137227/",
        "notes": "Major transport junction and surrounding arterial roadways inundated",
    },
    {
        "id": "FS-07",
        "name": "Marathahalli ORR",
        "locality": "Marathahalli",
        "coordinates": [77.69842, 12.95526],
        "date": "2022-09-05",
        "source_publisher": "The News Minute",
        "source_url": "https://www.thenewsminute.com/article/bengaluru-flooded-again-after-rains-marathahalli-orr-under-water-167535",
        "notes": "Outer Ring Road subways and service lanes submerged",
    },
    {
        "id": "FS-08",
        "name": "Varthur Lake Inundation Area",
        "locality": "Varthur",
        "coordinates": [77.73926, 12.94835],
        "date": "2022-09-05",
        "source_publisher": "The Quint",
        "source_url": "https://www.thequint.com/south-india/rains-in-bengaluru-continue-to-wreak-havoc-three-lakes-overflow-into-homes",
        "notes": "Downstream lake basin waterlogging and residential overflow",
    },
    {
        "id": "FS-09",
        "name": "Halanayakanahalli Lake Breach Area",
        "locality": "Mahadevapura Zone",
        "coordinates": [77.69203, 12.89893],
        "date": "2022-09-05",
        "source_publisher": "ReliefWeb / UN OCHA (MHA Report)",
        "source_url": "https://reliefweb.int/report/india/ministry-home-affairs-disaster-management-division-national-emergency-response-centre-situation-report-regarding-flood-heavy-rainfall-country-06092022-1800-hrs",
        "notes": "Official Ministry of Home Affairs flood situation report record",
    },
    {
        "id": "FS-10",
        "name": "Borewell Road",
        "locality": "Whitefield",
        "coordinates": [77.73799, 12.96919],
        "date": "2022-09-05",
        "source_publisher": "The Hindu",
        "source_url": "https://www.thehindu.com/news/national/karnataka/bengaluru-rains-mahadevapura-zone-severely-affected-by-flooding-says-bbmp-chief-commissioner/article65856481.ece",
        "notes": "Traffic advisory issued due to road inundation in IT zone",
    },
    {
        "id": "FS-11",
        "name": "Balagere Main Road",
        "locality": "Balagere / Varthur",
        "coordinates": [77.73894, 12.93925],
        "date": "2022-09-05",
        "source_publisher": "The Times of India",
        "source_url": "https://timesofindia.indiatimes.com/city/bengaluru/75-areas-hit-third-heaviest-rainfall-in-september-in-bengaluru-in-75-years/articleshow/94013558.cms",
        "notes": "Connecting road between Panathur and Varthur heavily waterlogged",
    },
    {
        "id": "FS-12",
        "name": "HSR Layout Sector 6 & 7",
        "locality": "HSR Layout",
        "coordinates": [77.63886, 12.91162],
        "date": "2022-09-05",
        "source_publisher": "The Indian Express",
        "source_url": "https://indianexpress.com/article/cities/bangalore/bengaluru-rain-halt-floods-waterlogging-sarjapur-koramangala-madiwala-8137227/",
        "notes": "Low-lying residential sectors inundated following stormwater drain surcharge",
    },
]


def build_geojson() -> dict:
    features = []
    for site in SITES_DATA:
        feature = {
            "type": "Feature",
            "id": site["id"],
            "geometry": {
                "type": "Point",
                "coordinates": site["coordinates"],
            },
            "properties": {
                "id": site["id"],
                "name": site["name"],
                "locality": site["locality"],
                "date": site["date"],
                "source_publisher": site["source_publisher"],
                "source_url": site["source_url"],
                "notes": site["notes"],
            },
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "name": "reported_flood_sites_sept_2022",
        "crs": {
            "type": "name",
            "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"},
        },
        "description": "Reported flood-affected locations in Bengaluru, 4-6 Sept 2022. Sourced and geocoded from OSM.",
        "features": features,
    }


def main() -> None:
    geojson_data = build_geojson()

    for out_dir in [PROJECT_ROOT / "data" / "processed", PROJECT_ROOT / "web" / "public" / "data"]:
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / "flood_sites.geojson"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(geojson_data, f, indent=2)
        print(f"Wrote {len(geojson_data['features'])} sites to {out_path}")


if __name__ == "__main__":
    main()
