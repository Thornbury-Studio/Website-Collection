This project inherits ../../../DESIGN-SYSTEM/DESIGN.md (`C:\School\Personal\Company\DESIGN-SYSTEM\DESIGN.md`). Below are this project's own tokens and brand-specific rules.

---
name: coil
type: DESIGN.md
brand: COIL — one high-mountain oolong (Jin Xuan, Lugu Township, Nantou County, Taiwan, about 1,000 m), sold from Singapore in one 75 g tin. An invented brand with exactly one product.
status: Website-Collection template (capability-test build, 2026-09-23)
inherits: ../../../DESIGN-SYSTEM/DESIGN.md
engine: light
version: 1.0.0
last_updated: 2026-09-23
colors:
  porcelain: "#F4F4EF"   # page ground = the white sweep of every product shot, multiplied in
  paper: "#FBFBF8"       # order panel, inputs, the 'Not opening?' note
  ink: "#22231A"         # all text, the dry pellet's olive-black. 14.4:1 on porcelain, 15.3:1 on paper
  olive: "#5C5D4B"       # secondary text. 6.1:1 on porcelain, 6.5:1 on paper
  line: "#8B8C7A"        # cup rings, input and choice borders (non-text UI). 3.1:1 on porcelain
  rule: "#DCDDD4"        # hairlines, decorative only
  liquor: "#CFC354"      # the fullest cup. Fills only, never text (ink on it is 8.8:1)
  steeps: ["#E0D98F", "#CFC354", "#C9BC5A", "#D9D190", "#E8E4BD"]  # the five cups, pale to full to pale
type:
  display: "Anybody (variable: wdth 50–150, wght 100–900), Etcetera Type Co, SIL OFL, latin subset 33 KB"
  text: "Newsreader (variable: opsz 6–72, wght 200–800), Production Type, SIL OFL, latin subset 86 KB"
  hero: "Anybody wdth 50, wght 800 — the dry pellet"
  steeps: "wdth 62 / 80 / 100 / 122 / 142, wght 740 / 650 / 560 / 450 / 350 — the leaf opening"
  footer: "wdth 150, wght 300 — the open leaf"
  body: "Newsreader 18px / 1.6, optical size auto"
radius: "3px on buttons, inputs, choice rows and the order panel; 50% only on the cups, the nav numerals and the brew-step numerals (they are cups); 0 on every photograph"
motion: "one thing moves: each steep's heading uncoils from the previous steep's width and weight to its own, once, when it first arrives (1.6 s). Nothing else moves unprompted. Off under prefers-reduced-motion."
---

# COIL — design tokens and brand rules

## 1. Overview & identity

COIL sells one oolong, and the page sells it with one physical fact: a whole
leaf, rolled tight, opens back toward its shape in hot water, and keeps
opening a little further every time it is steeped. Leaf that was cut to dust,
which is what most teabags hold, has no shape left to open. It gives
everything at once and is spent after one cup. The audience is someone who
has drunk tea from bags and suspects they're missing something, or who already
brews loose leaf and wants one good oolong. The page's one job is to make them
*see* whole leaf instead of reading the word "premium". Tone: calm, specific,
short sentences; Paper & Tea's habit of naming the tea's actual facts,
Hamada's habit of letting the photograph carry the argument.

**The structural answer.** CRATER answered coffee's violent 45 seconds with
an instrument: a clock and a film. Tea's shape is different: slow, gentle, and
repeated. A session is five pours of the same leaf. So this page is not built
around one hero moment. It is **one session in five steeps**, read in order.
Every steep chapter opens with the same ledger: *Steep n of 5*, a tally of five
cups with the poured ones filled in their real liquor colour, the time and
temperature, one line of what is in the cup, and one line of what the leaf
looks like now. The repetition is the point. You see the same pour five
times, and each time the cup and the leaf are a little different.

Each steep also tells a different layer of the same tea, the way each
infusion tastes different:
1. the garden (the first cup is aroma),
2. the rolling (the second steep is shorter, because the leaf has already
   opened),
3. the proof (now look at the leaf),
4. the tin (75 g is 75 cups),
5. brewing it yourself (the fifth is nearly water, and still sweet).

**The page opens the way the leaf does.** This is the one bold move, and it
is typographic.
- The hero is set in Anybody at its narrowest, heaviest cut (wdth 50,
  wght 800): wound tight, like the dry pellet in the photograph beside it.
- Each steep's heading is set a little wider and lighter than the last
  (62 → 80 → 100 → 122 → 142), with looser leading and tracking.
