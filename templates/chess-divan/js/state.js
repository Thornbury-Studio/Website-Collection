/* One shared object between the page (scroll, HUD) and the stage (WebGL).
   t is the camera timeline in half-moves:
     -1 .. 0   hero scrolling away
      0 .. 45  the game (t === ply, fractional while a piece is travelling)
     45 .. 47  the room, camera backing out over the finished board */
export const state = {
  t: -1,
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  coarse: matchMedia('(pointer: coarse)').matches,
  gl: true
};
