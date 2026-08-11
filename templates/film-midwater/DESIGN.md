---
name: MIDWATER
description: A documentary film site rendered as the survey record of one descent
colors:
  abyss-hi: "#071120"
  abyss-lo: "#010306"
  ink: "#e9f2f2"
  ink-dim: "#9fb4b6"
  cyan: "#8fd0cc"
  cyan-dim: "rgba(143, 208, 204, 0.55)"
  line: "rgba(143, 208, 204, 0.16)"
  line-strong: "rgba(143, 208, 204, 0.34)"
  amber: "#e0a33e"
  amber-deep: "#b97f24"
typography:
  title:
    fontFamily: "Spectral, Georgia, serif"
    fontSize: "clamp(2.5rem, 10.4vw, 9.5rem)"
    fontWeight: 200
    lineHeight: 1.04
    letterSpacing: "clamp(0.12em, 2.4vw, 0.34em)"
  station-name:
    fontFamily: "Spectral, Georgia, serif"
    fontSize: "clamp(2.2rem, 5.4vw, 4.6rem)"
    fontWeight: 200
    lineHeight: 1.06
    letterSpacing: "0.06em"
  narration:
    fontFamily: "Spectral, Georgia, serif"
    fontSize: "clamp(1rem, 1.5vw, 1.22rem)"
    fontWeight: 300
    lineHeight: 1.6
    letterSpacing: "normal"
  prose:
    fontFamily: "Spectral, Georgia, serif"
    fontSize: "clamp(1.05rem, 1.5vw, 1.25rem)"
    fontWeight: 300
    lineHeight: 1.75
    letterSpacing: "normal"
  instrument:
    fontFamily: "Martian Mono, Cascadia Mono, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.08em"
rounded:
  none: "0px"
  pill: "999px"
spacing:
  hud-pad: "clamp(14px, 2.2vw, 30px)"
  caption-x: "clamp(20px, 7vw, 110px)"
  section-y: "clamp(50px, 8vh, 90px)"
components:
  button-signal:
    backgroundColor: "{colors.amber}"
    textColor: "#140d02"
    typography: "{typography.instrument}"
    rounded: "{rounded.none}"
    padding: "13px 26px"
  button-signal-hover:
    backgroundColor: "transparent"
    textColor: "{colors.amber}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.none}"
    padding: "13px 20px"
  input-field:
    backgroundColor: "rgba(143, 208, 204, 0.04)"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "11px 12px"
---

# MIDWATER design system

## Overview

The site for a feature documentary about the ocean's water column, built as the
**survey record of one descent**: research-vessel instrument grammar (echo-sounder
strip chart, depth/pressure/light/temperature readouts, station numbering, mono
data labels) frames full-bleed 4K cinema footage. Two voices only: Spectral
extralight carries the film; Martian Mono carries the instruments. Depth is the
governing variable — background, audio filtering, particle density, and every
readout derive from the scroll-mapped depth in metres, computed from real physics
(pressure = 1 + d/10 atm, light = e^(−0.046d), a thermocline temperature curve).

## Color

Drenched dark: the page **is** the water, deepening from `abyss-hi` at the
surface to `abyss-lo` at 640 m via two fixed crossfaded layers. Phosphor-cyan
(`cyan`, with `line`/`line-strong` hairlines at 1px) belongs to the sea and its
instruments. Amber belongs to the human layer only: the vessel marker, station
ids, the active nav state, every call to action, every error. Never swap those
roles. Text on video always sits over a scrim or carries a soft dark text-shadow.

## Typography

Spectral (200/300 + italic) is the cinema voice — title, station names,
narration in italic, prose, and inline confirmations (`.noted`, italic).
Martian Mono (300–500) is the instrument voice — every number, label, date,
button, and error, uppercase with 0.08–0.34em tracking. A word set in mono is a
measurement or a control; a word set in Spectral is the film speaking.

## Layout & structure

A fixed HUD frame (corner ticks, timecode top-left, depth bottom-left, strip
chart on the right edge ≥1100px) surrounds a vertical descent: hero, six
`.station` sections (each 172svh with a 100svh sticky `.frame`), credits,
footer. Captions anchor lower-left inside the frame; instrument margin notes
anchor lower-right. Subpages (`.page-sub`) keep the topbar and palette but drop
the water layers, snow, and sounder.

## Motion

One authored signature: **the descent itself** — letterbox bars (`clip-path
inset 19% → 0`) open as each station's frame takes the viewport, while depth,
water color, marine snow, the strip-chart marker, and the audio lowpass move on
the same scroll-derived value in a single rAF loop. Reveals use
`cubic-bezier(0.16, 1, 0.3, 1)` at 0.9s with ≤0.26s stagger. The topbar
submerges on scroll-down, surfaces on scroll-up. `prefers-reduced-motion`
removes autoplay, WebGL, particles, letterboxing, and reveal transitions.

## Components

- **`.btn-signal`** — amber block, mono caps; inverts to outline on hover.
- **`.btn-quiet` / `.btn-dive` / `.btn-row`** — 1px hairline outlines, mono caps.
- **Forms** — square fields on faint cyan wash; errors are amber mono lines
  under the field naming problem and recovery; confirmations settle inline as
  italic `.noted` lines with a mono manifest code — never a toast or modal.
- **`.seats` stepper** — bordered − / count / +, disabled ends.
- **`.plate`** — stills with hover captions (mono, plate-numbered).
- **Icons** are drawn inline SVG at ~1.2px stroke (sound speaker, dive ring,
  descent arrow, laurels). No icon fonts, no Unicode glyphs.

## Sound

Web Audio, opt-in, persisted (`midwater.sound.v1`): surface-waves and deep
loops crossfade by depth through one lowpass (9 kHz → 240 Hz); station
crossings and confirmations fire a synthesized sonar ping. No sound before a
user gesture, ever.

## Do / Don't

- Do derive any new data readout from the depth model; invented numbers break
  the instrument's authority.
- Do keep video `muted playsinline loop`, lazy-loaded via IO, paused offscreen.
- Don't add a second accent, rounded corners, toasts, or drop shadows on
  buttons; depth comes from water color and scrims, not elevation.
- Don't let amber describe the sea or cyan describe an action.
