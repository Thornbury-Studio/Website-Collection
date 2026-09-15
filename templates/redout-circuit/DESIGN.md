# REDOUT — design notes

The professional FPV racing league. Sixteen pilots, eight rounds, twelve
gates a lap. Four pages: the league (`index.html`), the season
(`season.html`), the grid (`pilots.html`) and tickets (`tickets.html`).

## The one idea

The name is the physiology: blood forced into the head under negative G,
the opposite of a blackout, the moment a pilot cannot afford a mistake. So
the site has exactly one colour, and the colour is that. Black, paper, and
a traffic-signal red that belongs to the brand — on the buttons, the hazard
bands, the armed gates, and the veil that floods the edge of the viewport
when the page is scrolled hard. Every frame of footage and every photograph
is graded to grey steel so that nothing else on the page can be red.

Loud is done with scale and contrast, not with glow. Section titles are set
at 9vw. The feed wall is three 4K portrait clips playing at once. The
tickets band is a full-bleed red field. There is no neon, no particle, no
gradient that is not a scrim.

## Type

One display face, **Anybody**, used across its whole width axis, because a
variable width is the typographic version of G-force:

- `wdth 125` (expanded) for the wordmark and the header mark;
- `wdth 62–70` (compressed) for every number — lap times, points, prices;
- `wdth 68–84` for section titles and statements;
- and on the kinetic lines (the wordmark, the hero statement, the inner-page
  h1s) the width is **driven by scroll velocity**: `--wdth` on `<html>`
  runs from 125 at rest toward 62 as the page is thrown, and eases back.
  The same letters under different load.

**Barlow** does the talking. No monospaced face anywhere; the timing
tower and the split tables are compressed Anybody with tabular figures,
not a terminal.

## Effects, and what each one is about

| Effect | What it is about | Where |
|---|---|---|
| Feed wall | The broadcast: three pilots' goggle feeds side by side | Home hero |
| Wordmark on the seam | White over the footage, black over the paper — two clipped copies, split exactly at the section edge | Home hero |
| Kinetic width | G-force on the letters | Wordmark, statement, inner h1s |
| Redout veil | The name. Red floods the periphery above ~1 400 px/s of scroll, and holds at 42% while the start lights are on | Every page (`.veil`) |
| Gate sequence | One lap, armed gate by gate as you scroll: twelve gates go red in order, the racing line draws, the splits print, the clock runs to the real best lap | Home, sticky section |
| Start gantry | The signature. Five lights, a random hold, lights out; your reaction ranked against the sixteen pilots. Jump start if you go early. Space or tap. | Home |
| Lap comparison | Two pilots on one course; drag the lap, watch the gap open and close, gate by gate | Season |
| Hazard bands | Running red/paper stripes as section dividers | Everywhere |
| Pressed buttons | Hard offset shadow that collapses on `:active`; hover inverts to red | Everywhere |
| Rows that go red | Standings and calendar rows invert to red on hover | Home, season |

Everything above is switched off or made static under
`prefers-reduced-motion`: the wall shows posters, the gates arrive armed,
the veil is `display: none`, the hazard bands stop, reveals are instant.

## Data

`js/data.js` is the season. Standings are summed from round results; gaps
are differences of those sums; the ticker's "Cardoso leads Aakre by 3" is
computed; the reaction grid the gantry ranks you against is the pilots'
reaction column; every lap split on the site comes out of one seeded pace
model (`lap(pilot, round)`), so the gate sequence on the home page and the
comparison tool on the season page cannot disagree. Round dates print in
the venue's own time zone; the calendar adds the reader's local time
underneath. Nothing is typed twice.

## Layout

Full-bleed, four sections in a row without a card grid: the wall, the
statement, the plate with four numbers, the gates. The two grids that do
exist (standings rows, the roster) are rules and type, not boxes. On a
phone the wall collapses to one feed at `100vw × 1.62` (never a vh unit),
the gate row becomes two rows of six, and the wordmark drops to `wdth 92`
so it can be taller.

## Verification

Headless Chrome over CDP (the pane on this machine does not composite).
Overflow sweep at 320 / 375 / 414 / 768 / 1024 / 1440 / 1920 on all four
pages: `scrollWidth − clientWidth = 0` everywhere, zero console errors.
The gantry was driven by script through arm → hold → lights out → react,
and arm → early press → jump start → reset, by pointer and by keyboard.
The hold form was exercised without opening a mail client by listening for
the `redout:hold` event it dispatches before it navigates. The reduced-
motion path was rendered with the media feature emulated. Video encodes
were checked at 1:1 with frame crops from the encoded files.
