# STRAKE — image provenance

STRAKE is a **fictional business**. Strake Coachworks, the Carvel, the Bowline,
Edwin and Anna Strake, the yard's history, every date, price, specification,
address, phone number and email on the site are original to this template. No
real marque's identity, imagery, product names or prices are used. The places
and boats in the photographs are real; the yard that claims them is invented.

## The car — rendered, not photographed and not generated

The Carvel does not exist, so no photograph of it does. The brief's default
(a Higgsfield product render) was not reachable from this session — the
Higgsfield connector exposed only its 3D-scene tools, and the catalogue's
fallback (Gemini image generation via the repo's `.env`) returned HTTP 402,
prepaid credits depleted. Rather than pass off a real car's stock photo as an
invented one, the car was **modelled and rendered from scratch in Blender 5.2**:
`tools/carvel.py` lofts the body as a hull of thirteen cross-sections, cuts the
arches, grille, lamps and shut lines, builds the wheels, the bronze strake and
the canopy, lights a white studio and renders with Cycles (OptiX) to a
transparent PNG so the page's own off-white shows through. The same script
renders every configurator combination — five paints, two wheel finishes — so
the configurator swaps real renders, not tinted copies. No AI image generation
of any kind is used anywhere on this template.

| Render | Exported as | Used on |
|---|---|---|
| `hero-solent.png` (3600 × 2025, 256 samples) | `hero-carvel-{2400,1600,1000}`, `og-1200`, `d-strake`, `h-2019` | Hero; social card; "The strake" detail; 2019 heritage chapter |
| `cfg-{paint}-{wheels}.png` × 10 (2400 × 1350, 128 samples) | `cfg-{paint}-{wheels}-{1600,1000}` | Configurator |

Masters live in `tools/raw/` (gitignored); `tools/render-all.sh` regenerates them.

## Photography — licensed Adobe Stock (free tier)

Twenty-four photographs were searched, licensed and downloaded on
**22 September 2026** through the Adobe Stock connector, free-tier assets only
(licence state `just_purchased`, no credit cost). Every asset was checked to be
`isGenTech: false` — no AI-generated imagery is used anywhere on this template.
Originals ran 3 000–8 256 px on the long edge; every export is cropped and
downsampled from the full-resolution licensed file by `tools/grade.py`, never
from a search thumbnail. Nothing licensed is unused.

| Adobe Stock ID | Exported as | Used on |
|---|---|---|
| 604839569 | `h-1921` | Heritage, 1921 |
| 214376332 | `h-1929` | Heritage, 1929 |
| 541845545 | `h-1934` | Heritage, 1934 |
| 635976127 | `h-1952` | Heritage, 1952 |
| 431900872 | `h-1968` | Heritage, 1968 |
| 619449328 | `h-1979` | Heritage, 1979 |
| 516877061 | `h-2014` | Heritage, 2014 |
| 546849280 | `h-2026` | Heritage, 2026 |
| 542481759 | `d-bucks` | "The bucks" detail |
| 223283429 | `d-bronze` | "The bronze" detail |
| 420883852 | `m-bronze` | Materials, bronze |
| 509705313 | `m-mahogany` | Materials, mahogany |
| 309233242 | `m-sailcloth` | Materials, sailcloth; configurator, sailcloth seats swatch |
| 307314752 | `m-hide` | Materials, hide; configurator, tan hide swatch |
| 325779682 | `m-peat` | Configurator, peat hide swatch |
| 127141697 | `m-bronze-fine` | Configurator, cast bronze wheels swatch |
| 440034312 | `p-coast` | Press, "The Bowline" |
| 159224995 | `p-hammer` | Press, "Hull 200" |
| 659465069 | `p-v8` | Press, "A V8 for people who count to eight" |
| 523360026 | `band-coast` | The coast band |
| 269507635 | `y-hands` | "Come to the shed" |
| 530007638 | `y-builder` | "Come to the shed" |
| 381121587 | `y-rope` | "Come to the shed" |
| `img/favicon.svg` | — | Drawn: a hull section crossed by its strake |

The heritage chapters are shown in a single grade (`filter: grayscale(1)
sepia(.22)`) applied in CSS; the exported files are the photographers' colour.

The full-resolution originals live in `tools/raw/` on the build machine and
are gitignored; `tools/grade.py` documents every crop.