- The footer's wordmark lies fully open at wdth 150, weight 300.
- When a steep's heading first arrives on screen, it **uncoils** from the
  previous steep's cut to its own. That is the only unprompted motion on the
  page.

**The photography rhymes the same way.** The first viewport is the dry leaf:
a bowl of pellets. The first time the reader sees the *opened* leaf is at
"Now look at the leaf." It is the same tea from the same shoot, opened in the
bowl with the dry pellets behind it. It stands beside an ordinary teabag at
the same size, on the same white. Scrolling does the before-and-after.

**One level past the word.** A coil is something wound so it can release in
stages, not all at once, like a spring or a rolled leaf. The rolling (cloth,
pressure, loosen, again, up to twenty times) is the winding. The five steeps
are the release. The page never says "spring", and it never draws a spiral.

## 2. Reference DNA

The two Awwwards sites named in the brief, read for mechanics, not surface:

- **PAPER & TEA** (awwwards.com/sites/paper-tea, Awwwards Nominee; a real
  Berlin loose-leaf tea brand). Taken:
  1. progressive disclosure: one tea's story told in stages, each stage
     revealing a different facet (ours: five steeps, five facets);
  2. naming the specific tea and its checkable facts instead of tea-brand
     mood copy. Our facts are the cultivar and its registry number (Jin Xuan,
     TTES No. 12), the township, the altitude, the harvest, the oxidation and
     the exact steep times, all as a spec list;
  3. a sensory note per stage, written in ordinary food words.

  Not taken: its section names, the word "journey", its illustration style or
  its colour.
- **HAMADA TEA** (awwwards.com/sites/hamada-tea, Awwwards Site of the Day).
  Taken:
  1. a near-monochrome white canvas where the photograph does the arguing.
     Our ground *is* the white sweep of the product photographs: every
     product shot on white is multiplied into `--porcelain`, so the bowls sit
     on the page, not in boxes;
  2. deliberate negative space around one strong image per section;
  3. restraint plus one real photographic asset. Every image is a real
     photograph; the only thing built here is the tin's paper label.

  Not taken: its palette, its WebGL scroll, its layout grid.
- **Anybody's own width axis** (Etcetera Type Co, the variable font's
  specimen range from ultra-condensed to ultra-expanded). This is the
  typographic mechanic: width as the expressive axis. CRATER also uses width,
  but only statically (a condensed wordmark, a wide clock). COIL uses *change*
  in width, stepped through the page. It uses a different family, so it
  doesn't read as CRATER re-skinned.
- **Checked on 23 Sep 2026, not imported:**
  - motion.dev has no first-class variable-font animation. GitHub issue
    motiondivision/motion#930, a request to animate `font-variation-settings`,
    is closed; the requester's own workaround was CSS.
  - 21st.dev's "variable font" set has thirteen components: Proximity Type,
    Variable Font Hover By Letter, Hover Nav, Proximity Hero, Breathing Text
    and others. All are React + Tailwind, and all are cursor-driven (weight
    follows the pointer or hover) or loop forever ("Breathing Text").

  Declined, on purpose. Cursor-driven weight is decoration: it answers the
  mouse, not the product, and doesn't exist on a phone. A perpetual breathing
  loop is the opposite of a leaf that opens once per pour. What *is* used is
  the shared, current mechanic underneath them: a CSS transition on the width
  axis (`font-stretch`). It fires once per steep, on arrival, in plain CSS and
  about 30 lines of JS, with no library.

**No film, on purpose.** Real footage is this engine's preference (CRATER's
45-second film read as a step up over a shader). It was weighed and rejected:
- No real clip of a rolled oolong opening exists in any free, commercially
  licensed library (Unsplash, Pexels, Pixabay, Adobe Stock free, Mixkit,
  Coverr; searched 23 Sep 2026).
- The one real steeping clip, Pexels 8255164, was cut into a tracked, looped
  band. It came out soft, handheld, muddy and a different leaf, so it was
  weaker than the stills.
- Generated video would be fake proof of a physical claim.

See IMAGE-CREDITS.md.

## 3. Colors

| Token | Hex | Used for | Contrast |
|---|---|---|---|
| porcelain | `#F4F4EF` | page ground; the white of every product shot, multiplied in | — |
| paper | `#FBFBF8` | order panel, inputs, the "Not opening?" note | — |
| ink | `#22231A` | all body and heading text, buttons, focus ring | 14.4:1 on porcelain, 15.3:1 on paper |
| olive | `#5C5D4B` | captions, ledger secondary text, hints | 6.1:1 on porcelain, 6.5:1 on paper |
| line | `#8B8C7A` | cup rings, choice and stepper borders | 3.1:1 on porcelain (non-text UI) |
| rule | `#DCDDD4` | hairlines | decorative |
| liquor | `#CFC354` | the current nav steep, the note's left edge | fill only; ink on it 8.8:1 |
| s1–s5 | `#E0D98F` `#CFC354` `#C9BC5A` `#D9D190` `#E8E4BD` | the five cups: pale, fullest, full, thinning, nearly water | fills only |

