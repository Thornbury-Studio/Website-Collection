This project inherits C:\Users\sengc\OneDrive\Desktop\Company\DESIGN-SYSTEM\DARK.md (absolute path, because the project is nested inside the Website-Collection catalog repo; verified to resolve). Below are this project's own tokens and brand-specific rules.

# Pontil & Pistil

## 1. Overview & Identity

A studio that makes scientifically exact glass botanical models in the Blaschka tradition, each cast from a scan of one living bloom. The brand is fictional; the botany and the history are real and sourced.

**The one idea:** the living flower and the glass flower are the same plant at two moments. It is enacted, never asserted: one renderer draws a single photograph three ways, and a front travelling out from the flower's throat decides which way a given pixel is drawn.

- **LIVING** (phase 0): the photograph, relit only by how far the surface has turned.
- **SCAN** (phase 1): a point cloud built from the baked depth map.
- **GLASS** (phase 2): the same relief shaded as cast glass: mostly clear and pale where the tepals are thin, denser toward the throat, anthers kept as opaque enamel, a hairline rim and two studio-panel reflections, on a lit ground with ruled lines behind it so the transmission shows. A depth-only prepass makes each pixel blend once; without it, folds in the displaced mesh show as bright rows.

Order is LIVING, SCAN, GLASS because that is the order it happens in at the bench. Scroll scrubs 0 to 2 across the pinned hero; the switch jumps to any state.

**One photograph on purpose.** Every state of every page is the same lily (Unsplash, Pedro Vit). The reuse is the concept: it is one specimen. Inner pages therefore carry no additional photography; they carry sourced text and tables.

**Reference DNA taken, nothing reproduced:** one specimen alone in a void, hairline leader-line callouts naming its parts, cut-corner HUD frames, mono microtype, and a switch that changes the whole world rather than light versus dark. The reference's layout, wording, name, barcode motif and assets are not used.

## 2. Colors

Three full worlds set as custom properties on `html[data-world]`. Contrast is measured against each world's `--bg`.

| Token | Living | Scan | Glass |
|---|---|---|---|
| `--bg` | #0a0807 | #071a3d | #061214 |
| `--ink` | #f2e7d7 (16.4:1) | #e8f1ff (15.1:1) | #e4f4f2 (16.8:1) |
| `--mute` | #ad9c89 (7.5:1) | #a3b8da (8.5:1) | #9bbab7 (9.2:1) |
| `--accent` | #ff9b3d (9.5:1) | #6ff2d0 (12.5:1) | #8ee8f2 (13.6:1) |
| `--accent-ink` on accent | #1a0d02 (9.1:1) | #032019 (12.5:1) | #02161a (13.2:1) |

No purple anywhere. The living bg equals the flattened photograph backdrop (10, 8, 7) so the poster and canvas meet the page with no seam.

## 3. Typography

- Display: Fraunces variable, roman and italic, weight 360. The italic carries emphasis and Latin names.
- Body and UI: Instrument Sans variable.
- Microtype: Spline Sans Mono, uppercase, +0.13em tracking, 11.5px and up.

All self-hosted, Latin subset, SIL OFL. Not Inter, Roboto, Arial or Space Grotesk.

## 4. Layout & Spacing

- Home hero is a 330svh pinned stage. Desktop: specimen right-aligned at min(63vw, 114svh), headline lower left, switch lower right. Mobile is its own composition: the specimen is 108vw wide (the photograph's black margins are cropped), headline and caption below it, the switch is a full-width dock at the thumb.
- Callouts sit in the photograph's black corners. Slots are percentages of the specimen box and differ for phone and desktop.
- Sections: hairline top rule, 4.5 to 9rem vertical rhythm, two-column heads from 900px.
- Prose pages: question headings on the left (sticky), answer on the right.

## 5. Elevation & Depth

No shadows, no glass-morphism, no blur. Depth is the specimen's own relief. Frames are cut-corner hairline boxes (`.frame`): a clip-path with two diagonal rules drawn at the cut corners.

## 6. Components & States

- **Switch**: three radios in a fieldset, native keyboard behaviour, checked state is the accent fill. 48px tall.
- **Callouts**: DOM text, numbered to the legend; SVG leader lines and anchor rings follow the relief while it tilts (anchors are projected on the CPU from the same depth map the vertex shader samples).
- **Legend, bench timeline, cabinet table, Q and A**: real content, left aligned, hairline separated. No icon cards, no stat banner.
- **Poster to canvas**: the poster `<img>` is the LCP. The canvas fades in over it once the relief texture has loaded and WebGL2 is up. Without WebGL2 the switch is hidden and the poster stays.
- **Motion**: under `prefers-reduced-motion` there is no scrub, no idle drift, no pointer tilt and no scan sweep; the switch jumps between states and the hero is one screen tall.

## 7. Do's and Don'ts

- Do keep every fact in DOM text; the canvas is decoration.
- Do keep sources named on the article pages and the counts in step with them.
- Do cap DPR through the governor and render only while the stage is visible.
- Don't hand-author flower geometry. The mesh is a regular grid displaced by the baked depth map.
- Don't add a second effect. One mechanic.
- Don't add third-party scripts, forms, prices or payment of any kind.
- Don't claim a rich result for the FAQ markup.

## 8. Agent Instructions

```
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
2. Read this repo's own DESIGN.md AND ../DESIGN-SYSTEM/DARK.md (the
   company-wide dark taste system — adjust the `../` depth to match
   this project's actual nesting, or use an absolute path if nested
   inside a shared catalog repo, see the note above). Treat both as
   hard constraints.
3. Reach for the real open-source stack named in DARK.md §5 by default
   rather than hand-rolling the effect from scratch. Compose from real
   licensed scaffolding (§1.2) — original execution and content on top,
   never a copy of a finished real brand.
4. Check licensing as each dependency/asset is added (DARK.md §2), not
   as cleanup at the end.
5. Before calling any UI work done: take real screenshots (desktop +
   mobile) and check them against DARK.md §4's checklist directly
   against the image, not just the code (DARK.md §6).
```

Stack note (DARK.md §5): Lenis, GSAP and SplitType were considered and left out. The one mechanic is a raw WebGL2 program plus a hand-written scroll mapping, which keeps the page at zero third-party scripts and inside the existing CSP.
