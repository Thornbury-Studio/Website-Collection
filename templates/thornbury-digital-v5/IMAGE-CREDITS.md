# THORNBURY DIGITAL v5 — asset credits

Everything is self-hosted. The collection CSP is `default-src 'self'`
(`media-src 'self'` on this template's pages), so hotlinking a stock host would
be blocked at load time.

## Hero film

Stand-in footage filling the hero until the Higgsfield film is made. Pixabay
Content License: free for commercial use, no attribution required — credited
here anyway. Downloaded 3 Sep 2026.

| File | Source | Pixabay ID |
|---|---|---|
| `video/hero.mp4` | [Moon, Iapetus, space](https://pixabay.com/videos/moon-iapetus-moon-iapetus-space-132361/) | 132361 |

One body, filling the frame, on a slow push-in — the whole point of the shot is
that a single object holds the eye. The 1920×1080 / 60 fps / 30 s master is kept
at `video/src/hero.mp4` (gitignored by this directory's own `.gitignore`).

The web encode takes the strongest 15 seconds (10 s → 25 s, where the body is
largest), drops to 30 fps because a slow drift needs nothing more, and is H.264,
audio stripped, faststart, CRF 22 with a 3000k cap. Two filters: `hflip` puts
the moon on the right so the headline has clear space on the left, and
`eq=saturation=0.2:contrast=1.1` pulls the residual blue out of the starfield,
which keeps the page inside its obsidian/chrome/ember palette.
`img/poster-hero.webp` is the frame at 6 s.

## Work plates

Each case plate is a capture of that case's own site, taken from this
collection at 1600×1000 (landscape) or 1120×1400 (portrait), cropped clear of
the scrollbar and re-encoded as WebP at quality 80.

| File | Case | Captured from |
|---|---|---|
| `img/case-midwater.webp` | Midwater | `templates/film-midwater/` |
| `img/case-kiyo.webp` | Kiyo 清 | `templates/japanese-restaurant/` |
| `img/case-aurel.webp` | Aurel | `templates/watch-atelier/` |
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
