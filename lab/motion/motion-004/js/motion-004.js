(function(){
  function pinProgress(el){
    const r = el.getBoundingClientRect();
    const total = r.height - innerHeight;
    if (total <= 0) return 0;
    return Math.min(1, Math.max(0, -r.top / total));
  }
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const hzWrap = document.getElementById("hzWrap");
  const hzTrack = document.getElementById("hzTrack");
  function frame(){
    if (!reduce){
      const p3 = pinProgress(hzWrap);
      const max = hzTrack.scrollWidth - innerWidth;
      hzTrack.style.transform = `translateX(${-p3 * max}px)`;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
