# VOLT//FLOOD — design notes

A 3D visual-targeted experiment: a chaotic, effect-heavy identity site for a
fictional underground audiovisual festival, where the chaos is composed by one
master clock.

## Concept

The site is not a landing page with a background — it is the festival's machine,
running. Every moving thing on the page (WebGL beams, speaker cones, waveform
floor, HUD blips, DOM glitch cuts, the optional synthesized soundtrack) hangs
off one 132 BPM clock in `js/app.js` (`window.VFSTATE`). Scroll is voltage:
it drives a HUD meter and walks the camera through the rig. The pointer is
interference: it shears the logotype slices and sways the beam fans. Hovering
a zone or a schedule row re-lights the whole machine in that stage's channel.

## Palette

Warehouse-rave heritage, deliberately not purple cyberpunk:

- `--void  #060608` — the room
- `--bone  #EDEDE4` — type
- `--acid  #D8F224` — VOLT channel (GRID stage)
- `--flood #6ED3FF` — FLOOD channel (FLOODROOM stage), used sparingly
- `--alert #FF4B1F` — hazard accents, glitch ghosts
- DRAIN stage runs near-white/dim.

## Type

- Anton — display slabs, the logotype, artist names
- Archivo — body
- IBM Plex Mono — telemetry, HUD, labels

## 3D machine (`js/machine.js`, three@0.180 ES module)

Abstract stage rig in one fixed canvas: shader-displaced wireframe waveform
floor (amplitude = voltage), procedural truss towers + crossbeam, 12 additive
beam cones stepping on the beat, two instanced speaker walls with kick-pulsed
cones, the logotype as 12 sliced canvas-texture strips shearing with pointer +
beat, signal rain (FLOOD channel), additive haze sprites, drifting poster
fragments. Camera path is keyframed on scroll progress and recomputed
absolutely every frame (home + f(p), never incremental). Text-dense scroll
ranges dim the machine's master exposure so hierarchy survives the overload.

## Signal touch (the central interaction)

The machine is touchable, not just watchable. The pointer is projected onto
the floor plane every frame and drives a real interference term in the floor
shader — the waveform visibly ripples around wherever you point. Press and
hold anywhere that isn't a control and the rig charges: the ripple swells,
every beam abandons its choreography and swings to track your hand, and the
HUD counts the charge. Release and the rig discharges — an expanding
shockwave ring through the floor, beam flare, logotype-slab scatter, a
"SURGE·DISCHARGE" phase flash, and a sub-drop impact if sound is on. On
touch devices a quick tap (not a scroll) fires the discharge directly.
Stage activation is structural, not just tonal: GRID runs the fan at
double-time chase, FLOODROOM drops the beams into a slow synchronized low
sway, DRAIN folds every beam onto one centre point.

## Sound: OVERDRIVE

The opt-in soundtrack is a hype, bass-boosted arrangement synthesized live
with the Web Audio API — saturated gliding 808 sub (tanh waveshaper on the
mix bus), phonk cowbell lead in A minor, punch kick with sidechain pump,
backbeat claps, driven hats and an 8-bar filter riser — sharing the same
132 BPM clock as the visuals, which is re-zeroed on play so audio and light
hit the same downbeats. Synthesized rather than sampled deliberately: any
"no copyright" remix of a real licensed track is still infringing, so the
engine builds the genre's signatures from oscillators and noise, which is
copyright-free by construction.

## Safety

No seizure-risk strobing: all large-area pulses are eased and ≤ 2 Hz; glitch
cuts are transform/clip jolts, not luminance flashes; `prefers-reduced-motion`
renders one static composed frame and disables the clockwork. The copy sells
this as festival policy ("managed light levels"), not as a site disclaimer.

## Fallback

House watchdog: if `window.VF.ready` never appears (~3.5 s), `body.no3d`
reveals a designed static backdrop (SVG rig + CSS grid floor) and the page
remains fully legible. No stock or generated imagery anywhere — the entire
visual system is procedural, so IMAGE-CREDITS.md records zero external assets.
