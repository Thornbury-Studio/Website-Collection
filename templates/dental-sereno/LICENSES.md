# Licences — Sereno Dental

Checked as each item was added (DARK.md §2). Everything is vendored into
this folder; the pages load nothing from a CDN. Terms were read on
2026-10-29 from the sources named below.

## Libraries, served in the page

| Item | Version | Licence | Notice file |
|---|---|---|---|
| GSAP core + ScrollTrigger | 3.15.0 | GSAP Standard "No Charge" Licence (**not MIT**, see below) | header of each file in `vendor/`, terms at https://gsap.com/standard-license/ |
| Lenis | 1.3.27 | MIT, © 2024 darkroom.engineering | `vendor/lenis-LICENSE.txt` |
| SplitType | 0.3.4 | ISC, Luke Peavey (the licence field of the published package; no licence file ships in the npm tarball) | `vendor/split-type-LICENSE.txt` |

### GSAP: what the Standard licence actually says

Read in full at https://gsap.com/standard-license/ (effective 30 April
2025, last modified 30 May 2025; the minified files here carry the header
"Copyright 2026, GreenSock. Subject to the terms at
https://gsap.com/standard-license"). The points that matter for this
template and for any client site built from it:

- Webflow grants a **non-exclusive, worldwide, no-charge licence to use,
  reproduce, display and implement** GSAP "on any website, web
  application, or digital interface by any person or entity".
  Commercial use is covered; the plugins that used to need a paid
  membership (SplitText, MorphSVG and the rest) are now free too. This
  template uses only the core and ScrollTrigger.
- **Prohibited:** using GSAP inside a visual, no-code animation builder
  that competes with Webflow's own animation tooling; reverse-engineering
  GSAP to build a competing product; removing or altering its proprietary
  notices. Handing a client the source of their own site is none of these.
- There is **no attribution requirement** beyond leaving the notices in
  the files, which is why the file headers are kept intact.
- GSAP stays Webflow's property; the licence can be revoked for breach,
  and Webflow may revise it (earlier versions stay usable under their own
  terms). Not MIT: it cannot be re-licensed, forked into a competing
  toolkit, or sold as the product itself.

### SplitType: ISC, not MIT

Two earlier dark-engine templates recorded SplitType as MIT. The published
package (`split-type@0.3.4`, package.json `"license": "ISC"`) says ISC,
and the GitHub repository's licence file was not reachable at the time of
writing, so the ISC text is recorded here with the author's name. ISC and
MIT are functionally equivalent permissive licences; the notice is kept
either way.

## Fonts, self-hosted in `fonts/`

| Face on this site | Source family | Licence | Notice |
|---|---|---|---|
| Sereno Serif Display (roman + italic) | Source Serif 4 (variable, from `@fontsource-variable/source-serif-4` 5.3.1) | SIL Open Font License 1.1, © Adobe | `fonts/SourceSerif4-OFL.txt` |
| Sereno Sans (variable, wght 400–600) | Public Sans (variable, from `@fontsource-variable/public-sans` 5.3.0) | SIL Open Font License 1.1, © The Public Sans Project Authors | `fonts/PublicSans-OFL.txt` |

Both files are **Modified Versions** under the OFL: the serif is a static
instance at optical size 48 / weight 400, the sans has its weight axis
limited to 400–600, and both are subset to Latin, punctuation and the
currency sign. The OFL permits this, and requires that a Modified Version
not use the Reserved Font Name; the internal name tables were therefore
renamed to "Sereno Serif Display" and "Sereno Sans". The OFL text ships
beside the files, the fonts are not sold on their own, and the originals
are at https://github.com/adobe-fonts/source-serif and
https://github.com/uswds/public-sans.

## Photography

Pexels Licence, per file, listed with photographer and URL in
`IMAGE-CREDITS.md`. Free for commercial use, no attribution required
(given anyway), no identifiable faces presented as named staff.

## Our own files

`index.html`, `treatments.html`, `team.html`, `new-patients.html`,
`contact.html`, `css/style.css`, `js/main.js`, `img/favicon.svg`,
`img/icon-180.png`, `img/og.jpg` and everything under `tools/` are
original to this template.
