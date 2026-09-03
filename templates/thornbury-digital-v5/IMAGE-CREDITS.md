# THORNBURY DIGITAL v5 — asset credits

Everything is self-hosted. The collection CSP is `default-src 'self'`
(`media-src 'self'` on this template's pages), so hotlinking a stock host would
be blocked at load time.

## Hero plate film

Stand-in footage occupying the hero plate until the Higgsfield film is made.
Pixabay Content License: free for commercial use, no attribution required —
credited here anyway. Downloaded 3 Sep 2026.

| File | Source | Pixabay ID |
|---|---|---|
| `video/hero.mp4` | [Gyroscope, rings, chrome, abstract](https://pixabay.com/videos/gyroscope-rings-chrome-abstract-66978/) | 66978 |

The 1920×1080 master is kept at `video/src/hero.mp4` (gitignored under
`templates/*/src/`). The web encode is H.264, audio stripped, faststart, CRF 21
with a 3600k cap, and one grade pass: `curves=all='0/0 0.22/0.27 0.55/0.70 1/1'`
lifts mids and highlights while pinning black at black, so the clip reads over
the obsidian ground without the plate turning into a grey box;
`eq=saturation=0.82` pulls the last warmth out toward chrome. Measured average
luma runs 18–57 of 255 across the ten seconds. `img/poster-hero.webp` is the
frame at 8.0 s, the brightest point of the loop.

## Work plates

Each case plate is a capture of that case's own site, taken from this
collection at 1600×1000 (landscape) or 1120×1400 (portrait), cropped clear of
the scrollbar and re-encoded as WebP at quality 80.

| File | Case | Captured from |
|---|---|---|
| `img/case-midwater.webp` | Midwater | `templates/film-midwater/` |
| `img/case-kiyo.webp`, `img/case-kiyo-tall.webp` | Kiyo 清 | `templates/japanese-restaurant/` |
| `img/case-aurel.webp`, `img/case-aurel-tall.webp` | Aurel | `templates/watch-atelier/` |
| `img/case-loam.webp` | Loam | `templates/cafe-loam/` |
| `img/case-form01.webp` | Form/01 | `templates/streetwear-form01/` |

Photography inside those captures belongs to each source template; see the
`IMAGE-CREDITS.md` in each of those directories for its own licensing.

The plates carry a two-stop scrim (`.scrim`) because three of the five sites are
light. Without it the chrome corner labels and the metadata card, which is
`mix-blend-mode: overlay` glass, invert against a white screenshot and vanish.
The card also carries its own `rgba(8,8,8,.5)` base so the overlay blend always
composites over a known dark ground rather than whatever the screenshot happens
to show.
