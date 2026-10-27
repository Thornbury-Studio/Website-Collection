# Third-party notices — DIVAN

Recorded as each dependency was added (DARK.md §2). Everything below is served from this folder; nothing loads from a CDN.

## 3D asset — CC BY 4.0 (attribution required)

**A Beautiful Game** (`models/chess-set.glb`)
- Original model: Moeen Sayed and Mujtaba Sayed, made for a SideFX Karma tutorial; publicly re-released by the Academy Software Foundation (ASWF), MaterialX project, 2022.
- glTF conversion: Ed Mackey, 2022.
- Source: Khronos glTF-Sample-Assets, `Models/ABeautifulGame` — https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/ABeautifulGame
- Licence: Creative Commons Attribution 4.0 International (SPDX `CC-BY-4.0`) — https://creativecommons.org/licenses/by/4.0/legalcode. The model's own `LICENSE.md` was read, not just the marketplace listing; it states CC BY 4.0 for every file in the folder, for both the original model and the conversion. The licence excludes logos and trademarks (none are present). The upstream licence, readme and metadata are kept in `models/` (`LICENSE-ABeautifulGame.md`, `SOURCE-ABeautifulGame.md`, `metadata-ABeautifulGame.json`).
- **Changes made (as CC BY 4.0 requires us to say):** geometry simplified with meshoptimizer and quantized (KHR_mesh_quantization); the 33 JPEG textures resized (board 2048px, others 1024px) and re-encoded as WebP (EXT_texture_webp); three pawns that the sample file leaves mid-game (c3, d4, e6) returned to their start squares; credit written into the file's `asset.copyright`. No other edits. The original is 43 MB; the shipped file is 7 MB.
- Attribution also appears in `IMAGE-CREDITS.md`.

## JavaScript

| Library | Version | Licence | Files |
|---|---|---|---|
| three.js (incl. `GLTFLoader`, `BufferGeometryUtils` from `examples/jsm`, with their `three` import rewritten to the local path) | 0.180.0 | MIT | `vendor/three.module.min.js`, `vendor/three.core.min.js`, `vendor/GLTFLoader.js`, `vendor/BufferGeometryUtils.js`, `vendor/three-LICENSE.txt` |
| Lenis | 1.3.11 | MIT | `vendor/lenis.min.js`, `vendor/lenis-LICENSE.txt` |
| GSAP core + ScrollTrigger | 3.13.0 | GSAP Standard "No Charge" licence — **not MIT** | `vendor/gsap.min.js`, `vendor/ScrollTrigger.min.js`, `vendor/gsap-LICENSE.txt` |

GSAP's licence allows use in websites and applications; it does not allow redistributing GSAP inside a competing animation toolkit or as the thing being licensed. The licence header is left intact in both minified files. Terms: https://gsap.com/standard-license

Build-time only, not shipped: `chess.js` (BSD-2-Clause) to check that the 45 half-moves are legal and end in checkmate; `@gltf-transform/*` (MIT), `meshoptimizer` (MIT) and `sharp` (Apache-2.0) to produce the optimised GLB.

## Fonts — SIL Open Font License 1.1

| Font | Files | Licence file |
|---|---|---|
| Besley (400, 400 italic, 700, 900), © The Besley Project Authors | `fonts/besley-latin-*.woff2` | `fonts/Besley-OFL.txt` |
| Azeret Mono (400, 500), © The Azeret Project Authors | `fonts/azeret-mono-latin-*.woff2` | `fonts/AzeretMono-OFL.txt` |

Latin subsets via the Fontsource packages. Neither font is renamed or sold on its own.

## Images

`img/poster.webp` is a render of the glTF set above, made with this site's own scene. No photographs, stock images or generated images are used.

## Facts

The game on the board is Anderssen v Kieseritzky, London, 21 June 1851. A chess score is a record of fact; no text from any publication is reproduced. The captions are original.
