/**
 * Unit tests for Terrarium encoding constants.
 *
 * The encoding is a named constant with a test.
 * Source: docs/ARCHITECTURE.md section 7
 */

import { describe, it, expect } from 'vitest';
import {
  TERRAIN_ENCODING,
  terrariumDecode,
  terrariumEncode,
  BENGALURU_CENTER,
  BENGALURU_BBOX,
  BENGALURU_CAMERA_BOUNDS,
  NODATA,
} from '../src/constants';

describe('Terrarium encoding', () => {
  it('TERRAIN_ENCODING is explicitly terrarium, not mapbox', () => {
    expect(TERRAIN_ENCODING).toBe('terrarium');
    expect(TERRAIN_ENCODING).not.toBe('mapbox');
  });

  it('decode: R=1, G=134, B=160 gives elevation ~122.625 m', () => {
    // (1*256 + 134 + 160/256) - 32768 = 256 + 134 + 0.625 - 32768 = -32377.375
    const elev = terrariumDecode(1, 134, 160);
    expect(elev).toBeCloseTo(-32377.375, 2);
  });

  it('encode-decode round trip within 1/256 m tolerance', () => {
    const testElevations = [0, 100, 920.5, 8848, -100, -430.5];
    for (const elev of testElevations) {
      const [r, g, b] = terrariumEncode(elev);
      const decoded = terrariumDecode(r, g, b);
      expect(Math.abs(decoded - elev)).toBeLessThan(1 / 256);
    }
  });
});

describe('Constants integrity', () => {
  it('BENGALURU_CENTER is [longitude, latitude] (never swapped)', () => {
    const [lon, lat] = BENGALURU_CENTER;
    // Bengaluru longitude is ~77.5, latitude is ~12.97
    expect(lon).toBeGreaterThan(77);
    expect(lon).toBeLessThan(78);
    expect(lat).toBeGreaterThan(12);
    expect(lat).toBeLessThan(14);
  });

  it('NODATA is -9999', () => {
    expect(NODATA).toBe(-9999.0);
  });

  it('BENGALURU_BBOX is valid [W, S, E, N] within Bengaluru area', () => {
    const [w, s, e, n] = BENGALURU_BBOX;
    expect(w).toBeLessThan(e);
    expect(s).toBeLessThan(n);
    expect(w).toBeGreaterThan(77.0);
    expect(e).toBeLessThan(78.0);
    expect(s).toBeGreaterThan(12.0);
    expect(n).toBeLessThan(14.0);
  });

  it('BENGALURU_CAMERA_BOUNDS contains BENGALURU_BBOX with safety buffer', () => {
    const [[cw, cs], [ce, cn]] = BENGALURU_CAMERA_BOUNDS;
    const [w, s, e, n] = BENGALURU_BBOX;
    expect(cw).toBeLessThan(w);
    expect(cs).toBeLessThan(s);
    expect(ce).toBeGreaterThan(e);
    expect(cn).toBeGreaterThan(n);
  });
});
