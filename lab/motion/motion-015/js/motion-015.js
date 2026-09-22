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
    const svg = $("#kinSvg"); if (!svg) return;
    const NS = "http://www.w3.org/2000/svg";
    const ARMS = [
      {x:80, y:40, len:70, w:5, phase:0},
      {x:180,y:60, len:55, w:4, phase:1.1},
      {x:280,y:35, len:80, w:6, phase:2.2},
      {x:340,y:70, len:50, w:4, phase:3.3},
      {x:130,y:90, len:65, w:5, phase:4.1},
      {x:230,y:100,len:60, w:5, phase:5.0}
    ];
    const els = ARMS.map(a=>{
      const line = document.createElementNS(NS,"line");
      line.setAttribute("x1", a.x); line.setAttribute("y1", a.y);
      line.setAttribute("stroke", "#3a3830"); line.setAttribute("stroke-width", a.w);
      line.setAttribute("stroke-linecap","round");
      svg.appendChild(line);
      const bob = document.createElementNS(NS,"circle");
      bob.setAttribute("r", a.w*1.4); bob.setAttribute("fill", "#111110");
      svg.appendChild(bob);
      return {line, bob, a, kick:0};
    });
    let mx = -1e4, my = -1e4;
    svg.parentElement.addEventListener("pointermove", e=>{
      const r = svg.parentElement.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width * 400;
      my = (e.clientY - r.top) / r.height * 300;
    });
    svg.parentElement.addEventListener("pointerleave", ()=>{ mx = my = -1e4; });
    live(svg.parentElement, (t)=>{
      els.forEach(({line,bob,a})=>{
        const d = Math.hypot(a.x-mx, a.y-my);
        const kick = d < 90 ? (1 - d/90) * 26 : 0;
        const ang = Math.sin(t/1600 + a.phase) * 12 + kick;
        const rad = ang * Math.PI/180;
        const ex = a.x + Math.sin(rad) * a.len;
        const ey = a.y + Math.cos(rad) * a.len * 0.3 + a.len*0.85;
        line.setAttribute("x2", ex); line.setAttribute("y2", ey);
        bob.setAttribute("cx", ex); bob.setAttribute("cy", ey);
      });
    });
  })();
})();
