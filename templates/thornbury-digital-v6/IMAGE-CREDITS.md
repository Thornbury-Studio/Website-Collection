# THORNBURY DIGITAL v6 — asset credits

Everything is self-hosted; the template CSP is `default-src 'self'` with
`media-src 'self'` and `img-src 'self' data:`. Provenance lives here and
nowhere on the pages.

## The film

The hero, and the only spectacle on the site: a short edit of the desert cut
the way a travel film is cut — a throw of angles and subjects, not one place
seen closer and closer — and built to loop. Ten beats in 18.6 seconds. Sourced,
not generated, which is where `VIDEO-POLICY.md`'s asset order stops. Pexels
License: free to use, no attribution required; credited here anyway.
Downloaded 6 Sep 2026. Masters under `video/src/` (gitignored).

| Beat | Shot | Source | Pexels ID | Master | Used |
|---|---|---|---|---|---|
| 1 | ripples, macro | [Close-up shot of sand ripples](https://www.pexels.com/video/close-up-shot-of-sand-ripples-8865227/) | 8865227 | 4096×2160 | 0–2.6 s |
| 2 | dunes from straight above | [Aerial view of sand dunes in the desert](https://www.pexels.com/video/aerial-view-of-sand-dunes-in-the-desert-17510703/) | 17510703 | 3840×2160 | 3–5.4 s |
| 3 | a low fast flight over a crest | [Sand dune FPV](https://www.pexels.com/video/sand-dune-fpv-20081119/) | 20081119 | 1920×1080 | 4–6.6 s |
| 4 | a hand letting sand run | [Person holding brown sand](https://www.pexels.com/video/person-holding-brown-sand-6877510/) | 6877510 | 1920×1080 | 3–5.4 s |
| 5 | a camel caravan and its shadows, from above | [Drone footage of a walking camel in the desert](https://www.pexels.com/video/drone-footage-of-a-walking-camel-in-the-desert-4797157/) | 4797157 | 3840×2160 | 10–12.8 s |
| 6 | the camel's eye | [Camel, close](https://www.pexels.com/video/27949199/) | 27949199 | 3840×2160 | 1–3.8 s |
| 7 | a beetle digging | [Beetle digging in sand in desert](https://www.pexels.com/video/beetle-digging-in-sand-in-desert-9870360/) | 9870360 | 1920×1080 | 5–7.4 s |
| 8 | a lone figure and a long shadow, from above | [A person walking on the desert](https://www.pexels.com/video/a-person-walking-on-the-desert-6573929/) | 6573929 | 1920×1080 | 3–5.4 s |
| 9 | the crest | [Ripples in desert sand](https://www.pexels.com/video/ripples-in-desert-sand-8865223/) | 8865223 | 4096×2160 | 2–4.2 s, cropped to lose most of the sky |
| 10 | beat 1 played backward | as beat 1 | 8865227 | — | 1.4 s, ending on the file's first frame |

Every join is a 0.6 s crossfade (`xfade=fade`), and the file ends on the
opening beat played backward to its own first frame, so the loop closes on a
bounce a slow drift cannot show. One grade on all ten (`eq=contrast=1.05:
saturation=.9:brightness=-.012` plus a small warm colour balance; the pale
aerials and the crest get a touch more warmth). Every beat stays mid-to-light
in tone so the ink wordmark reads on all of them, and none contains a face.
Four sources are HD, which is native for the 1080p output. Landscape:
1920×1080, 464 frames, 18.6 s, H.264 CRF 26 with a 2300k cap, 4.5 MB.
Portrait (`hero-m.mp4`): each beat re-cropped 9:16 around its subject — the
hand at x 420 of 1920, the eye at x 1112 of 3840 — 900×1600 so the HD beats
are barely upscaled, CRF 27 with a 1500k cap, 3.0 MB. Posters are each file's
own first frame, so the swap from still to film is invisible. The caravan and
beetle passages were checked at 1:1 against the graded source.

Pulled and rejected at full size: 8865816 (long ripples, one more sand
beat), 4996615 (sand blowing, grey with footprints), 33665977 (dunes at
sunset, pink under any grade), 4747122 (a millipede on grey grit), 7321219 (a
bridled camel with tourists behind it), 16381940 (a dune crest whose shadow
side runs blue). Forty-five more were read off SD contact sheets and not
downloaded, among them every sunset silhouette, which would have put the
wordmark on a dark ground.

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
