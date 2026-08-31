# Shared patterns

Templates in this repo are deliberately self-contained (`index.html` + `css/style.css` +
`js/main.js` + `img/`), so there is no shared bundle to import from. This file is the
reference copy of patterns that were getting re-implemented — and re-broken — per template.
Copy the snippet, don't link to it.

---

## Seamless marquees ("true loop")

A marquee is a track of identical rows translated to `-50%` on a linear loop. It only looks
continuous when **all three** of these hold. Every marquee in this repo originally failed at
least one of them, and OBLIK failed the third one on its own after the first fix round.

### Rule 1 — no `gap` on the track itself

With `N` children and a track-level `gap`, the track is `N` items + `(N−1)` gaps wide. Half of
that is `N/2` items + `(N−1)/2` gaps, but one true period is `N/2` items + `N/2` gaps. Every
cycle lands **half a gap short**, and the seam visibly jumps.

Put the spacing on the row instead, and give the row a matching trailing `padding-right` so the
space between the last item of one row and the first item of the next equals the space inside
the row:

```css
.marquee       { display: flex; width: max-content; }   /* no gap here, ever */
.marquee-row   { display: flex; flex-shrink: 0; gap: 2rem; padding-right: 2rem; }
```

`flex-shrink: 0` matters — without it the rows compress and the copies stop being identical.

### Rule 2 — half the track must cover the container

`-50%` slides the track by exactly one half. If that half is narrower than the viewport, the
content runs out mid-screen and you watch it reset. Two copies is **not** enough on a wide
monitor: at 2530px with a 609px row, OBLIK was showing 1921px of blank.

The number of copies needed depends on the viewport, so hardcoding it doesn't hold up. Clone at
runtime instead.

### Rule 3 — never change `animation-duration` on an animation that's already running

This is the subtle one, and the one that survived the first fix. The CSS animation starts the
instant the browser first paints the track, under whatever duration the stylesheet declares —
that happens *before* any JS runs, often well before, since a `<script src>` has to fetch and
parse first (and on FORGE/PULSE, GSAP/ScrollTrigger/Lenis load from a CDN *before* the page's own
`main.js` even starts fetching). By the time the clone-and-resize helper runs and calls
`track.style.animationDuration = '...'`, real elapsed time has already built up against the old
duration. The browser recomputes the played *fraction* against the new duration using that same
elapsed time — the visible result is exactly what it was reported as: "moves, then teleports a
bit." This is a well-known CSS Animations gotcha, not specific to this code.

The fix is the standard reflow-reset trick: detach the animation, do the resize, force a layout,
then reattach. That restarts the animation as a clean instance at 0%, so there's no stale elapsed
time to recompute against:

```js
/* True-loop marquee — see PATTERNS.md.
   Clones the first child (one full copy of the content) until half the track
   covers its container, keeping the total even so -50% stays a whole period.
   Duration scales with the clone count so the speed never changes. */
function trueLoopMarquee(track, secondsPerCopy) {
  if (!track || !track.firstElementChild) return;
  var master = track.firstElementChild.cloneNode(true);
  var timer;

  function build() {
    // Rule 3: detach the animation before touching duration/children, or the
    // browser recomputes the played fraction against the new duration using
    // the OLD elapsed time — a visible jump the instant this runs.
    track.style.animationName = 'none';

    while (track.children.length > 1) track.removeChild(track.lastElementChild);
    var rowW = track.firstElementChild.getBoundingClientRect().width;
    var boxW = (track.parentElement || document.body).getBoundingClientRect().width;
    if (rowW < 1) { track.style.animationName = ''; return; }

    var perHalf = Math.max(1, Math.ceil(boxW / rowW));
    for (var i = 1; i < perHalf * 2; i++) {
      var copy = master.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      track.appendChild(copy);
    }
    track.style.animationDuration = (secondsPerCopy * perHalf) + 's';

    void track.offsetWidth; // force layout so animation-name:none is committed first
    track.style.animationName = '';
  }

  build();
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(build, 200);
  });
}
```

The `void track.offsetWidth` read is load-bearing — without it the browser can coalesce the
`'none'` write and the `''` write into one style recalc and the reset never takes effect. This
also means a resize restarts the loop from 0% rather than jumping, which is expected: content
changed, so a clean restart is the correct behavior, not a discontinuity to hide.

