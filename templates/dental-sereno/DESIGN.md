This project inherits C:\School\Personal\Company\DESIGN-SYSTEM\DARK.md. Below are this project's own tokens and brand-specific rules.

# DESIGN.md — Sereno Dental

## 1. Overview & Identity

**Sereno Dental** is a neighbourhood family dental clinic on Seng Poh Road,
Tiong Bahru: two dentists, one oral health therapist, two treatment rooms,
open Monday to Saturday. Five pages: home (`index.html`), treatments,
team, new patients, contact.

**What the client asked for (the floor):** clean, minimal, not much on
screen, their colour theme kept, smooth and fast. All four are met without
trade: the home page is five sections, each viewport carries one heading,
a short paragraph and one action; the palette is the client's deep navy,
white and cool greys and nothing else; smooth scroll is Lenis; the home
page ships about 60 KB of gzipped JavaScript and a 23 KB hero image on a
phone.

**The one idea (the ceiling): "Know before you sit."** Dental anxiety is
mostly fear of the unknown, and clinics hide both the process and the
price. So the site shows the first visit in advance as a real 45-minute
timeline, and prints a price range, a duration and a "what you will feel"
line beside every treatment. The information is the design; nothing on the
site is decoration standing in for it.

**How it is enacted:**

1. **The first visit, minute by minute** (`#visit` on the home page). A
   hairline clock with a single hand runs from 0:00 to 0:45 under scroll.
   Eight beats carry a real minute stamp (0:00, 0:04, 0:06, 0:12, 0:19,
   0:23, 0:38, 0:43), one sentence of what happens and one line of what
   you will feel. On desktop with motion allowed the stage is pinned
   (GSAP ScrollTrigger, scrub) and the beats become a compact index with
   the active beat's "what happens" shown large beneath it and its "You
   will feel" line under the clock; the hand rotates and the readout
   counts. On phones and short viewports nothing pins: the
   beats stack with a light rise. Under `prefers-reduced-motion` the
   clock sits at 0:45 and the list is a plain, fully readable list. Every
   word is in the DOM in every mode.
2. **The treatments ledger** (`treatments.html`). A typographic table per
   category (preventive, kids, aesthetic, restorative, root canal, oral
   surgery, implants): treatment, indicative SGD range, time, what you
   will feel. No icons, no cards. CHAS, MediSave and Baby Bonus are
   stated plainly where the money is.
3. **Minute 38 as the site's number.** The screen moment, when the price
   for anything beyond today's check is written next to the finding, is
   named on the home page, the treatments page and the new-patients page.
   One number that the whole promise hangs on.

**Refuse:** smiling-stock-model heroes, tooth illustrations, badge-pill
eyebrows above headlines, icon-topped feature cards, a three-number stat
strip, "state-of-the-art" and "we care" copy. The reference bar is
`dentalforte.com.sg`, a real Singapore clinic site; this build takes
nothing from it except the category of business and the colour family.

**Not to be confused with** `dental-care` (BRIGHTSIDE, a cream and sky
illustrated clinic with a happy tooth and a booking flow). Different
palette, different idea, no shared assets.

## 2. Colors

The client's. Deep navy is the ink and the anchor; white and two cool greys
do the rest. Navy tints are allowed; no new hue. WhatsApp green appears on
the WhatsApp action only.

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--navy` | `#001450` | all headings, wordmark, links, focus ring, buttons | 17.3:1 on white, 15.3:1 on `--grey-1` |
| `--navy-deep` | `#000B37` | hover and pressed navy | — |
| `--slate` | `#4B547A` | secondary text (a navy tint) | 7.4:1 on white, 6.5:1 on `--grey-1` |
| `--tint` | `#E6E8F0` | navy tint surface, hover on outline buttons | navy on it 14.1:1 |
| `--ink` | `#303030` | body text | 13.2:1 on white, 11.7:1 on `--grey-1` |
| `--white` | `#FFFFFF` | page ground | — |
| `--grey-1` | `#F1F1F1` | tinted sections | — |
| `--grey-2` | `#E1E1E5` | hairlines only, never text | 1.3:1 (not text) |
| `--on-navy` | `#C3C8DE` | muted text on a navy ground, if one is ever used | 10.4:1 on navy |
| `--wa` | `#20B038` | WhatsApp action background only | navy text on it 6.0:1 |

White on WhatsApp green would be 2.9:1, so the WhatsApp button carries
navy text and a navy outline glyph. The green never appears anywhere else.

## 3. Typography

