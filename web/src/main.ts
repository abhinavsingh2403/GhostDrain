/**
 * Ghost Drains — Application entry point.
 *
 * Initializes the MapLibre 3D scene and wires up data loading.
 * Source: docs/ARCHITECTURE.md section 7
 */

import { initMap } from './map/scene';
import { initControls, type SimController } from './ui/controls';
import { loadGeoJSON, loadGridMeta, loadBinaryRaster } from './data/loader';
import { addFloodSitesLayer } from './validate/flood-sites';
import { addGhostDrainLayer, addOfficialSWDLayer, addGapLayer, LAYER_IDS } from './map/layers';
import { decodePondingCanvas, decodeHandCanvas, registerRasterOverlay } from './map/raster-layers';
import { registerWaterSource } from './bridge/drape';
import {
  createState,
  step,
  computeDt,
  renderWaterToCanvas,
  applyBarrier,
  resetTerrain,
  type PipeSimConfig,
} from './sim/pipe-sim';
import { FlowParticleSystem } from './sim/flow-particles';
import { BENGALURU_BBOX } from './constants';

/**
 * Hydrologically realistic terrain capturing Bengaluru's actual ridge & lake valleys.
 * Features the central ridge at 77.58, Koramangala-Challaghatta Valley, Vrishabhavathi
 * Valley, and the real depressions of Bellandur, Varthur, Agara, Madiwala, and Hebbal lakes.
 */
function buildBengaluruCatchmentTerrain(
  width: number,
  height: number,
  bbox: readonly [number, number, number, number],
): Float32Array {
  const [w, s, e, n] = bbox;
  const terrain = new Float32Array(width * height);

  // Real major lakes & valley sinks [lon, lat, radius, depth_m]
  const sinks = [
    { lon: 77.672, lat: 12.937, r: 0.025, depth: 16 }, // Bellandur Lake
    { lon: 77.739, lat: 12.948, r: 0.028, depth: 18 }, // Varthur Lake
    { lon: 77.643, lat: 12.923, r: 0.014, depth: 11 }, // Agara Lake
    { lon: 77.620, lat: 12.915, r: 0.018, depth: 12 }, // Madiwala Lake
    { lon: 77.678, lat: 12.918, r: 0.012, depth: 9 },  // Saul Kere
    { lon: 77.592, lat: 13.035, r: 0.020, depth: 14 }, // Hebbal Lake
    { lon: 77.687, lat: 12.906, r: 0.010, depth: 8 },  // Rainbow Drive valley
    { lon: 77.681, lat: 12.928, r: 0.011, depth: 10 }, // Ecospace ORR depression
    { lon: 77.622, lat: 12.917, r: 0.010, depth: 8 },  // Central Silk Board
  ];

  for (let r = 0; r < height; r++) {
    const lat = n - (r / (height - 1)) * (n - s);
    for (let c = 0; c < width; c++) {
      const lon = w + (c / (width - 1)) * (e - w);

      // Central North-South ridge around lon 77.58 (elevation ~925m) sloping gently East and West
      const distFromRidge = lon - 77.58;
      let elev = 925 - Math.abs(distFromRidge) * 160;

      // Lake depressions (real geographic coordinates and footprints)
      for (const sink of sinks) {
        const dLon = lon - sink.lon;
        const dLat = lat - sink.lat;
        const dist = Math.sqrt(dLon * dLon + dLat * dLat);
        if (dist < sink.r) {
          const dip = (1 - dist / sink.r) * sink.depth;
          elev -= dip;
        }
      }

      terrain[r * width + c] = elev;
    }
  }

  return terrain;
}

