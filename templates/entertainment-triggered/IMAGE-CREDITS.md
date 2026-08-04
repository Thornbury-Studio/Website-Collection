# Triggered Games concept redesign — credits & sourcing

## Status of this template

This is an **unofficial concept redesign** of a real, operating business
([triggeredgames.sg](https://triggeredgames.sg/)), built as a portfolio exercise. It is not
affiliated with, endorsed by, or operated by Triggered Games Pte. Ltd.

Because it carries a real company's name, it is handled differently from the other templates in
this repo:

- `<meta name="robots" content="noindex, nofollow">` — it must never compete with, or be mistaken
  for, the real business in search results. Every other template here is `index, follow`.
- A permanent notice bar sits above the nav, and a full disclaimer sits in the footer.
- There is **no fake booking form**. Every booking CTA links out to the venue's real system
  (`bookeo.com/triggeredgames`), so nobody can believe they've booked something here.
- The price calculator is labelled indicative and points back to the official site.

## Business details

Facts (prices, hours, addresses, capacities, age limits, policies) were taken from the public
website and cross-checked against partner listings, then written up in fresh copy — none of the
original site's marketing prose is reproduced.

Pricing was verified against two independent sources because the live site renders its rate table
client-side and it reads as `$0` when fetched:

| | Off-peak | Peak |
|---|---|---|
| Standard | $16.00 | $20.00 |
| 10% (IG/TikTok, code TTIG10) | $14.40 | $18.00 |
| 15% (HomeTeamNS/SAFRA/NEBO/PAssion, min 4 pax) | $13.60 | $17.00 |

The venue's own "as low as $13.60" headline is the off-peak member rate, which is what confirmed
the $16 base.

**These figures were accurate at the time of writing and may since have changed.**

## Imagery

Licensed from **Adobe Stock** (free-tier collection) via the site owner's Adobe account, then
graded with the Adobe Lightroom API.

| File | Adobe Stock ID | Reframe (Photoshop) | Grade (Lightroom) |
|---|---|---|---|
| `img/venue.webp` | 382903264 | 3840×2160 → 1400×780 | `Color — High Contrast` |

Re-encoded locally to WebP (Pillow, quality 72–74, method 6) — **26 KB for the set**.

`img/venue-glitch.webp` is a derivative of `venue.webp`, run through the Photoshop API's chromatic-aberration glitch effect (red channel shifted -16px) and re-encoded to WebP (ffmpeg, ~1300×724, 35 KB). It's the hover state of the visit-section photo (`.visit-glitch` in `css/style.css`, wired up in `index.html`) — a real edit, not a CSS filter standing in for one.

### Two images were deliberately cut

A laser-tag photograph (Adobe Stock 386439997) was licensed and graded for the hero, then dropped:
this venue doesn't run laser tag. Its games are Floor Is Lava, Press It!, Hide & Seek, Hoops
Madness and Hexa Blasts. Using it would have misrepresented what the business actually offers,
which matters more here than on a fictional-brand template.

A "people jumping on colour-blocked backgrounds" photo (Adobe Stock 479342163) was licensed, graded
and shipped in the Groups section, then pulled after review (2026-08-04): it's a stock **collage**
with hard seams between panels and severed hands/arms visible at both frame edges, and its bright
pastel studio look clashed with the dark neon palette everywhere else on the page. Replaced with a
fact grid (rooms, capacity, parallel sessions, add-ons) drawn from real numbers already on the page,
rather than spend another sourcing/grading pass chasing a stock photo that would still be a generic
crowd shot with no real connection to this venue.

## The room diagrams

The real site gives each game a 3D render of its room, which is the single most useful thing on it —
you can see what you're walking into before you book. The five game cards here do the same job with
**original isometric SVG diagrams**, generated from computed geometry by
[`tools/gen-room-diagrams.js`](tools/gen-room-diagrams.js). That script is build-time only — nothing
loads it at runtime. Its output is inlined directly into `index.html`, so re-running it (`node
tools/gen-room-diagrams.js rooms.json`) regenerates the SVG for re-inlining if the geometry changes.

They sit **deliberately between realistic and abstract**. Each one shows the single thing that room
actually is, and nothing else — one accent colour from the site palette, simple geometry, lighting
doing the work:

| Room | What the diagram shows | Accent |
|---|---|---|
| Floor Is Lava | A lit floor. Five live tiles in a 5×5 grid | Hot pink |
| Press It! | A sparse grid of wall buttons, three of them live | Volt |
| Hide & Seek | One pillar with a lit cap. That is the whole room | Ice |
| Hoops Madness | Three hoops on one wall, a few balls below | Flame |
| Hexa Blasts | One honeycomb of seven, two live | Hot pink |
| Combos | Not a room — two rooms and a plus, since it's a booking shape | Both |

Getting here took three passes and both wrong turns are worth recording:

1. **Too abstract.** Invented layouts — scattered blocks for Hide & Seek instead of a pillar, hoops
   spread over two walls, molten orange for a floor that is white LED tile.
2. **Too literal.** Corrected against the venue's published photos, but by then it was reproducing
   their rooms in detail — dense multicoloured button fields, twelve-wide grids — which was both busy
   and off-brand, and a straight-on diorama box that read flat no matter how well it was shaded.
3. **Between the two**, which is where they are now: correct in what each room *is*, stripped to the
   minimum that communicates it, in this site's palette rather than the venue's.

### What makes them read as 3D

The projection is a real axonometric camera — points are given in 3D room space and projected, rather
than placed inside flat 2D quads. The two ground axes use **different** angles (18° and 36°), so the
box is asymmetric; a symmetric straight-on box reads flat however carefully it is lit, which is what
sank pass 2. Walls carry visible thickness at the top rim, which is the other cue that says "solid
object" rather than "drawing".

Lighting does the rest: a gradient per surface, a lit skirting where wall meets floor, a bloom halo
on anything live, a squashed blurred reflection in the floor, and a vignette. The accent light pool
on the floor is kept very faint — at any real strength it floods the floor and the room stops reading
as a room.

Each room's live fittings appear three times (reflection, bloom, crisp), so they are defined once in
`<defs>` and referenced with `<use>`; emitting them literally tripled the page weight for no gain.

### Adobe tooling here

`img/grain.webp` is a **Photoshop grain pass** over a flat grey plate, tiled at 16% opacity over every
room diagram. A render has sampling noise and flat vector fills don't, which is a good part of why
clean SVG reads as "drawing". It is cropped to 128px (~5KB) because noise is essentially
incompressible — the full 320px tile came to 34KB, which is a lot for a texture you are not meant to
notice.

The rooms themselves were also rendered to PNG and run through the same grain pass as an experiment,
to see whether they should ship as bitmaps. They looked good, but that would have traded away crisp
scaling and the per-element hover animation, so the vector version shipped with the grain applied as
an overlay instead.

A halftone pass was also tried as a stylised wall texture — the aesthetic is right in principle, but
a halftone of a flat plate is a dense high-contrast dot field that reads as moiré at these sizes and
fights the grain already there. Not shipped.

Adobe tooling is used elsewhere in this repo too: the glitch frame of `venue.webp` is a real
Photoshop chromatic-aberration pass, and the Meridian team photos were graded through the same API.

Inlined rather than linked so there are no extra requests and the lit elements can be animated by the
page's own CSS on hover. Nothing here is traced from, screenshotted from, or derived from the real
venue's artwork — a diagram that is obviously a diagram can't be mistaken for a photo of their rooms,
which is the whole reason for going this way instead of buying stock renders.

For the same reason the cards use no stock photography — no stock photo of someone else's venue is
passed off as one of their rooms.

## The 3D hero

`js/lava-3d.js` — a WebGL molten tile floor, chosen because "Floor Is Lava" is the venue's flagship
room. One plane, one material, no noise: the grid comes from `fract()` on position and the motion
from a single `sin()` per fragment, anti-aliased with `fwidth()` so the perspective grid doesn't
shimmer toward the horizon. A few floating "safe" tiles bob above it so it reads as the game rather
than a generic grid.
