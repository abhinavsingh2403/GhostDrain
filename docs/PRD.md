# PRD: Ghost Drains

Version 0.1 draft. Solo student project. Tags: `[V]` verified, `[U]` unverified, `[D]` decision.

## 1. Summary

Ghost Drains is a browser-based 3D map that answers one question: **"Where does Bengaluru's rainwater naturally want to go, and does a mapped drain exist there?"**

It computes natural flow paths from a terrain model (the "ghost drains"), overlays the official storm-water drain (SWD) map, highlights places where terrain suggests a flow path but no mapped drain is nearby, and replays rain on the terrain as an *illustrative* animation.

## 2. Problem

Bengaluru's flooding is widely linked to lost and encroached drains and lakes, and to incomplete drain records.

- An audit reported that total drain length in the Koramangala and Vrushabhavathi valleys has nearly halved over a century. `[V]` https://citizenmatters.in/cag-report-stormwater-drains-master-plan-encroachment/
- The same source says the city lacks complete records of its SWD system, which makes encroachment easier. `[V]` (same URL)
- A government study of Nagawara found about 15 km of interconnecting drains present in a 1958 village map no longer exist. `[V]` https://www.deccanherald.com/amp/story/india%2Fkarnataka%2Fbengaluru%2Fbengalurus-nagawara-flooding-is-a-man-made-disaster-official-report-3597966
- An IISc study reports 1028% growth in urban area of Greater Bangalore from 1973 to 2017. `[V]` https://wgbis.ces.iisc.ac.in/energy/water/paper/ETR123/contents.html
- In the 4-5 Sept 2022 event, parts of Mahadevapura, East and Rajarajeshwari zones received about 100-143 mm per the MHA situation report. `[V]` https://reliefweb.int/report/india/ministry-home-affairs-disaster-management-division-national-emergency-response-centre-situation-report-regarding-flood-heavy-rainfall-country-06092022-1800-hrs

People rarely *see* this. A map that shows the water's natural path, and the missing links, makes the problem understandable without technical knowledge.

## 3. Vision and non-negotiables

- Looks real because geography is real: real terrain, real imagery, real mapped drains.
- Honest: it is **not a flood forecast** and never claims to be. See `HONESTY_AND_LIMITATIONS.md`.
- Solo-buildable on the owner's laptop (Intel Core i5-8265U, Intel UHD 620 + Radeon 530, about 8 GB RAM) `[D]`.

## 4. Users

| User | Need |
|------|------|
| Expo/judge audience | Understand the issue in 60 seconds, be impressed |
| Students / civic-curious | Explore their own area |
| Technical reviewer | Check methods, data, validation |

## 5. Goals and non-goals

**Goals**
- G1: Show terrain-derived natural flow paths for a chosen Bengaluru study area.
- G2: Overlay official SWD network and flag unmapped natural paths ("gap view").
- G3: Show low-lying / ponding-prone zones with clearly defined methods.
- G4: Replay rain as an illustrative, physically-motivated animation on the same terrain.
- G5: Publish methods, data credits and limitations inside the app.

**Non-goals**
- NG1: No flood *prediction*, warning, or insurance/property risk claims.
- NG2: No accusations of illegal encroachment. Wording is "unmapped natural path".
- NG3: No user accounts, no location tracking, no backend.
- NG4: No commercial use (licenses forbid it for some datasets, see `LICENSES_ATTRIBUTION.md`).
- NG5: No UI design in this pack.

## 6. Features

