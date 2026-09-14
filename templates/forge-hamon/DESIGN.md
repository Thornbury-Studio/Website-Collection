# HAMON — a forge at Cleave Ford

A bladesmith's site. Not a foundry, not a knife shop, not a lookbook.

The whole site rests on one fact: a **hamon** is the visible boundary between
hardened and unhardened steel in a single blade. You cannot paint it on and you
cannot polish it in. It is the only mark on a knife that is evidence rather than
decoration. So the site's line is **"The line is the proof,"** and the structure,
the palette and the motion all serve that one claim.

## DNA (extracted, not copied)

| Source | What we took | What we refused |
|---|---|---|
| [Blenheim Forge](https://blenheimforge.co.uk/) | That the craft's own vocabulary is the copy — steel designations, austenitising temperatures, HRC, distal taper. A real shop states numbers and lets them do the selling. | Their site, which is an ordinary product-grid shop. No cart, no tiles of knives on white, no "shop now." |
| Kramer / Zwilling Damascus (ladder pattern) | Pattern is *arithmetic*: layers double per fold, and the ladder is a real deformation of a real stack. We built the arithmetic rather than a picture of it. | The luxury-object framing. We refuse to imply a folded blade is a better blade — the fold table exists to say the opposite. |
| [Igloo](https://igloo.inc/) · [Lusion](https://lusion.co/) | Pacing: long quiet holds, one event per viewport, nothing competing. | Their WebGL. There is no canvas here except one small procedural pattern that is doing arithmetic, not atmosphere. |
| [DIKO](https://diko.paris/) · [teamLab](https://www.teamlab.art/) | Motion restraint — one signature, repeated exactly, never stacked. | Decorative ambient motion. Nothing on this page moves unless it is being revealed or being calculated. |
| Real temper-oxide charts | Straw / bronze / purple / blue at 200–330 °C, used as a measuring instrument. | Using those colours as a brand palette. They appear once, 18 px tall, each with its °C, and nowhere else. |

## Materials

Two states, both real: the forge is dark because it is worked at night off the
coal fire, and the bench is grey because finishing is done in flat north
daylight. `FORGE` is the default; `BENCH` is the same shop in the morning. Both
are authored palettes, not an inversion.

| Token | FORGE | BENCH | Role |
|---|---|---|---|
| `--ground` | `#0a0b0d` | `#cfcdc7` | page ground — cool black / cold workshop grey, never cream |
| `--ground-2` | `#131519` | `#dad8d2` | raised band |
| `--ground-3` | `#1b1e23` | `#c2c0ba` | inset well, spec tables |
| `--ink` | `#e9edf0` | `#14161a` | type |
| `--ink-dim` | `#98a3ac` | `#3f454b` | muted copy (7.6:1 / 5.8:1 on ground) |
| `--hamon` | `#dfe8ec` | `#4d565d` | **the line** — the one value reserved for a hardening boundary: the wordmark's rule, the reveal's leading edge, the hamon drawings |
| `--ember` | `#ff4b16` | `#9c2700` | steel above ~700 °C, and nothing else |
| `--scale` | `#3a4148` | `#9a988f` | forge scale — every hairline and border |
| `--quench` | `#5d8299` | `#2f5165` | the cold side — water, room temperature, finished states |

The bench column is not an inversion. Each value was re-picked to clear 4.5:1
on `#cfcdc7` — ember especially, which as a bright orange would land at 3:1 in
daylight and is dropped to a burnt red that still reads as hot steel.

`--ember` and `--quench` are a temperature pair and are never swapped: ember
describes steel that is hot *now*, quench describes steel at rest. A finished
blade is never drawn in ember.

Type: **Bodoni Moda** (display), **Instrument Sans** (voice), **DM Mono** (every
number, label, temperature and spec). The Didone is the risk and it is on
purpose — a Bodoni's stroke runs thick to hairline exactly the way a blade runs
spine to edge, so the display face is already a section drawing of the product.
Not Cinzel, not EB Garamond, not Courier Prime, not Inter, not Fraunces.

## Motion signature — **the polish**

Nothing fades in and nothing changes colour on arrival. A revealed element is
**uncovered along its long axis** by an animated `clip-path` inset, led by a
1 px `--hamon` rule that runs ahead of the content and leaves with it — a stone
passing down a blade. 0.85 s on `cubic-bezier(0.22, 1, 0.36, 1)`, stagger
0.09 s capped at three steps, gated on `.js-anim` with a no-IntersectionObserver
failsafe.

The distinction from a cooling reveal is the point: cooling says *this is
becoming finished*. Polishing says *this was already there and you could not see
it*. That is the same claim as the hamon.

`prefers-reduced-motion` removes the wipe entirely (content is simply present),
stops the spine readout travelling, and leaves the fold table fully usable.

## Structure — temperature, not numbers

The home page is one blade from bar to edge in seven stages, and each stage's
eyebrow is its **real working temperature**, not an index:

`20 °C` stock · `1250 °C` fold-weld · `1100 °C` forge · `900 °C` normalise ·
`795 °C → 28 °C` harden · `200 °C` temper · `20 °C` edge

A fixed rail at ≥ 1000 px carries the current stage's temperature and mixes
`--ember` → `--quench` with it. The sequence is the craft's own, so it earns a
marker; the marker carries information a reader actually needs, which `01 / 02 /
03` would not.

## The one authored moment — **the fold table**

Sits inside the fold-weld stage. Seven bars in the stack, 42 mm of billet, and
every fold doubles the count and halves the layer:

| folds | layers | layer |
|---|---|---|
| 0 | 7 | 6.00 mm |
| 5 | 224 | 188 µm |
| 9 | 3 584 | 11.7 µm |
| 10 | 7 168 | **5.86 µm** |
| 14 | 114 688 | 0.37 µm |

Past ten folds the layer is finer than the etch can bite, the drawn pattern goes
homogeneous, and the table says so in plain words: *you are not making pattern
any more, you are making steel.* Every number on screen is computed from
`42 mm / (7 · 2ⁿ)` — nothing is typed.

It is deliberately **not** a quote tool. It costs nothing, asks for nothing, and
its conclusion argues against the upsell. That is the mechanic: an argument with
a slider, not a calculator with a price at the bottom.

## Pages

1. `index.html` — the line, then one blade from bar to edge in seven stages.
2. `blades.html` — four models, each as a spec table with a drawn section.
3. `forge.html` — the shop, the two people, and how to tell a hamon from an etch.
4. `commission.html` — a written specification you can copy or send. No backend,
   no cart: it composes a spec and hands it to your mail client.

## What this is not

- Not HARLOWE. Different metal (steel, not bronze), different act (folding and
  quenching, not casting and tuning), different palette, different type trio,
  different motion signature, and an interactive that computes a limit instead
  of a price.
- Not a shop. Nothing adds to a cart; the commission page ends in a written
  specification, because that is how the real transaction starts.
- No faces. Hands, tools and hot steel only — a gloved hand on a pair of tongs
  is the closest the photography comes to a person, and that is the ceiling.
- No bronze, no gold, no amber wash, no glow, no rounded corners, no drop
  shadows, no ambient particles, no sparks, no fourth typeface.
- No claim that a folded blade is a better blade.
