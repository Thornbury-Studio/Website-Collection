---
name: CINDER
description: Dark takeaway coffee and pastry — a 2.5D product-stack landing
colors:
  ground: "#0B0B0D"
  surface: "#141416"
  ink: "#F4F1EC"
  dim: "#A39B94"
  rose: "#C991A2"
  rose-ink: "#2A141C"
  hairline: "rgba(255,255,255,0.08)"
typography:
  display:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontWeight: 650
  body:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontWeight: 400
---

# CINDER — design system

Dark roast, grab-and-go coffee and pastry. Not a sit-in café (that is LOAM)
and not a mall dessert counter (that is BomBom). The first viewport is a
product on a black stage: the cup leaves with you.

## The one idea

A 2.5D product stack. Cup, splash and macarons sit at different `z` on a
shared `perspective` stage. Pointer and a little scroll rotate the stage.
Everything else is quieter than that.

## Palette

| Token | Value | Role |
|---|---|---|
| ground | `#0B0B0D` | page |
| surface | `#141416` | cards |
| ink | `#F4F1EC` | type |
| dim | `#A39B94` | secondary |
| rose | `#C991A2` | one CTA |
| rose-ink | `#2A141C` | type on rose |

No purple gradient. Accent quota: the rose pill, nowhere else as a fill.

## Type

Outfit 400–700. Geometric takeaway product, not a Fraunces café. Banned as
brand face: Inter, Roboto, Arial, bare system-ui.

## Layout

Phone landing first — same beats as the Coffee & Go pin, original brand.
Desktop widens the same column. No second IA.

1. Bar — mark, Home / Menu / Contact
2. Hero — wordmark, one line, one pill
3. Product stage
4. Four operations: Roast · Pull · Set · Go
5. Menu heading
6. Three cards
7. Hours + contact
8. Footer

## Motion

Five named effects, Motion vanilla (CDN ESM, pinned). 21st.dev is reference
only — ported, not installed.

1. 2.5D stack (authored moment)
2. Scroll-linked 3D rotate on that stage
3. Tilt + Linear glare on three menu cards
4. Magnetic hero CTA
5. Press spring + ticker toast

`prefers-reduced-motion` and `hover: none` kill 1–4; press still scales.

## Copy

English. Client-facing. No demo, fictional, or AI disclaimers. SGD.
