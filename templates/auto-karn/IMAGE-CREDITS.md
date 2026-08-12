# KARN — asset credits

## Video

Free-license footage from Pexels (Pexels License: free for commercial use,
no attribution required — provenance recorded here; video pages were
rate-limiting at download time, 2026-08-12, so entries link to source pages).

| File | Source | Pexels ID |
|---|---|---|
| video/tunnel-4k.mp4, video/tunnel-hd.mp4 | Driving through illuminated tunnel at night | [33938671](https://www.pexels.com/video/33938671/) |
| video/nightroad.mp4 | Driving on a road at night | [2876665](https://www.pexels.com/video/2876665/) |

The tunnel ships at native 3840×2160 (H.264 crf 21, GOP 12 for scroll-
scrubbing; a 1920 tier serves small screens). The night road ships at native
3840×2160. `img/poster-tunnel.webp` is a frame from the tunnel clip.

## Video (downloaded, rejected)

| Pexels ID | Why rejected |
|---|---|
| [15270404](https://www.pexels.com/video/15270404/) | 4K but real traffic and road signage |
| [28928755](https://www.pexels.com/video/28928755/) | 4K, clean, but redundant next to 2876665 |
| [9010406](https://www.pexels.com/video/9010406/) | Parking lot of identifiable real cars |
| [35987757](https://www.pexels.com/video/35987757/) | Wiper, cabin, other cars in frame |
| [31177922](https://www.pexels.com/video/31177922/) | Identifiable production pickup |
| [12639436](https://www.pexels.com/video/12639436/) | Vehicle obscured but off-brand terrain |
| [37468508](https://www.pexels.com/video/37468508/), [10816903](https://www.pexels.com/video/10816903/) | Portrait orientation |
| [3895030](https://www.pexels.com/video/3895030/), [16017101](https://www.pexels.com/video/16017101/) | Below 4K |

## Generated vehicles

All sixteen vehicle and texture images (`img/monolit-*.webp`,
`img/serra-*.webp`, `img/brekka-*.webp`, `img/nokt-*.webp`,
`img/varde-*.webp`, `img/tex-carbon.webp`) were generated with Gemini image
generation, model `nano-banana-pro-preview`, 2026-08-12, heroes requested at
4K output (≈5504×3072 native). The five machines are original designs from
one brand-DNA block repeated verbatim in every prompt (full-width nose and
tail light-blades, rising shoulder line, matte lower cladding, turbine
wheels, no lettering); each machine adds its own environment block (salt
flat, basalt ring, ash dunes, night coast, white studio). The small diamond
nose emblem emerged from generation and was adopted as the marque's badge.
Every frame was zoom-audited for stray lettering and malformed geometry
before shipping; one identical grade pass unifies the set.

## Audio

None.

## Numbers

Every performance figure is computed at runtime from declared primitives
(`js/ui.js` — KN.perf): 0–100 from mass/power with drivetrain-traction
factors; top speed from v = (2Pη/ρCdA)^⅓ or a declared limiter (flagged
"LTD" honestly, with the forgone aero speed printed); downforce from ½ρv²ClA
with the downforce-equals-weight crossover computed; EV range from battery ×
consumption. Sector conditions come from a date-seeded deterministic model.
No printed figure is hand-typed.
