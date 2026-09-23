# Third-party notices — BLOOM.

Per DARK.md §2, kept as part of adding each dependency rather than as
cleanup. All three libraries load from `cdn.jsdelivr.net`, which the repo's
`vercel.json` CSP (and each page's own CSP meta) allows in `script-src`.
Nothing is vendored and nothing is bundled.

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

## SplitType — MIT License

`split-type@0.3.4` — https://github.com/lukePeavey/SplitType

```
MIT License

Copyright (c) 2021 Luke Peavey

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

## Our own code

`js/bloom.js` (the WebGL2 bloom program), `js/bloom-model.js` (the
degassing and bloom model, the lot arithmetic and the Melbourne roast
calendar), `js/main.js`, `css/style.css` and everything under `tools/`
are original to this template. The fragment program uses two public,
widely reproduced hashing idioms — the sine-free "hash without sine" and
the classic `fract(sin(dot(...)) * 43758.5453)` lattice hash — which are
techniques, not licensed code.

## Fonts

**Bricolage Grotesque** and **IBM Plex Mono** — SIL Open Font License
1.1, served by Google Fonts (`fonts.googleapis.com` / `fonts.gstatic.com`,
both already allowed by the CSP). Commercial use, embedding and web
serving are permitted; neither may be sold on its own.
https://openfontlicense.org

## Photography

Pexels License, per file, in `IMAGE-CREDITS.md`.
