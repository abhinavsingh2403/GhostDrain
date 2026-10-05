# ROADMAP_TASKS: Ghost Drains

Tags: `[V]` verified, `[U]` unverified, `[D]` decision. No calendar dates are promised; order matters, not speed.

## Working agreement

Each task: read docs -> plan (assumptions + test) -> small change -> run tests -> update docs/manifest -> log results. See `AGENTS.md`.

## M0: Setup

| Task | Done when |
|------|-----------|
| Repo layout from `README.md`; add `AGENTS.md`, `GEMINI.md`, `/docs` | Files in place; agent confirms it read them |
| Check Antigravity rules path/limits in its docs | `VERIFY_CHECKLIST.md` item ticked |
| Environment checks (`node -v`, Python, `edge://gpu`) | Output pasted into `docs/VALIDATION_LOG.md` |
| Set Edge to High performance GPU; note active GPU | Logged |
| Create `data/manifest.json` skeleton | Valid JSON, empty datasets list |

## M1: Spikes (do these before building)

| Spike | Question | Output |
|-------|----------|--------|
| S1 | MapLibre 3D terrain over Bengaluru with open terrain tiles (Mapterhorn is a quick source `[V]`) | FPS notes; screenshot |
| S2 | Can an animated canvas/image source driven by WebGL2 drape on terrain? | Works/doesn't; FPS; alignment error |
| S3 | Pipeline on a small test tile (about 5x5 km): fetch, reproject, fill, D8, accumulate | Ghost lines plausible vs OSM waterways |
| S4 | Pipe-model sim on synthetic DEM | Mass-balance test passes |
| S5 | (optional) Google 3D coverage for Bengaluru | Yes/no from coverage map |

Gate: if S2 fails, adopt the fallback in `ARCHITECTURE.md` section 9 before M5.

## M2: Data pipeline v1

| Task | Acceptance |
|------|-----------|
| P1-P2 fetch/clip/reproject GLO-30 and FABDEM | Manifest entries, checksums, CRS recorded |
| P3 conditioning with depression-depth output | L1 tests (bowl, pit, flat) pass |
| P4-P5 D8, accumulation, HAND with two libraries | Cross-check tolerance recorded |
| P6 ghost vectors, SWD KML to GeoJSON, gap analysis | Counts and geometry types reported; thresholds from config |
| P7-P8 resample to display grid, write `grid.meta.json` and `.bin` rasters | Row-order and scale tests pass |
| DEM A/B (V1-V4 baseline) | `VALIDATION_LOG.md` entry with chosen DEM |

## M3: Scene

| Task | Acceptance |
|------|-----------|
| MapLibre scene: terrain from our DEM tiles, satellite drape, hillshade | Terrain heights match raster at 5 sample points |
| OSM buildings and basemap (OpenFreeMap or PMTiles extract) | Attribution visible |
| Layer toggles (state kept in URL hash) | Restores on reload |

## M4: Ghost drains + official drains + gap + ponding

| Task | Acceptance |
|------|-----------|
| Ghost-drain layer (width by contributing area) | Matches pipeline output |
| Official SWD layer (3 classes) | Source/date shown |
| Gap view with visible buffer parameter | Wording per honesty policy |
| Ponding and HAND layers with plain-language legend | Depressions not hidden |
| Methods + limitations panel | Complete per `HONESTY_AND_LIMITATIONS.md` |

## M5: Rain replay

| Task | Acceptance |
|------|-----------|
| WebGL2 virtual-pipe sim (equations transcribed from the paper) | L4 tests pass |
| Draped water layer via chosen approach | Alignment within 1 cell |
| Controls: rain mm/h, duration, timelapse label | "Illustrative" tag visible |
| Quality switch (512/1024) and frame-time governor | No sustained stalls on target laptop |

## M6: What-if + validation overlay

| Task | Acceptance |
|------|-----------|
| Barrier/blocked-path edit and reset | Baseline restored exactly |
| Reported-site overlay with source links | Every point has a URL |
| Validation panel showing V1-V4 including failures | Matches `VALIDATION_LOG.md` |

## M7: Hardening

| Task | Acceptance |
|------|-----------|
| Performance pass on target laptop | L7 numbers logged |
| Offline/expo bundle | Works without network after load |
| Attribution page and license audit | `LICENSES_ATTRIBUTION.md` complete |
| Demo script (60 s) and honesty checklist | All ticked |

## Prompt starters for the coding agent

Use these as the first message of a task; adapt the bracketed parts.

1. **Spike S1:** "Read AGENTS.md, docs/MAP_DECISION.md and docs/ARCHITECTURE.md section 7. Build a minimal Vite + TypeScript page with MapLibre showing 3D terrain over a bbox I will give you. Set `encoding` explicitly. Open the official MapLibre 3D Terrain example in the browser tool and cite it. Report FPS you measured. Do not add other features."
2. **Spike S3:** "Read docs/HYDROLOGY_SPEC.md and docs/DATA_SOURCES.md. In `pipeline/`, write a script that clips a 5x5 km DEM tile (from the manifest), reprojects to EPSG:32643 (confirm with pyproj), fills depressions while saving depression depth, computes D8 and accumulation with pysheds, and cross-checks with a second tool. Add the synthetic-DEM tests from docs/TESTING_VALIDATION.md section 2. Show test output."
3. **Gap analysis:** "Convert the OpenCity SWD KML files listed in the manifest to GeoJSON, report geometry types and counts, then compute segments of ghost drains with no official drain within `buffer_m` from config.yaml. Do not choose a default buffer; fail if it is unset."
4. **Simulation:** "Open the Mei et al. paper (https://hgpu.org/?p=2256) and transcribe the flux, scaling and depth-update equations into comments, then implement them in WebGL2 fragment shaders with ping-pong float textures. Probe `EXT_color_buffer_float` and show a clear message if missing. Add mass-balance and slope-flow tests."
5. **Validation:** "Using the tuning/held-out split, compute V1-V4 for GLO-30 and FABDEM, write results to docs/VALIDATION_LOG.md, and state plainly if lift is near 1."

## Risks tracked

| Risk | Early signal | Response |
|------|--------------|----------|
| Water layer will not drape well | S2 fails | Option C or second canvas |
| DEM too coarse in the core | V2 lift near 1 | Narrow to valley scale; say so |
| Laptop too slow | Low FPS at 512 grid | Reduce buildings/imagery, lower grid |
| License surprise | Audit finds conflict | Remove or replace that dataset |
