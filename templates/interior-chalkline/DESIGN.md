# CHALKLINE — design notes

An interior design and renovation studio in Tai Seng, Singapore. Built 4 Sep
2026 as a flagship-tier child site for a category this collection had no
coverage of, and the most template-saturated vertical it could have picked.

## Who is choosing, and between what

A couple with keys to a 4-room BTO, or a resale flat they have just bought.
They are holding three quotations. All three are spreadsheets of the same
line items with different numbers, and none of them shows what the flat will
actually look like, or why the number is what it is. What decides it is not a
prettier hero photograph. It is which firm makes them feel they can *see*
what they will get, and *trust* the number, before they sign.

So the site has two jobs: proof, and arithmetic. Everything on it is one of
those two things, and everything else was cut.

## The direction: plan in hand

One aesthetic, chosen over "modern professional" on purpose. The site is
built the way a designer walks a client through their unit on the first site
visit: floor plan in one hand, a blue chalk line snapped across the screed to
show where the new wall goes. Precise ink linework for the structure; warm,
straight-verticals photography for the proof. The name is the tool. The
accent colour is the blue the chalk leaves on the floor.

Three design-reference principles, none of them surface:

- **Norm Architects** — one project owns a viewport; captions are short and
  factual; whitespace paces the portfolio instead of a grid cramming it.
- **Neri&Hu** — the drawing is content, not a "technical" tab. Plans sit
  beside photographs as equals.
- **How Singapore actually browses renovation** (Qanvast-style listings):
  by flat type, by room, by budget band, with the sqm and the weeks stated.
  The gallery filters and the project headers are built on those axes.

## The signature: the plan is the interface

The hero has no photograph until you touch it. It is a measured floor plan
of a real 4-room layout, drawn in ink, and hovering (or tapping, or tabbing
to) a room fills that room's outline with the photograph of the room as it
was finished. Rooms the studio did not touch stay plaster. The caption
under the plan prints that room's scope and its price.

The same plan module is the quote tool: on `quote.html` you pick your flat
type, the plan redraws, you tick rooms *on the plan*, choose how far each
one goes, and the estimate prints its own arithmetic — floor area from the
polygon, carpentry foot-run from the wall, every rate stated — underneath
the band. Then the whole thing composes into a WhatsApp message.

Every photograph on `work.html` is a pair. A range input scrubs the
"before" across the "after"; without JavaScript both images simply show.

## Tokens

```
--plaster   #F0EFEA   ground (skim coat, cooler than cream)
--plaster-2 #E7E6E0   panels
--screed    #D8D7D0   rules, plan floor
--ink       #17191C   linework, text   15.3:1
--ink-2     #3B3E44   secondary text    9.3:1
--muted     #5C5F66   captions          5.55:1 (never on screed)
--chalk     #2743C9   the blue          6.7:1 on plaster; white on it 7.7:1
--chalk-dust#DDE2F8   chalk wash
--dark      #1B1C1F   the dark band     on-dark #ECEBE6 14.3:1, chalk-on-dark #A3B4FF 8.5:1

display  Young Serif      hero statement and section titles only
ui/body  Golos Text       everything read
mono     Fragment Mono    dimensions, room labels, line items, prices
```

Layout: `--wrap: 84rem`, one gutter token, section bays at `clamp(4rem, 9vw,
8rem)`. Radii are 0 except on the pill buttons. Linework is 1px ink, wall
poché is solid ink. No hairline grid decoration anywhere; the only rules are
the ones that separate a line item from its total.

## What was deliberately left out

- No testimonial carousel, no service-icon triplet, no "why choose us".
- No stock photography. Every room is one photographed set (Gemini
  `nano-banana-pro-preview`, one STYLE block held verbatim across the set;
  each "before" is re-staged from its own "after" so the pair is the same
  room from the same camera). Provenance in IMAGE-CREDITS.md.
- No regulator or accreditation names claimed as endorsement. The permit
  step is described as a process fact only.
- No floating WhatsApp bubble. WhatsApp is the primary channel and sits in
  the header, in the quote flow, and in the footer as a real link with a
  composed message.

## Content truth

CHALKLINE, its people, projects, prices and addresses are original fiction
for this showcase. Estate and MRT names are real places used as texture.
