# VELA — image and media provenance

VELA Observatory & Sky Centre is an original template. The institution, its instruments,
programme, prices, staff numbers and all copy are written for this template. No real
observatory's identity, branding or data is used.

This file is the provenance record for the repository. Per the collection's content policy it
is deliberately **not** surfaced in the site's own page copy.

## Licensed photography — Adobe Stock

Seven frames, all licensed on **11 August 2026** through the Adobe Stock free collection under
the Adobe Stock **standard licence**, which permits commercial use and derivative works in a
website design. Every one was checked for `isGenTech: false` — none is AI-generated stock. The
full-resolution licensed file was downloaded in each case; the search thumbnail was never used.

| File | Stock ID | Subject |
|---|---|---|
| `img/hero-dome.webp` | 142779058 | Observatory dome under the Milky Way, long exposure — the hero |
| `img/research-array.webp` | 234585655 | Radio telescope dishes against the night sky |
| `img/learning-family.webp` | 482442349 | Adult and child in silhouette at a telescope |
| `img/reserve.webp` | 210647908 | Milky Way over a mountain ridge with low cloud |
| `img/eyepiece.webp` | 122603058 | A person at a telescope eyepiece under stars |
| `img/pleiades.webp` | 408828487 | The Pleiades cluster with surrounding nebulosity |
| `img/fell-silhouette.webp` | 325958915 | Lone figure on moorland beneath the Milky Way |

### Licensed and rejected

Five further frames were licensed and then cut after building a contact sheet on the page's own
background colour. Recording them here so the same ground is not covered twice:

| Stock ID | Why it was cut |
|---|---|
| 319341680 | Crushed to near-black once graded; carried almost no readable subject |
| 164117776 | A warm orange sunset — the only warm frame in an otherwise cold set, and it broke it |
| 199777843 | Saturated purple star trails; 756 KB for one decorative band |
| 220918345 | A bright green daytime park with a pink shirt, by far the loudest frame on the page |
| 627868871 | Effectively featureless after grading |

## Generated interiors — Gemini

Stock has no free-licence photographs of an observatory dome interior, a planetarium mid-show, a
plate archive or a red-lit control room, so those six frames were generated on **11 August 2026**
through the Gemini API from prompts written for this template. All six came from
`gemini-3.1-flash-image`; `nano-banana-pro-preview` returned HTTP 503 on every attempt.

| File | Subject |
|---|---|
| `img/dome-night.webp` | The 1.2 m through an open dome shutter, red safelighting |
| `img/planetarium.webp` | The planetarium theatre during a show |
| `img/refractor.webp` | The 1908 refractor in its wooden dome |
| `img/control.webp` | The control room at night |
| `img/plates.webp` | The photographic plate archive and light box |
| `img/gallery.webp` | The instrument gallery, lit vitrines |

One style brief was repeated **verbatim** in all six prompts — 35 mm at f/2, long exposure, deep
red safelighting as the only warm source against blue-black night, heavily desaturated,
documentary rather than promotional. That repetition is why the six read as one building on one
night instead of six unrelated rooms.

Lettering was explicitly forbidden in every prompt ("no text, no numbers, no logos, no signage;
all markings must be abstract lines and dots"). Generated text arrives as gibberish and would
have destroyed the illusion at any zoom. The plate-archive drawers accordingly carry empty brass
card holders rather than labels.

## Video

`video/hero.mp4` and `video/hero.webm` are a slow push across the licensed hero frame
(Stock 142779058), rendered with ffmpeg and graded through the same pass as the stills, so the
video and its poster are the same photograph. The Adobe Stock standard licence covers this
derivative use. No separately licensed footage is involved.

The first encode came out at 6.3 MB: the source is a long-exposure frame full of real sensor
grain, and grain is temporally random, so every frame codes as new information. An `hqdn3d` pass
before the encoder cut it to 1.17 MB (MP4) and 640 KB (WebM) with no visible loss in a dark
background loop.

## Grading

Every frame, licensed and generated alike, went through one identical pass: saturation to 0.72,
a slight contrast lift, brightness to 0.88, the shadows blended 30% toward the page's own
`--night` value so a photograph's edge never reads as a hole punched in the page, and a whisper
of blue in the midtones. Doing this once for the whole set, rather than per image, is what makes
licensed stock and generated interiors sit together.

## Fonts

Spectral, Public Sans and Azeret Mono, served from Google Fonts under the SIL Open Font License.

## Everything else

The site's code, the astronomy engine, the star catalogue values, the layout, the copy and the
identity are original to this template. Star positions and magnitudes are standard published
J2000 catalogue values, which are not copyrightable as facts.
