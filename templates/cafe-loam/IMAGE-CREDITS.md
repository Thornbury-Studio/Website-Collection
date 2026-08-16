# LOAM — image credits

Two families of imagery, one palette.

## 1. Menu items — generated (16 frames)

Every item photograph was generated with Google's `nano-banana-pro-preview`
at 4K (4096×4096, 1:1), then graded and exported to WebP at 800px and 400px.

They read as one photographer because a single STYLE block was repeated
**verbatim** across all sixteen prompts — overhead flat lay, warm oatmeal
matte-ceramic surface, soft north daylight from the upper left with one shadow
falling lower right, 100mm macro at f/8, generous bare margin, and an explicit
ban on text, numerals, logos and labels. Only the subject sentence changed.

Grade: centre-cropped 4096 → 3600 (to bring each subject forward), then
`eq=saturation=1.02:contrast=1.03` with a whisper of warmth
(`colorbalance=rs=0.01:bs=-0.015`), lanczos downscale, light unsharp.

`espresso · cortado · flat-white · filter · cold-brew · espresso-tonic ·
matcha · chai · cocoa · croissant · cardamom-bun · banana-bread · cookie ·
avocado-toast · granola · toastie`

## 2. The place — licensed photography

Licensed from Adobe Stock (free tier, standard licence), each verified
`isGenTech: false` at search time. Full-resolution licensed originals were
downloaded — never the search thumbnails.

Graded toward the item set's warm oat so the two families sit together:
`eq=saturation=0.96:contrast=1.02`, warm balance
(`rs=0.03 gs=0.005 bs=-0.035`), gentle contrast curve.

| File(s) | Adobe Stock ID | Description |
| --- | --- | --- |
| `img/hero-pull-{800,1600,2560}.webp` | 347482117 | Espresso extracting from the group head into two white cups — the hero |
| `img/pour-{800,1600}.webp` | 512542913 | Milk poured from a steel jug into a cup of espresso |
| `img/counter-{800,1600}.webp` | 320649333 | A barista steaming milk, seen across the counter |
| `img/beans-{800,1600}.webp` | 277515109 | Full-frame roasted coffee beans, used as a band ground |

### Considered and rejected

| Adobe Stock ID | Why |
| --- | --- |
| 282222400 | Café interior carrying a legible chalkboard menu — another business's wording on our wall |
| 315340623 | Green-and-orange interior lighting, nowhere near the oat palette |
| 579720245 | Cluttered, dated styling |
| 310824298 | Deliberately defocused mock-up plate |

## Marks

The LOAM cup mark and the favicon are drawn inline as SVG; the roast meters
and mood faces are CSS and inline SVG. No image assets are involved.
