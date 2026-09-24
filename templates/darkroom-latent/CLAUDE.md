# LATENT.

Child site in the Website-Collection hub. Self-contained: one HTML page +
`css/` + `js/` + `img/` + `fonts/`, no build step, no bundler. Every
density, time and grade figure comes from `js/paper.js`; after changing
the model, run `node tools/bake.mjs` to re-bake the static numbers
(`node tools/bake.mjs --check` fails if they are stale).
`node tools/shot.mjs [desktop|tablet|mobile]` walks one sheet through the
whole bench in headless Chrome over CDP (setup in the file's header) and
writes screenshots to `tools/shots/` (gitignored).

Read `DESIGN.md` in this folder before touching any UI here.

# UI Generation Rules (DARK engine)
Before writing, editing, or restyling any front-end UI in this repo:
1. This project is DARK-engine (see .claude/engine-mode). Do NOT invoke
   `frontend-design`, `impeccable`, or `web-design-guidelines`, and do
   NOT read DESIGN-SYSTEM/DESIGN.md — those belong to the light engine
   only, mixing them in is exactly what the engine split exists to
   prevent. **Exception, added 2026-09-24 after a real build (`BLOOM.`)
   followed this line and skipped both: DESIGN.md §2 (the over-constraint
   rule) and §6 (the accessibility & motion floor, the no-hand-geometry
   rule, and the ask-before-generating gate on AI image/video generation)
   are NOT restated anywhere in DARK.md — read those two sections
   directly, they are hard constraints here too. Nothing else in
   DESIGN.md applies.**
2. Read this repo's own DESIGN.md AND
   C:\Users\sengc\OneDrive\Desktop\Company\DESIGN-SYSTEM\DARK.md (the
   company-wide dark taste system — absolute path because this project
   is nested inside a shared catalog repo; verified to resolve). Treat
   both as hard constraints.
3. Reach for the real open-source stack named in DARK.md §5 by default
   rather than hand-rolling the effect from scratch. Compose from real
   licensed scaffolding (§1.2) — original execution and content on top,
   never a copy of a finished real brand.
4. Check licensing as each dependency/asset is added (DARK.md §2), not
   as cleanup at the end.
5. Before calling any UI work done: take real screenshots (desktop +
   mobile) and check them against DARK.md §4's checklist directly
   against the image, not just the code (DARK.md §6).
