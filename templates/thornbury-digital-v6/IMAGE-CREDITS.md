# THORNBURY DIGITAL v6 — asset credits

Everything is self-hosted; the template CSP is `default-src 'self'` with
`media-src 'self'` and `img-src 'self' data:`. Provenance lives here and
nowhere on the pages.

## The film

The hero, and the only spectacle on the site: a short edit of the desert cut
the way a travel film is cut — a throw of angles and subjects, not one place
seen closer and closer — and built to loop. Nine beats in 16 seconds. Sourced,
not generated, which is where `VIDEO-POLICY.md`'s asset order stops. Pexels
License: free to use, no attribution required; credited here anyway.
Downloaded 6–7 Sep 2026. Masters under `video/src/` (gitignored).

Every source is a true 4K master except the beetle, and that exception is
deliberate: for a 1080p encode an HD source is native resolution, and the
beetle measures sharper (Sobel 27) than half the 4K clips. Every beat was
sharpness-measured (Sobel mean on the contributed frame) before it was kept,
and the whole film gets a contrast-adaptive sharpen (`cas=0.6`) after scaling.

| Beat | Shot | Source | Pexels ID | Master | Sobel | Used |
|---|---|---|---|---|---|---|
| 1 | ripples, macro | [Close-up shot of sand ripples](https://www.pexels.com/video/close-up-shot-of-sand-ripples-8865227/) | 8865227 | 4096×2160 | 16 | 0–2.6 s |
| 2 | dunes from straight above | [Aerial view of serene desert sand dunes](https://www.pexels.com/video/aerial-view-of-serene-desert-sand-dunes-34922483/) | 34922483 | 3840×2160 | 21 | 1.5–3.9 s |
| 3 | a hand letting sand fall | [Sand falling from hands](https://www.pexels.com/video/sand-falling-from-hands-7624037/) | 7624037 | 2160×3840 | macro | 1.5–3.9 s, landscape crop |
| 4 | a camel caravan and its shadows, from above | [Drone footage of a walking camel in the desert](https://www.pexels.com/video/drone-footage-of-a-walking-camel-in-the-desert-4797157/) | 4797157 | 3840×2160 | 74 | 10–12.4 s |
| 5 | the camel's eye | [Camel, close](https://www.pexels.com/video/27949199/) | 27949199 | 3840×2160 | 38 | 1–3.4 s |
| 6 | a beetle digging | [Beetle digging in sand in desert](https://www.pexels.com/video/beetle-digging-in-sand-in-desert-9870360/) | 9870360 | 1920×1080 | 27 | 5–7.4 s |
| 7 | a lone figure among footprint trails | [Drone shot of solitary figure in Namib desert](https://www.pexels.com/video/drone-shot-of-solitary-figure-in-namib-desert-34162348/) | 34162348 | 3840×2160 | 28 | 2.5–4.9 s, horizon cropped out |
| 8 | the crest | [Ripples in desert sand](https://www.pexels.com/video/ripples-in-desert-sand-8865223/) | 8865223 | 4096×2160 | 18 | 2–4.4 s |
| 9 | beat 1 played backward | as beat 1 | 8865227 | — | — | 1.4 s, ending on the file's first frame |

Every join is a 0.6 s crossfade (`xfade=fade`), and the file ends on the
opening beat played backward to its own first frame, so the loop closes on a
bounce. One grade on all nine (`eq=contrast=1.05:saturation=.9:
brightness=-.012` plus a small warm colour balance; the pale aerials, the
caravan, the figure and the crest get a touch more warmth), then `cas=0.6`.
The figure beat is cropped above the frame's top eighth because the Namib
master shows a teal ocean horizon there, and teal is banned from this
palette. Landscape: 1920×1080, 399 frames, 16.0 s, H.264 CRF 25 with a 2500k
cap, 4.5 MB. Portrait (`hero-m.mp4`): each beat re-cropped 9:16 around its
subject — the eye at x 1112, the figure at x 1246 — 900×1600, CRF 26 with a
1500k cap, 2.6 MB; the hand clip is portrait-native there. Posters are each
file's own first frame, so the swap from still to film is invisible. The
caravan, beetle and figure passages were checked at 1:1 against the graded
source.

Replaced in the sharpness round (7 Sep 2026), after each was measured on the
frame it contributed: 17510703 (top-down aerial, Sobel 13 — the boss called
it, and the meter agreed), 20081119 (FPV crest, HD and 13), 6877510 (bokeh
hand, 4.5), 6573929 (HD figure, 21, beaten by the Namib clip). Downloaded at
4K and rejected: 35296751 and 28916864 (both soft, 8 and 5, with blue sky),
20758850 (Sobel 52 but dark water in frame). Also previously rejected:
8865816, 4996615, 33665977, 4747122, 7321219, 16381940, and every sunset
silhouette, which would have put the wordmark on a dark ground.

The `<picture>` is what paints; `js/hero.js` attaches the film in
`requestIdleCallback` and crosses it in only on the `playing` event. Reduced
motion never fetches a byte.

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

## The collection wall

`img/wall/<slug>.webp` — one fresh 1200×750 capture of every public template
on the hub (64 of them; the password-gated client previews are excluded on
purpose and their captures deleted), taken 6 Sep 2026 at 1440×900 through
headless Chrome and encoded as WebP at quality 78, 3.0 MB in all, every one
lazy-loaded. `tools/collection.json` is the manifest read from the hub's cards
(title, tag, category, description) and `tools/build-collection.mjs`
regenerates the wall and the home mosaic from it. Two captures show a
template's own entrance gate rather than its home (`exhibition-ephemeris`,
`exhibition-parallax`), because those sites open on one by design; the
`offline-outage` frame is its real hero.

## Social image and hub card

`img/og.webp` (1200×630) and the hub's `img/thornbury-digital-v6-sm.webp`
(480×300) are captures of this template's own home page.

## Icons and texture

`img/icons.svg` is a sprite of twenty hairline icons drawn for this site
(measure, draw, fast, keys, camera, words, cart, language, calendar, open,
up, mail, pin, clock, sector, built, made, check, no, filter), 1.5 px
strokes on a 24-unit grid, referenced with `<use>`. The plaster mottle under
the grain is an SVG turbulence filter, not a photograph: seamless, 0 bytes.

## Type

Big Shoulders (Patric King, Open Font License) and Newsreader (Production
Type, Open Font License), both served from Google Fonts.

## Retired

The first two rounds of this template lit the page with a computed sun through
a screen of ventilation blocks (two WebGL canvases, no assets) and carried one
Pexels photograph of such a screen (38865958). Both were removed on 6 Sep
2026 when the light was judged to read as a fault rather than a design; the
photograph is no longer in the tree.
