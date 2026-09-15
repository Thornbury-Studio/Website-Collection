# KINETIC — design system

Cinematic generative vision studio site. Brand-film scroll first; one light
interactive preview strip for hand-feel. Not a tool-console dashboard.

## Palette

| Token | Value | Role |
|---|---|---|
| void | `#08090A` | page ground |
| surface | `#0E1012` | panels |
| ink | `#F3F4F6` | primary text |
| ink-dim | `#9CA3AF` | secondary |
| line | `rgba(255,255,255,0.08)` | hairlines |
| accent | `#CCFF00` | one strong focus per section |

## Typography

- **Display:** Syne 700/800 — brand and section titles
- **Body:** Instrument Sans 400/500
- **Meta:** IBM Plex Mono 400/500 — stage IDs, status, footer

Banned as brand face: Inter, Roboto, Arial, bare system-ui.

## Locked frames (media)

1. **Hero** — full-bleed night cinema plate: wet asphalt reflection, distant
   city smear, one acid-lime practical light. No UI chrome in frame.
2. **Capture** — handheld / rig capture energy; lens glass, motion blur.
3. **Synthesize** — volumetric light volumes / splat cloud suggestion,
   still photographic, not neon UI.
4. **Deliver** — finished film still / screening energy; warm highlight on
   cool void.

Motion: CSS Ken Burns + scroll stage crossfade. Optional muted loop later;
stills ship first per VIDEO-POLICY.

## Layout rules

- Hero: brand name visually largest; one headline; one line; one CTA group.
- No HUD overlay badges on hero media.
- Accent quota: max one primary `#CCFF00` focal per section.
- Specs: thin strip, not a four-card Bento wall.

## Interactions

1. Scroll-driven reel stage transitions (Capture → Synthesize → Deliver)
2. Mode pill (Video / Spatial / Live) + ~200ms crossfade
3. Play + timeline with clear complete state
