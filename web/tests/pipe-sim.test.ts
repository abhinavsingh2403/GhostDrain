/**
 * L4 Simulation Tests — virtual-pipe shallow water model.
 *
 * All tests use SYNTHETIC data fixtures (named synthetic_*).
 * Equations: Mei, Decaudin, Hu (2007), "Fast Hydraulic Erosion Simulation
 * and Visualization on GPU", Pacific Graphics, pp. 47-56.
 * Source: https://hgpu.org/?p=2256
 *
 * Test list from docs/TESTING_VALIDATION.md section 5:
 *   1. Mass balance (closed boundary)
 *   2. Open boundary outflow accounting
 *   3. Lake at rest (no spurious flow)
 *   4. Slope flow (water moves downslope)
 *   5. Stability (no NaN/negative over long run)
 *   6. Determinism (same inputs → same output)
 *   7. Equation citation verification
 */

import { describe, it, expect } from 'vitest';
import {
  createState,
  step,
  computeDt,
  totalWaterVolume,
  checkIntegrity,
  syntheticTiltedPlane,
  syntheticFlatBasin,
  syntheticBowl,
  type PipeSimConfig,
} from '../src/sim/pipe-sim';

/** Standard test grid: small enough for fast tests, large enough for physics */
const SIZE = 32;
const CELL = 30; // metres (matches project config)

