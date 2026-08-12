# NOON — asset credits

## Video

One video on the site, by design. Free-license footage from Pexels (Pexels
License: free for commercial use, no attribution required — provenance
recorded here; the video page was rate-limiting at download time,
2026-08-12, so the entry links to the source page).

| File | Source | Pexels ID |
|---|---|---|
| video/hero.mp4 | Elegant architectural archways with soft lighting | [36909064](https://www.pexels.com/video/36909064/) |

Downloaded at native 3840×2160 and shipped at native 3840×2160 (H.264
crf 23, faststart) — the collection's rule after HARLOWE: no full-bleed
video below true 4K. The source is a slow lateral dolly; the shipped loop
is a palindrome (forward + reversed) so it never jumps. `img/poster-hero.webp`
is a frame from this clip.

## Video (downloaded, rejected)

| Pexels ID | Why rejected |
|---|---|
| [3127063](https://www.pexels.com/video/3127063/) | 4K but domestic clutter and wall lettering |
| [38675644](https://www.pexels.com/video/38675644/) | 4K but reads residential-listing, off-brand |
| [35649915](https://www.pexels.com/video/35649915/) | Right subject, 1080p only — fails the 4K rule |
| [32537473](https://www.pexels.com/video/32537473/) | 4K but dark angular panels, wrong mood |
| [35251011](https://www.pexels.com/video/35251011/) | Gallery hung with artworks; frames carry third-party work |
| [35727196](https://www.pexels.com/video/35727196/), [32236967](https://www.pexels.com/video/32236967/), [37687139](https://www.pexels.com/video/37687139/), [35771451](https://www.pexels.com/video/35771451/) | Portrait 4K; no slot after the one-video decision |
| [5712539](https://www.pexels.com/video/5712539/), [10756505](https://www.pexels.com/video/10756505/), [28702865](https://www.pexels.com/video/28702865/), [19444136](https://www.pexels.com/video/19444136/), [6353225](https://www.pexels.com/video/6353225/), [5250811](https://www.pexels.com/video/5250811/), [19947949](https://www.pexels.com/video/19947949/) | Below 4K landscape |

## Generated stills

`img/ext-*.webp` (four building portraits), `img/int-*.webp` (four
interiors), `img/mat-*.webp` (three material macros) — generated with
Gemini image generation, model `nano-banana-pro-preview` (all eleven
first-try), 2026-08-12, from two shared STYLE blocks (one for exteriors,
one for interiors: clear Nordic morning light, pale honey brick and white
render, no people, lettering explicitly forbidden). Zoom-audited for stray
generated lettering before use. All assets — video and stills — passed
through one gentle high-key grade (contrast 1.02, brightness +0.008,
saturation 0.94, slight warm shift) so twelve sources read as one city.

## Audio

None.

## Numbers

Every light figure and rent on the site is computed at runtime from one
model (`js/ui.js` — NN.sun / NN.buildings): solar declination
δ = 23.44°·sin(2π(284+n)/365), hour angle H = 15°(t−12), altitude and
azimuth from the standard formulas at 55.7° N; direct-sun hours counted
across the working day (08–18 solar) on each building's declared window-wall
bearings; rents = area × building rate × light factor. No printed number is
hand-typed. The working-day rule exists because the model caught the
marketing copy overclaiming: at 55.7° N a north wall does catch ~0.9 h of
midsummer dawn, so "the sun never enters" is only true of working hours —
and now the survey says exactly that.
