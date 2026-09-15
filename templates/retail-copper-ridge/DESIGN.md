# Copper Ridge Cartridge Co.

A US ammunition catalog retailer. Not a gun shop, not a tactical lifestyle brand —
a warehouse that sells cartridges by caliber, with ground shipping and state rules
written into the checkout.

## DNA

| Source | What we took | What we refused |
|---|---|---|
| MidwayUSA / Palmetto catalog UX | Caliber-first filters, $/round, box qty, stock badges | Dense dashboard chrome, neon accents |
| Sporting-goods warehouse floors | Paper tags, lot strips, brass on bench photography | Operator cosplay, black-and-red “tactical” kitsch |
| Vintage menswear (this repo) | Data-driven catalog + shared cart localStorage | Period costume framing |

## Materials

| Token | Value | Role |
|---|---|---|
| `--paper` | `#E8E4DC` | page ground |
| `--paper-2` | `#DCD6CB` | raised bands |
| `--carbon` | `#1C1F22` | ink, header |
| `--carbon-soft` | `#3A4046` | muted copy |
| `--sage` | `#5C6B5A` | secondary accent |
| `--brass` | `#A67C3D` | primary accent, CTAs |
| `--line` | `rgba(28,31,34,.16)` | rules |
| `--danger` | `#8B3A2F` | out of stock / blocked ship |

Type: **Libre Baskerville** for the wordmark; **Barlow Condensed** for SKUs, nav, filters;
**Source Sans 3** for body.

## Motion

1. Scroll progress bar (brass)
2. Age-gate + cart drawer focus trap
3. Filter grid opacity reflow

Respect `prefers-reduced-motion`.
