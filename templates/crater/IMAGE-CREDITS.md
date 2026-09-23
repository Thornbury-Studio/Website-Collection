# CRATER — image, footage and font provenance

CRATER is an invented brand. Its name, bag, prices, dates, email address and
copy are original to this template. Place names, altitudes, varieties and the
volcano are real and are used only the way any roaster's site would use them;
no real farm, cooperative, producer or roastery is named or implied. Sourced
per the brief's order: Unsplash, Pexels and Pixabay first; Adobe Stock's free
tier was also searched for bloom footage and had nothing usable. Only the bag,
which cannot exist as a stock photo, was generated.

## Footage — Pexels (Pexels License)

Three clips, cut into one 45.0 s film at 1× speed by `tools/film.sh` (the
first stabilised by `tools/track_a.py`), graded to one colour, encoded to
`video/bloom-1080.mp4` (13 MB, 2.3 Mbit/s) and `video/bloom-720.mp4` (5.7 MB).
Masters downloaded 23 Sep 2026 from Pexels' public download endpoint
(`https://www.pexels.com/download/video/<id>/`) into `tools/raw/pexels/`
(gitignored).

| Clip | Master | Used as |
|---|---|---|
| [36841913](https://www.pexels.com/video/36841913/) | 3840×2160, 50 fps | 0:00–0:10.6 — top-down V60: dry bed, the pour, the swell |
| [4098417](https://www.pexels.com/video/4098417/) | 3840×2160, 24 fps | 0:10–0:30.6 — macro: bubbles breaking through the crust |
| [9423395](https://www.pexels.com/video/9423395/) | 3840×2160, 29.97 fps | 0:30–0:45 — top-down: the bed settles, the foam thins |

**Licence check, stated plainly.** Pexels has one licence for everything it
hosts (free commercial use, modification allowed, no attribution required; no
premium tier). The three clip pages themselves could not be opened from this
machine on 23 Sep 2026: Pexels served a bot-verification page, and it was not
bypassed. The creator names are therefore not recorded here; they are on each
clip's page above. Re-check those three pages before this template is reused
for a paying client.

Stills cut from the finished film: `img/bloom-0-*.webp` (the dry bed, the
poster), `img/bloom-5-480.webp`, `img/bloom-20-480.webp`,
`img/bloom-40-480.webp` (one per phase, on the ruler).

Considered and rejected: Pexels 7118151 (a thin kettle stream in most
frames), 4098414 (soft at 1:1), 31598838 (a pot boiling on a stove, not a
bloom), 5540802 series (HD only, busy granite counter).

## Photography — Unsplash (Unsplash License)

Each photo checked individually on 23 Sep 2026 through Unsplash's own API:
`premium: false` (not Unsplash+), location as listed. Full-resolution
originals in `tools/raw/unsplash/` (gitignored), cropped and graded by
`tools/grade.py`.

| File | Unsplash ID | Photographer | Location (per Unsplash) | Used as |
|---|---|---|---|---|
| `img/fuego-*.webp` | [KRttQCXUjNI](https://unsplash.com/photos/KRttQCXUjNI) | Gary Saldana | Chimaltenango, Guatemala | Origin, full bleed: Fuego venting ash |
| `img/fuego-dawn-*.webp` | [7ifAlWtYULs](https://unsplash.com/photos/7ifAlWtYULs) | Alicia Kranjc | Acatenango, Guatemala | Origin, phones: the same cone at dawn |
| `img/slope-*.webp` | [HbYVjIiRrBU](https://unsplash.com/photos/HbYVjIiRrBU) | Guillermo de Manuel | Acatenango, Guatemala | Origin: Fuego's upper cone |
| `img/cherries-*.webp` | [W1VqcpcnSHk](https://unsplash.com/photos/W1VqcpcnSHk) | Gerson Cifuentes | Tajumulco, Guatemala | Origin: cherries ripening |
| `img/beans-*.webp` | [mQrhnVh9ALk](https://unsplash.com/photos/mQrhnVh9ALk) | Max Böhme | — | Why: two roasted beans |

Downloaded, not placed: Yx1XkPYUBss (green beans, Battlecreek Coffee
Roasters), cIcjRRcKRXI (Fuego over a dry riverbed, Daniel Castellón),
SfY0zJRNLJA (a cone of dust on white, Zach Lucero — left out because nothing
says it is volcanic ash, and the page would have implied it).

Rejected: two aerial craters that would have rhymed with the porthole —
3_WfbuGPF1I (Calderón Hondo, Fuerteventura) and fhudqmMoWHM (Iceland) —
because placing them in an Acatenango section would misstate where they are.

## Generated — the bag (Higgsfield)

`img/bag-*.webp` — Higgsfield, model `nano_banana_pro`, 4K, 4:5, one
generation, kept on first inspection (4 credits). Job
`17ddd7fb-252d-48a1-ba6e-f17387c4f693`, 23 Sep 2026. Inspected at 1:1: the
word CRATER is spelled correctly, no other text or marks appeared, the valve
reads as a real one-way valve. Master: `tools/raw/higgsfield/bag-17ddd7fb.png`
(gitignored). The only change after generation is a crop and resize; the
page feathers its backdrop with a CSS mask. Prompt, verbatim:

> Studio product photograph of a single standing coffee bag. SUBJECT: one flat-bottomed (box-bottom) coffee bag, 250 gram size, made of thick matte uncoated paper in a deep volcanic clay red (colour close to #9E3B22, like iron-rich red scoria, NOT orange, NOT pink), crisp heat-sealed flat top edge, subtle vertical paper texture and soft natural creases at the gussets. On the front, centred in the upper half, one rectangular matte off-white paper label (warm off-white, close to #F4EEE6) with slightly soft edges. The label carries exactly one word printed in large, bold, wide, extended sans-serif capital letters in dark espresso brown ink: CRATER. Below the word, one thin horizontal espresso-brown line. Nothing else is printed anywhere. Near the top of the bag, above the label, one small round one-way degassing valve in the same clay red, slightly raised. In front of the bag on the floor lie three whole roasted coffee beans, medium-light roast, one of them showing its centre crease. ENVIRONMENT: seamless curved paper backdrop in a pale warm mineral off-white (close to #F2ECE3), no horizon line, no table edge. COMPOSITION: portrait frame, bag centred horizontally, bag height about 55 percent of the frame, base of the bag at about 80 percent of the frame height, generous empty space above. LIGHTING: soft diffused north-window daylight from the upper left, gentle soft shadow falling to the lower right, delicate highlight along the left edge of the bag, true-to-life colour. CAMERA: 85mm lens at bag height, rotated about 12 degrees so the front and a sliver of the right-hand gusset show, everything in sharp focus. CONSTRAINTS: the only text in the image is the single word CRATER on the label, spelled C-R-A-T-E-R, clean and correctly spelled; NO other words, NO numbers, NO barcode, NO logo mark, NO stickers, NO stamps, NO QR code; no people, no hands, no cups, no steam, no plants, no other props.

(It drew four beans, not three, and a condensed rather than extended face;
both were kept, and the site's wordmark was set to match the label.)

## Font

`fonts/mona-sans-latin.woff2` — Mona Sans by GitHub, SIL Open Font License
1.1, variable (wdth 75–125, wght 200–900), latin subset as served by Google
Fonts, self-hosted.

## Drawn

`img/favicon.svg` — drawn for this template. `img/og-1200.webp` and
`../../img/crater-sm.webp` (the hub thumbnail) are screenshots of this page.