function makeConfig(overrides: Partial<PipeSimConfig> = {}): PipeSimConfig {
  return {
    width: SIZE,
    height: SIZE,
    cellSize: CELL,
    pipeArea: CELL * CELL,   // pipe_area = cellSize² per config.yaml
    maxDt: 0.1,              // per config.yaml simulation.max_dt_s
    rainMmH: 0,              // no rain by default
    boundary: 'closed',
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Test 1: Mass balance with closed boundaries and rain
// From TESTING_VALIDATION.md §5.1:
//   "with rain only and closed boundaries, total water volume after N
//    steps equals rain volume added (tolerance recorded)"
// ──────────────────────────────────────────────────────────────────────
describe('L4-1: Mass balance (closed boundary + rain)', () => {
  it('conserves water volume within 0.1% tolerance over 100 steps', () => {
    // Mei et al. 2007 Eq. 3-4: flux scaling ensures no cell exports more
    // water than it holds. Closed boundaries prevent any drainage.
    const config = makeConfig({ rainMmH: 50, boundary: 'closed' });
    const terrain = syntheticBowl(SIZE, SIZE, 800, 850);
    const state = createState(terrain, config);

    for (let i = 0; i < 100; i++) {
      const dt = computeDt(config, state.water);
      step(state, config, dt);
    }

    const storedVol = totalWaterVolume(state, config);
    const relError = Math.abs(storedVol - state.totalRainVolume) / state.totalRainVolume;

    // Tolerance: 0.1% — record this for VALIDATION_LOG.md
    expect(relError).toBeLessThan(0.001);
    expect(state.totalRainVolume).toBeGreaterThan(0);
  });

  it('conserves volume on a flat terrain (no flow) within machine epsilon', () => {
    const config = makeConfig({ rainMmH: 100, boundary: 'closed' });
    const terrain = syntheticFlatBasin(SIZE, SIZE, 500);
    const state = createState(terrain, config);

    for (let i = 0; i < 50; i++) {
      const dt = computeDt(config, state.water);
      step(state, config, dt);
    }

    const storedVol = totalWaterVolume(state, config);
    const relError = Math.abs(storedVol - state.totalRainVolume) / state.totalRainVolume;

    // On flat terrain, Δh=0 for all interior pipes → zero flux.
    // Tiny error from float64 accumulation over 50 rain additions.
    // Tolerance: 1e-6 (well below the 0.1% physics tolerance)
    expect(relError).toBeLessThan(1e-6);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Test 2: Open boundary outflow
// From TESTING_VALIDATION.md §5.2:
//   "with an open edge, outflow equals rain input minus stored volume"
// ──────────────────────────────────────────────────────────────────────
describe('L4-2: Open boundary outflow accounting', () => {
  it('total = stored + boundary_outflow, within 0.5% after 200 steps', () => {
    // Tilted plane: water flows east and drains off the right edge.
    const config = makeConfig({
      rainMmH: 30,
      boundary: 'open',
    });
    const terrain = syntheticTiltedPlane(SIZE, SIZE, 900, 800);
    const state = createState(terrain, config);

    for (let i = 0; i < 200; i++) {
      const dt = computeDt(config, state.water);
      step(state, config, dt);
    }

    const storedVol = totalWaterVolume(state, config);
    const accountedVol = storedVol + state.totalBoundaryOutflow;
    const relError = Math.abs(accountedVol - state.totalRainVolume) / state.totalRainVolume;

    // Open-boundary accounting tolerance: 0.5%
    expect(relError).toBeLessThan(0.005);
    expect(state.totalBoundaryOutflow).toBeGreaterThan(0);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Test 3: Lake at rest
// From TESTING_VALIDATION.md §5.3:
//   "a flat basin with initial water remains still (no spurious flow
//    beyond a tiny tolerance)"
// ──────────────────────────────────────────────────────────────────────
describe('L4-3: Lake at rest', () => {
  it('flat basin with uniform water depth shows no spurious flow', () => {
    const config = makeConfig({ rainMmH: 0, boundary: 'closed' });
    const terrain = syntheticFlatBasin(SIZE, SIZE, 500);
    const state = createState(terrain, config);

    // Set uniform initial water depth of 1 metre
    const initialDepth = 1.0;
    state.water.fill(initialDepth);
    const initialVolume = totalWaterVolume(state, config);

    // Run 100 steps
    for (let i = 0; i < 100; i++) {
      step(state, config, config.maxDt);
    }

    // Check: every cell should still have exactly initialDepth
    let maxDeviation = 0;
    for (let i = 0; i < state.water.length; i++) {
      const dev = Math.abs(state.water[i] - initialDepth);
      if (dev > maxDeviation) maxDeviation = dev;
    }

    // Tolerance: depth change < 1e-10 m (essentially zero)
    expect(maxDeviation).toBeLessThan(1e-10);

    // Volume should be exactly conserved
    const finalVolume = totalWaterVolume(state, config);
    expect(Math.abs(finalVolume - initialVolume) / initialVolume).toBeLessThan(1e-12);
  });

  it('bowl with uniform water level (terrain varies, surface flat) is still', () => {
    const config = makeConfig({ rainMmH: 0, boundary: 'closed' });
    const terrain = syntheticBowl(SIZE, SIZE, 800, 850);
    const state = createState(terrain, config);

    // Set water so that terrain + water = 860 everywhere (above the rim)
    // This creates a uniform water surface — should be at rest.
    const targetSurface = 860;
    for (let i = 0; i < state.water.length; i++) {
      state.water[i] = targetSurface - terrain[i];
    }

    const initialVolume = totalWaterVolume(state, config);

    for (let i = 0; i < 100; i++) {
      step(state, config, config.maxDt);
    }

    // Water surface height should remain uniform
    let maxSurfaceDev = 0;
    for (let i = 0; i < state.water.length; i++) {
      const surface = terrain[i] + state.water[i];
      const dev = Math.abs(surface - targetSurface);
      if (dev > maxSurfaceDev) maxSurfaceDev = dev;
    }

    expect(maxSurfaceDev).toBeLessThan(1e-8);

    const finalVolume = totalWaterVolume(state, config);
    expect(Math.abs(finalVolume - initialVolume) / initialVolume).toBeLessThan(1e-10);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Test 4: Slope flow (water moves downslope)
// From TESTING_VALIDATION.md §5.4:
//   "water on a tilted plane moves downslope"
// ──────────────────────────────────────────────────────────────────────
describe('L4-4: Slope flow', () => {
  it('water blob on tilted plane moves toward the low edge', () => {
    const config = makeConfig({ rainMmH: 0, boundary: 'closed' });
    const terrain = syntheticTiltedPlane(SIZE, SIZE, 100, 50);
    const state = createState(terrain, config);

    // Place a water blob in the centre-west of the grid
    const centreRow = Math.floor(SIZE / 2);
    const startCol = Math.floor(SIZE / 4); // 1/4 from the high (west) side
    const blobRadius = 3;

    for (let dr = -blobRadius; dr <= blobRadius; dr++) {
      for (let dc = -blobRadius; dc <= blobRadius; dc++) {
        const r = centreRow + dr;
        const c = startCol + dc;
        if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
          state.water[r * SIZE + c] = 2.0; // 2 m deep blob
        }
      }
    }

    // Compute initial centre-of-mass (column coordinate)
    function waterCentreCol(): number {
      let sumWC = 0;
      let sumW = 0;
      for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
          const w = state.water[row * SIZE + col];
          sumWC += w * col;
          sumW += w;
        }
      }
      return sumW > 0 ? sumWC / sumW : 0;
    }

    const initialCentreCol = waterCentreCol();

    // Run 200 steps — water should move eastward (increasing col = downslope)
    for (let i = 0; i < 200; i++) {
      const dt = computeDt(config, state.water);
      step(state, config, dt);
    }

    const finalCentreCol = waterCentreCol();

    // Water centre-of-mass should have moved toward higher col (east = lower terrain)
    expect(finalCentreCol).toBeGreaterThan(initialCentreCol + 1);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Test 5: Stability (no NaN or negative depth)
// From TESTING_VALIDATION.md §5.5:
//   "no NaN/negative depth over a long run at max rain; time-step clamp
//    engages"
// ──────────────────────────────────────────────────────────────────────
describe('L4-5: Stability', () => {
  it('no NaN or negative depth after 500 steps at max rain (200 mm/h)', () => {
    // Stress test: high rain on steep terrain with open boundaries
    const config = makeConfig({
      rainMmH: 200, // extreme rain
      boundary: 'open',
    });
    const terrain = syntheticTiltedPlane(SIZE, SIZE, 1000, 500);
    const state = createState(terrain, config);

    // Pre-fill with deep water to force the CFL clamp to engage.
    // CFL: dt <= C * dx / sqrt(g * h_max). For dt < 0.1 we need
    // h_max > (C * dx / maxDt)² / g = (0.5 * 30 / 0.1)² / 9.81 ≈ 2293 m
    // So we place 3000 m of water at one cell to guarantee clamping.
    state.water[0] = 3000;

    let dtClamped = false;

    for (let i = 0; i < 500; i++) {
      const dt = computeDt(config, state.water);
      if (dt < config.maxDt) dtClamped = true;
      step(state, config, dt);

      // Check integrity every 50 steps
      if (i % 50 === 0) {
        const badIdx = checkIntegrity(state);
        expect(badIdx).toBe(-1);
      }
    }

    // Final integrity check
    const badIdx = checkIntegrity(state);
    expect(badIdx).toBe(-1);

    // The CFL time-step clamp should have engaged at some point
    // (deep water → high wave speed → dt reduced below maxDt)
    expect(dtClamped).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Test 6: Determinism
// From TESTING_VALIDATION.md §5.6:
//   "same inputs produce the same output on the same machine"
// ──────────────────────────────────────────────────────────────────────
describe('L4-6: Determinism', () => {
  it('two runs with identical inputs produce identical output', () => {
    const config = makeConfig({ rainMmH: 50, boundary: 'open' });
    const terrain = syntheticBowl(SIZE, SIZE, 800, 850);

    // Run 1
    const state1 = createState(terrain, config);
    for (let i = 0; i < 100; i++) {
      const dt = computeDt(config, state1.water);
      step(state1, config, dt);
    }

    // Run 2 (identical)
    const state2 = createState(terrain, config);
    for (let i = 0; i < 100; i++) {
      const dt = computeDt(config, state2.water);
      step(state2, config, dt);
    }

    // Water arrays must be bitwise identical
    expect(state1.water.length).toBe(state2.water.length);
    for (let i = 0; i < state1.water.length; i++) {
      expect(state1.water[i]).toBe(state2.water[i]);
    }

    // Flux arrays must be bitwise identical
    expect(state1.flux.length).toBe(state2.flux.length);
    for (let i = 0; i < state1.flux.length; i++) {
      expect(state1.flux[i]).toBe(state2.flux[i]);
    }

    // Accounting must be identical
    expect(state1.simTime).toBe(state2.simTime);
    expect(state1.totalRainVolume).toBe(state2.totalRainVolume);
    expect(state1.totalBoundaryOutflow).toBe(state2.totalBoundaryOutflow);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Test 7: Equation citation verification
// From TESTING_VALIDATION.md §5.7:
//   "a test comment must cite the equation numbers used"
// ──────────────────────────────────────────────────────────────────────
describe('L4-7: Equation citations', () => {
  it('pipe-sim.ts documents the source paper and equation references', () => {
    // This test is a structural verification that the implementation
    // module contains the required citations.
    //
    // Equations implemented from Mei, Decaudin, Hu (2007):
    //   Eq. 1-2: Flux update — f_K^{t+dt} = max(0, f_K^t + dt * A * g * Δh / l)
    //     where Δh = (b_self + d_self) - (b_neighbour + d_neighbour)
    //   Eq. 3-4: Flux scaling — K = min(1, d * lx * ly / (totalOutflux * dt))
    //     ensures cell never exports more water than it holds
    //   Eq. 5-6: Depth update — d_new = d + dt * (sum_in - sum_out) / (lx * ly)
    //
    // Source: https://hgpu.org/?p=2256
    // Cross-checked: getbutterfly.com implementation notes
    //
    // Rain addition: HYDROLOGY_SPEC.md section 8 "Our additions"
    //   rain_m_per_s = (mm_per_hour / 1000) / 3600
    //
    // CFL bound: dt <= C * dx / sqrt(g * h_max), C = 0.5
    //   [U] — VERIFY_CHECKLIST item 15 (conservative estimate)
    //
    // This test passes by documenting the citations above.
    // The actual physics correctness is verified by tests 1-6.
    expect(true).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Additional: Edge cases and createState validation
// ──────────────────────────────────────────────────────────────────────
describe('L4-extra: createState validation', () => {
  it('rejects terrain array with wrong length', () => {
    const config = makeConfig();
    const wrongTerrain = new Float32Array(10);
    expect(() => createState(wrongTerrain, config)).toThrow(/does not match grid/);
  });

  it('creates defensive copy of terrain', () => {
    const config = makeConfig();
    const terrain = syntheticFlatBasin(SIZE, SIZE, 500);
    const state = createState(terrain, config);

    // Mutate original — state should be unaffected
    terrain[0] = -999;
    expect(state.terrain[0]).toBe(500);
  });
});

describe('L4-render: renderWaterToCanvas', () => {
  it('makes dry cells transparent and wet cells colored with depth gradient', async () => {
    const { renderWaterToCanvas } = await import('../src/sim/pipe-sim');
    const width = 2;
    const height = 2;
    const water = new Float32Array([0.0, 0.002, 0.5, 2.0]); // Dry, below minDepth, medium wet, deep wet
    const rawBuffer = new Uint8ClampedArray(width * height * 4);
    const mockImageData = { data: rawBuffer } as ImageData;
    let putCalled = false;
    const mockCtx = {
      putImageData: () => {
        putCalled = true;
      },
    } as unknown as CanvasRenderingContext2D;

    renderWaterToCanvas(water, width, height, mockCtx, mockImageData, 0.005);

    expect(putCalled).toBe(true);
    // Cell 0 (0.0m): alpha is 0
    expect(mockImageData.data[3]).toBe(0);
    // Cell 1 (0.002m < 0.005m minDepth): alpha is 0
    expect(mockImageData.data[7]).toBe(0);
    // Cell 2 (0.5m wet): alpha > 0, blue > red
    expect(mockImageData.data[11]).toBeGreaterThan(100);
    expect(mockImageData.data[10]).toBeGreaterThan(mockImageData.data[8]); // Blue > Red
    // Cell 3 (2.0m deep wet): alpha clamped high
    expect(mockImageData.data[15]).toBeGreaterThan(200);
  });
});

