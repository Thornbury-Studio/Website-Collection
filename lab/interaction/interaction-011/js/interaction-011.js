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
    const stage = $("#stick"); if (coarse) return;
    const ring = document.createElement("div"); ring.className = "cur";
    const dot  = document.createElement("div"); dot.className = "cur-dot";
    document.body.append(ring, dot);
    let x=0,y=0, tx=0, ty=0, snapped=null, running=false, raf=0;
    stage.addEventListener("pointerenter", ()=>{
      ring.classList.add("on"); dot.classList.add("on");
      stage.style.cursor = "none";
      if (!running){ running = true; raf = requestAnimationFrame(loop); }
    });
    stage.addEventListener("pointerleave", ()=>{
      ring.classList.remove("on"); dot.classList.remove("on");
      stage.style.cursor = ""; running = false; cancelAnimationFrame(raf);
    });
    stage.addEventListener("pointermove", e=>{
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = "translate(" + (tx-2) + "px," + (ty-2) + "px)";
    });
    $$("[data-snap]", stage).forEach(t=>{
      t.addEventListener("pointerenter", ()=> snapped = t);
      t.addEventListener("pointerleave", ()=> snapped = null);
    });
    /* belt and braces: if the stage scrolls away without a pointerleave
       (it happens), the ring must not be left floating over other stages */
    new IntersectionObserver((es)=>{
      if (es[0].isIntersecting) return;
      ring.classList.remove("on"); dot.classList.remove("on");
      running = false; cancelAnimationFrame(raf); snapped = null;
    }).observe(stage);
    function loop(){
      if (!running) return;
      let gx = tx, gy = ty, w = 36, h = 36;
      if (snapped){
        const r = snapped.getBoundingClientRect();
        gx = r.left + r.width/2; gy = r.top + r.height/2;
        w = r.width + 16; h = r.height + 12;
        /* still let the hand pull the box a little — magnetism, not a lock */
        gx = lerp(gx, tx, .12); gy = lerp(gy, ty, .12);
      }
      ring.classList.toggle("snap", !!snapped);
      ring.style.width = w + "px"; ring.style.height = h + "px";
      x = lerp(x, gx, snapped ? .28 : .17);
      y = lerp(y, gy, snapped ? .28 : .17);
      ring.style.transform = "translate(" + (x - w/2) + "px," + (y - h/2) + "px)";
      raf = requestAnimationFrame(loop);
    }
  })();
})();
