// Runs in <head>, before paint: marks the document as scripted so reveals
// start hidden, and records the motion preference once for the other modules.
document.documentElement.classList.replace('no-js', 'js');
window.LL = {
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  fine: matchMedia('(hover: hover) and (pointer: fine)').matches
};
