---
name: HARLOWE
description: A bell foundry site where every bell can be struck, and the commission tool is the craft's own physics
colors:
  ground: "#0d0a06"
  ground-hi: "#171008"
  ink: "#f0e7d8"
  ink-dim: "#bcab90"
  bronze: "#d9a441"
  bronze-deep: "#8f6a22"
  molten: "#ff9e45"
  verdigris: "#7fb39e"
  line: "rgba(217, 164, 65, 0.16)"
  line-strong: "rgba(217, 164, 65, 0.36)"
typography:
  inscription:
    fontFamily: "Cinzel, Trajan Pro, serif"
    fontSize: "clamp(2.6rem, 9.5vw, 8.6rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "clamp(0.10em, 2vw, 0.30em)"
  chapter:
    fontFamily: "Cinzel, Trajan Pro, serif"
    fontSize: "clamp(1.9rem, 4.6vw, 3.9rem)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "0.08em"
  prose:
    fontFamily: "EB Garamond, Georgia, serif"
    fontSize: "clamp(1.08rem, 1.5vw, 1.3rem)"
    fontWeight: 400
    lineHeight: 1.72
    letterSpacing: "normal"
  ledger:
    fontFamily: "Courier Prime, Courier New, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0.07em"
rounded:
  none: "0px"
  ring: "50%"
spacing:
  frame-pad: "clamp(16px, 2.4vw, 34px)"
  prose-x: "clamp(20px, 7vw, 120px)"
  chapter-y: "clamp(60px, 9vh, 110px)"
components:
  button-cast:
    backgroundColor: "{colors.bronze}"
    textColor: "#171008"
    typography: "{typography.ledger}"
    rounded: "{rounded.none}"
    padding: "14px 28px"
  button-cast-hover:
    backgroundColor: "transparent"
    textColor: "{colors.bronze}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.none}"
    padding: "14px 22px"
  input-field:
    backgroundColor: "rgba(217, 164, 65, 0.05)"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "12px 13px"
---

# HARLOWE design system

## Overview

The site of a family bell foundry, built as **the founding of one bell**: the
home page walks one commission from loam mould to first strike, and the
commission page turns the craft's real physics into the sales tool — pick a
strike note, and the bell's diameter, weight and guide price are *computed*
from it (f = k/D, m ∝ D³, calibrated so the numbers land on real bells), then
struck aloud from its five true-harmonic partials (hum ½f, prime f, tierce
1.2f, quint 1.5f, nominal 2f). Nothing chimes from a file; every bell on the
site is synthesized from the same physics the copy describes.

## Color

Near-black umber ground (`ground`, warming to `ground-hi`). Three metals, three
roles, never swapped: **bronze** is the metal at rest — structure, hairlines,
labels, buttons, everything cast and finished. **molten** is the metal in the
act — live sound, the strike ripple, the pour, active/hot states, errors.
**verdigris** is the metal aged — dates, provenance, history annotations only,
always quiet. Text over video always sits on a scrim. `line`/`line-strong`
draw 1px hairlines; no other borders exist.

## Typography

Three voices, each a material. **Cinzel** (400/500) is the *inscription* —
whatever the bell itself would carry: the wordmark, titles, chapter names,
the turning inscription bands. **EB Garamond** (400 + italic) is the *book* —
prose, narration, confirmations (italic `.noted`). **Courier Prime** is the
*works ledger* — every measurement, price, form label, button, order line and
error, uppercase at 0.07em. A word in Cinzel is cast, a word in Garamond is
spoken, a word in Courier is entered in the day book.

## Layout & structure

Pages sit inside a fixed hairline frame (`frame-pad` inset, corner ring
marks). Home is a vertical founding: hero, six chapters (mould / metal /
pour / cooling / tuning / first strike), the tower leaving-scene, commission
CTA, footer. Chapters alternate full-bleed video plates and text with margin
ledger notes (stage no., entry lines) anchored right at ≥1000px. Subpages
keep the frame and topbar, drop the journey chrome. 4 pages total: index,
bells, commission, foundry.

## Motion

The signature is **cooling bronze**: revealed type enters hot (`molten`, soft
glow) and cools to its resting color over ~1.6s — headline chapters only,
never body text. Reveals ease on `cubic-bezier(0.16, 1, 0.3, 1)` at 0.9s,
stagger ≤ 0.24s, gated on `.js-anim` with a no-IO failsafe; injectors call
`rescanReveals()`. Inscription bands are true-loop marquees (PATTERNS.md),
~46s per copy. Striking a bell fires concentric ring ripples — the tuning
lathe's annular rings — from the strike point. `prefers-reduced-motion`
stills the bands, kills cooling/ripples/parallax and autoplay.

## Components

- **`.btn-cast`** — bronze block, ledger caps; inverts to hairline outline on
  hover. **`.btn-quiet`** — hairline outline. Focus is a double ring
  (`outline` + offset ring), never a glow.
- **Forms** — square fields on faint bronze wash; errors are `molten` ledger
  lines naming the problem and the fix; success settles inline as an italic
  `.noted` line with a ledger order number (HL-YYYY-NNN). No toasts, no modals.
- **`.plate`** — stills framed by hairlines with ledger captions; hover lifts
  the caption, never the image.
- **`.band`** — the turning inscription: Cinzel caps with cast leaf/dot
  separators (inline SVG), embossed by paired light/dark text-shadow.
- **The keyboard** (commission) — an octave-row of strikeable keys; chosen
  note draws the bell's profile curve (inline SVG strickle section) to scale.
- Icons are inline SVG at 1.2px stroke (ring, sound, arrow, leaf). No icon
  fonts, no emoji glyphs.

## Sound

Web Audio, synthesized only — there are no audio files in this template. Each
strike sums the five partials as paired detuned sines (beating doublets),
exponential decays scaled by bell size (bigger = longer hum), under a bandpass
strike transient, through one compressor. Direct strikes (clicking a bell,
previewing a note) sound on that gesture alone; the topbar toggle
(`harlowe.sound.v1`) governs only ambient layers. Nothing sounds unprompted.

## Do / Don't

- Do compute every number a visitor sees — weights, diameters, prices,
  partial frequencies — from the one physics model; a typed number is a lie
  waiting to drift.
- Do keep video `muted playsinline loop`, lazy via IO, paused offscreen,
  poster-backed.
- Don't let molten describe anything at rest, or bronze describe an act.
- Don't use rounded corners (except perfect circles), drop shadows, toasts,
  or a fourth typeface. Depth comes from darkness and scrims, not elevation.
- Don't letter the generated bells — cast bands carry leaf and dot motifs
  only; lettering belongs to live text.
