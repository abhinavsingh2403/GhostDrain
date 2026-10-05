/**
 * CPU-side virtual-pipe shallow-water simulation.
 *
 * Method: Mei, Decaudin, Hu (2007), "Fast Hydraulic Erosion Simulation
 * and Visualization on GPU", Pacific Graphics, pp. 47-56.
 * Source: https://hgpu.org/?p=2256
 *
 * Implements WATER FLOW ONLY (no erosion, no sediment).
 * See docs/HYDROLOGY_SPEC.md section 8.
 *
 * This simulation is ILLUSTRATIVE. It is NOT calibrated to any gauge
 * or event. It cannot represent drains, culverts, or sewers at 30 m.
 *
 * All equations are transcribed from the paper and cross-checked against
 * getbutterfly.com/procedural-eroded-terrain-in-three-js-theory-techniques-field-notes/
 * Equation numbers reference Mei et al. 2007.
 */

/** Pipe flux indices: Left, Right, Top, Bottom */
const L = 0;
const R = 1;
const T = 2;
const B = 3;

/** Standard gravity (m/s²) — a physical constant, not a tunable. */
const GRAVITY = 9.81;

/**
 * TypeScript note: `noUncheckedIndexedAccess` is enabled, so typed-array
 * index access returns `number | undefined`. All loops in this module use
 * bounded indices (0..n-1) on correctly-sized Float32Arrays, so `!`
 * non-null assertions are safe. No `any` is used.
 */

/**
 * Immutable simulation configuration.
 */
export interface PipeSimConfig {
  /** Grid width in cells */
  readonly width: number;
  /** Grid height in cells */
  readonly height: number;
  /** Cell size / pipe length in metres (true ground size) */
  readonly cellSize: number;
  /** Pipe cross-section area in m² (= cellSize² for square cells) */
  readonly pipeArea: number;
  /** Maximum time step in seconds (stability clamp) */
  readonly maxDt: number;
  /** Rain rate in mm/h (user-adjustable) */
  readonly rainMmH: number;
  /**
   * Boundary mode:
   * - 'open': edges drain freely (flux out = unclamped, water leaves domain)
   * - 'closed': edges are walls (no flux across boundary)
   */
  readonly boundary: 'open' | 'closed';
}

/**
 * Mutable simulation state arrays.
 * All arrays are row-major, row 0 = north edge, length = width * height.
 * Flux array length = width * height * 4 (L, R, T, B per cell).
 */
export interface PipeSimState {
  /** Terrain elevation (m). Immutable after init. */
  readonly terrain: Float32Array;
  /** Water depth (m). >= 0 always. */
  readonly water: Float32Array;
  /** Outflow flux per pipe (m³/s). 4 values per cell: [L, R, T, B]. */
  readonly flux: Float32Array;
  /** Simulated time elapsed (s). */
  simTime: number;
  /** Total rain volume added (m³). For mass-balance test. */
  totalRainVolume: number;
  /** Total volume drained through open boundaries (m³). */
  totalBoundaryOutflow: number;
}

/**
 * Create initial simulation state from a terrain DEM.
 *
 * @param terrain Float32Array of terrain elevations (row-major, north-up)
 * @param config Simulation configuration
 * @returns Initial state with zero water and zero flux
 */
export function createState(
  terrain: Float32Array,
  config: PipeSimConfig,
): PipeSimState {
  const n = config.width * config.height;
  if (terrain.length !== n) {
    throw new Error(
      `Terrain array length ${terrain.length} does not match grid ${config.width}x${config.height} = ${n}`,
    );
  }

  return {
    terrain: new Float32Array(terrain), // defensive copy
    water: new Float32Array(n),         // all zeros
    flux: new Float32Array(n * 4),      // all zeros
    simTime: 0,
    totalRainVolume: 0,
    totalBoundaryOutflow: 0,
  };
}

/**
 * Compute a stable time step using a CFL-type bound for shallow water.
 *
 * dt <= C * dx / sqrt(g * h_max)
 *
 * where C < 1 is a safety factor. This is a standard shallow-water CFL
 * condition. VERIFY_CHECKLIST item 15 notes this needs verification
 * against the specific virtual-pipe scheme.
 *
 * Reference: HYDROLOGY_SPEC.md section 8, stability bound.
 * [U] — conservative; paper doesn't give an explicit CFL but the
 * pipe model is equivalent to shallow water at the grid scale.
 *
 * @param config Simulation configuration
 * @param water Current water depth array
 * @returns Stable time step in seconds, clamped to maxDt
 */
