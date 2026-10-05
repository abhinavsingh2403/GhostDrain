# VERIFY_CHECKLIST: Ghost Drains

Everything marked `[U]` in the pack is listed here. Tick an item only after checking the **primary source** or running a test, then note date and result.

| # | Claim / question | How to verify | Blocks | Done |
|---|------------------|---------------|--------|------|
| 1 | Antigravity reads `AGENTS.md` and `GEMINI.md`; precedence; rules folder `.agents/rules` vs `.agent/rules`; per-file limit (reported 12,000 chars) | Open https://antigravity.google/docs/rules-workflows and check your installed version's Customizations panel | M0 | [ ] |
| 2 | Google Photorealistic 3D coverage for Bengaluru surface data | Search Bengaluru in the coverage map https://developers.google.com/maps/documentation/javascript/3d/coverage | S5 only | [ ] |
| 3 | Current Google free-tier quota for Map Tiles | Google Maps Platform pricing page | optional hero shot | [ ] |
| 4 | FABDEM download location, current version, and exact license text | Fathom / University of Bristol pages; read the LICENSE | M2 | [ ] |
| 5 | Exact attribution text required for GLO-30 and FABDEM derivatives | Read official licence documents | M7 | [ ] |
| 6 | OpenCity SWD KML: geometry type (lines/polygons), positional accuracy, original publisher terms, last update | Open the KML in QGIS; read dataset page https://data.opencity.in/dataset/bengaluru-stormwater-drains-maps | M2 | [ ] |
| 7 | OSM tag coverage for Bengaluru drains and lakes (`waterway=drain`, `natural=water`) | Overpass query; compare with a published lake list | M2 | [ ] |
| 8 | UTM zone for the chosen bbox is 43N (EPSG:32643) | `pyproj` CRS lookup for the bbox centre | M2 | [x] 2026-10-05: query_utm_crs_info confirmed EPSG:32643 |
| 9 | Copernicus DEM vertical datum (believed EGM2008) | Copernicus DEM product handbook | M2 | [ ] |
| 10 | Grid convergence about 0.58 degrees (about 150 m at 15 km) and scale variation about 0.05% over 30 km | Recompute with `pyproj` (`Proj` factors) and log | M2 | [x] 2026-10-05: 0.584155 deg convergence (152.93 m offset), 0.1005% cos(lat) variation |
| 11 | MapLibre animated canvas/image source drapes on 3D terrain from a WebGL2 canvas at usable FPS | Spike S2 | M5 | [ ] |
| 12 | MapLibre custom layers vs terrain behaviour | MapLibre docs + experiment | S2 | [ ] |
| 13 | Mapbox Terrain-RGB decode formula (only needed if you use `mapbox` encoding) | MapLibre/Mapbox docs; unit test | any use | [ ] |
| 14 | Equations of the virtual-pipe water model | Transcribe from Mei et al. 2007 | M5 | [x] 2026-10-05: Transcribed in web/src/sim/pipe-sim.ts; verified in tests/pipe-sim.test.ts |
| 15 | CFL-type stability bound for the implemented scheme | Derive/verify against the paper; test | M5 | [x] 2026-10-05: computeDt implemented with waveSpeed sqrt(g*hMax) and 0.5 safety factor |
| 16 | Barnes et al. Priority-Flood citation; Nobre et al. HAND year | Look up the papers | docs | [x] 2026-10-05: Barnes et al. (2014) Comp & Geosci 62:117-127; Nobre et al. (2011) Hydrol Process 25:2443-2469 |
| 17 | Licenses of MapLibre, deck.gl, pysheds, RichDEM, WhiteboxTools, rasterio, pyproj, geopandas | Read each repo's LICENSE | M2/M3 | [ ] |
| 18 | `maplibre/maplibre-agent-skills` content and usability in Antigravity | Open the repo and read each SKILL.md | optional | [ ] |
| 19 | Celeris-WebGPU repo URL and license (search result pointed at one URL while the README referenced another) | Open both, read LICENSE | reference only | [ ] |
| 20 | EOX terms for the current layer year, including expo/offline use | Read https://cloudless.eox.at license pages | M3 | [ ] |
| 21 | Mapterhorn data for India is the global GLO-30 base only (no higher resolution) | Check https://mapterhorn.com/ coverage list | S1 | [ ] |
| 22 | OSM building height completeness in the study area | Query a sample; count buildings with height or levels tags | M3 | [ ] |
| 23 | Global DEM error figures apply to Bengaluru | Not verifiable globally; use own validation (V1-V4) | M2 | [ ] |
| 24 | Sim speed on UHD 620 / Radeon 530 at 512 and 1024 grids | Spike S4 + L7 | M5 | [ ] |
| 25 | Rainfall scenario values for any preset | Cite a primary report; keep conflicting values noted | M5 | [ ] |
| 26 | Cesium ion terms (only if option D is considered) | Read ion terms | optional | [ ] |
| 27 | Whether the Kali terminal's reduced RAM is a virtualisation limit | Check how Kali is run (WSL or VM) | M2 | [ ] |

## Rule

If an item is still unticked when a decision depends on it, the agent must stop and ask (see `AGENTS.md` section 7).
