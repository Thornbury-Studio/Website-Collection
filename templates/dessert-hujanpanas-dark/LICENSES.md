# Licences — Hujan Panas

Checked as each item was added (DARK.md section 2). Everything is vendored into this folder; the page loads nothing from a CDN. Terms read on 2026-11-06.

## Libraries, served in the page (desktop only; phones never download them)

| Item | Version | Licence | Notice file |
|---|---|---|---|
| GSAP core + ScrollTrigger | 3.15.0 | GSAP Standard "No Charge" Licence (**not MIT**) | header of each file in `vendor/`, terms at https://gsap.com/standard-license/ |
| Lenis | 1.3.27 | MIT, (c) 2024 darkroom.engineering | `vendor/lenis-LICENSE.txt` |

GSAP's Standard licence (Webflow, effective 30 April 2025) grants a no-charge licence to use GSAP on any website, commercial use included. It prohibits using GSAP inside a no-code animation builder that competes with Webflow, reverse-engineering it into a competing product, and removing its notices. The notices in the file headers are intact.

The list reorder uses the browser's own View Transitions API; the rain is a hand-written 2D canvas; no other library is used.

## Fonts, self-hosted in `fonts/`

| File | Source | Licence | Notice |
|---|---|---|---|
| `bricolage-grotesque.woff2` | Bricolage Grotesque variable, Google Fonts latin subset (v9), then instanced and subset by `tools/fonts.py` (width 100, optical size 36, weight 300-800 kept) | SIL Open Font License 1.1, (c) 2022 The Bricolage Grotesque Project Authors. The licence names **no Reserved Font Name**, so the modified file may keep the family name. | `fonts/BricolageGrotesque-OFL.txt` |
| `martian-mono-400.woff2` | Martian Mono 400, Google Fonts latin subset (v6), unmodified | SIL Open Font License 1.1, (c) 2021 The Martian Mono Project Authors; no Reserved Font Name | `fonts/MartianMono-OFL.txt` |

## Data

Weather readings: NEA real-time air temperature and rainfall via data.gov.sg (`api-open.data.gov.sg/v2/real-time/api/...`), used under the Singapore Open Data Licence v1.0 (https://data.gov.sg/open-data-licence), which requires attribution ("Contains information from ... accessed on ... from data.gov.sg"). The footer and the live readout credit NEA via data.gov.sg. The climate fallback in `js/weather.js` is rounded long-run monthly means, not a copy of any dataset.

## Media

Photographs and film: Pexels License, per item, listed in `IMAGE-CREDITS.md`.

## Tooling (not shipped)

ffmpeg (encoding), Pillow (images, share card, icon) and fontTools (font cut), all run offline.
