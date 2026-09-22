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
    const stage = $("#relit"), cv = $("canvas", stage);
    const RW = 190;                       /* shade at low res, upscale — fast */
    let RH = 120, ctx=null, W=0, H=0, depth=null, albedo=null, img=null, ready=false;
    function hash(x,y){ const n = Math.sin(x*127.1 + y*311.7) * 43758.5453; return n - Math.floor(n); }
    function vnoise(x,y){
      const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi;
      const u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf);
      return lerp(lerp(hash(xi,yi),hash(xi+1,yi),u), lerp(hash(xi,yi+1),hash(xi+1,yi+1),u), v);
    }
    function build(){
      const f = fit(cv,1); ctx=f.ctx; W=f.w; H=f.h;
      RH = Math.max(60, Math.round(RW * H/W));
      depth = new Float32Array(RW*RH);
      albedo = new Float32Array(RW*RH*3);
      for (let y=0;y<RH;y++) for (let x=0;x<RW;x++){
        const i = y*RW+x;
        let d = 0, amp = 1, fr = 0.045;
        for (let o=0;o<4;o++){ d += vnoise(x*fr, y*fr) * amp; amp *= .5; fr *= 2.1; }
        d /= 1.875;
        /* a ridge, so the relief has an edge to cast against */
        d = d*0.72 + Math.pow(Math.max(0, 1 - Math.abs((y/RH) - 0.52 - Math.sin(x*0.035)*0.12)*5), 2) * 0.4;
        depth[i] = d;
        albedo[i*3]   = 0.16 + d*0.30;
        albedo[i*3+1] = 0.19 + d*0.42;
        albedo[i*3+2] = 0.20 + d*0.34;
      }
      img = ctx.createImageData(RW,RH);
      ready = true;
    }
    let lx = .5, ly = .4, tlx = .5, tly = .4;
    stage.addEventListener("pointermove", e=>{
      const r = stage.getBoundingClientRect();
      tlx = (e.clientX - r.left)/r.width; tly = (e.clientY - r.top)/r.height;
    });
    once(stage, build, .01);
    addEventListener("resize", ()=>{ if (ready) build(); });
    const buf = document.createElement("canvas");
    live(stage, (t)=>{
      if (!ready) return;
      if (Math.abs(tlx-.5) < 1e-9 && Math.abs(tly-.4) < 1e-9){
        tlx = .5 + Math.sin(t/3400)*.34; tly = .45 + Math.cos(t/4100)*.22;
      }
      lx = lerp(lx,tlx,.12); ly = lerp(ly,tly,.12);
      const LX = lx*RW, LY = ly*RH, LZ = 42;
      const d = img.data;
      for (let y=0;y<RH;y++) for (let x=0;x<RW;x++){
        const i = y*RW+x;
        const xm = x>0 ? depth[i-1] : depth[i], xp = x<RW-1 ? depth[i+1] : depth[i];
        const ym = y>0 ? depth[i-RW] : depth[i], yp = y<RH-1 ? depth[i+RW] : depth[i];
        let nx = (xm-xp)*21, ny = (ym-yp)*21, nz = 1;
        const nl = Math.hypot(nx,ny,nz); nx/=nl; ny/=nl; nz/=nl;
        let vx = LX-x, vy = LY-y, vz = LZ;
        const vl = Math.hypot(vx,vy,vz); vx/=vl; vy/=vl; vz/=vl;
        const diff = Math.max(0, nx*vx + ny*vy + nz*vz);
        const fall = 1 / (1 + (vl*vl)/6200);
        const spec = Math.pow(diff, 16) * fall * 0.72;
        const l = 0.10 + diff*fall*1.85;
        const o = i*4;
        d[o]   = clamp((albedo[i*3]  *l + spec*1.00)*255, 0, 255);
        d[o+1] = clamp((albedo[i*3+1]*l + spec*0.95)*255, 0, 255);
        d[o+2] = clamp((albedo[i*3+2]*l + spec*0.62)*255, 0, 255);
        d[o+3] = 255;
      }
      buf.width = RW; buf.height = RH;
      buf.getContext("2d").putImageData(img,0,0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(buf, 0, 0, W, H);
    });
  })();
})();
