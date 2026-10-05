# MAP_DECISION: Google Maps vs alternatives

Tags: `[V]` verified, `[U]` unverified, `[D]` decision.

## Decision `[D]`

**Use MapLibre GL JS with our own 3D terrain, satellite imagery drape, OSM buildings and a draped water layer.** Treat Google Photorealistic 3D Tiles as an optional, separate "hero shot", not the analytical map.

## Why "most photoreal" is not the same as "most real"

The goal is a map that *looks real and is correct*. Google's 3D mesh looks the most photographic, but our water must sit on the same terrain we analysed. A mesh from another source will not match our DEM, so water would clip through buildings or hover.

## Options compared

| Option | Looks | Water aligns with our DEM | License fit | Laptop fit | Verdict |
|--------|-------|---------------------------|-------------|-----------|---------|
| A. MapLibre + own terrain + satellite + OSM buildings | Realistic, controllable | **Yes** (same DEM) | Open stack; imagery terms apply | Good | **Chosen** |
| B. Google Photorealistic 3D Tiles (via deck.gl / Cesium) | Most photographic | No (different geometry) | Strict, see below | Heavy for UHD 620 `[U]` | Optional demo only |
| C. deck.gl as root with TerrainLayer + `TerrainExtension` drape | Good | Yes | Open | Medium | Fallback if S2 fails |
| D. Cesium (CesiumJS + ion) | Good | Yes if we supply terrain | ion terms not evaluated `[U]` | Medium | Not evaluated; skip for now |
| E. Google Maps JavaScript API 3D | Photographic | Limited custom GPU overlays `[U]` | Google terms | , | Not researched; skip |

## Facts behind the verdict

**Google Map Tiles / Photorealistic 3D Tiles**
- Policy: use for **map visualization**; non-visualization uses (for example image analysis) are not allowed; cache-control headers must be honoured; Google logo bottom-left and attribution bottom-right must not be obscured. `[V]` https://developers.google.com/maps/documentation/tile/policies
- Promotional videos are allowed if clearly marked "for promotional purposes only" and attribution rules are followed. `[V]` (same URL)
- 3D terrain is worldwide, but 3D surface data (buildings, trees) is limited to a coverage map. `[V]` https://developers.google.cn/maps/documentation/javascript/3d/coverage?hl=en
- **Bengaluru surface coverage: not verified.** Check the coverage map before any plan. `[U]`
- Essentials Map Tiles APIs advertised up to 100,000 free calls per SKU per month (2023 blog and product page; confirm current). `[V]/[U]` https://mapsplatform.google.com/maps-products/map-tiles
- Consequence: the analysis (flow paths, HAND, gap view) must **not** be derived from Google tiles.

**MapLibre + deck.gl**
- MapLibre `raster-dem` sources support `terrarium`, `mapbox`, and `custom` encodings. `[V]` https://maplibre.org/maplibre-style-spec/sources/
- deck.gl's MapLibre integration shares the camera and can interleave in MapLibre's WebGL2 context, but **deck.gl layers are not draped over MapLibre terrain**. `[V]` https://deck.gl/docs/api-reference/maplibre/overview
- With deck.gl as the root, `TerrainExtension` can drape layers on a terrain source. `[V]` https://deck.gl/docs/developer-guide/base-maps/using-with-3d-tiles
- Therefore the water layer must be a MapLibre-native raster/image/canvas source (draped by MapLibre) unless we switch to option C. Spike S2 decides. `[D]`

**Free basemap data**
- OpenFreeMap: free public instance with no API keys or request limits stated; includes building shapes in 3D styles; credit "OpenFreeMap, OpenMapTiles, data from OpenStreetMap". `[V]` https://github.com/tbodt/openfreemap
- Protomaps PMTiles: bbox extraction with `pmtiles extract` lets us ship a local basemap for offline expo use. `[V]` https://www.antoniogioia.com/protomaps-open-source-single-file-maps
- EOX Sentinel-2 cloudless: about 10 m resolution; free; non-commercial for 2018-2025 data under CC BY-NC-SA 4.0 (2016 under CC BY 4.0); attribution required. `[V]` https://cloudless.eox.at/pricing
- 10 m imagery looks soft at street zoom. That is acceptable at valley/city scale and must not be disguised.

## How to make option A look genuinely real (without lying)

1. Accurate relief: our own DEM tiles, mild vertical exaggeration only if labelled.
2. Satellite drape + hillshade so slopes read naturally.
3. OSM buildings as extrusions. Many OSM buildings lack heights `[U]`, so say "building heights approximate".
4. Sky/fog for depth; restrained lighting.
5. Water: depth-based opacity, subtle animated normals, soft shoreline fade. No fake foam or splashes.
6. Honest scale cues: legend, scale bar, "illustrative timelapse x N" label.
7. Keep colors natural; use one accent colour for ghost drains and another for official drains.

## Optional Google hero shot (kept separate)

If you want a Google-style cinematic clip: record it from a **separate** Google 3D Tiles scene, mark it "for promotional purposes only", keep Google attribution visible, and never present it as the analytical result. Check Bengaluru coverage first. `[U]`

## Re-decision triggers

- S2 shows MapLibre cannot drape our animated water acceptably -> use option C.
- Laptop cannot sustain terrain + sim -> reduce grid, buildings, or imagery detail before changing engines.
