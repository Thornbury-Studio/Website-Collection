# NORTHLINE — asset credits

This template ships no photography and no generated imagery. The visual
is a live three.js scene plus hand-authored inline SVG instruments.

- **Land geometry**: Natural Earth 110m land polygons (public domain),
  rasterised to a 240×120 dot grid by `src/build-landgrid.mjs` into
  `js/landgrid.js`. Credit line appears in the site footer.
- **three.js** r180, loaded as an ES module from cdn.jsdelivr.net (house
  CSP pattern), with a designed static fallback when WebGL or the module
  is unavailable.
- `img/favicon.svg` and the wordmark are original vector art.
- Network, exception, lane and outcome figures are fictional and defined
  once in `js/data.js`; the scene and every console render from that
  catalogue.
