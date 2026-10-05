# DATA_SOURCES: Ghost Drains

Tags: `[V]` verified, `[U]` unverified.

**Rule:** no dataset is used unless it has an entry in `data/manifest.json`. Never fabricate coordinates, rainfall values or drain geometry.

## 1. Dataset register

| ID | Dataset | Use | Format / access | License / terms | Status |
|----|---------|-----|-----------------|-----------------|--------|
| DS-01 | Copernicus DEM GLO-30 | Primary DEM (surface model) | Cloud-Optimized GeoTIFF; `aws s3 ls --no-sign-request s3://copernicus-dem-30m/` `[V]` https://registry.opendata.aws/copernicus-dem/ | Free for the public under the Copernicus licence; attribution if adapted `[V]` https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM | Verified |
| DS-02 | FABDEM v1-x | Bare-earth DEM candidate | GeoTIFF tiles; also in Earth Engine community catalog `[V]` https://gee-community-catalog.org/projects/fabdem/ | CC BY-NC-SA 4.0 (non-commercial, share-alike) `[V]` | Download location and current version to confirm `[U]` |
| DS-03 | Bengaluru Stormwater Drains Maps (primary, secondary, tertiary, combined, 2022) | Official drain overlay + gap view | KML; source listed as KSRSAC; hosted on OpenCity `[V]` https://data.opencity.in/dataset/bengaluru-stormwater-drains-maps | Portal labels it "Other (Public Domain)" `[V]`; confirm original publisher terms `[U]` | Inspect geometry quality first |
| DS-04 | Zone-wise SWD maps (PDF) | Visual cross-check only | PDF on OpenCity (source microdata.gov.in) `[V]` | Public Domain label `[V]` | Not machine-readable |
| DS-05 | OpenStreetMap | Lakes (natural=water), waterways, roads, buildings | Overpass API or a regional extract `[U]` | ODbL; credit "OpenStreetMap contributors" `[V]` https://www.maptiler.com/copyright | Tag coverage in Bengaluru unknown `[U]` |
| DS-06 | OpenFreeMap vector tiles | Basemap | Keyless tiles `[V]` https://github.com/tbodt/openfreemap | Credit OpenFreeMap, OpenMapTiles, OSM data `[V]` | Verified |
| DS-07 | Protomaps PMTiles | Offline basemap extract | `pmtiles extract <planet.pmtiles> out.pmtiles --bbox=... --maxzoom=...` `[V]` https://www.antoniogioia.com/protomaps-open-source-single-file-maps | Same as OSM data | Verified |
| DS-08 | Mapterhorn terrain tiles | Quick terrain spike only | PMTiles, Terrarium WebP, 512 px; global base is Copernicus GLO-30 up to z12 `[V]` https://dev.to/mierune/building-a-3d-map-application-using-mapterhorn-terrain-data-elo | Attribution page https://mapterhorn.com/attribution `[V]` | Verified |
| DS-09 | EOX Sentinel-2 cloudless | Satellite drape | WMTS/WMS; about 10 m `[V]` https://cloudless.eox.at/pricing | Non-commercial for 2018-2025 data (CC BY-NC-SA 4.0), attribution required `[V]` | Use year-specific attribution text |
| DS-10 | Reported flood sites, 4-6 Sept 2022 | Validation | Compiled by hand from sources below | Facts only; cite each source | See section 3 |
| DS-11 | Google Map Tiles (optional) | Hero shot only | API key; policies apply `[V]` https://developers.google.com/maps/documentation/tile/policies | Visualization only; attribution; caching rules | Bengaluru 3D coverage unverified `[U]` |

## 2. Rainfall values: sources disagree

Do not quote a single number without source and time window.

| Reported value | Source | Note |
|----------------|--------|------|
| 100-143 mm in some zones (Mahadevapura, East, Rajarajeshwari) | MHA situation report via ReliefWeb `[V]` https://reliefweb.int/report/india/ministry-home-affairs-disaster-management-division-national-emergency-response-centre-situation-report-regarding-flood-heavy-rainfall-country-06092022-1800-hrs | Government |
| 131 mm for the city overnight (IMD); KSNDMC station values such as 125-129 mm at some stations by early morning | https://www.thenewsminute.com/article/bengaluru-flooded-again-after-rains-marathahalli-orr-under-water-167535 `[V]` | News citing IMD/KSNDMC |
| Bellandur 67.5 mm, Hallenayakanahalli 74 mm, Varthur 83.5 mm over 24 h (KSNDMC) | https://www.thenewsminute.com/article/videos-bengaluru-citizens-push-buses-taxis-out-inundated-roads-167564 `[V]` | Different window |
| 21.21 mm for "Bengaluru Urban" night of 4 Sept (KSNDMC) | https://www.thequint.com/climate-change/rains-in-bengaluru-continue-to-wreak-havoc-three-lakes-overflow-into-homes `[V]` | Likely different averaging |

The replay's rain slider is user-driven. If a preset scenario is offered, label it "scenario inspired by reported rainfall of X mm (source)", never "Sept 2022 simulation".

## 3. Validation sites (candidates, not coordinates)

Reported as flooded or affected in Sept 2022 (names only; **geocode them yourself from OSM and store the source URL for each**):
- Bellandur lake overflow; ORR near Ecospace; Sarjapur Road near Rainbow Drive; Whitefield Main Road; Yemalur Main Road; Borewell Road; Balagere Main Road. `[V]` https://www.thenewsminute.com/article/bengaluru-flooded-after-rains-traffic-advisory-issued-people-asked-stay-home-167536
- Varthur, Marathahalli, HSR Layout, Silk Board and others. `[V]` https://www.thenewsminute.com/article/bengaluru-flooded-again-after-rains-marathahalli-orr-under-water-167535
- Halanayakanahalli lake breach (Mahadevapura zone). `[V]` MHA report URL above.

Selection bias warning: news mostly reports roads and apartments, not all flooding. Treat as a partial sample.

## 4. `data/manifest.json` format

```json
{
  "datasets": [
    {
      "id": "DS-01",
      "name": "Copernicus GLO-30 tiles covering bbox",
      "url": "s3://copernicus-dem-30m/...",
      "retrieved_at": "ISO-8601",
      "license": "see DATA_SOURCES.md",
      "attribution": "exact required text",
      "sha256": "...",
      "crs": "EPSG:4326",
      "resolution": "1 arc-second (~30 m)",
      "bbox": [lonmin, latmin, lonmax, latmax],
      "processing": ["p02_clip", "p02_reproject"],
      "notes": ""
    }
  ]
}
```

Pipeline refuses to run if a file's checksum differs from the manifest.

## 5. Bengaluru lake data

Not yet sourced. Start with OSM `natural=water` polygons, report how many named lakes are present, and compare against a published list before claiming completeness `[U]`. Historical lake extent (for a "lost water" slider) needs a citable dataset; if none is found and verified, drop feature F-12.

## 6. Known data warnings

- The official SWD KML may mix geometry types or scales; inspect before use `[U]`.
- Bengaluru's drain records are reported as incomplete `[V]` https://citizenmatters.in/cag-report-stormwater-drains-master-plan-encroachment/ , so "no mapped drain" does not prove "no drain".
- Satellite imagery date varies by location and layer year; show the year used.