The ink is the dry pellet's olive-black, sampled from the pellet photograph
(median of its darks), not a tinted `#111`. The liquor family takes its hue
from the brewed-liquor photograph (a Jin Xuan cup, yellow going green),
calmed down, and follows how an oolong session actually runs: pale first,
fullest at two and three, thinning to nearly water at five. There is no
terracotta, no cream and no second accent. Buttons are ink, not liquor,
because a pale chartreuse button would barely separate from the page (1.5:1).

## 4. Typography

Two families, clearly different jobs:

- **Anybody** (display). Width is the expressive axis:
  - **Hero H1:** wdth 50, wght 800,
    `clamp(3.5rem, 1.3rem + 7.4vw, 8.25rem)`, line-height .9, balanced.
  - **Steep H2s:** each steep sets `--w`, `--wt`, `--size`, `--lh` and `--ls`
    in `css/style.css`:
    - s1: 62%, 740, up to 6.5rem, lh .9;
    - s2: 80%, 650, lh .93;
    - s3: 100%, 560;
    - s4: 122%, 450;
    - s5: 142%, 350, lh 1.05;
    - buy: 150%, 300.

    As the width grows the size comes down, so line lengths stay sane.
  - **Wordmark** (header): wdth 50, wght 820, uppercase, the tin's label
    mark. **Footer wordmark**: wdth 150, wght 300,
    `clamp(5rem, 1rem + 19vw, 19rem)`.
  - **UI** (nav, buttons, ledger, labels, captions): wdth 100, wght
    500–640, sentence case. Numbers in columns (steep times, the order
    sum) use `tabular-nums`. Anybody's tabular zero is plain, unlike Mona
    Sans's slashed one.
- **Newsreader** (text): body 18px / 1.6, lede and `.big` up to 1.45rem /
  1.5, optical sizing auto, measure 30–36em. It also sets every temperature
  ("95 °C"), because Anybody's degree sign renders as a speck.
- **No "S$".** Anybody's dollar sign is an S with a hairline, so "S$42" reads
  as "SS42". Prices render as `$42` through `Intl.NumberFormat('en-SG',
  SGD)`, and the order panel says once that prices are in Singapore dollars.
- No all-caps labels (the wordmarks are logos), no eyebrows, no monospace.

## 5. Layout & spacing

12-column grid, max width 1440px, gutter `clamp(16px, 4vw, 56px)`, column gap
`clamp(14px, 2.2vw, 32px)`. Left-aligned throughout.

- **Hero (≥ 900px):** text in cols 1–6; the dry bowl in cols 7–12, sized from
  the viewport (`min(100%, 100svh − header − 110px)`) so the first screen
  shows the headline, the lede, the button, the empty cups and the whole bowl
  at 1440×900 and 1280×800.
- **Every steep:** the ledger first, full width, above a 1.5px ink rule. It
  is a 12-column row: steep (1–2), cups (3–4), time (5–6), taste (7–9),
  leaf (10–12); below 1100px the leaf line drops to a second row. Then the
  chapter, whose composition changes each time:
  - s1: text left, tall fog photo right;
  - s2: liquor left, text right;
  - s3: a full-width heading, then the proof as two equal columns, the leaf
    and the teabag, each with its sentence under it;
  - s4: tin left, text right;
  - s5: a full-width heading, then the kit left and the steps right.
- **Phones (< 900px):** everything stacks. The ledger becomes steep, cups and
  time on one row, with taste and leaf under it. The nav hides; the Buy
  button stays in the header.
- **Spacing:** 80–170px above each steep; 40–88px from the ledger to the
  chapter; more space above headings than below.

## 6. Elevation & depth

- **Product shots have no box.** Their white sweep is multiplied into the
  ground at grading time (`tools/grade.py`, `on_ground`). Any photo with its
  own background (the fog, the liquor on grey) is a plain plate with square
  corners.
- **The tin's shadow is baked in:** a soft contact shadow under its base,
  built in `tools/tin.py`.
- **The order panel** is the only raised surface: paper, a 1px rule and a
  long, low shadow.
- **The header** is porcelain at 92% with a 10px backdrop blur, only so
  scrolling type doesn't collide with the nav. No other glass or blur.

