# OSCILLA — image provenance

Oscilla is a **fictional business**. The company, the four instruments (Field, Tide, Dusk and
North), their specifications, firmware versions, prices and all copy are original to this
template. No real manufacturer's identity, products or pricing are used.

## The instruments — generated (Gemini)

No stock library sells photographs of hardware that does not exist, so the entire product range
was generated on **11 August 2026** through the Gemini API from original prompts written for
this template. The flagship frame came from `nano-banana-pro-preview`; the rest fell back to
`gemini-3.1-flash-image` when the pro model returned 503s mid-run.

The design brief was written once and repeated verbatim in every prompt — charcoal anodised
panel, solid oak end cheeks, knurled black knobs with amber indicator caps, identical studio
lighting and camera angle — which is what makes the four read as one maker rather than four
unrelated boxes. Lettering was explicitly forbidden in every prompt: generated text arrives as
gibberish and would have sunk the illusion at any zoom level. All panel markings are abstract
lines and dots.

| File | What it is |
|---|---|
| img/hero-rig.webp | All four instruments on a birch bench, joined by patch cables — the hero |
| img/i-field.webp | Field · OS-1, the voice |
| img/i-tide.webp | Tide · OS-2, filter and delay |
| img/i-dusk.webp | Dusk · OS-3, percussion |
| img/i-north.webp | North · OS-4, sequencer |
| img/panel-macro.webp | Macro of three knobs, an amber indicator and the oak cheek |

Each was reviewed before shipping, then pulled down toward the page ground and cooled slightly
so a mid-grey seamless would not glare against a near-black page.

## Workshop photography — licensed Adobe Stock (free tier)

Four photographs were searched, licensed and downloaded on **11 August 2026** through the Adobe
Stock connector, free-tier assets only. Every asset was checked to be `isGenTech: false`.

| File | Adobe Stock ID | Used as |
|---|---|---|
| img/w-solder.webp | 354340897 | Home band and workshop — soldering iron and smoke |
| img/w-board.webp | 266617869 | Instrument pages — populated board, macro |
| img/w-play.webp | 409328448 | Signal path — hands across a keyboard and drum machine |
| img/w-studio.webp | 435920514 | Workshop — burn-in at the bench |

### Why the photography is duotone

Straight out of the library these four fought the brand badly: circuit boards are green and gold,
and studio photography is lit magenta and purple. Desaturating was not enough — the hues still
argued with the amber and graphite.

Rather than hunt for photographs that happened to match, all four were mapped onto a single
luminance ramp — deep slate through an amber-leaning midtone to warm ivory. That turns a colour
problem into a deliberate art direction: **the instruments are the only things on this site in
full colour**, and every photograph reads as supporting material behind them.

`img/synth-oscilla-sm.webp` in the repository root is a screenshot of this template's own
homepage, used as its card in the hub gallery.

## What is real and what is not

**The instrument on the page is real.** It is not a recording, a sample or a loop. `js/audio.js`
builds a subtractive synthesiser voice on the Web Audio API — two detuned oscillators plus a
sine sub, a resonant lowpass with its own envelope, an ADSR amplitude envelope, and a delay
whose feedback path is damped so repeats darken as they die, into a limiter. The oscilloscope
draws real time-domain data from an analyser node on the master bus. The sequencer is sixteen
steps of the same voice.

Two rules the audio is built around. Nothing constructs an `AudioContext` until a click — the
page is provably silent on load, and says so before you press anything. And every parameter
change is ramped rather than assigned, because setting an `AudioParam` directly mid-note is
what makes a synth click.

The commerce is a working demonstration. The basket lives in localStorage
(`oscilla.basket.v1`) and survives navigation; the set discount is derived from the catalogue
rather than typed in, so the saving promised on the range page is the one the checkout applies;
shipping is shown before it is added. Validation is real. The submit charges nothing and sends
nothing — it renders a confirmation and says on the page that nothing has been charged.
