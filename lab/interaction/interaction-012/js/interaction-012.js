(function(){
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const $  = (s,r)=> (r||document).querySelector(s);
  const $$ = (s,r)=> [...(r||document).querySelectorAll(s)];
  const clamp = (v,a,b)=> v<a?a:v>b?b:v;
  const lerp  = (a,b,t)=> a+(b-a)*t;
  function live(el, step){
    if (reduce){ step(performance.now()); return; }
    let on = false, raf = 0, t0 = performance.now();
    const loop = (t)=>{ if(!on) return; step(t - t0); raf = requestAnimationFrame(loop); };
    new IntersectionObserver((es)=>{
      const vis = es[0].isIntersecting;
      if (vis === on) return;
      on = vis;
      if (vis) raf = requestAnimationFrame(loop); else cancelAnimationFrame(raf);
    },{rootMargin:"140px"}).observe(el);
  }
  function once(el, fn, threshold){
    let fired = false;
    new IntersectionObserver((es,o)=>{
      if (!es[0].isIntersecting || fired) return;
      fired = true; o.disconnect(); fn();
    },{threshold: threshold==null ? .28 : threshold}).observe(el);
  }
  function fit(cv, maxDpr){
    const dpr = Math.min(devicePixelRatio||1, maxDpr||2);
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width  = Math.max(1, Math.round(w*dpr));
    cv.height = Math.max(1, Math.round(h*dpr));
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr,0,0,dpr,0,0);
    return {ctx, w, h, dpr};
  }
  function pin(el){
    const r = el.getBoundingClientRect();
    const total = r.height - innerHeight;
    if (total <= 0) return 0;
    return clamp(-r.top/total, 0, 1);
  }
  const PALETTES = [
    ["#08202b","#1f5d50","#b8cf8a"],
    ["#1a0c26","#6b4a8a","#e2b7f0"],
    ["#280c06","#9a3324","#eda06a"],
    ["#0a1830","#2c4a7c","#9dc0e8"],
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
      rg.addColorStop(0, pal[2] + "2a");
      rg.addColorStop(1, "#00000000");
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.fill();
    }
    ctx.globalCompositeOperation = "overlay";
    ctx.lineCap = "round";
    for (let i=0;i<11;i++){
      ctx.beginPath();
      const y0 = rnd()*h;
      ctx.moveTo(-20, y0);
      ctx.bezierCurveTo(w*.3, y0 + (rnd()-.5)*h*.8, w*.7, y0 + (rnd()-.5)*h*.8, w+20, rnd()*h);
      ctx.strokeStyle = rnd() > .5 ? "rgba(255,255,255,.16)" : "rgba(0,0,0,.22)";
      ctx.lineWidth = 1 + rnd()*Math.max(2, h*0.035);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    const step = 2, a = ctx.globalAlpha;
    ctx.globalAlpha = .05;
    for (let y=0;y<h;y+=step) for (let x=0;x<w;x+=step){
      if (rnd() > .55) continue;
      ctx.fillStyle = rnd()>.5 ? "#fff" : "#000";
      ctx.fillRect(x,y,step,step);
    }
    ctx.globalAlpha = a;
    const vg = ctx.createRadialGradient(w*.5,h*.45,Math.min(w,h)*.16,w*.5,h*.5,Math.max(w,h)*.78);
    vg.addColorStop(0,"rgba(0,0,0,0)"); vg.addColorStop(1,"rgba(0,0,0,.46)");
    ctx.fillStyle = vg; ctx.fillRect(0,0,w,h);
  }
(function(){
    const stage = $("#smear"), cv = $("canvas", stage);
    let ctx=null, W=0, H=0, px=-1, py=-1, cx=-1, cy=-1, ready=false;
    function build(){ const f = fit(cv,1.25); ctx=f.ctx; W=f.w; H=f.h;
      ctx.fillStyle = "#151512"; ctx.fillRect(0,0,W,H); ready = true; }
    once(stage, build, .01);
    addEventListener("resize", ()=>{ if(ready) build(); });
    stage.addEventListener("pointermove", e=>{
      const r = stage.getBoundingClientRect();
      cx = e.clientX - r.left; cy = e.clientY - r.top;
    });
    stage.addEventListener("pointerleave", ()=>{ px = py = -1; cx = cy = -1; });
    live(stage, (t)=>{
      if (!ready) return;
      /* clear slowly rather than fully — that is what makes it a smear */
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(21,21,18,.055)";
      ctx.fillRect(0,0,W,H);
      if (cx >= 0){
        if (px < 0){ px = cx; py = cy; }
        const vx = cx-px, vy = cy-py, sp = Math.hypot(vx,vy);
        ctx.globalCompositeOperation = "lighter";
        const steps = Math.min(26, 2 + Math.floor(sp/3));
        for (let i=0;i<steps;i++){
          const k = i/steps;
          const ix = lerp(px,cx,k) + (Math.random()-.5)*sp*.35;
          const iy = lerp(py,cy,k) + (Math.random()-.5)*sp*.35;
          const rad = clamp(46 - sp*.55, 9, 46) * (0.5 + Math.random()*0.7);
          const g = ctx.createRadialGradient(ix,iy,0,ix,iy,rad);
          const warm = sp > 22;
          g.addColorStop(0, warm ? "rgba(245,197,24,.10)" : "rgba(200,214,236,.075)");
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ix,iy,rad,0,7); ctx.fill();
        }
        px = cx; py = cy;
      }
      /* a slow ambient breath so the stage is never dead before you touch it */
      ctx.globalCompositeOperation = "lighter";
      const ax = W*(.5 + Math.sin(t/4200)*.28), ay = H*(.5 + Math.cos(t/5600)*.24);
      const ag = ctx.createRadialGradient(ax,ay,0,ax,ay,Math.max(W,H)*.22);
      ag.addColorStop(0,"rgba(120,150,190,.012)"); ag.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle = ag; ctx.fillRect(0,0,W,H);
      ctx.globalCompositeOperation = "source-over";
    });
  })();
})();
