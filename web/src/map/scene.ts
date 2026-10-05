/**
 * MapLibre scene initialization with 3D terrain.
 *
 * Sets up the map with:
 * - Terrarium-encoded terrain source (encoding set EXPLICITLY, never default)
 * - Satellite imagery drape (EOX Sentinel-2)
 * - Hillshade layer for slope readability
 * - Sky and fog for depth
 *
 * Source: docs/ARCHITECTURE.md section 7, docs/MAP_DECISION.md
 */

import * as maplibregl from 'maplibre-gl';
import {
  TERRAIN_ENCODING,
  BENGALURU_CENTER,
  BENGALURU_CAMERA_BOUNDS,
  DEFAULT_ZOOM,
} from '../constants';

/**
 * Initialize the MapLibre map with 3D terrain.
 *
 * @param container DOM element ID for the map
 * @returns The initialized map instance
 */
export function initMap(container: string): maplibregl.Map {
  const map = new maplibregl.Map({
    container,
    // Using OpenFreeMap as basemap. Credit: OpenFreeMap, OpenMapTiles, OSM.
    // Source: docs/DATA_SOURCES.md DS-06
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: BENGALURU_CENTER,
    zoom: DEFAULT_ZOOM,
    minZoom: 9.5,
    maxBounds: BENGALURU_CAMERA_BOUNDS,
    renderWorldCopies: false,
    pitch: 45,
    bearing: 0,
    maxPitch: 85,
    hash: true, // F-10: shareable view via URL hash
  });

  map.on('load', () => {
    try {
      addTerrainSource(map);
    } catch (err) {
      console.warn('[Ghost Drains] Terrain source error:', err);
    }
    try {
      addSatelliteSource(map);
    } catch (err) {
      console.warn('[Ghost Drains] Satellite source error:', err);
    }
    try {
      addCinematicAtmosphere(map);
    } catch (err) {
      console.warn('[Ghost Drains] Atmosphere error:', err);
    }
    try {
      enhanceWaterAndBuildings(map);
    } catch (err) {
      console.warn('[Ghost Drains] Water/building enhancement error:', err);
    }
    try {
      addAttribution(map);
    } catch (err) {
      console.warn('[Ghost Drains] Attribution error:', err);
    }
  });

  return map;
}

/**
 * Add Terrarium-encoded terrain source and enable 3D terrain.
 *
 * CRITICAL: encoding MUST be 'terrarium', not the MapLibre default 'mapbox'.
 * Wrong encoding silently produces wrong heights.
 * Source: docs/ARCHITECTURE.md section 7
 */
function addTerrainSource(map: maplibregl.Map): void {
  // AWS Terrarium elevation tiles (256x256, Terrarium encoded)
  // Formula: (R*256 + G + B/256) - 32768
  // Source: docs/ARCHITECTURE.md section 7
  map.addSource('terrain-source', {
    type: 'raster-dem',
    tiles: [
      'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
    ],
    tileSize: 256,
    maxzoom: 15,
    encoding: TERRAIN_ENCODING, // EXPLICIT: 'terrarium'. Never omit.
  });

  map.setTerrain({
    source: 'terrain-source',
    exaggeration: 1.5, // Mild exaggeration for readability; label in UI
  });

  // Hillshade for slope readability
  map.addSource('hillshade-source', {
    type: 'raster-dem',
    tiles: [
      'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
    ],
    tileSize: 256,
    maxzoom: 15,
    encoding: TERRAIN_ENCODING,
  });

  map.addLayer({
    id: 'hillshade',
    type: 'hillshade',
    source: 'hillshade-source',
    paint: {
      'hillshade-shadow-color': '#0f172a',
      'hillshade-highlight-color': '#ffffff',
      'hillshade-illumination-direction': 315,
      'hillshade-exaggeration': 0.4,
    },
  });

  try {
    map.setLight({
      anchor: 'map',
      color: '#ffffff',
      intensity: 0.65,
      position: [1.5, 315, 55],
    });
  } catch {
    // Ignore if not supported in current style
  }
}

