This project inherits D:\Company\Design-System\DARK.md (absolute path: the template sits inside a shared catalog repo; verified to resolve on BENCH 2026-11-09). Below are this project's own tokens and brand-specific rules.

# Hollin

## 1. Overview & identity

**Hollin** is a fictional contrast-bathing club in an unnamed northern-feeling city: a hot room, a cold plunge and a rest room, a round of each, three rounds, ninety minutes. Everything about the club (address, hours, prices, email) is sample content and says so on the page. A web check on 2026-11-09 found no business trading as "Hollin" in sauna or contrast therapy, so the name and slug stand.

**The one idea: the page has a body temperature.** Scrolling the home page runs one round of the ritual: it starts at 90 °C in dense amber heat and cools through 38 °C to 4 °C in hard blue-white cold. One number, T, drives everything at once:

- the palette (ground, ink, accent: `HOLLIN.at(T)` in `js/hollin-data.js`);
- the display type: Anybody's width and weight axes follow the heat (hot type is expanded and heavy, cold type is condensed and light; heat expands, cold contracts);
- one abstract WebGL2 fragment-shader field (`js/field.js`): rising, domain-warped convection and a fine heat shimmer at the top of the range; at the bottom an abstract frost (crystal facets, short needles on three axes 60° apart, a ridged filigree) grows in from the edges, and the field's clock slows until it stops. Nothing in it depicts a real-world object (DARK.md §3);
- the live readout in the hero and the nav.

Nothing else moves for its own sake. Every other page uses the same mechanism without the shader: The Rounds paints each room at its own temperature and the nav readout follows the room in view; Sessions sits at 38 °C, Visit at 4 °C (the only light page), the Guest Book at 21 °C (the rest room).

**Baked numbers (DARK.md §5).** `js/hollin-data.js` is the only place a number is typed. `node tools/build.mjs` writes the five pages and `css/temps.css` from it; every number appears inside a `data-bake="path"` element, including the aria-live mirror (`#temp-live`), the trace chart's axis labels and caption, and the session timeline (172 values). `node tools/build.mjs --check` fails if any committed page has drifted from the data. The runtime readout and its aria-live announcement read the same `HOLLIN` object.

## 2. Colours

Defined per temperature in `js/hollin-data.js` (`PALETTE`), interpolated by `HOLLIN.at(T)`, baked into `css/temps.css` as classes `.t-90 .t-62 .t-38 .t-21 .t-12 .t-4`.

| T | `--ground` | `--ground2` | `--ink` | `--dim` | `--accent` | `--err` |
|---|---|---|---|---|---|---|
| 90 °C | `#170703` | `#241008` | `#FBE3C8` | `#D9A57C` | `#FF9A4A` | `#FF9F8C` |
| 38 °C | `#0E0D0E` | `#1A1819` | `#EEE8E2` | `#B6AEA8` | `#E6C9A8` | `#FF9F8C` |
| 21 °C | `#0A1016` | `#141C24` | `#E7EEF3` | `#A7B5C1` | `#B9D2E6` | `#FF9F8C` |
| 4 °C | `#E4EEF4` | `#D3E2EC` | `#06182A` | `#33506A` | `#0F5C9E` | `#A1221A` |

**Contrast, computed (WCAG 2 relative luminance, `node tools/contrast.mjs`)**, on `--ground` / on `--ground2`:

| T | ink | dim | accent (links, focus ring, readout) | error text | ground text on accent button |
|---|---|---|---|---|---|
| 90 °C | 15.8 / 14.7 | 9.0 / 8.3 | 9.3 / 8.7 | 9.9 / 9.2 | 9.3 |
| 38 °C | 16.0 / 14.5 | 8.9 / 8.1 | 12.3 / 11.2 | 9.8 / 8.9 | 12.3 |
| 21 °C | 16.3 / 14.7 | 9.1 / 8.2 | 12.2 / 11.0 | 9.6 / 8.7 | 12.2 |
| 4 °C | 15.2 / 13.5 | 7.1 / 6.4 | 5.9 / 5.2 | 6.5 / 5.7 | 5.9 |

