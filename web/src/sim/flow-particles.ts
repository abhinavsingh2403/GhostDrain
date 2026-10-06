/**
 * Professional Micro-Streamline Flow Arrow System.
 *
 * Renders sleek, microscopic vector arrows indicating rainwater runoff paths
 * across Bengaluru's topography into valleys and lake basins.
 *
 * Uses screen-space projection via MapLibre's camera to maintain razor-sharp,
 * perfectly proportioned micro-arrows (8-13px) at any zoom level, avoiding
 * low-resolution texture stretching and guaranteeing 60 FPS performance.
 */

import type * as maplibregl from 'maplibre-gl';
import { BENGALURU_BBOX } from '../constants';

export interface GeoFlowArrow {
  lon: number;
  lat: number;
  vx: number;
  vy: number;
  speed: number;
  age: number;
  maxAge: number;
  tailLength: number;
}

export class FlowParticleSystem {
  readonly arrows: GeoFlowArrow[];
  readonly maxArrows: number;
  readonly gridWidth: number;
  readonly gridHeight: number;
  readonly bbox: readonly [number, number, number, number];

  constructor(
    gridWidth = 160,
    gridHeight = 160,
    maxArrows = 1000,
    bbox = BENGALURU_BBOX,
  ) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.maxArrows = maxArrows;
    this.bbox = bbox;
    this.arrows = [];

