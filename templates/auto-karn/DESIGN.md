---
name: KARN
description: An automotive world — one volcanic proving peninsula, five terrain-apex machines, every performance figure computed from declared engineering
colors:
  ground: "#0a0b0d"
  ground-hi: "#12141a"
  panel: "#16181f"
  white: "#f2f3f5"
  steel: "#9aa3b2"
  signal: "#ff4d00"
  signal-deep: "#c23a00"
  hud: "#7fd4e8"
  line: "rgba(154, 163, 178, 0.18)"
  line-strong: "rgba(154, 163, 178, 0.42)"
typography:
  mega:
    fontFamily: "Anton, Impact, sans-serif"
    fontSize: "clamp(4rem, 16vw, 15rem)"
    fontWeight: 400
    lineHeight: 0.86
    letterSpacing: "0.01em"
  headline:
    fontFamily: "Anton, Impact, sans-serif"
    fontSize: "clamp(2rem, 5.4vw, 4.6rem)"
    fontWeight: 400
    lineHeight: 0.94
    letterSpacing: "0.015em"
  body:
    fontFamily: "Inter Tight, Helvetica Neue, sans-serif"
    fontSize: "clamp(0.98rem, 1.2vw, 1.08rem)"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.005em"
  hud:
    fontFamily: "Share Tech Mono, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0.08em"
rounded:
  none: "0px"
spacing:
  rim: "clamp(14px, 2vw, 30px)"
  block-y: "clamp(70px, 11vh, 150px)"
components:
  button-ignition:
    backgroundColor: "{colors.signal}"
    textColor: "#0a0b0d"
    typography: "{typography.hud}"
    rounded: "{rounded.none}"
    padding: "16px 32px"
    clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)"
  button-ignition-hover:
    backgroundColor: "{colors.white}"
    textColor: "#0a0b0d"
  button-rail:
    backgroundColor: "transparent"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    padding: "16px 26px"
  input-field:
    backgroundColor: "rgba(154, 163, 178, 0.06)"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    padding: "13px 14px"
---

# KARN design system

## Overview

Not a car company website — a closed world reached through a browser. KARN
builds five machines, each the apex predator of one sector of a volcanic
proving peninsula (salt flat, ring circuit, ash dunes, coast road, the
works). The site's structure is the world's: WORLD → SECTOR → MACHINE →
DETAIL, entered through a scroll-scrubbed 4K tunnel drive and navigated by
the peninsula chart itself. Chaotic on the surface — mega type, overlapping
plates, telemetry everywhere — and disciplined underneath: two accents, one
angle, one grid, and every performance figure computed at runtime from
declared engineering (mass, power, drag, battery) through one physics
model. KARN publishes arithmetic, not adjectives.

## Color

Graphite ground (`ground` → `panel` for raised HUD surfaces). Two accents
with hard roles: **signal** (orange-red) is KARN — action, live states,
the marque's own hardware, kerb paint; **hud** (steel cyan) is telemetry —
measurements, coordinates, conditions, never action. White speaks; steel
annotates. Nothing else may be chromatic; the vehicles' environments supply
all other colour. Shine comes from the photography (wet asphalt, salt
glare, studio sweeps), never from CSS glow.

## Typography

Three voices. **Anton** is the shout — machine names, sector names, mega
numerals that overlap the cars; always uppercase, tight leading, may clip
behind imagery but never loses its first and last letters. **Inter Tight**
is the brief — body copy, engineering prose. **Share Tech Mono** is the
telemetry — every number, code, coordinate, label, button; uppercase at
0.08em. Model codes are sacred: T1 MONOLIT · R2 SERRA · K4 BREKKA ·
G3 NOKT · E0 VARDE.

## Layout & structure

Everything sits on an 8°-cut livery grammar: panels, buttons and image
plates carry one clipped corner (8px–24px 8° cuts, never rounded), the
same angle everywhere. A fixed HUD rim frames the viewport (corner ticks,
sector code top-left, live conditions top-right, scroll-velocity readout
bottom-right — reading km/h from scroll speed). Pages: index (the world:
scrubbed tunnel entry, peninsula chart, fleet index), five machine pages
(each in its own environment mood), crossing.html (book the peninsula
day + enquiry + garage compare). 7 pages.

## Motion

Choreographed chaos, three tiers. Tier 1 — the signature: the index opens
on a scroll-scrubbed native-4K tunnel drive (video.currentTime driven by
scroll with easing), HUD counting distance-to-surface; reduced-motion gets
a still with the same copy. Tier 2 — physical UI: scroll velocity feeds a
skew/blur on the fleet strip and the km/h readout; vehicle heroes parallax
against their type layers on pointer; the light-sweep slider drags a
specular band across the paint. Tier 3 — reveals: hard cuts, not fades —
elements snap in with a 1-frame signal-colored ghost (120ms), stagger ≤80ms.
Easing `cubic-bezier(0.2, 0.9, 0.25, 1)`. Every interactive element
acknowledges hover within 100ms. `prefers-reduced-motion`: no scrub (poster
+ static chapters), no skew, no parallax, reveals become opacity steps.

## Components

- **`.btn-ign`** — signal block with 8° end cuts, hud caps; hover snaps to
  white with a 1-frame ghost. **`.btn-rail`** — hairline with corner tick
  that extends on hover. Focus: 2px signal outline, 3px offset.
- **The chart** — SVG peninsula, five sectors with live conditions
  (seeded daily model: wind, surface temp, status), routes light on hover,
  click enters the machine.
- **Machine plates** — full-viewport imagery with mega type behind/over;
  spec HUD panels dock around the car (clipped corners, telemetry voice).
- **The sweep** — a draggable light bar over paint details; position drives
  a specular gradient overlay. Touch: drag anywhere on the plate.
- **Spec bars** — computed values animate against fleet maxima on compare.
- **The garage** — save machines (localStorage `karn.garage.v1`), compare
  any two side-by-side on crossing.html with animated deltas.
- **Forms** — panel fields, hud labels; errors in signal naming the fix;
  success = a stamped manifest line `KRN-YYYY-NNN`, no toasts.

## The engineering model

`KN.perf` owns all performance math from declared primitives (mass kg,
power kW, torque Nm, CdA m², drivetrain, battery kWh, tyre class):
0–100 from power-to-weight with launch traction cap; top speed from
v = (2P·η / ρ·CdA)^⅓ (or gearing-limited where declared); range from
battery × efficiency; power-to-weight, downforce-at-speed where wings are
declared. Printed figures are always model output — a typed number is a
lie waiting to drift.

## Do / Don't

- Do let mega type and machines overlap; do keep the first/last letters
  of any clipped word visible; hierarchy survives every collision.
- Do keep the two accents in role (signal = action/KARN, hud = telemetry).
- Don't use rounded corners, glassmorphism, gradient blobs, or fades-up;
  the 8° cut and the hard snap are the only transitions.
- Don't ship any full-bleed video below native 3840×2160; the scrub tier
  may drop to 2560 only under `prefers-reduced-data`.
- Don't let a vehicle image ship un-audited: no lettering, no malformed
  wheels, no borrowed production-car identity.
