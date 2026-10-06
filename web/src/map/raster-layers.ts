/**
 * Client-side raster decoders for Ponding and HAND layers (F-05).
 *
 * Converts float32 binary rasters into lightweight RGBA canvas overlays
 * draped on MapLibre 3D terrain.
 * Source: docs/PRD.md F-05, docs/HYDROLOGY_SPEC.md sections 4 & 6.
 */

import type * as maplibregl from 'maplibre-gl';
import { NODATA } from '../constants';
import { LAYER_IDS } from './layers';

/**
 * Convert Web Mercator (EPSG:3857) bounding box to 4 corner coordinates in EPSG:4326.
 * Order required by MapLibre image/canvas source: [top-left, top-right, bottom-right, bottom-left].
 */
export function bbox3857ToCorners(
  bbox: readonly [number, number, number, number],
): [[number, number], [number, number], [number, number], [number, number]] {
  const R = 20037508.342789244;
  const [xMin, yMin, xMax, yMax] = bbox;

  const lonMin = (xMin / R) * 180;
  const lonMax = (xMax / R) * 180;
  const latMin = (Math.atan(Math.exp((yMin / R) * Math.PI)) * 2 - Math.PI / 2) * (180 / Math.PI);
  const latMax = (Math.atan(Math.exp((yMax / R) * Math.PI)) * 2 - Math.PI / 2) * (180 / Math.PI);

  return [
    [lonMin, latMax], // Top-Left
    [lonMax, latMax], // Top-Right
    [lonMax, latMin], // Bottom-Right
    [lonMin, latMin], // Bottom-Left
  ];
}

/**
 * Pure function: compute RGBA pixel buffer for depression depth raster.
 * Dry upland cells remain 100% transparent.
 */
export function computePondingRgba(
  depress: Float32Array,
  outputRgba: Uint8ClampedArray,
): void {
  for (let i = 0; i < depress.length; i++) {
    const depth = depress[i];
    const offset = i * 4;

    if (depth === undefined || depth <= 0.05 || depth === NODATA || !Number.isFinite(depth)) {
      outputRgba[offset] = 0;
      outputRgba[offset + 1] = 0;
      outputRgba[offset + 2] = 0;
      outputRgba[offset + 3] = 0;
      continue;
    }

    // Normalized depth ramp (0.05m to 10m max scale)
    const t = Math.min((depth - 0.05) / 10.0, 1.0);

    // Deep sapphire to radiant aquatic blue
    outputRgba[offset] = Math.round(14 + (1 - t) * 35);       // R
    outputRgba[offset + 1] = Math.round(116 + (1 - t) * 75);  // G
    outputRgba[offset + 2] = Math.round(246 - t * 30);       // B
    outputRgba[offset + 3] = Math.round(130 + t * 115);      // Alpha
  }
}

/**
 * Pure function: compute RGBA pixel buffer for HAND raster.
 */
export function computeHandRgba(
  hand: Float32Array,
  outputRgba: Uint8ClampedArray,
): void {
  for (let i = 0; i < hand.length; i++) {
    const h = hand[i];
    const offset = i * 4;

    if (h === undefined || h < 0 || h === NODATA || !Number.isFinite(h)) {
      outputRgba[offset] = 0;
      outputRgba[offset + 1] = 0;
      outputRgba[offset + 2] = 0;
      outputRgba[offset + 3] = 0;
      continue;
    }

    if (h <= 2.0) {
      // High susceptibility: luminous cyan
      outputRgba[offset] = 6;
      outputRgba[offset + 1] = 182;
      outputRgba[offset + 2] = 212;
      outputRgba[offset + 3] = 145; // ~57% opacity
    } else if (h <= 5.0) {
      // Moderate susceptibility: emerald
      outputRgba[offset] = 16;
      outputRgba[offset + 1] = 185;
      outputRgba[offset + 2] = 129;
      outputRgba[offset + 3] = 100; // ~39% opacity
    } else if (h <= 10.0) {
      // Low susceptibility: subtle lime/sage
      outputRgba[offset] = 132;
      outputRgba[offset + 1] = 204;
      outputRgba[offset + 2] = 22;
      outputRgba[offset + 3] = 55; // ~22% opacity
    } else {
      // Upland ridge: transparent
      outputRgba[offset] = 0;
      outputRgba[offset + 1] = 0;
      outputRgba[offset + 2] = 0;
      outputRgba[offset + 3] = 0;
    }
  }
}

/**
 * Decode depression depth raster into an aquatic ponding RGBA canvas.
 */
export function decodePondingCanvas(
  depress: Float32Array,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const imgData = ctx.createImageData(width, height);
    computePondingRgba(depress, imgData.data);
    ctx.putImageData(imgData, 0, 0);
  }
  return canvas;
}

/**
 * Decode HAND raster into terrain susceptibility bands per HYDROLOGY_SPEC section 6.
 */
export function decodeHandCanvas(
  hand: Float32Array,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const imgData = ctx.createImageData(width, height);
    computeHandRgba(hand, imgData.data);
    ctx.putImageData(imgData, 0, 0);
  }
  return canvas;
}

/**
 * Register a decoded raster canvas as a draped MapLibre image source and layer.
 */
export function registerRasterOverlay(
  map: maplibregl.Map,
  layerId: string,
  canvas: HTMLCanvasElement,
  bbox3857: readonly [number, number, number, number],
  defaultVisible: boolean = false,
): void {
  if (map.getSource(layerId)) {
    return;
  }

  const coords = bbox3857ToCorners(bbox3857);
  const dataUrl = canvas.toDataURL();

  map.addSource(layerId, {
    type: 'image',
    url: dataUrl,
    coordinates: coords,
  });

  const beforeId = map.getLayer(LAYER_IDS.GHOST_DRAINS)
    ? LAYER_IDS.GHOST_DRAINS
    : undefined;

  map.addLayer(
    {
      id: layerId,
      type: 'raster',
      source: layerId,
      layout: {
        visibility: defaultVisible ? 'visible' : 'none',
      },
      paint: {
        'raster-opacity': 0.85,
        'raster-fade-duration': 150,
      },
    },
    beforeId,
  );
}
