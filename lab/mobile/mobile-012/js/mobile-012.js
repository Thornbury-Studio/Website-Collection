(function(){
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (s,r)=> (r||document).querySelector(s);
  const $$ = (s,r)=> [...(r||document).querySelectorAll(s)];
  const clamp = (v,a,b)=> v<a?a:v>b?b:v;
  function once(el, fn, threshold){
    let fired = false;
    new IntersectionObserver((es,o)=>{
      if (!es[0].isIntersecting || fired) return;
      fired = true; o.disconnect(); fn();
    },{threshold: threshold==null ? .2 : threshold}).observe(el);
  }
  const PALETTES = [
    ["#08202b","#1f5d50","#b8cf8a"],["#1a0c26","#6b4a8a","#e2b7f0"],
    ["#280c06","#9a3324","#eda06a"],["#0a1830","#2c4a7c","#9dc0e8"],
    ["#1d1608","#8a6a2f","#f5c518"]
  ];
  function plate(ctx,w,h,seed){
    const pal = PALETTES[seed % PALETTES.length];
    let s = seed*9301 + 49297;
    const rnd = ()=> ((s = (s*9301+49297) % 233280) / 233280);
    const g = ctx.createLinearGradient(0,0,w*.2,h);
    g.addColorStop(0,pal[0]); g.addColorStop(.58,pal[1]); g.addColorStop(1,pal[2]);
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation = "lighter";
    for (let i=0;i<5;i++){
      const cx = rnd()*w, cy = rnd()*h, r = (0.18+rnd()*0.42)*Math.max(w,h);
      const rg = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
      rg.addColorStop(0, pal[2] + "2a"); rg.addColorStop(1, "#00000000");
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    const vg = ctx.createRadialGradient(w*.5,h*.45,Math.min(w,h)*.16,w*.5,h*.5,Math.max(w,h)*.78);
    vg.addColorStop(0,"rgba(0,0,0,0)"); vg.addColorStop(1,"rgba(0,0,0,.46)");
    ctx.fillStyle = vg; ctx.fillRect(0,0,w,h);
  }
(function(){
    const view = $("#pfView"), spin = $("#pfSpin"), listEl = $("#pfList"), time = $("#pfTime");
    if (!view) return;
    let sy = 0, dragging = false, refreshing = false;
    view.addEventListener("pointerdown", e=>{
      if (refreshing) return;
      dragging = true; view.setPointerCapture(e.pointerId); sy = e.clientY;
      listEl.style.transition = "";
    });
    view.addEventListener("pointermove", e=>{
      if (!dragging) return;
      const dy = Math.max(0, e.clientY - sy);
      const pull = Math.min(64, dy*0.42);
      listEl.style.transform = "translateY(" + pull + "px)";
      spin.classList.toggle("on", pull > 30);
      spin.style.transform = "translateY(" + (pull*0.5) + "px) rotate(" + (pull*4) + "deg)";
    });
    const release = ()=>{
      if (!dragging) return; dragging = false;
      const dy = parseFloat((listEl.style.transform.match(/-?\d+/)||[0])[0]) || 0;
      listEl.style.transition = "transform .28s cubic-bezier(.16,1,.3,1)";
      if (dy > 26){
        refreshing = true;
        listEl.style.transform = "translateY(40px)";
        setTimeout(()=>{
          time.textContent = "checked just now";
          spin.classList.remove("on");
          listEl.style.transform = "translateY(0)";
          refreshing = false;
        }, 900);
      } else {
        listEl.style.transform = "translateY(0)";
        spin.classList.remove("on");
      }
    };
    view.addEventListener("pointerup", release);
    view.addEventListener("pointercancel", release);
  })();
})();
