/**
 * Layer management for Ghost Drains overlays.
 *
 * Manages: ghost drain lines, official SWD, gap view, ponding/HAND,
 * and user-painted What-If ridge barriers.
 *
 * Source: docs/ARCHITECTURE.md section 7, docs/PRD.md F-01 to F-07
 */

import type { Feature, FeatureCollection, Point } from 'geojson';
import type * as maplibregl from 'maplibre-gl';

/** Layer IDs used by the application. */
export const LAYER_IDS = {
  GHOST_DRAINS: 'ghost-drains',
  OFFICIAL_SWD: 'official-swd',
  GAP_VIEW: 'gap-view',
  PONDING: 'ponding',
  HAND: 'hand-bands',
  FLOOD_SITES: 'flood-sites',
  WATER_SIM: 'water-sim',
  BARRIERS: 'ridge-barriers',
} as const;

/**
 * Add ghost drain lines from GeoJSON.
 * Zoom-calibrated styling: elegant low-opacity filaments at city overview,
 * intensifying into luminous conduits as user zooms into neighborhoods.
 */
export function addGhostDrainLayer(
  map: maplibregl.Map,
  geojson: FeatureCollection,
): void {
  map.addSource(LAYER_IDS.GHOST_DRAINS, {
    type: 'geojson',
    data: geojson,
  });

  // Ambient aquatic glow casing
  map.addLayer({
    id: `${LAYER_IDS.GHOST_DRAINS}-glow`,
    type: 'line',
    source: LAYER_IDS.GHOST_DRAINS,
    paint: {
      'line-color': '#0891b2',
      'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.2, 12, 3.2, 15, 8.0],
      'line-blur': 2.0,
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0.25, 12, 0.45, 15, 0.75],
    },
  });

  // Core electric cyan line
  map.addLayer({
    id: LAYER_IDS.GHOST_DRAINS,
    type: 'line',
    source: LAYER_IDS.GHOST_DRAINS,
    paint: {
      'line-color': '#22d3ee', // Luminous vibrant cyan
      'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.6, 12, 1.4, 15, 3.5],
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0.45, 12, 0.75, 15, 0.95],
    },
  });
}

/**
 * Add official SWD lines (primary/secondary/tertiary).
 * Balanced zoom hierarchy prevents visual clutter at city-level overview.
 */
export function addOfficialSWDLayer(
  map: maplibregl.Map,
  geojson: FeatureCollection,
): void {
  map.addSource(LAYER_IDS.OFFICIAL_SWD, {
    type: 'geojson',
    data: geojson,
  });

  // Ambient gold glow casing
  map.addLayer({
    id: `${LAYER_IDS.OFFICIAL_SWD}-glow`,
    type: 'line',
    source: LAYER_IDS.OFFICIAL_SWD,
    paint: {
      'line-color': '#d97706',
      'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.0, 12, 2.8, 15, 7.0],
      'line-blur': 1.8,
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0.2, 12, 0.4, 15, 0.7],
    },
  });

  // Core gold line
  map.addLayer({
    id: LAYER_IDS.OFFICIAL_SWD,
    type: 'line',
    source: LAYER_IDS.OFFICIAL_SWD,
    paint: {
      'line-color': '#fbbf24', // Luminous gold
      'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.5, 12, 1.3, 15, 3.2],
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0.4, 12, 0.7, 15, 0.95],
    },
  });
}

/**
 * Add gap view: ghost paths with no official drain nearby.
 */
export function addGapLayer(
  map: maplibregl.Map,
  geojson: FeatureCollection,
): void {
  map.addSource(LAYER_IDS.GAP_VIEW, {
    type: 'geojson',
    data: geojson,
  });

  // Red alert glow
  map.addLayer({
    id: `${LAYER_IDS.GAP_VIEW}-glow`,
    type: 'line',
    source: LAYER_IDS.GAP_VIEW,
    paint: {
      'line-color': '#dc2626',
      'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.5, 12, 3.8, 15, 8.5],
      'line-blur': 2.0,
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0.35, 12, 0.6, 15, 0.85],
    },
  });

  // Core danger line
  map.addLayer({
    id: LAYER_IDS.GAP_VIEW,
    type: 'line',
    source: LAYER_IDS.GAP_VIEW,
    paint: {
      'line-color': '#f87171',
      'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.8, 12, 1.8, 15, 4.2],
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0.55, 12, 0.85, 15, 1.0],
    },
  });
}

// In-memory GeoJSON collection for user-painted What-If ridge barriers
const barrierCollection: FeatureCollection<Point> = {
  type: 'FeatureCollection',
  features: [],
};

/**
 * Initialize What-If Ridge Barrier visual overlay layers.
 */
export function initBarrierLayer(map: maplibregl.Map): void {
  if (map.getSource(LAYER_IDS.BARRIERS)) return;

  map.addSource(LAYER_IDS.BARRIERS, {
    type: 'geojson',
    data: barrierCollection,
  });

  // Outer glowing pulse ring
  map.addLayer({
    id: `${LAYER_IDS.BARRIERS}-halo`,
    type: 'circle',
    source: LAYER_IDS.BARRIERS,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 14, 14, 24, 17, 36],
      'circle-color': '#f43f5e',
      'circle-opacity': 0.28,
      'circle-blur': 0.6,
    },
  });

  // Core barricade marker with neon amber/rose hazard styling
  map.addLayer({
    id: LAYER_IDS.BARRIERS,
    type: 'circle',
    source: LAYER_IDS.BARRIERS,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 7, 14, 12, 17, 18],
      'circle-color': '#fb923c', // Energetic hazard amber
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2.5,
      'circle-opacity': 0.95,
    },
  });
}

/**
 * Add a new barrier point marker to the map.
 */
export function addBarrierFeature(map: maplibregl.Map, coords: [number, number]): number {
  const feature: Feature<Point> = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: coords,
    },
    properties: {
      id: `barrier-${Date.now()}`,
      height: 5.0,
      timestamp: new Date().toISOString(),
    },
  };

  barrierCollection.features.push(feature);
  const src = map.getSource(LAYER_IDS.BARRIERS) as maplibregl.GeoJSONSource | undefined;
  if (src) {
    src.setData(barrierCollection);
  }
  return barrierCollection.features.length;
}

/**
 * Clear all user-placed barriers from the map.
 */
export function clearBarrierFeatures(map: maplibregl.Map): void {
  barrierCollection.features = [];
  const src = map.getSource(LAYER_IDS.BARRIERS) as maplibregl.GeoJSONSource | undefined;
  if (src) {
    src.setData(barrierCollection);
  }
}

/**
 * Toggle layer visibility, including companion glow/ring layers.
 */
export function toggleLayer(map: maplibregl.Map, layerId: string, visible: boolean): void {
  const targetVisibility = visible ? 'visible' : 'none';
  if (map.getLayer(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', targetVisibility);
  }
  const glowId = `${layerId}-glow`;
  if (map.getLayer(glowId)) {
    map.setLayoutProperty(glowId, 'visibility', targetVisibility);
  }
  const ringId = `${layerId}-ring`;
  if (map.getLayer(ringId)) {
    map.setLayoutProperty(ringId, 'visibility', targetVisibility);
  }
}
