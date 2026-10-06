import { describe, it, expect } from 'vitest';
import {
  bbox3857ToCorners,
  computePondingRgba,
  computeHandRgba,
} from '../src/map/raster-layers';
import { NODATA } from '../src/constants';

describe('Raster Layers & Decoders', () => {
  it('bbox3857ToCorners generates 4 valid [lon, lat] coordinates', () => {
    // Bengaluru approximate Web Mercator bounds
    const bbox3857 = [8621685, 1442468, 8655080, 1471132] as const;
    const corners = bbox3857ToCorners(bbox3857);

    expect(corners).toHaveLength(4);
    // [TL, TR, BR, BL]
    const [tl, tr, br, bl] = corners;
    expect(tl[0]).toBeCloseTo(77.45, 1);
    expect(tl[1]).toBeCloseTo(13.10, 1);
    expect(tr[0]).toBeCloseTo(77.75, 1);
    expect(tr[1]).toBeCloseTo(13.10, 1);
    expect(br[0]).toBeCloseTo(77.75, 1);
    expect(br[1]).toBeCloseTo(12.85, 1);
    expect(bl[0]).toBeCloseTo(77.45, 1);
    expect(bl[1]).toBeCloseTo(12.85, 1);
  });

  it('computePondingRgba masks dry cells and highlights depressions', () => {
    // 0 = dry, -9999 = nodata, 1.5m = shallow pond, 6.0m = deep lake depression
    const depress = new Float32Array([0.0, NODATA, 1.5, 6.0]);
    const rgba = new Uint8ClampedArray(4 * 4);

    computePondingRgba(depress, rgba);

    // Pixel 0 (dry): Alpha = 0
    expect(rgba[3]).toBe(0);
    // Pixel 1 (nodata): Alpha = 0
    expect(rgba[7]).toBe(0);
    // Pixel 2 (1.5m): Alpha > 0 (visible)
    expect(rgba[11]).toBeGreaterThan(120);
    // Pixel 3 (6.0m): Alpha > Pixel 2 alpha (deeper depression has higher opacity)
    expect(rgba[15]).toBeGreaterThan(rgba[11]!);
  });

  it('computeHandRgba categorizes [0, 2m], [2, 5m], and uplands correctly', () => {
    // 1m = High, 3.5m = Moderate, 15m = Upland (dry)
    const hand = new Float32Array([1.0, 3.5, 15.0]);
    const rgba = new Uint8ClampedArray(3 * 4);

    computeHandRgba(hand, rgba);

    // Pixel 0 (1.0m, High susceptibility: Cyan R=6, G=182, B=212)
    expect(rgba[0]).toBe(6);
    expect(rgba[1]).toBe(182);
    expect(rgba[2]).toBe(212);
    expect(rgba[3]).toBe(145);

    // Pixel 1 (3.5m, Moderate susceptibility: Emerald R=16, G=185, B=129)
    expect(rgba[4]).toBe(16);
    expect(rgba[5]).toBe(185);
    expect(rgba[6]).toBe(129);

    // Pixel 2 (15m, Upland: Transparent)
    expect(rgba[11]).toBe(0);
  });
});
