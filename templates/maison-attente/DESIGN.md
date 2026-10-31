This project inherits C:\Users\sengc\OneDrive\Desktop\Company\DESIGN-SYSTEM\DARK.md (absolute path: the template sits inside a shared catalog repo, so a `../` count would be one more thing to get wrong). Below are this project's own tokens and brand-specific rules.

# Maison Attente

## 1. Overview & identity

A prestige-house campaign site, played completely straight, for one man holding a food receipt. The house name is **Attente** (French: "waiting"; also "expectation"). The joke is craft, not silliness: a Didone wordmark, a campaign tagline ("Dressed for the wait."), a one-piece collection, a *fiche technique* printed on thermal paper, a chronology of the Maison's first fourteen minutes, a press page quoting nobody, and an order-status panel that is always "being prepared".

Tone rule, binding: affectionate. The roast is the **situation** (waiting, the receipt, the composure, the shirt's provenance, the ceiling sign). Never the sitter's face, body, looks or glasses, and nothing invented about *him* (no age, job, hobbies, personal facts). Everything the page asserts is about the order, the table, the receipt or the garment.

Because the hub forbids demo / fictional / joke-site disclaimers on child sites, the joke has to be self-evident: it is carried by deadpan specificity ("Composure rating withholds 0.3 on grounds of tradition").

**The one idea:** the photograph is rebuilt as a three-layer 3D scene (room, wordmark, sitter) that tilts with the pointer and is dollied by scroll to the receipt, the ceiling sign and the shirt. The relief on the sitter comes from a depth model, not from hand-authored geometry.

## 2. Nearest existing templates, and how this one differs

Surveyed from the hub's card names / `data-category` / `data-style`, the thumbnails in `/img`, and the CSS tokens of every dark template. Nearest three (all "dark luxury, serif, one photographic/3D subject"):

| Nearest | Palette | Type | How Maison Attente differs |
|---|---|---|---|
| `perfume-tallow-dark` | near-black `#0a0a0c`, chalk, steel | Newsreader + Martian Mono, all-caps mono headline | Chromatic oxblood ground instead of neutral black; Didone display instead of mono caps; the photograph is a live 3D scene with real relief, not a scroll-driven single render pass |
| `horology-eon-v2` | blue-black `#0b0e12`, bone, blue + red accents | Marcellus + Spectral + Spline Sans Mono | Warm red-black not cold blue-black; a magazine-cover wordmark behind the subject instead of a centred product object; paper receipt devices instead of dial graphics |
| `watch-atelier` (AUREL) | warm black `#0c0b09`, ivory, brass | Cormorant Garamond + Jost | No brass/gold anywhere; the single accent is a rouge; Bodoni Moda at 500 weight, wide-tracked caps for the wordmark |

`chess-divan` (newest dark 3D template) was read for loader and render habits only; it is green-ground, glTF-based and Besley-set.

**Gap taken:** a scan of every template's root colour tokens found **no dark template on a red / oxblood ground**. The dark catalog is warm-black + bone/brass, blue-black, or green. This one is oxblood.

## 3. Colours

| Token | Hex | Use | Contrast (computed) |
|---|---|---|---|
| `--ground` | `#1b0709` | page ground, oxblood-black | — |
| `--ground-2` | `#260a0e` | raised panels (bag, certificate) | — |
| `--velvet` | `#3b1019` | empty plates | — |
| `--paper` | `#f3ebe0` | primary text, thermal-receipt white | 16.4 : 1 on `--ground` |
| `--mute` | `#d2b8b0` | secondary text | 10.4 : 1 on `--ground`, 9.9 : 1 on `--ground-2` |
| `--rouge` | `#ff6a58` | the one accent: eyebrows, quote marks, times | 6.9 : 1 on `--ground` |
| `--ink` | `#1b0709` | text on paper | 16.4 : 1 on `--paper` |
| `--thermal` | `#5c4846` | secondary text on paper | 7.2 : 1 on `--paper` |

In the scene the backdrop is graded to a duotone from `#0f0406` to `#852b30`; the sitter keeps his own colours (grey tee, skin) so the receipt and shirt are the only neutral lights in an all-red room.

## 4. Typography

- **Bodoni Moda** (variable, opsz + wght, roman and italic; OFL) — wordmark, headings, pull-lines. Optical sizing is automatic, so the wordmark gets the hairline-thin 96pt cut.
- **Tenor Sans** (OFL) — labels, navigation, captions, running copy.
- **Cutive Mono** (OFL) — only where the page is a printed slip: spec sheet, ticket, chronology times, callouts.

None of these appear in any of the three nearest templates.

## 5. Layout & spacing

Desktop: the scene is a fixed full-viewport canvas; sections alternate text left / text right and the camera view-offset moves the picture to the opposite side. Collection uses a *slot*: the camera reads `#slot1`'s bounding box each frame, so the live 3D plate is registered to a real DOM frame beside two empty ones. Mobile is its own composition, not a squeeze: the plate is smaller than the viewport so the wordmark sits above his head (on desktop it sits behind it), and every section opens on a scene-only top half with the copy rising on a scrim.

## 6. Elevation & depth

Only real depth: three layers at z = −0.6…−0.9 (room), −0.2 (wordmark), 0…+0.34 (sitter, displaced by the depth map). Paper slips get one long soft shadow and ±1° rotation. No glass, no blur, no card stacks.

## 7. Components & states

Callouts (projected from the scene each frame, hidden when their section is not active), the spec slip, the certificate, plates I–III, the chronology, the blank pull quotes, the bag and the ticket. The order-status panel: `Complete order` / `Check order status` always appends a line containing "being prepared"; `Collect order` is `aria-disabled` and answers the same way; "Now serving" climbs 0412 → 0416 and stops one short of the number on the receipt.

## 8. Do's and don'ts

- Do keep every claim about the situation. Do keep numbers specific (0417, 9.7 / 10, 4°, 15,300 km).
- Don't comment on the sitter's face, body, looks or glasses. Don't assert anything personal. Don't add disclaimers.
- Don't hand-author geometry to make a person. The only mesh is a flat grid plane displaced by a depth texture.
- Don't add a second accent colour or a second 3D idea.

## 9. Motion & accessibility floor (DESIGN.md §6, restated for this build)

- `prefers-reduced-motion`: no pointer tilt, no idle sway, no smooth scroll, no reveals; the camera cuts between held poses instead of travelling.
- Scene is `aria-hidden`; every word is in the DOM. The `<h1>` stays in the DOM (visually hidden only once WebGL is running); no-WebGL falls back to the flat photograph with the wordmark as live text.
- DPR cap 2 (1.5 on coarse pointers); render loop stops when the tab is hidden; `webglcontextlost` is prevented and `webglcontextrestored` re-uploads every texture.
- Touch targets ≥ 44 px; visible focus ring on everything interactive; skip link.

## 11. DARK.md §4 checklist, run against the screenshots

Done after the build; recorded in the hand-off report, not here, because it is a judgement on a specific set of screenshots.
