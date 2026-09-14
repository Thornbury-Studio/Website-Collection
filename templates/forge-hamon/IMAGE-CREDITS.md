# HAMON — image provenance

HAMON is a **fictional business**. The forge at Cleave Ford, the two people
named on `forge.html`, the four blades, the prices, the lead time and every
figure on the site are original to this template. No real bladesmith's
identity, imagery or prices are used.

## Photography — licensed Adobe Stock (free tier)

Four photographs were searched, licensed and downloaded on **14 September 2026**
through the Adobe Stock connector, free-tier assets only (licence state
`just_purchased`, no credit cost). Every asset was checked to be
`isGenTech: false`. Originals ran 6 000–6 240 px on the long edge; every export
is downsampled from the full-resolution licensed file, never from a search
thumbnail.

| File | Adobe Stock ID | Used as |
|---|---|---|
| `img/hero.webp`, `img/hero-1000.webp` | 131647393 | Hero — a finished blade on a dark bench |
| `img/forge.webp`, `img/forge-900.webp` | 654246990 | Fold weld — the billet buried in the coal bed |
| `img/anvil.webp`, `img/anvil-900.webp` | 325121139 | Forge — the blank at heat on the anvil (also `forge.html`) |
| `img/grain.webp`, `img/grain-900.webp` | 543636323 | Edge — the full-bleed steel macro |
| `img/og.webp` | 131647393 | Tighter 1.91:1 crop of the graded hero |
| `img/favicon.svg` | — | Drawn, not licensed |
| `../../img/forge-hamon-sm.webp` | — | 960×600 homepage screenshot for the hub card |

## The grade

Stock blacksmithing photography arrives graded amber — it is the library
default for the subject. This site is steel, not bronze, so `tools/grade.mjs`
runs one ffmpeg pass per plate that does the same thing four ways: blue lifted
into the shadows, global saturation pulled down, highlights left warm so the
hot core survives as the only chroma in frame.

`anvil` needed more than the others: its anvil body and whole background read
khaki straight out of the library, so yellow is cut at the source with
`selectivecolor` (reds untouched, so the blade keeps its heat) before the
standard cool-shadow pass. The result is a neutral dark shop with one orange
object in it, which is what the palette in `DESIGN.md` claims.

All exports are WebP q78 (q80 for `og`), Lanczos downsample, light unsharp.
Raw JPEGs live in `tools/raw/` on the build machine and are not shipped.

## No faces

There is no readable human face anywhere on this site, and no close-up of a
bare hand. The nearest a person comes is a gloved hand on a pair of tongs at
the right edge of `anvil`, which was kept because tools being held is the
subject. That is the ceiling, and it is stated in `DESIGN.md` as a rule rather
than an outcome.

## Generated imagery

None. The Gemini image path this repo normally uses
(`tools/gen.mjs`, kept in place with its prompt set) returned
`RESOURCE_EXHAUSTED` on `nano-banana-pro-preview`, `gemini-3.1-flash-image` and
`gemini-2.5-flash-image` — prepayment credits are depleted — so the set was
sourced from licensed stock instead, per the asset decision order in
`VIDEO-POLICY.md`. No video was generated.

## What is computed and what is written

The fold table computes every figure it shows from `42 mm / (7 · 2ⁿ)`; nothing
in it is typed, including the 8 µm etch limit's consequences. The commission
sheet derives height, weight and guide price from each shape's real ratio,
spine thickness and base — the same numbers printed on `blades.html`, so the
two pages cannot drift apart. The mail link composes a specification and hands
it to a mail client; there is no backend, nothing is submitted, and the page
does not pretend otherwise.
