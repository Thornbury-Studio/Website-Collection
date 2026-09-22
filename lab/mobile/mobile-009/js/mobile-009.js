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
    const view = $("#pzView"), cv = $("#pzCanvas"), hud = $("#pzHud");
    if (!view) return;
    once(view, ()=> plate(cv.getContext("2d"), cv.width, cv.height, 1), .05);
    let scale = 1, tx = 0, ty = 0;
    function apply(){
      $(".pz-plate", view).style.transform = "translate(" + tx + "px," + ty + "px) scale(" + scale + ")";
      hud.textContent = scale.toFixed(1) + "×";
    }
    const pts = new Map();
    let baseDist = 0, baseScale = 1, panStart = null;
    view.addEventListener("pointerdown", e=>{
      view.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
      if (pts.size === 1) panStart = {x:e.clientX - tx, y:e.clientY - ty};
      if (pts.size === 2){
        const [a,b] = [...pts.values()];
        baseDist = Math.hypot(a.x-b.x, a.y-b.y); baseScale = scale;
      }
    });
    view.addEventListener("pointermove", e=>{
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
      if (pts.size === 2){
        const [a,b] = [...pts.values()];
        const d = Math.hypot(a.x-b.x, a.y-b.y);
        scale = clamp(baseScale * (d / (baseDist||1)), 1, 4);
      } else if (pts.size === 1 && panStart){
        tx = e.clientX - panStart.x; ty = e.clientY - panStart.y;
      }
      apply();
    });
    function up(e){ pts.delete(e.pointerId); if (pts.size < 1) panStart = null; }
    view.addEventListener("pointerup", up);
    view.addEventListener("pointercancel", up);
    /* desktop stand-in: wheel to zoom, since one mouse can't pinch */
    view.addEventListener("wheel", e=>{
      e.preventDefault();
      scale = clamp(scale - e.deltaY*0.0016, 1, 4);
      apply();
    }, {passive:false});
  })();
})();
