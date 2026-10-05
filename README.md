# Ghost Drains: Bengaluru 3D Hydrology & Stormwater Intelligence

An interactive, high-performance 3D map of Bengaluru that models terrain-derived natural flow paths (*ghost drains*), cross-references them against official municipal stormwater infrastructure (SWD), highlights drainage infrastructure gaps, and simulates rainfall runoff in real time.

---

## Overview

Bengaluru's topography is defined by three natural watershed valleys—**Hebbal**, **Koramangala-Challaghatta (K-C)**, and **Vrishabhavathi**—which historically drained through a cascading lake chain (*keres*). Rapid urbanization has altered natural drainage patterns and fragmented valley connectivity.

**Ghost Drains** pairs satellite digital elevation data with official stormwater maps to investigate two core questions:
1. **Where does water naturally want to flow based on the terrain?**
2. **Where does the official stormwater drain network have missing links or gaps relative to natural flow paths?**

The project includes an illustrative, virtual-pipe shallow-water rain replay engine running at 60 FPS with screen-space micro-streamline flow vectors.

---

## Key Features

- **Sub-Meter 3D Terrain & Satellite Drape**: Rendered in MapLibre GL JS with Terrarium elevation encoding and high-resolution ESRI World Imagery (up to zoom 19).
- **Natural Streamline Extraction**: D8 steepest-descent flow direction and accumulation derived from 1 arc-second (~30 m) Copernicus GLO-30 DEM, extracting **1,028** natural valley streamlines.
- **Official SWD Integration**: Unified ingestion of **6,835** primary, secondary, and tertiary stormwater drain segments published by KSRSAC / OpenCity.in.
- **STRtree Spatial Gap Analysis**: Automated spatial buffer difference (60 m threshold) detecting **871** unmapped natural flow path segments that lack mapped municipal drains.
- **Ponding & Depression Retention**: Priority-Flood conditioning (Wang & Liu 2006) retaining the depression depth raster (`depress_depth.tif`, up to 21.69 m depth) rather than flattening lake basins.
- **Height Above Nearest Drainage (HAND)**: Hydrological susceptibility classification following Nobre et al. (mean HAND across Bengaluru: 10.7 m).
- **Interactive Rain Replay**: Virtual-pipe shallow-water equations (Mei, Decaudin, Hu 2007) with dynamic rain intensities (50 mm/h monsoon, 130 mm/h Sept 2022 cloudburst scenarios) and 1,000 screen-projected flow arrows.
- **Ground Truth Validation Overlay**: 12 verified Sept 2022 flood hotspot locations (Ecospace ORR, Rainbow Drive, Central Silk Board, Bellandur, etc.) with primary source citations.
- **Zero-Stall Performance**: Optimized for standard laptops (Intel UHD 620, ~8 GB RAM) sustaining 60.0 FPS (< 16.6 ms frame latency).

---

## Architecture

The system is partitioned into an offline reproducible Python pipeline and a zero-dependency static web client:

```
GhostDrain/
├── data/
│   ├── manifest.json            # Authoritative dataset registry (URLs, licenses, SHA-256)
│   ├── raw/                     # Raw DEM tiles & SWD KMLs (gitignored)
│   ├── interim/                 # UTM metric rasters & vectors (gitignored)
│   └── processed/               # Clean GeoJSONs & float32 binary grids
├── docs/                        # Specifications, PRD, architecture, and validation logs
│   ├── PRD.md                   # Product requirements & user stories
│   ├── ARCHITECTURE.md          # End-to-end architecture & hardware budgets
│   ├── HYDROLOGY_SPEC.md        # Equations, routing, and numerical methods
│   ├── HONESTY_AND_LIMITATIONS.md # Scientific claim boundaries & forbidden terminology
│   └── VALIDATION_LOG.md        # Append-only empirical test log
├── pipeline/                    # Offline data pipeline (Python 3.13)
│   ├── config.yaml              # Pipeline bounds, CRS, and validated thresholds
│   ├── p01_fetch.py             # S3 / HTTP dataset download
│   ├── p02_clip_reproject.py    # Mosaic & metric reprojection (EPSG:32643)
│   ├── p03_condition.py         # Priority-Flood depression filling & depth map
│   ├── p04_flow.py              # D8 pointer & accumulation
│   ├── p05_hand.py              # Height Above Nearest Drainage
│   ├── p06_vectors.py           # Stream centerline extraction & STRtree gap analysis
│   ├── p07_resample.py          # Resampling to 1024x1024 Web Mercator display grid
│   ├── p08_package.py           # Web staging & grid.meta.json generation
│   └── tests/                   # Pytest suite (L1 synthetic shapes, L2 invariants, L3 data)
└── web/                         # Browser client (Vite + TypeScript + MapLibre GL JS)
    ├── src/
    │   ├── map/                 # 3D scene, cameras, and vector overlay styling
    │   ├── sim/                 # Mei et al. pipe simulation & flow particles
    │   ├── bridge/              # Canvas-to-MapLibre terrain drape bridge
    │   ├── ui/                  # HUD, FPS telemetry, layer toggles, limitations modal
    │   └── validate/            # Sept 2022 flood validation sites
    ├── public/data/             # Staged runtime artifacts (GeoJSON + .f32.bin)
    └── tests/                   # Vitest unit test suite (simulation, math, UI)
```

