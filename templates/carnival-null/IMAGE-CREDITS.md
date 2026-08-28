# NULL CARNIVAL — asset provenance

No external imagery, video, audio or 3D assets are used anywhere in this
template. The entire visual system is procedural:

- The WebGL room (concrete deck and pit, gilt booth arches, portal discs,
  bulb wire, SDF masks, carousel drum, symbol storm, haze) is generated at
  runtime in `js/carnival.js` from three.js primitives, hand-written GLSL
  and canvas textures drawn in code.
- The post-processing chain (bright-pass, separable bloom, composite with
  barrel distortion, chromatic aberration, grain, scanline and the null
  lens) is hand-written in the same file — no three.js addons are reachable
  under this page's CSP.
- The hero wordmark is an SVG banner plate with the letterforms cut out by
  an SVG mask, authored by hand in `index.html`.
- The static no-WebGL fallback midway is an inline SVG, also authored by
  hand in `index.html`.
- The favicon is a hand-authored SVG (`img/favicon.svg`).
- The optional soundtrack is synthesized live with the Web Audio API in
  `js/app.js` (no samples).
- Fonts are Google Fonts (Bodoni Moda, Archivo, Space Mono), OFL-licensed.
- `../../img/carnival-null-sm.webp` (hub thumbnail) is a screenshot of this
  template's own hero.

Stock searched: none needed. Generation credits used: 0.
