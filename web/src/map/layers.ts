/**
 * Layer management for Ghost Drains overlays.
 *
 * Manages: ghost drain lines, official SWD, gap view, ponding/HAND.
 * Source: docs/ARCHITECTURE.md section 7, docs/PRD.md F-01 to F-05
 */

import type { FeatureCollection } from 'geojson';
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
} as const;

/**
 * Add ghost drain lines from GeoJSON.
 * Width varies by contributing area.
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
      'line-width': ['interpolate', ['linear'], ['zoom'], 9, 2.2, 12, 4.5, 15, 9.0],
      'line-blur': 2.5,
      'line-opacity': 0.6,
    },
  });

  // Core electric cyan line
  map.addLayer({
    id: LAYER_IDS.GHOST_DRAINS,
    type: 'line',
    source: LAYER_IDS.GHOST_DRAINS,
    paint: {
      'line-color': '#22d3ee', // Luminous vibrant cyan
      'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.9, 12, 2.0, 15, 4.2],
      'line-opacity': 0.95,
    },
  });
}

/**
 * Add official SWD lines (primary/secondary/tertiary).
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
      'line-width': ['interpolate', ['linear'], ['zoom'], 9, 2.0, 12, 4.0, 15, 8.0],
      'line-blur': 2.0,
      'line-opacity': 0.55,
    },
  });

  // Core gold line
  map.addLayer({
    id: LAYER_IDS.OFFICIAL_SWD,
    type: 'line',
    source: LAYER_IDS.OFFICIAL_SWD,
    paint: {
      'line-color': '#fbbf24', // Luminous gold
      'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.9, 12, 1.9, 15, 3.8],
      'line-opacity': 0.95,
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
      'line-width': ['interpolate', ['linear'], ['zoom'], 9, 2.5, 12, 5.0, 15, 10.0],
      'line-blur': 2.5,
      'line-opacity': 0.65,
    },
  });

  // Core danger line
  map.addLayer({
    id: LAYER_IDS.GAP_VIEW,
    type: 'line',
    source: LAYER_IDS.GAP_VIEW,
    paint: {
      'line-color': '#f87171',
      'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.2, 12, 2.6, 15, 5.2],
      'line-opacity': 0.95,
    },
  });
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