Markup is one row; the helper produces the rest. Only the first row is read by screen readers.

```html
<div class="marquee-wrap">           <!-- overflow: hidden -->
  <div class="marquee" id="myTrack">
    <div class="marquee-row"> … items … </div>
  </div>
</div>
```

```js
trueLoopMarquee(document.getElementById('myTrack'), 24); // 24s per copy
```

`secondsPerCopy` is the old hardcoded duration: because the track always travels exactly one
copy per `secondsPerCopy`, the on-screen speed is identical no matter how many clones it took.

### Checking it

Half the track must be at least the container width:

```js
var t = document.querySelector('.marquee');
t.getBoundingClientRect().width / 2 >= t.parentElement.getBoundingClientRect().width
```

Also confirm `getComputedStyle(t).columnGap` is `normal` — any value there is Rule 1 broken.

Rule 3 has no reliable static check — it only shows up as a one-time visual glitch at the exact
moment `build()` first runs, which is gone by the time you inspect anything. Trust the mechanism
instead: if a helper sets `animation-duration` on an element without first detaching the
animation, it's broken, whether or not you can currently see it glitch.

### Where this is used

`index.html` (hub categories) · `gym-service` (FORGE) · `ecommerce-design-store` (OBLIK) ·
`pulse-ai-analytics` (PULSE logo strip).

`restaurant-food` (EMBER) has no marquee on purpose — its tenet strip doesn't translate at all,
so the same band of motion isn't repeated on every template in the gallery.

---

## Instanced-debris surface shading (triplanar noise · baked env · cavity weathering)

Flat per-instance colour on an `InstancedMesh` reads "unfinished CG" no matter how good the
lighting is. This recipe adds real material response — grain, wear, reflection — inside one
plain-WebGL2 `ShaderMaterial`, with no UV unwrap, no texture files, no new CDN hosts, and no
measurable frame cost (FRACTURE: ~0.2 ms/frame at N = 1400 including a GPU sync). It exists
because every 3D template in this collection shades instanced procedural geometry and will
hit the same three walls.

### Rule 1 — noise lives in LOCAL space, offset by a per-instance seed

World-space noise looks right in a still and then *swims through the geometry* the moment
instances move (scroll choreography, formation morphs). Pass object-space position and normal
as varyings and offset by the instance seed so the pattern is glued to each fragment:

```glsl
/* vertex */  vLp = position; vLn = normal;              // plus your usual world outputs
/* fragment */ vec3 lp = vLp + aSeedVarying * 37.0;
```

The precision-safe 3D hash (same family as the 2D one in [[webgl-big-world-traps]]):

```glsl
float h31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float n3(vec3 p) {          // trilinear value noise over h31 — 8 taps
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i+vec3(1,0,0)), f.x), mix(h31(i+vec3(0,1,0)), h31(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i+vec3(0,0,1)), h31(i+vec3(1,0,1)), f.x), mix(h31(i+vec3(0,1,1)), h31(i+vec3(1,1,1)), f.x), f.y), f.z);
}
```

True triplanar blending (per-axis samples weighted by the squared local normal) is only worth
paying for when the detail is *anisotropic* — e.g. form-board strain lines on cast concrete.
For isotropic grain, one direct `n3(lp * scale)` is cheaper and seam-free by construction:

```glsl
vec3 an = normalize(vLn); an *= an;
vec3 w = an / (an.x + an.y + an.z + 1e-5);
float strain = w.x * n3(vec3(lp.y * 1.7, lp.z * 7.5, 3.1))
             + w.y * n3(vec3(lp.z * 7.5, lp.x * 1.7, 7.4))
             + w.z * n3(vec3(lp.x * 7.5, lp.y * 1.7, 5.2));
```

### Rule 2 — the grit octave goes in colour/roughness, NEVER in the bump

The first FRACTURE pass bump-mapped `low + strain + grit` and the whole field rendered as
hammered metal — value-noise lattice at high frequency + strong bump *is* an embossing die.
Split the field: bump gets only the low frequencies, grit modulates albedo and roughness.

