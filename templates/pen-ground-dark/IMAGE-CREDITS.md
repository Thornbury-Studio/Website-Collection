# IMAGE-CREDITS — GROUND.

Every frame on this site is a real photograph under the **Unsplash
License** or the **Pexels License** (both: free for commercial use, no
attribution required, no model/property release implied). Licence checked
at the moment each one was added, per DARK.md §2; Unsplash+ (premium)
results were excluded at search time. Nothing here is generated,
scraped, or lifted from another brand's site.

**Sourcing rule that decided the set:** no frame may carry another
maker's name legibly on the nib at the size the site shows it. Checked
against full-resolution crops of every nib, not the search thumbnail.
Rejected on that basis: Montblanc (Unsplash `CC_kzFrwqiA`), Gucci
(`kRV-s5sXo2g`), Pelikan (`YsUx9o1w1L8`), Kaweco (`8ylzXjzqkJQ`), Parker
(`B9viH9mcem8`, `lPAZ2mSA7zI`, `dsGDsbBogn8`, Pexels `1090680`,
`18031748`), Pilot (Pexels `261719`) and Sheaffer (Unsplash
`LxphooAHzvc` — its "SHEAFFER" stamp survived even a crop to the tipping
band at full-bleed width, so the frame was dropped). The
Aaron Burden frame (`write`) carries a "PILOT" mark above the breather
hole; it is cropped from the hole down so the mark is out of frame.

Sources are cached under `tools/raw/` (gitignored) and re-derived by
`python tools/grade.py`. Three grades:

- **nib** — near-monochrome with the metal kept: everything desaturated
  except the yellow/orange band the gold tipping lives in, blacks sunk to
  the page ground, film grain. The only grade allowed colour on the dark
  pages.
- **steel** — full monochrome, cool shadow lift, grain.
- **paper** — warm ink-to-cream duotone for the paper-white sections.

| File | Source | Grade | Used for |
|---|---|---|---|
| `img/tip.webp` | Unsplash `pZJfBG9I2Z0` — Dahee Jeoung. A 14k gold nib on a black section, dark ground; the 14K stamp is the plane of focus, the tip runs soft. Cropped to the left two thirds so the nib fills the frame. | nib | **Hero, `index.html`.** The nib carries only "14K" and scroll engraving — no maker's name. |
| `img/point.webp` | Pexels `19875634` — Luis Alberto Garcia. A steel nib large in the left of the frame on black: slit, breather hole and the ground ball of tipping, sharp. No lettering on the nib. | steel | `index.html`, "the tipping is the only part that touches the paper" — the one frame where the tipping itself is the subject. |
| `img/stamped.webp` | Pexels `31553891` — SHOX ART. A pile of stamped steel **dip** nibs, mixed patterns. Captioned as what it is: stamped by the thousand, the same first step. | steel | `index.html`, "stamped, then ground". |
| `img/slit.webp` | Pexels `18452256` — Kristina Ohrband. A steel nib head-on: slit, breather hole, tines. | nib | `index.html`, the slit. |
| `img/pen.webp` | Unsplash `H-o28jg1mjw` — Tony Litvyak. A black-lacquer pen with gold-plated trim and clip, and its cap, across an open notebook on black leather. The nib carries a small crest, no name. Crop: the middle band (y 34–90 %). **The spec on the site describes this pen** (brass under black lacquer, gold-plated band, ring and clip, 28 g). | nib | `index.html`, the pen band. |
| `img/penend.webp` | The same photograph, `H-o28jg1mjw`, cropped 4:5 to the nib end (x 34–82 %, y 30–78 %). **Deliberate reuse of one source, stated per DARK.md §2:** the site sells one pen, so every frame that shows the whole pen shows this pen. | nib | `order.html`, beside the form. |
| `img/hand.webp` | Unsplash `HBYRS5S8edg` — Dr. Gourab Debnath. A hand writing with a fountain pen in low light. | steel | `index.html`, "what we do about it". |
| `img/sheet.webp` | Unsplash `egEuzZNpjvE` — Samir Bouaked. A calligrapher's sampler sheet, hands named in French beside them (anglaise, romaine, brush). Captioned as a specimen sheet, not as GROUND.'s own test sheet. | paper | `index.html`, the test sheet section. |
| `img/write.webp` | Unsplash `y02jEX_B0O0` — Aaron Burden. A nib on the line of a handwritten page. Cropped from the breather hole down (see above). | steel | `grinds.html` hero. |
| `img/draw.webp` | Unsplash `nXhKyFQ6Uyg` — Beku Kanomi. A steel nib drawing a line on lined paper. | steel | `grinds.html`, the round nibs. |
| `img/script.webp` | Unsplash `vu96Jx7rNfQ` — Megs Harrison. Pointed-pen copperplate on cream paper. | paper | `grinds.html`, the flex note. |
| `img/drop.webp` | Unsplash `SXn-fWj0Ht4` — Nicolas Thomas. A nib and a drop of ink, high key. | paper | `grinds.html`, the wet test. |
| `img/kraft.webp` | Unsplash `bLkxCCtxB3I` — Esther Ní Dhonnacha. A hand writing on kraft paper, steel nib. | steel | `order.html`, "send a page". |
| `img/grid.webp` | Pexels `7153019` — Mathias Reding. A hand writing on grid paper with a steel pen. | steel | `grinds.html`, "measure your x-height". |
| `img/og.jpg` | A 1200×630 capture of this site's own hero (`tools/og.mjs`), i.e. the `tip` frame with the wordmark and headline set over it. | nib | OpenGraph / Twitter share card. |
| `img/favicon.svg` | Original. A nib silhouette with its slit and breather hole, gold on ground. | — | Favicon. |

Thirteen photographs, fourteen frames. The one reuse (`pen` / `penend`) is
the site's one pen, and is stated above. Dropped after the fresh-context
critique (2026-09-23): Pexels `753695` (its steel nib reads IRIDIUM POINT
GERMANY beside a page selling a 14k nib), Unsplash `dyFnG8xZi3s` (a third
visibly different pen), Unsplash `iqP50nJaLKk` (the tipping too small in
frame for the section whose subject it is).

Hub thumbnail `../../img/pen-ground-dark-sm.webp` is a 480×300 downscale
of this site's own hero, captured by `tools/shot.mjs`.

## Fonts

- **Fraunces** — SIL Open Font License 1.1 (Undercase Type), served by
  Google Fonts.
- **Fragment Mono** — SIL Open Font License 1.1 (Wei Huang), served by
  Google Fonts.

Both are loaded from `fonts.googleapis.com` / `fonts.gstatic.com`, which
the repo's `vercel.json` CSP already allows.
