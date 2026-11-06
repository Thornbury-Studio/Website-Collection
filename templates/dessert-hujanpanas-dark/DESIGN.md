This project inherits ../../../../DESIGN-SYSTEM/DARK.md (relative to templates/dessert-hujanpanas-dark inside Tools/Website-Collection; it resolves to the company DARK.md). Below are this project's own tokens and brand-specific rules.

# DESIGN.md — Hujan Panas

Dark engine. Built 2026-11-06.

## 1. Overview & identity

**Hujan Panas** is an invented dessert house in Singapore for sweet soups and kueh: tang yuan in ginger syrup, pulut hitam, tau suan, red bean soup, orh nee, bubur cha cha, cheng tng, tau huay, ang ku kueh, ondeh-ondeh, kueh lapis. *Hujan panas* is Malay for rain on a hot day, the sunshower Singapore gets most afternoons. The name was searched before use (no Singapore dessert business found under it).

**The one idea: the menu follows the weather.** A dessert stall's sales swing with the sky: when it rains the warm soups sell, on a dry 32°C afternoon the chilled tau huay does. The page reads the NEA air temperature and five-minute rainfall from the station nearest the shop (data.gov.sg real-time API, no key, CORS open), names the weather in one Malay word (Panas, Hujan, Hujan panas, Redup), plays the matching film, rains on it with an abstract streak layer when the gauge says so, and re-sorts the board of twelve. A dial on the board lets anyone try another afternoon. Everything else on the page serves that.

Asked versus added: see the hand-off report; the short version is in §8.

| Section | Layout | Footage / photograph |
|---|---|---|
| Now | full-bleed film, live readout top-left, state word bottom-left, top three bottom-right, Hujan-Panas dial | sun 33894516 / sunv 36828507 (Panas), leaves 4926166 / railv 27590740 (Hujan, Redup), street 14744294 / skyv 34909100 (downpour), rain canvas |
| The board | sticky rail with the dial, one lead photograph, a ranked text list of twelve with a moved-against-a-usual-day column | the lead is the highest-ranked dish that has a photograph |
| The warm end | horizontal run, pinned on desktop, native swipe on phones | steam 9694805 behind; tang yuan, pulut hitam, green bean stills |
| The cool end | one large plate, one outlined numeral (4°) in its own space, one smaller plate | tau huay, cheng tng stills (no film: the only cold clip was a grey glass of ice and was cut) |
| The pot | a timed log, two entries with a film window | vatv 34705708, coconutv 27811423 |
| The kueh tray | 12-column mosaic on a fixed row grid | ang ku kueh, ondeh-ondeh, kueh lapis, pandan kueh stills |
| The log | a baked SVG chart of October | none (data graphic) |
| Visit | film, address and hours, photograph | housesv 32548044 (Koon Seng shophouses), rain-street still |

## 2. Colors

Contrast computed from the hex values (WCAG relative luminance).

| Token | Hex | Role | Ratio |
|---|---|---|---|
| `--ground` | `#0c100e` | page ground | |
| `--ground-2` | `#151b18` | visit ground | |
| `--paper` | `#eee6d6` | text | 15.4:1 on ground, 14.1:1 on ground-2 |
| `--muted` | `#aba595` | secondary text | 7.8:1 on ground, 7.1:1 on ground-2, 7.7:1 on the cool ground, 7.9:1 on the kueh ground |
| `--hujan` | `#86cdbd` | rain accent, cold bars, focus ring when wet | 10.5:1 on ground, 9.6:1 on ground-2 |
| `--panas` | `#f2a24a` | heat accent, warm bars | 9.2:1 on ground, 9.4:1 on the warm ground `#0e0b08` |
| `--accent` | mix of the two by `--cool` | eyebrows, numbers, focus ring | between 9.2:1 and 10.5:1 at every mix |
| warm heading `#f6dcb8` / caption `#cfc4b0` | | on `#0e0b08` | 14.8:1 / 11.4:1 |
| cool heading `#d8f1ea` | | on `#0b1213` | 15.9:1 |
| kueh eyebrow `#e4766a` | | on `#120d0c` | 6.5:1 |
| selected rain chip | `#0c100e` on `#eee6d6` | | 15.4:1 |

