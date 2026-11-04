This project inherits ../../../../DESIGN-SYSTEM/DARK.md (relative to templates/bakery-proof-dark inside Tools/Website-Collection; it resolves to the company DARK.md). Below are this project's own tokens and brand-specific rules.

# DESIGN.md — PROOF.

Dark engine. Built 2026-11-04.

## 1. Overview & identity

**PROOF.** is an invented neighbourhood bakery-cafe in Singapore. "Proof" is the rest a dough takes before it is baked; the full stop is the amber dot in the mark and the clock.

**The one idea: the page is one night shift.** Scroll runs a clock from 02:00 to 07:00. Each hour is a chapter with its own real 4K clip (mixing, shaping, rolling and folding, the oven, the first tray out). At 07:00 two dark panels part along a seam, the page turns from night to day, and the menu follows, sorted by bake time rather than by category. Every motion graphic serves that and nothing else: the odometer clock, the flour-dust canvas, the panels.

| Hour | Clock | Section | Footage (Pexels id) |
|---|---|---|---|
| 1 | 02:00-02:59 | Mix | 7405924 (inset 7405921, flour) |
| 2 | 03:00-03:59 | Shape | 7405930 (inset 7405936, baguettes into the pan) |
| 3 | 04:00-04:59 | Roll and fold | 8626678 (inset still: flour-hands) |
| 4 | 05:00-05:59 | Bake | 7405932 (inset still: oven-loaves) |
| 5 | 06:00-06:59 | First tray out | 7405923 (inset 30596349, the first one off the peel) |
| doors | 07:00 | We open at seven | CSS panels and a warm light bloom |
| menu | from 07:00 | Menu; the pastry case band (3119255); coffee band (6769788) | see IMAGE-CREDITS.md |

The brief for this template was one idea, not a stack of effects. The boss approved the storyboard as written and the 04:00 beat as "Roll and fold" (the free libraries have no butter-lamination footage).

## 2. Colors

All contrast ratios computed from the hex values (WCAG relative luminance).

| Token | Hex | Role | Ratio |
|---|---|---|---|
| `--night` | `#120e0a` | page ground, chapters | |
| `--night-2` | `#1c1611` | coffee band, video letterbox | |
| `--flour` | `#f2e8d5` | text and clock on night | 15.8:1 on `--night` |
| `--muted` | `#bdae93` | labels on night | 8.8:1 on `--night` |
| `--amber` | `#ee9f45` | accent on night, colon, focus ring, mark dot | 8.9:1 on `--night` |
| `--ember` | `#e0643a` | the ember motes in the dust only | 5.5:1 on `--night` (not used for text) |
| `--day` | `#f1e6d2` | menu, shop and visit ground | |
| `--day-ink` | `#1b130c` | text on day | 14.8:1 on `--day` |
| `--day-muted` | `#5c4932` | secondary text on day | 6.9:1 on `--day` |
| `--day-accent` | `#a93d17` | eyebrows, bake-time bars, focus ring on day | 5.1:1 on `--day` |

The day half is deliberately a warm cream, not white, so the doors open onto a different light rather than onto a different theme. No purple, no blue-black.

## 3. Typography

- Display, numerals, menu names: **Fraunces** variable (weight axis), one self-hosted woff2.
- Body: **Hanken Grotesk** variable. Not Inter, Roboto, Arial or Space Grotesk.
- Time stamps, labels, prices: **IBM Plex Mono** 400.
- The clock and the doors use Fraunces at weight 820, tracking -0.04em, one reel per digit. Headings are split into characters with SplitType (ISC) and rise in on entry.

## 4. Layout & spacing

- Night: five sticky stages, each 100svh inside a 300vh chapter, so one hour is about three screens of scroll. Copy sits top-left in a 46rem column, the clock bottom-left (`min(15vw, 25vh)`), the second clip or still bottom-right. On phones the copy anchors to the bottom of the stage and the clock sits under the header.
- Day: a 1280px wrap. The menu is a list of lines, not a card grid: time, name and description, price, then a bar spanning the full width that shows when the tray left the oven and how long it stays good (ruler 05:00 to 13:00). Photographs sit on 6 of the 9 lines only, on purpose.
- Gutter `clamp(1.1rem, 4.6vw, 5rem)`. Touch targets 44px.

## 5. Elevation & depth

No shadows on cards, no glass. Depth comes from three things: the dark scrim over each plate (left-weighted, so type always has a quiet ground), the slow 1.00 to 1.07 scale of each plate as the hour runs, and the dust canvas between video and type.

