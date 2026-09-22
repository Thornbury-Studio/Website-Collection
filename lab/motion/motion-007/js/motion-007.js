(function(){
  const nums = document.querySelectorAll(".count .num");
  const ranNums = new WeakSet();
  const cObs = new IntersectionObserver((es)=>{
    es.forEach(e=>{
      if (!e.isIntersecting) return;
      const el = e.target;
      if (ranNums.has(el)) return;
      ranNums.add(el);
      const to = parseInt(el.dataset.to,10);
      const suffix = el.dataset.suffix || "";
      const t0 = performance.now(), dur = 1600;
      (function tick(t){
        const p = Math.min(1,(t - t0)/dur);
        const eased = 1 - Math.pow(1-p,3);
        el.innerHTML = Math.round(to * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  },{threshold:.6});
  nums.forEach(n=>cObs.observe(n));
})();
