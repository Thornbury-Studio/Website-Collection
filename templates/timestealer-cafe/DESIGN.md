# Timestealer Café — design notes & pitch handoff

Built 17 Aug 2026 as a **cold pitch**: Timestealer Café has not engaged us and
has not licensed anything to us. Their only web presence is an Instagram
account. This site exists so the pitch can be "click into a working one" rather
than "imagine what you could have."

## The legal line this build was drawn on

Singapore's Copyright Act 2021 protects expression, not facts; the Trade Marks
Act protects marks used as a badge of origin. So:

- **Taken:** business name as plain text, address, unit number, postal code,
  phone, opening hours, payment methods, halal status, the *existence* of dish
  categories, and the handful of dish names with prices that are publicly
  listed.
- **Not taken:** their logo or any stylised wordmark, their photography, their
  Instagram captions, and any of their own descriptions. Every sentence on this
  site was written from scratch. The mark is original. All imagery is licensed
  stock — see `IMAGE-CREDITS.md`.

The rule is recorded in memory as `client-preview-copyright-sg` and applies to
every speculative build, not just this one. **If the client engages us and says
so, that unlocks full use of their real copy, photos, logo and marks** — the
same footing `professor-brawn` was built on.

## Why every page is `noindex, nofollow`

This is a speculative site for a real, operating business. If it were indexed it
could surface next to (or instead of) their own listings and genuinely mislead
their customers about hours or prices. It is also gated behind Client Preview at
the edge. Deliberately **not** added to `sitemap.xml`. If the client signs and
the site goes live under their own domain, that is when indexing gets turned on.

## Verified facts, and where they came from

Cross-checked 17 Aug 2026 against OpenRice, Eatbook, the Blockchef ordering page
and the I Love Tampines listing.

| Fact | Value | Confidence |
|---|---|---|
| Address | Block 267 Tampines Street 21, #01-39, Singapore 520267 | Solid — every source agrees |
| Phone | 8670 0039 | Solid |
| Payment | Cash, NETS, CDC vouchers | Solid |
| Halal | Not halal-certified | Solid |
| Yakitori Chicken Don | $6.80 | Solid |
| Battered Fish Rice Bowl | $5.80 | Solid |
| Egg Mayo Croissant | $7.00 | Solid |
| Tuna Croissant | $7.50 | Solid |
| Coffee Cake | $15.00 (whole) | Single source (Blockchef) |
| Categories | rice bowls, croissant sandwiches, baked potatoes, muffins, bakes, coffee | Solid |
| Family-run, began home-based | yes | Solid |

### Confirm with the client before this goes anywhere near live

1. **Opening hours conflict across sources.** OpenRice says Mon–Fri 10.00am–7pm;
   Eatbook says 10.30am–7pm; an older Facebook post says 9am–8pm daily. The site
   currently uses **Mon–Fri 10.30am–7pm, Sat 10.30am–5pm, closed Sunday**, which
   is the majority/most recent reading. These hours are hard-coded in two
   places: the `HOURS` table in `js/ui.js` (drives the live open/closed pill) and
   the table in `visit.html`. Change both together.
2. **"Twenty years."** The twenty-year figure came from the project brief, not
   from a source we verified. It appears in the `story.html` H1. If it is wrong,
   that headline is the only place it needs changing.
3. **"Mama Moon."** Used as the chef's working name because that is how the
   brief and public coverage refer to her. No biography was invented around it —
   the chapters deliberately describe the kitchen's approach rather than dated
   life events, precisely so nothing fabricated is attributed to a real person.
4. **Dine-in vs takeaway.** Sources disagree: OpenRice lists dine-in and
   Deliveroo delivery; the I Love Tampines post says takeaway only. The copy
   hedges ("seating is limited, most orders are taken away"). Needs a straight
   answer.
5. **The rest of the menu.** Only the five prices above are verified. Everything
   else is marked **Daily** rather than given an invented figure — see below.

## The menu framework

`js/menu-data.js` is the single source of truth; `js/menu.js` renders and filters
it. Nothing about the menu lives in `menu.html`.

A `price` of `null` renders as **Daily** instead of a number. That is the
mechanism that keeps this honest: we never print a price the counter is not
charging. It also happens to be true of the business — bakes and the day's bowl
genuinely rotate.

**This is the strongest thing to demo in the pitch.** Open `menu-data.js`, add a
line, reload — the category chips, the search index and the item count all
update themselves. Getting their real price list in is a five-minute job, and
saying so is the point.

## Design

- **Palette.** Warm parchment ground (`--paper` #F7F1E6), deep roasted ink,
  one ember accent (#A24A16). Every token was checked for WCAG AA against both
  surface tones before use; `--ink-3` (#6E5F51, the muted tone) is the one that
  usually fails and clears 5.46:1 / 4.96:1 here.
- **Type.** Fraunces for display (soft, slightly wonky — reads homemade rather
  than corporate), Karla for text.
- **The name is the concept.** "Timestealer" is read as the hour that goes
  missing in a good way; that is the H1 and the closing story chapter. It is our
  reading of a public name, not their copy.
- **Structure.** Four pages: home, menu, story, visit. The story is a six-card
  chapter grid (3×2 at desktop) rather than prose, which is what the brief asked
  for and also makes it easy for the client to correct one chapter at a time.
- **Local SEO.** `CafeOrCoffeeShop` JSON-LD with full `PostalAddress`, telephone,
  payment methods and `openingHoursSpecification` on both the home and visit
  pages. Live open/closed state is computed in `Asia/Singapore`, so it is right
  regardless of the visitor's clock.

## Conventions carried from the house style

CSP meta on every page with `script-src 'self'` and zero inline scripts; reveals
gated on a `.js-anim` class with an IntersectionObserver failsafe; one `h1` per
page; every image alt-texted; every input labelled.

## Verification note

The Browser pane in the build session was hidden, which throttles rAF and
freezes CSS transitions — reveals read as `opacity: 0` there even with `.is-in`
correctly applied. Confirmed working by driving a real compositing headless
Chrome over CDP (`scratchpad/cdp-test.mjs`): after both a chip filter and a
search re-render, new groups reach `opacity: 1` / `transform: none`. Headless
`--window-size` also does **not** give a true mobile viewport; mobile overflow
was checked properly via device emulation (`scrollWidth === 375`, no overflow).
See `headless-verification-traps` in memory.
