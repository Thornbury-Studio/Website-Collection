---
name: SEJUK
description: An equatorial ice house — finely shaved milk-snow with Singapore flavours, pickup only, because ice waits for no one
colors:
  frost: "#f2f5f6"
  frost-2: "#e9eef0"
  paper: "#fbfdfd"
  ink: "#10222e"
  ink-2: "#3d525e"
  hairline: "rgba(16, 34, 46, 0.14)"
  sirap: "#c8203e"
  sirap-ink: "#a51730"
  sirap-wash: "#fae7eb"
  open: "#0e6e53"
typography:
  display:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(2.9rem, 12vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.03em"
  section:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 6.5vw, 3rem)"
    fontWeight: 650
    lineHeight: 1.04
    letterSpacing: "-0.02em"
  itemName:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "1.22rem"
    fontWeight: 650
  body:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  mono:
    fontFamily: "Spline Sans Mono, ui-monospace, monospace"
    fontSize: "0.8rem"
    fontWeight: 500
    letterSpacing: "0.08em"
rounded:
  sm: "3px"
  md: "6px"
  lg: "10px"
  pill: "999px"
spacing:
  gut: "20px"
  section-y: "64px"
  tap: "44px"
components:
  button:
    backgroundColor: "{colors.sirap}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 22px"
    minHeight: "44px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.md}"
  card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    border: "1px solid rgba(16, 34, 46, 0.09)"
  chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    minHeight: "40px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
---

# SEJUK° design system

## Overview

SEJUK ("cold" in Malay) is an equatorial ice house: snow-fine shaved milk-ice
in Singapore flavours — pandan, gula melaka, bandung, chendol, kopi tarik —
served in steel bowls in two shophouse rooms. The commercial spine of the
brand is a physical fact: **an ice lives about fifteen minutes.** So there is
no delivery, pickup slots are computed from shave time, and the whole site
speaks in the register of weather — forecasts, fronts, relief.

Where LOAM is warm oat and NEAP is cool paper, SEJUK is *cold air*: a
frost-pale ground, deep cold ink, hairline rules, tight radii, generous
whitespace — and colour that only ever arrives as syrup.

## Colour

The interface is deliberately near-monochrome. One hot accent — sirap, the
red of bandung syrup — carries every call to action. Each dessert brings its
own syrup swatch (a small dot on cards, a flood on hover) as *data*, never as
interface chrome. A single cold green marks genuinely-open-now states.

## Typography

Three voices:

- **Bricolage Grotesque** — display and item names. Heavy, tight, a little
  eccentric in the cuts; set in large sizes it feels like cold-room signage.
- **Schibsted Grotesk** — body and controls. Clean, cool, legible small.
- **Spline Sans Mono** — the receipt voice: kickers, prices, hours, the
  temperature ticker, and the entire chit. Prices always mono, always
  tabular, so totals never shimmer.

Section kickers are numbered with degree marks — `01° THE ICES` — the
brand's ° mark doing quiet work everywhere.

## Imagery

Two families, one cold light (see `IMAGE-CREDITS.md`): a generated product
set — every ice a tall snow dome in the same footed steel bowl, same frost
seamless, same upper-right daylight — and licensed macro textures (powder
snow, a clear ice block, condensation) graded to the same frost. Nothing
warm-toned survives the grade pass ungraded.

## The chit

Ordering borrows the kopitiam chit. Add an ice → the card marks itself, the
badge counts, a toast confirms. The chit itself is a bottom sheet set
entirely in mono with a serrated tear edge: quantity steppers, solo/berdua
sizes, syrup add-ons, a note to the counter, and a **ready-in estimate
computed from actual shave time** (base 3 min + 90 s per solo, 150 s per
berdua). Pickup slots on the order page are generated from each outlet's real
hours minus the last-shave cutoff. Every number on the site is computed from
`js/catalogue.js`; nothing is hand-typed twice.

## Motion & feedback

Reveals rise 12 px on a soft ease — IO-gated with hard-timer failsafe and
scroll sweep, opacity as a static cut, never in keyframes. The melt bar on
product sheets drains on a slow linear transition. Buttons depress 1 px;
cards lift only on hover-capable pointers. Every tap answers in words: a
toast (`role="status"`), a badge, a recomputed time.

## Do / Don't

- Do let all colour come from the desserts; the UI stays cold.
- Do compute every promised number (prices, totals, ready times, hours) from
  the catalogue and the clock.
- Don't add delivery. "Ice waits for no one" is a brand law, not copy.
- Don't warm the palette, round the corners, or add a second accent.
- Don't put an ice or a warm plate on the board without its photograph;
  drinks and bottles may live as typographic menu rows instead.
