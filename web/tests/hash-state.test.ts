/**
 * Unit tests for URL hash state parsing and serialization (F-10).
 */

import { describe, it, expect } from 'vitest';
import { parseHashState, formatHashState } from '../src/ui/hash-state';

describe('Hash state parser and formatter', () => {
  it('parses standard MapLibre camera hash', () => {
    const hash = '#12.50/12.9716/77.5946/15.0/45.0';
    const state = parseHashState(hash);

    expect(state.zoom).toBeCloseTo(12.5, 2);
    expect(state.lat).toBeCloseTo(12.9716, 4);
    expect(state.lng).toBeCloseTo(77.5946, 4);
    expect(state.bearing).toBe(15.0);
    expect(state.pitch).toBe(45.0);
    expect(state.layers).toBeUndefined();
  });

  it('parses composite camera, layers, and rain hash', () => {
    const hash = '#11.50/12.9716/77.5946/0.0/45.0&layers=ghost-drains,gap-view,ponding&rain=65';
    const state = parseHashState(hash);

    expect(state.zoom).toBeCloseTo(11.5, 2);
    expect(state.lat).toBeCloseTo(12.9716, 4);
    expect(state.lng).toBeCloseTo(77.5946, 4);
    expect(state.layers).toEqual(['ghost-drains', 'gap-view', 'ponding']);
    expect(state.rain).toBe(65);
  });

  it('handles empty or naked hash gracefully', () => {
    expect(parseHashState('')).toEqual({});
    expect(parseHashState('#')).toEqual({});
  });

  it('formats state into a valid URL hash string', () => {
    const state = {
      zoom: 12.0,
      lat: 12.9716,
      lng: 77.5946,
      bearing: 0,
      pitch: 45,
      layers: ['ghost-drains', 'official-swd'],
      rain: 50,
    };
    const formatted = formatHashState(state);
    expect(formatted).toBe('#12.00/12.9716/77.5946/0.0/45.0&layers=ghost-drains,official-swd&rain=50');

    // Round-trip verification
    const parsed = parseHashState(formatted);
    expect(parsed.zoom).toBeCloseTo(12.0, 2);
    expect(parsed.lat).toBeCloseTo(12.9716, 4);
    expect(parsed.lng).toBeCloseTo(77.5946, 4);
    expect(parsed.layers).toEqual(['ghost-drains', 'official-swd']);
    expect(parsed.rain).toBe(50);
  });
});
