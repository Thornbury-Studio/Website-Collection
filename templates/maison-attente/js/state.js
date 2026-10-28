/* Shared flags. Read once; the stage re-reads width on resize itself. */
export const state = {
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  coarse: matchMedia('(pointer: coarse)').matches,
  gl: true,
};
