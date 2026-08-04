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

For the same reason the five game cards use type and layout rather than stock photography — no
stock photo of someone else's venue is passed off as one of their rooms.

## The 3D hero

`js/lava-3d.js` — a WebGL molten tile floor, chosen because "Floor Is Lava" is the venue's flagship
room. One plane, one material, no noise: the grid comes from `fract()` on position and the motion
from a single `sin()` per fragment, anti-aliased with `fwidth()` so the perspective grid doesn't
shimmer toward the horizon. A few floating "safe" tiles bob above it so it reads as the game rather
than a generic grid.
