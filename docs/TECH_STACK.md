# TECH_STACK: Ghost Drains

Tags: `[V]` verified, `[U]` unverified, `[D]` decision.

## Version policy (read first)

- **Never write a version number from memory.** Before installing, run `npm view <pkg> version` / `pip index versions <pkg>` and record the result in the lockfile.
- After install, read the package's own README/types for the **installed** version before using an API.
- Pin exact versions in `package.json` / `requirements.txt`. Upgrade only in a dedicated commit.

## Decisions

| ID | Area | Choice | Why | Revisit if |
|----|------|--------|-----|------------|
| D-01 | Map engine | MapLibre GL JS | Open source; native 3D terrain from `raster-dem`; draped raster/image/canvas sources `[V]` https://maplibre.org/maplibre-style-spec/sources/ | Spike S2 fails |
| D-02 | Language (web) | TypeScript, Vite | Types catch API hallucinations at build time `[D]` | , |
| D-03 | Pipeline language | Python 3.11 `[D]` | Mature raster/hydrology libs; hydro-topo-features targets 3.11 `[V]` https://pypi.org/project/hydro-topo-features/ | , |
| D-04 | Raster I/O | GDAL via rasterio, pyproj | Standard; explicit CRS handling `[D]` | , |
| D-05 | Hydrology | pysheds (D8, D-infinity, HAND) `[V]` https://github.com/mdbartos/pysheds ; RichDEM (Priority-Flood) `[V]` https://richdem.readthedocs.io/ ; WhiteboxTools as cross-check `[V]` (d8_flow_accumulation, elevation_above_stream per https://analyticsvidhya.com/blog/2024/11/flood-risk-assessment) | Use two tools; disagreement reveals bugs `[D]` | License problem (see below) |
| D-06 | Vectors | geopandas, shapely, pyogrio/fiona | KML to GeoJSON, buffers, joins `[D]` | , |
| D-07 | Sim backend | WebGL2 ping-pong float textures | Compatible with MapLibre context; well documented `[D]` | Perf too low -> WebGPU |
| D-08 | Basemap vectors | OpenFreeMap (keyless) `[V]` https://github.com/tbodt/openfreemap ; Protomaps PMTiles for self-hosting `[V]` | No API key, no request limits stated | Terms change |
| D-09 | Terrain tiles (visual) | Self-generated Terrarium tiles from the *same* processed DEM; Mapterhorn as a quick spike source `[V]` https://mapterhorn.com/ | Visual terrain must equal analysed terrain | , |
| D-10 | Satellite drape | EOX Sentinel-2 cloudless (about 10 m) as default `[V]` https://cloudless.eox.at/pricing | Free, non-commercial, attribution required | Need sharper imagery |
| D-11 | Tests | pytest (pipeline), Vitest (web) `[D]` | , | , |
| D-12 | Hosting | Static host `[D]` | No backend needed | , |

## License checks before adding any dependency `[U]`

RichDEM, pysheds, WhiteboxTools, MapLibre, PMTiles: confirm each license from the repo's LICENSE file before bundling or linking. Record in `LICENSES_ATTRIBUTION.md`. If a copyleft license conflicts with the project's plan, call the tool as a separate offline step only.

## Dev environment checks (run once)

```bash
node -v && npm -v
python --version
python -c "import rasterio, pyproj; print('geo ok')"
```
Browser: open `edge://gpu` and confirm WebGL2 is hardware accelerated. (Owner's screenshot already showed WebGL and WebGPU hardware accelerated.)

## Machine note

Target machine: Intel Core i5-8265U, Intel UHD 620 + Radeon 530, about 7.9 GB RAM, Windows. In Windows Graphics settings, set Edge to "High performance" so the Radeon is used; confirm which GPU is active in `edge://gpu`. Run the pipeline in Windows Python or in the Kali terminal, but run the browser app on Windows. The Kali terminal reported only about 3.8 GiB RAM (roughly half of the 7.9 GB the Windows host reports; likely a virtualised/WSL-style limit `[U]`), so large raster jobs may need Windows Python or a smaller bbox.
