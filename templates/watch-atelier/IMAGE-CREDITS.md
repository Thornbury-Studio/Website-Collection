# AUREL — media provenance

Every image and film on this page was generated for this template on **6 August 2026**.
Nothing is licensed stock, no real product is depicted, and no third-party copyrighted
artwork is used.

## The watch

The Centenary 1926 is an **original, invented design** — a rectangular gilt-brass tank
case with stepped lugs, a champagne sector dial, and a small seconds subdial. It is not
a reproduction of any real watch, carries no brand's name, crown, crest, or dial
furniture, and every prompt demanded **no text, no numerals, no logos** anywhere in
frame. The AUREL wordmark and all deco ornament (corner frames, sunburst dividers,
diamond markers) are hand-written SVG/CSS in this template.

## Generation

**Tool:** Higgsfield MCP
**Image model:** `nano_banana_flash` (Google), 2K — text-to-image for the master,
image-to-image from the master for everything else
**Video model:** `grok_video_v15` (xAI), 1080p, 6 s, silent, driven from a start frame

The master shot established the design; every other image passed it back as a
reference so the case, dial furniture, hands and strap stay the same watch across the
set. (Seedance `std` 1080p and Kling `pro` — the first choices — are gated behind a
higher Higgsfield plan; Grok 1.5 rendered 1080p on the starter plan.)

| File | Shot | Source |
|---|---|---|
| `img/hero-master.webp` | Three-quarter hero on slate (also the video poster) | text-to-image (master) |
| `img/dial-macro.webp` | Extreme dial macro, guilloché + subdial | image-to-image from master |
| `img/movement.webp` | Exhibition caseback, gilt movement | image-to-image from master |
| `img/wrist.webp` | On the wrist, dinner jacket, candlelit bar | image-to-image from master |
| `img/card-champagne.webp` | Catalog card, champagne dial | image-to-image from master |
| `img/card-noir.webp` | Catalog card, black lacquer dial | image-to-image from master |
| `img/card-minuit.webp` | Catalog card, midnight-blue dial | image-to-image from master |
| `img/card-rond.webp` | Catalog card, round 1931 case, opaline dial | image-to-image from master |
| `img/card-vert.webp` | Catalog card, green dial | **local recolour** of `card-minuit` |
| `img/card-bordeaux.webp` | Catalog card, burgundy dial | **local recolour** of `card-minuit` |
| `img/card-fume.webp` | Catalog card, smoked slate dial | **local recolour** of `card-minuit` |
| `video/hero-sweep.mp4` | Slow push-in, light sweeping the dial | image-to-video from master |
| `video/dial-tick.mp4` | Locked macro, subdial seconds hand sweeping | image-to-video from dial macro |

## The three recoloured references

Vert Empire, Bordeaux and Gris Fumé are **not separate photographs**. Each is
`card-minuit` with a hue rotation applied only to the blue family (hue 178°–278°,
weighted by saturation so unpainted shadow is left alone). The brass case, hands,
indices, crown and buckle sit at 30°–60° and are mathematically untouched, so the
metal, lighting and reflections stay identical across the set — which is precisely
how a real maison shoots a colourway run. The dial and its matching strap move
together because they occupy the same hue band.

The script that produced them is reproducible: rotate to 152° for Vert Empire, 356°
with reduced value for Bordeaux, and desaturate to 10% for Gris Fumé.

Two case *shapes* exist in the collection — the rectangular tank (six references)
and the round 1931 (one). More distinct silhouettes would need fresh generation
rather than recolouring.

## Why these two camera moves — and not an orbit

SYS-2026 taught this repo that image-to-video cannot hold a rigid object's geometry
through a revolution. Both films here were briefed to motions that i2v *can* hold:
a locked or near-locked camera where the only changes are lighting and a small local
element (the seconds hand). Both were QA'd frame-by-frame against the master via
contact sheets before shipping — case shape, indices, hands, and subdial stay put in
every sampled frame.

## Post-processing

Stills were resized/cover-cropped with Pillow and encoded to WebP (quality 80,
`method=6`) — seven images, **747 KB** total. Both films were re-encoded with ffmpeg
(H.264, CRF 26–27, no audio track, `moov` moved ahead of `mdat` for faststart):
`hero-sweep.mp4` 3.7 MB, `dial-tick.mp4` 1.2 MB. The hero streams progressively as
the poster shows; the dial film is `preload="none"` and only plays while its chapter
is on screen.

Both files are **baked seamless loops**: the final second dissolves into the clip's
own first second (`xfade` against the trimmed head, output starting from t=1 s), so
the `loop` attribute restarts without a jump cut and time always runs forward. A
play-forward/play-reverse palindrome was considered and rejected — browsers cannot
play video backwards smoothly, and a watch's seconds hand must never run backwards.

## Figures

Every figure — prices, the 262-piece edition, calibre specs, dates, collectors and
their quotes — is **invented** for the fiction of the page, and the footer says so.
Nothing here is for sale.
