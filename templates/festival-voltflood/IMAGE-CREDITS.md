# VOLT//FLOOD — asset provenance

No external imagery, video, audio or 3D assets are used anywhere in this
template. The entire visual system is procedural:

- The WebGL machine (waveform floor, truss, beam fans, speaker walls,
  logotype slabs, signal rain, haze, poster fragments) is generated at
  runtime in `js/machine.js` from three.js primitives and canvas textures
  drawn in code.
- The static no-WebGL fallback is an inline SVG authored by hand in
  `index.html`.
- The favicon is a hand-authored SVG (`img/favicon.svg`).
- The optional soundtrack is synthesized live with the Web Audio API in
  `js/app.js` (no samples).
- Fonts are Google Fonts (Anton, Archivo, IBM Plex Mono), OFL-licensed.
- `../../img/festival-voltflood-sm.webp` (hub thumbnail) is a screenshot of
  this template's own hero.

Stock searched: none needed. Generation credits used: 0.
