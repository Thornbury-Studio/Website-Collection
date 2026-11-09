// Runs in <head>, before first paint: marks the page as scripted (so reveal
// styles apply only when the script that undoes them will run) and records
// the motion preference once for every other script.
document.documentElement.classList.replace('no-js', 'js');
window.HOLL = {
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  fine: matchMedia('(hover: hover) and (pointer: fine)').matches
};
