# YORIMICHI — design notes

**Business.** Yorimichi Travel Pte. Ltd., a fictional Singapore tour operator
running eight small-group escorted tours to Japan, twelve travellers at most,
flights from Changi in the price. Everything on the site is a fact a customer
can act on: named tours, fixed departure dates with seats remaining, per-person
prices in S$, a booking calculator, an office address with opening hours.

**Archetype.** A cinematic tour-operator landing, after the reference mock the
build was briefed on: a full-bleed five-slide hero with a numbered index and a
three-column strip at its foot, a centred row of portrait tour cards, and a
night-sky film band with two chaptered clips. Inner pages are a photographic
header over a working page — filterable tour list, data-rendered tour detail
with a price calculator, region-filtered gallery with a lightbox, contact.

**Palette.** Night indigo (`#0B0F1A`, from *ai-iro*) and one vermilion
(`#E4512B`, the *shu* of a torii gate), off-white text. The dark of the
reference, drawn from Japan's own two colours rather than flat charcoal. Every
photograph is graded to the same lifted-indigo black point so the plates and
the page read as one surface.

**Type.** Nunito throughout — 800/900 uppercase for display, 500–700 for
body and UI — chosen by the client over the original Antonio/Onest pairing.
Display sizes are set for a wide rounded face, so every hero title holds one
line down to 360px.

**References.** The supplied travel-landing mock (layout, hero index, card row,
film band); Audley Travel's dark full-bleed photography; InsideJapan Tours'
departure-and-price tables; Intrepid Travel's trip cards and day-by-day
itinerary structure.

**Edges.** No band starts on a hard line: the hero, the film band and the
inner-page headers fade into the page ground at their edges, and the
contact band is a gradient rather than a bordered panel.

**Motion.** One reveal on entry, plus the live sky on the film band, added
at the client's request: a canvas of stars twinkles over the night
photograph, brightens around the pointer, drifts a few pixels against it,
and a meteor crosses every few seconds. It runs only while the band is on
screen and stands still under prefers-reduced-motion. The slider, the film,
the lightbox and the filters only move when asked; nothing is tied to scroll.
