---
trigger: always_on
description: Master operational directives unifying Archify, Graphify, Master-Dev, Impeccable, Premium-UI, CodeRabbit, and strict anti-hallucination protocols.
---

# Master Operational Rules & Execution Protocols

This document establishes the binding execution standards for all agent tasks. It coordinates installed plugins, skills, and CLI engines to deliver verifiable, high-performance, hallucination-free code and architecture.

---

## 1. Zero-Hallucination & Truthfulness Mandate (P0)

1. **Never Invent APIs**: Before using any library method (MapLibre, deck.gl, pysheds, rasterio, pyproj, RichDEM, Three.js, Framer Motion), inspect installed types or official documentation. Never guess signatures.
2. **Never Invent Data or Constants**: Coordinates, elevations, rainfall numbers, thresholds, CRS definitions, and geometry must come from validated configs or verified source documents. Never use placeholder numbers disguised as real data.
3. **Never Fake Fallbacks**: If an artifact, capability, or credential is missing, fail visibly with an explicit error. Never silently substitute mock data or wrap failing code in silent try/except blocks.
4. **Empirical Execution Gate**: No code modification is complete until executed and verified. Run local test suites (`pytest`, `npm test`, CLI checks) and report exact stdout/stderr.
5. **Exact Geo & Hydrology Precision**:
   - Coordinate order: Always `[longitude, latitude]`. Never swap.
   - CRS: Analysis must be in metric UTM zone 43N (EPSG:32643); display in Web Mercator.
   - Terrarium DEM elevation: `(R * 256 + G + B / 256) - 32768`. MapLibre default is mapbox, so always specify encoding explicitly.
   - Never say "flood prediction" or "predicts flooding"; use truthful terminology ("terrain suggests", "unmapped natural flow paths", "illustrative replay").

---

## 2. Codebase Knowledge Graph Protocol (`graphify`)

When analyzing code architecture, call hierarchies, or system impact:
1. **AST Extraction**: Index code structure using the local Tree-Sitter AST parser:
   ```powershell
   cmd.exe /c graphify . --code-only
   ```
2. **Context-Lean Graph Traversal**: Before reading raw files, query the graph to avoid blowing context limits:
   - Query: `cmd.exe /c graphify query "<search phrase>"`
   - Dependency Path: `cmd.exe /c graphify path "<SymbolA>" "<SymbolB>"`
   - Deep Dive: Read `graphify-out/wiki/index.md` or `graphify-out/GRAPH_REPORT.md` (god nodes and cluster maps).
3. **Incremental Sync**: After modifying code files in any session, synchronize the AST graph using:
   ```powershell
   cmd.exe /c graphify update .
   ```

---

## 3. Interactive Visual Architecture Protocol (`archify`)

When asked to design, document, or visualize system architecture, data pipelines, sequence calls, workflows, or state machines:
1. **No Raw ASCII or Loose Mermaid**: Generate typed Intermediate Representation (IR) JSON conforming to Archify schemas (`architecture`, `workflow`, `sequence`, `dataflow`, `lifecycle`).
2. **Validation & Compilation**: Validate and build standalone, interactive HTML diagrams with dark/light theming and motion tracing:
   ```powershell
   cmd.exe /c archify finalize <type> <candidate.json> <output.html> --quality showcase --json
   ```
3. **Quality Gate**: Run `cmd.exe /c archify check <output.html>` or `cmd.exe /c archify doctor` to guarantee zero render anomalies.

---

## 4. UI/UX Design & Component Engineering Protocol (`master-dev`, `impeccable`, `premium-ui`)

When building or refining frontend interfaces:
1. **Shared Scaffolding First (`premium-ui`)**:
   - Shared utility: `lib/utils.ts` with `cn()` (`clsx` + `tailwind-merge`).
   - Shared motion: `lib/motion.ts` with reusable Framer Motion variants (`fadeInUp`, `staggerContainer`, `scaleIn`). Never repeat inline motion definitions.
2. **Design Standards (`master-dev` & `UI/UX Pro Max`)**:
   - **Spatial Grid**: Strict 8pt harmonic spacing (`p-2`, `p-4`, `p-6`, `p-8`).
   - **Typographic Scale**: 1.25 (Major Third) or 1.33 (Perfect Fourth) ratio. Clear hierarchy (`h1`, `h2`, `h3`, `body`, `caption`).
   - **Micro-Interactions**: Active click physics (`active:scale-[0.98]`), spring transitions, visible focus rings (`focus-visible:ring-2`), minimum 44×44px touch targets.
   - **Color Palette**: Choose one cohesive palette from the 10 curated anti-generic schemes (e.g. Midnight Cyber Neon, Nordic Slate & Emerald, Luxury Onyx & Champagne).
3. **Design Critique & Quality Enforcement (`impeccable`)**:
   - Detect and eradicate the 59 design anti-patterns: uncalibrated whitespace, nested card borders, orphan labels, inconsistent radiuses, low-contrast text.
   - Refine using targeted commands: `critique`, `polish`, `bolder`, `distill`, `harden`, `colorize`, `typeset`.
4. **WebGL & 3D Performance (60 FPS Budget)**:
   - Clamp device pixel ratio: `dpr={[1, 2]}`.
   - Zero memory allocations in loops: Never instantiate vectors or colors inside `useFrame()` or `requestAnimationFrame()`.
   - Use `<instancedMesh>` for recurring entities. Limit casting shadow lights to 1 key `DirectionalLight`.

---

## 5. Code Review & Verification Protocol (`coderabbit`, `tdd-master`, `code-auditor`)

1. **Test-Driven Discipline (`tdd-master`)**:
   - Write or update tests before considering an implementation complete.
   - Mandatory test gates: Unit tests for pure logic, integration tests for pipelines, visual verification for UI.
2. **Rigorous Review Tags (`coderabbit`)**:
   - `[Critical]`: Memory leaks, unhandled exceptions, SQLi/XSS, WebGL context loss, broken contracts, data inaccuracies.
   - `[Warning]`: Missing async error handling, sub-optimal re-renders, unindexed queries.
   - `[Suggestion]`: Clean code ergonomics, naming clarity, non-critical refactors.
3. **Deep Auditing (`code-auditor`)**:
   - Inspect race conditions, concurrency bottlenecks, edge-case nullability, and security surface before approving pull requests.

---

## 6. Output Tone & Directness Protocol (`no-ai-slop`, `caveman`)

1. **Zero AI Slop**: Strip conversational filler, fake empathy ("Certainly!", "I'd be glad to help!"), and hedging ("It is important to remember...").
2. **High-Density Delivery**: Focus on execution, minimal surgical diffs, exact line ranges, and runnable terminal outputs.
3. **Clickable References**: Every mentioned file, symbol, or script must use GitHub-style markdown links with `file:///` URLs (e.g., `[ARCHITECTURE.md](file:///c:/Users/ss/OneDrive/Documents/GhostDrain/ARCHITECTURE.md)`).
