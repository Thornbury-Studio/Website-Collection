# RADIX — design notes

AI operating partner for consumer products and retail. Original brand.
The visual craft bar is the live SentientX site (VMV.STUDIO): floating
chips, Neue Montreal at display size, charcoal/cream inversion, a
wireframe torus, pixel dissolve, dotted field.

## Palette

| token | hex | role |
|---|---|---|
| `--bg` | `#161616` | charcoal ground (home, edge, media, contact) |
| `--bg` light | `#F4F1EC` | cream (about, capabilities, insights, faq) |
| `--bg` void | `#050505` | Verid |
| `--ink` | `#F4F4F4` / `#141414` | type |
| `--lime` | `#D7EFA8` | puncture, CTA disc |
| `--chip` | `#0B0B0B` | nav tablets |

## Type

Neue Montreal (Fontshare) at body sizes no smaller than ~18px. Schibsted
Grotesk as the fallback grotesque. Display is the same family at
`clamp(2.6rem, 7.4vw, 5.1rem)` with tight tracking — the SentientX move
of setting the headline in a grotesque, not a serif.

## Motion

| Effect | Where |
|---|---|
| Live torus knot (Three.js) | Home hero |
| ASCII sampling of the knot | Home, third layer |
| Pixel dissolve | About hero |
| Vertical true-loop traps | Home |
| Ken Burns mp4 from stills | Home, edge, capabilities, Verid |
| Lime disc on the contact chip | Every page |

`prefers-reduced-motion` freezes the knot, skips ASCII and pixel ticks,
and leaves posters standing.

## 3D

`models/radix-knot.obj`, `.fbx`, `.gltf` — torus knot p=2 q=3, same
form as the live hero.
