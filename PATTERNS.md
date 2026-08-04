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
