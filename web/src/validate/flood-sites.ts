/**
 * Validation overlay: reported flood sites from Sept 2022.
 *
 * Each point must have a source URL. No invented coordinates.
 * Source: docs/DATA_SOURCES.md section 3
 *
 * Selection bias warning: news mostly reports roads and apartments.
 * Treat as a partial sample.
 */

import type { FeatureCollection } from 'geojson';
import * as maplibregl from 'maplibre-gl';
import { LAYER_IDS } from '../map/layers';

/**
 * Add reported flood sites as a point layer.
 * Each feature must have a 'source_url' property.
 */
export function addFloodSitesLayer(
  map: maplibregl.Map,
  geojson: FeatureCollection,
): void {
  // Validate that each feature has a source URL
  for (const feature of geojson.features) {
    if (!feature.properties?.['source_url']) {
      console.warn(
        '[Ghost Drains] Flood site missing source_url:',
        feature.properties?.['name'] ?? 'unnamed',
      );
    }
  }

  map.addSource(LAYER_IDS.FLOOD_SITES, {
    type: 'geojson',
    data: geojson,
  });

  // Outer telemetry beacon ring
  map.addLayer({
    id: `${LAYER_IDS.FLOOD_SITES}-ring`,
    type: 'circle',
    source: LAYER_IDS.FLOOD_SITES,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 7, 13, 12, 16, 18],
      'circle-color': 'rgba(244, 63, 94, 0.22)',
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#f43f5e',
    },
  });

  // Inner sensor core
  map.addLayer({
    id: LAYER_IDS.FLOOD_SITES,
    type: 'circle',
    source: LAYER_IDS.FLOOD_SITES,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 3.5, 13, 5.5, 16, 8],
      'circle-color': '#ffffff',
      'circle-stroke-width': 2.5,
      'circle-stroke-color': '#e11d48',
    },
  });

  // Change cursor to pointer on hover
  map.on('mouseenter', LAYER_IDS.FLOOD_SITES, () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', LAYER_IDS.FLOOD_SITES, () => {
    map.getCanvas().style.cursor = '';
  });

  // Interactive popup on click
  map.on('click', LAYER_IDS.FLOOD_SITES, (e) => {
    const feature = e.features?.[0];
    if (!feature || feature.geometry.type !== 'Point') return;
    const coords = feature.geometry.coordinates.slice() as [number, number];
    const props = (feature.properties ?? {}) as Record<string, string>;

    const html = `
      <div style="font-family: system-ui, sans-serif; color: #0f172a; font-size: 12px; line-height: 1.4; max-width: 260px; padding: 4px;">
        <div style="font-weight: 700; font-size: 13px; color: #e11d48; margin-bottom: 4px;">${props['name'] ?? 'Reported Flood Site'}</div>
        <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">${props['locality'] ?? ''} &bull; ${props['date'] ?? 'Sept 2022'}</div>
        <div style="margin-bottom: 8px;">${props['notes'] ?? ''}</div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 6px;">
          <a href="${props['source_url']}" target="_blank" rel="noopener noreferrer" style="color: #0284c7; text-decoration: underline; font-weight: 600;">Read on ${props['source_publisher'] ?? 'Source'} &rarr;</a>
        </div>
      </div>
    `;

    new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: '300px' })
      .setLngLat(coords)
      .setHTML(html)
      .addTo(map);
  });
}
