/**
 * Named constants for Ghost Drains.
 *
 * RULE: DEM tile encoding must be an explicit constant with a test.
 * MapLibre raster-dem default is 'mapbox'. We use Terrarium.
 * Using the wrong encoding silently produces wrong heights.
 * Source: docs/ARCHITECTURE.md section 7
 */

/**
 * Terrarium elevation encoding.
 * Formula: elevation_m = (R * 256 + G + B / 256) - 32768
 * Source: https://data.source.coop/smartmaps/mapterhorn-japan-bridge/README.md
 */
export const TERRAIN_ENCODING = 'terrarium' as const;

/**
 * Decode Terrarium RGB to elevation in metres.
 * @param r Red channel (0-255)
 * @param g Green channel (0-255)
 * @param b Blue channel (0-255)
 * @returns Elevation in metres
 */
export function terrariumDecode(r: number, g: number, b: number): number {
  return r * 256 + g + b / 256 - 32768;
}

/**
 * Encode elevation to Terrarium RGB.
 * @param elevation Elevation in metres
 * @returns [R, G, B] tuple
 */
export function terrariumEncode(elevation: number): [number, number, number] {
  const val = elevation + 32768;
  const r = Math.min(Math.floor(val / 256), 255);
  const g = Math.min(Math.floor(val % 256), 255);
  const b = Math.min(Math.floor((val * 256) % 256), 255);
  return [r, g, b];
}

/** Bengaluru approximate centre [longitude, latitude]. Never swap. */
export const BENGALURU_CENTER: [number, number] = [77.594566, 12.971599];

/** Default map zoom level. */
export const DEFAULT_ZOOM = 11;

/** Nodata sentinel for binary rasters. */
export const NODATA = -9999.0;

/** Display grid CRS. */
export const DISPLAY_CRS = 'EPSG:3857';

/** Analysis CRS (metric). UTM zone 43N. Confirm with pyproj [U]. */
export const ANALYSIS_CRS = 'EPSG:32643';

/** Study area bounding box [lon_min, lat_min, lon_max, lat_max] from config.yaml */
export const BENGALURU_BBOX: readonly [number, number, number, number] = [77.45, 12.85, 77.75, 13.10];

/** Camera pan bounds [[W, S], [E, N]] with buffer to prevent lost viewport */
export const BENGALURU_CAMERA_BOUNDS: [[number, number], [number, number]] = [
  [77.10, 12.60],
  [78.10, 13.35],
];
