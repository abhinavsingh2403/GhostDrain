# HONESTY_AND_LIMITATIONS: Ghost Drains

Tags: `[V]` verified, `[U]` unverified.

Why this file exists: the project is persuasive. People may treat a good-looking map as fact. This policy keeps claims inside what the data can support.

## 1. What the app IS

- A visualization of **terrain-derived natural flow paths** at about 30 m resolution.
- A comparison with the **official storm-water drain map** published as KML (2022 edition) `[V]` https://data.opencity.in/dataset/bengaluru-stormwater-drains-maps
- An **illustrative** rain replay based on a simplified shallow-water method.

## 2. What the app is NOT

- Not a flood forecast, warning system, or hazard map.
- Not evidence of illegal construction or encroachment.
- Not a property-level or insurance risk tool.
- Not calibrated to any rain gauge, flood gauge or specific event.

## 3. Wording rules

| Use | Avoid |
|-----|-------|
| "Terrain suggests water flows here" | "Water will flow / flood here" |
| "No mapped drain within X m of this path" | "Missing drain", "illegal encroachment", "blocked drain" |
| "Illustrative replay (timelapse x N)" | "Flood simulation", "prediction" |
| "Low-lying relative to nearby drainage (HAND band)" | "Flood depth of X m" |
| "Reported as affected in Sept 2022 (source)" | "This area floods" |
| "Official map may be incomplete" | "The city has no drains here" |

## 4. Must appear in the app (content requirements, not design)

1. A limitations panel reachable from every view with: resolution (~30 m), DEM source and its vertical error caveat, official map date (2022), sim is illustrative, no infiltration/sewers/culverts.
2. Attribution for every data source in use (see `LICENSES_ATTRIBUTION.md`).
3. A visible "Illustrative" tag whenever the rain replay runs, plus the timelapse factor.
4. Scale bar and legend for every layer.
5. Each validation point links to its source.

## 5. Known limitations (state them plainly)

1. **Resolution:** a 30 m grid cannot show individual drains, culverts, underpasses, flyovers or buildings.
2. **Vertical error:** global error figures for the candidate DEMs are about 1 to 3 m depending on land cover (for example FABDEM versus GLO-30: 5.15 -> 2.88 m in forest, 1.61 -> 1.12 m in built-up areas, mean absolute error) `[V]` https://meetingorganizer.copernicus.org/EGU22/EGU22-8994.html . These are global, not Bengaluru-specific `[U]`. News reported about a foot (~0.3 m) of water in many areas in Sept 2022 `[V]` https://www.thenewsminute.com/article/bengaluru-flooded-again-after-rains-marathahalli-orr-under-water-167535 . So terrain error can exceed flood depth.
3. **Surface vs bare-earth:** Copernicus GLO-30 includes buildings and trees `[V]` https://registry.opendata.aws/copernicus-dem/ ; the bare-earth FABDEM version still has some building artefacts `[V]` https://www.fathom.global/academic-papers/a-30-m-global-map-of-elevation-with-forests-and-buildings-removed/ .
4. **Official map quality:** Bengaluru's drain records are reported as incomplete `[V]` https://citizenmatters.in/cag-report-stormwater-drains-master-plan-encroachment/ ; the KML's positional accuracy is unknown `[U]`.
5. **Validation sample is biased:** reported flood sites come mostly from news about roads and apartments.
6. **Rainfall reports disagree** across IMD, KSNDMC and press (see `DATA_SOURCES.md` section 2), so no single "event rainfall" is asserted.
7. **Satellite imagery** (about 10 m) is soft and its date varies.
8. **Buildings** from OSM have approximate or missing heights `[U]`.

## 6. Gap-view interpretation

A highlighted gap means only: "terrain suggests a natural flow path and the official map shows no drain within the buffer." Possible reasons include: underground or culverted drain, incomplete map, DEM artefact, real missing link. The app must not choose among them.

## 7. Ethics and privacy

- Do not name private properties or people.
- No location tracking or storage.
- If a viewer asks "will my house flood?", the app answers: "This tool cannot say. Contact local authorities."
- Be prepared to correct the map if an authority or community audit provides better data.

## 8. Review checklist before any public demo

- [ ] Every number on screen traces to a source or a test.
- [ ] Wording table respected.
- [ ] Limitations panel complete.
- [ ] Attribution complete.
- [ ] Validation results (including failures) are shown, not hidden.
