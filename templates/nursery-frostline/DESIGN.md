# FROSTLINE — a hardy plant nursery at Harrowgill Bank

A nursery site. Not a garden centre, not a lifestyle brand, not a plant shop.

The whole site rests on one fact: a perennial raised under heat and sold in
leaf in February has never met a winter, and a perennial raised outdoors at
412 metres has met nothing else. That difference is invisible on the bench and
decisive in the ground. So the site's line is **"Grown cold on purpose,"** and
the structure, the palette and the one interactive all serve that single claim.

The corollary is the harder half, and the site commits to it: if the argument
is that a plant must match its site, then the nursery has to say out loud when
its own stock does not. It does — see **the gate**.

## DNA (extracted, not copied)

| Source | What we took | What we refused |
|---|---|---|
| [Curtis's Botanical Magazine](https://www.biodiversitylibrary.org/bibliography/6) (1787–) | A plant is presented as a **specimen**: one subject, line only, name and authority set beneath it. The hero is a drawn eryngium, not a photograph of a border. | The hand-tinting and the antiquarian frame. No parchment, no sepia, no deckled edge, no faux-aged paper. |
| Kew / RBGE herbarium sheets | The **label block is the design unit** — locality, grid reference, altitude, aspect, lowest recorded temperature, set small and monospaced and never decorated. `.locality` and every spec block on the site is a herbarium label. | The dried brown specimen itself. These plants are alive; the drawings are of living growth. |
| [RHS Plant Finder](https://www.rhs.org.uk/plants/search-form) · Beth Chatto's catalogue | Dense tabular nomenclature — binomial, rating, height × spread, aspect, soil, all on one line — and "right plant, right place" as a **literal mechanic** rather than a slogan. | The undifferentiated flatness of a printed list. The catalogue has hierarchy; a nursery list usually has none. |
| Piet Oudolf's planting plans | Layout rhythm as **overlapping drifts of unequal width**, offset across a 12-column grid. Structure that still reads when the page is quiet. | The painterly rendering of the plans. Nothing here is washed or textured for its own sake. |
| [motion.dev](https://motion.dev/) | Springs for anything pointer-driven, scroll-**linked** progress rather than fire-once triggers, and a capped stagger model. | The library. Four animations do not justify a third-party host on a self-contained template, and PATTERNS.md already records a CDN-timing failure in this repo. Hand-rolled on WAAPI/CSS. |
| [21st.dev](https://21st.dev/) | One idea: a control should **preview its own consequence** before you commit to anything. | Its React/shadcn implementation, and the component-showcase look — no glassmorphism, no gradient borders, no floating cards. |

## Materials

One authored palette, not a light/dark pair. The catalogue already has many
dark templates; a paper-first, type-led site is the differentiation, and a
herbarium sheet has exactly one state.

**Green is data, never brand.** `--leaf` appears only inside plant
information — the drawn specimens and the catalogue plates — and never as a
surface, a heading or a button. A nursery site that is green all over is the
generic outcome this palette exists to avoid.

| Token | Value | Contrast on ground | Role |
|---|---|---|---|
| `--sheet` | `#ede8dc` | — | page ground — herbarium buff, warm, never cream and never white |
| `--sheet-2` | `#e2dccb` | — | raised band |
| `--sheet-3` | `#d5cdb8` | — | inset well, the composed order sheet |
| `--deep` | `#16242b` | — | the one dark band — winter ground |
| `--ink` | `#16181a` | 15.9:1 | type |
| `--ink-dim` | `#5a5c54` | 5.4:1 | muted copy |
| `--frost` | `#2e4e5c` | 6.9:1 | **the dominant.** Hardiness, winter, every structural rule and label |
| `--madder` | `#a33a22` | 5.1:1 | **reserved: this will die here.** And the single primary action, nothing else |
| `--leaf` | `#46603a` | 5.5:1 | living foliage — drawn specimens and the thrive column only |
| `--rule` | `#b9b09a` | — | every hairline |

Every text value clears 4.5:1 on `--sheet`; `--ink-sheet` clears 12.4:1 on
`--deep`. `--madder` is the only warm value on the page and it is spent on
failure and on one button, so a red anywhere on this site means something.

Type: **Spectral** (display and prose), **Archivo** (eyebrows and UI),
**Spline Sans Mono** (every number, label, rating and grid reference). The
Spectral italic is load-bearing rather than decorative — binomial nomenclature
*must* be italic and the authority must not be, so the typeface had to have a
real italic with a distinct roman. Not Cinzel, not EB Garamond, not Courier
Prime (HARLOWE), not Bodoni Moda, not Instrument Sans, not DM Mono (HAMON),
and not Inter.

## Motion signature — **the break**

Nothing fades and nothing slides in from the side. A revealed element is
**unfolded from its own baseline** — a `clip-path` inset opening from the
bottom edge with a short rise — the way a shoot breaks ground. 0.7 s on
`cubic-bezier(0.16, 1, 0.3, 1)`, stagger 0.08 s capped at three steps.

The observer watches each `<section>`, never the clipped elements themselves,
for a reason recorded in `js/site.js`: a `.brk` element can be taller than the
viewport, and such an element can never reach a fractional threshold. Watching
sections at threshold 0 cannot strand anything, and it makes the stagger read
as one event per viewport instead of each child racing its own observer.

Pointer-driven controls answer with a spring rather than an ease
(`cubic-bezier(0.22, 1.2, 0.36, 1)`) and the left rail is scroll-**linked**,
reading document progress every frame rather than snapping at thresholds.

`prefers-reduced-motion` removes the unfold entirely (content is simply
present), stops the rail, and leaves the gate completely usable.

## The one authored moment — **the gate**

Four controls describe a site: coldest night (−25 → −2 °C), aspect, shelter,
moisture, soil. All sixteen plants are then assessed against it and sorted
into **will thrive / will survive / will die here**.

The third column is **shown, not hidden**, and every entry in it carries the
computed reason it failed: *"Hardy to −5 °C. Your site reaches −18 °C."*
*"Will not take a north-facing position."* *"Needs a lee. Open ground shreds
it."*

The mechanic is the last part. At the cold, exposed end of the range the
nursery's own two showpiece plants — *Salvia* 'Amistad' and *Melianthus
major*, the H3 pair everybody asks for — land in the death column, and the
page says so in its own voice:

> Both of the plants we are best known for are in the third column. At −25 °C
> they are annuals wearing a perennial's price. Do not let us sell them to
> you.

At −25 °C the tally is 0 thrive / 5 survive / 11 dead. That is the honest
answer for a site like that, and the page gives it instead of a filtered
shopping list. It is deliberately **not** a product recommender: it removes
stock from consideration, it never adds an upsell, and its conclusion
regularly argues against the sale.

Every figure is computed from the stock data in `js/catalogue.js` — the
headline, the tally, each reason string, the °C of cold margin and the
recommended first plant. Nothing in the output is written copy, including the
confession above.

Hardiness uses the published RHS ratings, and the floors are the real ones:
H3 −5, H4 −10, H5 −15, H6 −20, H7 below −20 (modelled at −25 for arithmetic).
The readout names the **lowest rating that will survive the site**, not the
band the number sits inside — a site reaching −12 °C needs H5, not H4. Getting
that one step wrong made the readout contradict the columns underneath it.

## Structure

The home page is the argument in five moves, not a feature tour:

1. The claim, with the nursery's own locality block as evidence — 412 m, NNE
   open, −19.4 °C lowest recorded, 168 frost-free days.
2. Why it matters: 4% first-winter losses on field-grown stock against 31% on
   the forced stock the nursery stopped reselling in 2019.
3. **The gate.**
4. The growing ground — eleven acres, no roof.
5. Five specimens, deepest-hardiness first.

## Pages

1. `index.html` — the claim, then the gate.
2. `catalogue.html` — all sixteen as herbarium specimen entries with drawn
   plates, sortable by hardiness, height, name or price.
3. `field.html` — the site, the four-stage method, the two people, and a
   lifting calendar computed from each plant's own dormancy window.
4. `order.html` — a written order sheet. No basket, no card field, no backend:
   it composes a specification and hands it to a mail client.

## What this is not

- Not HARLOWE and not HAMON. Different material entirely (living stock, not
  cast bronze or forged steel), a paper ground instead of a dark one, a
  different type trio, a different motion signature, and an interactive that
  *disqualifies* stock where theirs compute a limit and a price.
- Not a shop. Nothing adds to a cart. The transaction starts with a written
  sheet, because that is how bare-root stock is actually sold.
- No photography. The specimens are drawn line engravings, which is what the
  Curtis DNA calls for — and stock plant photography is the most generic
  imagery available for this subject.
- No green surfaces, no leaf-motif watermarks, no soft rounded cards, no
  watercolour washes, no seasonal gradient, no purple anything.
- No claim that a hardy plant is a better plant — only that it is the right
  one for a cold site, which the gate will happily tell you it isn't.
