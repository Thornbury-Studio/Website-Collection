# Licences — Circle Take

Checked as each item was added (DARK.md §2). Everything is vendored into
this folder; the pages load nothing from a CDN. Terms read on 2026-11-03.

## Libraries, served in the page

| Item | Version | Licence | Notice file |
|---|---|---|---|
| GSAP core + ScrollTrigger | 3.15.0 | GSAP Standard "No Charge" Licence (**not MIT**) | header of each file in `vendor/`, terms at https://gsap.com/standard-license/ |
| Lenis | 1.3.27 | MIT, © 2024 darkroom.engineering | `vendor/lenis-LICENSE.txt` |

GSAP's Standard licence (Webflow, effective 30 April 2025) grants a
no-charge licence to use GSAP on any website, commercial use included. It
prohibits using GSAP inside a no-code animation builder that competes with
Webflow, reverse-engineering it into a competing product, and removing its
notices; it has no attribution requirement beyond keeping those notices,
which is why the file headers are intact. It is not MIT: it cannot be
re-licensed or sold as the product itself.

No SplitType on this site: the only kinetic type is the drawn circle, which
is SVG.

## Fonts, self-hosted in `fonts/`

| File | Source | Licence | Notice |
|---|---|---|---|
| `archivo-wdth-wght.woff2` | Archivo variable (`@fontsource-variable/archivo` 5.3.0, latin, width + weight axes) | SIL Open Font License 1.1, © 2020 The Archivo Project Authors | `fonts/Archivo-OFL.txt` |
| `ibm-plex-mono-400.woff2` | IBM Plex Mono Regular (`@fontsource/ibm-plex-mono` 5.3.0, latin), unmodified | SIL Open Font License 1.1, © 2017 IBM Corp. | `fonts/IBMPlexMono-OFL.txt` |

The Archivo file is a Modified Version under the OFL: its axes are limited
to weight 300–800 and width 62–100, and it is subset to Latin, punctuation
and a few symbols (tools in `tools/`, fontTools 4.59). The Archivo licence
declares no Reserved Font Name, so the family name is kept. The OFL text
ships beside each file and the fonts are not sold on their own.

## Footage and stills

Pexels Licence, per clip, with creator and source URL in
`IMAGE-CREDITS.md`. Free for commercial use, modification allowed, no
attribution required (given anyway). Nothing on the site is AI-generated.

## Our own files

`index.html`, `films.html`, `css/style.css`, `js/edit.js`, `js/films.js`,
`img/favicon.svg`, `img/icon-180.png`, the type on `img/og.jpg`, the cut and
grade of every video file, and everything under `tools/` are original to
this template.
