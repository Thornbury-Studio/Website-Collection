# THORNBURY DIGITAL v5 — asset credits

Everything is self-hosted. The collection CSP is `default-src 'self'`
(`media-src 'self'` on this template's pages), so hotlinking a stock host would
be blocked at load time.

## Hero film

The backdrop behind the field: the Moon, from NASA. Public domain, zero
licensing risk, and real data — the disc is rendered from Lunar Reconnaissance
Orbiter imagery and elevation, at the Moon's true phase, libration and apparent
size for every hour of 2026. NASA asks for a credit line and gets one.

| File | Source | Credit |
|---|---|---|
| `video/hero.mp4` · `hero-lg.mp4` · `hero-m.mp4` | [Moon Phase and Libration, 2026](https://svs.gsfc.nasa.gov/5587) — plain (unlabelled) 4K, `phases_2026_plain_2160p30.mp4`, 3840×2160, 30 fps, hourly frames from 1 Jan 2026 00:00 UTC | NASA's Scientific Visualization Studio. Visualizer Ernie Wright (USRA); planetary scientist Noah Petro (NASA/GSFC); producer James Tralie (eMITS) |

Downloaded 7 Sep 2026 as a 20 s byte-range pull around the September full
moon (`src/moon2026-part.mp4`, gitignored) rather than the 300 MB whole.

**Why the Moon, and why this Moon.** The brief asked for a real space subject
with instant recognition and scale, NASA archives first. Candidates read:
Earth from the ISS (jsc2021m000138, real 4K) — grand, but a horizon, not one
object, and blue and white in a site with no third hue; the Mercury transit
(GSFC 2016, 4K) — a sun that reads as a moon once it is grey; the Tour of the
Moon 4K Redux (SVS 4619) — flyovers, so surface again. The libration
visualization is the one clear object: the whole disc, real, at true scale,
and it is monochrome by nature, so the site's palette costs it nothing.

**The cut.** The fullest frame in the pulled window (highest mean luminance)
is taken as the centre and 48 frames either side — two days each way, so the
terminator never shows — play forward then backward: 190 frames at 24 fps,
7.9 s, the last frame one ordinary step from the first, so the plain `loop`
attribute never cuts. The disc is composed low in the encode (`pad` 540 px
of black above the 4K frame, then crop back to 16:9), so its top edge sits at
a third of the frame and the centred type stands in the black above it; the
only motion added is a 28 s CSS push-in. `eq=contrast=1.04`, Lanczos scale,
`cas=0.35`, H.264 high, faststart, no audio.

| File | Encode | Size | Serves |
|---|---|---|---|
| `video/hero.mp4` | 1920×1080, CRF 23, 2.6 Mbps cap | 1.36 MB | 761–1799 px |
| `video/hero-lg.mp4` | 2560×1440, CRF 24, 4.2 Mbps cap | 1.88 MB | 1800 px and up |
| `video/hero-m.mp4` | 1080×1920 portrait — the frame scaled to 1400 wide, padded, the middle 1080 columns kept, so the whole disc shows at ~64 % of the width with the type above it | 0.73 MB | 760 px and below |

Posters are the first frame of the 1080p and portrait encodes (`img/poster-hero.webp`, `img/poster-hero-m.webp`); the 1440p tier shares the landscape poster.
Every reference carries `?v=3` so no browser replays the ferrofluid or the
earlier moon from its cache. The ferrofluid (Pexels 16296848, Film Composite)
shipped for part of 7 Sep 2026 and was retired the same day: well made, but
an abstract macro reads as texture, not as a thing, on first glance.

## The second look (Studio)

Two renders of one composition, supplied by the studio on 7 Sep 2026 and
upscaled 4× with Upscayl to 4096×2288: a photoreal black hole and its
wireframe schematic. The schematic was generated with annotation labels and
leader lines, which were stripped before upscaling on purpose — they are
rebuilt on the page as live SVG lines and decoder-resolved text
(`js/reveal.js`), not baked pixels. Served as `img/reveal-surface.webp` and
`img/reveal-wire.webp` at 2560×1430 (75 kB / 295 kB) with 1280-wide variants
for phones.

## Transition footage

Sourced, not generated — the asset order in `VIDEO-POLICY.md` starts with real
licensed footage, and both of these were found rather than made. Pixabay Content
License: free for commercial use, no attribution required, credited here anyway.
Downloaded 4 Sep 2026.

| File | Source | Pixabay ID | Master |
|---|---|---|---|
| `video/ink.mp4` | [Transition, brush, black](https://pixabay.com/videos/transition-brush-black-white-23324/) | 23324 | 3840×2160, 30 fps, 5.03 s |
| `video/warp.mp4` | [Ripples, waves, metallic](https://pixabay.com/videos/ripples-waves-metallic-60195/) | 60195 | 1920×1080, 24 fps, 25 s |

Eighteen candidates were pulled as `_tiny` previews and read off one contact
sheet before either of these was downloaded at size; the masters are kept under
`video/src/`, which this directory's own `.gitignore` excludes.

**`ink.mp4` is a matte, not a picture.** A luminance sweep of the master put the
usable action at 0.7 s–3.4 s (mean Y 13 → 237), so the encode takes 0.60 s–3.50 s,
speeds it up 2.4× to 1.27 s, converts to grey and stretches the levels
(`clip((val-34)*1.62)`) so the first frame is black and the last is white end to
end. It is drawn through an SVG `feColorMatrix type="luminanceToAlpha"` so its
brightness becomes alpha — the ink strokes erase the previous page. 960×540 at
CRF 25 is 87 kB, which is all a matte needs.

**`warp.mp4` is a displacement source.** It is read at 36×20 and only its
luminance gradient is used, so it is encoded grey at 384×216, CRF 27, 5 s: 155 kB.
Nothing in it is ever shown.

## The Team band — a lit point cloud

Real photographs, licensed, and never drawn. Each form reads one asset, a
`team-pack-*.webp` that carries a surface normal in R and G and depth in B.
There is no albedo file any more: **none of the photograph’s colour reaches the
page.** All that survives the build is where the subjects are and which way their
surface faces, and every point is lit from those two facts alone. Faces, clothing
and identity leave with the albedo, which is why nobody in the source can be
recognised on the page — and why the band reads as four smooth rim-lit volumes
rather than as a photograph of people.

| File | Source | Photographer | Licence |
|---|---|---|---|
| `img/team-pack-8.webp` — 01, binoculars | [Pexels 9143802 — Man standing on sandy terrain using binoculars](https://www.pexels.com/photo/9143802/) | credited on the photo page | **Pexels License**; downloaded 7 Sep 2026 |
| `img/team-pack-9.webp` — 02, at the board | [Pexels 7869061 — Man presenting business data on a whiteboard](https://www.pexels.com/photo/7869061/); the board and its stand, which the cut-out treated as background, are put back into the matte by polygon | credited on the photo page | **Pexels License**; downloaded 7 Sep 2026 |
| `img/team-pack-10.webp` — 03, at the laptop | [Pexels 5301762 — Woman using a laptop on a standing desk](https://www.pexels.com/photo/5301762/); cut to the figure, the laptop on its stand and the desk top, the railing and lamp behind removed | credited on the photo page | **Pexels License**; downloaded 7 Sep 2026 |
| `img/team-pack-11.webp` — 04, the handover | [Pexels 6818155 — A delivery man hands a package to a customer](https://www.pexels.com/photo/6818155/) | credited on the photo page | **Pexels License**; downloaded 7 Sep 2026 |
| `img/team-pack-7.webp` — 01, behind a camera | [Pexels 8114141 — Person photographing by a brick wall](https://www.pexels.com/photo/8114141/), cropped to the figure | credited on the photo page | **Pexels License**; downloaded 7 Sep 2026 |
| `img/team-pack-2.webp` — 02, the two listening | [Pexels 7652461 — Women discussing while standing](https://www.pexels.com/photo/women-discussing-while-standing-7652461/) | [Thirdman](https://pexels.com/@thirdman/) | **Pexels License**; downloaded 7 Sep 2026 |
| `img/team-pack.webp` — 03, the review at the table | [Unsplash photo yM3blOV977Q](https://unsplash.com/photos/yM3blOV977Q) | [Vitaly Gariev](https://unsplash.com/@silverkblack) | **Unsplash License** — "Free to use under the Unsplash License", read off the photo page before download |
| `img/team-pack-6.webp` — 04, carrying it away | [Pexels 7217919 — Person walking with a box](https://www.pexels.com/photo/7217919/) | credited on the photo page | **Pexels License**; downloaded 7 Sep 2026 |

**Four scenes, one at a time (7 Sep 2026).** The stage runs the studio's
four-step process as a sequence: each step is a tableau of two forms, the
first chosen because the prop is part of its silhouette — binoculars up, a
board being pointed at, a laptop under two hands, a box between two people
— since a figure alone reads as a person, not an action; the second gives
the step company. One scene holds, then every point travels to its place in
the next. Each pack is traced to a point budget counted against the pixels
actually inside its matte (an earlier pass guessed the fraction and starved
the small packs). Retired and no longer in the repository: the walker
(Pexels 13474407), the raised hand (4918523) and the figure from behind
(7223491); the plant-carrier (7218686) and two candidates that kept their
furniture (7413916, 16695070) were never shipped.

Licence checked on the photo page rather than assumed: Unsplash serves two, and
only one of them is free. An earlier candidate was rejected for being served from
`plus.unsplash.com` under the paid **Unsplash+** licence.

**Why this frame, and why not the last one.** The band was built twice. The first
attempt traced a six-person office scene at photographic brightness and read as
dust — too many bodies, too much furniture, and a luminance signal that made
clutter as bright as anyone’s shoulder. This is four people at one table with real
depth between them: measured inside the cut-out the depth estimate spans **165 of
255 levels**, which is the separation the Z displacement needs.

**Three build-time passes, none of them running on the site.**

| Pass | Model | What it produces |
|---|---|---|
| Matte | `briaai/RMBG-1.4` | cuts the four subjects out — 48.4% of the frame kept, 47.4% after dropping one stray component. A lit room cannot be masked by darkness, and depth alone will not do it: in an earlier attempt the wall read 8–12, the people 23–113 and the *table* 142, so no threshold separated them |
| Depth | Depth Anything V2 (small, q8) | distance per pixel — becomes the point’s Z, its size and its parallax |
| Normal | derived here, not a model | depth bilateral-filtered (13 / 0.12), Gaussian-smoothed at σ 3.4 and differentiated with a 5-tap Sobel at relief K = 2.2, giving mean ∣n.xy∣ = 0.654. Tuned by measurement: K = 14 drove it to 0.892 and the shading tore |

Both models are run through transformers.js in a browser harness —
`.playwright-mcp/depth.html`, gitignored, and how to regenerate. The normal is
what turns a sheet of confetti into a solid: taken through `normalMatrix` in the
vertex shader, the key light stays fixed in the room while the form rotates under
it, and the fresnel term set louder than the lambert one is what makes a
silhouette burn instead of a surface glowing evenly.

**Sizes.** Packs are lossless webp (a lossy normal map bands and the shading
shows it), downscaled to a longest side of 760 px: eight packs, 1.4 MB in all,
loaded only when the stage is near and never under reduced motion.

## Vendor marks — Studio, “What sits behind the site”

Five real logos on a page carry a real risk: read together they look like a
partnership none of these companies made. The line beside the row is what
prevents that, and it is not decoration — **“Platforms we build on — not
partners, sponsors or endorsements.”**

Each file is the vendor’s own published mark, downloaded from the vendor’s own
brand page, stored under `img/marks/` and served same-origin (the CSP’s
`img-src 'self' data:` would block a hotlink anyway). Nothing is redrawn,
recoloured, cropped or traced. Where a vendor publishes a variant for dark
backgrounds, that is the one taken — choosing between the vendor’s own variants
is not modifying the mark. The only per-file adjustment is uniform scale: three
are wordmarks and two are icon-plus-wordmark lockups whose lettering is roughly
half the box height, so those two are drawn at 34 px against 21 px to put all
five lettering heights on one line. Downloaded 7 Sep 2026.

| File | Mark | Source |
|---|---|---|
| `img/marks/vercel.svg` | Vercel logotype, dark-background variant | `vercel-assets.zip` from [vercel.com/geist/brands](https://vercel.com/geist/brands) |
| `img/marks/cloudflare.svg` | Cloudflare horizontal logo, single-colour white | `CF_logo_horizontal_singlecolor_wht.svg` from the [Cloudflare press kit](https://www.cloudflare.com/press-kit/) |
| `img/marks/supabase.svg` | Supabase wordmark, dark-background variant | `brand-assets.zip` from [supabase.com/brand-assets](https://supabase.com/brand-assets) |
| `img/marks/upstash.svg` | Upstash logo, dark-background variant | `upstash-dark-bg.svg` from [upstash.com/brand](https://upstash.com/brand) |
| `img/marks/resend.svg` | Resend wordmark, white | [cdn.resend.com/brand](https://resend.com/brand) |
| `img/marks/sentry.svg` | Sentry wordmark, light variant | Sentry’s own logo generator at [sentry.io/branding](https://sentry.io/branding/), set to Light + Wordmark |
| `img/marks/owasp-zap.svg` | ZAP by Checkmarx | [zaproxy.org](https://www.zaproxy.org/) |
| `img/marks/sonarqube-cloud.svg` | SonarQube Cloud full logo, dark-background variant | `Sonar_Product_Logos.zip` from the [Sonar press kit](https://www.sonarsource.com/company/press-kit/) |

Seven of the eight are static files served by the vendor. Sentry publishes its
mark through a generator rather than a download, so the file here is that
generator’s own output with Light and Wordmark selected — the two presentational
attributes the page injected (`aria-hidden`, an inline `width:100%`) stripped,
and not one path or fill touched.

**How to find the next one.** Do not guess asset URLs; every plausible path
returns 404 and it burns time. Open the vendor’s brand page and take the zip it
links, or — when the download is a JavaScript button, as Supabase’s is — click it
and read the real URL out of the network log.

Two notes on the names. The row’s copy says **OWASP ZAP**; the project’s current
official mark reads *ZAP by Checkmarx*, and its `alt` text says so rather than
relabelling the vendor’s own artwork. Likewise **SonarCloud** is now published as
*SonarQube Cloud*, and the current mark is the one shipped. The visible copy is
left as briefed — renaming a service on a client-facing page is a content call,
not a build one.

## Work plates

Eighteen plates in `img/cases/`, one per site, each a real capture of that site
running — not a mockup, which is what the Work page says about itself and why
every plate is also a link to the deployed thing.

**How they were made.** Headless Chromium at 1600×1000, `load` plus 5.2 s for
WebGL, video and lazy media to settle, then any GSAP intro forced to its end
state (immediate children only — walking the nested tweens completes the hero
handoff and captures an empty page), then 2.6 s more, then the shot. Downscaled
to 1200×750 and encoded WebP q76, method 6. **706 kB for all eighteen**, every
one `loading="lazy"`, so the page paints on none of them.

One exception. `cafe-loam` has a fixed-height hero shorter than a 1600×1000
viewport, so a full-viewport capture caught the band of the next section. It was
re-shot at 1280×800 and cropped to 986×616 — the same 1.6:1 the other seventeen
are — before upscaling, rather than squeezing the frame to fit.

| Plate | Site | From |
|---|---|---|
| `film-midwater` | Midwater | `templates/film-midwater/` |
| `japanese-restaurant` | Kiyo 清 | `templates/japanese-restaurant/` |
| `watch-atelier` | Aurel | `templates/watch-atelier/` |
| `cafe-loam` | Loam | `templates/cafe-loam/` |
| `streetwear-form01` | Form/01 | `templates/streetwear-form01/` |
| `ski-colnoir` | Col Noir | `templates/ski-colnoir/` |
| `exhibition-parallax` | Parallax | `templates/exhibition-parallax/` |
| `carnival-null` | Null Carnival | `templates/carnival-null/` |
| `combat-fracture` | Fracture | `templates/combat-fracture/` |
| `camera-candela` | Candela | `templates/camera-candela/` |
| `exhibition-ephemeris` | Ephemeris | `templates/exhibition-ephemeris/` |
| `survey-graticule` | Graticule | `templates/survey-graticule/` |
| `interior-chalkline` | Chalkline | `templates/interior-chalkline/` |
| `offline-outage` | Outage | `templates/offline-outage/` |
| `property-bluehour` | Mabel Seow | `templates/property-bluehour/` |
| `crm-veridex` | Veridex | `templates/crm-veridex/` |
| `synth-oscilla` | Oscilla | `templates/synth-oscilla/` |
| `running-even` | Even | `templates/running-even/` |

Photography inside those captures belongs to each source template; see the
`IMAGE-CREDITS.md` in each of those directories for its own licensing.

The plates carry a two-stop scrim (`.scrim`) because three of the five sites are
light. Without it the chrome corner labels and the metadata card, which is
`mix-blend-mode: overlay` glass, invert against a white screenshot and vanish.
The card also carries its own `rgba(8,8,8,.5)` base so the overlay blend always
composites over a known dark ground rather than whatever the screenshot happens
to show.
