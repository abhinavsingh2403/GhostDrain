/**
 * Tests for UI components, performance telemetry, and honesty policy compliance.
 */

import { describe, it, expect } from 'vitest';
import { FpsMeter } from '../src/ui/fps-meter';
import { LIMITATIONS_TEXT, FORBIDDEN_TERMS } from '../src/ui/limitations';

describe('FpsMeter telemetry', () => {
  it('initializes with nominal 60 FPS before samples', () => {
    const meter = new FpsMeter();
    const result = meter.tick(0);
    expect(result.fps).toBe(60);
    expect(result.frameTimeMs).toBe(16.6);
  });

  it('correctly calculates 60 FPS from 16.67ms frame deltas', () => {
    const meter = new FpsMeter();
    let time = 1000;
    meter.tick(time);

    // Simulate 60 frames at ~16.67ms delta
    for (let i = 0; i < 60; i++) {
      time += 16.666;
      meter.tick(time);
    }

    const { fps, frameTimeMs } = meter.tick(time + 16.666);
    expect(fps).toBe(60);
    expect(frameTimeMs).toBeCloseTo(16.7, 1);
  });

  it('correctly calculates 30 FPS from 33.33ms frame deltas', () => {
    const meter = new FpsMeter();
    let time = 1000;
    meter.tick(time);

    for (let i = 0; i < 30; i++) {
      time += 33.333;
      meter.tick(time);
    }

    const { fps, frameTimeMs } = meter.tick(time + 33.333);
    expect(fps).toBe(30);
    expect(frameTimeMs).toBeCloseTo(33.3, 1);
  });
});

describe('Honesty and limitations compliance', () => {
  it('contains mandatory limitations points', () => {
    expect(LIMITATIONS_TEXT.length).toBeGreaterThanOrEqual(5);
    const joined = LIMITATIONS_TEXT.join(' ').toLowerCase();
    expect(joined).toContain('30 m');
    expect(joined).toContain('illustrative');
    expect(joined).toContain('copernicus');
  });

  it('contains none of the forbidden terms in LIMITATIONS_TEXT', () => {
    const joined = LIMITATIONS_TEXT.join(' ').toLowerCase();
    for (const term of FORBIDDEN_TERMS) {
      expect(joined).not.toContain(term.toLowerCase());
    }
  });
});