## 7. Components & states

- **Ledger (steep bar).** Static text; the cups are `aria-hidden` circles. The
  visible "Steep 3 of 5" is the only statement of the count: there is no
  sr-only duplicate, so it can't drift. The times come from `STEEPS`.
- **Cups.**
  - Empty: 1.5px `--line` ring.
  - Poured: filled with that steep's colour.
  - Current: filled, plus a 2px porcelain gap and a 1.5px ink ring.
- **Nav.** Five numbered links (the steeps really are a sequence). The steep
  in view gets its numeral filled with its liquor colour (IntersectionObserver
  on the sections). Hover underlines.
- **Buttons.**
  - Ink, porcelain text, 48px (44px in the header), 3px radius.
  - Hover `#3A3B2E`; press moves 1px down.
  - Focus: a 2px ink outline at a 3px offset, as on every interactive element.
- **Text links.** Underlined 1px, thickening to 2px on hover, with a 44px hit
  area.
- **Uncoil.**
  - A `span.uncoil` copy of the heading is laid over it (`aria-hidden`).
  - The real heading turns `color: transparent` but keeps its final layout,
    so nothing below reflows. It stays in the accessibility tree.
  - The copy transitions `font-stretch` and `font-weight` from `--from-*` to
    the steep's own values over 1.6s, then is removed on `transitionend`,
    with a 2.6s timeout for hidden tabs.
  - It runs once per heading, only when the heading scrolls into view.
    Headings already on screen at load stay still.
  - Nothing runs under `prefers-reduced-motion: reduce`.
- **Order form.**
  - Choice rows: 52px, with a drawn radio. Checked rows get an ink border
    plus a 1px inner ink line; keyboard focus outlines the row.
  - Stepper: 48px buttons, disabled at 1 and at `maxQty` (6).
  - The sum is `aria-live="polite"` and recomputes from `CATALOGUE` on every
    change. Postage is free from 2 tins and on every subscription.
  - Submit writes the order into an email (`mailto:`) and says so plainly in
    the status line. There is no fake checkout.

## 8. Do's and don'ts

- **Do** keep every number in `js/site.js`:
  - `CATALOGUE` holds price, weight, dose, water, temperature, altitude,
    harvest and postage; `STEEPS` holds the times.
  - Render them through `data-fig`, `data-steep-time` and
    `data-steep-words`.
  - Run `node tools/check-figs.mjs` after any copy edit. It fails if an HTML
    fallback has drifted from the script.
- **Do** keep the second steep shorter than the first. It is the most
  specific true thing on the page, and it is a heading.
- **Do** re-render the tin (`python tools/tin.py`, after editing
  `tools/label.html`) when the harvest changes. The label on the tin carries
  "Spring 2026" and "75 g".
- **Don't** show the opened leaf before "Now look at the leaf." The hero is
  the dry bowl on purpose, so scrolling is the before-and-after. (The
  second critique round caught the same photo spent twice.)
- **Don't** add a second moving thing: no fade-up reveals, no parallax, no
  hover-driven variable-font effects. The uncoil is the motion.
- **Don't** feather photo edges with masks. The critique read them as a
  filter; clean edges on a matched ground read as deliberate.
- **Don't** caption a photograph with a place it wasn't taken. Only the fog
  says Lugu, because it was taken in Lugu. Taiwanese tea-garden photographs
  from Chiayi were rejected for exactly this.
- **Don't** generate "proof" imagery of the leaf opening. If a real five-steep
  series of one leaf is ever shot, it belongs in the five ledgers. Until then
  the ledgers describe the leaf in words.
- **Don't** use "S$" in Anybody, all-caps labels, eyebrows, middle-dot meta
  strings, or the banned words ("artisanal", "ceremony", "zen", "mindful",
  "journey").

## 9. Agent Instructions

```
# UI Generation Rules
Before writing, editing, or restyling any front-end UI in this repo:
1. Invoke the `frontend-design` skill and, if installed, `impeccable`
   and this project's own design-critique skill.
2. Read this repo's own DESIGN.md AND ../../../DESIGN-SYSTEM/DESIGN.md
   (the company-wide taste system — adjust the `../` depth to match
   this project's actual nesting, see the note above). Treat both as
   hard constraints.
3. Do not introduce unapproved fonts, unmapped tokens, or any pattern
   listed in DESIGN-SYSTEM/DESIGN.md §3 (the anti-slop checklist)
   without stating the reason it's a real choice, not a default.
4. Before calling any UI work done, run the `web-design-guidelines`
   skill against the changed files and screenshot the result at
   desktop and mobile widths.
```
