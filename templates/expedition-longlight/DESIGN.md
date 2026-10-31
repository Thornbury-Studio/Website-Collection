This project inherits D:\Company\Design-System\DARK.md (absolute path: the template sits inside a shared catalog repo, so a `../` count would be one more thing to get wrong; verified to resolve on BENCH 2026-10-31). Below are this project's own tokens and brand-specific rules.

# Longlight

## 1. Overview & identity

**Longlight** runs small-group, slow expeditions timed to the light at the edges of the day: out before first light, in camp after the last of it, the middle of the day left alone. Real places only (Lyngen, Lofoten, the Dolomites' Alta Via 1, Svaneti, Torres del Paine, the Faroe Islands). The operator facts (eight walkers, two guides, departure dates, prices, 14 days on a route the guidebooks give ten) are Longlight's own and are kept consistent across every page; every figure about a real route (lengths, summit and hut altitudes) is one a reader can check.

**The one idea:** a *contour relief*. An abstract fractional-Brownian heightfield (not a modelled mountain, DARK.md §3) rendered as thin bone topographic lines on the near-black ground, with the expedition route drawn across it in the one warm accent. It appears exactly twice: on the home page as a slowly drifting, pointer-reactive relief, and on the flagship page where scrolling scrubs the route trace and an elevation readout. Everything else in 3D is light: CSS 3D tilt on the tall portrait cards and a layered depth-parallax on each hero photograph. Nothing more.

Reference DNA (technique, not content): a near-black field, one cinematic full-bleed landscape carrying the hero, a very small centred nav with the mark in the middle, a large serif headline over the photo, tall portrait photo cards with a serif name and a tiny uppercase location, and generous negative space. The rhythm is deliberately *not* centred everywhere: the hero is centred, the relief section and the expedition rows are left-set, the manifesto is a two-column split, the journal grid is offset.

## 2. Colours

| Token | Hex | Use | Contrast (computed, WCAG relative luminance) |
|---|---|---|---|
| `--ground` | `#07090C` | page ground | — |
| `--ground-2` | `#0E1218` | raised panels, form fields | — |
| `--ground-3` | `#161B22` | hover state of panels | — |
| `--bone` | `#ECE6DA` | primary text, contour lines | 16.0 : 1 on `--ground`, 15.1 : 1 on `--ground-2` |
| `--mute` | `#B9B2A4` | secondary text, body on dark | 9.5 : 1 on `--ground`, 8.9 : 1 on `--ground-2` |
| `--dim` | `#8E887C` | meta labels, captions (≥ 11 px uppercase, tracked) | 5.7 : 1 on `--ground`, 5.3 : 1 on `--ground-2` |
| `--ember` | `#E2874F` | the one accent: route trace, link underlines, focus ring, small accent text | 7.4 : 1 on `--ground`, 7.0 : 1 on `--ground-2`; `--ground` text on an ember button 7.4 : 1 |
| `--line` | `rgba(236,230,218,.14)` | hairlines | decorative only |

No blue, no purple, no second accent. The photographs carry whatever colour they carry.

**Text over photographs** always sits inside a scrim. The scrim is a gradient of `--ground`; text is only placed where the scrim alpha is ≥ 0.82 (the lower 42 % of every hero on desktop and the lower 48 % on phones, where the heroes are also taller — 86 svh, 100 svh on the home page — so the photograph fills the first viewport; and the whole face of a card's caption band). Worst case (a pure-white photograph pixel under 0.82 ground) composites to `#343538`, which gives **bone 9.9 : 1**, **mute 5.8 : 1**, **ember 4.6 : 1** (large text only). At the 0.86 band used behind card captions: bone 11.4 : 1, mute 6.7 : 1, ember 5.3 : 1.

Focus indicator: a 2 px `--ember` outline with 3 px offset on every interactive element (7.4 : 1 against `--ground`, 4.6 : 1 minimum against the darkest scrim band it can appear on).

## 3. Typography

| Role | Face | Setting |
|---|---|---|
| Display (H1, H2, card names, pull quotes) | **Fraunces** (variable, OFL; `fonts/Fraunces-OFL.txt`) | `opsz` 144, `wght` 300–400, `SOFT` 40, `WONK` 0; italic for pull quotes only. Tight leading (0.98–1.05), slight negative tracking at the largest sizes. |
| Labels / small caps | **Instrument Sans** (variable, OFL; `fonts/InstrumentSans-OFL.txt`) | 11–12 px, uppercase, `letter-spacing: .16em`, `wght` 500 |
| Body | Instrument Sans | 17 px / 1.6 on desktop, 16 px / 1.6 on mobile, `wght` 400, measure 34–40 em |

Scale (fluid): display-1 `clamp(2.8rem, 7.2vw, 7rem)`, display-2 `clamp(2rem, 4.2vw, 3.6rem)`, display-3 `clamp(1.5rem, 2.4vw, 2.1rem)`, label `.6875rem`. H1 → H2 → H3 only; no skipped levels.

Both fonts are self-hosted from the `@fontsource` latin subsets; nothing loads from a CDN.

## 4. Layout & spacing

- Max content width 1360 px; readable column 40 em. Gutter `clamp(1.25rem, 4vw, 4rem)`.
- Vertical rhythm: section padding `clamp(5rem, 12vw, 11rem)`; inside a section, `--s-3` (1.5 rem) → `--s-6` (4 rem) steps.
- The nav is 56 px tall, five items at most, the wordmark exactly in the middle. On ≤ 760 px the mark stays centred and the items collapse into a full-screen menu behind a 44 × 44 button.
- Heroes are `100svh` (min 560 px) on the home page and `72svh` (min 480 px) on every other page (`86svh` under 760 px); the headline sits on the lower third. The `<picture>` wrapper is given `height: 100%` explicitly — without it `object-fit: cover` only covers when the photo happens to be taller than the frame.
- Rhythm rule: no two consecutive sections share an alignment.

## 5. Elevation & depth

Three layers only.
1. **Photograph depth-parallax** (hero): the photo scales 1 → 1.12 and translates at 0.35× scroll speed; on fine pointers it also shifts up to 10 px with the pointer. The scrim and headline stay put. Reduced motion: none of this.
2. **Card tilt**: `perspective(900px) rotateX/rotateY` ≤ 6°, fine pointers only, spring-eased by GSAP `quickTo`; the caption band lifts 12 px in Z. Reduced motion or coarse pointer: no tilt, a plain opacity hover.
3. **Contour relief** (`js/relief.js`): on the home page the field is shifted 1.7 units right of centre on desktop so the route stays clear of the text column, and a left-hand scrim sits under the copy; on phones the home canvas runs at 62 % opacity under a flat 30 % scrim. Three.js r180, a 200 × 200 plane displaced by a 256² heightfield (fbm of value noise, generated once on the CPU so the route can be lifted onto the exact same surface). Contours are drawn in the fragment shader from the interpolated height (`fract(h × 22)`, `fwidth` anti-aliased), fading with distance; the route is a thin tube in `--ember` with a per-vertex `t` that is clipped against `uProgress`. Device pixel ratio capped at 2, renders only while the canvas is on screen, one static frame under reduced motion, `webglcontextlost` *and* `webglcontextrestored` handled.

No glassmorphism, no drop shadows, no rounded panels larger than 2 px.

## 6. Components & states

- **Buttons**: `.btn` text + 1 px bone border, 48 px tall (44 px minimum target); `.btn--ember` ground text on ember. Hover: border → ember. Focus: ember outline. No gradients.
- **Links** in prose: underline in `--ember` at 1 px, offset 3 px; hover moves to bone.
- **Portrait card** (`.card`): 3 : 4 image, caption band with serif name + uppercase location + a small fact (days / high point). Whole card is the link; focus ring on the card.
- **Route row** (`.route`): alternating image/text rows, 7 : 5 split, image first on odd rows.
- **Readout** (`.readout`): monospaced-feeling tabular figures in Instrument Sans, `font-variant-numeric: tabular-nums`; mirrored in an `aria-live="polite"` sr-only element fed from the same `ROUTE` data (read from the itinerary's `data-day` / `data-alt` attributes — the HTML itinerary is the single source of truth, so no number is typed twice).
- **Form**: fields on `--ground-2`, 1 px `--line` border, label above, 48 px tall. Native validation + a visible error line in ember. On submit the form is replaced by a confirmation panel; nothing is sent anywhere.
- **Menu (mobile)**: full-screen panel, large serif items, `aria-expanded` on the button, Escape closes, focus returns.

## 7. Do's and don'ts

**Do**
- Keep every number consistent across pages: eight walkers, two guides, 31 departures in 2026, €4,900 for Alta Via 1, 14 days / 120 km, Jiehkkevárri 1,834 m, Slættaratindur 880 m, Rifugio Lagazuoi 2,752 m.
- Use one photograph per slot; the 27 photographs are each used exactly once (see `CREDITS.md`). The only intentional reuse is the OpenGraph image, which is the page's own hero.
- Leave space. If a section looks empty, that is the point.

**Don't**
- No phone number anywhere. No payment fields. No submit target.
- No blue or purple in UI; no second accent; no gradient text.
- No pill above the headline, no icon-topped three-card grid, no stat banner strip, no "Empower / Unlock / Transform", no demo or AI disclaimers in copy.
- No modelled terrain, no DEM, no real mountain silhouettes in the relief. It is a noise field and says so nowhere.
