# DEMO_SCRIPT: Ghost Drains (60-Second Walkthrough)

> **Target Audience:** Municipal engineers, data journalists, hydrologists, and general public.  
> **Duration:** Exactly 60 seconds.  
> **Hardware:** Standard laptop (Intel UHD 620 / Radeon 530, 8 GB RAM). Runs at 60 FPS.

---

## 1. Chronological 60-Second Presentation Narrative

### Beat 1: The Problem (0s – 12s)
* **Map state:** Default view over Bengaluru center at 45° 3D pitch.
* **Spoken script:**  
  *"Bengaluru experiences severe urban waterlogging during monsoon downpours. Conventional approaches assume the city simply lacks storm drains. But if we peel back the concrete and look at the underlying topography, what does the terrain say?"*
* **Action:** Click **"🗺️ City Overview"** in the top bar.

---

### Beat 2: Terrain-Derived Natural Paths vs. Official SWD (12s – 25s)
* **Map state:** Zoom in toward the Koramangala-Challaghatta Valley and Bellandur Lake Basin.
* **Spoken script:**  
  *"This cyan network represents 1,028 terrain-derived natural flow paths computed from Copernicus GLO-30 elevation using D8 routing. The amber lines show the BBMP/KSRSAC official storm-drain network. Notice these red segments: our spatial gap analysis identified 871 unmapped natural drainage paths where gravity directs water, but no municipal drain exists within a 60-meter buffer."*
* **Action:** Toggle **"Gap Analysis"** (`toggle-gap-view`) off and on to flash the red missing links.

---

### Beat 3: Scientific Ground Truth Validation (25s – 38s)
* **Map state:** Fly to Bellandur Lake / Rainbow Drive basin.
* **Spoken script:**  
  *"To verify this without guessing, we geocoded 12 documented news-reported flood sites from the catastrophic September 2022 cloudburst. 91.7% of those sites fall directly within our top Height Above Nearest Drainage (HAND) susceptibility zones (≤ 2 meters). That gives us a 6.1× empirical lift over a random null model. The model doesn't predict; it matches where water was forced to accumulate."*
* **Action:** Click **"🌊 Bellandur"** hotspot, then click on the **Rainbow Drive** or **Ecospace** radar beacon point to display its citable news source.

---

### Beat 4: Illustrative Rain Replay & Flow Dynamics (38s – 50s)
* **Map state:** Angled 3D terrain view over Bellandur Lake basin.
* **Spoken script:**  
  *"Now we trigger an illustrative rain replay using Mei et al.'s GPU virtual-pipe shallow-water equations. At 130 mm/h—matching the September 2022 cloudburst rate—you can see water flowing along natural micro-streamlines directly through the unmapped gap corridors, pooling into the natural 21-meter deep depression sink of Bellandur Lake."*
* **Action:** Click **"🌧️ Cloudburst (130 mm)"**, then click **"▶ Start Replay"**. Watch the sleek screen-space flow streamlines dynamically race downslope into lake sinks.

---

### Beat 5: Interactive What-If Barrier & Limitations (50s – 60s)
* **Map state:** Zoomed view over a valley choke-point.
* **Spoken script:**  
  *"Users can even test interventions: by toggling the What-If tool, clicking places a 5-meter ridge barrier to see how flood paths divert in real time. We state our limitations plainly: this is a 30-meter terrain model, illustrative only, and does not model underground pipes or sub-grid curb inlets."*
* **Action:** Click **"🧱 Draw Ridge (+5m)"**, click the valley neck to see streamlines split, then click **"↺ Reset"** to restore pristine baseline terrain. Open **"ℹ️ Methods & Limitations"** to show the V1–V4 transparent scientific audit.

---

## 2. Pre-Flight Honesty Checklist (Section 8 Compliance)

All criteria verified and ticked before public exhibition:

- [x] **Every number on screen traces to a source or a test:**
  - `6.1×` lift: Calculated from 11/12 (91.7%) flood sites in $\le 2\text{m}$ HAND vs. 15.0% city baseline area.
  - `21.69 m`: Peak depression sink in Bellandur basin verified by WhiteboxTools Priority-Flood in `p03_condition.py`.
  - `60 m`: Buffer parameter defined in `pipeline/config.yaml` matching positional tolerance.
  - `130 mm/h`: Sept 4–5, 2022 cloudburst peak rainfall recorded by KSNDMC / IMD.
- [x] **Strict Wording Compliance (No AI Slop / No False Claims):**
  - Zero instances of forbidden terms (*"flood prediction"*, *"predicts flooding"*, *"will flood"*, *"flood depth"*, *"illegal encroachment"*, *"missing drain"*).
  - Uses approved phrasing: *"terrain suggests water flows here"*, *"unmapped natural flow path"*, *"illustrative replay"*, *"Height Above Nearest Drainage susceptibility"*.
- [x] **Limitations Panel Complete:**
  - Accessible via header button on all views.
  - Lists resolution (~30m), DEM vertical error caveat, 2022 KSRSAC map date, absence of infiltration/sewers, and sample selection bias.
- [x] **Attribution Complete:**
  - Copernicus WorldDEM-30 (DLR/Airbus), EOX Sentinel-2 cloudless (2021), KSRSAC / OpenCity.in, OpenStreetMap, OpenFreeMap, Mapterhorn.
- [x] **Validation Results & Failures Transparently Shown:**
  - V1 (Stream Agreement: 68.4%), V2 (Lift: 6.1×), V3 (GLO-30 vs. FABDEM analysis), and V4 (Outlier Failure: Central Silk Board flyover inlet clogging failure) displayed openly in the Validation Audit tab.

---

## 3. Evaluator Q&A Reference

| Question | Factual Answer |
| :--- | :--- |
| **"Does this predict if my apartment will flood?"** | *"No. This is a regional 30 m terrain model. It cannot resolve street gutters, storm grates, basement pumps, or building walls. Please consult municipal authorities for localized flood advisories."* |
| **"Why do your flow paths disagree with the official map in some places?"** | *"The official map shows engineered storm drains mapped in 2022. Our model traces natural gravity flow across topography. Where they diverge without a mapped drain, water naturally converges but no surface drain is officially recorded."* |
| **"Why is the Central Silk Board site marked as a failure/outlier?"** | *"Topographically, Silk Board has a moderate HAND score of 3.4 m. The 2022 waterlogging there was primarily caused by storm sewer inlet clogging under the elevated metro/flyover pillars, which a surface DEM cannot simulate."* |
| **"Is the rain simulation hydrodynamically calibrated?"** | *"No. It is an illustrative visual implementation of Mei et al.'s (2007) virtual-pipe shallow-water equations running on the CPU at 60 FPS. It does not account for infiltration, soil saturation, or sewer pipe capacity."* |
