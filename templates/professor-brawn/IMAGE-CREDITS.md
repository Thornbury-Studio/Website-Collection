# Image & content credits — Common Ground Café concept template

**No creative asset or business fact belonging to Professor Brawn / Autism
Resource Centre (Singapore), the real Singapore café this template was
originally built for, is used anywhere in it.**

This template shipped twice. It first went out built entirely from that
café's own first-party material — photography, logo, mascot, brand artwork.
On **18 August 2026** every image was replaced with licensed stock (documented
below), which was the first fix. Later the same day the **entire remaining
content was revamped**: business name, marks, menu, prices, story, timeline,
addresses, contact details and every other fact on every page. Nothing about
the real business survives here — not even its name. This is now a fully
original concept template for a fictional business, **Common Ground Café**,
built by a fictional employment-support partner, **Bridgework Singapore**.
The structure, layout, componentry and interaction design are unchanged from
the original build; every word and every fact is new.

---

## 1. Photography — licensed Adobe Stock

Thirteen licensed sources cover seventeen image slots through different crops.
Every output matches the **exact pixel dimensions of the file it replaced**,
because the markup carries hard-coded `width`/`height` attributes — changing
them would have reintroduced layout shift. One identical grade pass, warmed
slightly toward the template's parchment ground (`#faf4e6`), so thirteen
photographers read as one café.

| Asset ID | Used for | File(s) |
| --- | --- | --- |
| 367861467 | Battered fish & chips | `fish-chips-*` |
| 840580751 | Steak & eggs | `steak-eggs-*` |
| 523019696 | Vegetarian spaghetti | `veg-spaghetti-*` |
| 313433625 | Hero dish flat-lay | `table-*` |
| 710727425 | Monthly special (lamb) | `promo-lamb-*` |
| 204148163 | Weekday lunch bowls | `promo-bowls-*` |
| 250311612 | Mocktail of the month | `promo-mocktail-*` |
| 387342176 | Café dining room | `amk-dining-*`, `crest-brick-*` |
| 651466993 | Bright dining room | `ev-dining-*` |
| 172168562 | Wood-panelled café interior | `ev-lounge-*`, `banners-*` |
| 310824298 | Café counter, people out of focus | `counter-pano-*`, `ev-counter-*` |
| 695534281 | Table set for a private booking | `chamber-*` |
| 142772444 | Long communal table | `venue-table-*` |

**A first pass used one café source for all four interior slots and the same
room appeared four times down the page** — it read as a stock set instantly.
Three further interiors were licensed so no room repeats.

**Counter shots deliberately keep people incidental or out of focus.** An
inclusive-hiring café's team is central to its mission; a stock photograph of
an identifiable barista presented in that context would imply it depicts real
staff. It does not, and the alt text never says so.

**Alt text describes only what each photograph literally shows.** None of it
claims to depict a real premises, a real team or a real dish.

**AI generation was not used.** Licensed photography covered every slot, so
the fallback was never needed.

## 2. Marks — original to this template

| File | What it is |
| --- | --- |
| `crest.svg` | Original shield mark: a CG monogram over a fork and spoon, in the template's plum and gold. |
| `crest-mono.svg` | Single-colour silhouette of the same shield, used as a CSS mask for the watermark treatment. |
| `logo.svg` | Original horizontal lockup — the shield plus a type wordmark, "Common Ground / Community Kitchen". |
| `favicon.png` | Rendered from `crest.svg`. |

These replace the real client's registered brand artwork, and — as of the
18 August content revamp — also replace this template's own first draft of an
original mark, which carried a "PB" monogram matching the real business's
initials. That was close enough to the thing it was meant to be distinct from
that it was worth re-drawing as "CG" once the business identity itself
changed.

**Deliberately not a character mark.** A real inclusive-hiring café's mascot
can be genuinely meaningful, protected creative work — this template's mark
is typographic on purpose, so it can never be mistaken for imitating one.

## 3. Removed rather than replaced (from the original real-client build)

Some assets could not honestly be swapped for stock, so they were removed
outright rather than substituted:

| Removed | Why |
| --- | --- |
| The original mascot illustration | A child's artwork, in the real build. Removed, not imitated. |
| A third-party certification badge | Certification marks belong to the certifying body, not the business displaying them, and cannot be reproduced or invented for a fictional business. |
| Two delivery-platform button graphics | Other companies' trademarks. |
| Two documentary opening-ceremony photographs | Real events with identifiable guests; substituting stock would fabricate a record of an event that never involved this fictional business. |

## 4. The content revamp (18 August 2026, second pass)

Every page, the interactive menu (`js/menu-data.js`), the shared chrome
(`js/ui.js`, `js/home.js`, `js/menu.js`) and the JSON-LD were rewritten so
nothing on the live site is a real address, phone number, email, partner
organisation, press citation or menu price belonging to the original real
business. See [`DESIGN.md`](DESIGN.md) for what changed and why, including the
decision to route every contact action through a `mailto:` link rather than a
live phone or WhatsApp number — a plausible-looking invented Singapore number
could belong to someone, and a concept preview has no real business behind it
to receive the message anyway.
