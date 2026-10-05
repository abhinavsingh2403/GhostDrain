/**
 * TypeScript interface for grid.meta.json — the shared artifact contract.
 * Source: docs/ARCHITECTURE.md section 5.
 *
 * All binary .f32.bin rasters share this metadata:
 * - float32, little-endian, row-major
 * - Row 0 = north edge
 */

export interface GridMeta {
  /** Artifact set identifier, e.g. 'bengaluru-core-v1' */
  readonly id: string;

  /** Display CRS. Must be 'EPSG:3857'. */
  readonly crs: 'EPSG:3857';

  /** Bounding box in Web Mercator: [minx, miny, maxx, maxy] */
  readonly bbox_3857: readonly [number, number, number, number];

  /** Grid width in pixels/cells */
  readonly width: number;

  /** Grid height in pixels/cells */
  readonly height: number;

  /** Cell size in Web Mercator metres */
  readonly cell_size_3857_m: number;

  /** Reference latitude for ground scale (degrees) */
  readonly lat0_deg: number;

  /**
   * Ground scale factor: cos(lat0).
   * True ground cell size = cell_size_3857_m * ground_scale_k
   */
  readonly ground_scale_k: number;

  /** Nodata sentinel value (typically -9999) */
  readonly nodata: number;

  /** Dataset ID from manifest, e.g. 'DS-01' */
  readonly dem_source_id: string;

  /** ISO-8601 creation timestamp */
  readonly created_at: string;

  /** Git commit SHA of the pipeline run */
  readonly pipeline_git_sha: string;
}

/**
 * Validate a parsed object against the GridMeta contract.
 * Fails loudly on missing or mistyped fields.
 */
export function validateGridMeta(obj: unknown): GridMeta {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error('grid.meta.json is not a valid object');
  }

  const meta = obj as Record<string, unknown>;
  const required: Array<[string, string]> = [
    ['id', 'string'],
    ['crs', 'string'],
    ['width', 'number'],
    ['height', 'number'],
    ['cell_size_3857_m', 'number'],
    ['lat0_deg', 'number'],
    ['ground_scale_k', 'number'],
    ['nodata', 'number'],
    ['dem_source_id', 'string'],
    ['created_at', 'string'],
    ['pipeline_git_sha', 'string'],
  ];

  for (const [key, expectedType] of required) {
    if (!(key in meta)) {
      throw new Error(`grid.meta.json missing required key: ${key}`);
    }
    if (typeof meta[key] !== expectedType) {
      throw new Error(
        `grid.meta.json key '${key}' expected ${expectedType}, got ${typeof meta[key]}`
      );
    }
  }

  if (meta['crs'] !== 'EPSG:3857') {
    throw new Error(`grid.meta.json CRS must be EPSG:3857, got ${String(meta['crs'])}`);
  }

  if (!Array.isArray(meta['bbox_3857']) || (meta['bbox_3857'] as unknown[]).length !== 4) {
    throw new Error('grid.meta.json bbox_3857 must be a 4-element array');
  }

  return meta as unknown as GridMeta;
}