## 6. Components & states

- **Clock**: four reels (hour, minute tens, minute ones; the hour tens is a fixed 0). Digits settle on whole minutes with a 0.6 s ease, blur follows scroll velocity (0 to 7px). Hidden once the panels take over the numeral at the seam.
- **Dust**: 2D canvas, 560 points (200 on phones), curl-like drift, flour-white with ember-orange motes in the 05:00 hour. Density per hour: heavy at 02:00, thin by 05:00, a haze at 06:00, one gust when the doors part, then off. DPR capped at 1.5, drawn only while visible, paused when the tab is hidden. It is points only: no object is depicted.
- **Doors**: two flat panels meeting at a hairline seam, carrying "07:00" split across them. Scrubbed, so they close again on the way back up. They are not a drawing of a door.
- **Menu line**: bar fills from 0 on first view. Focus ring amber on night, brick on day.
- **Motion switch** in the header pauses video and dust and turns off smooth scroll, for anyone, not only those with a system setting.
- **Reduced motion, and no JavaScript**: stacked chapters, each a poster still and a static label; no Lenis, no pinning, no clock, no dust, no autoplay, the doors become a plain banner. The motion script also bails out into this page if it has not started in four seconds.

## 7. Do's and Don'ts

Do: keep the clock the only decoration; keep copy specific (kilograms, degrees, minutes); keep every motion tied to the scroll or to an entrance; load nothing heavy before the page has loaded.
Don't: put a badge above the hero line, add icon-and-card feature grids, centre a stat banner, use the AI violet, or depict an oven or a loaf in code (every object you see is a licensed photograph or footage).

## 8. Where the engine rules were met

- §2 licensing: free libraries only, each licence read per item; full table in IMAGE-CREDITS.md; no generation; no Adobe Stock; no Pixabay. 10 Pexels clips and 17 stills, none reused across chapters (the two posters of a clip are the same frame by design). Third-party maker plates: the oven clip with a readable maker plate (7405933) was dropped on the boss's call.
- §3 accessibility: contrast above; `prefers-reduced-motion` honoured; visible focus; 44px targets; the numerals are `aria-hidden` and one polite live region announces the hour at each chapter.
- §5 stack: Lenis, GSAP + ScrollTrigger, SplitType, native font loading, no bundler. WebGL is not used, so there is no context to lose.
- §4 slop check: no Inter hero, no violet, no badge above the headline, no icon grid, no stat strip; the numbered hours are the real process.

## 9. Open items for the boss

- The 07:00 light plate is a CSS bloom. A real dawn clip (Pexels 40103205, curtains opening to morning light) is licensed-ready but NOT wired in; the boss decides after seeing it. Fallback: the open/closed sign flip (5404704).
- Every business detail is invented: address, phone, email, prices, hours, supplier claims, the crew size. See the hand-off report.

## 10. Critic log (DARK.md section 6: fresh-context critic, screenshots only, two rounds)

- Round 1 (overall 6/10). Largest gap: the five night chapters were one layout repeated with a clip swapped in. Changed: the five hours now differ. Shape and First tray out mirror the copy to the right; Roll and fold and Bake drop the stats row and the thumbnail and set one outlined numeral (27, 250 degrees) at poster scale; the clock moves to the right in the Shape hour. Also: the 07:00 text now appears only after the panels have cleared, the clock no longer has a box behind it, dust alpha lowered, phone copy anchors to the bottom, day-half counter reduced to one large image with a tall companion and an even row, an hours-and-night bar in Visit, a solid header scrim over the cream.
- Round 2 (overall 6.5/10; hero 7, menu 7.5). Largest gap: the day state after the doors was an empty peach blur and its lede was pale on cream. Changed: dark ink, the first three trays of the day set under the headline, shorter hold; the fold and bake footage lifted and re-scrimmed; bake numeral moved above the clock; every menu line now has a tile (photo, or a "best until" tile) and bars carry the 05:00-13:00 grid; inset captions no longer carry clock times; window still cropped to remove another business's lettering; coffee clip warmed; footer carries nav and address; contact lines stacked; left edges aligned to the header gutter.
- Not re-scored after round 2 (two rounds is the limit). Open from round 2: the Shape and First tray out hours still share a recipe with the Mix hour; the day half is calmer than the night half by design; the 07:00 light plate is still the CSS bloom.
