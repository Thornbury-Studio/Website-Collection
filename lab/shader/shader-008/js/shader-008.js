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
    const stage = $("#flow"), cv = $("canvas", stage);
    let ctx=null, W=0, H=0, ps=[], ready=false, n=0;
    function hash(x,y){ const v = Math.sin(x*127.1 + y*311.7)*43758.5453; return v - Math.floor(v); }
    function vnoise(x,y){
      const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi;
      const u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf);
      return lerp(lerp(hash(xi,yi),hash(xi+1,yi),u), lerp(hash(xi,yi+1),hash(xi+1,yi+1),u), v);
    }
    function build(){
      const f = fit(cv,1.25); ctx=f.ctx; W=f.w; H=f.h;
      ctx.fillStyle="#fbfaf7"; ctx.fillRect(0,0,W,H);
      n = Math.min(1300, Math.round(W*H/900));
      ps = Array.from({length:n},()=>({x:Math.random()*W, y:Math.random()*H, life:Math.random()*260}));
      ready = true;
    }
    once(stage, build, .01);
    addEventListener("resize", ()=>{ if (ready) build(); });
    live(stage, (t)=>{
      if (!ready) return;
      ctx.fillStyle = "rgba(251,250,247,.019)";
      ctx.fillRect(0,0,W,H);
      ctx.lineWidth = 0.7;
      const drift = t*0.00006;
      for (const p of ps){
        const a = (vnoise(p.x*0.0035 + drift, p.y*0.0035) * 2.4 + drift*3) * Math.PI * 2;
        const nx = p.x + Math.cos(a)*1.5, ny = p.y + Math.sin(a)*1.5;
        ctx.strokeStyle = p.life % 37 < 3 ? "rgba(245,197,24,.42)" : "rgba(17,17,16,.14)";
        ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(nx,ny); ctx.stroke();
        p.x = nx; p.y = ny; p.life--;
        if (p.life < 0 || p.x < 0 || p.x > W || p.y < 0 || p.y > H){
          p.x = Math.random()*W; p.y = Math.random()*H; p.life = 120 + Math.random()*260;
        }
      }
    });
  })();
})();
