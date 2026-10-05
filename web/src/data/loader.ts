/**
 * Artifact loader: fetches grid.meta.json and binary rasters.
 * Validates shapes against metadata. Fails loudly on mismatch.
 * Source: docs/ARCHITECTURE.md section 7, module 'data/'.
 */

import type { FeatureCollection } from 'geojson';
import { NODATA } from '../constants';
import type { GridMeta } from './grid-meta';
import { validateGridMeta } from './grid-meta';

const DATA_BASE = '/data';

/**
 * Load and validate grid.meta.json.
 */
export async function loadGridMeta(): Promise<GridMeta> {
  const url = `${DATA_BASE}/grid.meta.json`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to load grid.meta.json: ${resp.status} ${resp.statusText}`);
  }
  const json: unknown = await resp.json();
  return validateGridMeta(json);
}

/**
 * Load a binary float32 raster and validate its size against metadata.
 *
 * Binary format: little-endian float32, row-major, row 0 = north.
 *
 * @param filename e.g. 'dem.f32.bin'
 * @param meta Grid metadata for shape validation
 * @returns Float32Array of length width * height
 */
export async function loadBinaryRaster(
  filename: string,
  meta: GridMeta,
): Promise<Float32Array> {
  const url = `${DATA_BASE}/${filename}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(
      `Required artifact '${filename}' is missing or unreachable: ` +
      `${resp.status} ${resp.statusText}. ` +
      `Run 'make pipeline' to generate artifacts.`
    );
  }

  const buffer = await resp.arrayBuffer();
  const expectedBytes = meta.width * meta.height * 4; // float32 = 4 bytes

  if (buffer.byteLength !== expectedBytes) {
    throw new Error(
      `Artifact '${filename}' size mismatch: ` +
      `expected ${expectedBytes} bytes (${meta.width}x${meta.height} float32), ` +
      `got ${buffer.byteLength} bytes. ` +
      `Dimensions disagree with grid.meta.json — this is a hard error.`
    );
  }

  return new Float32Array(buffer);
}

/**
 * Load a GeoJSON file from the data directory.
 */
export async function loadGeoJSON(filename: string): Promise<FeatureCollection> {
  const url = `${DATA_BASE}/${filename}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to load GeoJSON '${filename}': ${resp.status}`);
  }
  return (await resp.json()) as FeatureCollection;
}
