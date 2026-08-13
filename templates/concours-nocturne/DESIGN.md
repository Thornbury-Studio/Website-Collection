---
name: NOCTURNE
description: An invitational concours held after dark — the gallery is the judging field
colors:
  lacquer: "#0b0907"
  lacquer-2: "#120e0a"
  coal: "#1a1510"
  ivory: "#ece5d6"
  ivory-dim: "#a2977f"
  gold: "#c9a35c"
  gold-deep: "#8f6f35"
  gold-line: "rgba(201, 163, 92, 0.28)"
  hairline: "rgba(236, 229, 214, 0.10)"
  claret: "#a4353f"
typography:
  engraved:
    fontFamily: "Cinzel, Times New Roman, serif"
    fontSize: "clamp(2.7rem, 8.6vw, 7.2rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "clamp(0.14em, 2vw, 0.26em)"
  section:
    fontFamily: "Cinzel, Times New Roman, serif"
    fontSize: "clamp(1.5rem, 3.2vw, 2.5rem)"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.14em"
  catalogue:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(1.05rem, 1.45vw, 1.2rem)"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "0"
  marks:
    fontFamily: "Sometype Mono, Cascadia Mono, monospace"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
rounded:
  none: "0px"
spacing:
  gut: "clamp(20px, 4.5vw, 64px)"
  section-y: "clamp(60px, 10vh, 130px)"
components:
  button:
    backgroundColor: "{colors.ivory}"
    textColor: "#171106"
    rounded: "{rounded.none}"
    padding: "15px 30px"
  button-hover:
    backgroundColor: "{colors.gold}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ivory}"
    rounded: "{rounded.none}"
    padding: "14px 24px"
  input-field:
    backgroundColor: "rgba(236, 229, 214, 0.04)"
    textColor: "{colors.ivory}"
    rounded: "{rounded.none}"
    padding: "13px 14px"
---

# NOCTURNE design system

## Overview

An invitational concours judged entirely after dark. The car gallery is the
**judging field**: each automobile is an entry with a number, a class, a
judging card (coachwork /30 · interior /25 · presence after dark /25 ·
provenance /20), judges' margin notes, and a citation. The rosette is the
save mechanic; classes are the filters; one entry each season arrives
sealed. All content derives from `js/entries.js` — one object per entry,
read by every page.

## Color

Black lacquer ground (warm, never blue-black) with ivory catalogue text.
**Gold is the coachbuilder's leaf, never a surface**: the drawn coach line
under the hero title, entry number plates, the gilt rosette, hairline rules
at 0.28 alpha, focus rings, and button hover. Claret appears only in error
text and the unpin hover. Photography carries all remaining color — real
night light, graded to one warm-black (see IMAGE-CREDITS.md).

## Typography

Cinzel (400) is the engraver: wordmark, entry numbers, section titles,
entry names — always letterspaced caps, never bolded for emphasis. Source
Serif 4 is the catalogue voice: prose, plates, controls, labels, italic
citations. Sometype Mono appears **only where a judge wrote a number** —
card marks, totals, programme times, request codes.

## The lamp

The signature mechanic: plates rest in dusk (a radial shade at ~0.42 edge
opacity) and the pointer carries a lamp — a warm gold glow plus an opening
in the shade, driven by `--lx/--ly` custom properties set on pointermove
(`NOC.bindLamp`). Keyboard focus lifts the shade; touch devices rest
lighter and skip the mechanic. Never let the resting shade hide the
photography — dusk, not blackout.

## Layout & structure

Full-bleed hero film (the only video on the site), then a 1420px wrap. The
field is an uneven 12-column walk (spans 7/5, 4/4/4, 6/6, 4/4/4) — never a
uniform card grid. Entry pages: full-bleed stage, engraved head with the
number plate, judging card beside citation + notes, detail figures, and a
prev/next walk (arrow keys work). The rosette tray is a right-hand drawer
shared by all pages.

## Motion

Cross-document view transitions (`@view-transition`) morph an entry's plate
from field to stage via per-entry `view-transition-name`. The gold coach
line draws itself once at hero load. Judging bars fill and marks count up
when the card enters view. Reveals rise 24px on
`cubic-bezier(0.16, 1, 0.3, 1)`. The rosette stamps (scale overshoot) when
pinned. Everything else is still; `prefers-reduced-motion` stops all of it.

## Interaction feedback

Every control acknowledges: nav links underline-draw, buttons shift ground
on hover and depress 1px on press, chips press-scale, plates lamp and lift
their tags, pins stamp, the tray slides with a scrim and returns focus on
close, form errors speak in the house's voice under the field, and the
granted request persists (`nocturne.invitation.v1`) so a returning visitor
finds it held. Rosettes persist in `nocturne.rosettes.v1`.

## Do / Don't

- Do keep gold at hairline scale; if a surface turns gold, it's wrong.
- Do describe cars by coachwork, era and character — the catalogue never
  invents marque claims the photograph doesn't show.
- Don't add a second video, rounded corners, drop shadows, or a toast; the
  world confirms inline, on paper.
- Don't brighten the field to daylight — dusk at rest, lamplight on
  approach, and the photography always legible.