The accent is not a theme switch: `--cool` (0 = all warm soups, 1 = all ice) slides it from pandan-rain green to turmeric as the reading changes. No purple, no blue-black.

## 3. Typography

- **Bricolage Grotesque** (OFL, no Reserved Font Name) for everything set in words: one self-hosted woff2 of 33 KB, cut by `tools/fonts.py` to weight 300-800 with width pinned at 100 and optical size at 36, Latin-1 plus the marks the copy uses. The state word is 800 at up to 15.5rem with -0.055em tracking; the temperature is 300.
- **Martian Mono** 400 (OFL) for readings, times, prices and labels: 10 KB.
- Chinese dessert names (汤圆, 豆花, 清汤 ...) fall back to the system CJK face at 0.68em, muted.
- Not Inter, Roboto, Arial or Space Grotesk.

## 4. Layout & spacing

- Gutter `clamp(1rem, 4.4vw, 4.5rem)`. Touch targets 44px everywhere (nav, Motion, rain chips, links in Visit and the footer).
- **Phones get their own composition, not a squeezed desktop.** The hero switches to vertical 4K films (sunv, railv, skyv), the temperature becomes a 27vw numeral and the word sits at the foot of the film, the top three drop below the film on plain ground. The dial becomes a sticky bar above the board while the list scrolls under it. The warm end is a native swipe row instead of a pinned run. The cool end puts the window and two plates side by side. The pot's films sit inside the log entries. GSAP, ScrollTrigger and Lenis are never downloaded on a phone.
- No two chapters share a layout (see the table in §1).

## 5. Elevation & depth

No shadows, no glass, no pills except the three rain chips and the Motion button. Depth is the scrim over the film (warm-tinted when the state is Panas or Hujan panas), the steam film screen-blended behind the warm run, and the outlined numeral behind the cool window.

## 6. Components & states

- **Weather model** (`js/weather.js`, shared by the page and `tools/bake.mjs`): coolness = heat × (1 − 0.85 × wet), heat = (T − 25) / 8, wet = mm / 1.5, both clamped; each dish scores base + warmth × (0.5 − coolness) × 1.6. States: Hujan panas (rain ≥ 0.2 mm and T ≥ 29.5), Hujan (rain), Panas (T ≥ 30.5), Redup (otherwise).
- **Sources, in order:** `?weather=panas|hujan|downpour|hujan-panas|redup` or `?temp=&rain=` (preview, never overwritten), then the live NEA reading (polled every five minutes, 4.5 s timeout), then a typical reading for the month and hour from rounded NEA climate normals. The readout always says which one it is showing.
- **Baked page:** `node tools/bake.mjs` writes the no-JavaScript readout, the dial values, the top three, the board order, the screen-reader summary and the October chart from the same model (a November late afternoon, Hujan). Every place a computed number appears is inside a bake block.
- **Board reorder** uses `document.startViewTransition` with `view-transition-class: dish`; browsers without it reorder instantly. A polite live region announces the new first line.
- **Hero film:** only the active clip is fetched, after the load event; the baked poster is held until the live reading has answered, so a first view never fetches two posters. Ladder 2160 / 1080 / 720 (verticals named by the short side).
- **Rain canvas:** 2D, streaks only (no object depicted), 150 drops at drizzle and 380 at downpour (55% on phones), warm-tinted in Hujan panas, DPR capped at 1.5, drawn only while the hero is on screen and the tab is visible.
- **Motion switch** in the header: pauses every film, stops the rain, drops smooth scroll; remembered in localStorage; nav anchors keep working after it (tested).
- **Reduced motion and no JavaScript:** posters only, no rain, no pin, no smooth scroll, no reorder animation; the board is the baked order; the dial is hidden without JavaScript.

## 7. Do's and Don'ts

