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
    const view = $("#dcView"), plate_ = $("#dcPlate"), closedEl = $("#dcClosed"), reopen = $("#dcReopen");
    const cv = $("#dcCanvas"); if (!view) return;
    once(view, ()=> plate(cv.getContext("2d"), cv.width, cv.height, 3), .05);
    let sy = 0, dragging = false;
    plate_.addEventListener("pointerdown", e=>{
      dragging = true; plate_.setPointerCapture(e.pointerId); sy = e.clientY;
      plate_.style.transition = "";
    });
    plate_.addEventListener("pointermove", e=>{
      if (!dragging) return;
      const dy = Math.max(0, e.clientY - sy);
      const p = clamp(dy/220, 0, 1);
      plate_.style.transform = "translateY(" + dy + "px) scale(" + (1-p*0.28) + ")";
      plate_.style.opacity = String(1 - p*0.85);
    });
    const release = e=>{
      if (!dragging) return; dragging = false;
      const dy = Math.max(0, (e.clientY||sy) - sy);
      plate_.style.transition = "transform .3s cubic-bezier(.16,1,.3,1),opacity .3s";
      if (dy > 130){
        plate_.style.transform = "translateY(260px) scale(.6)"; plate_.style.opacity = "0";
        setTimeout(()=> closedEl.classList.add("on"), 200);
      } else {
        plate_.style.transform = ""; plate_.style.opacity = "1";
      }
    };
    plate_.addEventListener("pointerup", release);
    plate_.addEventListener("pointercancel", release);
    reopen.addEventListener("click", ()=>{
      closedEl.classList.remove("on");
      plate_.style.transition = "none"; plate_.style.transform = ""; plate_.style.opacity = "1";
    });
  })();
})();
