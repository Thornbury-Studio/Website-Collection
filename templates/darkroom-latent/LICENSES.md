# Third-party notices — LATENT.

Per DARK.md §2, kept as part of adding each dependency rather than as
cleanup. Lenis and GSAP load from `cdn.jsdelivr.net`, which the repo's
`vercel.json` CSP (and the page's own CSP meta) allows in `script-src`.
DSEG7 is vendored in `fonts/` because the CSP's `font-src` allows only
this site and Google Fonts. Nothing is bundled.

---

## Lenis — MIT License

`lenis@1.1.20` — https://github.com/darkroomengineering/lenis

```
MIT License

Copyright (c) 2023 darkroom.engineering

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## GSAP + ScrollTrigger — GSAP Standard "No Charge" License

`gsap@3.12.5` — https://gsap.com

GSAP's core and ScrollTrigger are free to use, including commercially,
under the GSAP Standard "No Charge" license. **This is not MIT, and the
difference is named here on purpose (DARK.md §2):** the license covers
websites and apps that *use* GSAP; it does not cover redistributing GSAP
as, or inside, a competing tool, or selling a product whose value is the
GSAP integration itself. A showcase template that uses it — and a client
who is handed the source and runs their own site on it — are both fine.

```
Copyright (c) 2008-2025, GreenSock. All rights reserved.
Subject to the terms at https://gsap.com/standard-license/
```

---

---

## DSEG7 Classic — SIL Open Font License 1.1

`dseg@0.46.0` — https://github.com/keshikan/DSEG — `fonts/DSEG7Classic-Bold.woff2`

Copyright (c) 2017, keshikan (http://www.keshikan.net), with Reserved Font
Name "DSEG". The full licence text ships beside the font as
`fonts/DSEG-LICENSE.txt`. OFL terms that matter here: the font may be
used, embedded and redistributed with the site, including commercially;
it may not be sold on its own; a modified version may not use the
reserved name "DSEG".

---

## Google Fonts (loaded from fonts.googleapis.com)

- **Archivo** — SIL Open Font License 1.1.
- **Permanent Marker** — Apache License 2.0.
