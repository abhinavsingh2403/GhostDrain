/**
 * Bridge module: feeds simulation canvas into MapLibre as a draped source.
 *
 * The water layer is rendered to an offscreen canvas by the WebGL2 sim,
 * then displayed as a MapLibre image/canvas source synced to the terrain.
 *
 * CONSTRAINT: deck.gl layers do NOT drape on MapLibre terrain.
 * Source: https://deck.gl/docs/api-reference/maplibre/overview
 * Therefore we use MapLibre-native canvas source.
 *
 * If Spike S2 shows this approach fails, fall back to option C
 * (deck.gl root with TerrainExtension). See docs/MAP_DECISION.md.
 */

import type * as maplibregl from 'maplibre-gl';
import type { GridMeta } from '../data/grid-meta';
import { LAYER_IDS } from '../map/layers';

/**
 * Register the simulation canvas as a MapLibre image source
 * draped on 3D terrain.
 *
 * @param map The MapLibre map instance
 * @param canvas The simulation output canvas
 * @param meta Grid metadata (provides the corner coordinates)
 */
export function registerWaterSource(
  map: maplibregl.Map,
  canvas: HTMLCanvasElement,
  meta: GridMeta | readonly [number, number, number, number],
): void {
  if (!canvas.id) {
    canvas.id = 'water-sim-canvas';
  }
  if (!document.getElementById(canvas.id)) {
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
  }

  // Determine corner coordinates
  let coords: [[number, number], [number, number], [number, number], [number, number]];
  if ('bbox_3857' in meta) {
    coords = bboxToCorners(meta.bbox_3857);
  } else if (meta[0] > 180 || meta[1] > 90) {
    // 3857 coordinates
    coords = bboxToCorners(meta);
  } else {
    // Direct 4326 [W, S, E, N] coordinates
    coords = bbox4326ToCorners(meta);
  }

  if (map.getSource(LAYER_IDS.WATER_SIM)) {
    return;
  }

  map.addSource(LAYER_IDS.WATER_SIM, {
    type: 'canvas',
    canvas: canvas.id,
    coordinates: coords,
    animate: true,
  } as maplibregl.CanvasSourceSpecification);

  const beforeLayer = map.getLayer('water-lakes-hd')
    ? 'water-lakes-hd'
    : map.getStyle().layers?.find((l: maplibregl.LayerSpecification) => l.type === 'symbol')?.id;

  map.addLayer(
    {
      id: LAYER_IDS.WATER_SIM,
      type: 'raster',
      source: LAYER_IDS.WATER_SIM,
      paint: {
        'raster-opacity': 0.78,
        'raster-fade-duration': 0,
      },
    },
    beforeLayer,
  );
}

/**
 * Convert EPSG:3857 bbox to MapLibre corner coordinates.
 * Returns [[lon,lat], [lon,lat], [lon,lat], [lon,lat]]
 * Order: top-left, top-right, bottom-right, bottom-left
 *
 * TODO: Replace with proper inverse Mercator projection
 */
function bboxToCorners(
  bbox: readonly [number, number, number, number],
): [[number, number], [number, number], [number, number], [number, number]] {
  // Inverse Web Mercator: lon = x / 20037508.34 * 180
  // lat = (atan(exp(y / 20037508.34 * PI)) * 2 - PI/2) * 180 / PI
  const R = 20037508.342789244;
  const [xMin, yMin, xMax, yMax] = bbox;

  const lonMin = (xMin / R) * 180;
  const lonMax = (xMax / R) * 180;
  const latMin = (Math.atan(Math.exp((yMin / R) * Math.PI)) * 2 - Math.PI / 2) * (180 / Math.PI);
  const latMax = (Math.atan(Math.exp((yMax / R) * Math.PI)) * 2 - Math.PI / 2) * (180 / Math.PI);

  return [
    [lonMin, latMax], // top-left
    [lonMax, latMax], // top-right
    [lonMax, latMin], // bottom-right
    [lonMin, latMin], // bottom-left
  ];
}

/**
 * Convert [W, S, E, N] in EPSG:4326 directly to MapLibre corner order:
 * [top-left, top-right, bottom-right, bottom-left]
 */
export function bbox4326ToCorners(
  bbox: readonly [number, number, number, number],
): [[number, number], [number, number], [number, number], [number, number]] {
  const [w, s, e, n] = bbox;
  return [
    [w, n], // top-left
    [e, n], // top-right
    [e, s], // bottom-right
    [w, s], // bottom-left
  ];
}

