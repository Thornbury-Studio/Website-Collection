# OUTAGE — design document

A cinematic browser experience gallery built around the moment the connection
dies and a dinosaur starts running. Original IP throughout: no Chrome sprite,
no Google branding, no pixel-for-pixel T-Rex homage.

## Brand

**OUTAGE** — the desert that appears when the net dies.

Line: *When the signal drops, the run begins.*

Voice: dry, confident, specific. Game-gallery energy without arcade kitsch.
Never “demo,” never “fictional,” never “inspired by Chrome.”

## Form

Single-page AMIX-style gallery:

1. Splash gate — NO SIGNAL → press Space / click
2. Hero — brand-first over a live canvas desert
3. Modes — six named experiences as marketing plates
4. Play — on-page Dry Run endless runner
5. About — what OUTAGE is
6. FAQ — practical answers
7. Footer

## Palette

| token | hex | role |
|---|---|---|
| `--void` | `#0B0D10` | ground |
| `--bone` | `#E7DFD2` | primary type |
| `--sand` | `#C4A574` | secondary / dunes |
| `--signal` | `#FF6B2C` | accent / CTA / pulse |
| `--sage` | `#7D9B76` | soft secondary accent |
| `--line` | `#2A303A` | hairlines |

No purple glow cluster. No cream + terracotta default. No broadsheet rules.

## Type

- **Syne** — wordmark and display
- **Manrope** — body
- **IBM Plex Mono** — HUD, scores, FAQ keys, mode numbers

## Motion

- Splash letter stagger → world fade-in
- Section reveals on scroll
- Mode media subtle scale on hover
- Ambient canvas: stars, dunes, silhouette runner parallax
- Runner: jump dust, score tick
- `prefers-reduced-motion`: skip splash hold, freeze ambient canvas, keep runner optional

## Imagery

- One Pexels desert dusk/moon video for the about band
- Six Unsplash desert / night / strata stills for modes
- Dinosaur and obstacles drawn in canvas (original)

## Modes

1. Dry Run — classic endless sprint
2. Night Drift — moonlight cactus field
3. Meteor Window — sky-iron hazards
4. Fossil Layer — strata collect run
5. Packet Storm — signal ghosts as obstacles
6. Zero Bar — one-hit, no HUD