```glsl
float hLow  = n3(lp * 2.4);
float hGrit = n3(lp * 12.0);
float hBump = hLow * 0.72 + strain * 0.28;             // what the normal feels
float hgt   = hLow * 0.45 + strain * 0.25 + hGrit * 0.3; // what the eye sees
```

Bump without tangents, from screen-space surface gradients, damped by `fwidth` so the far
field never sparkles (bumpK ≈ 0.1–0.2; 0.5 is already metal):

```glsl
float bumpK = 0.17 / (1.0 + 55.0 * length(fwidth(lp)));
vec3 dpx = dFdx(vW), dpy = dFdy(vW);
vec3 r1 = cross(dpy, N), r2 = cross(N, dpx);
float det = dot(dpx, r1);
N = normalize(N - (r1 * dFdx(hBump) + r2 * dFdy(hBump)) * (bumpK / max(abs(det), 1e-8)) * sign(det));
```

### Rule 3 — a reflective caste needs a real env map; bake it, don't ship it

`PMREMGenerator.fromScene` on a throwaway procedural scene (gradient dome + a few
hot `MeshBasicMaterial` planes as light strips) gives a proper roughness-mipped environment
with zero assets and zero new CSP hosts. Sampling it from a custom `ShaderMaterial` needs the
cubeUV defines that three only injects for built-in materials — compute them from the baked
texture height (formula lifted from three's `WebGLPrograms`):

```js
const rt = pmrem.fromScene(envScene, 0.035);
const envH = rt.texture.image.height;
const envMip = Math.log2(envH) - 2;
material.defines = {
  ENVMAP_TYPE_CUBE_UV: '',
  CUBEUV_TEXEL_WIDTH:  String(1 / (3 * Math.max(2 ** envMip, 7 * 16))),
  CUBEUV_TEXEL_HEIGHT: String(1 / envH),
  CUBEUV_MAX_MIP:      envMip + '.0',
};
```

```glsl
#include <cube_uv_reflection_fragment>          // top of the fragment shader
vec3 env = textureCubeUV(uEnv, reflect(-V, N), rough).rgb;
```

(And per FRACTURE's DESIGN.md: never redeclare `attribute mat4 instanceMatrix` — three
injects it for `InstancedMesh` whatever the material type.)

### Rule 4 — weathering is three cheap terms, not an AO pass

The Patina idea (oxidation pools in cavities, edges wear bright) in plain GLSL:

```glsl
float cav  = smoothstep(0.62, 0.2, hLow);                    // grime pools in noise valleys
float edge = clamp(length(fwidth(Ng)) * 1.3, 0.0, 1.0);      // Ng = flat geometric normal —
                                                             // fwidth spikes exactly on facet borders
float occ  = vAO * (1.0 - cav * 0.25);                       // vAO: per-instance attribute
```

Cavities darken and de-saturate the albedo and kill spec/env; edges cut roughness and add a
key-light catch. `vAO` is neighbour density at the instance's TARGET position — spatial hash,
count within ~2.4 units, normalise min→1 / max→(1−0.36) **per formation** so it self-calibrates
to any layout density. Recompute when targets change; upload as a `DynamicDrawUsage`
`InstancedBufferAttribute`.

### Two clock traps this exposed (they bite any impact/decay engine)

- **Decay envelopes must run on true elapsed time**, not the physics-clamped `dt`. With
  `dt = min(dtReal, 0.05)`, a throttled tab (~1 fps rAF) decays `exp(-k·dt)` per *frame* —
  ~20× slower than designed wall-clock; FRACTURE's impact heat held a red wash for seconds.
  Exponential decays are unconditionally stable: feed them `dtReal`, keep the clamp for physics.
- **A hold/settled fast path must read the TARGET arrays, not "current" ones** — if a flight's
  whole duration falls inside one rAF gap, state that only the flight branch writes (rotation,
  scale) freezes at the previous formation forever. Hold = read home, write it back to current.
- Same family: quality ladders should sample the *delivered* rAF delta (GPU included), not JS
  frame cost — but skip samples over ~250 ms so tab throttling can't trigger a degrade.

### Where this is used

`combat-fracture` (FRACTURE) — full recipe, all six formations. Candidates the recipe was
written for: `exhibition-parallax` (porcelain/lustre castes), `carnival-null` (deck & booth
surfaces), `festival-voltflood` (truss/speaker metals).
