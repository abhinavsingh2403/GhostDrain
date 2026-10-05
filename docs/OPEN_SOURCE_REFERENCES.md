# OPEN_SOURCE_REFERENCES: Ghost Drains

Tags: `[V]` verified to exist at the URL (from search), `[U]` license or details unverified.

**Rules for using any reference**
1. Check the repo's LICENSE file yourself before copying code `[U]` for every item below.
2. Prefer learning the *idea*, then writing our own code. If code is copied, keep the license notice and list it in `LICENSES_ATTRIBUTION.md`.
3. A repo having many stars or a polished README does not make its output correct. Test against `TESTING_VALIDATION.md`.

## A. Map and terrain

| Reference | Use it for | Do not use it for |
|-----------|------------|-------------------|
| MapLibre GL JS docs and examples (3D Terrain, hillshade, canvas source, custom layer, PMTiles, "Adding 3D models using three.js on terrain") `[V]` https://maplibre.org/maplibre-gl-js/docs/examples | Terrain, drape, sources, camera | Assuming custom layers drape on terrain `[U]` |
| MapLibre style spec: sources `[V]` https://maplibre.org/maplibre-style-spec/sources/ | `raster-dem` encodings (terrarium, mapbox, custom since 3.4.0) | , |
| `maplibre/maplibre-agent-skills` (agent skills; one issue notes Terrarium-vs-mapbox encoding is a "documented AI failure zone") `[V]` https://github.com/maplibre/maplibre-agent-skills/issues/19 | Install/read as an Antigravity skill if the repo's skills are usable `[U]` | Blind trust |
| deck.gl MapLibre integration docs `[V]` https://deck.gl/docs/api-reference/maplibre/overview | Know the limit: not draped on MapLibre terrain | Water layer on MapLibre terrain |
| deck.gl 3D Tiles / `TerrainExtension` guide `[V]` https://deck.gl/docs/developer-guide/base-maps/using-with-3d-tiles | Fallback architecture (option C) | , |
| Mapterhorn (terrain tiles; BSD-3 code) `[V]` https://mapterhorn.com/ and https://github.com/mapterhorn/mapterhorn | Spike terrain source; pipeline ideas for making our own tiles | Treating it as higher resolution than 30 m for India (global base is GLO-30) |
| OpenFreeMap `[V]` https://github.com/tbodt/openfreemap | Keyless basemap | , |
| Protomaps / PMTiles `[V]` https://github.com/sachaw/PMTiles | Offline vector basemap | , |

## B. Hydrology

| Reference | Use it for | Notes |
|-----------|------------|-------|
| pysheds `[V]` https://github.com/mdbartos/pysheds | D8/D-infinity, accumulation, HAND, stream order | License `[U]` |
| RichDEM (Priority-Flood filling/breaching, flow metrics) `[V]` https://richdem.readthedocs.io/ | Depression handling | License `[U]` (check for copyleft) |
| WhiteboxTools Python (`d8_flow_accumulation`, `elevation_above_stream`) `[V]` per https://analyticsvidhya.com/blog/2024/11/flood-risk-assessment | Independent cross-check | License `[U]` |
| `hydro-topo-features` (PyPI): DEM + OSM water -> HAND and distance to water; Priority-Flood, D8 `[V]` https://pypi.org/project/hydro-topo-features/ | Pipeline design reference | Newer package; verify its outputs yourself |
| Landlab `PriorityFloodFlowRouter` wrapper of RichDEM `[V]` https://landlab.readthedocs.io/en/latest/_modules/landlab/components/priority_flood_flow_router/priority_flood_flow_router.html | Cross-check conditioning options | , |

## C. Simulation and flood visualization

| Reference | Use it for | Do not use it for |
|-----------|------------|-------------------|
| Mei, Decaudin, Hu (2007) virtual pipes `[V]` https://hgpu.org/?p=2256 | Water-motion equations to transcribe | Erosion part (not needed) |
| Celeris-WebGPU (shallow-water / Boussinesq on WebGPU) `[V]` https://github.com/cwedk/celeris | Numerics and GPU structure ideas | Copying coastal-wave physics |
| `Rage997/water-webgpu` (WebGPU compute water waves, MIT) `[V]` https://github.com/Rage997/water-webgpu | Learning WebGPU compute/render structure | It simulates waves in a bathtub, not terrain flow |
| `gain9999/dtm` (client-side 30 m DEM viewer, water-level slider, deck.gl 3D) `[V]` https://github.com/gain9999/dtm | UI and COG streaming ideas; shows what already exists | Its "raise water level" is a bathtub model, not drainage |
| TsunamiSimulator (shallow-water with Manning friction and CFL-safe time step, Cesium overlays) `[V]` https://github.com/SysAdminDoc/TsunamiSimulator | Time-step and overlay approach | Its domain is ocean/tsunami |
| Dynamic 3D flood visualization with Cesium (Netherlands, 2018) `[V]` https://isprs-archives.copernicus.org/articles/XLII-4-W10/83/2018/ | Concept of time-dynamic water levels | , |

## D. Papers and standards (cite correctly)

- Mei, Decaudin, Hu, "Fast hydraulic erosion simulation and visualization on GPU", Pacific Graphics 2007, pp. 47-56. `[V]`
- Hawker et al., "A 30 m global map of elevation with forests and buildings removed" (FABDEM), Environmental Research Letters, 2022. `[V]` per https://gee-community-catalog.org/projects/fabdem/
- Barnes, Lehman, Mulla, "Priority-flood" (2014). `[U]` confirm citation.
- Nobre et al., Height Above Nearest Drainage. `[U]` confirm year.

## E. Bengaluru context sources

- IISc, "Frequent Floods in Bangalore: Causes and Remedial Measures" `[V]` https://wgbis.ces.iisc.ac.in/energy/water/paper/ETR123/contents.html
- Citizen Matters on the CAG audit of stormwater drains `[V]` https://citizenmatters.in/cag-report-stormwater-drains-master-plan-encroachment/
- Deccan Herald on Nagawara `[V]` https://www.deccanherald.com/amp/story/india%2Fkarnataka%2Fbengaluru%2Fbengalurus-nagawara-flooding-is-a-man-made-disaster-official-report-3597966
- OpenCity SWD maps `[V]` https://data.opencity.in/dataset/bengaluru-stormwater-drains-maps
- Oorvani Foundation stormwater drains datajam (citizen audits of drains) `[V]` https://www.thenewsminute.com/amp/story/karnataka/bengaluru-flooding-driven-by-concretisation-poor-drains-and-lake-loss-datajam . Consider contacting them about audit data access `[U]`.

## F. Antigravity docs

- Rules and workflows: https://antigravity.google/docs/rules-workflows `[U]` (URL reported by third-party docs; open and confirm)
- Skills: https://antigravity.google/docs/skills `[U]`

## G. Skills to consider adding (Antigravity)

Only add skills whose SKILL.md you have read. Candidates: a MapLibre skill (above), a geospatial/GDAL skill, a Python testing skill. Keep each skill small and relevant; extra skills increase hallucination surface.
