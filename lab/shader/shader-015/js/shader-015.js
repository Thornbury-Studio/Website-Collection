(function(){
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (s,r)=> (r||document).querySelector(s);
  const $$ = (s,r)=> [...(r||document).querySelectorAll(s)];
  const clamp = (v,a,b)=> v<a?a:v>b?b:v;
  const lerp  = (a,b,t)=> a+(b-a)*t;
  function once(el, fn, threshold){
    let fired = false;
    new IntersectionObserver((es,o)=>{
      if (!es[0].isIntersecting || fired) return;
      fired = true; o.disconnect(); fn();
    },{threshold: threshold==null ? .2 : threshold}).observe(el);
  }
  function live(el, step){
    if (reduce){ step(performance.now()); return; }
    let on = false, raf = 0, t0 = performance.now();
    const loop = (t)=>{ if(!on) return; step(t - t0); raf = requestAnimationFrame(loop); };
    new IntersectionObserver((es)=>{
      const vis = es[0].isIntersecting;
      if (vis === on) return;
      on = vis;
      if (vis) raf = requestAnimationFrame(loop); else cancelAnimationFrame(raf);
    },{rootMargin:"120px"}).observe(el);
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
    ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = Math.max(1, w*0.008);
    for (let i=0;i<7;i++){
      ctx.beginPath();
      const y0 = (i/6)*h;
      ctx.moveTo(-10, y0);
      ctx.bezierCurveTo(w*.33, y0 + (rnd()-.5)*h*.5, w*.66, y0 + (rnd()-.5)*h*.5, w+10, y0 + (rnd()-.5)*h*.3);
      ctx.globalAlpha = 0.14;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
(function(){
    const frame = $("#drsFrame"); if (!frame) return;
    const DEPTH = 6;
    let clicks = 0;
    function build(){
      frame.innerHTML = "";
      for (let i=0;i<DEPTH;i++){
        const plate = document.createElement("div");
        plate.className = "plate";
        const scale = Math.pow(0.62, i);
        plate.style.transform = "scale(" + scale.toFixed(4) + ")";
        plate.style.zIndex = String(i); // smaller frames (higher i) must paint ON TOP to read as nested
        plate.style.transition = "transform .6s cubic-bezier(.16,1,.3,1)";
        if (i === DEPTH-1){
          const w = document.createElement("span");
          w.style.cssText = "font-family:var(--serif);font-style:italic;color:#fff;font-size:1rem;";
          w.textContent = "still here";
          plate.appendChild(w);
        } else {
          const inner = document.createElement("div");
          inner.className = "inner";
          plate.appendChild(inner);
        }
        frame.appendChild(plate);
      }
    }
    build();
    frame.addEventListener("click", ()=>{
      clicks++;
      $$(".plate", frame).forEach((p,i)=>{
        const scale = Math.pow(0.62, i) * Math.pow(0.62, clicks % 3 === 0 ? -3 : 0);
        p.style.transform = "scale(" + Math.pow(0.62, i - (clicks%3)).toFixed(4) + ")";
      });
    });
  })();
})();
