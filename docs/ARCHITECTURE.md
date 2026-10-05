# ARCHITECTURE: Ghost Drains

Tags: `[V]` verified, `[U]` unverified, `[D]` decision.

## 1. Principles

1. **Two stages.** Heavy science runs offline in Python. The browser only loads finished artifacts and runs a lightweight visual simulation.
2. **One source of terrain truth.** The terrain shown, the terrain analysed and the terrain simulated all derive from the same processed DEM, so water never floats or sinks.
3. **No backend.** Static files only.
4. **Everything traceable.** Each artifact records its inputs, parameters and git SHA.
5. **Spike before build.** Risky assumptions are tested first (section 9).

## 2. System overview

```
 OFFLINE (Python, run on laptop)                         BROWSER (static site)
 ------------------------------                          ---------------------
 raw DEM (GLO-30 / FABDEM) --+                           +--> MapLibre scene
 OSM water/roads/buildings --+--> pipeline --> artifacts-+--> Ghost/official/gap layers
 OpenCity SWD (KML)  --------+     (P1..P8)    (static)  +--> Water sim (WebGL2) --> canvas
 validation sites (CSV) -----+                           +--> UI, legend, limitations
                                                          (draped on terrain via image/canvas source, if S2 passes)
```

## 3. Repo layout

```
pipeline/   p01_fetch.py ... p08_package.py, config.yaml, tests/
web/        src/map/  src/sim/  src/data/  src/ui/  tests/
data/       manifest.json  raw/  interim/  processed/
docs/       (this pack)
```

## 4. Offline pipeline stages

| Stage | Input | Output | Notes |
|-------|-------|--------|-------|
| P1 fetch | manifest entries | `raw/*` + checksums | Copernicus GLO-30 COGs from AWS (`s3://copernicus-dem-30m`, no-sign-request) `[V]` https://registry.opendata.aws/copernicus-dem/ ; FABDEM separately |
| P2 clip+reproject | raw DEM, bbox | `interim/dem_utm.tif` | Reproject to metric CRS (UTM 43N, EPSG:32643 `[U]`) |
| P3 condition | dem_utm | `interim/dem_cond.tif`, `depress_depth.tif` | Priority-Flood fill; **keep depth map**, do not discard depressions |
| P4 flow | dem_cond | `fdir_d8.tif`, `accum.tif` | D8 direction + accumulation |
| P5 HAND | fdir, streams | `hand.tif` | Height above nearest drainage |
| P6 vectors | accum, SWD KML, OSM | `ghost_drains.geojson`, `official_swd.geojson`, `gap.geojson` | Thresholds from `config.yaml` |
| P7 resample | rasters | `*.f32.bin` on Web-Mercator-aligned grid | For sim + display; see section 6 |
| P8 package | all | `web/public/data/*` + `grid.meta.json` | PMTiles for big vectors later |

## 5. Artifact contract

`grid.meta.json` (all raster `.bin` files share it):

```json
{
  "id": "bengaluru-core-v1",
  "crs": "EPSG:3857",
  "bbox_3857": [minx, miny, maxx, maxy],
  "width": 1024, "height": 1024,
  "cell_size_3857_m": 30.0,
  "lat0_deg": 12.97,
  "ground_scale_k": 0.9742,
  "nodata": -9999,
  "dem_source_id": "see manifest",
  "created_at": "ISO-8601",
  "pipeline_git_sha": "..."
}
```

Rules `[D]`: rasters are little-endian float32, row-major, **north-up (row 0 = north edge)**. `ground_scale_k` = cos(lat0), so true ground cell size = `cell_size_3857_m * k`. Values shown above are placeholders; the pipeline computes the real ones.

Files: `dem.f32.bin`, `accum.f32.bin`, `hand.f32.bin`, `depress.f32.bin`; vectors as GeoJSON (MVP) then PMTiles if large.

## 6. Coordinate decisions

- **Analysis in UTM 43N** (metric, conformal, defensible) `[D]`; zone number to confirm with pyproj `[U]`.
- **Display + sim on a Web-Mercator-aligned grid** `[D]` so the sim quad maps exactly onto a MapLibre image/canvas source (those sources take four lon/lat corners).
- Why not simulate on the UTM grid: UTM grid north differs from Mercator north by the "grid convergence". Estimate: about 2.6 degrees from the zone's central meridian times sin(13 degrees) = about 0.58 degrees, so roughly 150 m offset at 15 km from the centre `[U]` (computed by hand; recompute with pyproj). That would misalign the water by several cells.
- Constant scale across the study area: cos(latitude) changes about 0.05% over a 30 km north-south span `[U]` (computed by hand), so a single `ground_scale_k` is acceptable. Document the bound; verify in a test.
- Axis order: GeoJSON and MapLibre use **[longitude, latitude]**. Never swap.
- Rasters are resampled **bilinear** from UTM to the display grid; record this in metadata (it smooths slightly).

