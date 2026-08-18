# FANCY NAILS PARADISE — design notes

A prospective-client preview for a neighbourhood nail salon at Block 139
Tampines Street 11. Asset rules and factual sourcing: [`IMAGE-CREDITS.md`](IMAGE-CREDITS.md).

## Who this is for

A woman in Tampines, on her phone, deciding this evening or this weekend where
to get her nails done. She wants three things fast: *what does it cost*, *are
they open*, and *how do I book*. Everything else is secondary, and the design
is ordered accordingly.

That is why the site is three pages, not eight. The brief was explicit about not
overbuilding, and a salon with one location, one phone number and a walk-in
culture does not need a blog or an account system. It needs a price list you can
scan one-handed and a call button that never scrolls away.

## Mobile first, literally

`css/style.css` contains **no `max-width` media query at all**. Every base rule
describes the phone; desktop is added at `min-width: 700px` and `900px`. This is
the opposite of most of the collection, and it is deliberate — an audit of the
food templates found seven of twelve written desktop-first, and it showed on a
phone.

Consequences that only fall out of doing it in this order:

- The **hero image is a 4:5 portrait crop**, not a wide desktop frame squeezed
  down. It is generated as its own file (`hero-sq-*`), not the same photo
  reflowed.
- A **sticky Call / Directions bar** sits at the bottom of every page on phones,
  in the thumb zone. `body` reserves exactly its height plus
  `env(safe-area-inset-bottom)` so it never covers the last line of content.
  It disappears at 700px, where the header CTA takes over.
- Navigation is a **drawer**, not a squeezed inline bar, with a 44px trigger,
  52px links and body-scroll locking while open.

## Colour

Anchored to something factual: the salon's interior is publicly described as
baby blue with oversized armchairs. Powder blue is therefore the ground truth
here rather than an invented palette, warmed with porcelain and given a deep
rose for action — so the owner should recognise their own room in it.

Every token was checked against WCAG AA on all three surfaces. Two needed
solving: the muted grey (`--ink-3 #566670`, clearing 5.71/5.21/4.86) and the
rose (`--rose #94564F`, clearing 5.45/4.96/4.63 with white-on-rose at 5.67, so
it is safe as a filled button). `--rose-soft #B4736C` is kept for decoration and
is marked in the stylesheet as **never text** — it fails at 3.06 on powder.

Type is Playfair Display for display and Manrope for interface: elegant enough
to read as a salon, plain enough to stay legible at 12px on a phone.

## The price list

`js/services-data.js` is the only file that changes when the price board
changes; `services.js` renders it with category filtering and live search.

A `null` price renders as **"Ask in salon"**, never as `$0.00` and never as an
invented figure. Categories come from the salon's own published service list, so
the *shape* of the menu is accurate even where the numbers are not yet.

## Mobile QA

`gen/mobqa.mjs` in the working scratch (not committed) drove the checklist
across five viewports — 375, 390, 430, 344 and landscape 844×390 — with
`pointer: coarse` and `hover: none` genuinely emulated, since
`setDeviceMetricsOverride` alone leaves those at desktop values and silently
disables every touch rule.

First run: **0 of 15 combos clean.** Four real bugs:

1. **~300px horizontal overflow on every page and viewport.** The closed nav
   drawer was `position: fixed` + `translateX(100%)`, and a translated fixed
   element still counts toward the document's scroll width. Fixed by clipping it
   inside a viewport-sized `.nav-shell` with `overflow: hidden` — *not* by
   putting `overflow-x: hidden` on the body, which would have hidden this bug
   and every future one like it.
2. Brand logo link 125×30 and the phone link in the facts list 75×22 — both
   below the 44px thumb target.
3. Eyebrow labels rendering at 10.9px. Floored the whole type scale at 12px.
4. In landscape the bookbar hid at 700px but the header call button did not
   appear until 900px, leaving a phone held sideways with no visible way to
   book. The header CTA now appears at the same breakpoint the bookbar leaves.

Second run: **15 of 15 clean** — zero overflow, zero tap-target failures, 12px
type floor, no broken or slivered images, all reveals completing, drawer
opening/closing with body-scroll lock and scroll restoration, and the search
field at 50px.

## What the client would need to decide

- **Real prices.** The single most important handover item — see IMAGE-CREDITS.
- **Real photography.** The preview is deliberately built so this is a
  file-swap, not a redesign.
- Whether they want online booking. The site currently converts to a phone
  call, which is what the business actually runs on today; a booking widget
  would be an addition, not a rewrite.
