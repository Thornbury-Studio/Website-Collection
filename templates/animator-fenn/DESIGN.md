# MARLOWE FENN — design notes

A personal creative-portfolio template. The catalogue had none: everything
else in `templates/` is a business or service vertical, and the locked
`Portfolio / Personal` card on the hub points at Zane's own site rather than
at something a customer can start from.

The fictional subject is a stop-motion animator and puppet fabricator in
Bristol. Bristol because it is the real centre of the craft in Britain, which
grounds an invented practice in a true place without borrowing a real
person's biography.

## Reference

DNA taken from the awwwards entry for **michaelgatt.com** — principles, never
identity, and nothing of the real person's name, bio or work.

What was actually taken:

| From the reference | What it became here |
|---|---|
| Two-tone `#0F0F0F` / `#CFCFCF`, no accent hue | Same discipline. There is no accent colour in `style.css`, and no pure white either — the lightest value on the page is the body text. |
| Single-page scroll narrative | One document, five numbered movements, no sub-pages. |
| Personality from a few hand-placed *biographical* props (his: a guitar, a backpack) | Three line-drawn objects a fabricator actually owns — a ball-and-socket armature, dividers, a strip of replacement mouths. One each in hero, workshop, about. Nowhere else. |
| Motion spent on a loader plus one signature interaction | A twelve-count film leader, and an exposure sheet where scroll is the playhead. |

The reference is a developer's portfolio. Reading it as "make a dark minimal
site" would have produced the same page for any discipline; the useful part
was the *structure* of its personality — sparse, specific, object-led — which
transplants onto a completely different trade.

## The one rule

**Narrative motion runs on `steps()`, not on a curve.** Stop-motion is sampled
time: discrete exposures, no motion blur, nothing in between. So reveals, the
leader and the stage all advance in visible increments — `steps(4, end)` over
333ms is exactly 12fps.

The deliberate exception is anything the pointer drives. Stepped feedback
under a cursor does not read as craft, it reads as lag — the visitor believes
the site is dropping frames rather than quoting a medium. Hover, focus and
button states stay on a smooth curve, and that contrast is the only reason the
stepped motion elsewhere is legible as a decision.

## The exposure sheet

An exposure sheet is the page an animator shoots from: one numbered row per
frame, and a column saying which drawing sits on it. Scroll is the playhead.
The head stays fixed and the paper advances under it, as it does on a peg bar.

The rows are **generated from the same model that draws the ball** — contact
and apex rows are found by inspecting the physics, not typed in. A dope sheet
that disagrees with the footage is worse than no dope sheet.

The subject is a bouncing ball because it is the first exercise every animator
is given and still the one that shows whether someone can time. It also earns
the stepped rendering honestly: the apex hang is not authored, it falls out of
the arcs, because a ball spends more frames near its apex than anywhere else.

`On ones / on twos` is a live control rather than a caption. It is the fastest
way to show a non-animator what the words mean, and it costs one `Math.floor`.

## Things that were wrong first, and why

- **Squash at 0.68 read as a pancake.** With volume preserved a 0.68 vertical
  squash is also a 1.47 horizontal stretch, and the two compound on a ball
  already drawn too large. Radius came down and squash softened to 0.76.
- **The shadow painted over the ball**, putting a grey band across its lower
  edge — the ellipse overlaps the contact position by design, so draw order
  mattered more than opacity. Shadow first, then onion skins, then the ball.
- **The leader's dismissal depended on `requestAnimationFrame`.** rAF is the
  right clock for animation and the wrong one for a deadline: it is not
  guaranteed to run, and was measured at literally zero frames per second in
  one embedded browser. A full-screen overlay that can only leave via the
  animation loop is a black rectangle waiting to happen. rAF now decides how
  it looks; a `setTimeout` decides when it goes.
- **Reveals could strand content at opacity zero.** Between IntersectionObserver
  (needs the rendering loop), the scroll sweep (needs a scroll event) and a
  deep link like `/#work` (which scrolls after load without firing one), there
  were too many ways to miss the trigger. Anything still hidden after three
  seconds is now shown regardless.

## Mobile is a different composition

- The nav keeps **one** link, not a hamburger. Five anchors on a single
  scrolling page do not justify a drawer, but burying the only commercial
  action at the foot of a 9,000px document is worse. Wordmark and Commissions.
- The sheet becomes a **shorter window onto the same paper** (24vh rather than
  24rem). Stacked under the stage inside a 100svh sticky pane that clips, the
  full-height sheet silently overran a 375×667 screen.
- A viewport too short to hold the instrument at all — a phone in landscape —
  **stops pinning it** and renders it as an ordinary block. The scrub is lost
  and nothing is cropped; losing an enhancement beats hiding content.

## Failure directions

Everything that starts hidden is gated behind a `.js` class set in
`boot.js` before first paint. With script off or broken, nothing is hidden:
no loader covers the page, no reveal holds content at zero opacity, and the
document is a plain scrolling page. The stage and sheet are inert, which is
the correct thing for an enhancement to be.

## Type

`Bricolage Grotesque` for display and body — variable optical size and width,
so the hero can run at `wdth 82` without a second family. `Space Mono` for
every technical readout: frame numbers, the sheet, labels, the availability
table. Nothing generic, and no third family.
