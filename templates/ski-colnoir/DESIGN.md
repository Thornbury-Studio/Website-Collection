---
name: COL NOIR
description: A freeride mountain whose site is its daily avalanche bulletin
colors:
  paper: "#f5f6f4"
  paper-dim: "#ecefec"
  ink: "#16181a"
  muted: "#667074"
  hair: "#d5dad7"
  red: "#d8272c"
  danger-1: "#4f9d5b"
  danger-2: "#e9c531"
  danger-3: "#ee8b2c"
  danger-4: "#d8272c"
  danger-5: "#1a1a1a"
typography:
  masthead:
    fontFamily: "Archivo, Helvetica Neue, sans-serif"
    fontSize: "clamp(2.6rem, 9.2vw, 8.6rem)"
    fontWeight: 900
    lineHeight: 0.92
    letterSpacing: "-0.01em"
  section:
    fontFamily: "Archivo, Helvetica Neue, sans-serif"
    fontSize: "clamp(1.5rem, 3.4vw, 2.6rem)"
    fontWeight: 850
    lineHeight: 1.1
    letterSpacing: "0"
  stat:
    fontFamily: "Archivo, Helvetica Neue, sans-serif"
    fontSize: "clamp(2rem, 4.2vw, 3.4rem)"
    fontWeight: 250
    lineHeight: 1
    letterSpacing: "0"
  body:
    fontFamily: "Archivo, Helvetica Neue, sans-serif"
    fontSize: "clamp(1rem, 1.35vw, 1.15rem)"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0"
  data:
    fontFamily: "Chivo Mono, Cascadia Mono, monospace"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0.12em"
rounded:
  none: "0px"
spacing:
  gut: "clamp(18px, 4vw, 56px)"
  section-y: "clamp(40px, 7vh, 84px)"
components:
  button:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.data}"
    rounded: "{rounded.none}"
    padding: "15px 28px"
  button-hover:
    backgroundColor: "{colors.red}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "14px 22px"
  input-field:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "12px"
---

# COL NOIR design system

## Overview

A fictional high-alpine freeride domain whose entire site is its **morning
avalanche bulletin**: institutional safety-report grammar — danger scale,
elevation bands, aspect roses, lift board, observation log — laid over
full-bleed 4K mountain footage. The governing mechanism is the deterministic
per-date mountain model (`js/model.js`): every number on every page (snowfall,
depths, temperatures by lapse rate, wind, danger ratings, lift states, sector
access, pass prices) derives from it. New UI must read from the model, never
invent a value.

## Color

Glacier paper ground, hard ink, and **one Swiss red** (`--red`) for document
structure (masthead tick, rules, active-nav underline, noted bars) and action
hover. The European danger-scale colors (`--d1…--d5`) are the only other
chroma and appear **exclusively as data** — scale steps, day-strip dots, state
dots — never as decoration. Level 5 renders as ink outlined in red. Footage
bands carry the site's visual chaos; the paper stays disciplined.

## Typography

Archivo variable is the office's voice: width 125 / weight 900 uppercase for
mastheads and band quotes, weight 850 / width 118 for section titles, weight
250 for big stat numerals (thin numbers read as instrument output), 400 for
prose. Chivo Mono carries every measurement, label, date, control and error —
mono means "the mountain measured this", Archivo means "the office wrote
this."

## Layout & structure

A sticky two-rule masthead (ink border), a mono issue strip, then report
sections inside a 1290px grid with `.sect-head` rows (red key + title +
right-aligned aside). Full-bleed `.band` footage sections break the report
between chapters, each carrying a mono `Fig. N ///` plate in an ink chip.
Diagrams live in bordered `.diagram` figures on near-white. Mobile gets a
fixed bottom tab bar instead of the masthead nav.

## Motion

Quiet by report standards, loud by data: reveals rise 22px on the standard
`cubic-bezier(0.16, 1, 0.3, 1)`; the wind-hold dot pulses (the only blinking
element — it means something); snowfall falls on the page only when the model
says it is snowing, drifting at the model's wind angle; the WebGL massif
drifts slowly and obeys drag. `prefers-reduced-motion` stops all of it.

## Signature pieces

- **The massif** (`js/massif.js`): procedural heightfield rendered as ink
  contour lines on paper in raw WebGL — the bulletin's map standing up.
  Sector hover highlights its band in red.
- **Value-true SVG figures**: depth bars, wind rose with lee-octant shading,
  danger-by-band pyramids, aspect roses — all drawn from model numbers.
- **The pass card** (`js/passes.js`): canvas-rendered day pass with a seeded
  gate matrix; wallet persists in `colnoir.passes.v1`.
- **Model-driven audio**: wind ambience gain follows the model's wind speed;
  a howl layer enters above 55 km/h; the gate beep is synthesized.

## Do / Don't

- Do derive every new number from `CN.build(date)`; the model is the site.
- Do keep danger colors as data and red as structure/action; never mix roles.
- Don't add rounded corners, shadows, or a second accent; depth comes from
  ink rules and footage, not elevation.
- Don't blink anything except a live hold state.