export function computeDt(
  config: PipeSimConfig,
  water: Float32Array,
): number {
  const CFL_SAFETY = 0.5; // C < 1, conservative

  let hMax = 0;
  for (let i = 0; i < water.length; i++) {
    const w = water[i]!;
    if (w > hMax) hMax = w;
  }

  if (hMax <= 1e-10) {
    // No water yet — use maxDt
    return config.maxDt;
  }

  const waveSpeed = Math.sqrt(GRAVITY * hMax);
  const cflDt = (CFL_SAFETY * config.cellSize) / waveSpeed;

  return Math.min(cflDt, config.maxDt);
}

/**
 * Advance the simulation by one time step.
 *
 * Follows Mei et al. 2007 pipeline (water only):
 *   1. Add rain
 *   2. Update flux (Eq. 1-2)
 *   3. Scale flux (Eq. 3-4)
 *   4. Update water depth (Eq. 5-6)
 *
 * @param state Mutable simulation state (modified in place)
 * @param config Simulation configuration
 * @param dt Time step in seconds (caller should use computeDt)
 */
export function step(
  state: PipeSimState,
  config: PipeSimConfig,
  dt: number,
): void {
  const { width, height, cellSize, pipeArea, boundary } = config;
  const { terrain, water, flux } = state;
  const n = width * height;
  const cellArea = cellSize * cellSize; // lx * ly for square cells

  // ── Step 1: Add rain ──────────────────────────────────────────────
  // rain_m_per_s = (mm_per_hour / 1000) / 3600
  // Source: HYDROLOGY_SPEC.md section 8, "Our additions"
  const rainMPerS = (config.rainMmH / 1000) / 3600;
  const rainThisStep = rainMPerS * dt;

  if (rainThisStep > 0) {
    for (let i = 0; i < n; i++) {
      water[i] = water[i]! + rainThisStep;
    }
    state.totalRainVolume += rainThisStep * n * cellArea;
  }

  // ── Step 2: Update flux (Mei et al. 2007, Eq. 1-2) ───────────────
  //
  //   Δh_K = (b_self + d_self) − (b_neighbour + d_neighbour)
  //   f_K^{t+dt} = max(0, f_K^t + dt * A * g * Δh_K / l)
  //
  // where:
  //   b = terrain height, d = water depth
  //   A = pipe cross-section area (m²)
  //   g = 9.81 m/s²
  //   l = pipe length (= cellSize, distance between cell centres)
  //   K ∈ {L, R, T, B}
  //
  // The max(0, ...) ensures flux is never negative (water only flows
  // downhill through each pipe; reverse flow is handled by the
  // neighbour's pipe back to us).

  const accel = dt * pipeArea * GRAVITY / cellSize;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = row * width + col;
      const fi = idx * 4;
      const hSelf = terrain[idx]! + water[idx]!;

      // Left neighbour (col - 1)
      if (col > 0) {
        const ni = idx - 1;
        const dh = hSelf - (terrain[ni]! + water[ni]!);
        flux[fi + L] = Math.max(0, flux[fi + L]! + accel * dh);
      } else {
        // Boundary
        if (boundary === 'open') {
          // Let water drain: treat as if neighbour has same terrain, no water
          const dh = water[idx]!;
          flux[fi + L] = Math.max(0, flux[fi + L]! + accel * dh);
        } else {
          flux[fi + L] = 0;
        }
      }

      // Right neighbour (col + 1)
      if (col < width - 1) {
        const ni = idx + 1;
        const dh = hSelf - (terrain[ni]! + water[ni]!);
        flux[fi + R] = Math.max(0, flux[fi + R]! + accel * dh);
      } else {
        if (boundary === 'open') {
          const dh = water[idx]!;
          flux[fi + R] = Math.max(0, flux[fi + R]! + accel * dh);
        } else {
          flux[fi + R] = 0;
        }
      }

      // Top neighbour (row - 1, north)
      if (row > 0) {
        const ni = idx - width;
        const dh = hSelf - (terrain[ni]! + water[ni]!);
        flux[fi + T] = Math.max(0, flux[fi + T]! + accel * dh);
      } else {
        if (boundary === 'open') {
          const dh = water[idx]!;
          flux[fi + T] = Math.max(0, flux[fi + T]! + accel * dh);
        } else {
          flux[fi + T] = 0;
        }
      }

      // Bottom neighbour (row + 1, south)
      if (row < height - 1) {
        const ni = idx + width;
        const dh = hSelf - (terrain[ni]! + water[ni]!);
        flux[fi + B] = Math.max(0, flux[fi + B]! + accel * dh);
      } else {
        if (boundary === 'open') {
          const dh = water[idx]!;
          flux[fi + B] = Math.max(0, flux[fi + B]! + accel * dh);
        } else {
          flux[fi + B] = 0;
        }
      }
    }
  }

  // ── Step 3: Scale flux (Mei et al. 2007, Eq. 3-4) ────────────────
  //
  //   V_out = (f_L + f_R + f_T + f_B) * dt
  //   K = min(1, d * lx * ly / V_out)
  //   f_K = K * f_K  for each K
  //
  // This prevents a cell from exporting more water than it holds.

  for (let i = 0; i < n; i++) {
    const fi = i * 4;
    const fL = flux[fi + L]!;
    const fR = flux[fi + R]!;
    const fT = flux[fi + T]!;
    const fB = flux[fi + B]!;
    const totalOutflux = fL + fR + fT + fB;

    if (totalOutflux <= 0) continue;

    const vOut = totalOutflux * dt;
    const vAvail = water[i]! * cellArea;

    if (vOut > vAvail && vAvail > 0) {
      const scale = vAvail / vOut;
      flux[fi + L] = fL * scale;
      flux[fi + R] = fR * scale;
      flux[fi + T] = fT * scale;
      flux[fi + B] = fB * scale;
    } else if (vAvail <= 0) {
      // No water to export
      flux[fi + L] = 0;
      flux[fi + R] = 0;
      flux[fi + T] = 0;
      flux[fi + B] = 0;
    }
  }

  // ── Step 4: Update water depth (Mei et al. 2007, Eq. 5-6) ────────
  //
  //   sum_in  = f_R(i-1,j) + f_L(i+1,j) + f_B(i,j-1) + f_T(i,j+1)
  //   sum_out = f_L(i,j) + f_R(i,j) + f_T(i,j) + f_B(i,j)
  //   d_new = d + dt * (sum_in - sum_out) / (lx * ly)
  //
  // Note on neighbour flux directions:
  //   - My left neighbour's RIGHT flux flows into me
  //   - My right neighbour's LEFT flux flows into me
  //   - My top neighbour's BOTTOM flux flows into me
  //   - My bottom neighbour's TOP flux flows into me

  let stepBoundaryOutflow = 0;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = row * width + col;
      const fi = idx * 4;

      // Sum outgoing flux from this cell
      const fL = flux[fi + L]!;
      const fR = flux[fi + R]!;
      const fT = flux[fi + T]!;
      const fB = flux[fi + B]!;
      const fOut = fL + fR + fT + fB;

      // Sum incoming flux from neighbours
      let fIn = 0;

      // From left neighbour's RIGHT pipe
      if (col > 0) {
        fIn += flux[(idx - 1) * 4 + R]!;
      }
      // From right neighbour's LEFT pipe
      if (col < width - 1) {
        fIn += flux[(idx + 1) * 4 + L]!;
      }
      // From top neighbour's BOTTOM pipe
      if (row > 0) {
        fIn += flux[(idx - width) * 4 + B]!;
      }
      // From bottom neighbour's TOP pipe
      if (row < height - 1) {
        fIn += flux[(idx + width) * 4 + T]!;
      }

      // Track boundary outflow for mass-balance accounting
      if (boundary === 'open') {
        if (col === 0) stepBoundaryOutflow += fL * dt;
        if (col === width - 1) stepBoundaryOutflow += fR * dt;
        if (row === 0) stepBoundaryOutflow += fT * dt;
        if (row === height - 1) stepBoundaryOutflow += fB * dt;
      }

      // Update depth
      const dNew = water[idx]! + (dt * (fIn - fOut)) / cellArea;

      // Clamp to non-negative (numerical safety)
      water[idx] = Math.max(0, dNew);
    }
  }

  state.totalBoundaryOutflow += stepBoundaryOutflow;
  state.simTime += dt;
}

