/**
 * Limitations panel content.
 *
 * Must be reachable from every view.
 * Content requirements from docs/HONESTY_AND_LIMITATIONS.md section 4:
 *
 * 1. Resolution (~30 m)
 * 2. DEM source and vertical error caveat
 * 3. Official map date (2022)
 * 4. Sim is illustrative, no infiltration/sewers/culverts
 * 5. Scale bar and legend for every layer
 * 6. Each validation point links to its source
 */

export const LIMITATIONS_TEXT = [
  'Resolution: ~30 m grid. Cannot show individual drains, culverts, underpasses, or buildings.',
  'Terrain source: Copernicus GLO-30 / FABDEM (~30 m). Vertical error is on the order of metres, which can exceed observed water levels.',
  'Official drain map: 2022 edition from KSRSAC via OpenCity.in. May be incomplete or outdated.',
  'Rain replay is illustrative only. Not calibrated to any gauge or event. No infiltration, drains, culverts, or sewers modelled at this resolution.',
  'Satellite imagery: EOX Sentinel-2 cloudless (~10 m). Date varies by location.',
  'Building heights from OpenStreetMap are approximate or missing.',
] as const;

/**
 * Wording rules from docs/HONESTY_AND_LIMITATIONS.md section 3.
 * These terms are FORBIDDEN in any UI text.
 */
export const FORBIDDEN_TERMS = [
  'flood prediction',
  'predicts flooding',
  'will flood',
  'flood simulation',
  'missing drain',
  'illegal encroachment',
  'blocked drain',
  'flood depth',
] as const;
