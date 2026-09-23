This project inherits ../../../DESIGN-SYSTEM/DESIGN.md (`C:\School\Personal\Company\DESIGN-SYSTEM\DESIGN.md`). Below are this project's own tokens and brand-specific rules.

---
name: crater
type: DESIGN.md
brand: CRATER — one single-origin whole-bean coffee (Acatenango, Guatemala), roasted in Singapore on Mondays. An invented brand with exactly one product.
status: Website-Collection template (capability-test build, 2026-09-23)
inherits: ../../../DESIGN-SYSTEM/DESIGN.md
engine: light
version: 1.0.0
last_updated: 2026-09-23
colors:
  pumice: "#F2ECE3"      # page ground
  paper: "#FAF7F2"       # raised surfaces: order panel, inputs, the 'No bloom?' note
  espresso: "#2A1D17"    # all text — 13.9:1 on pumice, 15.3:1 on paper
  scoria: "#953426"      # the bag's clay red — 6.4:1 on pumice; paper text on it 7.0:1
  scoria_deep: "#7A2A1E" # hover/pressed
  ash: "#6B5D54"         # secondary text — 5.4:1 on pumice, 5.9:1 on paper
  line: "#8A7B70"        # input and choice borders (non-text UI)
  rule: "#D9CFC2"        # hairlines, decorative only
type:
  family: "Mona Sans (variable: wdth 75–125, wght 200–900), self-hosted latin subset, 98 KB, SIL OFL"
  wordmark: "wdth 75, wght 860, uppercase — matches the condensed grotesque printed on the bag's label"
  clock: "wdth 125, wght 240, lining figures in fixed-width cells"
  headings: "wdth 108, wght 560, -0.028em, sentence case"
  body: "wdth 100, wght 400, 17px / 1.6"
radius: "4px on buttons, inputs and panels (the die-cut corner of the bag's label); 50% only on things that are round in life — the porthole, the Pour button, the phase stills; 0 on photographs"
motion: "one clock. The 45-second film, the ticking digits, the ruler's ink and the header chip all read the film's currentTime. Nothing else on the page moves unprompted."
---

# CRATER — design tokens and brand rules

## 1. Overview & identity

CRATER sells one coffee, and the page sells it with one physical fact: fresh
coffee blooms. Hot water on fresh grounds makes the bed rise, split and settle
as the gas from roasting escapes, violently for about ten seconds and mostly
over by forty-five. Stale coffee lies flat. The audience is someone who already
brews by hand, or is about to, and has been sold "fresh" by every bag on the
shelf; the page's one job is to let them *watch* freshness instead of reading
the word. Tone: calm, specific, short sentences — Coffee Collective's quiet,
not a roaster's hype.

**The structural answer.** Most coffee sites sell mood. This one is an
instrument. The first viewport is a porthole onto a coffee bed and a clock at
display size; pressing **Pour** runs a 45-second film in real time, and the page
refuses to let you scrub it — time is the material, and a bloom you could drag
through in two seconds would prove nothing. The film is three real clips (a
top-down pour, a macro of bubbles breaking, the bed settling) cut at the phase
boundaries, every second at 1× speed. The clock reads the film's own
`currentTime`, so a network stall stops the clock with the picture instead of
letting it run ahead. You can scroll away while it runs: a chip in the header
carries the clock and the phase ("0:23 Crater") until it reads "Bloomed".
The brew section links back to the same film as a timer for your own cup.

**The double meaning, by rhyme, never explained.** The porthole is a crater
seen from above; the middle phase is named *Crater* (the bed domes and craters);
the origin section opens on Volcán de Fuego venting ash — a volcano breathing
out gas, after a coffee breathing out gas. The copy never says any of that.

## 2. Reference DNA

Two Awwwards sites named in the brief, read for mechanics, not surface:

- **Coffee Collective** (Awwwards Honorable Mention, coffeecollective.dk).
  Taken: (1) warm off-white ground with deep brown type instead of black — our
  pumice/espresso pair is its temperature, shifted toward mineral grey so it
  reads as ash rather than cream; (2) gallery-like product presentation — the
  bag stands alone on its own photographed backdrop, feathered into the page,
  next to a plain spec list; (3) motion only where it clarifies. Not taken:
  its layout, its type, its photography.
- **Ceremony Coffee Roasters** (Awwwards Site of the Day). Taken: restraint
  everywhere except one genuinely playful interactive moment (theirs is a
  colouring cursor; ours is the Pour button and the 45 seconds that follow),
  and the idea that a commodity product can be shot as an artful still life
  (the bag, two beans on paper). Not taken: its black palette, pastel colour
  studies, GSAP scroll choreography.
- **The pour-over brew scale** (Acaia-class scale readouts: grams and seconds
  side by side). Taken: the information structure of the hero — a large timer
  with the dose beside it ("36 g of water at 94 °C on 18 g") — without
  imitating an LED display.
- **Checked on 23 Sep 2026, not imported:** motion.dev's `AnimateNumber`
  (React only, Motion+ membership, built on layout animation — unusable in a
  no-bundler page) and 21st.dev's timer set (animated countdowns, digit
  rolls, a flip clock, a progress circle). The shared current pattern —
  animate only the digit that changed, briefly — is what the clock does, in
  ten lines of CSS/JS: a 0.34 s transform-only drop per changed digit, off
  under reduced motion. The progress circle was declined (a ring around the
  porthole would duplicate the ruler). A scroll-scrubbed sequence was
  rejected on purpose (see §1).

