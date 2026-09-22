(function(){
  function pinProgress(el){
    const r = el.getBoundingClientRect();
    const total = r.height - innerHeight;
    if (total <= 0) return 0;
    return Math.min(1, Math.max(0, -r.top / total));
  }
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const rollWrap = document.getElementById("rollWrap");
  const rollLines = rollWrap.querySelectorAll(".roll-line");
  function frame(){
    if (!reduce){
      const p2 = pinProgress(rollWrap);
      const idx = Math.min(rollLines.length - 1, Math.floor(p2 * rollLines.length));
      rollLines.forEach((l,i)=>l.classList.toggle("on", i === idx));
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