function main(): void {
  // Check WebGL2 availability before anything else
  const testCanvas = document.createElement('canvas');
  const gl = testCanvas.getContext('webgl2');
  if (!gl) {
    showFatalError(
      'WebGL2 is required but not available in this browser. ' +
      'Please use a recent version of Chrome, Edge, or Firefox.',
    );
    return;
  }

  // 1. Setup Simulation Engine (160x160 grid for smooth 60 FPS CPU execution)
  const simWidth = 160;
  const simHeight = 160;
  const simConfig: PipeSimConfig = {
    width: simWidth,
    height: simHeight,
    cellSize: 190, // 190m * 160 = ~30.4 km domain covering Bengaluru study bbox
    pipeArea: 190 * 190,
    maxDt: 0.15,
    rainMmH: 50,
    boundary: 'open',
  };

  const terrain = buildBengaluruCatchmentTerrain(simWidth, simHeight, BENGALURU_BBOX);
  const baseTerrain = new Float32Array(terrain);
  const simState = createState(terrain, simConfig);
  const flowParticles = new FlowParticleSystem(simWidth, simHeight, 1000, BENGALURU_BBOX);
  let barrierMode = false;

  // Lightweight offscreen canvas for soft water drape (160x160 matching physics grid)
  const simCanvas = document.createElement('canvas');
  simCanvas.id = 'water-sim-canvas';
  simCanvas.width = simWidth;
  simCanvas.height = simHeight;
  const simCtx = simCanvas.getContext('2d', { willReadFrequently: true });
  const simImgData = simCtx ? simCtx.createImageData(simWidth, simHeight) : null;

  let simRunning = false;
  let lastTime = performance.now();

  // Screen-space overlay canvas for sleek, professional micro flow arrows
  let flowOverlay: HTMLCanvasElement | null = null;
  let flowOverlayCtx: CanvasRenderingContext2D | null = null;

  function simLoop(now: number): void {
    const elapsed = (now - lastTime) / 1000;
    lastTime = now;

    if (simRunning && simCtx && simImgData) {
      const dt = computeDt(simConfig, simState.water);
      // Run step clamped by elapsed time budget
      const simDt = Math.min(dt, Math.min(elapsed, 0.08));
      if (simDt > 0) {
        step(simState, simConfig, simDt);
        renderWaterToCanvas(simState.water, simWidth, simHeight, simCtx, simImgData, 0.02);

        if (map.getLayer('water-lakes-hd')) {
          const lakeOpacity = Math.min(0.70 + (simState.simTime / 180) * 0.22, 0.92);
          map.setPaintProperty('water-lakes-hd', 'fill-opacity', lakeOpacity);
        }
      }
    }

    // Render professional micro flow arrows in screen space (60 FPS, crisp at all zoom levels)
    if (flowOverlayCtx) {
      if (simRunning && simConfig.rainMmH > 0) {
        flowParticles.updateAndDraw(
          flowOverlayCtx,
          map,
          simState.terrain,
          simState.water,
          true,
        );
      } else {
        flowOverlayCtx.clearRect(0, 0, flowOverlayCtx.canvas.width, flowOverlayCtx.canvas.height);
      }
    }

    requestAnimationFrame(simLoop);
  }
  requestAnimationFrame(simLoop);

  const simController: SimController = {
    isRunning: () => simRunning,
    togglePlay: () => {
      simRunning = !simRunning;
      return simRunning;
    },
    setRainRate: (rate: number) => {
      (simConfig as { rainMmH: number }).rainMmH = rate;
    },
    getRainRate: () => simConfig.rainMmH,
    resetSim: () => {
      simRunning = false;
      simState.water.fill(0);
      simState.flux.fill(0);
      simState.simTime = 0;
      flowParticles.reset();
      if (map.getLayer('water-lakes-hd')) {
        map.setPaintProperty('water-lakes-hd', 'fill-opacity', 0.70);
      }
      if (simCtx && simImgData) {
        simImgData.data.fill(0);
        simCtx.putImageData(simImgData, 0, 0);
      }
      if (flowOverlayCtx) {
        flowOverlayCtx.clearRect(0, 0, flowOverlayCtx.canvas.width, flowOverlayCtx.canvas.height);
      }
    },
    getSimTime: () => simState.simTime,
    isBarrierMode: () => barrierMode,
    toggleBarrierMode: () => {
      barrierMode = !barrierMode;
      map.getCanvas().style.cursor = barrierMode ? 'crosshair' : '';
      return barrierMode;
    },
    resetTerrain: () => {
      resetTerrain(simState.terrain, baseTerrain);
      console.log('[Ghost Drains] Terrain reset to pristine baseline.');
    },
  };

  const map = initMap('map');
  initControls(map, simController);

  // What-If Barrier tool: paint +5m elevation ridge on map click (F-07)
  map.on('click', (e) => {
    if (!barrierMode) return;
    const lng = e.lngLat.lng;
    const lat = e.lngLat.lat;
    const [w, s, eB, n] = BENGALURU_BBOX;
    if (lng < w || lng > eB || lat < s || lat > n) return;

    const col = Math.round(((lng - w) / (eB - w)) * (simWidth - 1));
    const row = Math.round(((n - lat) / (n - s)) * (simHeight - 1));

    applyBarrier(simState.terrain, simWidth, simHeight, col, row, 2, 5.0);
    console.log(`[Ghost Drains] Placed ridge barrier (+5m) at grid cell (${col}, ${row}) [${lng.toFixed(4)}, ${lat.toFixed(4)}]`);
  });

  map.on('load', async () => {
    // Setup screen-space overlay canvas for micro-streamlines
    try {
      flowOverlay = document.createElement('canvas');
      flowOverlay.id = 'rain-flow-overlay';
      flowOverlay.style.position = 'absolute';
      flowOverlay.style.top = '0';
      flowOverlay.style.left = '0';
      flowOverlay.style.width = '100%';
      flowOverlay.style.height = '100%';
      flowOverlay.style.pointerEvents = 'none';
      flowOverlay.style.zIndex = '5';
      map.getCanvasContainer().appendChild(flowOverlay);

      const resizeOverlay = () => {
        if (!flowOverlay) return;
        const cvs = map.getCanvas();
        flowOverlay.width = cvs.clientWidth;
        flowOverlay.height = cvs.clientHeight;
      };
      resizeOverlay();
      map.on('resize', resizeOverlay);
      flowOverlayCtx = flowOverlay.getContext('2d');
    } catch (e) {
      console.warn('[Ghost Drains] Flow overlay setup error:', e);
    }
    // Opportunistically refine terrain from AWS Terrarium elevation once tiles load
    map.once('idle', () => {
      let refined = 0;
      for (let r = 0; r < simHeight; r += 4) {
        const lat = BENGALURU_BBOX[3] - (r / (simHeight - 1)) * (BENGALURU_BBOX[3] - BENGALURU_BBOX[1]);
        for (let c = 0; c < simWidth; c += 4) {
          const lon = BENGALURU_BBOX[0] + (c / (simWidth - 1)) * (BENGALURU_BBOX[2] - BENGALURU_BBOX[0]);
          const elev = map.queryTerrainElevation([lon, lat]);
          if (elev !== null && elev !== undefined) {
            simState.terrain[r * simWidth + c] = elev;
            refined++;
          }
        }
      }
      if (refined > 20) {
        console.log(`[Ghost Drains] Calibrated terrain with ${refined} satellite elevation samples.`);
      }
    });
    // 2. Register draped simulation source onto 3D terrain
    try {
      registerWaterSource(map, simCanvas, BENGALURU_BBOX);
      console.log('[Ghost Drains] Registered draped water canvas source.');
    } catch (err) {
      console.warn('[Ghost Drains] Error registering water source:', err);
    }

    // 3. Load GeoJSON layers
    try {
      const floodSites = await loadGeoJSON('flood_sites.geojson');
      addFloodSitesLayer(map, floodSites);
      console.log(`[Ghost Drains] Loaded ${floodSites.features.length} reported flood sites.`);
    } catch (err) {
      console.warn('[Ghost Drains] Could not load flood_sites.geojson:', err);
    }

    try {
      const ghostDrains = await loadGeoJSON('ghost_drains.geojson');
      addGhostDrainLayer(map, ghostDrains);
      console.log(`[Ghost Drains] Loaded ghost drains layer.`);
    } catch (err) {
      // Expected until pipeline P6 is run
      console.info('[Ghost Drains] ghost_drains.geojson not yet generated (run pipeline P6).');
    }

    try {
      const officialSWD = await loadGeoJSON('official_swd.geojson');
      addOfficialSWDLayer(map, officialSWD);
      console.log(`[Ghost Drains] Loaded official SWD layer.`);
    } catch (err) {
      console.info('[Ghost Drains] official_swd.geojson not yet generated (run pipeline P6).');
    }

    try {
      const gap = await loadGeoJSON('gap.geojson');
      addGapLayer(map, gap);
      console.log(`[Ghost Drains] Loaded gap analysis layer.`);
    } catch (err) {
      console.info('[Ghost Drains] gap.geojson not yet generated (run pipeline P6).');
    }

    // 4. Load binary raster layers (Ponding & HAND - F-05)
    try {
      const meta = await loadGridMeta();
      try {
        const depressData = await loadBinaryRaster('depress.f32.bin', meta);
        const pondingCanvas = decodePondingCanvas(depressData, meta.width, meta.height);
        registerRasterOverlay(map, LAYER_IDS.PONDING, pondingCanvas, meta.bbox_3857, false);
        console.log('[Ghost Drains] Loaded and registered Ponding depression raster.');
      } catch (err) {
        console.warn('[Ghost Drains] depress.f32.bin not loaded:', err);
      }

      try {
        const handData = await loadBinaryRaster('hand.f32.bin', meta);
        const handCanvas = decodeHandCanvas(handData, meta.width, meta.height);
        registerRasterOverlay(map, LAYER_IDS.HAND, handCanvas, meta.bbox_3857, false);
        console.log('[Ghost Drains] Loaded and registered HAND susceptibility raster.');
      } catch (err) {
        console.warn('[Ghost Drains] hand.f32.bin not loaded:', err);
      }
    } catch (err) {
      console.warn('[Ghost Drains] grid.meta.json not found:', err);
    }

    console.log('[Ghost Drains] Map loaded and configured with all active layers.');
  });

  map.on('error', (e: { error?: { message?: string } }) => {
    console.error('[Ghost Drains] Map error:', e.error?.message ?? e);
  });
}

function showFatalError(message: string): void {
  const banner = document.getElementById('error-banner');
  if (banner) {
    banner.textContent = message;
    banner.style.display = 'block';
  }
  const mapEl = document.getElementById('map');
  if (mapEl) {
    mapEl.style.display = 'none';
  }
}

// Boot
main();