## 7. Browser runtime modules

| Module | Responsibility |
|--------|----------------|
| `map/` | MapLibre init, terrain source, imagery, hillshade, building extrusions, layer toggles |
| `data/` | Load `grid.meta.json` + `.bin` rasters + GeoJSON; validate shapes against metadata; fail loudly on mismatch |
| `sim/` | WebGL2 virtual-pipe water simulation; produces an RGBA water texture |
| `bridge/` | Feeds sim canvas into the map as a draped source; syncs corners |
| `ui/` | Controls, legend, limitations panel, attribution (design handled elsewhere) |
| `validate/` | Loads reported-flood sites and shows them with source links |

Terrain tiles: Terrarium-encoded DEM tiles. MapLibre `raster-dem` supports `terrarium`, `mapbox` and `custom` encodings (custom since 3.4.0). `[V]` https://maplibre.org/maplibre-style-spec/sources/
Terrarium decode: `elevation_m = (R*256 + G + B/256) - 32768` `[V]` (Mapterhorn-format README https://data.source.coop/smartmaps/mapterhorn-japan-bridge/README.md). Using the wrong encoding silently produces wrong heights, so the encoding is a named constant with a test.

## 8. Simulation design (illustrative)

Method: virtual-pipe shallow-water model (Mei, Decaudin, Hu, Pacific Graphics 2007) `[V]` https://hgpu.org/?p=2256 . Heightfield columns exchange water through virtual pipes to neighbours; designed to run fully on the GPU.

Plan `[D]`:
- WebGL2 fragment-shader passes with ping-pong float textures (needs `EXT_color_buffer_float`; probe at startup and show a clear message if missing).
- Textures: `state = [terrain b, water d, unused, unused]`, `flux = [fL, fR, fT, fB]`.
- Passes per step: add rain -> update flux -> update water depth -> output colour.
- Boundary: open edges drain; closed edges optional.
- Inputs: rain in mm/h converted to metres per second; time-step from a stability bound recorded in code comments.
- Output: water-depth to colour/alpha texture, rendered to an offscreen canvas.
- **Copy formulas from the paper, not from memory or from this file.** `HYDROLOGY_SPEC.md` lists what to transcribe.
- The sim is visual-grade. It is not calibrated hydraulics. At 30 m it cannot represent drains or culverts.

Why WebGL2 and not WebGPU: simpler, widely known to code assistants, plays well with MapLibre's WebGL context. The owner's Edge reports WebGPU hardware accelerated, so WebGPU stays a later option `[D]`. Reference for WebGPU shallow-water numerics: Celeris-WebGPU `[V]` https://github.com/cwedk/celeris .

## 9. Spikes (retire risk before building)

| ID | Question | Pass condition |
|----|----------|----------------|
| S1 | Does MapLibre 3D terrain with open terrain tiles render Bengaluru acceptably on the laptop? | Smooth orbit, correct relief |
| S2 | Can an animated canvas/image source (fed by a WebGL2 canvas) drape on MapLibre terrain at usable FPS? | Visible, aligned, FPS recorded |
| S3 | Does the pipeline reproduce correct flow on a 5x5 km test tile? | Matches synthetic-DEM tests and visual sanity vs OSM waterways |
| S4 | Does the pipe model run stably on a synthetic DEM and conserve mass? | Mass-balance test passes |
| S5 (optional) | Is Bengaluru covered by Google Photorealistic 3D Tiles? | Check coverage map |

Known constraint: deck.gl layers are **not draped** over MapLibre terrain `[V]` https://deck.gl/docs/api-reference/maplibre/overview . So the water layer must use a MapLibre-native raster/image/canvas source, or the stack must change (see `MAP_DECISION.md`). Custom MapLibre layers and terrain interaction is unverified `[U]`.

Fallback if S2 fails: render water in a second synchronized canvas above the map (not true draping, view-dependent look) or switch to deck.gl as root with `TerrainExtension` drape `[V]` https://deck.gl/docs/developer-guide/base-maps/using-with-3d-tiles .

## 10. Performance budget `[D]`

All numbers below are untested aims; measure and record.
- Sim grid up to 1024x1024 (30 m cells gives about 30.7 km square) with a quality switch to 512x512.
- Cap simulation steps per frame; reduce when frame time exceeds budget.
- Texture upload to the map every N frames, not every frame, if needed.
- Keep total JS heap modest for an 8 GB machine.

## 11. Error handling

- If a required artifact is missing or its dimensions disagree with metadata: stop and show a visible error. Never fall back to fake data.
- If WebGL2 float render targets are unavailable: disable sim, keep static layers, explain why.

## 12. Privacy and security

No backend, no accounts. If "locate me" is added, location stays in the browser and is never stored or sent.

## 13. Deployment

Any static host `[D]`. All third-party tile URLs and licenses are listed in `DATA_SOURCES.md`; keep attribution visible.
