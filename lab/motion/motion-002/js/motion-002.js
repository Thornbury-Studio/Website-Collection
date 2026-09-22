(function(){
  function pinProgress(el){
    const r = el.getBoundingClientRect();
    const total = r.height - innerHeight;
    if (total <= 0) return 0;
    return Math.min(1, Math.max(0, -r.top / total));
  }
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scrubWrap = document.getElementById("scrubWrap");
  const scrubWord = document.getElementById("scrubWord");
  function frame(){
    if (!reduce){
      const p1 = pinProgress(scrubWrap);
      const x = (0.5 - p1) * 60;
      const s = 1 + p1 * 1.6;
      scrubWord.style.transform = `translateX(${x}vw) scale(${s})`;
      scrubWord.style.opacity = String(0.35 + 0.65 * Math.sin(Math.PI * p1));
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
