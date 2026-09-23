# IMAGE-CREDITS — TALLOW DARK

Every frame on this site is a real photograph under the **Pexels
License** (free for commercial use, no attribution required, no
model/property release implied — none of these frames carry an
identifiable face). Licence checked at the moment each one was added, per
DARK.md §2. Nothing here is generated, scraped, or lifted from another
brand's site.

Sources are cached under `tools/raw/` and are re-derived by
`python tools/grade.py`. Three grades are applied in that script:

- **cold** — documentary black and white, cool shadow lift, film grain.
- **warm** — ivory/tallow duotone. Used exactly twice, on the rendered side.
- **plate** — near-neutral, highlights pulled off the ceiling. Left
  ungraded on disk on purpose: the render pass grades it live on both
  sides of the melt line, so it has to keep its headroom.

| File | Source | Grade | Used for |
|---|---|---|---|
| `img/plate.webp` | Pexels photo 20444768 — slab of raw fat on paper. Cropped to the slab; the food styling around it is cropped out. | plate | **The render pass.** The site's melt subject — the one photograph the whole mechanic is built on. |
| `img/arch.webp` | Pexels photo 39180001 — round factory window in a brick wall. | cold | Hero frame on `index.html`; the atelier. |
| `img/hall.webp` | Pexels photo 38303941 — empty industrial hall, rails receding. | cold | Full-bleed band, `rendering.html`. |
| `img/hands.webp` | Pexels photo 37634572 — working hands holding a tool. | cold | The labour frame, `index.html` house section. |
| `img/grind.webp` | Pexels photo 39152970 — hands grinding, sparks. | cold | `rendering.html` stage 02. |
| `img/glass.webp` | Pexels photo 1366942 — laboratory glassware in low light. | cold | The clarify stage. |
| `img/bottles.webp` | Pexels photo 7191393 — a line of dark glass bottles. | cold | The fill stage; `acquire.html`. |
| `img/field.webp` | Pexels photo 15203362 — a field of clear glass bottles. | cold | Full-bleed band, `note.html`. |
| `img/rack.webp` | Pexels photo 4912164 — round-bottom flasks in a rack under warm lamps. | warm | The rendered side, `note.html` / `index.html`. |
| `img/og.webp` | Derived from `img/plate.webp` — the same frame in both grades, split across the melt line. | both | OpenGraph / Twitter share card. |
| `img/favicon.svg` | Original. A square split by one rule: matte above, tallow below. The mark is the mechanic. | — | Favicon. |

Hub thumbnail `../../img/perfume-tallow-dark-sm.webp` is a 480×300
downscale of this site's own render pass at 35%, captured by
`tools/shot.mjs` (`tools/shots/desktop-02-render-35.png`).

## Fonts

- **Martian Mono** — SIL Open Font License 1.1, served by Google Fonts.
- **Newsreader** — SIL Open Font License 1.1, served by Google Fonts.

Both are loaded from `fonts.googleapis.com` / `fonts.gstatic.com`, which
the repo's `vercel.json` CSP already allows.
