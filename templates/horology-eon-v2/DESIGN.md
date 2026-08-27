# EON ATELIER — No. 1 "Meantime" · v2 design notes

The second Eon Atelier study — a full restart. v1 (`templates/horology-eon`)
built the watch as procedural WebGL geometry; v2 inverts the strategy: the
object is **AI-generated cinematic photography** (six plates of one
instrument), and Three.js supplies the *space around it* — darkness, travel,
the visitor's lamp, depth, and the live registers.

## The governing ideas

> **A rare artifact, revealed in darkness.** The site is one continuous
> descent through six photographic chambers hung in a WebGL night. Between
> chambers there is only dark and a breath of glass.

> **The instrument on the page is running.** Same DNA as v1: the moon and
> tide are today's, the planets are today's, the lamp is the visitor's
> pointer, and Memoria counts the visitor's attended seconds. The readings
> print as live mono lines inside the chamber labels and again in the papers.

## The walk (~8.5 viewports)

| p | chamber |
|---|---|
| 0–.10 | **The dark** — the hero plate at 10% exposure; the pointer-lamp locally reveals it (`uLampReveal`); one centred line |
| .13–.26 | **The artifact** — dolly-in to the full instrument; "Four registers. No hours." |
| .26–.42 | **Aestus** — the tide basin plate; live moon/lean/water line |
| .42–.56 | **Umbra** — the gnomon plate; the lamp's azimuth shades the platter's far side and prints as a reading |
| .56–.70 | **Memoria** — the mainspring plate; live sitting + marks |
| .70–.84 | **Sidera** — the orrery plate; live longitudes |
| .84–.99 | **The face** — top-down portrait, micro-breathing roll; the coda line |
| →1 | canvas dims into the papers |

## Technique

- Three.js 0.180.0 (pinned jsdelivr module). `ColorManagement` disabled —
  the pipeline is pure sRGB compositing, so plate pixels, the night colour
  and the clear colour match exactly (a managed/raw mismatch showed the
  plate rectangles until this was set).
- One `ShaderMaterial` for all plates. Per-plate uniforms give: cover-fit
  UV mapping with per-tier zoom and focal point (zoom < 1 letterboxes into
  the night — invisible because plate edges dissolve via a UV-space fade);
  a **self-parallax** ellipse (the subject region samples the same texture
  at an offset from its background — seamless 2.5-D depth with no cutout
  matting); lamp sheen (`luminance × lamp falloff`, so metal answers the
  pointer); the Umbra directional shade; exposure windows; camera-velocity
  chroma/refraction ("glass breath" — derived from |dz| so it can never
  fire at rest); and manual exponential fog so distant chambers melt away.
- The lamp: pointer position (drag on touch), eased, with an idle lissajous
  after 4 s; a faint additive glow sprite rides the camera so the carried
  light exists even between chambers.
- Camera: a single 1-D dolly through z with smoothstep key segments;
  x/y sway from the lamp. Labels are fixed DOM with per-chamber windows and
  a `closest-side` radial scrim so type survives bright metal.
- Mobile is recomposed, not cropped: per-plate `zoomM`/`focusM` reframe
  each 16:9 plate for portrait (the hero pulls back to 52% so the whole
  instrument stands in frame), camera sway and DPR are reduced, and the
  cue becomes drag-for-light.
- Fallbacks: no-JS / CDN failure / WebGL failure / hero-load failure all
  fold to `.still` — the plates as a plain full-bleed editorial page with
  captions, then the papers. Papers reveals gated with failsafes (v1
  conventions). Scroll is held until the hero texture is lit, no gate UI.
- Payload: ~1.5 MB of webp for six chambers + the atelier figure; the hero
  preloads, the rest fetch after entry.

## Art direction of the plates

Generated as one set (see IMAGE-CREDITS.md): one verbatim STYLE block —
brushed dark rhodium/tantalum, blued steel, bone-silver dial, domed
sapphire, ruby-in-gold jewels; near-darkness with one cold window light and
a faint warm lamp; no lettering anywhere (all markings abstract ticks).
The five macro plates were re-staged from the approved hero via reference
image so the set reads as one instrument photographed in one sitting.
Type: Marcellus / Spectral / Spline Sans Mono on the v1 slate-and-bone
token system — one house across both studies.

## Content truth

Eon Atelier, Léonie Vasseur, the calibre and all specifications are
original fiction. The astronomy is not: moon age, phase, spring/neap lean
and planetary longitudes are computed from the real date.