## 3. Colors

| Token | Hex | Used for | Contrast |
|---|---|---|---|
| pumice | `#F2ECE3` | page ground | — |
| paper | `#FAF7F2` | order panel, inputs, the "No bloom?" note, chip | — |
| espresso | `#2A1D17` | all body and heading text | 13.9:1 on pumice |
| scoria | `#953426` | Pour button, buttons, ruler ink, active phase, focus ring, first brew timestamp | 6.4:1 on pumice; paper text on it 7.0:1 |
| ash | `#6B5D54` | captions, phase text, secondary copy | 5.4:1 on pumice |
| line | `#8A7B70` | radio and stepper borders | non-text UI |
| rule | `#D9CFC2` | hairlines only | decorative |

Scoria is sampled from the generated bag's paper (`#953426` on its shadowed
panel), so the accent on screen and the product in the photograph are the same
colour. It is a volcanic clay red, deliberately far from the orange terracotta
that generated pages default to. Pumice leans grey-pink, not yellow cream.

## 4. Typography

One family, Mona Sans, with **width** as the expressive axis instead of a
serif/sans pairing:

- **Wordmark** — wdth 75, wght 860, uppercase. It matches the condensed
  grotesque that Higgsfield printed on the bag's label, so the bag and the
  header are one mark.
- **Clock** — wdth 125, wght 240, `clamp(5.25rem, min(1rem + 8.8vw, 15svh), 10.5rem)`
  (the smaller of width and height, so the instrument fits a 1280×720 screen).
  The biggest type on the page is a number that moves. Digits sit in 0.72em
  fixed cells so the clock never jitters. **No tabular figures anywhere**:
  Mona Sans's tabular zero is slashed and reads as code.
- **Headings** — wdth 108, wght 560, tracking -0.028em, line-height 1.02,
  `text-wrap: balance`. Section H2 `clamp(2.25rem, 1.4rem + 3.4vw, 4.75rem)`;
  the hero H1 is smaller (`--t-h1`) because the clock owns that viewport.
- **Body** — wdth 100, wght 400, 17px, line-height 1.6, measure ≤ 38rem.
- **Labels** — sentence case, wght 500–620. No all-caps labels, no eyebrows.

## 5. Layout & spacing

12-column grid, max 1440px, gutter `clamp(16px, 3.4vw, 44px)`. Left-aligned
throughout; nothing is centred except the porthole on phones.

- **Hero (≥ 960px):** porthole cols 1–6, clock/copy/Pour cols 7–12, and the
  45-second ruler across all 12. The ruler's three phases are laid out to
  scale — `grid-template-columns: 10fr 20fr 15fr` — so one continuous ink
  line can fill it by time. The porthole is sized from the viewport
  (`min(100%, 100svh − 304px, 600px)`) so the whole instrument fits one
  screen at 1440×900.
- **Hero (< 960px):** porthole, then the clock and the Pour button on one row
  (grid areas), then the headline. The ruler turns vertical and each phase
  fills its own stretch of track, because stacked rows are not drawn to time
  scale.
- Section rhythm: more space above a heading than below it; 72–150px between
  sections, hairline `rule` or a 1px espresso rule at the head of each list.

## 6. Elevation & depth

- The porthole is a hollow: an inset shadow at the rim (`inset 0 3px 22px`),
  plus a soft drop shadow below — the only place depth is literal.
- The Pour button carries a soft offset shadow in its own red.
- The order panel is paper on pumice with a long, low shadow.
- No glass, no blur. The bag photograph's studio backdrop is feathered into
  the page with a radial mask (solid core over the bag and beans) instead of
  being boxed.

## 7. Components & states

- **Pour button** — 92px circle (84px under 420px), scoria. States: Pour →
  Pause (running, `aria-pressed="true"`) → Resume → Pour again. Hover darkens,
  press scales to .97. The live region announces each phase once, not every
  second.
- **Clock** — decorative (`aria-hidden`); the status line and the live
  region carry the same information in words.
- **Ruler phases** — idle: all readable. Running: the current phase's time
  and name turn scoria, future names drop to ash, past ones stay espresso.
- **Header chip** — hidden until a bloom has started and the porthole is off
  screen; dot turns ash when done.
- **Choices (grind, frequency)** — full-width 48px rows with a drawn radio;
  checked rows get a scoria border and a faint clay tint; keyboard focus
  outlines the whole row.
- **Stepper** — 48px buttons, disabled at 1 and 6.
- **Order** — totals recompute on every change from `CATALOGUE`; submit
  writes the order into an email and says so plainly (no fake checkout).
- **Focus** — 2px scoria outline, 3px offset, on everything.

## 8. Do's and don'ts

- **Do** keep every quoted number in `js/site.js` `CATALOGUE` and render it
  through `data-fig`; roast and ship dates are computed from the Singapore
  calendar (`?today=YYYY-MM-DD` pins it for screenshots).
- **Do** keep the film at 1× — if a cut changes, the phase boundaries in
  `PHASES` (0, 10, 30, 45) and `tools/film.sh` must move together.
- **Don't** add a second moving thing. No fade-up reveals, no parallax, no
  marquee: the clock is the motion.
- **Don't** explain the double meaning in copy, and don't draw a volcano.
- **Don't** caption a photograph with a place it wasn't taken. Two aerial
  craters (Fuerteventura, Iceland) were rejected for exactly that.
- **Don't** use tabular figures (slashed zero) or all-caps labels.

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
