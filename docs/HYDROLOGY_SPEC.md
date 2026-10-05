# HYDROLOGY_SPEC: Ghost Drains

Tags: `[V]` verified, `[U]` unverified, `[D]` decision.

**Rule:** where a formula below is marked "transcribe", copy it from the cited paper or the library docs. Do not trust this file or model memory for exact equations.

## 1. Scope

Terrain-derived hydrology on a ~30 m DEM: flow direction, flow accumulation, depressions, HAND, and an illustrative shallow-water replay. Nothing here predicts real flooding.

## 2. Inputs and units

- Elevation: metres. Cell size: metres (true ground size, after projection).
- Horizontal CRS for analysis: UTM zone 43N (EPSG:32643) `[U]`; confirm with `pyproj` for the study bbox.
- Vertical datum: Copernicus DEM heights are believed to be relative to EGM2008 `[U]`. For hydrology only *relative* heights matter, but **never mix DEMs with different datums** in one raster.
- Nodata: single constant (see `grid.meta.json`); mask it, never treat it as elevation.

## 3. DEM choice (to be decided by A/B test)

| Candidate | What it is | License | Known numbers |
|-----------|------------|---------|---------------|
| Copernicus GLO-30 | Surface model: includes buildings, trees `[V]` https://registry.opendata.aws/copernicus-dem/ | Free, attribution `[V]` | , |
| FABDEM | GLO-30 with forests and buildings removed by machine learning `[V]` | CC BY-NC-SA 4.0 `[V]` https://gee-community-catalog.org/projects/fabdem/ | Global validation: mean absolute error 5.15 -> 2.88 m in forest, 1.61 -> 1.12 m in built-up areas vs GLO-30 `[V]` https://meetingorganizer.copernicus.org/EGU22/EGU22-8994.html |

Caveats: those error figures are global, **not Bengaluru**. FABDEM still contains some building artefacts in places `[V]` https://www.fathom.global/academic-papers/a-30-m-global-map-of-elevation-with-forests-and-buildings-removed/ . Decide using the validation set in `TESTING_VALIDATION.md`; record the winner in `VALIDATION_LOG.md`.

## 4. Conditioning (depressions)

- Use **Priority-Flood**: fills each depression to its lowest spill level so water can route out. `[V]` described at https://pypi.org/project/hydro-topo-features/ ; RichDEM implements filling and breaching `[V]` https://richdem.readthedocs.io/en/latest/depression_filling.html
- Original paper: Barnes, Lehman and Mulla (2014), Computers & Geosciences `[U]` confirm citation.
- **Important for this project:** filling erases real ponds and lake beds. Save `depress_depth = filled - original` as its own layer; it feeds the ponding view. Never present filled DEM as "the terrain".
- Flats left by filling give ambiguous directions; resolve them with the library's flat-resolution step and record which one.

## 5. Flow direction and accumulation

- D8: each cell drains to the steepest-descent neighbour among 8. Slope = elevation drop / distance, with distance = cell size for cardinal neighbours and cell size x sqrt(2) for diagonals. (Standard definition; confirm against library docs.)
- pysheds supports D8 and D-infinity routing and accumulation `[V]` https://github.com/mdbartos/pysheds ; WhiteboxTools exposes `d8_flow_accumulation` `[V]`.
- Contributing area (m2) = accumulation (cell count) x cell area (m2).
- Ghost drain = cells with contributing area above a threshold. **Threshold is a parameter**, chosen from validation (agreement with OSM waterways/official SWD), not guessed. Record it in `config.yaml` and `VALIDATION_LOG.md`.
- Use D8 for crisp vector lines; use accumulation raster for line width.
- Cross-check: run two independent tools on the same DEM; flag cells where the stream masks differ by more than a recorded tolerance.

## 6. HAND (Height Above Nearest Drainage)

- HAND at a cell = elevation of that cell minus elevation of the drainage cell it flows to, following the flow path downstream. Introduced by Nobre et al. (cite year after checking `[U]`).
- Libraries: pysheds provides HAND `[V]`; WhiteboxTools `elevation_above_stream` `[V]`.
- Use: low HAND near streams = more flood-susceptible *terrain*. It is a susceptibility index, not a depth. `[V]` described as an indicator of flood susceptibility at https://pypi.org/project/hydro-topo-features/
- Bands (for example 0-2 m, 2-5 m) are set after validation; never claim a band equals a flood depth.

## 7. Gap analysis (ghost vs official drains)

1. Convert OpenCity SWD KML (primary, secondary, tertiary) to GeoJSON; reproject to UTM.
2. For each ghost-drain segment above the threshold, compute distance to the nearest official drain line.
3. Segment is "unmapped natural path" if distance > `buffer_m`.
4. `buffer_m` must be at least the DEM cell size and should include the official map's positional uncertainty (unknown `[U]`; inspect the KML). Make it a UI-visible parameter.
5. Never describe a gap as encroachment. A gap can also mean: the drain is underground, the map is incomplete, the DEM is wrong, or the flow path is an artefact.

## 8. Illustrative rain replay (virtual-pipe shallow water)

Source: Mei, Decaudin, Hu (2007), "Fast Hydraulic Erosion Simulation and Visualization on GPU", Pacific Graphics, pp. 47-56 `[V]` https://hgpu.org/?p=2256 . In that method, water moves between grid cells through virtual pipes and the velocity field is derived from a shallow-water model. Use the **water part only**; skip erosion and sediment.

What to transcribe from the paper (do not improvise):
1. Flux update per pipe from height difference, with pipe area, gravity and pipe length.
2. Flux scaling so a cell never exports more water than it holds.
3. Water-depth update from net inflow minus outflow over cell area.
4. Boundary handling.

Our additions `[D]`:
- Rain: `rain_m_per_s = (mm_per_hour / 1000) / 3600`. Add to every cell's water depth each step (optionally multiplied by a runoff coefficient parameter; label it illustrative).
- Gravity: 9.81 m/s2 (standard constant).
- Stability: choose the time step from a CFL-type bound for shallow water, `dt <= C * dx / (|u| + sqrt(g * h))` with C < 1 `[U]` (verify against the scheme actually implemented; add a runtime clamp).
- Timelapse: sim seconds per real second is displayed in the UI.
- No infiltration, drains, culverts or sewers at this resolution; say so.
- Mass test: total water volume = rain input - open-boundary outflow (see tests).

## 8b. Reference for numerics in WebGPU

Celeris-WebGPU implements nonlinear shallow-water and Boussinesq equations on the GPU in the browser `[V]` https://github.com/cwedk/celeris . Use only to compare numerics ideas. Boussinesq is out of scope.

## 9. Parameters register

| Parameter | Where set | Source of value |
|-----------|-----------|-----------------|
| DEM source | `config.yaml` | A/B validation |
| accumulation threshold | `config.yaml` | validation |
| buffer_m | `config.yaml` + UI | validation + KML inspection |
| HAND bands | `config.yaml` | validation |
| runoff coefficient | UI | labelled illustrative |
| rain mm/h | UI | user; scenarios cite sources |

## 10. Known limits (must appear in the app)

- 30 m cells cannot see individual drains, culverts, underpasses or buildings.
- DEM vertical error is on the order of metres (see section 3), while news reports of the Sept 2022 flooding described about a foot (~0.3 m) of water in many areas `[V]` https://www.thenewsminute.com/article/bengaluru-flooded-again-after-rains-marathahalli-orr-under-water-167535 . Terrain error can be larger than the flood depth, so never state depths.
- Official drain map may be incomplete or outdated.
- Replay is illustrative and not calibrated to any gauge or event.