**The dark→light flip (12 → 4 °C).** No text colour can reach 4.5 : 1 on a mid-grey ground, so across that segment the ground moves on a steep curve (it spends 16 % of the segment changing, not 100 %), every text colour picks whichever side's value contrasts more with the ground under it, and a secondary colour that would fall below 4.5 takes that side's ink. Sweeping T from 90 to 4 in steps of 0.001: the worst ratio anywhere on the scroll is **3.96 : 1 at 8.04 °C**, and the text is below 4.5 : 1 for **0.9 % of the 12 → 4 °C segment** (a few pixels of scroll in transit). At every resting temperature (inside each room's hold) all text is ≥ 7.1 : 1 except accent at 4 °C (5.9).

**Text over the field (measured on rendered pixels, not assumed).** With the text made transparent, the pixels under each text box were read from a 1440 × 900 screenshot at every hold and transit: hero lede ≥ 10.0 : 1, hero secondary ≥ 5.9, stage ledes and body ≥ 13.1 at the holds; stage labels ≥ 5.8 at the holds, 4.4 (5th percentile) at the 21 °C transit while frost crosses them. Behind each stage's copy a soft radial clearing of `--ground` (82 % → 0) keeps the field's brightest steam and frost off the text.

**Photographs with text** (page heroes, the home band) always carry a scrim of `rgba(5,8,12)`: alpha 0.90 at the bottom, 0.84 at 40 %. Body text only sits in the bottom 40 %. Worst case (a pure-white pixel under 0.84): `--photo-ink #F3F6F8` **12.6 : 1**, `--photo-dim #C9D2D9` **8.9 : 1**. The large H1 can rise to where the scrim is 0.5: worst case 3.4 : 1, large text only.

Focus indicator: 2 px `--accent` outline, 3 px offset, on every interactive element (≥ 5.2 : 1 against any ground it sits on; on photographs it switches to `--photo-ink`).

No purple, no gradient text, no second accent per temperature.

## 3. Typography

| Role | Face | Setting |
|---|---|---|
| Display (wordmark, room names, H1/H2) | **Anybody** (variable `wdth` 50–150, `wght` 100–900; OFL, `fonts/Anybody-OFL.txt`) | uppercase, line-height 0.86, `font-stretch: calc(var(--wdth) * 1%)`, `font-weight: var(--wght)`. 90 °C → wdth 150 / wght 860; 38 °C → 100 / 520; 4 °C → 56 / 230. The nav mark follows too but never below wght 560 / wdth 78 %, so it stays legible at 24 px. |
| Readouts, prices | Anybody, fixed wdth 100 | `tabular-nums`, light (300) for the big readout |
| Body, labels, forms | **Hanken Grotesk** (variable `wght`; OFL, `fonts/HankenGrotesk-OFL.txt`) | 17 px / 1.6; labels 12 px uppercase, tracking .16em, weight 600 |

Display sizes are set so the widest (hottest) state fits: hero wordmark 16.6vw (15.6vw ≤ 880 px), stage titles one short word each (HEAT / RINSE / COLD) at 11.2vw. Heading order H1 → H2 → H3 on every page. Both fonts self-hosted (`@fontsource-variable` 5.3.0 latin subsets).

## 4. Layout & spacing

- 12-column grid, gutter `clamp(1.25rem, 4vw, 4rem)`; nav 64 px, solid `--ground` at 88 % with a 1 px line.
- Home: hero 100svh, wordmark along the bottom edge, lede to the right, readout to the left. Three stage blocks of 165vh each with sticky copy and a sticky photograph; alignment alternates (copy left / right / left, photos right / left / right, three different aspect ratios). Each stage holds its temperature over the middle 40 % of its height; between stages T eases (smoothstep) from one room to the next. Then the rest section with the session trace, a full-bleed photo band, the footer.
- Inner pages: a 76svh photographic hero with the H1 on the lower third, then sections that alternate 5/7, 8/4 and 4/8 splits; no two consecutive sections share an alignment.
- ≤ 880 px: single column, no sticky copy, readout moves to the nav, the feedback button becomes a 48 × 48 icon button.

## 5. Elevation & depth

One layer of depth only: the WebGL field, fixed behind the home page. Raw WebGL2, one full-screen triangle (`gl_VertexID`, no buffers), no three.js. Device pixel ratio capped at 1.5 (1.25 ≤ 880 px). Renders only while the tab is visible and the hero, ritual or rest section is on screen (the photo band covers it), and stops drawing entirely once frozen at 4 °C. `webglcontextlost` (prevented, switches to posters) **and** `webglcontextrestored` (recompiles, resumes) are both handled; verified with `WEBGL_lose_context` (`field field--static` after the loss, `field` and running after the restore). Under `prefers-reduced-motion: reduce` or with no WebGL2 the shader never starts: three posters rendered from this same shader (`img/field-hot|mid|cold.webp`) stand in, and the temperature steps from room to room instead of sliding. No glass, no drop shadows, radius 2 px maximum.

## 6. Components & states

- **Readout**: `[data-temp-readout]` holds a baked span; `HOLLIN.setTemp` rewrites it per tenth of a degree. The `aria-live="polite"` mirror announces only when the stage changes, never every frame.
- **Buttons**: `.btn` 48 px, 1 px line; `.btn--solid` ground on accent. Hover: border to accent. No pills.
- **Stage block** (`.stage`): label (room · minutes), one-word display title split into characters (GSAP SplitText, masked lines), lede, body, a fact line, a captioned photograph.
- **Room** (The Rounds, `.room`): each section carries its own `.t-N` class, so it is painted at its temperature; the H2 is that room's type at that temperature.
- **Trace** (home): an SVG step line of one session's temperature over 90 minutes, generated from the data, shaded where you are in the heat, drawn on scroll (ScrollTrigger scrub, `pathLength=1`). Caption carries the same numbers as text.
- **Feedback**: a Guest Book page form and a `<dialog>` with the same form, opened from a fixed button on every page (the button steps aside on the Guest Book page while that page's own form is in view). Rating is a real radio group (five 52 px targets, arrow keys work), "what worked" / "what didn't" prompts, optional name, a required note (≥ 10 characters). Errors: text under each field linked with `aria-describedby`, `aria-invalid`, a summary in a `role="alert"` line, focus to the first problem. On save: the note is stored in `localStorage` (`hollin-guestbook-v1`, inside try/catch), shown back, and a prefilled `mailto:hello@example.com` link is offered as the only way to send it. The page never says "sent"; with storage blocked it says it couldn't save and still offers the email. Visitor text is rendered with `textContent` only.
- **Menu** (≤ 880 px): full-screen panel, `aria-expanded`, focus moves in and is trapped, Escape closes and returns focus.
- **Page transitions**: cross-document View Transitions (`@view-transition { navigation: auto }`), mark and readout named so they hold position; progressive enhancement only.

## 7. Do's and don'ts

**Do**
- Type a number only in `js/hollin-data.js`, then run `node tools/build.mjs` and `node tools/build.mjs --check`.
- Keep one photograph per slot. The 13 photographs are each used once (see `CREDITS.md`); the only reuse is each page's OpenGraph image, which is that page's own hero. The home OG image and the hub thumbnail are screenshots of the home hero.
- Keep the claims honest: no health benefits, no testimonials, no booking system pretending to work. The Rounds says plainly that the club makes no medical claims.

**Don't**
- No Inter / Space Grotesk, no purple, no pill above a headline, no icon-topped three-card grid, no stat strip, no "Empower / Unlock / Transform".
- No second effect. The field is the one moving surface; everything else is type, photographs and the temperature.
- No video, no generated image, no modelled object in the shader.
- No `style=""` attributes in markup (the CSP is `style-src 'self'`); runtime styling goes through CSSOM.

## Agent Instructions (DARK.md §8, verbatim except the path)

```
# UI Generation Rules (DARK engine)
Before writing, editing, or restyling any front-end UI in this repo:
1. This project is DARK-engine (see .claude/engine-mode). Do NOT invoke
   `frontend-design`, `impeccable`, or `web-design-guidelines`, and do
   NOT read DESIGN-SYSTEM/DESIGN.md — those belong to the light engine
   only, mixing them in is exactly what the engine split exists to
   prevent. The over-constraint rule, the accessibility & motion floor,
   the no-hand-geometry rule and the ask-before-generating gate are
   restated in DARK.md §3 — read that, they are hard constraints here
   too. Nothing from DESIGN.md is needed (it may not exist on this machine).
2. Read this repo's own DESIGN.md AND D:\Company\Design-System\DARK.md (the
   company-wide dark taste system — absolute path, because this project is
   nested inside a shared catalog repo). Treat both as hard constraints.
3. Reach for the real open-source stack named in DARK.md §5 by default
   rather than hand-rolling the effect from scratch. Compose from real
   licensed scaffolding (§1.2) — original execution and content on top,
   never a copy of a finished real brand.
4. Check licensing as each dependency/asset is added (DARK.md §2), not
   as cleanup at the end.
5. Before calling any UI work done: take real screenshots (desktop +
   mobile) and check them against DARK.md §4's checklist directly
   against the image, not just the code (DARK.md §6).
```
