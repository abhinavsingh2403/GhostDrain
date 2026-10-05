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

## 4. Code licenses to confirm `[U]`

| Package | License | Notes |
|---------|---------|-------|
| MapLibre GL JS | confirm | |
| deck.gl (if used) | confirm | |
| PMTiles reference implementations | BSD 3-Clause (reported) `[V]` https://github.com/sachaw/PMTiles | |
| OpenFreeMap | MIT (reported) `[V]` | |
| Mapterhorn code | BSD-3 (reported) `[V]` https://mapterhorn.com/ | |
| pysheds | confirm | |
| RichDEM | confirm (check copyleft) | If copyleft, use only as an offline CLI/step |
| WhiteboxTools | confirm | |
| rasterio / GDAL / pyproj / geopandas | confirm | |
| Any copied snippet | record origin and license | |

## 5. Attribution text checklist (visible in the app)

- [ ] OpenStreetMap contributors
- [ ] OpenFreeMap / OpenMapTiles
- [ ] Copernicus WorldDEM-30 notice (and FABDEM credit if used)
- [ ] EOX Sentinel-2 cloudless (year-specific text)
- [ ] Mapterhorn (if used)
- [ ] OpenCity.in / KSRSAC (SWD maps)
- [ ] Google logo and attribution (only if Google tiles used)
- [ ] Data dates (SWD 2022; imagery year)
