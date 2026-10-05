/**
 * Unit tests for FlowParticleSystem (Micro Flow Arrows).
 *
 * Verifies:
 * - Proper initialization within geographic bounds.
 * - Arrow direction steers downslope according to elevation gradient.
 * - Reset properly clears and respawns all arrows.
 * - Screen space projection and canvas rendering execute cleanly.
 */

import { describe, it, expect } from 'vitest';
import { FlowParticleSystem } from '../src/sim/flow-particles';
import { BENGALURU_BBOX } from '../src/constants';

describe('FlowParticleSystem', () => {
  it('initializes with expected number of arrows within geographic bounds', () => {
    const count = 50;
    const system = new FlowParticleSystem(20, 20, count, BENGALURU_BBOX);

    expect(system.arrows.length).toBe(count);
    const [w, s, e, n] = BENGALURU_BBOX;
    for (const a of system.arrows) {
      expect(a.lon).toBeGreaterThanOrEqual(w);
      expect(a.lon).toBeLessThanOrEqual(e);
      expect(a.lat).toBeGreaterThanOrEqual(s);
      expect(a.lat).toBeLessThanOrEqual(n);
      expect(a.speed).toBeGreaterThan(0);
      expect(a.tailLength).toBeGreaterThanOrEqual(8);
      expect(a.tailLength).toBeLessThanOrEqual(18);
    }
  });

  it('correctly steers arrows downslope on an eastward tilted plane', () => {
    const gridDim = 10;
    const system = new FlowParticleSystem(gridDim, gridDim, 1, BENGALURU_BBOX);

    // Plane sloping downwards to the east (elevation decreases eastward)
    const terrain = new Float32Array(gridDim * gridDim);
    for (let r = 0; r < gridDim; r++) {
      for (let c = 0; c < gridDim; c++) {
        terrain[r * gridDim + c] = 100 - c * 10;
      }
    }
    const water = new Float32Array(gridDim * gridDim);

    const [w, s, e, n] = BENGALURU_BBOX;
    const arrow = system.arrows[0]!;
    arrow.lon = (w + e) / 2;
    arrow.lat = (s + n) / 2;
    arrow.vx = 0;
    arrow.vy = 0;
    arrow.age = 10;

    const mockCtx = {
      canvas: { width: 800, height: 600 },
      clearRect: () => {},
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      fill: () => {},
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 0,
      lineCap: 'butt',
      lineJoin: 'miter',
      shadowColor: '',
      shadowBlur: 0,
    } as unknown as CanvasRenderingContext2D;

    // Mock map with project method
    const mockMap = {
      project: (coords: [number, number]) => {
        const x = ((coords[0] - w) / (e - w)) * 800;
        const y = ((n - coords[1]) / (n - s)) * 600;
        return { x, y };
      },
    } as any;

    system.updateAndDraw(mockCtx, mockMap, terrain, water, true);

    // Downslope vector points EAST (dLon > 0, so vx > 0)
    expect(arrow.vx).toBeGreaterThan(0);
    expect(Math.abs(arrow.vy)).toBeLessThan(0.01);
  });

  it('resets all arrows cleanly within valid bounds', () => {
    const system = new FlowParticleSystem(20, 20, 10, BENGALURU_BBOX);
    for (const a of system.arrows) {
      a.age = 100;
      a.lon = 999;
    }

    system.reset();
    const [w, , e] = BENGALURU_BBOX;
    for (const a of system.arrows) {
      expect(a.age).toBeLessThan(50);
      expect(a.lon).toBeGreaterThanOrEqual(w);
      expect(a.lon).toBeLessThanOrEqual(e);
    }
  });
});
