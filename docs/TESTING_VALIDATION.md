# TESTING_VALIDATION: Ghost Drains

Tags: `[V]` verified, `[U]` unverified, `[D]` decision.

Goal: prove correctness in layers: math, pipeline, data, simulation, rendering, and finally real-world agreement. Thresholds are never invented; they are set from baselines and logged in `docs/VALIDATION_LOG.md`.

## 1. Test layers

| Layer | Tool | What it proves |
|-------|------|----------------|
| L1 synthetic DEM unit tests | pytest | Algorithms behave on known shapes |
| L2 pipeline invariants | pytest | Outputs consistent with metadata and inputs |
| L3 data checks | pytest + manifest | Inputs are what we think they are |
| L4 sim tests | Vitest (and/or headless GL) | Mass conservation, stability |
| L5 rendering/alignment checks | manual + scripted screenshots | Layers align with terrain |
| L6 real-world validation | notebook/script | Agreement with reported evidence |
| L7 performance | manual on target laptop | Frame time and memory |

## 2. L1: synthetic DEM tests (mandatory)

Name all fixtures `synthetic_*`.

| Fixture | Expected |
|---------|----------|
| Tilted plane (constant slope toward one side) | Every cell's D8 direction points downslope consistently; accumulation increases monotonically toward the low edge |
| V-shaped valley | Highest accumulation along the valley centreline; ghost drain follows it |
| Bowl (closed depression) | Depression depth equals filled minus original; max at the bowl centre; fill leaves a single outlet |
| Pit + flat | Flat resolution gives defined directions; no cell without a direction except outlets |
| Two-ridge watershed | Cells on each side drain to different outlets |
| Known-HAND channel | HAND equals elevation difference to the channel cell along the flow path |
| Encoding round-trip | Terrarium encode then decode returns the same height within 1/256 m `[V]` formula in `ARCHITECTURE.md` |
| Row order | Row 0 equals the north edge after resampling |

## 3. L2: pipeline invariants

- Output raster shapes equal `grid.meta.json` width/height.
- No NaN in valid cells; nodata masked consistently across all rasters.
- Total accumulation at outlets equals number of valid cells that drain to them (conservation of counted cells).
- Re-running with the same manifest produces identical checksums (reproducibility).
- Two hydrology libraries agree on stream mask within a recorded tolerance (cross-check, see `HYDROLOGY_SPEC.md`).
- Reprojection check: pick 5 well-known landmark coordinates you geocoded from OSM; after UTM -> display-grid resampling, they land in the expected pixel +/- 1 cell. (Record the landmarks and sources; do not guess coordinates.)
- Scale check: computed `ground_scale_k` equals cos(lat0) and the variation across the bbox stays below a recorded bound (hand estimate about 0.05% over 30 km `[U]`).

## 4. L3: data checks

- Manifest checksums match.
- KML geometry types and counts reported (lines vs polygons; primary/secondary/tertiary).
- Official SWD extents overlap the study bbox.
- OSM water polygons count and names reported; compare with a published lake list before claiming completeness `[U]`.

## 5. L4: simulation tests

1. **Mass balance:** with rain only and closed boundaries, total water volume after N steps equals rain volume added (tolerance recorded).
2. **Open boundary:** with an open edge, outflow equals rain input minus stored volume.
3. **Lake at rest:** a flat basin with initial water remains still (no spurious flow beyond a tiny tolerance).
4. **Slope flow:** water on a tilted plane moves downslope.
5. **Stability:** no NaN/negative depth over a long run at max rain; time-step clamp engages.
6. **Determinism:** same inputs produce the same output on the same machine.
7. Method and equations transcribed from Mei et al. 2007 `[V]` https://hgpu.org/?p=2256 ; a test comment must cite the equation numbers used.

## 6. L5: alignment checks

- Terrain relief on screen matches the DEM: sample 5 points, compare displayed height to raster value.
- Ghost-drain lines sit on the valley floors in hillshade.
- The draped water layer lines up with coastlines of known lakes (OSM) within 1 cell.
- Screenshot at three zoom levels; no visible seams at tile edges.

## 7. L6: real-world validation

### 7.1 Datasets
- Reported flood sites, 4-6 Sept 2022 (see `DATA_SOURCES.md` section 3). Geocode each from OSM and store the source URL.
- Official SWD (primary/secondary/tertiary) and OSM waterways.

### 7.2 Metrics

| Metric | Definition |
|--------|------------|
| V1 stream agreement | Share of ghost-drain length within buffer b of official SWD or OSM waterway, for several accumulation thresholds |
| V2 flood-site lift | Fraction of reported flood sites inside top-p% ponding/HAND zones, divided by the fraction of random built-up points inside the same zones (null model; use many random draws) |
| V3 DEM A/B | Repeat V1 and V2 with GLO-30 vs FABDEM; choose per results |
| V4 sensitivity | How V1/V2 change as threshold/buffer/band change |

### 7.3 Rules
- Report failures. If lift is about 1, say the model does not discriminate.
- Do not tune thresholds on the same few sites you later cite as success. Split sites into a tuning set and a held-out set `[D]` (note the tiny sample size).
- Record DEM source, thresholds, and results in `VALIDATION_LOG.md` with dates.

## 8. L7: performance (target laptop)

Measure and log: frame time during orbit, frame time with sim running at 512 and 1024 grids, JS heap, GPU in use (Intel vs Radeon in `edge://gpu`), first-load time. Targets are set after Spike S2 `[D]`.

## 9. Test commands (create these in the repo)

```
pytest pipeline/tests
npm run test --prefix web
```
Add a CI-style script that runs both and exits non-zero on failure.

## 10. Acceptance gate for a public demo

All L1-L5 pass; V1-V4 computed and shown; performance logged; honesty checklist complete (`HONESTY_AND_LIMITATIONS.md` section 8).