    for (let i = 0; i < maxArrows; i++) {
      this.arrows.push(this.spawnArrow());
    }
  }

  spawnArrow(bounds?: { west: number; south: number; east: number; north: number }): GeoFlowArrow {
    const [w, s, e, n] = this.bbox;
    let minLon = w;
    let maxLon = e;
    let minLat = s;
    let maxLat = n;

    // Viewport-focused density: 85% of particles spawn directly in the active screen area
    if (bounds) {
      if (Math.random() < 0.85) {
        const spanLon = bounds.east - bounds.west;
        const spanLat = bounds.north - bounds.south;
        minLon = Math.max(w, bounds.west - spanLon * 0.15);
        maxLon = Math.min(e, bounds.east + spanLon * 0.15);
        minLat = Math.max(s, bounds.south - spanLat * 0.15);
        maxLat = Math.min(n, bounds.north + spanLat * 0.15);
      }
    }

    const marginLon = (maxLon - minLon) * 0.02;
    const marginLat = (maxLat - minLat) * 0.02;
    return {
      lon: minLon + marginLon + Math.random() * Math.max(1e-5, maxLon - minLon - 2 * marginLon),
      lat: minLat + marginLat + Math.random() * Math.max(1e-5, maxLat - minLat - 2 * marginLat),
      vx: 0,
      vy: 0,
      speed: 0.000075 + Math.random() * 0.000055,
      age: Math.floor(Math.random() * 45),
      maxAge: 70 + Math.floor(Math.random() * 50),
      tailLength: 10 + Math.random() * 6, // 10-16 screen pixels
    };
  }

  /**
   * Reset all arrows across the catchment area.
   */
  reset(): void {
    for (let i = 0; i < this.arrows.length; i++) {
      this.arrows[i] = this.spawnArrow();
    }
  }

  /**
   * Update particle positions along terrain gradient and draw micro flow arrows in screen space.
   */
  updateAndDraw(
    ctx: CanvasRenderingContext2D,
    map: maplibregl.Map,
    terrain: Float32Array,
    water: Float32Array,
    isRaining: boolean,
  ): void {
    const [w, s, e, n] = this.bbox;
    const { gridWidth, gridHeight } = this;
    const canvas = ctx.canvas;
    const screenW = canvas.width;
    const screenH = canvas.height;

    ctx.clearRect(0, 0, screenW, screenH);
    if (!isRaining) return;

    // Probe current camera viewport bounds for focused spawning
    let vpBounds: { west: number; south: number; east: number; north: number } | undefined;
    if (typeof (map as any).getBounds === 'function') {
      try {
        const b = (map as any).getBounds();
        if (b) {
          vpBounds = {
            west: b.getWest(),
            south: b.getSouth(),
            east: b.getEast(),
            north: b.getNorth(),
          };
        }
      } catch {
        // Fallback if map bounds not yet calculated
      }
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < this.arrows.length; i++) {
      const a = this.arrows[i]!;
      a.age++;

      // Respawn when expired or out of geographic bbox
      if (
        a.age >= a.maxAge ||
        a.lon < w ||
        a.lon > e ||
        a.lat < s ||
        a.lat > n
      ) {
        this.arrows[i] = this.spawnArrow(vpBounds);
        continue;
      }

      // Map (lon, lat) to simulation grid index
      const col = Math.floor(((a.lon - w) / (e - w)) * (gridWidth - 1));
      const row = Math.floor(((n - a.lat) / (n - s)) * (gridHeight - 1));

      if (col < 1 || col >= gridWidth - 1 || row < 1 || row >= gridHeight - 1) {
        this.arrows[i] = this.spawnArrow(vpBounds);
        continue;
      }

      const idx = row * gridWidth + col;

      // Sample effective elevation (terrain + water depth)
      const zL = (terrain[idx - 1] ?? 0) + (water[idx - 1] ?? 0);
      const zR = (terrain[idx + 1] ?? 0) + (water[idx + 1] ?? 0);
      const zT = (terrain[idx - gridWidth] ?? 0) + (water[idx - gridWidth] ?? 0);
      const zB = (terrain[idx + gridWidth] ?? 0) + (water[idx + gridWidth] ?? 0);

      // Downslope steepest descent vector
      let dLon = -(zR - zL);
      let dLat = zB - zT;
      const gLen = Math.sqrt(dLon * dLon + dLat * dLat);

      if (gLen > 1e-4) {
        dLon /= gLen;
        dLat /= gLen;
      } else {
        dLon = a.vx;
        dLat = a.vy;
        a.age += 2; // Fade out in flat basins
      }

      // Smooth inertia turning
      if (a.vx === 0 && a.vy === 0) {
        a.vx = dLon;
        a.vy = dLat;
      } else {
        a.vx = a.vx * 0.78 + dLon * 0.22;
        a.vy = a.vy * 0.78 + dLat * 0.22;
      }

      const vLen = Math.sqrt(a.vx * a.vx + a.vy * a.vy) || 1;
      a.vx /= vLen;
      a.vy /= vLen;

      // Advance geographic coordinates
      a.lon += a.vx * a.speed;
      a.lat += a.vy * a.speed;

      // Project arrow tip to screen space
      const headPt = map.project([a.lon, a.lat]);
      if (
        headPt.x < -20 ||
        headPt.x > screenW + 20 ||
        headPt.y < -20 ||
        headPt.y > screenH + 20
      ) {
        continue;
      }

      // Project trail point to obtain screen orientation vector
      const trailLon = a.lon - a.vx * 0.0004;
      const trailLat = a.lat - a.vy * 0.0004;
      const trailPt = map.project([trailLon, trailLat]);

      const sDx = headPt.x - trailPt.x;
      const sDy = headPt.y - trailPt.y;
      const sLen = Math.sqrt(sDx * sDx + sDy * sDy);
      if (sLen < 0.2) continue;

      const angle = Math.atan2(sDy, sDx);
      const hx = headPt.x;
      const hy = headPt.y;
      const tx = hx - a.tailLength * Math.cos(angle);
      const ty = hy - a.tailLength * Math.sin(angle);

      // Micro arrowhead dimensions (crisp, small, elegant)
      const headSize = 4.2;
      const headWidth = 2.8;

      const lx = hx - headSize * Math.cos(angle) + headWidth * Math.sin(angle);
      const ly = hy - headSize * Math.sin(angle) - headWidth * Math.cos(angle);
      const rx = hx - headSize * Math.cos(angle) - headWidth * Math.sin(angle);
      const ry = hy - headSize * Math.sin(angle) + headWidth * Math.cos(angle);

      // Smooth fade envelope over lifetime
      const progress = a.age / a.maxAge;
      const alpha = Math.sin(progress * Math.PI) * 0.90;
      if (alpha <= 0.03) continue;

      // Subtle drop shadow for clarity on all basemaps
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 2;

      // Sleek luminous cyan shaft (width 1.6px)
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx - headSize * 0.5 * Math.cos(angle), hy - headSize * 0.5 * Math.sin(angle));
      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Sharp white micro-arrowhead tip
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(lx, ly);
      ctx.lineTo(rx, ry);
      ctx.closePath();
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
      ctx.fill();
    }

    ctx.restore();
  }
}
