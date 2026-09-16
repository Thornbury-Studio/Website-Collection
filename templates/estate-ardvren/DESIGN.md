# ARDVREN — design notes

**Niche / persona.** Loch Ardvren Estate: a 640-acre Caledonian pine estate in
Highland Perthshire selling forty heritable plots and three turnkey larch
lodges. The customer is a couple in Edinburgh or Glasgow pricing a second
home; the site has to give them plot sizes, prices, covenants, the service
charge, a lodge total and a Saturday to come and walk it.

**Category / style.** `property` · `dark photography-led`.

**Layout archetype.** *Gutterless colour-block tile mosaic under a segmented
tab bar.* A framed page (dark ground visible at the edges); a four-segment
translucent tab bar sits on the top edge of a full-bleed photo hero that
carries the letter-spaced wordmark; below it, photo bands with a heading
set on them alternate with rows of three tiles that butt together with no
gutter — dark, mid-slate and photo tiles, each with its heading at the top
and its fact at the bottom. Phone: the tabs become a 2 × 2 grid, the hero
goes 4:5, bands go square, tiles stack, and the lodge and plot rows become
scroll-snap strips.

**Reference DNA.** The Pinterest pin the brief named — Katya Sokolova's (@SokolovaVladi73)
*Karelia* travel presentation (segmented CONTEXT / FORMAT / EXPERIENCE /
GASTRONOMY bar over a misty forest, "K·A·R·E·L·I·A" letter-spaced across the
photo, "What we give / what we do not" set on a river aerial, and the three-up
dark / stat / slate tile rows with a line ornament). Secondary references:
Vipp's Shelter and Chimney House pages (real timber-cabin product photography
sold with a whole number), and Landmark Trust's property pages (facts a buyer
can act on: sizes, dates, what is and is not included). The Lab's motion-001
supplied the one-shot IntersectionObserver reveal.

**Palette source.** The estate's own materials: Scots-pine dark for the
ground (`#14201f`), loch-slate for the mid tiles (`#3f5658`), mist for text,
and larch (`#c9a675`) as the single accent — prices, buttons, the active
drawer link. Photographs are graded into the ground colour by
`tools/grade.py` so shadows and tiles read as one surface.

**Type.** Didact Gothic (the Century Gothic-alike the reference is set in) for
every heading and number; Onest for body and interface. Neither is used
elsewhere in the collection.

**Interactions.** Lodge configurator on real photographs (lodge, plot kind,
cladding, options → total, with the shore sauna locked to lochside plots and
the summary photo following the choice); Phase 2 plot schedule with ground
and availability filters and three sorts; viewing booking with the next eight
viewing days generated from the calendar and the slots per weekday; deep links
between them (`plots.html?type=lochside`, `visit.html?plot=17`,
`lodges.html?lodge=ridge`). Motion is one reveal on entry and nothing else.