---

## Quickstart

### 1. Web Client (Development & Build)

```bash
cd web

# Install dependencies
npm install

# Run Vitest unit tests
npm test

# Launch local 3D dev server
npm run dev

# Compile production bundle
npm run build
```

Open `http://localhost:3000` in Chrome, Edge, or Firefox.

### 2. Python Pipeline

```bash
# Install Python dependencies
pip install -r pipeline/requirements.txt

# Run pipeline invariant test suite
pytest pipeline/tests/ -v

# Execute end-to-end data processing pipeline
python -m pipeline.p02_clip_reproject
python -m pipeline.p03_condition
python -m pipeline.p04_flow
python -m pipeline.p05_hand
python -m pipeline.p06_vectors
python -m pipeline.p07_resample
python -m pipeline.p08_package
```

---

## Data Sources & Integrity

All external datasets are indexed with cryptographic checksums in `data/manifest.json`:

| ID | Dataset | Source | License |
| :--- | :--- | :--- | :--- |
| **DS-01** | Copernicus DEM GLO-30 (1 arc-sec) | AWS Open Data (`s3://copernicus-dem-30m/`) | Copernicus Free Licence |
| **DS-03** | Bengaluru SWD Maps (2022) | KSRSAC via OpenCity.in | Public Domain / KSRSAC |
| **DS-08** | Mapterhorn 3D Terrain Tiles | Mapterhorn (Copernicus GLO-30 base) | BSD-3 |
| **DS-09** | World Imagery Satellite Drape | ESRI ArcGIS Online / EOX Sentinel-2 | Attribution Required |
| **DS-10** | Sept 2022 Reported Inundation Points | ReliefWeb / MHA / The News Minute | Public Citations |

---

## Scientific Honesty & Claim Boundaries

In strict compliance with [`docs/HONESTY_AND_LIMITATIONS.md`](docs/HONESTY_AND_LIMITATIONS.md):
- **Not Flood Prediction**: This tool does **not** predict flood depths or real-time inundation.
- **Resolution Limit**: 30-meter elevation models cannot resolve subterranean culverts, micro-drains, or localized civil encroachments.
- **Suggestive Language**: Natural paths are described as *"terrain-derived flow paths"* or *"unmapped natural flow lines"*, never as *"unauthorized encroachments"*.
- **Illustrative Replay**: The rainfall replay engine illustrates gravitational surface pooling; it is not calibrated to stormwater gauge telemetry.

---

## Testing & Quality Gates

Every code modification must pass 50 automated tests across Python and TypeScript:
- **Pytest (23 tests)**: Synthetic DEM shapes (tilted planes, V-valleys, bowls, two-ridge watersheds), geodesy bounds (UTM 43N convergence, scale distortion < 0.2%), and metadata contracts.
- **Vitest (27 tests)**: Terrarium elevation encode/decode within $1/256\text{ m}$ tolerance, Mei et al. mass-balance conservation, stability clamps, and UI telemetry.

---

## License & Attribution

- **Code**: MIT License.
- **Terrain & Imagery**: Copernicus WorldDEM-30 © DLR e.V. 2010–2014 & Airbus Defence and Space GmbH. Satellite imagery © ESRI and OpenStreetMap contributors. Stormwater drain geometries © KSRSAC.
