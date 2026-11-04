# Licences — PROOF.

Checked as each item was added (DARK.md section 2). Everything is vendored into this folder; the page loads nothing from a CDN. Terms read on 2026-11-04.

## Libraries, served in the page

| Item | Version | Licence | Notice file |
|---|---|---|---|
| GSAP core + ScrollTrigger | 3.15.0 | GSAP Standard "No Charge" Licence (**not MIT**) | header of each file in `vendor/`, terms at https://gsap.com/standard-license/ |
| Lenis | 1.3.27 | MIT, (c) 2024 darkroom.engineering | `vendor/lenis-LICENSE.txt` |
| SplitType | 0.3.4 | ISC, (c) Luke Peavey | `vendor/split-type-LICENSE.txt` |

GSAP's Standard licence (Webflow, effective 30 April 2025) grants a no-charge licence to use GSAP on any website, commercial use included. It prohibits using GSAP inside a no-code animation builder that competes with Webflow, reverse-engineering it into a competing product, and removing its notices. It is not MIT: it cannot be re-licensed or sold as the product itself. The notices in the file headers are intact.

## Fonts, self-hosted in `fonts/`

| File | Source | Licence | Notice |
|---|---|---|---|
| `fraunces-wght.woff2` | Fraunces variable (`@fontsource-variable/fraunces` 5.3.0, latin, weight axis) | SIL Open Font License 1.1, (c) 2020 The Fraunces Project Authors | `fonts/Fraunces-OFL.txt` |
| `hanken-grotesk-wght.woff2` | Hanken Grotesk variable (`@fontsource-variable/hanken-grotesk` 5.3.0, latin) | SIL Open Font License 1.1 | `fonts/HankenGrotesk-OFL.txt` |
| `ibm-plex-mono-400.woff2` | IBM Plex Mono Regular (`@fontsource/ibm-plex-mono` 5.3.0, latin), unmodified | SIL Open Font License 1.1, (c) 2017 IBM Corp. | `fonts/IBMPlexMono-OFL.txt` |

## Media

Photographs and film: Pexels License, per item, listed in `IMAGE-CREDITS.md`.

## Tooling (not shipped)

ffmpeg (used offline to encode), Pillow and fontTools (to resize images and draw the share card).
