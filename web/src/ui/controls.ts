/**
 * UI controls and performance telemetry overlay for Spike S1.
 *
 * Manages:
 * - Live FPS & Frame Time display (benchmarking target hardware)
 * - Camera telemetry (zoom, pitch, bearing, coordinates)
 * - 3D Camera Orbit loop (continuous benchmarking)
 * - Mandatory Method & Limitations panel (docs/HONESTY_AND_LIMITATIONS.md)
 *
 * Source: docs/ROADMAP_TASKS.md Spike S1, docs/PRD.md F-01 & F-09
 */

import type * as maplibregl from 'maplibre-gl';
import { BENGALURU_CENTER, DEFAULT_ZOOM } from '../constants';
import { toggleLayer, LAYER_IDS } from '../map/layers';
import { FpsMeter } from './fps-meter';
import { LIMITATIONS_TEXT } from './limitations';

export interface SimController {
  isRunning: () => boolean;
  togglePlay: () => boolean;
  setRainRate: (rateMmH: number) => void;
  getRainRate: () => number;
  resetSim: () => void;
  getSimTime: () => number;
}

export function initControls(map: maplibregl.Map, simController?: SimController): void {
  const container = document.createElement('div');
  container.id = 'hud-container';
  container.style.position = 'fixed';
  container.style.inset = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '100';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  container.style.color = '#f8fafc';

  // 1. Performance & Telemetry Panel (Top-Left)
  const perfCard = document.createElement('div');
  perfCard.id = 'perf-card';
  perfCard.style.position = 'absolute';
  perfCard.style.top = '16px';
  perfCard.style.left = '16px';
  perfCard.style.pointerEvents = 'auto';
  perfCard.style.background = 'linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.88) 100%)';
  perfCard.style.backdropFilter = 'blur(12px)';
  perfCard.style.setProperty('-webkit-backdrop-filter', 'blur(12px)');
  perfCard.style.border = '1px solid rgba(56, 189, 248, 0.25)';
  perfCard.style.borderRadius = '10px';
  perfCard.style.padding = '14px 16px';
  perfCard.style.minWidth = '230px';
  perfCard.style.boxShadow = '0 12px 24px -4px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.05)';

  perfCard.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #38bdf8; box-shadow: 0 0 8px #38bdf8;"></span>
        <span style="font-size: 13px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #f8fafc;">Ghost Drains</span>
      </div>
      <span style="font-size: 10px; font-weight: 600; color: #38bdf8; background: rgba(14, 165, 233, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); padding: 2px 7px; border-radius: 9999px;">3D Bengaluru</span>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; font-family: monospace;">
      <div style="background: rgba(15, 23, 42, 0.6); padding: 6px 8px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.04);">
        <div style="font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">FPS Telemetry</div>
        <div id="telemetry-fps" style="font-size: 17px; font-weight: 700; color: #4ade80;">--</div>
      </div>
      <div style="background: rgba(15, 23, 42, 0.6); padding: 6px 8px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.04);">
        <div style="font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Frame Latency</div>
        <div id="telemetry-time" style="font-size: 17px; font-weight: 700; color: #f1f5f9;">-- ms</div>
      </div>
    </div>
    <div style="font-size: 11px; color: #94a3b8; line-height: 1.6; border-top: 1px solid rgba(148, 163, 184, 0.15); padding-top: 8px;">
      <div style="display: flex; justify-content: space-between;"><span>Pitch:</span> <span id="telemetry-pitch" style="color: #f1f5f9; font-family: monospace;">45°</span></div>
      <div style="display: flex; justify-content: space-between;"><span>Bearing:</span> <span id="telemetry-bearing" style="color: #f1f5f9; font-family: monospace;">0°</span></div>
      <div style="display: flex; justify-content: space-between;"><span>Zoom:</span> <span id="telemetry-zoom" style="color: #f1f5f9; font-family: monospace;">${DEFAULT_ZOOM}</span></div>
    </div>
    <div style="display: flex; gap: 6px; margin-top: 12px;">
      <button id="btn-orbit" style="flex: 1; padding: 7px 10px; font-size: 11px; font-weight: 600; background: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer; transition: background 0.2s; box-shadow: 0 2px 6px rgba(2, 132, 199, 0.4);">Start 3D Orbit</button>
      <button id="btn-reset" style="padding: 7px 10px; font-size: 11px; background: rgba(51, 65, 85, 0.85); color: #e2e8f0; border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 6px; cursor: pointer;">Reset</button>
    </div>
  `;
  container.appendChild(perfCard);

  // 1b. Top-Center Cinematic 3D Fly-To Navigation Bar
  const flyToBar = document.createElement('div');
  flyToBar.id = 'fly-to-bar';
  flyToBar.style.position = 'absolute';
  flyToBar.style.top = '16px';
  flyToBar.style.left = '50%';
  flyToBar.style.transform = 'translateX(-50%)';
  flyToBar.style.pointerEvents = 'auto';
  flyToBar.style.display = 'flex';
  flyToBar.style.alignItems = 'center';
  flyToBar.style.gap = '6px';
  flyToBar.style.background = 'linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.88) 100%)';
  flyToBar.style.backdropFilter = 'blur(12px)';
  flyToBar.style.setProperty('-webkit-backdrop-filter', 'blur(12px)');
  flyToBar.style.border = '1px solid rgba(56, 189, 248, 0.3)';
  flyToBar.style.borderRadius = '9999px';
  flyToBar.style.padding = '4px 6px';
  flyToBar.style.boxShadow = '0 10px 25px -4px rgba(0, 0, 0, 0.5), 0 0 15px rgba(56, 189, 248, 0.15)';

  const hotspots = [
    { name: '🌊 Bellandur', full: 'Bellandur Lake Basin', center: [77.672, 12.937], zoom: 14.5, pitch: 62, bearing: -25 },
    { name: '🏞️ Vrishabhavathi', full: 'Vrishabhavathi River Valley', center: [77.525, 12.925], zoom: 15.2, pitch: 60, bearing: 40 },
    { name: '🏢 Silk Board', full: 'Central Silk Board Junction', center: [77.622, 12.917], zoom: 15.4, pitch: 65, bearing: 15 },
    { name: '📍 Rainbow Drive', full: 'Rainbow Drive (ORR / Sarjapur)', center: [77.687, 12.906], zoom: 15.0, pitch: 65, bearing: -10 },
    { name: '🗺️ City Overview', full: 'Bengaluru 3D Overview', center: BENGALURU_CENTER, zoom: 11.5, pitch: 45, bearing: 0 },
  ];

  hotspots.forEach((spot) => {
    const btn = document.createElement('button');
    btn.textContent = spot.name;
    btn.title = spot.full;
    btn.style.padding = '6px 12px';
    btn.style.fontSize = '11px';
    btn.style.fontWeight = '600';
    btn.style.color = '#e2e8f0';
    btn.style.background = 'transparent';
    btn.style.border = 'none';
    btn.style.borderRadius = '9999px';
    btn.style.cursor = 'pointer';
    btn.style.transition = 'all 0.15s ease';
    btn.style.whiteSpace = 'nowrap';

    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(56, 189, 248, 0.2)';
      btn.style.color = '#38bdf8';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
      btn.style.color = '#e2e8f0';
    });
    btn.addEventListener('click', () => {
      map.flyTo({
        center: spot.center as [number, number],
        zoom: spot.zoom,
        pitch: spot.pitch,
        bearing: spot.bearing,
        essential: true,
        duration: 2200,
      });
    });
    flyToBar.appendChild(btn);
  });
  container.appendChild(flyToBar);

  // 1c. Layers & Rain Simulation Panel (Docked below perfCard)
  const simCard = document.createElement('div');
  simCard.id = 'sim-layers-card';
  simCard.style.position = 'absolute';
  simCard.style.top = '244px';
  simCard.style.left = '16px';
  simCard.style.pointerEvents = 'auto';
  simCard.style.background = 'linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.88) 100%)';
  simCard.style.backdropFilter = 'blur(12px)';
  simCard.style.setProperty('-webkit-backdrop-filter', 'blur(12px)');
  simCard.style.border = '1px solid rgba(56, 189, 248, 0.25)';
  simCard.style.borderRadius = '10px';
  simCard.style.padding = '14px 16px';
  simCard.style.width = '230px';
  simCard.style.boxShadow = '0 12px 24px -4px rgba(0, 0, 0, 0.45)';

  simCard.innerHTML = `
    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #38bdf8; margin-bottom: 10px; letter-spacing: 0.06em;">Visual Overlays</div>
    <label style="display: flex; align-items: center; gap: 8px; font-size: 11px; margin-bottom: 7px; cursor: pointer; color: #f1f5f9;">
      <input type="checkbox" id="toggle-flood-sites" checked style="accent-color: #f43f5e; cursor: pointer;" />
      <span style="color: #fda4af; font-weight: bold;">●</span> 2022 Flood Sites (Radar)
    </label>
    <label style="display: flex; align-items: center; gap: 8px; font-size: 11px; margin-bottom: 7px; cursor: pointer; color: #f1f5f9;">
      <input type="checkbox" id="toggle-ghost-drains" checked style="accent-color: #06b6d4; cursor: pointer;" />
      <span style="color: #67e8f9; font-weight: bold;">―</span> Ghost Drains (Terrain)
    </label>
    <label style="display: flex; align-items: center; gap: 8px; font-size: 11px; margin-bottom: 7px; cursor: pointer; color: #f1f5f9;">
      <input type="checkbox" id="toggle-official-swd" checked style="accent-color: #f59e0b; cursor: pointer;" />
      <span style="color: #fcd34d; font-weight: bold;">―</span> Official Storm Drains
    </label>
    <label style="display: flex; align-items: center; gap: 8px; font-size: 11px; margin-bottom: 7px; cursor: pointer; color: #f1f5f9;">
      <input type="checkbox" id="toggle-gap-view" checked style="accent-color: #ef4444; cursor: pointer;" />
      <span style="color: #fca5a5; font-weight: bold;">―</span> Gap Analysis
    </label>
    <label style="display: flex; align-items: center; gap: 8px; font-size: 11px; margin-bottom: 10px; cursor: pointer; color: #f1f5f9;">
      <input type="checkbox" id="toggle-water-sim" checked style="accent-color: #38bdf8; cursor: pointer;" />
      <span style="color: #38bdf8; font-weight: bold;">➔</span> Rain Flow Arrows & Drape
    </label>

    <div style="border-top: 1px solid rgba(148, 163, 184, 0.15); padding-top: 10px; margin-top: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #38bdf8; letter-spacing: 0.05em;">Rain Simulation</span>
        <span style="font-size: 9px; color: #94a3b8; background: rgba(51,65,85,0.6); padding: 1px 5px; border-radius: 4px;">Mei et al. GPU</span>
      </div>

      <div style="display: flex; gap: 6px; margin-bottom: 8px;">
        <button id="btn-sim-play" style="flex: 1; padding: 7px 8px; font-size: 11px; font-weight: 600; background: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer; box-shadow: 0 2px 6px rgba(2, 132, 199, 0.4);">▶ Start Replay</button>
        <button id="btn-sim-reset" style="padding: 7px 8px; font-size: 11px; background: rgba(51, 65, 85, 0.85); color: #e2e8f0; border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 6px; cursor: pointer;">↺ Clear</button>
      </div>

      <div style="display: flex; gap: 4px; margin-bottom: 8px;">
        <button id="preset-cloudburst" title="Sept 2022 Cloudburst Event" style="flex: 1; padding: 5px 6px; font-size: 10px; font-weight: 600; background: rgba(14, 165, 233, 0.2); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; border-radius: 4px; cursor: pointer;">🌧️ Cloudburst (130 mm)</button>
        <button id="preset-monsoon" title="Typical Monsoon Rain" style="flex: 1; padding: 5px 6px; font-size: 10px; font-weight: 600; background: rgba(51, 65, 85, 0.6); border: 1px solid rgba(148, 163, 184, 0.3); color: #cbd5e1; border-radius: 4px; cursor: pointer;">🌦️ Monsoon (50 mm)</button>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-bottom: 4px;">
        <span>Rain Rate:</span>
        <span id="label-rain-rate" style="color: #f1f5f9; font-weight: 700;">50 mm/h</span>
      </div>
      <input type="range" id="slider-rain-rate" min="0" max="150" value="50" step="5" style="width: 100%; accent-color: #0284c7; cursor: pointer; margin-bottom: 6px;" />

      <div style="font-size: 10px; color: #64748b; line-height: 1.3;">
        Illustrative virtual-pipe replay on terrain. Not flood prediction.
      </div>
    </div>
  `;
  container.appendChild(simCard);

  // 2. Limitations Button (Top-Right)
  const limitsBtn = document.createElement('button');
  limitsBtn.id = 'btn-limits';
  limitsBtn.style.position = 'absolute';
  limitsBtn.style.top = '16px';
  limitsBtn.style.right = '48px'; // Left of map controls
  limitsBtn.style.pointerEvents = 'auto';
  limitsBtn.style.background = 'linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.88) 100%)';
  limitsBtn.style.backdropFilter = 'blur(12px)';
  limitsBtn.style.setProperty('-webkit-backdrop-filter', 'blur(12px)');
  limitsBtn.style.border = '1px solid rgba(56, 189, 248, 0.25)';
  limitsBtn.style.borderRadius = '9999px';
  limitsBtn.style.padding = '8px 14px';
  limitsBtn.style.color = '#e2e8f0';
  limitsBtn.style.fontSize = '12px';
  limitsBtn.style.fontWeight = '600';
  limitsBtn.style.cursor = 'pointer';
  limitsBtn.style.boxShadow = '0 8px 16px -2px rgba(0, 0, 0, 0.4)';
  limitsBtn.textContent = 'ℹ️ Methods & Limitations';
  container.appendChild(limitsBtn);

  // 3. Limitations Modal Dialog
  const modal = document.createElement('div');
  modal.id = 'limits-modal';
  modal.style.display = 'none';
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
  modal.style.backdropFilter = 'blur(4px)';
  modal.style.zIndex = '200';
  modal.style.pointerEvents = 'auto';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';

  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = '#0f172a';
  modalContent.style.border = '1px solid rgba(148, 163, 184, 0.3)';
  modalContent.style.borderRadius = '12px';
  modalContent.style.padding = '24px';
  modalContent.style.maxWidth = '560px';
  modalContent.style.width = '90%';
  modalContent.style.maxHeight = '80vh';
  modalContent.style.overflowY = 'auto';
  modalContent.style.color = '#e2e8f0';
  modalContent.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';

  const listItems = LIMITATIONS_TEXT.map((t) => `<li style="margin-bottom: 8px; line-height: 1.5;">${t}</li>`).join('');

  modalContent.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="font-size: 16px; font-weight: 700; color: #38bdf8; margin: 0;">Methods, Sources & Limitations</h3>
      <button id="btn-close-modal" style="background: transparent; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; padding: 4px;">&times;</button>
    </div>
    <ul style="font-size: 13px; color: #cbd5e1; padding-left: 20px; margin: 0 0 16px 0;">
      ${listItems}
    </ul>
    <div style="font-size: 11px; color: #94a3b8; border-top: 1px solid rgba(148, 163, 184, 0.2); padding-top: 12px; line-height: 1.5;">
      <strong>Data Attribution:</strong> OpenFreeMap, OpenStreetMap contributors, Copernicus WorldDEM-30 (DLR/Airbus), EOX Sentinel-2 cloudless, Mapterhorn.
    </div>
  `;
  modal.appendChild(modalContent);
  container.appendChild(modal);

  document.body.appendChild(container);

  // Telemetry loop
  const meter = new FpsMeter();
  const fpsEl = document.getElementById('telemetry-fps');
  const timeEl = document.getElementById('telemetry-time');
  const pitchEl = document.getElementById('telemetry-pitch');
  const bearingEl = document.getElementById('telemetry-bearing');
  const zoomEl = document.getElementById('telemetry-zoom');

  function renderTelemetry(now: number): void {
    const { fps, frameTimeMs } = meter.tick(now);
    if (fpsEl && timeEl) {
      fpsEl.textContent = `${fps}`;
      fpsEl.style.color = fps >= 45 ? '#4ade80' : fps >= 25 ? '#fbbf24' : '#f87171';
      timeEl.textContent = `${frameTimeMs} ms`;
    }
    requestAnimationFrame(renderTelemetry);
  }
  requestAnimationFrame(renderTelemetry);

  // Map camera listeners
  map.on('move', () => {
    if (pitchEl) pitchEl.textContent = `${Math.round(map.getPitch())}°`;
    if (bearingEl) bearingEl.textContent = `${Math.round(map.getBearing())}°`;
    if (zoomEl) zoomEl.textContent = `${map.getZoom().toFixed(1)}`;
  });

  // 3D Orbit loop
  let isOrbiting = false;
  let orbitRafId: number | null = null;
  const orbitBtn = document.getElementById('btn-orbit') as HTMLButtonElement | null;

  function orbitStep(): void {
    if (!isOrbiting) return;
    map.setBearing((map.getBearing() + 0.2) % 360);
    orbitRafId = requestAnimationFrame(orbitStep);
  }

  orbitBtn?.addEventListener('click', () => {
    isOrbiting = !isOrbiting;
    if (isOrbiting) {
      orbitBtn.textContent = 'Stop Orbit';
      orbitBtn.style.backgroundColor = '#dc2626';
      orbitStep();
    } else {
      orbitBtn.textContent = 'Start 3D Orbit';
      orbitBtn.style.backgroundColor = '#0284c7';
      if (orbitRafId !== null) cancelAnimationFrame(orbitRafId);
    }
  });

  // Reset button
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    isOrbiting = false;
    if (orbitBtn) {
      orbitBtn.textContent = 'Start 3D Orbit';
      orbitBtn.style.backgroundColor = '#0284c7';
    }
    if (orbitRafId !== null) cancelAnimationFrame(orbitRafId);
    map.flyTo({
      center: BENGALURU_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: 45,
      bearing: 0,
      essential: true,
    });
  });

  // Modal interactions
  limitsBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
  });
  document.getElementById('btn-close-modal')?.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // Layer toggles
  const hookToggle = (checkboxId: string, layerId: string) => {
    const el = document.getElementById(checkboxId) as HTMLInputElement | null;
    el?.addEventListener('change', () => {
      toggleLayer(map, layerId, el.checked);
    });
  };
  hookToggle('toggle-flood-sites', LAYER_IDS.FLOOD_SITES);
  hookToggle('toggle-ghost-drains', LAYER_IDS.GHOST_DRAINS);
  hookToggle('toggle-official-swd', LAYER_IDS.OFFICIAL_SWD);
  hookToggle('toggle-gap-view', LAYER_IDS.GAP_VIEW);
  hookToggle('toggle-water-sim', LAYER_IDS.WATER_SIM);

  // Simulation controls
  const playBtn = document.getElementById('btn-sim-play') as HTMLButtonElement | null;
  const resetSimBtn = document.getElementById('btn-sim-reset') as HTMLButtonElement | null;
  const rainSlider = document.getElementById('slider-rain-rate') as HTMLInputElement | null;
  const rainLabel = document.getElementById('label-rain-rate');

  playBtn?.addEventListener('click', () => {
    if (!simController) return;
    const running = simController.togglePlay();
    if (playBtn) {
      playBtn.textContent = running ? '⏸ Pause' : '▶ Start Replay';
      playBtn.style.backgroundColor = running ? '#e11d48' : '#0284c7';
    }
  });

  resetSimBtn?.addEventListener('click', () => {
    if (!simController) return;
    simController.resetSim();
    if (playBtn) {
      playBtn.textContent = '▶ Start Replay';
      playBtn.style.backgroundColor = '#0284c7';
    }
  });

  rainSlider?.addEventListener('input', () => {
    const val = Number(rainSlider.value);
    if (rainLabel) rainLabel.textContent = `${val} mm/h`;
    if (simController) simController.setRainRate(val);
  });

  const cloudburstBtn = document.getElementById('preset-cloudburst');
  const monsoonBtn = document.getElementById('preset-monsoon');

  cloudburstBtn?.addEventListener('click', () => {
    if (!simController) return;
    simController.setRainRate(130);
    if (rainSlider) rainSlider.value = '130';
    if (rainLabel) rainLabel.textContent = '130 mm/h';
    if (!simController.isRunning()) {
      simController.togglePlay();
      if (playBtn) {
        playBtn.textContent = '⏸ Pause';
        playBtn.style.backgroundColor = '#e11d48';
      }
    }
  });

  monsoonBtn?.addEventListener('click', () => {
    if (!simController) return;
    simController.setRainRate(50);
    if (rainSlider) rainSlider.value = '50';
    if (rainLabel) rainLabel.textContent = '50 mm/h';
    if (!simController.isRunning()) {
      simController.togglePlay();
      if (playBtn) {
        playBtn.textContent = '⏸ Pause';
        playBtn.style.backgroundColor = '#e11d48';
      }
    }
  });
}

