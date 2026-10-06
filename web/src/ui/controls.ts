/**
 * UI Controls, Layer Management, and Atmospheric Simulation Dock.
 *
 * Impeccable Spatial Experience:
 * - Collapsible Left Studio Dock (Overlays, Gap Analysis, What-If Ridge Barrier)
 * - Bottom-Center Atmospheric Replay Dock (Virtual-Pipe Rain Engine)
 * - Top-Right Telemetry & 3D Orbit Micro-Pill
 * - Deep URL Hash State Synchronization (F-10 / M3)
 *
 * Conforms to Nordic Slate & Emerald / Midnight Cyber Neon palette,
 * 8pt harmonic grid, and zero visual clutter.
 */

import type * as maplibregl from 'maplibre-gl';
import { BENGALURU_CENTER, DEFAULT_ZOOM } from '../constants';
import { toggleLayer, LAYER_IDS } from '../map/layers';
import { FpsMeter } from './fps-meter';
import { LIMITATIONS_TEXT } from './limitations';
import { parseHashState, syncHashState } from './hash-state';
import { fetchLiveBengaluruWeather } from '../data/weather-service';

export interface SimController {
  isRunning: () => boolean;
  togglePlay: () => boolean;
  setRainRate: (rateMmH: number) => void;
  getRainRate: () => number;
  resetSim: () => void;
  getSimTime: () => number;
  isBarrierMode?: () => boolean;
  toggleBarrierMode?: () => boolean;
  resetTerrain?: () => void;
}

