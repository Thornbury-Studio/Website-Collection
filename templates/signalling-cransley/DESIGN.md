# CRANSLEY SIGNAL WORKS — direction contract

Mechanical signalling engineers, Ludlow. Lever frames, tappet interlocking,
semaphore arms, block instruments, gate gear.

## The one idea

The proposition and the mechanism are the same object. The headline says
"The frame says no"; directly beneath it is an eighteen-lever frame with
working interlocking that will refuse a pull and name the lever holding it.
Nobody has to be told the locking works — they find out by failing to break it.

## Reference DNA

- **British Rail Corporate Identity Manual (1965)** and Kinneir & Calvert's
  **Rail Alphabet** — the institutional grid, the flat bars, the signage voice.
  Instrument Sans stands in for Rail Alphabet.
- **The illuminated signal box track diagram** — white line-work on black,
  point ends drawn as two legs with the set road bright and the unset road dim,
  lever numbers keyed straight to the frame below.
- **The UK standard lever plate colour code** — red stop, yellow distant, black
  points, blue facing point lock, brown gate gear, white spare. This is the
  entire palette. No colour enters the page that is not on a lever plate, which
  is why the page is never asked to have taste about colour.
- **Saxby & Farmer-era tappet locking tables** and the ruled **Train Register
  Book** — the locking model and the log.

## Type

- `Rokkitt` — Egyptian slab, for cast-plate and nameplate moments.
- `Instrument Sans` — everything structural.
- `DM Mono` — lever numbers, register, locking table, all labels.

## The locking (js/frame.js)

One rule generates every behaviour in both directions:

> A lever may move — either way — only if, in the resulting state, every
> reversed lever's conditions are still satisfied, its own included.

That produces the signal that will not clear over unset points, the points that
will not move under a cleared signal, and the facing point lock that cannot be
restored while the signal it released is off. The only special case is the FPL
itself, which holds its points in whichever position it found them
(`bothWays`) rather than in one nominated position.

Refusals are logged in the register with the number of the blocking lever.
Three set-piece movements (loop acceptance, loop departure, a yard shunt) tick
off when their target levers all stand reverse.

## Two registers

- `index.html` — the box. Diagram black, white line-work, enamel plates.
- `workshop.html` — the paperwork. Ledger stock, a margin rail of bench numbers
  and elapsed weeks, the full locking table set as a table, and the work the
  shop turns down.

## Mobile is its own composition

The frame does not shrink. Below 700px it stops being a row of levers on a
quadrant and becomes a vertical list of enamel plates with their function and
colour class, each plate carrying a normal/reverse edge indicator. The plate
readout un-sticks from the bottom and pins to the top of the list, so it reads
as a control header while you work down eighteen rows. The track diagram keeps
its true proportions in a deliberate side-scroll with its own hint rather than
being squashed.

## Motion

One idea: things throw. Levers swing on a bottom pivot, semaphore arms rise
45 degrees, ground discs rotate, gates swing across the road, point legs
brighten. A refused pull judders and flashes the plate. No parallax, no
marquee, no scroll mapping. Everything honours `prefers-reduced-motion`.
