---
name: LOAM
description: A neighbourhood café and small roastery with a tappable, tray-building menu
colors:
  oat: "#f7f0e4"
  oat-2: "#efe5d4"
  cream: "#fffdf8"
  bark: "#2c211a"
  bark-2: "#5d4f43"
  ember: "#b8441a"
  ember-ink: "#97370f"
  ember-wash: "#f7e3d8"
  open: "#2f6d3a"
  hairline: "rgba(44, 33, 26, 0.14)"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2.8rem, 15vw, 4.6rem)"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  section:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(1.9rem, 7vw, 2.6rem)"
    fontWeight: 600
    lineHeight: 1.12
  itemName:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.2rem"
    fontWeight: 600
  body:
    fontFamily: "Work Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.62
  kicker:
    fontFamily: "Work Sans, system-ui, sans-serif"
    fontSize: "0.76rem"
    fontWeight: 600
    letterSpacing: "0.14em"
rounded:
  sm: "10px"
  md: "16px"
  lg: "24px"
  pill: "999px"
spacing:
  gut: "18px"
  section-y: "56px"
  tap: "44px"
components:
  button:
    backgroundColor: "{colors.ember-ink}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "11px 20px"
    minHeight: "44px"
  button-quiet:
    backgroundColor: "{colors.oat-2}"
    textColor: "{colors.bark}"
    rounded: "{rounded.pill}"
    padding: "11px 20px"
  card:
    backgroundColor: "{colors.cream}"
    rounded: "{rounded.lg}"
    border: "1px solid rgba(44, 33, 26, 0.08)"
  chip:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.bark}"
    rounded: "{rounded.pill}"
    minHeight: "40px"
  chip-selected:
    backgroundColor: "{colors.bark}"
    textColor: "{colors.cream}"
  input-field:
    backgroundColor: "{colors.cream}"
    rounded: "{rounded.sm}"
    padding: "11px 12px"
---

# LOAM design system

## Overview

A neighbourhood café and small roastery. Where NEAP is cool paper and pure
typography, LOAM is the opposite by design: warm, rounded, photographed and
built to be tapped with a thumb. Every item on the board carries its own
picture, and the whole menu is a working order surface — tap to add, watch a
tray fill, send it to the counter.

Mobile is the base case, not a breakpoint. The stylesheet is written for a
phone first and widened at `min-width`; the tray docks to the bottom of the
viewport with `env(safe-area-inset-bottom)` respected, filter chips scroll
horizontally, and every control clears 40–44px.

## Color

Warm oat ground, deep bark ink, and one ember accent used with discipline —
kickers, prices in the tray pip, the primary button, roast meters. A single
green (`--open`) is reserved for genuine "yes" states: the open-now dot and a
card that is on the tray. Contrast was audited across 25 pairs; the tightest
is 5.41:1, comfortably past AA.

## Typography

Fraunces carries warmth and a little wonk — the wordmark, section heads and
every item name. Work Sans handles everything functional: body copy, chips,
buttons, prices. Prices and clock times use tabular numerals so columns and
totals never shimmer as they change.

## Imagery

Two families, one palette (see `IMAGE-CREDITS.md`). Sixteen generated flat-lay
item photographs share one verbatim style block so the grid reads as a single
shoot; four licensed photographs of the room and the machine are graded warm
to sit beside them. Item shots are square, so cards never crop a subject.

## The tray

The interaction spine, in `js/tray.js`, shared by every page:

- Tap **Add** → the card marks itself, a badge counts what's on the tray, a
  toast confirms in words, and the docked bar appears with a live total.
- The bar opens a bottom sheet (a side panel from 720px) with quantity
  steppers, per-line removal, a free-text note to the counter, the total, and
  a **pickup estimate computed from the ticket** (`4 min + 1 per item`).
- State persists in `loam.tray.v1` and is re-validated on load: anything no
  longer on the menu is dropped, quantities clamped. Nothing is ever charged.

Every figure — line prices, total, pickup, item counts in copy — is computed
from `js/catalogue.js`. Change a price there and the whole site follows.
`CURRENCY` is a single constant at the top of that file.

## Service hours are real

`js/service.js` derives everything from `HOURS`: whether the door is open, how
long until it closes, when it opens next, and — separately — when the
**kitchen** runs. Plates outside kitchen hours render dimmed, disabled, and
labelled with the kitchen's own next start ("Kitchen back tomorrow at 8:00"),
which is a different clock from the café's opening. Never conflate them.

## Motion & feedback

Reveals rise 14px on a soft ease, IO-gated with a hard-timer failsafe and a
throttled scroll sweep; injected markup calls `rescanReveals()`. Opacity is a
static cut and never lives in keyframes. Buttons depress 1px, cards lift 2px
on hover-capable pointers only. Every state change says something: a toast, a
badge, a count, or a sentence.

## Do / Don't

- Do keep the board honest — availability and hours come from the clock, not
  from hand-written labels.
- Do give every tap a visible and a spoken result; the toast is `role="status"`.
- Don't add a second accent, sharp corners, or a hamburger menu — four links
  fit across a phone.
- Don't put an item on the menu without a photograph; the grid's consistency
  is the whole effect, and a missing frame shows instantly.