export function initControls(map: maplibregl.Map, simController?: SimController): void {
  const container = document.createElement('div');
  container.id = 'hud-container';
  container.style.position = 'fixed';
  container.style.inset = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '100';
  container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  container.style.color = '#f8fafc';

  // =========================================================================
  // 1. LEFT COLLAPSIBLE HYDRAULIC STUDIO DOCK
  // =========================================================================
  const studioCard = document.createElement('div');
  studioCard.id = 'sim-layers-card';
  studioCard.style.position = 'absolute';
  studioCard.style.top = '60px';
  studioCard.style.left = '16px';
  studioCard.style.pointerEvents = 'auto';
  studioCard.style.background = 'rgba(15, 23, 42, 0.88)';
  studioCard.style.backdropFilter = 'blur(20px)';
  studioCard.style.setProperty('-webkit-backdrop-filter', 'blur(20px)');
  studioCard.style.border = '1px solid rgba(56, 189, 248, 0.2)';
  studioCard.style.borderRadius = '12px';
  studioCard.style.padding = '12px 14px';
  studioCard.style.width = '240px';
  studioCard.style.boxShadow = '0 16px 36px -4px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.04)';
  studioCard.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)';

  studioCard.innerHTML = `
    <!-- Studio Header -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
      <div style="display: flex; align-items: center; gap: 7px;">
        <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #38bdf8; box-shadow: 0 0 8px #38bdf8;"></span>
        <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #f8fafc;">Hydraulic Studio</span>
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span id="badge-active-layers" style="font-size: 9px; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.15); padding: 1px 6px; border-radius: 9999px;">5 Active</span>
        <button id="btn-collapse-studio" title="Minimize Panel" style="background: rgba(255, 255, 255, 0.08); border: none; color: #94a3b8; font-size: 11px; width: 20px; height: 20px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease;">—</button>
      </div>
    </div>

    <!-- Collapsible Body -->
    <div id="studio-body" style="transition: opacity 0.2s ease;">
      <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.06em; margin-bottom: 6px;">Analysis Overlays</div>

      <!-- Overlays Group -->
      <div style="display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px;">
        <label style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #f1f5f9; cursor: pointer; padding: 3px 4px; border-radius: 4px; transition: background 0.15s;">
          <span style="display: flex; align-items: center; gap: 7px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #f43f5e; box-shadow: 0 0 6px #f43f5e;"></span>
            <span>2022 Flood Sites</span>
          </span>
          <input type="checkbox" id="toggle-flood-sites" checked style="accent-color: #f43f5e; cursor: pointer;" />
        </label>

        <label style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #f1f5f9; cursor: pointer; padding: 3px 4px; border-radius: 4px; transition: background 0.15s;">
          <span style="display: flex; align-items: center; gap: 7px;">
            <span style="display: inline-block; width: 10px; height: 3px; border-radius: 2px; background: #06b6d4; box-shadow: 0 0 6px #06b6d4;"></span>
            <span>Ghost Drains (Terrain)</span>
          </span>
          <input type="checkbox" id="toggle-ghost-drains" checked style="accent-color: #06b6d4; cursor: pointer;" />
        </label>

        <label style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #f1f5f9; cursor: pointer; padding: 3px 4px; border-radius: 4px; transition: background 0.15s;">
          <span style="display: flex; align-items: center; gap: 7px;">
            <span style="display: inline-block; width: 10px; height: 3px; border-radius: 2px; background: #f59e0b; box-shadow: 0 0 6px #f59e0b;"></span>
            <span>Official Storm Drains</span>
          </span>
          <input type="checkbox" id="toggle-official-swd" checked style="accent-color: #f59e0b; cursor: pointer;" />
        </label>

        <label style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #f1f5f9; cursor: pointer; padding: 3px 4px; border-radius: 4px; transition: background 0.15s;">
          <span style="display: flex; align-items: center; gap: 7px;">
            <span style="display: inline-block; width: 10px; height: 3px; border-radius: 2px; background: #ef4444; box-shadow: 0 0 6px #ef4444;"></span>
            <span>Drainage Gap Corridors</span>
          </span>
          <input type="checkbox" id="toggle-gap-view" checked style="accent-color: #ef4444; cursor: pointer;" />
        </label>

        <label style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #f1f5f9; cursor: pointer; padding: 3px 4px; border-radius: 4px; transition: background 0.15s;">
          <span style="display: flex; align-items: center; gap: 7px;">
            <span style="color: #38bdf8; font-size: 10px;">➔</span>
            <span>Flow Streamlines</span>
          </span>
          <input type="checkbox" id="toggle-water-sim" checked style="accent-color: #38bdf8; cursor: pointer;" />
        </label>

        <label style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #f1f5f9; cursor: pointer; padding: 3px 4px; border-radius: 4px; transition: background 0.15s;">
          <span style="display: flex; align-items: center; gap: 7px;">
            <span style="color: #0284c7; font-size: 10px;">▦</span>
            <span>Natural Ponding Sinks</span>
          </span>
          <input type="checkbox" id="toggle-ponding" style="accent-color: #0284c7; cursor: pointer;" />
        </label>

        <label style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #f1f5f9; cursor: pointer; padding: 3px 4px; border-radius: 4px; transition: background 0.15s;">
          <span style="display: flex; align-items: center; gap: 7px;">
            <span style="color: #10b981; font-size: 10px;">▦</span>
            <span>HAND Susceptibility</span>
          </span>
          <input type="checkbox" id="toggle-hand" style="accent-color: #10b981; cursor: pointer;" />
        </label>
      </div>

      <!-- What-If Ridge Barrier Section -->
      <div style="border-top: 1px solid rgba(148, 163, 184, 0.15); padding-top: 9px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">What-If Ridge Barrier</span>
          <span id="badge-barrier-status" style="font-size: 9px; color: #94a3b8; background: rgba(51, 65, 85, 0.6); padding: 1px 5px; border-radius: 4px;">Off</span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button id="btn-toggle-barrier" style="flex: 1; padding: 6px 8px; font-size: 10.5px; font-weight: 600; background: rgba(14, 165, 233, 0.2); border: 1px solid rgba(56, 189, 248, 0.35); color: #38bdf8; border-radius: 6px; cursor: pointer; transition: all 0.2s;">🧱 Draw Ridge (+5m)</button>
          <button id="btn-reset-terrain" title="Restore pristine terrain" style="padding: 6px 9px; font-size: 10.5px; background: rgba(51, 65, 85, 0.7); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 6px; cursor: pointer;">↺</button>
        </div>
      </div>
    </div>
  `;
  container.appendChild(studioCard);

  // Studio collapse behavior
  let isStudioCollapsed = false;
  const studioBody = studioCard.querySelector('#studio-body') as HTMLElement | null;
  const collapseBtn = studioCard.querySelector('#btn-collapse-studio') as HTMLButtonElement | null;

  collapseBtn?.addEventListener('click', () => {
    isStudioCollapsed = !isStudioCollapsed;
    if (isStudioCollapsed) {
      if (studioBody) studioBody.style.display = 'none';
      studioCard.style.padding = '8px 12px';
      collapseBtn.textContent = '+';
      collapseBtn.title = 'Expand Studio';
    } else {
      if (studioBody) studioBody.style.display = 'block';
      studioCard.style.padding = '12px 14px';
      collapseBtn.textContent = '—';
      collapseBtn.title = 'Minimize Panel';
    }
  });

  // =========================================================================
  // 2. TOP-RIGHT TELEMETRY & 3D ORBIT MICRO-PILL
  // =========================================================================
  const telemetryPill = document.createElement('div');
  telemetryPill.id = 'telemetry-pill';
  telemetryPill.style.position = 'absolute';
  telemetryPill.style.top = '60px';
  telemetryPill.style.right = '16px';
  telemetryPill.style.pointerEvents = 'auto';
  telemetryPill.style.display = 'flex';
  telemetryPill.style.alignItems = 'center';
  telemetryPill.style.gap = '8px';
  telemetryPill.style.background = 'rgba(15, 23, 42, 0.85)';
  telemetryPill.style.backdropFilter = 'blur(16px)';
  telemetryPill.style.setProperty('-webkit-backdrop-filter', 'blur(16px)');
  telemetryPill.style.border = '1px solid rgba(148, 163, 184, 0.18)';
  telemetryPill.style.borderRadius = '9999px';
  telemetryPill.style.padding = '4px 10px';
  telemetryPill.style.boxShadow = '0 8px 24px -2px rgba(0, 0, 0, 0.45)';
  telemetryPill.style.fontFamily = 'monospace';
  telemetryPill.style.fontSize = '11px';

  telemetryPill.innerHTML = `
    <div style="display: flex; align-items: center; gap: 5px;">
      <span id="telemetry-fps" style="color: #4ade80; font-weight: 700;">60</span>
      <span style="color: #64748b;">FPS</span>
    </div>
    <span style="color: rgba(148, 163, 184, 0.3);">•</span>
    <span id="telemetry-time" style="color: #cbd5e1;">16.6 ms</span>
    <span style="color: rgba(148, 163, 184, 0.3);">•</span>
    <button id="btn-orbit" style="padding: 3px 8px; font-size: 10px; font-weight: 600; background: rgba(14, 165, 233, 0.25); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; border-radius: 9999px; cursor: pointer; transition: all 0.15s ease;">🔄 3D Orbit</button>
    <button id="btn-reset" title="Reset Camera" style="padding: 3px 7px; font-size: 10px; background: rgba(51, 65, 85, 0.6); border: 1px solid rgba(148, 163, 184, 0.25); color: #94a3b8; border-radius: 9999px; cursor: pointer;">↺</button>

    <!-- Hidden elements for test and listener compat -->
    <span id="telemetry-pitch" style="display:none">45°</span>
    <span id="telemetry-bearing" style="display:none">0°</span>
    <span id="telemetry-zoom" style="display:none">${DEFAULT_ZOOM}</span>
  `;
  container.appendChild(telemetryPill);

  // =========================================================================
  // 3. BOTTOM-CENTER FLOATING ATMOSPHERIC REPLAY CONSOLE
  // =========================================================================
  const replayDock = document.createElement('div');
  replayDock.id = 'sim-replay-dock';
  replayDock.style.position = 'absolute';
  replayDock.style.bottom = '24px';
  replayDock.style.left = '50%';
  replayDock.style.transform = 'translateX(-50%)';
  replayDock.style.pointerEvents = 'auto';
  replayDock.style.display = 'flex';
  replayDock.style.alignItems = 'center';
  replayDock.style.gap = '10px';
  replayDock.style.background = 'rgba(15, 23, 42, 0.90)';
  replayDock.style.backdropFilter = 'blur(20px)';
  replayDock.style.setProperty('-webkit-backdrop-filter', 'blur(20px)');
  replayDock.style.border = '1px solid rgba(56, 189, 248, 0.28)';
  replayDock.style.borderRadius = '9999px';
  replayDock.style.padding = '6px 14px';
  replayDock.style.boxShadow = '0 16px 36px -4px rgba(0, 0, 0, 0.65), 0 0 20px rgba(56, 189, 248, 0.15)';
  replayDock.style.zIndex = '120';

  replayDock.innerHTML = `
    <!-- Play/Pause Accent Button -->
    <button id="btn-sim-play" style="display: flex; align-items: center; gap: 6px; padding: 6px 14px; font-size: 11.5px; font-weight: 700; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: white; border: none; border-radius: 9999px; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);">
      <span>▶</span>
      <span>Start Replay</span>
    </button>

    <!-- Presets -->
    <div style="display: flex; align-items: center; gap: 4px;">
      <button id="preset-monsoon" title="Typical Monsoon: 50 mm/h" style="padding: 4px 8px; font-size: 10px; font-weight: 600; background: rgba(51, 65, 85, 0.6); border: 1px solid rgba(148, 163, 184, 0.25); color: #cbd5e1; border-radius: 9999px; cursor: pointer; transition: all 0.15s ease;">🌦️ 50 mm/h</button>
      <button id="preset-cloudburst" title="Sept 2022 Cloudburst: 130 mm/h" style="padding: 4px 8px; font-size: 10px; font-weight: 600; background: rgba(14, 165, 233, 0.2); border: 1px solid rgba(56, 189, 248, 0.35); color: #38bdf8; border-radius: 9999px; cursor: pointer; transition: all 0.15s ease;">🌧️ 130 mm/h</button>
      <button id="btn-live-weather" title="Sync live Open-Meteo precipitation & cloudburst forecast for Bengaluru" style="padding: 4px 8px; font-size: 10px; font-weight: 600; background: rgba(52, 211, 153, 0.15); border: 1px solid rgba(52, 211, 153, 0.35); color: #34d399; border-radius: 9999px; cursor: pointer; transition: all 0.15s ease;">⚡ Live Weather</button>
    </div>

    <span style="color: rgba(148, 163, 184, 0.25);">|</span>

    <!-- Slider & Dynamic Label -->
    <div style="display: flex; align-items: center; gap: 8px;">
      <span id="label-rain-rate" style="font-size: 11px; font-weight: 700; color: #38bdf8; font-family: monospace; min-width: 48px;">50 mm/h</span>
      <input type="range" id="slider-rain-rate" min="0" max="150" value="50" step="5" style="width: 80px; accent-color: #0284c7; cursor: pointer;" />
    </div>

    <span style="color: rgba(148, 163, 184, 0.25);">|</span>

    <!-- Clear Button -->
    <button id="btn-sim-reset" title="Clear water runoff" style="padding: 4px 8px; font-size: 10px; font-weight: 600; background: rgba(51, 65, 85, 0.6); border: 1px solid rgba(148, 163, 184, 0.2); color: #94a3b8; border-radius: 9999px; cursor: pointer;">↺ Clear</button>
  `;
  container.appendChild(replayDock);

  // =========================================================================
  // 4. SCIENTIFIC METHODS & HONESTY AUDIT MODAL
  // =========================================================================
  const modal = document.createElement('div');
  modal.id = 'limits-modal';
  modal.style.display = 'none';
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.backgroundColor = 'rgba(9, 13, 22, 0.75)';
  modal.style.backdropFilter = 'blur(16px)';
  modal.style.setProperty('-webkit-backdrop-filter', 'blur(16px)');
  modal.style.zIndex = '1000';
  modal.style.pointerEvents = 'auto';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';

  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = '#0f172a';
  modalContent.style.border = '1px solid rgba(56, 189, 248, 0.25)';
  modalContent.style.borderRadius = '14px';
  modalContent.style.padding = '24px';
  modalContent.style.maxWidth = '580px';
  modalContent.style.width = '90%';
  modalContent.style.maxHeight = '82vh';
  modalContent.style.overflowY = 'auto';
  modalContent.style.color = '#e2e8f0';
  modalContent.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)';

  const listItems = LIMITATIONS_TEXT.map((t) => `<li style="margin-bottom: 8px; line-height: 1.5;">${t}</li>`).join('');

  modalContent.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h3 style="font-size: 16px; font-weight: 700; color: #38bdf8; margin: 0;">Scientific Methods & Validation Audit</h3>
      <button id="btn-close-modal" style="background: transparent; border: none; color: #94a3b8; font-size: 22px; cursor: pointer; padding: 2px 6px;">&times;</button>
    </div>

    <!-- Navigation Tabs -->
    <div style="display: flex; gap: 12px; border-bottom: 1px solid rgba(148, 163, 184, 0.2); margin-bottom: 16px;">
      <button id="tab-btn-limits" style="background: none; border: none; color: #38bdf8; font-weight: 700; font-size: 12px; cursor: pointer; border-bottom: 2px solid #38bdf8; padding-bottom: 6px;">Methods & Policy</button>
      <button id="tab-btn-validation" style="background: none; border: none; color: #94a3b8; font-weight: 600; font-size: 12px; cursor: pointer; border-bottom: 2px solid transparent; padding-bottom: 6px;">V1–V4 Empirical Validation</button>
      <button id="tab-btn-attribution" style="background: none; border: none; color: #94a3b8; font-weight: 600; font-size: 12px; cursor: pointer; border-bottom: 2px solid transparent; padding-bottom: 6px;">Licenses & Attribution</button>
    </div>

    <!-- Tab 1: Limitations & Policy -->
    <div id="tab-panel-limits">
      <ul style="font-size: 12px; color: #cbd5e1; padding-left: 20px; margin: 0 0 16px 0; line-height: 1.6;">
        ${listItems}
      </ul>
      <div style="font-size: 11px; color: #94a3b8; background: rgba(15, 23, 42, 0.6); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(148, 163, 184, 0.15); line-height: 1.5;">
        <strong>Honesty Policy:</strong> This application visualizes terrain-derived natural flow paths at ~30 m resolution. It does not provide property-level risk assessments, municipal warnings, or encroachment designations.
      </div>
    </div>

    <!-- Tab 2: V1-V4 Empirical Validation (M6) -->
    <div id="tab-panel-validation" style="display: none; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
      <div style="background: rgba(14, 165, 233, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 6px; padding: 10px; margin-bottom: 12px;">
        <div style="font-weight: 700; color: #38bdf8; margin-bottom: 4px;">V2 Flood-Site Lift Metric: 6.1× Over Null Baseline</div>
        <div>11 of 12 (91.7%) documented Sept 2022 flood impact sites align inside top HAND susceptibility zones (&le;2m) compared to a 15% random built-up baseline area in Bengaluru.</div>
      </div>

      <div style="margin-bottom: 10px;">
        <strong style="color: #f1f5f9;">V1 Stream Agreement:</strong> 68.4% of terrain-derived natural flow paths overlap with official SWD or OSM waterways within a 60m buffer tolerance across the 500-cell accumulation threshold sweep.
      </div>

      <div style="margin-bottom: 10px;">
        <strong style="color: #f1f5f9;">V3 DEM A/B Analysis:</strong> Copernicus GLO-30 evaluated against FABDEM. GLO-30 models regional lake valleys and macro-catchments (21.7m max depression in Bellandur basin), while urban core building canopies cause localized surface noise.
      </div>

      <div style="background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.25); border-radius: 6px; padding: 10px; margin-bottom: 12px;">
        <div style="font-weight: 700; color: #fb7185; margin-bottom: 4px;">V4 Sensitivity & Explicit Failure Analysis</div>
        <div><strong>Outlier Case:</strong> Central Silk Board junction recorded moderate HAND (3.4m). Investigation revealed waterlogging was triggered by localized micro-drain inlet clogging beneath the elevated flyover rather than macro-topographic valley convergence. A 30m DEM cannot resolve sub-grid culverts or storm grate blockages.</div>
      </div>
    </div>

    <!-- Tab 3: Licenses & Attribution (M7) -->
    <div id="tab-panel-attribution" style="display: none; font-size: 12px; color: #cbd5e1; line-height: 1.6;">
      <div style="margin-bottom: 8px;">
        <strong style="color: #f1f5f9;">Elevation Data:</strong> Copernicus WorldDEM-30 &copy; DLR e.V. 2010–2014 and &copy; Airbus Defence and Space GmbH 2014–2018. Free public license with attribution.
      </div>
      <div style="margin-bottom: 8px;">
        <strong style="color: #f1f5f9;">Stormwater Drains Map:</strong> Karnataka State Remote Sensing Applications Centre (KSRSAC) via OpenCity.in (2022 edition).
      </div>
      <div style="margin-bottom: 8px;">
        <strong style="color: #f1f5f9;">Satellite Drape:</strong> Esri World Imagery (Maxar, Earthstar Geographics) and Sentinel-2 cloudless &copy; EOX IT Services GmbH.
      </div>
      <div style="margin-bottom: 8px;">
        <strong style="color: #f1f5f9;">Base Map & 3D Terrain:</strong> &copy; OpenFreeMap, &copy; OpenStreetMap contributors, &copy; Mapterhorn.
      </div>
      <div style="margin-bottom: 4px;">
        <strong style="color: #f1f5f9;">Ground Truth Observations:</strong> Reported 4–6 Sept 2022 flood impact sites geocoded from OpenStreetMap with citations to The News Minute and ReliefWeb/MHA.
      </div>
    </div>
  `;
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  document.body.appendChild(container);

  // =========================================================================
  // 5. EVENT LISTENERS & LIFECYCLE HOOKS
  // =========================================================================

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
      orbitBtn.textContent = '⏹ Stop Orbit';
      orbitBtn.style.backgroundColor = '#dc2626';
      orbitBtn.style.color = '#ffffff';
      orbitStep();
    } else {
      orbitBtn.textContent = '🔄 3D Orbit';
      orbitBtn.style.backgroundColor = 'rgba(14, 165, 233, 0.25)';
      orbitBtn.style.color = '#38bdf8';
      if (orbitRafId !== null) cancelAnimationFrame(orbitRafId);
    }
  });

  // Reset Camera button
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    isOrbiting = false;
    if (orbitBtn) {
      orbitBtn.textContent = '🔄 3D Orbit';
      orbitBtn.style.backgroundColor = 'rgba(14, 165, 233, 0.25)';
      orbitBtn.style.color = '#38bdf8';
    }
    if (orbitRafId !== null) cancelAnimationFrame(orbitRafId);
    map.flyTo({
      center: BENGALURU_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: 45,
      bearing: 0,
      essential: true,
      duration: 2000,
    });
  });

  // Modal interactions
  document.getElementById('btn-close-modal')?.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // Modal tab switching
  const tabBtnLimits = document.getElementById('tab-btn-limits');
  const tabBtnValidation = document.getElementById('tab-btn-validation');
  const tabBtnAttribution = document.getElementById('tab-btn-attribution');
  const panelLimits = document.getElementById('tab-panel-limits');
  const panelValidation = document.getElementById('tab-panel-validation');
  const panelAttribution = document.getElementById('tab-panel-attribution');

  const switchTab = (activeTab: 'limits' | 'validation' | 'attribution') => {
    if (panelLimits) panelLimits.style.display = activeTab === 'limits' ? 'block' : 'none';
    if (panelValidation) panelValidation.style.display = activeTab === 'validation' ? 'block' : 'none';
    if (panelAttribution) panelAttribution.style.display = activeTab === 'attribution' ? 'block' : 'none';

    if (tabBtnLimits) {
      tabBtnLimits.style.color = activeTab === 'limits' ? '#38bdf8' : '#94a3b8';
      tabBtnLimits.style.borderBottom = activeTab === 'limits' ? '2px solid #38bdf8' : '2px solid transparent';
      tabBtnLimits.style.fontWeight = activeTab === 'limits' ? '700' : '600';
    }
    if (tabBtnValidation) {
      tabBtnValidation.style.color = activeTab === 'validation' ? '#38bdf8' : '#94a3b8';
      tabBtnValidation.style.borderBottom = activeTab === 'validation' ? '2px solid #38bdf8' : '2px solid transparent';
      tabBtnValidation.style.fontWeight = activeTab === 'validation' ? '700' : '600';
    }
    if (tabBtnAttribution) {
      tabBtnAttribution.style.color = activeTab === 'attribution' ? '#38bdf8' : '#94a3b8';
      tabBtnAttribution.style.borderBottom = activeTab === 'attribution' ? '2px solid #38bdf8' : '2px solid transparent';
      tabBtnAttribution.style.fontWeight = activeTab === 'attribution' ? '700' : '600';
    }
  };

  tabBtnLimits?.addEventListener('click', () => switchTab('limits'));
  tabBtnValidation?.addEventListener('click', () => switchTab('validation'));
  tabBtnAttribution?.addEventListener('click', () => switchTab('attribution'));

  // Active layers counter updater
  const updateActiveLayersBadge = () => {
    const badge = document.getElementById('badge-active-layers');
    if (!badge) return;
    const checkboxes = [
      'toggle-flood-sites',
      'toggle-ghost-drains',
      'toggle-official-swd',
      'toggle-gap-view',
      'toggle-water-sim',
      'toggle-ponding',
      'toggle-hand',
    ];
    let active = 0;
    checkboxes.forEach((id) => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el?.checked) active++;
    });
    badge.textContent = `${active} Active`;
  };

  // Layer toggles with URL hash sync
  const hookToggle = (checkboxId: string, layerId: string) => {
    const el = document.getElementById(checkboxId) as HTMLInputElement | null;
    el?.addEventListener('change', () => {
      toggleLayer(map, layerId, el.checked);
      updateActiveLayersBadge();
      updateUrlHash();
    });
  };
  hookToggle('toggle-flood-sites', LAYER_IDS.FLOOD_SITES);
  hookToggle('toggle-ghost-drains', LAYER_IDS.GHOST_DRAINS);
  hookToggle('toggle-official-swd', LAYER_IDS.OFFICIAL_SWD);
  hookToggle('toggle-gap-view', LAYER_IDS.GAP_VIEW);
  hookToggle('toggle-water-sim', LAYER_IDS.WATER_SIM);
  hookToggle('toggle-ponding', LAYER_IDS.PONDING);
  hookToggle('toggle-hand', LAYER_IDS.HAND);

  // What-If Ridge Barrier tool interactions (F-07 / M6)
  const barrierBtn = document.getElementById('btn-toggle-barrier') as HTMLButtonElement | null;
  const resetTerrainBtn = document.getElementById('btn-reset-terrain') as HTMLButtonElement | null;
  const barrierBadge = document.getElementById('badge-barrier-status');

  barrierBtn?.addEventListener('click', () => {
    if (!simController?.toggleBarrierMode) return;
    const active = simController.toggleBarrierMode();
    if (barrierBtn) {
      barrierBtn.textContent = active ? '🛑 Stop Drawing' : '🧱 Draw Ridge (+5m)';
      barrierBtn.style.backgroundColor = active ? '#e11d48' : 'rgba(14, 165, 233, 0.2)';
      barrierBtn.style.color = active ? '#ffffff' : '#38bdf8';
      barrierBtn.style.boxShadow = active ? '0 0 12px rgba(225, 29, 72, 0.5)' : 'none';
    }
    if (barrierBadge) {
      barrierBadge.textContent = active ? 'Active (Click Map)' : 'Off';
      barrierBadge.style.color = active ? '#38bdf8' : '#94a3b8';
    }
    if (active) {
      showToast('🧱 Ridge Barrier Tool: Click anywhere on map to raise +5m terrain ridge');
    }
  });

  resetTerrainBtn?.addEventListener('click', () => {
    if (!simController?.resetTerrain) return;
    simController.resetTerrain();
    if (barrierBadge) {
      barrierBadge.textContent = 'Reset to Base';
      setTimeout(() => {
        if (barrierBadge) barrierBadge.textContent = 'Off';
      }, 1500);
    }
    showToast('↺ All artificial ridge barriers cleared. Terrain reset to baseline.');
  });

  // Simulation controls (Bottom Dock)
  const playBtn = document.getElementById('btn-sim-play') as HTMLButtonElement | null;
  const resetSimBtn = document.getElementById('btn-sim-reset') as HTMLButtonElement | null;
  const rainSlider = document.getElementById('slider-rain-rate') as HTMLInputElement | null;
  const rainLabel = document.getElementById('label-rain-rate');

  playBtn?.addEventListener('click', () => {
    if (!simController) return;
    const running = simController.togglePlay();
    if (playBtn) {
      playBtn.innerHTML = running ? '<span>⏸</span><span>Pause</span>' : '<span>▶</span><span>Start Replay</span>';
      playBtn.style.background = running
        ? 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)'
        : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)';
    }
  });

  resetSimBtn?.addEventListener('click', () => {
    if (!simController) return;
    simController.resetSim();
    if (playBtn) {
      playBtn.innerHTML = '<span>▶</span><span>Start Replay</span>';
      playBtn.style.background = 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)';
    }
  });

  rainSlider?.addEventListener('input', () => {
    const val = Number(rainSlider.value);
    if (rainLabel) rainLabel.textContent = `${val} mm/h`;
    if (simController) simController.setRainRate(val);
    updateUrlHash();
  });

  const cloudburstBtn = document.getElementById('preset-cloudburst');
  const monsoonBtn = document.getElementById('preset-monsoon');

  cloudburstBtn?.addEventListener('click', () => {
    if (!simController) return;
    simController.setRainRate(130);
    if (rainSlider) rainSlider.value = '130';
    if (rainLabel) rainLabel.textContent = '130 mm/h';
    updateUrlHash();
    if (!simController.isRunning()) {
      simController.togglePlay();
      if (playBtn) {
        playBtn.innerHTML = '<span>⏸</span><span>Pause</span>';
        playBtn.style.background = 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)';
      }
    }
  });

  monsoonBtn?.addEventListener('click', () => {
    if (!simController) return;
    simController.setRainRate(50);
    if (rainSlider) rainSlider.value = '50';
    if (rainLabel) rainLabel.textContent = '50 mm/h';
    updateUrlHash();
    if (!simController.isRunning()) {
      simController.togglePlay();
      if (playBtn) {
        playBtn.innerHTML = '<span>⏸</span><span>Pause</span>';
        playBtn.style.background = 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)';
      }
    }
  });

  // Live Open-Meteo Weather Synchronization
  const liveWeatherBtn = document.getElementById('btn-live-weather') as HTMLButtonElement | null;

  liveWeatherBtn?.addEventListener('click', async () => {
    if (!simController) return;
    if (liveWeatherBtn) liveWeatherBtn.textContent = '⏳ Fetching...';
    try {
      const weather = await fetchLiveBengaluruWeather();
      let targetRate = weather.precipitationMmH;
      let toastMsg = '';

      if (weather.precipitationMmH > 0.5) {
        toastMsg = `⚡ Live Bengaluru Rain: ${weather.weatherDescription} (${weather.precipitationMmH} mm/h, ${weather.temperatureC}°C)`;
      } else {
        // If dry right now, simulate today's peak forecast or default
        targetRate = weather.peakForecastTodayMmH > 0 ? weather.peakForecastTodayMmH : 45;
        toastMsg = `☀️ Live: Dry (${weather.temperatureC}°C, ${weather.weatherDescription}). Simulating 24h peak forecast (${targetRate} mm/h)`;
      }

      simController.setRainRate(targetRate);
      if (rainSlider) rainSlider.value = String(targetRate);
      if (rainLabel) rainLabel.textContent = `${targetRate} mm/h`;
      if (liveWeatherBtn) {
        liveWeatherBtn.innerHTML = `⚡ ${weather.isRaining ? '🌧️' : '⛅'} ${weather.temperatureC}°C`;
        liveWeatherBtn.title = `Updated at ${weather.updatedAt}: ${weather.weatherDescription}`;
      }
      updateUrlHash();

      if (!simController.isRunning()) {
        simController.togglePlay();
        if (playBtn) {
          playBtn.innerHTML = '<span>⏸</span><span>Pause</span>';
          playBtn.style.background = 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)';
        }
      }

      showToast(toastMsg, 3500);
    } catch {
      if (liveWeatherBtn) liveWeatherBtn.textContent = '⚡ Live Weather';
      showToast('⚠️ Weather telemetry offline. Replay controls active.');
    }
  });

  // Background fetch on boot to update live weather pill badge
  fetchLiveBengaluruWeather()
    .then((w) => {
      if (liveWeatherBtn) {
        liveWeatherBtn.innerHTML = `⚡ ${w.isRaining ? '🌧️ ' + w.precipitationMmH + 'mm' : w.temperatureC + '°C'}`;
        liveWeatherBtn.title = `Live Bengaluru: ${w.weatherDescription}, ${w.temperatureC}°C (Peak today: ${w.peakForecastTodayMmH} mm/h)`;
      }
    })
    .catch(() => {});

  // URL Hash synchronization logic (F-10 / M3)
  function updateUrlHash(): void {
    const center = map.getCenter();
    const activeLayers: string[] = [];
    const checkLayer = (id: string, layerId: string) => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el && el.checked) {
        activeLayers.push(layerId);
      }
    };
    checkLayer('toggle-flood-sites', LAYER_IDS.FLOOD_SITES);
    checkLayer('toggle-ghost-drains', LAYER_IDS.GHOST_DRAINS);
    checkLayer('toggle-official-swd', LAYER_IDS.OFFICIAL_SWD);
    checkLayer('toggle-gap-view', LAYER_IDS.GAP_VIEW);
    checkLayer('toggle-water-sim', LAYER_IDS.WATER_SIM);
    checkLayer('toggle-ponding', LAYER_IDS.PONDING);
    checkLayer('toggle-hand', LAYER_IDS.HAND);

    syncHashState({
      zoom: map.getZoom(),
      lat: center.lat,
      lng: center.lng,
      bearing: map.getBearing(),
      pitch: map.getPitch(),
      layers: activeLayers,
      rain: simController?.getRainRate(),
    });
  }

  // Restore initial state from URL hash if provided
  const initialHash = typeof window !== 'undefined' ? window.location.hash : '';
  const parsedState = parseHashState(initialHash);

  if (parsedState.rain !== undefined && rainSlider && rainLabel && simController) {
    rainSlider.value = String(parsedState.rain);
    rainLabel.textContent = `${parsedState.rain} mm/h`;
    simController.setRainRate(parsedState.rain);
  }

  if (parsedState.layers && parsedState.layers.length > 0) {
    const layerSet = new Set(parsedState.layers);
    const applyCb = (id: string, layerId: string) => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el) {
        el.checked = layerSet.has(layerId);
        toggleLayer(map, layerId, el.checked);
      }
    };
    applyCb('toggle-flood-sites', LAYER_IDS.FLOOD_SITES);
    applyCb('toggle-ghost-drains', LAYER_IDS.GHOST_DRAINS);
    applyCb('toggle-official-swd', LAYER_IDS.OFFICIAL_SWD);
    applyCb('toggle-gap-view', LAYER_IDS.GAP_VIEW);
    applyCb('toggle-water-sim', LAYER_IDS.WATER_SIM);
    applyCb('toggle-ponding', LAYER_IDS.PONDING);
    applyCb('toggle-hand', LAYER_IDS.HAND);
  }

  updateActiveLayersBadge();

  if (parsedState.zoom !== undefined && parsedState.lat !== undefined && parsedState.lng !== undefined) {
    map.jumpTo({
      center: [parsedState.lng, parsedState.lat],
      zoom: parsedState.zoom,
      bearing: parsedState.bearing ?? 0,
      pitch: parsedState.pitch ?? 0,
    });
  }

  map.on('moveend', updateUrlHash);
}

/**
 * Open the Methods, Limitations & Validation modal dialog.
 */
export function openMethodsModal(): void {
  const modal = document.getElementById('limits-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

/**
 * Display a temporary floating HUD toast message.
 */
export function showToast(message: string, durationMs = 2800): void {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.style.position = 'fixed';
    toast.style.top = '62px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'rgba(15, 23, 42, 0.95)';
    toast.style.backdropFilter = 'blur(16px)';
    toast.style.setProperty('-webkit-backdrop-filter', 'blur(16px)');
    toast.style.border = '1px solid rgba(56, 189, 248, 0.35)';
    toast.style.borderRadius = '9999px';
    toast.style.padding = '6px 16px';
    toast.style.fontSize = '12px';
    toast.style.fontWeight = '600';
    toast.style.color = '#f8fafc';
    toast.style.boxShadow = '0 12px 28px -4px rgba(0, 0, 0, 0.6), 0 0 16px rgba(56, 189, 248, 0.2)';
    toast.style.zIndex = '1500';
    toast.style.pointerEvents = 'none';
    toast.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';

  clearTimeout((toast as unknown as { _timeout?: number })._timeout);
  (toast as unknown as { _timeout?: number })._timeout = window.setTimeout(() => {
    if (toast) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-8px)';
    }
  }, durationMs);
}
