# THORNBURY DIGITAL v6 — asset credits

Everything is self-hosted; the template CSP is `default-src 'self'` with
`img-src 'self' data:`. Provenance lives here and nowhere on the pages.

## The light

There is no hero footage. The light on every page is computed: `js/sun.js`
gives the sun's altitude and azimuth over 01°17′N 103°51′E for the current
minute (NOAA equations, no dependencies) and `js/light.js` draws it through a
screen of ventilation blocks on two WebGL canvases. Nothing was generated and
no credits were spent. `VIDEO-POLICY.md`'s asset order was walked and stopped
at tier 2: licensed photography exists for the one place a picture earns its
place, and the motion is web-native, so no video was needed.

Searched and rejected before that decision (Adobe Stock free tier, 6 Sep
2026): 77 results for sunlight and shadow on walls, mostly leaf shadows,
one CG "empty concrete wall", one time-lapse of an English building. Nothing
was a Singapore room, and a time-lapse can only show one day's light at one
speed; the computed sun shows this minute's.

## The room

One photograph, used on the home page and the studio page as the physical
source of the site's light language. Pexels License: free to use, no
attribution required; credited here anyway. Downloaded 6 Sep 2026.

| File | Source | Pexels ID | Master |
|---|---|---|---|
| `img/room.webp` | [Intricate geometric pattern on concrete wall](https://www.pexels.com/photo/intricate-geometric-pattern-on-concrete-wall-38865958/) | 38865958 | 4665×4023 JPEG |
| `img/room-m.webp` | Same photograph, portrait crop for phones | 38865958 | — |

Grade: cropped to 3:2 (`crop=4665:3110:0:600`), scaled to 2400 wide,
`eq=contrast=1.04:saturation=0.82:gamma=1.02` and a small colour balance
toward the limewash (`colorbalance=rs=.02:gs=.005:bs=-.03:rm=.015:bm=-.02`)
so the whites of the blocks sit in the page's own palette. WebP quality 84
(189 kB) and, for the 900×1200 portrait crop, quality 82 (56 kB).

Also downloaded at full size and not used: Pexels 39060508 (cooler, whiter
blocks on a grey wall) and 38838381 (star-shaped cutouts, Tokyo). The
warmer wall won because it is already the colour of the page.

## Work plates

Each case plate is a capture of that case's own site, taken from this
collection on 6 Sep 2026 at 1600×1000 through headless Chrome, encoded as
WebP at quality 82.

| File | Case | Captured from |
|---|---|---|
| `img/case-midwater.webp` | Midwater | `templates/film-midwater/` |
| `img/case-kiyo.webp` | Kiyo 清 | `templates/japanese-restaurant/` |
| `img/case-aurel.webp` | Aurel | `templates/watch-atelier/` |
| `img/case-loam.webp` | Loam | `templates/cafe-loam/` |
| `img/case-form01.webp` | Form/01 | `templates/streetwear-form01/` |

## Social image and hub card

`img/og.webp` (1200×630) and the hub's `img/thornbury-digital-v6-sm.webp`
(480×300) are captures of this template's own home page at 17:05 SGT.

## Type

Big Shoulders (Patric King, Open Font License) and Newsreader (Production
Type, Open Font License), both served from Google Fonts.
