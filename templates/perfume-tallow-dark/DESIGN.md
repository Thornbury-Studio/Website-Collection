This project inherits ../../../DESIGN-SYSTEM/DARK.md. Below are this project's own tokens and brand-specific rules.

# DESIGN.md — TALLOW DARK

## 1. Overview & Identity

**TALLOW DARK** is a debut eau de parfum from a single railway arch in
Deptford. The house renders beef suet — the most utilitarian material
there is, the stuff of candles, soap and staying alive — and finishes it
as something you would pay £185 to wear.

**The one idea:** *the raw material and the refined result are the same
substance, told twice.* Everything on this site is that sentence enacted,
never asserted. There is no paragraph anywhere that says "humble becomes
luxurious"; the page performs the turn instead.

**How it is enacted, three ways:**

1. **The render pass** (`#render`, the site's one authored moment). A
   single photograph of a slab of raw fat fills the viewport. A melt line
   crosses it under scroll. Above the line the same pixels are graded
   cold, gritty, high-contrast, chalk-white — raw material. Below the
   line the slab does what fat in a pot actually does: its structure
   dissolves into clear gold liquid, lit from the surface and deepening
   to amber. Its broad form survives as density (a far mip of the same
   photograph) and its veining only as a faint refraction ghost — so it
   is still visibly the same substance, never a second photograph. One
   texture, two renderings, simultaneously, with the boundary under the
   visitor's hand. Each readout card is only shown on its own side of the
   line: the parfum card appears once the melt reaches it.

   *Critique round 1 (fresh-context critic):* the first version graded the
   lower half as a warm gradient-map of the intact slab, which read as
   "stained butter" and contradicted its own `CLEAR` readout. Fixed by the
   dissolve above; do not regress to grading the texture in place.
2. **The ledger** (`#ledger`). Every fact about the product is printed
   twice, once in each register, on the same row. `£3.20 a kilo` sits
   beside `£185 a bottle`. `Candles. Soap. Lamp oil. Keeping people
   alive.` sits beside `Something to wear on a Thursday.` The thesis is a
   table, not an adjective.
3. **The page warms as it renders.** `--render` is a registered
   `@property` driven by the same ScrollTrigger as the melt line. It
   moves the page ground from cold pitch to warm pitch, the rules from
   steel to tallow, and the wordmark's accent with it. The site you
   finish reading is not the site you started.

**Refuse:** a bottle floating on a gradient pedestal; flat-lay product
grids; "artisanal" script; the perfume-ad idiom generally. The reference
DNA is documentary — real labour, real architecture, black and white.

**Not to be confused with** `wick-tallow` (a *game* site set in a match
factory — soot ground, flame orange, a pointer-driven match cone). Shared
word, unrelated brand, and this palette deliberately avoids its
`--flame`/`--soot` pairing. Also not `fragrance-orris` (paper-light
product house with a compound bench).

## 2. Colors

Two accents, each owning half the story. The raw half is bare steel; the
refined half is tallow gold. They never appear at full strength in the
same band.

| Token | Hex | Role | Contrast on ground |
|---|---|---|---|
| `--pitch` | `#0A0A0C` | cold page ground (raw) | — |
| `--pitch-warm` | `#14100A` | warm page ground (rendered) | — |
| `--ground` | interpolated | live ground, driven by `--render` | — |
| `--raise` | `#141417` | raised band / table stripe | — |
| `--chalk` | `#E6E4DE` | primary type | 16.8:1 |
| `--grease` | `#9B978D` | muted type, captions | 7.4:1 |
| `--dim` | `#6E6B64` | rules, disabled, meta only — never body | 3.9:1 |
| `--steel` | `#A8AFB3` | raw-side accent | 8.9:1 |
| `--tallow` | `#D9B26A` | refined-side accent | 9.1:1 |
| `--ember` | `#8A5A22` | warm rule / underline only, never type | — |

`--dim` is rules-and-meta only by rule, because it is the one token below
4.5:1. Anything a reader must read uses `--grease` or lighter.

## 3. Typography

Two families, each carrying one register. The contrast between them *is*
the idea.

- **Martian Mono** (OFL, Google Fonts) — the raw voice. Wordmark, nav,
  all-caps labels, the ledger's left column, every readout and notice.
  Width axis pulled to `87.5` so tracked-out caps stay compact.
  Industrial, unlovely, exact.
- **Newsreader** (OFL, Google Fonts, variable `opsz`) — the refined
  voice. Display headlines and long-form prose on the rendered side. The
  optical-size axis does the refining: at 60px+ the hairlines thin and
  the face reads as cut metal; at 18px it stays warm and readable.

Not Inter, not Roboto, not Space Grotesk, not Arial. No centred hero
`<h1>` — the hero sets flush left against the arch photograph.

Scale: `clamp()` throughout, `--step--1` … `--step-6`, ratio 1.24 at
360px widening to 1.33 at 1600px.

## 4. Layout & Spacing

12-column grid, `--gutter: clamp(20px, 4vw, 72px)`, max line length 62ch
for Newsreader prose and 48ch for Martian Mono.

Sections alternate between **full-bleed frame** (one photograph, edge to
edge, caption in the margin) and **ruled ledger** (typography on the
ground, hairline rules at `--dim`). No card grid anywhere on the site —
the house section is a staggered two-column editorial, not three boxes
with icons.

Per PATTERNS.md: every grid that places any child places *all* of them
(`grid-column` **and** `grid-row`), because auto-placement beside a
placed sibling is a coin-flip.

## 5. Elevation & Depth

There is no elevation system. Nothing floats, nothing has a shadow,
nothing is a glass pill. Depth comes from the photography and from one
hairline rule weight (`1px` at `--dim`). The only "surface" is
`--raise`, used for the ledger's alternating rows and nothing else.

Explicitly banned here: `backdrop-filter` blur panels, rounded pill
badges above headlines, drop shadows on type, gradient borders.

## 6. Components & States

- **Nav** — fixed, mono caps, hairline underline on hover *and* focus.
  Accent colour interpolates with `--render`.
- **Melt readout** — the chip riding the melt line. Mono, tabular
  figures, reads `RENDER 43% · 41 °C`. `aria-hidden`; the same numbers
  exist as real text in the section's `<figcaption>` for assistive tech.
- **Ledger row** — two cells, left `--grease` mono, right `--chalk`
  Newsreader. On wide screens a hairline runs between them; on narrow
  they stack with the mono cell first and an em-rule between.
- **Focus** — `outline: 2px solid var(--tallow); outline-offset: 3px` on
  everything focusable. Never removed.

## 7. Do's and Don'ts

**Do**
- Keep the melt line the only scroll-pinned element on the site.
- Write every product fact twice, once per register — that is the format,
  not a flourish.
- Keep photography black and white on the raw side; warm duotone is
  reserved for the rendered side and for one frame only (`rack`).
- State a real number wherever a claim is made.

**Don't**
- Add a second WebGL surface. One is the idea; two is decoration.
- Introduce a third typeface.
- Let `--tallow` appear above the melt line, or `--steel` below it.
- Write the words "elevate", "unlock", "transform", "empower", or
  "crafted".

## 8. Stack — what was taken and why

Per DARK.md §5, chosen against the concept rather than taken wholesale:

| Library | License | Doing what |
|---|---|---|
| **Lenis** 1.1.x | MIT | Smooth scroll. The melt line is scrubbed, so wheel-step jitter would be visible on the boundary; Lenis keeps native anchors, sticky and keyboard scrolling intact. Not initialised under `prefers-reduced-motion`. |
| **GSAP** 3.12 + **ScrollTrigger** | GSAP standard "no charge" license | The pin and the scrub for the render pass, and the staggered reveals. Real physical easing rather than an `IntersectionObserver` fade. |
| **SplitType** 0.3.x | MIT | Line-level reveal on the two display headlines only. Not used on body copy. |

**Deliberately not taken:** `three.js` — the render pass is one
full-screen quad over one photograph. Shipping ~600 KB of scene graph to
draw a quad is exactly the "library as a coat of paint" failure DARK.md
§9 names, so the pass is ~90 lines of plain WebGL2 instead. There is no
geometry anywhere in it, hand-authored or otherwise: the melt is a
fragment program over a licensed photograph, which is why the
no-hand-authored-geometry rule is not in play here.

**Also not taken:** Barba/Swup. A melt wipe between pages would repeat
the site's central gesture and dilute it.

LICENSE notices for all three live in `LICENSES.md` beside this file.

## 9. Performance & motion floor

- DPR capped at 2. The canvas only renders while its section intersects
  the viewport, and only when `--render` actually changed.
- `prefers-reduced-motion: reduce` — Lenis is never constructed,
  ScrollTrigger pinning and scrubbing are skipped, the render pass draws
  once at a fixed 50% split so both states stay visible and legible, and
  every reveal resolves to its final state immediately.
- No WebGL2 (or no context) falls back to the plain `<img>` underneath
  the canvas, graded cold, with the section still readable.
- Images: `webp`, two widths, `srcset`/`sizes`, `loading="lazy"` on
  everything below the fold, explicit `width`/`height` on all of them.