Two families, both self-hosted, subset, `font-display: swap`, with
metric-matched local fallbacks so the swap does not move lines.

- **Sereno Serif Display** — Source Serif 4 (OFL), a static instance at
  optical size 48, weight 400, roman and italic. Headings and the
  wordmark only. The display optical size thins the hairlines so the big
  line reads cut, not heavy.
- **Sereno Sans** — Public Sans (OFL), variable weight 400–600. Body,
  labels, every number. Tabular lining figures on every price, minute
  stamp and time (`font-variant-numeric: tabular-nums lining-nums`).

Not Inter, Roboto, Arial or Space Grotesk. No centred hero `<h1>`: the
line sets flush left beside the photograph.

Scale: `--t-1` 13–14 px, `--t0` 17–18 px, `--t1` 20–24 px, `--t2`
30–44 px, `--t3` 44–84 px, all `clamp()` between 360 px and 1600 px.

## 4. Layout & Spacing

1200 px wrap, gutter `clamp(20px, 5vw, 64px)`. Two asymmetric columns,
5/12 and 7/12, flipped per section so the page alternates text-left and
photo-left. Prose is capped at 60ch; the lead at 34–38ch.

Sections are separated by one hairline and generous padding, never a
coloured band stacked on a coloured band. One tinted section per page at
most. No card grid anywhere on the site: lists are ruled ledgers, the
treatments are a table, the team is three articles.

Per PATTERNS.md: where a grid places any child, it places all of them.

## 5. Elevation & Depth

None. Nothing floats, nothing has a shadow, nothing is glass. Depth comes
from the photographs and from one hairline weight (`1px` at `--grey-2`).
Buttons are flat with a 3 px radius; photographs have the same 3 px.

## 6. Components & States

- **Header** — sticky, white, one hairline. Wordmark (ring mark + serif
  name), four links, the WhatsApp action. On phones the links sit on a
  second row and scroll sideways if they must.
- **WhatsApp action** — green, navy text, 48 px tall (40 px in the
  header). Always a `wa.me` deep link with a prefilled first line.
- **Clock** — a 200-unit SVG: hairline ring, twelve ticks, one hand. The
  hand is the only thing that moves (`transform: rotate`). The readout
  beside it is tabular serif.
- **Beat** — `<li>` with `<time datetime="PT12M">`, a sans heading, the
  "what happens" sentence and the "You will feel" line. In pinned mode the
  two paragraphs are absolutely positioned beneath the index and cross-
  fade on opacity only.
- **Ledger** — key/value rows on hairlines, with an optional note row.
  Prices, hours, what to bring, schemes.
- **Treatments table** — a real `<table>` with a hidden caption and column
  headers; on phones each row becomes a small grid (name, range, time,
  feel) with the header row visually hidden.
- **Enquiry form** — client-side only. Submit composes a WhatsApp message
  and opens `wa.me`; a second link puts the same text into `mailto:`.
  Nothing is posted anywhere.
- **Focus** — `outline: 2px solid var(--navy); outline-offset: 3px` on
  everything focusable. Never removed.
- **Reveals** — CSS scroll-driven (`animation-timeline: view()`), visible
  by default where unsupported, off under reduced motion.
- **Page transitions** — native cross-document view transitions: the
  header keeps its place (`view-transition-name: head`), the rest fades
  up 8 px. Firefox gets a normal navigation. Off under reduced motion.

## 7. Do's and Don'ts

**Do**
- Keep the clock the only pinned element and the only animated-in-place
  element on the site.
- Keep every minute stamp true to the beat's description. If the visit
  changes, change the minutes.
- State a real number wherever a claim is made (a range, a duration, a
  minute, a distance).
- Keep green for WhatsApp.

**Don't**
- Add a portrait that does not match its name, or an AI-generated face.
  The three portraits are licensed stand-ins in one 4:5 crop, chosen as a
  patient sees the clinicians from the chair (masked, or mask just
  lowered); a real client's own photographs go into the same slots.
- Add icons to the treatments, or turn any list into cards.
- Write "state-of-the-art", "gentle care", "elevate", "unlock",
  "transform", "empower", "crafted".
- Load anything from a CDN, or add a `package.json`, `api/`, `.env` or
  `vercel.json` to this folder.

## 8. Stack — what was taken and why

Per DARK.md §5, chosen against the concept rather than taken wholesale.
All vendored into `vendor/`; notices in `LICENSES.md`.

