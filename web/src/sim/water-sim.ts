/**
 * WebGL2 virtual-pipe shallow-water simulation.
 *
 * Method: Mei, Decaudin, Hu (2007), "Fast Hydraulic Erosion Simulation
 * and Visualization on GPU", Pacific Graphics, pp. 47-56.
 * Source: https://hgpu.org/?p=2256
 *
 * RULE: Copy formulas from the paper, not from memory or other files.
 * See docs/HYDROLOGY_SPEC.md section 8.
 *
 * This simulation is ILLUSTRATIVE. It is NOT calibrated to any gauge
 * or event. It cannot represent drains, culverts, or sewers at 30 m.
 */

import { NODATA } from '../constants';
import type { GridMeta } from '../data/grid-meta';

/** Simulation state */
export interface SimState {
  readonly gl: WebGL2RenderingContext;
  readonly width: number;
  readonly height: number;
  readonly cellSize: number;  // true ground size in metres
  running: boolean;
  simTime: number;            // simulated seconds elapsed
  rainRate: number;           // mm/h (user-adjustable)
}

/**
 * Check WebGL2 capabilities required for the simulation.
 * The sim needs float render targets (EXT_color_buffer_float).
 */
export function checkWebGL2Capabilities(
  gl: WebGL2RenderingContext,
): { supported: boolean; reason?: string } {
  const ext = gl.getExtension('EXT_color_buffer_float');
  if (!ext) {
    return {
      supported: false,
      reason:
        'EXT_color_buffer_float is not available. ' +
        'The rain replay simulation requires float render targets. ' +
        'Static layers (ghost drains, HAND, gap view) will still work.',
    };
  }
  return { supported: true };
}

/**
 * Initialize the water simulation.
 *
 * Sets up WebGL2 context, ping-pong framebuffers, and shader programs.
 * DEM data is loaded as a float texture.
 *
 * @param canvas Offscreen canvas for simulation output
 * @param dem Float32Array of terrain elevations
 * @param meta Grid metadata
 */
export function initSimulation(
  canvas: HTMLCanvasElement,
  dem: Float32Array,
  meta: GridMeta,
): SimState | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
  });

  if (!gl) {
    showError('WebGL2 is not available. The rain replay is disabled.');
    return null;
  }

  const check = checkWebGL2Capabilities(gl);
  if (!check.supported) {
    showError(check.reason ?? 'WebGL2 float textures not supported.');
    return null;
  }

  const cellSize = meta.cell_size_3857_m * meta.ground_scale_k;

  // TODO: Create shader programs and framebuffers
  // Equations to transcribe from Mei et al. 2007:
  // 1. Flux update: f_new = max(0, f_old + dt * A * g * dh / L)
  //    where dh = (b_self + d_self) - (b_neighbour + d_neighbour)
  //    A = pipe cross-section area, g = 9.81, L = pipe length
  // 2. Flux scaling: K = min(1, d * dx * dy / (sum_of_outgoing_fluxes * dt))
  // 3. Depth update: d_new = d + dt * (sum_in - sum_out) / (dx * dy)
  // 4. Rain addition: d += rain_m_per_s * dt

  return {
    gl,
    width: meta.width,
    height: meta.height,
    cellSize,
    running: false,
    simTime: 0,
    rainRate: 50, // default mm/h
  };
}

/**
 * Show a visible error message. Never silently fail.
 */
function showError(message: string): void {
  const banner = document.getElementById('error-banner');
  if (banner) {
    banner.textContent = message;
    banner.style.display = 'block';
  }
  console.error('[Ghost Drains Sim]', message);
}
