# LICENSES — MØRKE

Third-party code, loaded from cdn.jsdelivr.net at pinned versions (no bundler,
nothing vendored; jsdelivr is the one script host the repo's CSP allows). Notices
are kept here, added as each dependency was (DARK.md §2).

| Library | Version | Licence | Use |
|---|---|---|---|
| [Lenis](https://github.com/darkroomengineering/lenis) | 1.1.20 | MIT © darkroom.engineering | smooth wheel scrolling on GSAP's ticker; off under reduced motion |
| [GSAP](https://gsap.com) + ScrollTrigger | 3.12.5 | GSAP Standard "No Charge" licence (free for commercial sites, including this one) | the ticker the scrub runs on, heading line reveals, chapter dimming |
| [SplitType](https://github.com/lukePeavey/SplitType) | 0.3.4 | ISC © Luke Peavey | splits headings into lines for the reveal; reverted after it plays |

No other runtime code. The scrub, the window reveal, the season chart and the
solar model (`js/sun.js`) are written for this site. There is no Three.js and no
canvas.

Fonts, served by Google Fonts, both under the SIL Open Font License 1.1:
- Newsreader, by Production Type.
- Schibsted Grotesk, by Bakken & Bæck for Schibsted.

Pictures and film: see `IMAGE-CREDITS.md`.

MIT licence text (Lenis):

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.

ISC licence text (SplitType):

> Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies. THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS.