| Library | Licence | Doing what | Where |
|---|---|---|---|
| **Lenis** 1.3.27 | MIT | Smooth scroll; the clock is scrubbed, so wheel-step jitter would show on the hand. Not constructed under reduced motion. | all pages |
| **GSAP** 3.15.0 + **ScrollTrigger** | GSAP Standard "No Charge" (not MIT, terms recorded) | The pin and the scrub for the clock, and the stacked reveals on phones. | home only |
| **SplitType** 0.3.4 | ISC | The hero line, split into lines and risen once. Nowhere else. | home only |

**Deliberately not taken:** Swup/Barba (native view transitions do the
job for a five-page site at zero bytes); three.js or any WebGL (the
concept is information, not a scene, and speed is the product). GSAP is
not loaded on the four inner pages; their reveals are CSS.

## 9. Performance & motion floor

Budgets from the brief, measured before commit (numbers in the hand-off
report): mobile Lighthouse Performance ≥ 95, LCP ≤ 2.0 s, CLS ≈ 0, home
JavaScript ≤ 90 KB gzipped, first view ≤ 250 KB including the hero.

- Images: AVIF with WebP fallback, three or four widths each, `srcset` +
  `sizes`, explicit `width`/`height`, `loading="lazy"` below the fold,
  `fetchpriority="high"` and a preload on the hero only.
- Fonts: three subset woff2 files, 17 + 17 + 20 KB, two preloaded.
- Motion: transform and opacity only. The clock hand rotates, beats
  cross-fade, reveals rise 14 px.
- `prefers-reduced-motion: reduce`: no Lenis, no pin, no scrub, no
  reveals, no page transition; the clock reads 0:45 and the list is a
  list.
- No JavaScript: every page is complete, the hero line is visible, the
  WhatsApp links work, the form falls back to the WhatsApp and email
  links beside it.

## 10. Photography

Eight real photographs, Pexels licence, listed with photographer and URL
in `IMAGE-CREDITS.md`. The two treatment rooms, the stool and the man at
the screen are from two photographers' sets of one navy-and-white clinic,
so the rooms read as one place without grading. One stated reuse: the
block with the curved stairwell is the building a visitor must recognise,
so it is on the home page's place section and the contact page's top,
and nowhere else. The hero is room two with its wall clock, which is the
clock the first-visit section runs on; the caption says so.

## 11. Critique rounds (DARK.md §6)

**Round one** (outside critic, screenshots + reference + §4 only;
7/10). The checklist found nothing. The single largest gap: the
photographs were the only thing on the site not about this clinic, and
the copy was specific enough to expose them: a European room with a
radiator in the hero, a "two streets over" caption on the home page
beside a different building claimed on the contact page, and a team page
that promised three people and showed gloved hands. Fixed in one pass:
the hero is now room two with the wall clock (Pavel Danilyuk's set, no
radiator), one building appears on both pages with the reason stated,
and three licensed portraits sit above the three names. Two dead-space
defects fixed in the same pass: the new-patients hero had no photograph
(room one, now), and the pinned clock column ended 380 px short of the
list (the active beat's "You will feel" line now sits under the clock,
which also groups time with feeling, and the clock is no longer `sticky`
inside the pinned stage, which had made it drop ~185 px at pin release).
Also taken: the mobile ring read "0:45" above beat 0:00 (it now reads
"45 min, from the front desk to the door"), the h2 gap on the visit
section, two green buttons in the first viewport (the header action is
now an outline), three consecutive two-column modules on the home page
(the team is now a three-across row), two tricolon headlines, inactive
beats too faint, and the `figure` default margin that inset every
photograph by 40 px.

**Round two** (second outside critic; 7.5/10, "a real improvement, not a
material one"). Place closed, hero closed, team page judged not closed:
masked stock portraits read as strangers, and the critic's own fix (real
photographs, or an honest empty slot) is outside what a showcase template
can do under the hub's no-placeholder policy. Per DARK.md §6.5 that is a
plateau, not a reason for a third cosmetic pass: the approach question
(stock stand-ins or real shoot) goes to the boss in the hand-off report.
The defects it found were fixed in one bounded pass: the new-patients
caption claimed both rooms were set up the same way while the two
photographs disproved it (now describes only what is in frame); "9 of
them on this street" against "since 2016" (now ten); four-line h1s on
treatments and team (measure widened to 20ch); the team hero is now the
three portraits in one row and the hands photograph is gone; the front
desk section carries the hours beside its button instead of an empty
column; the treatments table's name column was too narrow; the stool
photograph was oversized; "curved stairwell" is now "external stairwell"
because the stairwell is angular; and the second "before you sit"
headline on the home page is gone.
