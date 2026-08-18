# SEJUK — image credits

Two families of imagery, one cold light, one identical grade pass
(`gen/grade.sh`: saturation 0.97, contrast 1.03, cool balance rs −0.02 /
bs +0.02, lanczos scale, light unsharp) so the whole site reads as a
single shoot.

## 1. The desserts — generated

Product photography was generated on **18 August 2026** with Google's
**Nano Banana 2** (`nano_banana_2`, served as `nano_banana_flash`) via the
Higgsfield API — the originally planned direct Gemini route
(`nano-banana-pro-preview` / `gemini-3.1-flash-image`) had returned HTTP 429
for the whole of the original build session, which is what left this template
unfinished. Square frames were generated at 2K and the wide frames at 2K–4K,
then graded and exported to WebP at 800 px and 400 px squares (hero and wide
frames at up to 2560 px).

They read as one photographer because a single STYLE block was repeated
**verbatim** across every prompt — pale frost-blue seamless, soft cold
daylight from the upper right with one shadow falling lower left, cool
backlight rim, 100 mm macro at f/8, eye-level three-quarter view,
condensation on every cold surface, and an explicit ban on text, numerals,
logos and labels. Only the subject sentence changed. All eight ices share
the same footed stainless bowl clause; the warm counter shares the same
stoneware plate clause.

**Per-file model attribution:** every frame in both tables below was
generated with `nano_banana_2` at 2K, except `hero-pour` and `ice-texture`,
which were re-rolled at 2K after 4K attempts failed, and `sharing-spoons`,
which returned 5504x3072. `hero-pour` took three attempts — the first two
failed outright — and its final subject sentence is lightly rephrased from
`gen/PROMPTS.md` (the shared STYLE block is untouched, per the house rule).
`syrup-bottles` carries an extra clause forcing the kraft label bands to be
completely blank; it is the frame most prone to inventing lettering.

No frame was rejected for breaking the set: all fifteen held the same bowl,
background and light direction on the first accepted generation.

| File(s) | Subject |
| --- | --- |
| `img/gunung-pandan-*.webp` | Gunung Pandan — pandan milk-snow, gula melaka pour |
| `img/bandung-monsoon-*.webp` | Bandung Monsoon — rose snow, basil-seed rain |
| `img/malt-avalanche-*.webp` | Malt Avalanche — malt snow, chocolate rubble |
| `img/chendol-glacier-*.webp` | Chendol Glacier — coconut snow, chendol, red beans |
| `img/soursop-squall-*.webp` | Soursop Squall — soursop granita, calamansi |
| `img/mango-sticky-peak-*.webp` | Mango Sticky Peak — coconut snow, mango, toasted rice |
| `img/kopi-tarik-summit-*.webp` | Kopi Tarik Summit — kopi snow, toast cubes |
| `img/lychee-kacang-*.webp` | Lychee Kacang — lychee snow, attap chee, grass jelly |
| `img/ondeh-mochi-*.webp` | Ondeh Trio — warm pandan mochi |
| `img/gula-waffle-*.webp` | Gula Butter Waffle |
| `img/tang-yuan-*.webp` | Ginger Tang Yuan |
| `img/syrup-bottles-*.webp` | The three take-home syrups, blank kraft labels |
| `img/hero-pour-*.webp` | Hero — gula melaka ribbon pouring onto pandan snow |
| `img/sharing-*.webp` | Berdua — two spoons breaking one pink ice |
| `img/ice-texture-*.webp` | Full-frame macro of shaved ice ribbons |

## 2. Textures & the block — licensed photography

Licensed from Adobe Stock (free tier, standard licence), each verified
`isGenTech: false` at search time. Full-resolution licensed originals were
downloaded — never search thumbnails — then graded through the same pass.

| File(s) | Adobe Stock ID | Description |
| --- | --- | --- |
| `img/iceblock-{800,1600}.webp` | 418138325 | A crystal-clear ice block on a reflective surface — the house story |
| `img/streaks-1600.webp` | 294307702 | Condensation running down glass — the ink band underlay |
| `img/powder-1600.webp` | 391857012 | Powder-snow crystals — spare band ground |
| — (licensed, unused) | 81523501 | Neutral droplet texture; licensed as a fallback, not shipped |

### Considered and rejected

| Adobe Stock ID | Why |
| --- | --- |
| 409982564 | Cracked-ice panorama, far too dark and blue for the frost ground |
| 301227480 | Hoarfrost macro, saturated blue that fought the palette |
| 1066262090 | Ice block, flagged `isGenTech: true` — real photography preferred |

## Marks

The SEJUK peak favicon and the ° wordmark device are inline SVG/typography.
No image assets are involved.
