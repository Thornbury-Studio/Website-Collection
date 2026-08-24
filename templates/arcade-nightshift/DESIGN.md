# NIGHTSHIFT — design document

An original late-night gaming and entertainment centre with a dual identity:
a spectacular social venue while open, and the same building — powered,
looping, empty — after close. Original IP throughout: no FNAF characters,
locations, UI, lore or typography; no children's-pizza/animatronic territory
at all. The unease comes from emptiness and mundane infrastructure, never
from horror set-dressing.

## Brand

**NIGHTSHIFT** — the venue whose whole identity is the clock.
Open 10:00 to 02:00, every night. The brand line:

**PLAY LATE.**

Secondary copy leans on time: the Night Pass (stored-value card), Lock-In
Fridays (league night), "last race 01:40", and the standing fact that sells
the second personality: *the last game ends at two — the building doesn't.*

Voice: confident, specific, lightly deadpan. A premium operator that knows
its machines by model number. Never spooky-voiced, never "SaaS energetic".

## The two states

- **OPEN** is the website: energetic, crowded, commercial. It must succeed
  as a venue site with the other state deleted.
- **AFTER HOURS** is *discovered*, not toggled from a navbar. It lives in
  `ops.html` — a believable operations/surveillance portal (facility view,
  camera grid, event log) showing the same rooms from the marketing
  photography, empty at 02:47. Entry points are mundane: a "Operations
  (staff)" footer link, and the hours table's final row.
- Anomalies are restrained and deniable: one camera with no signal and an
  auto-raised ticket, case lighting on outside its schedule, an attract loop
  running on a machine the power plan says is in standby, one reviewed
  motion event with "no person found". Nothing red, nothing bleeding,
  nothing explained.

## Zones (kept from brief where strong)

GRID (racing arena) · VOLT (rhythm & reaction) · ARENA (competitive
multiplayer) · VAULT (prize gallery — glass-case redemption, not a ticket
counter) · SIDEQUEST (a corridor of strange small machines) · TABLE (food
and social) · ROOMS (private hires).

## Original machines (manufacture-plate presentation)

Every machine ships with plate data: model no., zone, players, footprint,
and one line of service history. Highlights:
- GRID: **Hairpin** (NS-GRD-01, 4-pod networked racers, motion base),
  **Overcut** (twin drift cabs, clutch pedal that matters).
- VOLT: **Tempo Zero** (nine-pad rhythm wall), **Flicker** (a wall of 120
  arcade buttons, 60-second clears), **Slipstep** (footwork cabinet).
- ARENA: **Fireteam Six** (six-seat co-op pod), **Kingmaker** (5v5 stage
  with casters' desk).
- SIDEQUEST: **The Longest Minute** (hold the button for exactly sixty
  seconds; no clock is provided), **Dial Tone** (a rotary phone that rings
  sometimes), **Queue** (a game about waiting; there is usually a queue).
- VAULT: **The Case** (glass-case redemption wall), **Penthouse** (stacker
  built like a lift going up a tower).

## Pages

1. `index.html` — sell the venue: hero, the floor by zone, signature
   machines, TABLE, leagues/events, Night Pass pricing, plan strip.
   One quiet band before the footer: the after-two fact, linking to ops.
2. `floor.html` — the machine index: filterable by zone, plate data,
   service-history one-liners (restrained).
3. `visit.html` — hours, Night Pass top-ups (bonus credits computed from
   data, never typed), ROOMS hire, house rules, FAQ, access, location.
4. `ops.html` — NS/OPS facility portal: camera grid (paired after-hours
   frames with HTML timestamp overlays), zone status board, event log,
   lost property. Believable VMS software first; anomalies second.

## Design system

- Type: **Unbounded** (wordmark + zone marquees only), **Inter Tight**
  (text/UI), **IBM Plex Mono** (plates, ops, timestamps).
- OPEN palette: near-black ground `#101114`, warm paper text, **sodium
  amber** `#f5a623` primary, restrained screen-cyan for tech UI. No
  purple-everywhere, no cyberpunk fog.
- AFTER HOURS palette (ops page): same ground, colder — blue-gray text,
  exit-sign green `#3ddc84`-ish as the only saturated color, ambers gone.
- Surfaces: matte panels, 1px hairlines, plate/label details (torx-screw
  corners drawn in CSS, barcode-free). No glassmorphism, no bento.
- Motion OPEN: fast, tactile (button-press scale, marquee shine on hover).
  Motion CLOSED: nearly none — slow fades only. Not the same system
  recolored.
- Sound: none. The site must be excellent muted, so it ships muted.

## Imagery

Recipe order (imagery gates layout). Two-part strategy:
1. **Paired generated frames** — the core trick: OPEN frames (people,
   energy) then AFTER HOURS re-stagings of the *same room* via
   reference-image re-staging ("the EXACT SAME room, empty, house lights
   down, attract screens on"). Commercial architectural photography
   language; believable conduit/signage/materials; NO readable text.
2. **Licensed stock** for human truth (candid players, machine details)
   and any real textures generation can't beat.
No AI video without explicit approval; stock video only if it earns place.

## Verification targets

The two screenshot tests from the brief, run literally:
- OPEN screenshot minus context → still an excellent venue site?
- AFTER HOURS screenshot minus horror symbols → same architecture now
  uncomfortable?
Plus house battery: overflow sweeps 320–1280, AA contrast on every token
pair, natural-visibility reveal pass, board/grid track assertions.
