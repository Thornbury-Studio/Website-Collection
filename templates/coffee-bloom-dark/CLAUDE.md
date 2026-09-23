# BLOOM.

Child site in the Website-Collection hub. Self-contained: four HTML pages +
`css/` + `js/` + `img/`, no build step, no bundler. Every freshness figure,
price and date is computed by `js/bloom-model.js`; after changing the model,
run `node tools/bake.mjs` to re-bake the static numbers.

Read `DESIGN.md` in this folder before touching any UI here.

# UI Generation Rules (DARK engine)
Before writing, editing, or restyling any front-end UI in this repo:
1. This project is DARK-engine (see .claude/engine-mode). Do NOT invoke
   `frontend-design`, `impeccable`, or `web-design-guidelines`, and do
   NOT read DESIGN-SYSTEM/DESIGN.md — those belong to the light engine
   only, mixing them in is exactly what the engine split exists to
   prevent.
2. Read this repo's own DESIGN.md AND ../../../DESIGN-SYSTEM/DARK.md (the
   company-wide dark taste system — the `../` count is three because this
   project sits at `Company/Website-Collection/templates/<slug>/`, i.e.
   three levels below company root; verified to resolve to a real file).
   Treat both as hard constraints.
3. Reach for the real open-source stack named in DARK.md §5 by default
   rather than hand-rolling the effect from scratch. Compose from real
   licensed scaffolding (§1.2) — original execution and content on top,
   never a copy of a finished real brand.
4. Check licensing as each dependency/asset is added (DARK.md §2), not
   as cleanup at the end.
5. Before calling any UI work done: take real screenshots (desktop +
   mobile) and check them against DARK.md §4's checklist directly
   against the image, not just the code (DARK.md §6).
