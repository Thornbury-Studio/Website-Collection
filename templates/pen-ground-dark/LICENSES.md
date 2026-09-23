# Third-party notices — GROUND.

Per DARK.md §2, kept as part of adding each dependency rather than as
cleanup. All three libraries are loaded from `cdn.jsdelivr.net`, which the
repo's `vercel.json` CSP already allows in `script-src`.

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
under the GSAP Standard "No Charge" license. **This is not MIT and the
difference is load-bearing:** the license permits use in websites and
applications that are not themselves sold as a product built *on* GSAP,
and it does not permit redistributing the library as part of a competing
toolkit or an end-product where GSAP itself is what is being licensed on.

Practical consequence for this repo, flagged per DARK.md §2's "name the
requirement explicitly" rule: shipping a showcase template that *uses*
GSAP is fine, and handing the source to a client who runs their own site
on it is fine. Selling a product whose value is the GSAP integration would
need a Club GSAP commercial license. No such use here.

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

## Fonts

**Fraunces** (Undercase Type) and **Fragment Mono** (Wei Huang) — SIL Open
Font License 1.1, served by Google Fonts. Both permit commercial use,
embedding and web serving; neither may be sold on its own. Full text:
https://openfontlicense.org

## Photography

Unsplash License and Pexels License, per-file, in `IMAGE-CREDITS.md`.
