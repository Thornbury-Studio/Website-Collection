This project inherits ../../../DESIGN-SYSTEM/DARK.md (resolves from `templates/chess-divan/` to `Company/DESIGN-SYSTEM/DARK.md`; absolute form: `C:\Users\sengc\OneDrive\Desktop\Company\DESIGN-SYSTEM\DARK.md`). Below are this project's own tokens and brand-specific rules.

# DIVAN — a chess room, Covent Garden

## 1. Overview & identity

One idea: **the object is the page.** A real glTF chess set (Khronos "A Beautiful Game", CC BY 4.0) is the only thing on the stage, and the site's story is told by *where the camera goes*. Scroll replays Anderssen v Kieseritzky, London, 21 June 1851 (the "Immortal Game"), 45 half-moves. Each piece is a real node in the model, moved by name. The camera rides the piece that is moving; the lighting changes phase (even and warm in the opening, raking in the attack, cold and hard for the queen sacrifice and the mate). The business under it is a members' chess room: tables, a tariff, Thursday replay nights.

The score was replayed through a rules engine before it was committed (all 45 plies legal, ends in checkmate); `js/game.js` carries only the derived list. The board is never scripted: every position is a pure function of scroll, so scrubbing backwards undoes the game.

### Nearest existing templates, and how this differs

1. **camera-candela** — one dark product object (a GLB camera) you drag round. *Differs:* this is a scene of 32 moving parts on a table, not a turntable; nothing is draggable; the camera is a narrator, not a viewer's tool; green ground and ivory against candela's neutral black and brass; Clarendon serif against Sora / DM Sans.
2. **exhibition-ephemeris** — a single object in a near-black void, bone type, serif. *Differs:* the object here is a table-top landscape that fills and crops the frame, set low and off to one side behind a left-hand move record, rather than a lone centred artefact; it changes state with scroll; bottle-green marble rather than patinated bronze; a slab serif and mono notation.
3. **archive-aperture-index** — a real 3D camera in a dark archive with bone type. *Differs:* it presents an artefact to be read; this one performs a sequence. The camera path, the capture trays, the piece-pinned move tag and the score sheet are the content. Palette and type share nothing with it.

Pontil & Pistil (the original nearest neighbour: glass on black, centred object, callouts) was removed from the catalog while this was being built, so it is not compared live.

Also surveyed: every dark / 3D card in the hub via contact sheets of the root `img/` thumbnails (61 cards), and the tokens of candela, ephemeris, aperture-index, studio-basin, darkroom-latent and pc-redline-dark. No other template uses chess, a green ground, a Clarendon, or a replayed game as its scroll mechanic.

## 2. Colors

| Token | Value | Use | Contrast on `--ground` |
|---|---|---|---|
| `--ground` | `#0a1410` | page and canvas ground, a green so dark it reads black | n/a |
| `--felt` | `#13362a` | favicon / cloth family (scene cloth is `#0f2c22`) | n/a |
| `--ivory` | `#ece5d0` | all primary text | **14.9:1** |
| `--ivory-2` | `#aebaac` | secondary text, labels | **9.3:1** |
| `--cela` | `#9fd6bd` | the one accent: the move in hand, current ledger cell, rail, focus ring | **11.5:1** (ground on cela also 11.5:1) |
| unplayed ledger move | `#808c80` | moves not yet reached | **5.3:1** |

No violet, no purple gradient, no amber. The set itself is green marble, jade and obsidian with brass rings, so the UI colour is taken from the object, not laid on top of it.

## 3. Typography

- **Besley** (SIL OFL 1.1; a Clarendon, the face of 1850s English printing) 400 / 400 italic / 700 / 900. Display at 900 with −0.04em tracking. Not Inter, not Space Grotesk, and none of the catalog's usual serifs (Fraunces, Newsreader, Instrument, Bodoni Moda, Cormorant, Spectral).
- **Azeret Mono** (SIL OFL 1.1) 400 / 500 for notation, counters, labels, prices. Tabular numerals.
- Both self-hosted as woff2 in `fonts/` with their licences. The hero headline is never centred.

## 4. Layout & spacing

- **Desktop:** the canvas is fixed full-bleed; the camera projection is offset 20% of the width to the right so the board occupies the free two-thirds while a left-hand column carries move number, current move, caption and the score sheet.
- **Tall screens (≤900px) are their own composition:** board on top, move at the bottom. The camera offset is computed from the *measured* height of the HUD (`measure()` in `stage.js`) so the board is centred in whatever space the text leaves; the score sheet becomes a bottom sheet; distances scale with aspect.
- The game is one long sticky section (`100svh + 45 × 17svh`): 17% of a screen of scroll per half-move.
- Room and visit sections: asymmetric 12-column grid (6 / 5), a ruled tariff list instead of cards. No icon grid, no stat banner, no numbered steps.

## 5. Elevation & depth

- One key spot (shadow-casting, PCF soft), one cool rim, one narrow "pool" spot that follows the moving piece, plus a baked environment (soft panels through PMREM, no files). Light presets are keyed to the timeline: warm and even, then raking, then cold and hard.
- The cloth under the set is a plain disc with a radial alpha falloff, so the lit pool dissolves into the ground instead of ending at a horizon.
- DOM depth is a scrim, not glass: gradients behind the HUD; no blur, no pills.

## 6. Components & states

- **Move tag:** a mono label on a 1px leader, anchored to the real 3D point above the piece in motion and re-projected every frame. It is the only floating annotation; the usual "five or six callouts round a centred object" is deliberately not used.
- **Score sheet:** every half-move is a real `<button>`; clicking scrolls the replay to it. `aria-current="step"` marks the current one. Built from `game.js`, so it cannot drift from the scene.
- **Captured pieces** lift off the board and slide to trays along its edge (White's on the a-file side, Black's on the h-file side) and come back when scrubbing in reverse.
- **No WebGL / context lost:** `.no-gl` and `.gl-lost` show `img/poster.webp` behind the same text; the HUD and score sheet keep working because they never read the canvas. `webglcontextlost` is prevented and the loop stopped; `webglcontextrestored` rebuilds the environment and resumes.
- **Reduced motion:** no Lenis, no pointer tilt, no entrance or reveal animation, no damping on the camera, no idle drift. The replay is still driven by the user's own scroll.
- Focus: 2px `--cela` ring, 3px offset, on everything interactive. Targets are at least 44px tall on the bar, buttons and summary; ledger buttons are 40px rows on tall screens (inside a bottom sheet with a 44px summary).

## 7. Do's and Don'ts

- Do keep every word of the story in the DOM; the canvas is decoration (`aria-hidden`), and a visually-hidden list carries every caption of the game.
- Do keep the CSP meta tag in step with `vercel.json`. The GLB, WebP textures, fonts, three, GSAP and Lenis all load from this folder. No decoders are needed: the GLB is quantized, not Draco / Meshopt / KTX2.
- Don't hand-author geometry. The only geometry in `stage.js` is the cloth disc and the throwaway panels used to bake lighting.
- Don't add a disclaimer about the build to the page.
- Don't push the glass further: the pawn tops are the only transmissive parts and the transmission buffer is already scaled to 0.5–0.75.
