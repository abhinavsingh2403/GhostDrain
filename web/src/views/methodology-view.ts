/**
 * Science, Hydrology & Methodology Guide View.
 *
 * Full-page research documentation detailing:
 * - Priority-Flood conditioning (Barnes et al. 2014)
 * - D8 flow routing & accumulation (O'Callaghan & Mark 1984)
 * - HAND susceptibility modeling (Nobre et al. 2011)
 * - GPU Virtual-Pipe Shallow Water numerics (Mei et al. 2007)
 * - Geodesic CRS transformations (UTM 43N vs Web Mercator)
 * - Data provenance and academic citations
 */

import { router } from '../router';

export function createMethodologyView(): HTMLElement {
  const container = document.createElement('div');
  container.id = 'view-methodology';
  container.style.position = 'absolute';
  container.style.top = '48px';
  container.style.left = '0';
  container.style.right = '0';
  container.style.bottom = '0';
  container.style.overflowY = 'auto';
  container.style.background = '#090d16';
  container.style.color = '#f8fafc';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  container.style.padding = '32px 24px 60px 24px';
  container.style.display = 'none';

  const inner = document.createElement('div');
  inner.style.maxWidth = '1080px';
  inner.style.margin = '0 auto';

  inner.innerHTML = `
    <!-- Header -->
    <div style="margin-bottom: 28px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #a78bfa; letter-spacing: 0.08em; background: rgba(167, 139, 250, 0.12); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(167, 139, 250, 0.25);">Scientific Methodology</span>
        <span style="font-size: 11px; color: #64748b;">•</span>
        <span style="font-size: 11px; color: #94a3b8;">Hydrology & Computational Mechanics</span>
      </div>
      <h1 style="font-size: 26px; font-weight: 800; color: #f8fafc; margin: 0 0 8px 0; letter-spacing: -0.02em;">Theoretical Framework & Pipeline Science</h1>
      <p style="font-size: 14px; color: #94a3b8; margin: 0; max-width: 820px; line-height: 1.5;">
        Ghost Drains translates satellite radar topography into civic hydrology using peer-reviewed equations. Below is the complete mathematical and computational pipeline running from raw DEM tiles to client 3D WebGL rendering.
      </p>
    </div>

    <!-- 5 Core Pipeline Stages Grid -->
    <div style="display: grid; grid-template-columns: 1fr; gap: 18px; margin-bottom: 32px;">
      <!-- Stage 1 -->
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 10px; padding: 20px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 10px; font-weight: 800; color: #38bdf8; background: rgba(14, 165, 233, 0.2); padding: 2px 7px; border-radius: 4px;">STAGE 1</span>
          <h3 style="font-size: 16px; font-weight: 700; color: #f8fafc; margin: 0;">Priority-Flood Conditioning & Depression Retention</h3>
        </div>
        <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5; margin: 0 0 10px 0;">
          Raw satellite surface models contain depressions that trap digital water. Rather than blindly filling pits and discarding natural sinks, we execute the <strong>Priority-Flood algorithm</strong> (Barnes, Lehman, Mulla 2014 / Wang & Liu 2006) via WhiteboxTools.
        </p>
        <div style="background: rgba(30, 41, 59, 0.6); border-radius: 6px; padding: 10px 14px; font-family: monospace; font-size: 12px; color: #93c5fd; margin-bottom: 10px;">
          depth_map[x, y] = dem_filled[x, y] - dem_original[x, y]
        </div>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
          The filled surface allows downslope routing, while the depth raster is preserved as an independent <code>depress.f32.bin</code> layer. This exposes Bengaluru's historical lake basins (up to 21.69 m deep in the Bellandur basin) directly in the Ponding View.
        </p>
      </div>

      <!-- Stage 2 -->
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 10px; padding: 20px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 10px; font-weight: 800; color: #38bdf8; background: rgba(14, 165, 233, 0.2); padding: 2px 7px; border-radius: 4px;">STAGE 2</span>
          <h3 style="font-size: 16px; font-weight: 700; color: #f8fafc; margin: 0;">D8 Steepest Descent Flow Accumulation</h3>
        </div>
        <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5; margin: 0 0 10px 0;">
          Flow direction routes to the neighbor with the steepest drop normalized by distance (cardinal $= \Delta x$, diagonal $= \sqrt{2}\Delta x$). Flow accumulation then computes the total contributing upslope area:
        </p>
        <div style="background: rgba(30, 41, 59, 0.6); border-radius: 6px; padding: 10px 14px; font-family: monospace; font-size: 12px; color: #93c5fd; margin-bottom: 10px;">
          Slope_i = (z_center - z_neighbor_i) / distance_i &nbsp;&nbsp;|&nbsp;&nbsp; Accumulation(c) = 1 + &sum; Accumulation(upstream_neighbors)
        </div>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
          Cells exceeding the validated threshold of 500 upstream cells (~0.45 km²) are vectorized into 1,028 ghost-drain centerlines using WhiteboxTools' topological vectorizer.
        </p>
      </div>

      <!-- Stage 3 -->
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 10px; padding: 20px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 10px; font-weight: 800; color: #38bdf8; background: rgba(14, 165, 233, 0.2); padding: 2px 7px; border-radius: 4px;">STAGE 3</span>
          <h3 style="font-size: 16px; font-weight: 700; color: #f8fafc; margin: 0;">Height Above Nearest Drainage (HAND)</h3>
        </div>
        <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5; margin: 0 0 10px 0;">
          HAND (Nobre et al. 2011) normalizes elevation relative to the local drainage base level. For every terrain cell, we trace downstream following D8 flow pointers until hitting a defined stream cell, computing the difference in elevation:
        </p>
        <div style="background: rgba(30, 41, 59, 0.6); border-radius: 6px; padding: 10px 14px; font-family: monospace; font-size: 12px; color: #93c5fd; margin-bottom: 10px;">
          HAND(c) = z(c) - z(drainage_target(c))
        </div>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
          HAND eliminates regional elevation gradients (e.g. Bengaluru slopes from 950 m in the north down to 850 m in the south) to reveal purely localized flood susceptibility bands.
        </p>
      </div>

      <!-- Stage 4 -->
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 10px; padding: 20px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 10px; font-weight: 800; color: #38bdf8; background: rgba(14, 165, 233, 0.2); padding: 2px 7px; border-radius: 4px;">STAGE 4</span>
          <h3 style="font-size: 16px; font-weight: 700; color: #f8fafc; margin: 0;">GPU Virtual-Pipe Shallow Water Numerics</h3>
        </div>
        <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5; margin: 0 0 10px 0;">
          Water runoff is computed using the virtual-pipe scheme from <strong>Mei, Decaudin, Hu (2007)</strong>. Each grid cell connects to 4 cardinal neighbors via imaginary pipes. The update cycle:
        </p>
        <div style="background: rgba(30, 41, 59, 0.6); border-radius: 6px; padding: 10px 14px; font-family: monospace; font-size: 12px; color: #93c5fd; margin-bottom: 10px;">
          1. f_new = max(0, f_old + dt * A * g * &Delta;h / L)  [Hydrostatic flux]<br/>
          2. K = min(1, d * dx * dy / (&sum; f_out * dt))      [Mass-conservation scaling]<br/>
          3. d_new = d + dt * (&sum; f_in - &sum; f_out) / (dx * dy) [Water depth update]
        </div>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
          Time step &Delta;t is dynamically clamped using the shallow-water CFL wave speed condition &Delta;t &le; 0.5 &Delta;x / &radic;(g &middot; h_max) to guarantee numerical stability.
        </p>
      </div>

      <!-- Stage 5 -->
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 10px; padding: 20px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 10px; font-weight: 800; color: #38bdf8; background: rgba(14, 165, 233, 0.2); padding: 2px 7px; border-radius: 4px;">STAGE 5</span>
          <h3 style="font-size: 16px; font-weight: 700; color: #f8fafc; margin: 0;">Geodesic Rigor & CRS Decoupling</h3>
        </div>
        <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5; margin: 0 0 10px 0;">
          All physical distance, gradient, and area computations are executed in <strong>metric UTM Zone 43N (EPSG:32643)</strong>, verified with pyproj. Display rasters and WebGL draped sources are resampled to <strong>Web Mercator (EPSG:3857)</strong> with explicit Terrarium RGB encoding.
        </p>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
          Meridian convergence offset across Bengaluru (0.584155°, yielding 152.93 m offset over 15 km) is mathematically accounted for, ensuring that Web Mercator distortion does not contaminate physical water accumulation.
        </p>
      </div>
    </div>

    <!-- Academic References -->
    <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 10px; padding: 18px;">
      <h3 style="font-size: 15px; font-weight: 700; color: #f8fafc; margin: 0 0 10px 0;">Primary Academic & Data Citations</h3>
      <ul style="font-size: 12px; color: #94a3b8; line-height: 1.6; padding-left: 20px; margin: 0;">
        <li>Barnes, R., Lehman, C., Mulla, D. (2014). <em>Priority-flood: An optimal depression-filling and watershed-labeling algorithm for digital elevation models</em>. Computers & Geosciences, 62, 117-127.</li>
        <li>Nobre, A. D., Cuartas, L. A., et al. (2011). <em>Height Above the Nearest Drainage – a hydrologically relevant new terrain model</em>. Hydrological Processes, 25(15), 2443-2469.</li>
        <li>Mei, X., Decaudin, P., Hu, B. G. (2007). <em>Fast Hydraulic Erosion Simulation and Visualization on GPU</em>. Pacific Graphics, 47-56.</li>
        <li>Wang, L., Liu, H. (2006). <em>An efficient algorithm for identifying and filling surface depressions in digital elevation models for hydrologic analysis and modelling</em>. Int. J. Geogr. Inf. Sci., 20(2), 193-213.</li>
        <li>European Space Agency (2021). <em>Copernicus WorldDEM-30 User Handbook</em>. DLR e.V. and Airbus Defence and Space GmbH.</li>
      </ul>
    </div>

    <!-- Navigation CTAs -->
    <div style="margin-top: 24px; display: flex; gap: 12px; align-items: center;">
      <button id="btn-method-to-map" style="padding: 9px 18px; font-size: 13px; font-weight: 700; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: white; border: none; border-radius: 6px; cursor: pointer; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);">🗺️ Return to 3D Terrain Explorer</button>
      <button id="btn-method-to-gaps" style="padding: 9px 18px; font-size: 13px; font-weight: 700; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 6px; cursor: pointer;">📊 Inspect 871 Drainage Gaps</button>
    </div>
  `;

  inner.querySelector('#btn-method-to-map')?.addEventListener('click', () => router.navigate('map'));
  inner.querySelector('#btn-method-to-gaps')?.addEventListener('click', () => router.navigate('gaps'));

  container.appendChild(inner);
  return container;
}
