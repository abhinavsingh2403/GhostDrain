/**
 * URL Hash State Synchronization (F-10 / M3).
 *
 * Keeps active layer visibility, rain rate, and camera parameters
 * synchronized in the browser URL hash for instant sharing and reproducible views.
 * Source: docs/PRD.md F-10, docs/ROADMAP_TASKS.md M3.
 */

export interface AppHashState {
  zoom?: number;
  lat?: number;
  lng?: number;
  bearing?: number;
  pitch?: number;
  layers?: string[];
  rain?: number;
}

/**
 * Parse an application state from a URL hash string.
 * Supports both MapLibre's camera prefix (#zoom/lat/lng/bearing/pitch)
 * and extended URL-encoded parameters (&layers=a,b&rain=50).
 */
export function parseHashState(hash: string): AppHashState {
  if (!hash || hash === '#') {
    return {};
  }

  const clean = hash.startsWith('#') ? hash.slice(1) : hash;
  const parts = clean.split('&');
  const result: AppHashState = {};

  // First part may be camera coordinates #zoom/lat/lng/bearing/pitch or a key=value pair
  const firstPart = parts[0];
  if (firstPart && firstPart.includes('/')) {
    const coords = firstPart.split('/');
    if (coords[0] !== undefined && !Number.isNaN(parseFloat(coords[0]))) {
      result.zoom = parseFloat(coords[0]);
    }
    if (coords[1] !== undefined && !Number.isNaN(parseFloat(coords[1]))) {
      result.lat = parseFloat(coords[1]);
    }
    if (coords[2] !== undefined && !Number.isNaN(parseFloat(coords[2]))) {
      result.lng = parseFloat(coords[2]);
    }
    if (coords[3] !== undefined && !Number.isNaN(parseFloat(coords[3]))) {
      result.bearing = parseFloat(coords[3]);
    }
    if (coords[4] !== undefined && !Number.isNaN(parseFloat(coords[4]))) {
      result.pitch = parseFloat(coords[4]);
    }
  } else if (firstPart && firstPart.includes('=')) {
    parseParam(firstPart, result);
  }

  // Parse remaining key=value pairs
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part) {
      parseParam(part, result);
    }
  }

  return result;
}

function parseParam(param: string, result: AppHashState): void {
  const [key, value] = param.split('=');
  if (!key || value === undefined) return;

  if (key === 'layers') {
    result.layers = value.split(',').filter((s) => s.length > 0);
  } else if (key === 'rain') {
    const num = parseFloat(value);
    if (!Number.isNaN(num)) {
      result.rain = num;
    }
  } else if (key === 'zoom') {
    const num = parseFloat(value);
    if (!Number.isNaN(num)) result.zoom = num;
  }
}

/**
 * Format application state into a clean URL hash string.
 */
export function formatHashState(state: AppHashState): string {
  const segments: string[] = [];

  // 1. Camera segment if present
  if (state.zoom !== undefined && state.lat !== undefined && state.lng !== undefined) {
    const z = state.zoom.toFixed(2);
    const lat = state.lat.toFixed(4);
    const lng = state.lng.toFixed(4);
    const bearing = (state.bearing ?? 0).toFixed(1);
    const pitch = (state.pitch ?? 0).toFixed(1);
    segments.push(`${z}/${lat}/${lng}/${bearing}/${pitch}`);
  }

  // 2. Active layers
  if (state.layers && state.layers.length > 0) {
    segments.push(`layers=${state.layers.join(',')}`);
  }

  // 3. Rain rate
  if (state.rain !== undefined) {
    segments.push(`rain=${Math.round(state.rain)}`);
  }

  return segments.length > 0 ? `#${segments.join('&')}` : '';
}

/**
 * Sync the given state to window.location.hash without triggering scroll jumps.
 */
export function syncHashState(state: AppHashState): void {
  if (typeof window === 'undefined') return;
  const newHash = formatHashState(state);
  if (window.location.hash !== newHash) {
    window.history.replaceState(null, '', newHash || window.location.pathname);
  }
}
