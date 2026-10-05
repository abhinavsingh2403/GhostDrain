# AGENTS.md: Ghost Drains

Project: browser 3D map of Bengaluru showing terrain-derived natural water paths vs the official storm-drain map, plus an illustrative rain replay. Solo student project. Non-commercial.
Docs live in `/docs`. Read the relevant doc BEFORE coding and list which docs you read.

## 0. Priorities (in order)
1. Truthful and correct. 2. Reproducible. 3. Works on a weak laptop (Intel UHD 620 + Radeon 530, ~8 GB RAM). 4. Looks good.

## 1. Source of truth
Order: (a) installed package types/README, (b) official docs, (c) `/docs` files, (d) your memory. If (d) conflicts with (a)-(c), (d) loses.
- Facts in `/docs` tagged `[U]` are unverified. Do not build on them until `VERIFY_CHECKLIST.md` marks them done.

## 2. Anti-hallucination rules
1. **Never invent APIs.** Before using a library function, find it in installed types or official docs. If you cannot find it, say so and ask. Do not "guess and see".
2. **Never invent data.** No made-up coordinates, rainfall, elevations, drain geometry, URLs, licenses or citations. If data is missing, stop and ask. No placeholder data shown as real. Synthetic data is allowed only inside tests and must be named `synthetic_*`.
3. **Never invent numbers.** Thresholds (flow accumulation, buffer, HAND bands, FPS targets) come from `config.yaml` after validation. If not yet set, use a clearly named `TODO_UNSET` and fail loudly.
4. **No version numbers from memory.** Run `npm view` / `pip index versions`, then pin.
5. **Do not trust your recall of formulas.** Copy equations from the cited paper or docs (see `HYDROLOGY_SPEC.md`). Put the citation in a code comment.
6. **Run it.** Do not claim code works unless you executed it or the tests and say what you ran. Show output.
7. **Say "I don't know" / "unverified"** instead of filling gaps. Prefer asking one precise question.
8. **No fake fallbacks.** If an artifact or capability is missing, show a visible error. Never silently substitute other data.
9. **Cite.** Any factual claim in UI text or docs needs a source URL in the manifest or docs.
10. **Self-check before finishing:** list assumptions made; list anything unverified.

## 3. Geo and hydrology correctness
- Coordinate order: GeoJSON and MapLibre use `[longitude, latitude]`. Never swap.
- Analysis CRS is metric (UTM zone 43N, confirm with pyproj). Display grid is Web-Mercator-aligned. See `ARCHITECTURE.md` section 6. Never compute distances/areas in degrees.
- DEM tile encoding: **Terrarium** elevation = `(R*256 + G + B/256) - 32768`. MapLibre `raster-dem` default encoding is `mapbox`, so ALWAYS set `encoding` explicitly. Wrong encoding gives silently wrong heights. Keep encoding a named constant with a test.
- Rasters: float32, little-endian, row-major, row 0 = north. Validate shape against `grid.meta.json`; mismatch = hard error.
- Nodata is masked, never used as elevation.
- Depressions: keep `depress_depth`; do not discard it by filling and forgetting.
- Never mix DEMs with different vertical datums in one raster.
- deck.gl layers are not draped on MapLibre terrain. Do not put the water layer there.
- Never state flood depths. Never say "flood prediction".

## 4. Data rules
- Every dataset must exist in `data/manifest.json` (url, date, license, checksum). Pipeline verifies checksums.
- Respect licenses: FABDEM and EOX imagery are non-commercial/share-alike; Google tiles are visualization-only with attribution (see `LICENSES_ATTRIBUTION.md`). Never derive analysis from Google tiles.
- Do not commit raw datasets or API keys. Keys go in `.env` (gitignored).

## 5. Code rules
- **Minimal changes over rewrites.** Edit the smallest region needed. Do not refactor unrelated code. Explain each diff in one sentence.
- TypeScript strict mode on. No `any` without a comment explaining why.
- Python: type hints, `pytest`; pure functions for raster math; no hidden global state.
- Add or update a test with each behaviour change. Tests in `TESTING_VALIDATION.md` are mandatory gates.
- Performance: respect the budget in `ARCHITECTURE.md` section 10; measure, do not assume.
- Do not add dependencies without stating: purpose, license, size, and alternative considered.
- Keep modules small; one responsibility each.

## 6. Claims and UI text
- Follow `HONESTY_AND_LIMITATIONS.md` exactly. Allowed wording: "terrain suggests", "unmapped natural path", "illustrative replay".
- Forbidden wording: "predicts flooding", "illegal encroachment", "will flood", any property-level risk.
- Always show attribution and the limitations panel.

## 7. Stop and ask when
- A required dataset, license, or coordinate is unknown.
- Two sources disagree.
- A spike (S1-S5) result is needed to choose an approach.
- A change would alter the artifact contract (`grid.meta.json`) or CRS.
- You are about to add a feature not in `PRD.md`.

## 8. Definition of done (every task)
1. Code runs; tests pass; commands and output shown.
2. Docs updated if behaviour changed.
3. Manifest/attribution updated if data or libraries changed.
4. Assumptions and unverified items listed in the PR/summary.
5. No console errors in the browser; WebGL2 capability handled.

## 9. Useful commands (confirm they exist before running)
`make pipeline` (rebuild artifacts), `pytest`, `npm run dev`, `npm run test`, `npm run build`.
