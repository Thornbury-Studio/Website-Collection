# Licences (checked as each item was added)

## Served in the page

| Item | Licence | Where |
|---|---|---|
| three.js r180 (`three.module.min.js`, `three.core.min.js`) | MIT | `vendor/three-LICENSE.txt` |
| GSAP 3.13.0 + ScrollTrigger | GSAP Standard "No Charge" licence (not MIT; fine for websites, not for redistributing GSAP inside a competing animation toolkit) | `vendor/gsap-LICENSE.txt`, and the header of each minified file |
| Lenis | MIT, © darkroom.engineering | `vendor/lenis-LICENSE.txt` |
| Bodoni Moda (variable, roman + italic) | SIL OFL 1.1 | `fonts/BodoniModa-OFL.txt` |
| Tenor Sans | SIL OFL 1.1 | `fonts/TenorSans-OFL.txt` |
| Cutive Mono | SIL OFL 1.1 | `fonts/CutiveMono-OFL.txt` |

Fonts were taken from the `@fontsource` packages (latin subset, woff2) and are self-hosted. Libraries are vendored locally; the page loads nothing from a CDN.

## Used offline to make the image layers (not served; scripts in `tools/`)

| Tool | Version | Licence | Note |
|---|---|---|---|
| rembg | 2.0.86 | MIT | Background removal driver |
| ISNet `isnet-general-use` (the model rembg ran) | — | Apache-2.0 (DIS) | ~179 MB, downloaded from the rembg release assets. The cutout used in the site. A second model, `u2net_human_seg` (Apache-2.0, U²-Net), was also run and compared, and not used. |
| Depth Anything V2 **Small**, ONNX export `onnx-community/depth-anything-v2-small` | — | **Apache-2.0** (model card checked; the Small variant is the Apache one, the Base / Large / Giant variants are CC-BY-NC and were deliberately not used) | ~99 MB. Produces the relative depth map behind the sitter's relief. |
| onnxruntime 1.31.1, opencv-python-headless 5.0.0.93, Pillow 13.0.0 | — | MIT / Apache-2.0 / HPND | Inference, inpainting, encode |

Everything ran locally in an isolated `uv` environment outside the repo. No image was sent to a third-party service.

## What the depth map is, and is not

The sitter's relief is a displacement of a flat grid by a monocular depth estimate of the supplied photograph. No geometry was modelled or scripted (DESIGN.md §6, "no hand-authored geometry"). The backdrop is the same photograph with the sitter painted out (OpenCV Telea inpaint) and graded; the wordmark plane carries text drawn from the page's own font.