| ID | Feature | Priority | Acceptance criteria |
|----|---------|----------|---------------------|
| F-01 | 3D terrain scene with satellite drape, hillshade, OSM buildings | MVP | Camera orbits smoothly on target laptop; attribution visible; terrain matches processed DEM within documented tolerance |
| F-02 | Ghost Drains layer (flow paths, thickness by contributing area) | MVP | Reproducible from pipeline; threshold documented; passes synthetic-DEM tests |
| F-03 | Official SWD overlay (primary/secondary/tertiary) | MVP | Loaded from OpenCity KML converted by pipeline; source and date shown |
| F-04 | Gap view: ghost paths with no SWD within buffer | MVP | Buffer is a visible parameter; wording follows honesty policy |
| F-05 | Ponding / low-lying layer (depression depth + HAND bands) | MVP | Legend explains each metric in plain words; depressions are NOT silently filled away |
| F-06 | Rain replay (virtual-pipe shallow water), draped on terrain | V1 | Intensity (mm/h) and duration controls; "timelapse x N" label; mass-conservation test passes |
| F-07 | What-if: place a barrier / block a path, re-run | V1 | Edit changes the sim DEM locally; reset restores baseline |
| F-08 | Reported-flood sites overlay (Sept 2022) | V1 | Each point has a source URL; points geocoded from OSM, never guessed |
| F-09 | Method and limitations panel + credits | MVP | Lists data, CRS, resolution, caveats |
| F-10 | Shareable view (URL hash: camera + layers) | V1 | Link restores state |
| F-11 | Offline-capable static bundle for expo | V1 | Works without internet after first load, or ships all tiles locally |
| F-12 | Lakes layer + historical "water lost" slider | Stretch | Only if a sourced historical lake dataset is found and verified |

## 7. Data and accuracy requirements

- R-1: Every dataset has an entry in `data/manifest.json` (source URL, date, license, checksum). No manifest entry, no use.
- R-2: Hydrology computed on the DEM in a metric projected CRS (UTM zone 43N, EPSG:32643 `[U]`).
- R-3: DEM resolution is about 30 m. The app must say it cannot resolve individual drains, culverts or buildings.
- R-4: Elevation source choice (bare-earth vs surface model) is settled by an A/B test against validation sites (see `TESTING_VALIDATION.md`).
- R-5: All numeric thresholds (flow accumulation, buffer, HAND bands) are set from validation results and recorded in `VALIDATION_LOG.md`. No magic numbers.

## 8. Non-functional requirements

- Performance: sustained interactive frame rate on the target laptop. The numeric target is set after Spike S2; until then it is an aim, not a promise `[D]`.
- Resilience: expo Wi-Fi is unreliable, so ship static assets.
- Accessibility: legend colors must be colour-blind safe; do not use red/green as the only contrast.
- Privacy: no analytics that identify users; no storing location.
- Browser: Edge/Chrome on desktop; WebGL2 required; WebGPU not required `[D]`.

## 9. Success metrics

| Metric | How measured | Target |
|--------|--------------|--------|
| M1 Stream agreement | % of ghost-drain length within a buffer of official SWD or OSM waterways | Report baseline first; no target invented |
| M2 Flood-site lift | Share of reported flood sites inside top ponding/HAND zones vs random built-up points (null model) | Must beat the null model; threshold set after baseline |
| M3 Frame rate | Measured on the target laptop | Set after S2 |
| M4 Reproducibility | `make pipeline` rebuilds artifacts bit-for-bit from manifest | Pass/fail |
| M5 Comprehension | 5 non-technical people explain the app after 60 s | Qualitative |

## 10. Risks

| Risk | Mitigation |
|------|------------|
| 30 m DEM too coarse in dense urban cores | Say so; focus on valley/lake scale; A/B vs bare-earth DEM |
| DEM includes buildings/trees (surface model) | Prefer bare-earth DEM if license allows; compare |
| Official SWD KML quality unknown | Inspect and report geometry quality before use |
| Draping a custom water layer on 3D terrain may not work as hoped | Spike S2 decides approach (see `ARCHITECTURE.md`) |
| Weak GPU | Smaller sim grid, adaptive step count, degrade gracefully |
| Misleading viewers | Honesty policy, in-app labels |
| License traps (non-commercial, share-alike) | `LICENSES_ATTRIBUTION.md`, keep project non-commercial |

## 11. Novelty (honest)

Browser flood-depth viewers on DEMs already exist, for example a client-side DTM viewer that raises a water level on a 30 m DEM. `[V]` https://github.com/gain9999/dtm
Our differentiator is the **gap analysis against Bengaluru's official drain map** plus a **sourced validation set**, not "we made a flood sim".

## 12. Out of scope here

UI/visual design, branding, copywriting beyond the honesty policy, deployment pipeline details.