/**
 * Compute total water volume currently stored in the grid (m³).
 * Used for mass-balance verification.
 */
export function totalWaterVolume(
  state: PipeSimState,
  config: PipeSimConfig,
): number {
  const cellArea = config.cellSize * config.cellSize;
  let vol = 0;
  for (let i = 0; i < state.water.length; i++) {
    vol += state.water[i]! * cellArea;
  }
  return vol;
}

/**
 * Check for any NaN or negative water depth (should never happen).
 * Returns the first bad index, or -1 if all clean.
 */
export function checkIntegrity(state: PipeSimState): number {
  for (let i = 0; i < state.water.length; i++) {
    const w = state.water[i]!;
    if (Number.isNaN(w) || w < 0) {
      return i;
    }
  }
  return -1;
}

/**
 * Create a synthetic tilted-plane DEM for testing.
 * Elevation decreases linearly from west (col=0) to east (col=width-1).
 *
 * @param width Grid width
 * @param height Grid height
 * @param highElev Elevation at col=0 (west)
 * @param lowElev Elevation at col=width-1 (east)
 */
export function syntheticTiltedPlane(
  width: number,
  height: number,
  highElev: number,
  lowElev: number,
): Float32Array {
  const terrain = new Float32Array(width * height);
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      terrain[row * width + col] =
        highElev + (lowElev - highElev) * (col / (width - 1));
    }
  }
  return terrain;
}

