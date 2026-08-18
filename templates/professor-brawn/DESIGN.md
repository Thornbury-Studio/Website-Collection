# Common Ground Café — design notes

A fully original concept template for an inclusive-hiring social-enterprise
café, structurally identical to the site this began as but rebuilt end to end
so nothing on it belongs to a real, unauthorised business. See
[`IMAGE-CREDITS.md`](IMAGE-CREDITS.md) for asset provenance.

## What this template is now

This started life as a real-client build for an actual Singapore café. On
18 August 2026 it was revamped in full — new business name, new photography,
new marks, new copy on every page, no real address, phone number, email,
partner organisation or press citation anywhere in it. **Common Ground Café**
and **Bridgework Singapore** are both invented. The structure, componentry,
palette and interaction patterns are unchanged, which is the point: this is
now a reusable pitch template. Point it at a real inclusive-hiring café
prospect and the only work left is a content and photography swap — the same
five pages, the same interactive menu, the same open-now clock, the same
sticky action bar.

## The idea

A warm collegiate café identity — parchment ground, deep plum, gold accents,
one confident berry red — built around a simple, honest premise: a training
kitchen that became two real cafés, staffed by people who are paid and
rostered like any other crew, not photographed for a cause. The mission is
told as a short timeline and a few short testimonials, not a plea.

Three truths drive every layout, in this order:
1. THE FOOD LOOKS GOOD — real photography leads, dishes above the fold.
2. THE CAFÉ FEELS WELCOMING — parchment warmth, plants, real interiors.
3. THE MISSION IS CLEAR WITHOUT BEING A LECTURE — a short story, a seal, one
   line in the footer. It never interrupts someone trying to order lunch.

## Structure (unchanged from the original build)

Five pages — `index` / `menu` / `story` / `venue` / `visit` — sharing one
header, footer and sticky action bar. The interactive menu
(`js/menu-data.js` + `js/menu.js`) is entirely data-driven: an outlet toggle,
vegetarian and "picks & new" filters, and a jump-nav built from the section
list. `js/home.js` pulls the three "chef's recommendation" price chips and
the specials board straight from the same data file, so a price can never
drift between the homepage and the full menu. `js/ui.js` runs the reveal
animations and computes the live open/closed pill from the published hours.

## Marks

`img/crest.svg`, `img/crest-mono.svg` and `img/logo.svg` are original —
a shield badge carrying a CG monogram over a fork and spoon, in the same
plum-and-gold system the original build established. `img/favicon.png` is
rendered from the crest.

## Contact pattern

Every enquiry action is a `mailto:` link, not a live phone or WhatsApp deep
link. A concept preview has no real business behind it to receive messages,
and a plausible-looking Singapore phone number could belong to someone —
so nothing here is wired to ring or message a real number. Swapping in a real
client's real contact channel is a one-line change per file when this
template is actually deployed for someone.

## What a real client engagement would need to change

Everything currently invented: the business name and mark, both addresses,
the founding story and timeline, the menu and its prices, the venue package
pricing, and every photograph (see IMAGE-CREDITS.md for the licensing
approach to use). Nothing about the HTML structure, CSS system or JS behaviour
needs to change for that handoff — that separation is the whole reason this
revamp was done the way it was.
