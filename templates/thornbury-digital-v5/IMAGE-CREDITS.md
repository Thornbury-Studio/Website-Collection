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

The web encode **plays forward then backward**, so the loop never cuts. One
ffmpeg pass takes the strongest 7.5 seconds (10 s → 17.5 s), splits it, reverses
one copy, trims the duplicate frame at the turn, and concatenates: 448 frames,
14.93 s, and the last frame is one ordinary step from the first, so the plain
`loop` attribute runs forever seamlessly.

It drops to 30 fps because a slow drift needs nothing more, and is H.264, audio
stripped, faststart, CRF 25 with a 1900k cap — 2.73 MB where CRF 22 gave 4.50 MB.
The two encodes are indistinguishable at 1:1 on the crater detail (38.6 dB PSNR),
which is the only test worth trusting here; file size alone says nothing.

Two more filters: `hflip` sets the body's lit side against the layout, and
`eq=saturation=0.2:contrast=1.1` pulls the residual blue out of the starfield,
which keeps the page inside its obsidian/chrome/ember palette.
`img/poster-hero.webp` is the frame at 6 s.

Seam check (PSNR against the neighbouring ordinary frame step, higher is closer):
loop point 32.2 dB vs 32.8 dB, turnaround 35.4 dB vs 35.3 dB, unrelated frames
13.6 dB.

## Transition footage

Sourced, not generated — the asset order in `VIDEO-POLICY.md` starts with real
licensed footage, and both of these were found rather than made. Pixabay Content
License: free for commercial use, no attribution required, credited here anyway.
Downloaded 4 Sep 2026.

| File | Source | Pixabay ID | Master |
|---|---|---|---|
| `video/ink.mp4` | [Transition, brush, black](https://pixabay.com/videos/transition-brush-black-white-23324/) | 23324 | 3840×2160, 30 fps, 5.03 s |
| `video/warp.mp4` | [Ripples, waves, metallic](https://pixabay.com/videos/ripples-waves-metallic-60195/) | 60195 | 1920×1080, 24 fps, 25 s |

Eighteen candidates were pulled as `_tiny` previews and read off one contact
sheet before either of these was downloaded at size; the masters are kept under
`video/src/`, which this directory's own `.gitignore` excludes.

**`ink.mp4` is a matte, not a picture.** A luminance sweep of the master put the
usable action at 0.7 s–3.4 s (mean Y 13 → 237), so the encode takes 0.60 s–3.50 s,
speeds it up 2.4× to 1.27 s, converts to grey and stretches the levels
(`clip((val-34)*1.62)`) so the first frame is black and the last is white end to
end. It is drawn through an SVG `feColorMatrix type="luminanceToAlpha"` so its
brightness becomes alpha — the ink strokes erase the previous page. 960×540 at
CRF 25 is 87 kB, which is all a matte needs.

**`warp.mp4` is a displacement source.** It is read at 36×20 and only its
luminance gradient is used, so it is encoded grey at 384×216, CRF 27, 5 s: 155 kB.
Nothing in it is ever shown.

## Work plates

Each case plate is a capture of that case's own site, taken from this collection
at 1600×1000, cropped clear of the scrollbar and re-encoded as WebP at quality
80. One landscape crop per case: home shows them as small figures and Work as a
three-up gallery, so both want the same shape.

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
