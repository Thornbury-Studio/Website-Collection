# GIG Cafe — design notes & pitch handoff

Built 18 Aug 2026 as a **cold pitch**: GIG Cafe has not engaged us and has
licensed us nothing. They *do* have a website (gigcoffee.com.sg, WordPress),
which is precisely the opening — the pitch is the visible distance between it
and this preview. Facts taken, expression not, per `client-preview-copyright-sg`
in project memory.

## The pitch in one sentence

Their physical café has personality (flowers, pink, photo corners); their
digital experience buries it — this preview is what the café's own character
looks like when the website has it too.

## What their current site does that this one fixes

- **The menu is twelve JPEG scans** (~1.9&nbsp;MB, lazy-loaded, frequently
  failing to placeholders). Here it is one data file (`js/menu-data.js`)
  rendered as searchable, filterable, deep-linkable text — instant on a phone,
  readable by assistive tech, updatable in one place.
- No click-to-call, no maps deep link, hours buried in footer copy. Here: a
  fixed mobile quick-action bar (Menu / Reserve / Call / Directions), a live
  open/closed pill computed in `Asia/Singapore`, hours as a table with today
  highlighted.
- Café content mixed with organisational content in one nav. The preview scopes
  itself to the café experience (see "What was deliberately left out").
- No structured data. Here: `CafeOrCoffeeShop` JSON-LD on home and visit.

## The legal line this build was drawn on

- **Taken (facts):** name as plain text; address Blk 419 Tampines Street 41,
  #01-104, Singapore 520419; phone 6588 5688; email info@gig-coffee.com.sg;
  daily 10am–9pm; brunch 10am–3pm; Chope reservation link
  (cho.pe/dineatgigcafesg); social handles; event pre-booking (birthday/ROM);
  the full menu's item names, ingredient lists and prices; Dream Cloud Series
  names and "from $6.90"; payment methods (OpenRice); 15-minute reservation
  hold and kid-friendliness (Chope).
- **Not taken (expression):** their cup logo and wordmark, watercolour floral
  menu artwork, photography, taglines ("Coffee of Hope", "Advocating
  Fraternity, Igniting Hope"), scripture quotations from the menu, any sentence
  of their copy. Every line here was written from scratch; the five-petal bloom
  mark is an original drawing; all imagery is licensed stock or generated
  concept work (see `IMAGE-CREDITS.md`).

## Design

- **Palette.** Warm porcelain ground (`--paper` #FBF7F2), deep matcha-charcoal
  ink (#25302A), one strawberry accent (#A83048), matcha secondary (#4E6345),
  blush petal tint for chips. The Strawberry Matcha Dream anchors the identity
  without the site turning pink-and-green: the drink's layers appear in
  imagery, the UI stays porcelain-and-ink. Every token pair audited ≥ 4.5:1
  (worst pair 5.28:1).
- **Type.** Instrument Serif for display (contemporary, editorial — deliberately
  not the brown-café serif cliché), Instrument Sans for UI. Italic serif is the
  accent voice inside headlines.
- **Floral interpretation.** Their identity is watercolour-pastel decoration;
  this preview interprets it as *fresh flowers photographed as product* —
  travertine, blush ranunculus, one campaign-consistent image set — plus an
  original thin-line bloom mark. Interpretation, not imitation.
- **Structure.** Four pages: home, menu, gatherings, visit. "Gatherings" is the
  differentiator page — the café genuinely pre-books birthday and ROM events,
  and nothing on their current site sells that room properly.
- **Mobile.** Quick-action bar with 48px+ targets, sheet nav, sticky menu tools
  (search + chip rail), tested at 320/375/414/768/1024/1280 with zero
  horizontal overflow.

## Honesty mechanisms

- `js/menu-data.js` is the single source of truth. A `price: null` renders as
  **"Seasonal"** — used for the four Dream Cloud pours, whose per-drink prices
  are not published (only "from $6.90"). The site never prints a number the
  counter is not charging.
- Prices quoted in marketing copy (home-page cards, the $8.90 latte line) are
  filled by `ui.js` from the catalogue via `data-price` attributes — computed,
  never typed, so copy and menu cannot drift apart.
- The printed menu's own qualifier is reproduced: prices are before service
  charge and prevailing government taxes.

## Verified facts and their sources (researched 18 Aug 2026)

| Fact | Source | Confidence |
|---|---|---|
| Address, unit, postal code | Official site + menu p12 + OpenRice + Chope | Solid |
| Phone 6588 5688 | Menu p12 + OpenRice | Solid |
| Daily 10am–9pm | Official site + OpenRice + Chope agree | Solid |
| Brunch 10am–3pm | Menu p4 | Solid |
| Full menu + prices | Official menu images "GIG Menu Tampines 2026" (14 Aug 2026 upload) | Solid |
| Chope reservations + 15-min hold | Official site + Chope | Solid |
| Dream Cloud Series, "from $6.90" | Official homepage | Solid |
| Payment: cash, NETS, Visa, Mastercard | OpenRice only | Good — confirm with client |
| Event bookings (birthday/ROM) | Official site + menu p12 | Solid |

### Deliberately NOT stated anywhere on the preview

- **Halal status.** The menu contains pork and bacon, so the café cannot be
  halal-certified — yet at least one listicle claims it is. The preview says
  nothing either way; the client should resolve this publicly.
- **Delivery platforms.** None verified; none invented.
- **The $8.90++ Laksa Pasta promo** on their homepage (menu says $18.90) —
  time-boxed promo, left out so the preview can't go stale.
- **Seating capacity, founding date, owner names** — unverified.

## What was deliberately left out (pitch talking points, not omissions)

Their site carries a Faith &amp; Grace section, a Shared Kitchen page and a
membership form. Those are real parts of the organisation and the preview does
not deny them — it scopes itself to the *café customer journey* (find, crave,
book, arrive), which is what a redesign would be hired to fix first. If they
engage, those sections come back as properly designed secondary navigation, and
the concept imagery is replaced with a real shoot of their actual room and
plates.

## Verification notes

Contrast audited computationally (20 pairs, all ≥ 4.5:1). DOM audit at six
widths per page: zero horizontal overflow, one h1 per page, every image
alt-texted, tap targets ≥ 42px, chip filter / search / empty state / deep links
(`menu.html#group-tea`) exercised in-browser. Natural-visibility screenshot
pass (no forced reveal classes) via headless Chrome at 375 and 1280 confirmed
reveals fire on their own, prices fill from the catalogue, the open pill
computed the correct SGT state, and the fixed quick-bar renders in a real
viewport. Menu weight: the entire menu page transfers ~1/6 of what their
twelve menu JPEGs alone weigh.
