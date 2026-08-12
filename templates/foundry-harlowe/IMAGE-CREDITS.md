# HARLOWE — asset credits

All video is free-license footage from Pexels (Pexels License: free for
commercial use, no attribution required — provenance recorded here anyway;
author names were not retrievable at download time, 2026-08-12, as Pexels
video pages were rate-limiting, so entries link to the source page instead).
Downloaded at native resolution (4K where offered), re-encoded for the web
as H.264 MP4 (1440p/1080p by role, faststart; the hero also ships a 4K VP9
WebM tier). Every clip and still passed through ONE identical grade
(contrast 1.07, brightness −0.015, saturation 0.86, gamma 0.97, warm
colour-balance shift) so nine sources read as one foundry.

## Video (used)

| File | Source | Pexels ID |
|---|---|---|
| video/hero.mp4, video/hero-4k.webm | A close-up of three bells hanging from a ceiling | [20143615](https://www.pexels.com/video/20143615/) |
| video/metal.mp4 | Molten metal glowing in a foundry furnace | [33938964](https://www.pexels.com/video/33938964/) |
| video/pour.mp4 | Industrial metal casting in foundry workshop | [30342459](https://www.pexels.com/video/30342459/) |
| video/cooling.mp4 | Close-up of fire (blacksmith forge) | [4593420](https://www.pexels.com/video/4593420/) |
| video/tuning.mp4 | Polishing metal with angle grinder | [5846460](https://www.pexels.com/video/5846460/) |
| video/tower.mp4 | Historic church bell tower against mountain skyline | [34760833](https://www.pexels.com/video/34760833/) |

Poster frames (`img/poster-*.webp`) are frames from the clips above.

## Video (downloaded, rejected)

| Pexels ID | Why rejected |
|---|---|
| [33938968](https://www.pexels.com/video/33938968/) | Duplicate furnace scene; 33938964 held the frame better |
| [33939016](https://www.pexels.com/video/33939016/) | Same scene family again; redundant |
| [5121750](https://www.pexels.com/video/5121750/) | Spectacular but reads steel-mill industrial, breaks the craft-foundry world |
| [2386581](https://www.pexels.com/video/2386581/) | Spark bokeh too abstract next to 5846460 |
| [34637796](https://www.pexels.com/video/34637796/) | Portrait orientation; no slot |
| [6033520](https://www.pexels.com/video/6033520/) | 720p only |

## Generated stills

`img/bell-single.webp`, `img/bell-ring.webp`, `img/bell-carillon.webp`,
`img/bell-hand.webp`, `img/macro-band.webp`, `img/macro-lip.webp`,
`img/tuning-lathe.webp`, `img/mould-pit.webp`, `img/foundry-wide.webp` —
generated with Gemini image generation, model `nano-banana-pro-preview`
(all nine first-try, no fallback needed), 2026-08-12, from one shared STYLE
block (single tungsten key light, umber darkness, satin bronze; lettering
explicitly forbidden — ornament bands are laurel/rope/dot motifs only).
Zoom-audited for stray generated lettering before use; graded through the
same pass as the video.

## Audio

None. There are no audio files in this template: every bell strike is
synthesized in Web Audio at runtime from the five true-harmonic partials
(hum ½f, prime f, tierce 1·2f, quint 1·5f, nominal 2f) with per-strike
detuned doublets and a filtered-noise clapper transient.

## Numbers

Bell diameters, weights, prices and delivery times across the site are
computed at runtime from one model (`js/ui.js` — HB.model): strike
frequency × diameter ≈ 470 Hz·m (calibrated against Big Ben: 2.74 m, strike
E3); weight from the Hibberts bronze regression w ≈ 0.715 · f_nominal · d⁴
(hibberts.co.uk, 7,165-bell dataset). No printed number is hand-typed.
