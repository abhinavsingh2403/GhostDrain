/**
 * Drainage Gap Registry & BBMP Ward Auditor View.
 *
 * Full-page analytical dashboard detailing the 871 spatial gap segments
 * where natural topography directs surface runoff with no official
 * BBMP/KSRSAC storm-water drain within the 60m buffer tolerance.
 */

import { router } from '../router';

export function createGapRegistryView(): HTMLElement {
  const container = document.createElement('div');
  container.id = 'view-gaps';
  container.style.position = 'absolute';
  container.style.top = '52px';
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
  inner.style.maxWidth = '1180px';
  inner.style.margin = '0 auto';

  inner.innerHTML = `
    <!-- Page Header -->
    <div style="margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #38bdf8; letter-spacing: 0.08em; background: rgba(56, 189, 248, 0.12); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.25);">Spatial Gap Analysis</span>
        <span style="font-size: 11px; color: #64748b;">•</span>
        <span style="font-size: 11px; color: #94a3b8;">BBMP 2022 KSRSAC Comparison (60 m Buffer)</span>
      </div>
      <h1 style="font-size: 26px; font-weight: 800; color: #f8fafc; margin: 0 0 8px 0; letter-spacing: -0.02em;">Bengaluru Drainage Gap Registry</h1>
      <p style="font-size: 14px; color: #94a3b8; margin: 0; max-width: 820px; line-height: 1.5;">
        By cross-referencing Copernicus GLO-30 flow accumulation against the official 6,835-feature municipal storm drain map using Shapely STRtree indexing, we identified <strong>871 unmapped natural drainage corridors</strong> where water naturally converges but no engineered drainage is recorded.
      </p>
    </div>

    <!-- Top KPI Summary Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-bottom: 28px;">
      <div style="background: linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; padding: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #f87171; letter-spacing: 0.05em; margin-bottom: 4px;">Unmapped Gap Segments</div>
        <div style="font-size: 32px; font-weight: 800; color: #f8fafc; line-height: 1;">871</div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">Natural corridors lacking official drains</div>
      </div>

      <div style="background: linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 10px; padding: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #38bdf8; letter-spacing: 0.05em; margin-bottom: 4px;">Cumulative Gap Length</div>
        <div style="font-size: 32px; font-weight: 800; color: #f8fafc; line-height: 1;">124.6 km</div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">Total unmapped runoff channel length</div>
      </div>

      <div style="background: linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #fbbf24; letter-spacing: 0.05em; margin-bottom: 4px;">Official SWD Network</div>
        <div style="font-size: 32px; font-weight: 800; color: #f8fafc; line-height: 1;">6,835</div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">18 primary, 1,015 sec, 5,802 tert drains</div>
      </div>

      <div style="background: linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 10px; padding: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #34d399; letter-spacing: 0.05em; margin-bottom: 4px;">Spatial Buffer Gate</div>
        <div style="font-size: 32px; font-weight: 800; color: #f8fafc; line-height: 1;">60 m</div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">Guarantees tolerance against map offset</div>
      </div>
    </div>

    <!-- Valley Catchment Breakdown -->
    <div style="margin-bottom: 28px;">
      <h2 style="font-size: 16px; font-weight: 700; color: #f8fafc; margin-bottom: 12px;">Distribution by Major Bengaluru River Valleys</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px;">
        <div style="background: rgba(15, 23, 42, 0.65); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 8px; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-weight: 700; color: #38bdf8; font-size: 14px;">🌊 Koramangala-Challaghatta Valley</span>
            <span style="font-size: 11px; font-weight: 700; color: #f87171; background: rgba(239, 68, 68, 0.15); padding: 2px 7px; border-radius: 9999px;">389 Gaps (44.6%)</span>
          </div>
          <div style="font-size: 12px; color: #cbd5e1; line-height: 1.4;">
            Drains South-East into Bellandur and Varthur lakes. Encompasses tech corridors (ORR, Ecospace, Rainbow Drive, Whitefield). High urban density over natural lake cascades creates frequent bottle-necks.
          </div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.65); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 8px; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-weight: 700; color: #34d399; font-size: 14px;">🏞️ Vrishabhavathi River Valley</span>
            <span style="font-size: 11px; font-weight: 700; color: #fbbf24; background: rgba(245, 158, 11, 0.15); padding: 2px 7px; border-radius: 9999px;">274 Gaps (31.5%)</span>
          </div>
          <div style="font-size: 12px; color: #cbd5e1; line-height: 1.4;">
            Drains South-West towards Mysore Road, Nayandahalli, and Kengeri. Steep topography accelerates velocity into industrial corridors with disconnected secondary storm channels.
          </div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.65); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 8px; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-weight: 700; color: #a78bfa; font-size: 14px;">🏙️ Hebbal Drainage Valley</span>
            <span style="font-size: 11px; font-weight: 700; color: #a78bfa; background: rgba(167, 139, 250, 0.15); padding: 2px 7px; border-radius: 9999px;">208 Gaps (23.9%)</span>
          </div>
          <div style="font-size: 12px; color: #cbd5e1; line-height: 1.4;">
            Drains North towards Hebbal Lake, Nagavara, Manyata Tech Park, and Yelahanka. Encroached minor feeder streams disconnect natural overflow into downstream tanks.
          </div>
        </div>
      </div>
    </div>

    <!-- Interactive Searchable Gap Registry Table -->
    <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 10px; padding: 18px; margin-bottom: 28px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
        <div>
          <h2 style="font-size: 16px; font-weight: 700; color: #f8fafc; margin: 0 0 2px 0;">Priority Drainage Gap Corridors</h2>
          <span style="font-size: 12px; color: #94a3b8;">High-risk natural streamlines missing from municipal records</span>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <input type="text" id="gap-search-input" placeholder="Filter by valley or locality..." style="padding: 6px 12px; font-size: 12px; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(148, 163, 184, 0.3); border-radius: 6px; color: #f8fafc; outline: none; width: 220px;" />
        </div>
      </div>

      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(148, 163, 184, 0.2); color: #94a3b8; font-size: 11px; text-transform: uppercase;">
              <th style="padding: 8px 10px;">Gap ID</th>
              <th style="padding: 8px 10px;">Corridor Location</th>
              <th style="padding: 8px 10px;">Catchment Valley</th>
              <th style="padding: 8px 10px;">Upstream Area</th>
              <th style="padding: 8px 10px;">Nearest Drain</th>
              <th style="padding: 8px 10px; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody id="gap-table-body">
            <!-- Table rows populated dynamically -->
          </tbody>
        </table>
      </div>
    </div>

    <!-- Municipal Engineering Recommendations -->
    <div style="background: rgba(14, 165, 233, 0.08); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 10px; padding: 18px;">
      <h3 style="font-size: 15px; font-weight: 700; color: #38bdf8; margin: 0 0 8px 0;">Civil Engineering & Urban Planning Takeaways</h3>
      <ul style="font-size: 12px; color: #cbd5e1; line-height: 1.6; padding-left: 20px; margin: 0;">
        <li><strong>Daylighting Historical Pathways:</strong> Where high flow accumulation intersects built-up corridors without drains, constructing subsurface box culverts or green swales prevents water from pooling on low-lying arterial roads.</li>
        <li><strong>Retention Basin Interventions:</strong> Upstream retention parks in primary lake catchments (e.g. Saul Kere, Agara) can buffer peak cloudburst runoff by up to 35% before reaching choke-points like Bellandur or Central Silk Board.</li>
        <li><strong>Honest Acknowledgment:</strong> A highlighted gap is not evidence of illegal encroachment; it indicates a spatial disparity where gravity guides water but no official drain exists in municipal spatial records.</li>
      </ul>
    </div>
  `;

  container.appendChild(inner);

  // Sample representative priority gaps with exact coordinates for 3D fly-to
  const representativeGaps = [
    { id: 'GAP-001', name: 'Bellandur Lake Inflow Neck', valley: 'K-C Valley', area: '291,454 cells', dist: '> 180 m', center: [77.674, 12.939] },
    { id: 'GAP-002', name: 'Outer Ring Road (Ecospace Choke)', valley: 'K-C Valley', area: '142,800 cells', dist: '> 140 m', center: [77.683, 12.927] },
    { id: 'GAP-003', name: 'Rainbow Drive Catchment Funnel', valley: 'K-C Valley', area: '98,210 cells', dist: '> 95 m', center: [77.688, 12.905] },
    { id: 'GAP-004', name: 'Central Silk Board Southern Flank', valley: 'K-C Valley', area: '87,400 cells', dist: '> 110 m', center: [77.623, 12.918] },
    { id: 'GAP-005', name: 'Saul Kere Wetland Overland Path', valley: 'K-C Valley', area: '64,120 cells', dist: '> 80 m', center: [77.679, 12.916] },
    { id: 'GAP-006', name: 'Varthur Lake West Overflow Channel', valley: 'K-C Valley', area: '215,900 cells', dist: '> 150 m', center: [77.738, 12.946] },
    { id: 'GAP-007', name: 'Nayandahalli Mysore Road Inflow', valley: 'Vrishabhavathi', area: '112,000 cells', dist: '> 130 m', center: [77.526, 12.926] },
    { id: 'GAP-008', name: 'Agara Lake Southern Cascade', valley: 'K-C Valley', area: '78,300 cells', dist: '> 90 m', center: [77.644, 12.924] },
    { id: 'GAP-009', name: 'Manyata Tech Park North Runoff', valley: 'Hebbal Valley', area: '84,100 cells', dist: '> 105 m', center: [77.621, 13.048] },
    { id: 'GAP-010', name: 'Hebbal Lake Feeder Streamline', valley: 'Hebbal Valley', area: '58,400 cells', dist: '> 75 m', center: [77.593, 13.036] },
  ];

  const tbody = inner.querySelector('#gap-table-body');
  const searchInput = inner.querySelector('#gap-search-input') as HTMLInputElement | null;

  function renderRows(items: typeof representativeGaps) {
    if (!tbody) return;
    tbody.innerHTML = '';
    items.forEach((gap) => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid rgba(148, 163, 184, 0.1)';
      tr.style.transition = 'background 0.15s ease';
      tr.addEventListener('mouseenter', () => tr.style.background = 'rgba(56, 189, 248, 0.08)');
      tr.addEventListener('mouseleave', () => tr.style.background = 'transparent');

      tr.innerHTML = `
        <td style="padding: 10px; font-family: monospace; color: #38bdf8; font-weight: 700;">${gap.id}</td>
        <td style="padding: 10px; font-weight: 600; color: #f1f5f9;">${gap.name}</td>
        <td style="padding: 10px; color: #94a3b8;">${gap.valley}</td>
        <td style="padding: 10px; font-family: monospace; color: #cbd5e1;">${gap.area}</td>
        <td style="padding: 10px; font-family: monospace; color: #f87171;">${gap.dist}</td>
        <td style="padding: 10px; text-align: right;">
          <button class="btn-locate-gap" style="padding: 4px 10px; font-size: 11px; font-weight: 600; background: rgba(14, 165, 233, 0.2); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; border-radius: 4px; cursor: pointer; transition: all 0.15s;">📍 3D Map</button>
        </td>
      `;

      const btn = tr.querySelector('.btn-locate-gap');
      btn?.addEventListener('click', () => {
        router.navigate('map', { center: gap.center as [number, number], zoom: 15.2, pitch: 60 });
      });

      tbody.appendChild(tr);
    });
  }

  renderRows(representativeGaps);

  searchInput?.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim();
    const filtered = representativeGaps.filter(
      (g) => g.name.toLowerCase().includes(q) || g.valley.toLowerCase().includes(q) || g.id.toLowerCase().includes(q)
    );
    renderRows(filtered);
  });

  // Navigation CTAs
  const ctaBar = document.createElement('div');
  ctaBar.style.marginTop = '28px';
  ctaBar.style.display = 'flex';
  ctaBar.style.gap = '12px';
  ctaBar.style.alignItems = 'center';
  ctaBar.innerHTML = `
    <button id="btn-gap-to-map" style="padding: 9px 18px; font-size: 13px; font-weight: 700; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: white; border: none; border-radius: 6px; cursor: pointer; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);">🗺️ Return to 3D Terrain Explorer</button>
    <button id="btn-gap-to-val" style="padding: 9px 18px; font-size: 13px; font-weight: 700; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 6px; cursor: pointer;">🎯 View 6.1× Ground Truth Validation</button>
  `;
  ctaBar.querySelector('#btn-gap-to-map')?.addEventListener('click', () => router.navigate('map'));
  ctaBar.querySelector('#btn-gap-to-val')?.addEventListener('click', () => router.navigate('validation'));
  inner.appendChild(ctaBar);

  return container;
}
