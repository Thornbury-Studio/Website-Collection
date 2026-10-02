This project inherits ../../../DESIGN-SYSTEM/DESIGN.md (the company-wide taste system; on this machine it lives at `C:\Users\sengc\OneDrive\Desktop\Company\DESIGN-SYSTEM\DESIGN.md`). Below are this project's own tokens and brand-specific rules.

---
name: Ember & Oak (v2)
slug: restaurant-ember-oak-v2
pages: [index.html, menu.html, visit.html]
colors:
  paper: "#f1efe9"
  char: "#1b1a18"
  ash: "#625e57"
  oak: "#b08a57"
  flame: "#b8300f"
  ember: "#ff8552"
fonts:
  display: "League Gothic 400 (self-hosted, fonts/league-gothic.woff2)"
  text: "Libre Caslon Text 400, 400 italic, 700 (self-hosted)"
radius: 0
shadow: none
max-width: 1320px
breakpoints: [1020px, 680px]
---

## 1. Overview & Identity

Ember & Oak is a 42-seat wood-fired restaurant in Hudson, New York. The site
is for someone deciding where to eat on Friday: it has to say what the place
is in one line, show the menu with prices, and get them to a table. The voice
is the restaurant's own, plain and specific (a cord of oak a week, no gas
line, lit at two). The one job is a table request.

This is a second, separate build of the same business as
`templates/restaurant-ember-oak/`, which is kept untouched as the deliberately
generic comparison.

## 2. Reference DNA

**Hatch Show Print, Nashville: letterpress show posters** (the shop has run
since 1879; the reference piece is the "Holiday Lake Park … Sun. Nov. 2"
handbill shown on shop.hatchshowprint.com, and the house style it stands for).
A wood-fired restaurant set in wood type is the reason for the choice, not
decoration. Taken from it:

1. **Every display line is set to the full measure.** Short lines get big,
   long lines get small, and the block is justified by size, not by spacing.
   Here: `.fit` lines sized in `cqi` from a measured ratio (`--k`), so
   "Everything here / is cooked / over oak" is three different sizes filling
   one column.
2. **Two colours of ink.** Black plus one spot colour used on a whole line,
   never on a word inside a line and never as a gradient. Here: `--flame` on
   "over oak" only.
3. **Thick-and-thin rules between blocks of information.** Here:
   `.rule-double` (4px over 1px) above and below the headline, and nowhere
   decorative.
4. **A condensed gothic carries the shouting, a book face carries the
   detail.** Here: League Gothic (a revival of Alternate Gothic No. 1, 1903)
   for display, Libre Caslon Text for everything you actually read.

**St. JOHN, Smithfield: restaurant page on stjohnrestaurant.com.** Taken
from it: practical terms stated flatly in the restaurant's own words (their
corkage and service-charge paragraphs give the number and the reason, with no
selling), hours as a plain list, and a menu that is a list of dishes rather
than a gallery of cards.

Not taken from either: Hatch's ornament, stars, borders and distressed ink
texture; St. JOHN's white-and-black palette, logo or layout. No surface is
copied. The structure and the tone are.

## 3. Colors

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--paper` | `#f1efe9` | Page ground. A limewash white, greyer than cream on purpose. | n/a |
| `--char` | `#1b1a18` | Text, rules, dark bands, primary button. | 15.12:1 on paper |
| `--ash` | `#625e57` | Secondary text, captions, closed days. | 5.61:1 on paper |
| `--oak` | `#b08a57` | Hover underline inside form fields only. Never text (2.76:1). | not for text |
| `--flame` | `#b8300f` | The spot colour: one headline line, link underlines, focus ring, errors, "today". | 5.27:1 on paper |
| `--ember` | `#ff8552` | The spot colour on dark bands, where flame would fail. Focus ring on dark. | 7.23:1 on char |

Footer small print on dark uses `#bdb8ae` (8.8:1 on char). Form fields sit on
`#fbfaf7`, one step lighter than paper so they read as fillable.

Bend it when: a photo needs to sit on dark, use a `.dark` band. Do not add a
third ground colour and do not tint photos.

## 4. Typography

- **League Gothic 400**, uppercase always. Fitted headline lines (`.fit`,
  line-height 0.86, letter-spacing 0), section heads (`h2.gothic`,
  clamp 3rem to 5.5rem, line-height 0.92), buttons, nav and prices (1.45 to
  1.6rem, letter-spacing 0.03 to 0.06em).
