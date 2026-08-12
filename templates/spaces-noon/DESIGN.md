---
name: NOON
description: A building house that leases daylight — every space surveyed, priced and drawn by the real geometry of the sun
colors:
  paper: "#f7f4ee"
  paper-hi: "#fffdf8"
  ink: "#1d1a15"
  ink-soft: "#5c554a"
  sun: "#c8781c"
  sun-deep: "#9a5a10"
  shade: "#8e96a3"
  line: "rgba(29, 26, 21, 0.16)"
  line-strong: "rgba(29, 26, 21, 0.42)"
  wash: "rgba(200, 120, 28, 0.06)"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2.6rem, 7.5vw, 7rem)"
    fontWeight: 300
    lineHeight: 1.02
    letterSpacing: "-0.015em"
  chapter:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(1.8rem, 4vw, 3.4rem)"
    fontWeight: 340
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Instrument Sans, Helvetica Neue, sans-serif"
    fontSize: "clamp(1rem, 1.3vw, 1.14rem)"
    fontWeight: 400
    lineHeight: 1.66
    letterSpacing: "0.002em"
  survey:
    fontFamily: "Spline Sans Mono, Consolas, monospace"
    fontSize: "11.5px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.05em"
rounded:
  none: "0px"
  disc: "50%"
spacing:
  sheet-pad: "clamp(18px, 3vw, 44px)"
  col-gutter: "clamp(18px, 2.4vw, 36px)"
  section-y: "clamp(64px, 10vh, 130px)"
components:
  button-solid:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.survey}"
    rounded: "{rounded.none}"
    padding: "15px 30px"
  button-solid-hover:
    backgroundColor: "{colors.sun}"
    textColor: "{colors.paper-hi}"
  button-line:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "15px 24px"
  input-field:
    backgroundColor: "{colors.paper-hi}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "13px 14px"
---

# NOON design system

## Overview

The site of a building house that acquires daylight-exceptional buildings and
leases their floors to people who work by eye. Its one conviction: **light is
the only amenity that cannot be installed**, so NOON surveys light the way
other landlords survey floor area. Every number a visitor sees — sun-hours,
solar elevation, window incidence, rent — is computed at runtime from one
model: real solar geometry (declination, hour angle, altitude, azimuth) at
Havnsund, 55.7° N, applied to each building's true orientation and glazing.
The page is a drawing set, not a brochure: title blocks, sheet numbers,
hairline rules, plans and sections drawn in code.

## Color

Paper, ink, and two lights. `paper` is the ground everywhere (`paper-hi` for
raised sheets — cards, inputs); `ink` speaks; `ink-soft` annotates. **sun**
(ochre) is the only warm accent and belongs exclusively to the sun and to
action: the solar disc, computed light values, primary buttons, live states.
**shade** (cool grey-blue) belongs to shadow: shadow overlays on plans,
secondary diagram geometry, the un-lit. Never swap the two; nothing else may
be chromatic. Hairlines at 1px carry the whole structure — no borders
heavier than 1px, no shadows, no rounded corners except perfect discs.

## Typography

Three voices. **Fraunces** (300–340, tight leading, "wonky" axis off) is the
architecture — display statements and chapter titles, sentence case, never
tracked wide. **Instrument Sans** is the practice speaking — body, captions,
navigation. **Spline Sans Mono** is the survey — every measurement, time,
bearing, price, sheet number and form label, uppercase at 0.05em. If a word
is data it is mono; if it is judgement it is serif or sans. Numbers use
tabular figures throughout.

## Layout & structure

Every page is a **sheet**: a hairline frame inset by `sheet-pad`, a topbar
that reads as the drawing's header strip, and a footer built as a title
block (project · sheet no. · revision · scale) with the wordmark's double-O
sun/shadow discs. Content sits on a 12-column hairline grid; editorial
blocks span 5–7 columns, never full measure. Plans, sections and the
axonometric floor stack are inline SVG drawn to scale, annotated in the
survey voice with dimension ticks. 7 pages: index, four buildings
(lantern / meridian / grain / signal), practice, enquiry.

## Motion

Restraint is the brand. Reveals: 0.5s opacity + 8px rise, `cubic-bezier(0.25,
0.6, 0.2, 1)`, ≤0.12s stagger, gated on `.js-anim` with sweep backstop.
The one authored instrument is the **day dial** on each building page: a
draggable time control (05:00–21:00, keyboard-operable range input) that
moves the sun along its computed arc, swings the plan's shadow overlay,
re-computes the light readouts, and warms or cools the page's `--ambient`
tint (dawn rose → noon clear → evening amber) — subtly, only in accents and
plan washes, never the paper itself. The topbar carries a live solar clock
(computed for now). The hero is the site's only video: one native-4K
palindrome loop of sun through a stone arcade. `prefers-reduced-motion`
stops autoplay and reveal transitions; the dial still works (user-driven).

## Components

- **`.btn-solid`** — ink block, survey caps; hover fills with `sun`.
  **`.btn-line`** — 1px hairline; hover draws a second inner hairline.
  Focus: 2px `sun` outline offset 3px, never a glow.
- **The day dial** — a horizontal rail with a draggable sun disc; ticks at
  each hour, sunrise/sunset marked; a real `<input type=range>` underneath
  for keyboard and touch.
- **Sun-path card** — SVG: horizon line, computed solar arc for the chosen
  date, sun disc at dial time, elevation/azimuth annotated in survey mono.
- **Floor stack** — axonometric SVG of the building's floors as slabs;
  hovering (or focusing) an availability row lifts and outlines its slab in
  `sun`; let floors are hatched.
- **Plan drawings** — SVG floor plans with window walls in `sun`, shadow
  wash in `shade` rotated/stretched by dial time, dimension ticks outside.
- **Availability rows** — hairline table: floor, area, light rating,
  computed rent (area × building rate), state (available / let / reserved).
  Prices always computed, never typed.
- **Forms** — paper-hi fields, hairline borders; errors are `sun-deep` mono
  lines naming the fix; success is an inline confirmation with a survey
  reference (NN-YYYY-NNN). No toasts, no modals.

## The solar model

One JS object (`NN.sun`) owns all light math: declination
δ = 23.44°·sin(2π(284+n)/365), hour angle H = 15°(t−12), altitude
sin a = sin φ sin δ + cos φ cos δ cos H, azimuth from the standard
formula, sunrise/sunset from cos H₀ = −tan φ tan δ. Each building declares
latitude, window-wall bearings and glazing fraction; sun-hours per space =
hours when the sun stands above 6° and within ±78° of a window-wall normal.
Every readout on the site calls this model; the DESIGN rule is HARLOWE's:
a typed number is a lie waiting to drift.

## Do / Don't

- Do keep the paper bright and the chrome hairline; space is made with
  whitespace and rules, not boxes and shadows.
- Do draw buildings (plans, sections, axos) rather than decorate with them.
- Don't let `sun` describe anything that is not light or action; don't let
  `shade` color text.
- Don't animate anything the dial or the scroll didn't ask for; one
  instrument per page is the ceiling.
- Don't ship any full-bleed video below native 3840×2160 — if the source
  isn't true 4K, use a still.