Do: keep the weather the only mechanism; keep copy specific (litres, kilograms, minutes, degrees); leave a dish without a picture rather than borrow another dish's.
Don't: put a badge above the hero line, add icon-topped feature cards, a three-number stat strip, AI violet, or draw a bowl, kueh or spoon in code (every object you see is a licensed photograph or film).

## 8. Where the engine rules were met

- §2 licensing: Pexels only (10 clips, 13 stills), each licence read; no generation, no Adobe Stock licence, no Pixabay. A savoury Indonesian bean soup photo was dropped once its contents were checked; the red bean line has no picture. Full table in IMAGE-CREDITS.md.
- §3 accessibility: ratios above; reduced motion honoured; visible focus; 44px targets; one h1; the state word carries an sr-only sentence; the chart has a title and a description with its numbers.
- §5 stack: GSAP + ScrollTrigger and Lenis on desktop only, native View Transitions for the reorder, no bundler. No WebGL, so no context to lose.
- §1a: asked and added are listed in the hand-off report.

## 9. Open items for the boss

- Every business detail is invented (address, phone, email, hours, prices, quantities, the October count, the aunties' kueh delivery). See the hand-off report.
- **The catalog's site-wide CSP header (vercel.json, `connect-src 'self' blob:`) blocks the data.gov.sg call when the page is served from templates.thornburystudio.com**, so the hosted demo will show the typical reading, not the live one. The page's own meta CSP allows `https://api-open.data.gov.sg`. A client deploy needs the header to allow it too.
- No free 4K footage exists of the actual bowls (tau huay, tau suan, cheng tng being served). The films carry the weather and the morning's work; the desserts themselves are photographs. The vat clip (34705708) is milk on the boil, standing in for soy milk; it is captioned by what the shop does, not by what the clip literally shows. A tea-pour clip used for the ginger syrup was cut after the second critic round.
- Tau suan, orh nee, bubur cha cha and red bean soup have no photograph; the board is text-led so they are not singled out.

## 10. Critic log (DARK.md §6: fresh sub-agents, screenshots only, three rounds)

- Round 1: overall 7.0, desktop 7.5, mobile 6.5 (hero 8, board 7.5, warm 7, cool 6, pot 7.5, kueh 7.5, log 7.5, visit 7). Largest gap: the warm and cool ends. Changed: the phone warm end became a vertical stack (it had lost its margin to scroll-snap); the cool end's grey glass-of-ice clip was cut and tau huay became the large plate with the 4° numeral in its own space; the Redup line now matches wet leaves ("between showers"); tang yuan copy matches the photos; chart fits a phone; a chapter index under the phone hero; the dashed "no photo" boxes became colour tiles.
- Round 2: overall 7.5, desktop 7.5, mobile 7 (hero 8, board 6.5, warm 7, cool 7.5, pot 7, kueh 7.5, log 7.5, visit 6). Largest gap: the photos do not prove the shop (name tiles read as missing images, stock stand-ins). Changed: board rows went text-only with one lead photograph that follows the top dish, and a new column shows how far each line has moved against a usual day; the "no photograph yet" note was rewritten; the tea-pour clip was cut; Visit retitled honestly; solid header on scroll; `picture` made block-level, which fixed several aspect ratios.
- Round 3: overall 7.5, desktop 7.5, mobile 7 (hero 7.5, board 7.5, warm 7, cool 7.5, pot 8, kueh 7, log 8.5, visit 7). Plateau, so no fourth cosmetic round. Largest gap named: the first screen reads as a weather widget, not a dessert house, and the reorder is shown as a small "▲ 2" rather than a drawn movement. Applied after it (not re-scored): phone pot films full width, chart dates anchored. **Not applied, for the boss:** put the top dish's photograph in the hero beside the reading, move the dial into the hero so Downpour visibly reshuffles the board on the first screen, and draw each line's usual-day slot as a ghost tick with the row sliding from it.
- The 8 / 8 target was **not** reached. The ceiling the critics kept naming is the footage: there is no free 4K film of these desserts, and four dishes have no free photograph at all.
