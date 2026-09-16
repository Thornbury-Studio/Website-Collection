# FIRST CRACK — image and footage provenance

FIRST CRACK is a **fictional business**. The roastery, its bags, its
prices, its dates, its email addresses, its roast log and every quotation
on the site are original to this template. Origin, region, process and
variety names are real coffee-trade terms used the way any roaster's site
would use them; no real farm, cooperative, washing station or roastery
is named or implied. The reference images in the brief (a Behance coffee
landing page and several pins) were not licensed and are not reproduced:
no layout, wordmark, photograph or menu from them appears here.

## Footage — licensed Adobe Stock (free tier)

Four clips were searched, previewed through their public preview
renditions, licensed and downloaded on **16 September 2026** through the
Adobe Stock connector, free-tier assets only (licence state
`just_purchased`, no credit cost). Every asset was checked to be
`isGenTech: false`. Every export is cut, graded, looped and encoded from
the licensed master, never from a preview.

| File | Adobe Stock ID | Master | Used as |
|---|---|---|---|
| `video/hero.mp4`, `-sm`, `img/hero-poster.webp` | 484266104 | 3840×2160 ProRes | Home hero: the cooling tray, arm turning |
| `video/roast.mp4`, `-sm`, `img/roast-poster.webp` | 515590024 | 4096×2304 MJPEG | The roast: smoke lifting off beans |
| `video/scatter.mp4`, `-sm`, `img/scatter-poster.webp` | 472143423 | 3840×2160 ProRes | Subscription: beans across a dark counter |
| `video/pour.mp4`, `-sm`, `img/pour-poster.webp` | 525370684 | 3840×2160 ProRes | Freshness: a cup poured in backlight |

Exports are H.264 at 1920×1080, crf 27–28, with a 960-wide version for
phones. Every clip is a seamless loop: the tail is cross-faded into the
head (see `tools/encode.mjs`). The four clips together weigh about 18 MB
at 1080p and 6.5 MB at 960.

## Photography — licensed Adobe Stock (free tier)

Seventeen photographs, same day, same terms. Originals ran 4 000–7 929 px
on the long edge; every export is downsampled from the licensed file.

| File | Adobe Stock ID | Used as |
|---|---|---|
| `img/bag-gloss.webp`, `-700` | 263973890 | Hero bag: a glossy black pouch, cut out |
| `img/bag-matte.webp`, `-700`, `img/bag-matte-side.webp`, `-700` | 551500307 | The product bag: a matte black flat-bottom pouch, front and side, cut out |
| `img/bag-kraft.webp`, `-700`, `img/bag-kraft-side.webp`, `-700` | 128358358 | The blend and the subscription bag: a kraft pouch, front and side, cut out |
| `img/green.webp`, `-1400`, `-800` | 290419421 | Bags section: green coffee spilling from a burlap sack |
| `img/morning.webp`, `-1400`, `-800` | 452446137 | Notes: a cup on a wooden table in morning light |
| `img/hopper.webp`, `-1400`, `-800` | 198707303 | Roastery: beans going into the hopper |
| `img/sack.webp`, `-1400`, `-800` | 377913992 | Origins hero: hands holding a sack of green coffee |
| `img/split.webp`, `-1400`, `-800` | 1878901703 | Origins: green against roasted |
| `img/dripper.webp`, `-1400`, `-800` | 580435224 | Origins, brewing: pour-over on a wooden table |
| `img/cylinder.webp`, `-1400`, `-800`, `img/og.webp` | 272645455 | Share image (1.91:1 crop of the cooling cylinder) |
| `img/brew.webp`, `-1400`, `-800` | 603875080 | Licensed and graded; not placed |
| `img/slate.webp`, `-1400`, `-800` | 296202842 | Licensed and graded; not placed |
| `img/smoke.webp`, `-1400`, `-800` | 289223913 | Licensed and graded; not placed |
| `img/bagging.webp`, `-1400`, `-800` | 1064147071 | Licensed and graded; not placed |
| `img/roaster.webp`, `-1400`, `-800` | 449430750 | Licensed and graded; not placed |
| `img/beans.webp`, `-1400`, `-800` | 277515109 | Licensed and graded; not placed |
| `img/lowlight.webp`, `-1400`, `-800` | 283875300 | Licensed and graded; not placed |
| `img/favicon.svg` | — | Drawn, not licensed |
| `../../img/first-crack-sm.webp` | — | 960×600 homepage screenshot for the hub card |

## The cutouts

The three bag photographs were sent to Adobe's remove-background service
(`image_remove_background`, a subject cutout, not a generative tool) from
their licensed full-resolution URLs. The returned PNGs were cropped into
single bags, padded and exported as alpha WebPs by `tools/cut.py`. The
printed label on every bag is HTML, drawn over the image; the bags
themselves are blank in the photographs.

## The grade

One warm temperature for everything (`tools/grade.mjs`, `tools/encode.mjs`):
saturation held at 0.75–0.85, contrast eased up, a touch of warmth pushed
into shadows and highlights, nothing lifted or crushed. Contrast for text
is not in the grade; the glass panels meter it at runtime.

## Faces

One plate carries a person, from behind: the roaster at the hopper. The
hands in the origins hero are anonymous. No face is used as a stand-in
for a named person; no person on this site is named except in the notes,
which are fictional first names.

## Generated imagery

None. No image-generation or video-generation tool was called at any
point, and no credits were spent.

## Open

Seven plates were licensed for sections that were cut or merged (a
brewing guide with its own plate, a bagging step in the freshness
section, a roaster plate for the story). They are graded and in `img/`,
and they are the right plates if those sections come back. What the set
does not have: the roastery's own room, and a person at the cupping
table. A client build would shoot both.