/**
 * Create a synthetic flat basin (constant elevation) for lake-at-rest test.
 *
 * @param width Grid width
 * @param height Grid height
 * @param elevation Constant terrain elevation
 */
export function syntheticFlatBasin(
  width: number,
  height: number,
  elevation: number,
): Float32Array {
  const terrain = new Float32Array(width * height);
  terrain.fill(elevation);
  return terrain;
}

/**
 * Create a synthetic bowl DEM for testing.
 * Elevation = baseElev + depth * distance_from_centre / max_distance.
 *
 * @param width Grid width
 * @param height Grid height
 * @param baseElev Elevation at the bowl centre (lowest point)
 * @param rimElev Elevation at the rim (highest point)
 */
export function syntheticBowl(
  width: number,
  height: number,
  baseElev: number,
  rimElev: number,
): Float32Array {
  const terrain = new Float32Array(width * height);
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const dx = col - cx;
      const dy = row - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      terrain[row * width + col] =
        baseElev + (rimElev - baseElev) * (dist / maxDist);
    }
  }
  return terrain;
}

/**
 * Render simulation water depth array to a 2D canvas via ImageData.
 * Dry cells (depth < minDepth) are transparent so the base map shows through.
 * Wet cells are colored with a depth-based aquatic blue gradient.
 *
 * @param water Float32Array of water depths (row-major, north-up)
 * @param width Grid width
 * @param height Grid height
 * @param ctx 2D Canvas rendering context
 * @param imgData Reusable ImageData buffer of size width * height
 * @param minDepth Minimum depth in metres to be visible (default 0.005 m)
 */
export function renderWaterToCanvas(
  water: Float32Array,
  width: number,
  height: number,
  ctx: CanvasRenderingContext2D,
  imgData: ImageData,
  minDepth = 0.08,
): void {
  const data = imgData.data;
  const n = width * height;
  for (let i = 0; i < n; i++) {
    const d = water[i]!;
    const px = i * 4;
    if (d < minDepth) {
      data[px + 3] = 0; // Fully transparent
    } else {
      // Soft edge falloff to eliminate harsh pixel borders
      const edge = Math.min((d - minDepth) / 0.03, 1.0);
      const norm = Math.min(d / 1.0, 1.0);

      // Depth gradient: cyan (#38bdf8) -> deep aquatic navy (#0369a1)
      data[px] = Math.round((56 - 53 * norm) * edge);
      data[px + 1] = Math.round((189 - 84 * norm) * edge);
      data[px + 2] = Math.round((248 - 87 * norm) * edge);
      data[px + 3] = Math.round(edge * (140 + 105 * norm));
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

