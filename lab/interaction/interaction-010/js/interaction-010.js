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
    const stage = $("#lens"), cv = $("canvas", stage), hint = $(".hint", stage);
    const off = document.createElement("canvas");
    let W=0, H=0, ctx=null, mx=-1e4, my=-1e4, tx=-1e4, ty=-1e4, ready=false;
    function build(){
      const f = fit(cv, 1.5); ctx = f.ctx; W = f.w; H = f.h;
      off.width = Math.round(W); off.height = Math.round(H);
      plate(off.getContext("2d"), off.width, off.height, 3);
      ready = true;
    }
    stage.addEventListener("pointermove", e=>{
      const r = stage.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      hint.style.opacity = "0";
    });
    stage.addEventListener("pointerleave", ()=>{ tx = -1e4; ty = -1e4; hint.style.opacity = ""; });
    once(stage, build, .01);
    addEventListener("resize", ()=>{ if (ready) build(); });
    const SIZE = 150, ZOOM = 2.6;
    live(stage, ()=>{
      if (!ready) return;
      mx = lerp(mx, tx, .22); my = lerp(my, ty, .22);
      ctx.globalAlpha = 1;
      ctx.drawImage(off, 0, 0, W, H);
      if (mx < -1000) return;
      const half = SIZE/2, src = SIZE/ZOOM;
      ctx.save();
      ctx.beginPath(); ctx.rect(mx-half, my-half, SIZE, SIZE); ctx.clip();
      /* chromatic fringe: the same crop drawn three times, offset per channel */
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(off, mx-src/2, my-src/2, src, src, mx-half, my-half, SIZE, SIZE);
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = .32;
      ctx.drawImage(off, mx-src/2, my-src/2, src, src, mx-half-2.5, my-half, SIZE, SIZE);
      ctx.drawImage(off, mx-src/2, my-src/2, src, src, mx-half+2.5, my-half, SIZE, SIZE);
      ctx.restore();
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(245,197,24,.9)"; ctx.lineWidth = 1;
      ctx.strokeRect(mx-half+.5, my-half+.5, SIZE-1, SIZE-1);
      ctx.fillStyle = "rgba(245,197,24,.9)";
      ctx.fillRect(mx-half, my-half-9, 26, 7);
      ctx.fillStyle = "#111110"; ctx.font = "6px monospace";
      ctx.fillText("2.6×", mx-half+4, my-half-3.5);
    });
  })();
})();
