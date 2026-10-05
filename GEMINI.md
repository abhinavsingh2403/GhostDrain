# GEMINI.md: Ghost Drains (Antigravity-specific)

Read `AGENTS.md` first. Everything there applies. This file only adds Antigravity-specific habits. If anything here conflicts with `AGENTS.md`, the stricter rule wins.

## Session start
1. Read `AGENTS.md`, then the one doc matching today's task (`docs/ROADMAP_TASKS.md` tells which).
2. State in your plan: docs read, files you will touch, assumptions, and what is unverified.
3. Do not start coding until the plan lists a test or check for the task.

## Verifying APIs
- Use the browser tool to open the **official docs** for any library API you are not certain about (MapLibre, deck.gl, rasterio, pysheds, RichDEM, pyproj). Quote the doc URL in your plan.
- For dependencies, read the installed package's types/README instead of relying on memory.
- If a doc page cannot be reached, say so; do not substitute recalled behaviour.

## Spikes
- Spikes S1-S5 in `docs/ARCHITECTURE.md` are experiments. Report results with numbers (frame times, errors) in `docs/VALIDATION_LOG.md`. Do not turn a spike into production code until its pass condition is met.

## Artifacts and reports
- Test output, screenshots and measurements you produce must come from actually running the code on this machine. Label anything estimated.
- Keep summaries short: what changed, what ran, what is still unverified.

## Skills
- Only load skills whose SKILL.md you have read. Prefer few, relevant skills.

## Do not
- Change CRS, grid contract, or tile encoding without asking.
- Add new datasets or tile providers without a manifest entry and a license check.
- Write UI copy that breaks `docs/HONESTY_AND_LIMITATIONS.md`.