- **Libre Caslon Text** 400 / 400 italic / 700. Body 1.125rem (1.0625rem on
  phones) at line-height 1.6. Dish names 700. Italic is for captions, labels
  and asides, at 0.9375 to 1rem.
- Measure: prose is capped at 34em.
- Each `.fit` line carries `--k`, which is 100 divided by the line's width in
  em in League Gothic, less about 1% of slack. Change the words and you must
  re-measure (canvas `measureText` at 1000px), or the line will overflow or
  fall short. The fire heading has a second ratio, `--km`, for the two-line
  phone setting.
- The display font uses `font-display: block` and is preloaded, because a
  fallback face has a different width and would break the fit.

## 5. Layout & Spacing

- 12-column grid, max 1320px, gutter `clamp(20px, 4.2vw, 64px)`.
- Spacing scale: 8, 16, 24, 40, 64, and a section gap of
  `clamp(72px, 10vw, 136px)`.
- Home hero: handbill in 7 columns, one tall photograph in 5. Text never sits
  on a photograph anywhere on the site.
- Photographs are placed off the grid's centre on purpose (5 of 12, 8 of 12,
  4 of 12) and are different shapes; no two sections share a layout.
- **Radius: zero, always.** It is print. The only round thing is the status
  dot.
- Phone (680px and under) is composed on its own: photographs bleed to one
  edge, the fire heading resets to two fitted lines, hours and address move
  above the form on the visit page.

## 6. Elevation & Depth

None. No shadows, no blur, no glass, no gradients, no overlays. Separation is
by rule (1px, or the 4+1 double rule) and by the one dark band per page plus
the footer.

## 7. Components & States

- **Button** (`.btn`): char fill, paper text, 48px min height. Hover: fill
  goes flame (200ms). Active: 1px down. Focus: 3px flame outline, 3px offset.
  `.btn--line`: outline only; hover fills char. On dark: paper fill, hover
  ember.
- **Nav link**: gothic caps; a 3px flame bar grows under it on hover and stays
  on the current page (`aria-current`). No hamburger: three links fit on one
  row at 375px.
- **Text link** (`.link`): 1px flame underline; hover thickens to 3px and the
  text goes flame.
- **Menu line** (`.lines li`): name, description, price on a two-column grid.
  Every child has both tracks stated (PATTERNS.md grid rule).
- **Form field**: 1px char border, square, 48px min height. Hover: oak
  inset underline. Focus: flame outline. Invalid: flame border and inset bar,
  message in the `aria-live` hint or the `role="alert"` line. Disabled
  (time before a date is chosen): dashed border.
- **FAQ**: native `details`/`summary`; the plus rotates 45 degrees when open.
- **Status line**: static text by default; JS replaces it with the open/closed
  state computed in the restaurant's own timezone.

## 8. Do's and Don'ts

- Do keep one spot-colour line per headline block. Two is a different poster.
- Do write copy with a number or an object in it (a cord a week, two fingers
  thick, ten to five). If a sentence could sit on any restaurant's site, cut it.
- Do caption every photograph with what it actually shows.
- Don't put a photograph next to a dish it does not depict. If there is no
  licensed photo of a dish, the dish goes on the menu as text only.
- Don't add stats, awards, press logos, testimonials or star ratings. None
  exist.
- Don't add icons or emoji. The site has no iconography at all.
- Don't add scroll-reveal. Nothing on these pages is hidden until scrolled to,
  and nothing depends on JavaScript to be read.
- Don't let the form imply a booking. It writes an email in the visitor's own
  mail app and says so. A real booking system means leaving this repo
  (AGENT.md, "No backend, ever").
- Don't hot-link anything. Fonts and images are local; the page makes no
  third-party request.

Known departures from the company checklist, with reasons: the ground is an
off-white with a serif text face, which is near the "cream + serif +
terracotta" pattern. It is kept because the reference is ink on paper; the
display face is a gothic, the white is grey-leaning, and the accent is a
print vermilion used as a spot colour rather than as a terracotta wash.

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

## Notes for whoever turns this into a client site

- The CSP `<meta>` in each page mirrors the header in the repo's `vercel.json`
  so a local server behaves like production. `frame-ancestors` is left out of
  the meta because browsers ignore it there and log a console error; the
  header still sends it.
- The address, phone number and email are placeholders that cannot reach a
  real person: the phone is in the reserved 555-01xx range and the email uses
  the reserved `.example` domain. Replace all three (HTML, JSON-LD and
  `js/main.js`) with the client's own.
- Hours live in three places that must agree: the tables in `index.html` and
  `visit.html`, the JSON-LD in `index.html`, and `HOURS` in `js/main.js`.
