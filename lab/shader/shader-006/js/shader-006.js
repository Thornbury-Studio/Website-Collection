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
    const host = $("#half"), cv = $("canvas", host);
    const off = document.createElement("canvas");
    let ctx=null, W=0, H=0, data=null, ready=false, mx=-1e4, my=-1e4, queued=false;
    const CELL = 7, RAD = 120;
    function build(){
      const f = fit(cv,1); ctx=f.ctx; W=f.w; H=f.h;
      off.width = Math.round(W); off.height = Math.round(H);
      const octx = off.getContext("2d");
      plate(octx, off.width, off.height, 4);
      data = octx.getImageData(0,0,off.width,off.height).data;
      ready = true; draw();
    }
    function lum(x,y){
      const px = clamp(Math.round(x),0,off.width-1), py = clamp(Math.round(y),0,off.height-1);
      const o = (py*off.width + px)*4;
      return (data[o]*0.299 + data[o+1]*0.587 + data[o+2]*0.114)/255;
    }
    function draw(){
      queued = false;
      if (!ready) return;
      ctx.fillStyle = "#fbfaf7"; ctx.fillRect(0,0,W,H);
      /* the resolved window: the real plate, clipped to a circle at the cursor */
      if (mx > -1000){
        ctx.save();
        ctx.beginPath(); ctx.arc(mx,my,RAD,0,7); ctx.clip();
        ctx.drawImage(off,0,0,W,H);
        ctx.restore();
      }
      ctx.fillStyle = "#141412";
      const ang = 15*Math.PI/180, ca = Math.cos(ang), sa = Math.sin(ang);
      const diag = Math.hypot(W,H);
      for (let v=-diag; v<diag; v+=CELL) for (let u=-diag; u<diag; u+=CELL){
        const x = u*ca - v*sa + W/2, y = u*sa + v*ca + H/2;
        if (x < -CELL || x > W+CELL || y < -CELL || y > H+CELL) continue;
        if (mx > -1000 && Math.hypot(x-mx, y-my) < RAD - 2) continue;
        const r = (1 - lum(x,y)) * CELL * 0.72;
        if (r < 0.3) continue;
        ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill();
      }
      if (mx > -1000){
        ctx.strokeStyle = "rgba(245,197,24,.85)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(mx,my,RAD,0,7); ctx.stroke();
      }
    }
    function ping(){ if (!queued){ queued = true; requestAnimationFrame(draw); } }
    host.addEventListener("pointermove", e=>{
      const r = host.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top; ping();
    });
    host.addEventListener("pointerleave", ()=>{ mx = my = -1e4; ping(); });
    once(host, build, .05);
    addEventListener("resize", ()=>{ if (ready) build(); });
  })();
})();
