# EVEN — design record

Recorded from the built page (2026-08-09), ground truth over intention.

## World

The page is a race-day **pace band** — the laminated wrist strip of kilometre splits —
worn at full scale. The page is presented as a 10 km run: scroll position reads as
distance on a fixed split rail, sections sit between kilometre checkpoints, and the
finish line is the footer.

## Tokens (css/style.css `:root`)

- Ground/paper: `#FBFBFC` paper, `#F1F2F4` pale-silver tint for alternating sections.
- Ink: `#1B1D20` charcoal; secondary `#55595F`; faint numerals `#6A6E74` (kept ≥4.5:1).
- Steel: `#EEF0F3 / #C9CCD2 / #F6F7F9` gradients + `repeating-linear-gradient` 1px
  brushing, used only on band clasps and the Club plan panel.
- Error (functional only): `#A14A38` muted brick. No green, no purple, nothing saturated.
- Shadows are soft, offset, low-alpha (`--shadow-soft`, `--shadow-lift`). No hard offsets.

## Type

- Display/body: **Schibsted Grotesk** (Google Fonts, variable 400–900).
- Every number is **Spline Sans Mono** with `font-feature-settings: "tnum"` — splits,
  cumulative times, distances, prices, the rail. Mono is measurement, never costume.

## Components

- **Band**: clasp (steel) + cells (`km n / split / cumulative`) + end clasp. Variants:
  `band-sheen` (pointer-tracked lamination highlight via `--mx/--my`), `band-ghost`
  (dashed empty state), `is-building` (shimmer while the builder works).
- **km-rule**: hairline checkpoint with `km n` tag — the section divider; the sequence is
  real (the rail agrees with it), so the numbers carry information.
- **Run card**: record-card of one run; evenness dial (SVG arc, counts up on first view);
  splits table with delta chips (faster = filled charcoal, slower = outline, 0 = "level").
- **Builder**: segmented radios, mono time input, validation messages in the hint line,
  busy button with spinner, ~950 ms shimmer, toast confirmation, print stylesheet
  (`body.print-band` shows only the band), localStorage restore chip (`even.band.v1`).

## Signature motion (one authored moment)

Scroll = the run. The fixed rail maps scroll → 0.0–10.0 km piecewise through the
`data-km` sections and shows projected elapsed at 5:40/km; the thumb ticks at each whole
kilometre. Supporting: hero strip settles then is "read" once cell-by-cell; reveals are
soft rise+deblur. Everything honors `prefers-reduced-motion`. **No marquee** — the
collection varies its signature motion per template.

## Imagery

One silver-fog world, generated in a reference chain (see IMAGE-CREDITS.md): hero
embankment (21:9), bridge interlude (3:2), shoes detail (4:3). Near-monochrome cool
grade; the hero's left two-thirds are negative space for the headline.

## Boundaries

Self-contained template (`index.html` + `css/style.css` + `js/main.js` + `img/`), zero
dependencies, CSP `script-src 'self'`. Direction contract lives in the opening HTML
comment (seed 05530ac4).
