# Zan.e — design notes

A one-page site for a live fitness show broadcast from Singapore every Sunday
19:00–20:00 SGT on Douyin. Built mobile-first to go live fast.

## The idea

The show is a *broadcast*, not a blog, so the page is dressed as a gallery: a
condensed cut display face, timecode mono, signal red on near-black, scanlines,
a REC-marked vertical video frame, and the hour laid out as a numbered run
sheet. The one fact the page exists to deliver — **Sunday 19:00–20:00 SGT** —
is the largest non-title element on the screen, and the Douyin CTA is repeated
in the header, hero, schedule card, footer CTA and the persistent mobile bar.

Deliberately avoided: gradient-and-glow supplement styling, transformation
before/afters, follower counts, and any number that goes stale.

## Palette

| Token | Value | Role | Contrast |
|---|---|---|---|
| `--ink` | `#0B0B0C` | page ground | — |
| `--ink-2` | `#131316` | alternating band | — |
| `--ink-3` | `#1A1A1F` | raised panel | — |
| `--bone` | `#F4F2EE` | primary text | 16.6–18.8:1 |
| `--dim` | `#9C9A96` | secondary text | 6.2–7.5:1 |
| `--sig` | `#FF3B30` | signal red | 5.55:1 on ink |

The red button is **ink-on-red** (5.55:1), not bone-on-red (3.17:1, a fail at
body size). It also reads as broadcast signage rather than a banner ad.

Every text token was measured in-page against its actual computed background;
the lowest ratio anywhere on the page is 5.55:1, so all of it clears WCAG AA.

## Type

- **Archivo** variable, carrying a *width* axis (62–125%) as well as weight.
  The display sizes are cut narrow (`font-stretch: 64–84%`, weight 800–900),
  which is what gives the page its sports-broadcast voice.
- **IBM Plex Mono** for timecodes, cue numbers and every machine-ish label.
- Chinese runs in the reader's system CJK face and is tagged `lang="zh-Hans"`;
  Archivo carries no CJK glyphs and none is faked.

## The clock

`js/ui.js` computes one Singapore wall-clock reading (`Asia/Singapore`, no DST)
and drives everything from it:

- the hero status strip — **on air** (with minutes elapsed and time remaining),
  **starting soon** (inside the hour before), or a live countdown;
- the mobile action bar, which mirrors that state;
- the run sheet's `[data-now]` cue highlight and its "On now" flag;
- the next-broadcast date and the next four Sundays, computed as real calendar
  dates so nothing on the page can go stale;
- the run sheet's printed total, summed from the cues' own `data-start` /
  `data-end` so the total and the rows cannot disagree.

`SHOW_DAY` / `SHOW_START` / `SHOW_END` in `ui.js` and the cue `data-*`
attributes in the markup are the two things to change together if the slot
moves. If `Intl` cannot resolve the timezone the page falls back to the static
sentence rather than showing a wrong time.

## Verification

- Overflow swept at 320 / 360 / 375 / 414 / 768 / 900 / 1024 / 1280 / 1440 —
  `scrollWidth - clientWidth === 0` at every width, with `overflow-x: visible`
  on `body` (never masked).
- Marquee checked against all three PATTERNS.md rules: no `column-gap` on the
  track, half the track covers the container at every width, and the animation
  is detached before the duration changes.
- Contrast measured in-page on 30 text roles against their real backgrounds.
- The on-air path was screenshotted and asserted at four fabricated moments
  (19:00:20, 19:24:10, 19:58:30, and 18:40 for "starting soon") by shimming
  `Intl` around the page's own unmodified code.
- Reveals verified in a natural-visibility pass — the harness never adds
  `.is-in`, so a stalled observer would show up rather than be papered over.

## Host configuration

`frame-ancestors` is intentionally **absent** from the meta CSP — it is ignored
in `<meta>` and logs a console error. Set it as a response header instead:

```
Content-Security-Policy: frame-ancestors 'none'
```

## Not wired up

The Instagram link points at a real handle; there is no contact form, no
analytics, no cookies and no storage of any kind on this page.
