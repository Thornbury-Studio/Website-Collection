# THORNBURY DIGITAL v6 — asset credits

Everything is self-hosted; the template CSP is `default-src 'self'` with
`media-src 'self'` and `img-src 'self' data:`. Provenance lives here and
nowhere on the pages.

## The film

The hero, and the only spectacle on the site. Sourced, not generated, which is
where `VIDEO-POLICY.md`'s asset order stops: excellent licensed footage exists
and it is the palette in nature — sand, shadow and sun. Pexels License: free
to use, no attribution required; credited here anyway. Downloaded 6 Sep 2026.

| File | Source | Pexels ID | Master |
|---|---|---|---|
| `video/hero.mp4` | [Close-up shot of sand ripples](https://www.pexels.com/video/close-up-shot-of-sand-ripples-8865227/) | 8865227 | 4096×2160, 25 fps, 11.96 s |
| `video/hero-m.mp4` | Same clip, portrait crop for phones | 8865227 | — |
| `img/poster-hero.webp` | The frame at 3 s, 1920×1080 | 8865227 | — |
| `img/poster-hero-m.webp` | The frame at 3 s, 1080×1920 | 8865227 | — |

The master is kept under `video/src/` (gitignored by this directory's own
`.gitignore`). Eighteen candidates were pulled as SD previews and read off one
contact sheet; three were downloaded at full size. The dune-crest clip
(16381940) was rejected because its shadow side runs blue-grey, and the long
parallel ripples (8865816) because the corduroy read colder; the soft ripple
field won on warmth and stillness.

**Both encodes play forward then backward**, so the loop never cuts: the
strongest 8.5 s (6.5 s for the phone) is split, one copy reversed with its
duplicate frame trimmed, and the two concatenated in one ffmpeg pass. Grade:
a 16:9 centre crop of the 4096-wide master, `eq=contrast=1.05:saturation=.9:
brightness=-.012` and a small warm colour balance so the sand sits with the
limewash. Landscape: 1920×1080, H.264 CRF 25 with a 2600k cap, 426 frames,
17.0 s, 4.27 MB. Portrait: `crop=1215:2160:1440:0`, 1080×1920, CRF 26 with a
1600k cap, 326 frames, 13.0 s, 2.13 MB. Both were checked at 1:1 against the
same crop of the graded source before shipping; no macroblocking on the grain
of the sand.

The `<picture>` is what paints; `js/hero.js` attaches the film in
`requestIdleCallback` and crosses it in only on the `playing` event, so a
refused autoplay or a slow connection leaves a finished still. Reduced motion
never fetches a byte.

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

## Type

Big Shoulders (Patric King, Open Font License) and Newsreader (Production
Type, Open Font License), both served from Google Fonts.

## Retired

The first two rounds of this template lit the page with a computed sun through
a screen of ventilation blocks (two WebGL canvases, no assets) and carried one
Pexels photograph of such a screen (38865958). Both were removed on 6 Sep
2026 when the light was judged to read as a fault rather than a design; the
photograph is no longer in the tree.