/**
 * Add satellite imagery source for terrain drape.
 * Source: docs/DATA_SOURCES.md DS-09 (EOX Sentinel-2 cloudless)
 */
function addSatelliteSource(map: maplibregl.Map): void {
  // Ultra-High Resolution Satellite Imagery (ESRI World Imagery, sub-meter clarity up to zoom 19)
  map.addSource('satellite', {
    type: 'raster',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    ],
    tileSize: 256,
    attribution:
      '© <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a>, Maxar, Earthstar Geographics',
    maxzoom: 19,
  });

  const symbolLayer = map.getStyle().layers?.find((l: maplibregl.LayerSpecification) => l.type === 'symbol');
  map.addLayer(
    {
      id: 'satellite-layer',
      type: 'raster',
      source: 'satellite',
      paint: {
        'raster-opacity': 0.92,
        'raster-fade-duration': 150,
      },
    },
    symbolLayer ? symbolLayer.id : undefined,
  );
}

/**
 * Add realistic sky dome and horizon fog.
 */
function addCinematicAtmosphere(map: maplibregl.Map): void {
  try {
    map.setSky({
      'sky-color': '#0284c7',
      'sky-horizon-blend': 0.6,
      'horizon-color': '#bae6fd',
      'horizon-fog-blend': 0.7,
      'fog-color': '#0f172a',
      'fog-ground-blend': 0.5,
    });
  } catch (e) {
    // Graceful fallback if setSky is not supported in current style
  }
}

/**
 * Enhance real lakes, rajakaluves, and 3D buildings above the satellite drape.
 */
function enhanceWaterAndBuildings(map: maplibregl.Map): void {
  const symbolLayer = map.getStyle().layers?.find((l: maplibregl.LayerSpecification) => l.type === 'symbol');

  // Real water bodies (lakes & tanks) with crystal azure fill
  if (!map.getLayer('water-lakes-hd')) {
    map.addLayer(
      {
        id: 'water-lakes-hd',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        paint: {
          'fill-color': '#0369a1',
          'fill-opacity': 0.75,
        },
      },
      symbolLayer ? symbolLayer.id : undefined,
    );
  }

  // Real waterways and rajakaluves with glowing cyan line
  if (!map.getLayer('waterways-hd')) {
    map.addLayer(
      {
        id: 'waterways-hd',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'waterway',
        paint: {
          'line-color': '#38bdf8',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 1.2,
            14, 3.0,
            17, 7.0,
          ],
          'line-opacity': 0.9,
        },
      },
      symbolLayer ? symbolLayer.id : undefined,
    );
  }

  // Architectural 3D buildings
  if (map.getLayer('building-3d')) {
    try {
      map.setPaintProperty('building-3d', 'fill-extrusion-color', [
        'interpolate',
        ['linear'],
        ['get', 'render_height'],
        0, '#1e293b',
        25, '#334155',
        75, '#475569',
        150, '#64748b',
      ]);
      map.setPaintProperty('building-3d', 'fill-extrusion-opacity', 0.88);
    } catch (e) {
      // Ignore paint update if layer attributes differ
    }
  }
}

/**
 * Add required attribution text.
 * Source: docs/LICENSES_ATTRIBUTION.md section 5
 */
function addAttribution(map: maplibregl.Map): void {
  map.addControl(
    new maplibregl.AttributionControl({
      compact: false,
      customAttribution: [
        '© <a href="https://www.esri.com">Esri</a>, Maxar',
        '© <a href="https://openfreemap.org">OpenFreeMap</a>',
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        '© <a href="https://mapterhorn.com/attribution">Mapterhorn</a>',
      ],
    }),
    'bottom-right',
  );

  map.addControl(new maplibregl.NavigationControl(), 'top-right');
  map.addControl(new maplibregl.ScaleControl({ maxWidth: 200, unit: 'metric' }), 'bottom-left');
}
