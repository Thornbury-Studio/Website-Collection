---
name: NEAP
description: A fourteen-seat tasting counter whose menu is written by the moon
colors:
  paper: "#f3f0e9"
  paper-2: "#ece8df"
  ink: "#1d211f"
  ink-2: "#565d59"
  tide: "#274850"
  tide-soft: "rgba(39, 72, 80, 0.12)"
  hairline: "rgba(29, 33, 31, 0.16)"
  paper-on-ink: "#efece4"
  paper-dim-on-ink: "#b3b1a7"
  error: "#8a3230"
typography:
  hero:
    fontFamily: "Cormorant Garamond, Times New Roman, serif"
    fontSize: "clamp(3.4rem, 12vw, 9.5rem)"
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: "clamp(0.18em, 3vw, 0.34em)"
  section:
    fontFamily: "Cormorant Garamond, Times New Roman, serif"
    fontSize: "clamp(1.9rem, 4.2vw, 3.1rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "0.02em"
  course:
    fontFamily: "Cormorant Garamond, Times New Roman, serif"
    fontSize: "clamp(1.3rem, 2.4vw, 1.75rem)"
    fontWeight: 400
    lineHeight: 1.3
  prose:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(1.02rem, 0.95rem + 0.3vw, 1.15rem)"
    fontWeight: 400
    lineHeight: 1.72
  marks:
    fontFamily: "IBM Plex Mono, Cascadia Mono, monospace"
    fontSize: "0.78rem"
    fontWeight: 500
    letterSpacing: "0.22em"
rounded:
  none: "0px"
spacing:
  gut: "clamp(20px, 4.5vw, 64px)"
  section-y: "clamp(64px, 11vh, 140px)"
components:
  button:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-on-ink}"
    rounded: "{rounded.none}"
    padding: "15px 30px"
  button-hover:
    backgroundColor: "{colors.tide}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "15px 30px"
  input-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "12px 13px"
---

# NEAP design system

## Overview

A fourteen-seat fine-dining tasting counter named for the lesser tide.
The organizing conceit is **real lunar arithmetic** (`js/tide.js`): the
moon's age decides whether spring or neap tides are running, which
decides whether the Flood menu (nine courses) or the Still menu (seven)
is served tonight. Every number the copy quotes — course counts,
prices, release dates, the 28-night tide clock — is computed from
`js/menus.js` and the date, never typed. Dishes are typography only:
one photograph of nothing on a plate, anywhere.

## Color

Warm paper ground with near-black ink; deep-water teal (`tide`) is the
single accent — kickers, moon glyphs, focus rings, the served-tonight
tag, button hover. Photography is licensed stock graded through one
matte, cool, lifted-black pass so blues, greys and coral read as one
hand. Dark bands (film, CTA, footer) flip to ink with warm paper text.

## Typography

Cormorant Garamond carries the ceremony: the tracked hero wordmark,
section heads, menu names (letterspaced caps), and course lines.
Newsreader is the reading voice for prose and rules. IBM Plex Mono
appears only where the house wrote a figure — kickers, dates, prices,
request codes, the tide clock.

## The moon

`tide.js` computes age, phase, illumination and tide regime from the
mean synodic month; `moonMarkup()` draws the disc as two SVG arcs
(terminator ellipse against the limb). Glyphs paint synchronously at
boot in the header, tonight panel and footer. The menu page renders a
28-night calendar with a moon per night, spring nights tinted, new/full
marked N/F, and a computed summary line. On 13 Aug 2026 the site
correctly showed the new moon of the previous evening's eclipse.

## Layout & structure

Full-bleed 4K hero photograph (the only hero image; text set over a
scrim), then a 1280px wrap. Menus are a centered 660px column — course,
dot, course — with the tonight card framed in a hairline and tagged.
Reservations is a two-column grid: numbered house rules beside the
request form. The film band (the site's only video, muted loop) is
full-bleed with a caption low-left.

## Motion

Reveals rise 22px on an expo-out curve, IO-gated with a hard-timer
failsafe plus a throttled scroll/resize/hashchange sweep; injected menu
markup calls `rescanReveals()`. Opacity is never animated in keyframes.
Nav links underline-draw; buttons shift ground and depress 1px.
`prefers-reduced-motion` stops everything.

## Interaction feedback

The form validates in the house's voice ("That night has already gone
out with the tide"), holds the request in `neap.request.v1` with a
computed code, and tells the guest which menu the moon has planned for
their chosen night. A returning visitor finds the request still held;
"let the request go" releases it.

## Do / Don't

- Do let the moon do the talking — any new fact about tonight must be
  computed from `tide.js`, not written.
- Do keep dish photography off the menu; ingredients may be
  photographed as provenance, dishes never.
- Don't add a second accent color, rounded corners, drop shadows, or a
  hamburger — the nav is four words and can wrap.
- Don't brighten the grade; the set is matte and cool on purpose, and a
  new frame must pass through the identical pass in IMAGE-CREDITS.md.
