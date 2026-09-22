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
    $$(".tg-switch").forEach((sw,idx)=>{
      const thumb = $(".thumb", sw);
      let on = idx === 0, dragging = false, sx = 0, dx = 0;
      const W = 26; // travel distance
      function paint(px, animate){
        thumb.style.transition = animate ? "transform .28s cubic-bezier(.34,1.4,.64,1)" : "none";
        thumb.style.transform = "translateX(" + px + "px)";
      }
      function setState(v, animate){ on = v; sw.classList.toggle("on", on); paint(on?W:0, animate); }
      setState(on, false);
      sw.addEventListener("pointerdown", e=>{
        dragging = true; sw.setPointerCapture(e.pointerId); sx = e.clientX; dx = 0;
      });
      sw.addEventListener("pointermove", e=>{
        if (!dragging) return;
        dx = clamp(e.clientX - sx, -W, W);
        paint(clamp((on?W:0) + dx, 0, W), false);
      });
      const release = ()=>{
        if (!dragging) return; dragging = false;
        if (Math.abs(dx) > 6){ setState((on?W:0)+dx > W/2, true); }
        else { setState(!on, true); } // treat as a tap
        dx = 0;
      };
      sw.addEventListener("pointerup", release);
      sw.addEventListener("pointercancel", release);
    });
  })();
})();
