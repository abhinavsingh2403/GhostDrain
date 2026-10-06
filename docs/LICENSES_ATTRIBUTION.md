# LICENSES_ATTRIBUTION: Ghost Drains

Tags: `[V]` verified, `[U]` unverified. This is not legal advice. Re-read each license yourself before publishing.

## 1. Project stance

The project is **non-commercial and educational** by design. Several data licenses below forbid commercial use or require share-alike. If the project ever becomes commercial, re-audit everything.

## 2. Data

| Data | License / terms | Obligations | Source |
|------|-----------------|-------------|--------|
| Copernicus GLO-30 | Free and open for the public; attribution notice if adapted `[V]` | When adapted, state it was "produced using Copernicus WorldDEM-30" with the DLR/Airbus credit (use the exact current text from the official licence) | https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM |
| FABDEM | CC BY-NC-SA 4.0 `[V]` | Credit; non-commercial only; **derivatives must be shared under the same license**; also carries the Copernicus WorldDEM-30 notice | https://gee-community-catalog.org/projects/fabdem/ |
| EOX Sentinel-2 cloudless | Non-commercial for 2018-2025 data (CC BY-NC-SA 4.0); CC BY 4.0 for 2016 `[V]` | Attribution with the layer-year-specific text from EOX; non-commercial | https://cloudless.eox.at/pricing |
| OpenStreetMap | ODbL `[V]` | Credit "OpenStreetMap contributors"; share-alike on derived databases | https://www.maptiler.com/copyright |
| OpenFreeMap tiles | Public instance free; credit suggested `[V]` | "OpenFreeMap, OpenMapTiles, data from OpenStreetMap" (OpenMapTiles credit required by its license per MapTiler's notice) | https://github.com/tbodt/openfreemap |
| Mapterhorn terrain tiles | Data from various open sources; see attribution page `[V]` | Link "(c) Mapterhorn" to https://mapterhorn.com/attribution | https://dev.to/mierune/building-a-3d-map-application-using-mapterhorn-terrain-data-elo |
| OpenCity Bengaluru SWD maps | Portal label "Other (Public Domain)"; source KSRSAC `[V]` | Credit OpenCity.in and source; confirm original publisher terms `[U]` | https://data.opencity.in/dataset/bengaluru-stormwater-drains-maps |
| Google Map Tiles (optional) | Agreement-bound; visualization-only `[V]` | Google logo bottom-left, attribution bottom-right, never obscured; no non-visualization use; respect caching headers; promo videos marked "for promotional purposes only" | https://developers.google.com/maps/documentation/tile/policies |

## 3. Consequences to remember

1. **FABDEM share-alike:** any raster or tiles derived from FABDEM must be released under CC BY-NC-SA 4.0 if distributed. Publishing a derived terrain tileset publishes it under that license.
2. **Non-commercial:** no ads, no paid access, no selling the app while FABDEM or EOX imagery is in use.
3. **OSM share-alike:** if you publish a derived database (for example a processed lakes layer), it falls under ODbL.
4. **Google data stays visual:** do not extract, analyse or cache beyond the stated policy.

## 4. Code licenses to confirm `[V]`

| Package | License | Notes |
|---------|---------|-------|
| MapLibre GL JS | BSD-3-Clause `[V]` | Client map rendering engine (v6.12.0) |
| PMTiles | BSD-3-Clause `[V]` | Cloud-optimized tile reader (v4.5.0) |
| OpenFreeMap | MIT `[V]` | Vector tiles stylesheet & basemap endpoint |
| Mapterhorn code | BSD-3-Clause `[V]` | Terrain DEM encoding and tile provider |
| pysheds | GNU GPLv3 `[V]` | Offline pipeline hydrology routing (v0.5) |
| WhiteboxTools | MIT `[V]` | Priority-Flood conditioning engine (v2.3.6) |
| rasterio | BSD-3-Clause `[V]` | GDAL Python bindings (v1.5.2) |
| pyproj | MIT `[V]` | PROJ Python interface (v3.8.0) |
| geopandas / shapely | BSD-3-Clause `[V]` | Vector analysis & STRtree indexing |
| Mei et al. (2007) snippet | Academic Citation `[V]` | Virtual-pipe shallow water equations transcribed with citations |

## 5. Attribution text checklist (visible in the app)

- [x] OpenStreetMap contributors
- [x] OpenFreeMap / OpenMapTiles
- [x] Copernicus WorldDEM-30 notice (DLR e.V. 2010–2014 & Airbus 2014–2018)
- [x] EOX Sentinel-2 cloudless (2021)
- [x] Mapterhorn (attribution link)
- [x] OpenCity.in / KSRSAC (SWD maps, 2022 edition)
- [x] Data dates (SWD 2022; imagery year 2021)
- [x] Primary source citations for Sept 2022 flood impact ground truth
