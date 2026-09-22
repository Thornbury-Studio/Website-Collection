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
    const stage = $("#spkStage"); if (!stage) return;
    const cv = stage.querySelector("canvas");
    let ctx=null, W=0, H=0, pts=[];
    function build(){
      const f = fit(cv,1.5); ctx=f.ctx; W=f.w; H=f.h;
      const n = Math.round(W*H/2600);
      pts = Array.from({length:n},()=>({
        x:Math.random()*W, y:Math.random()*H,
        r: Math.random()<0.08 ? 1.6+Math.random()*1.2 : 0.5+Math.random()*0.7,
        speed: 0.6+Math.random()*1.6, phase: Math.random()*Math.PI*2,
        gold: Math.random()<0.35
      }));
    }
    once(stage, build, .05);
    addEventListener("resize", ()=>{ ctx && build(); });
    live(stage, (t)=>{
      if (!ctx) return;
      ctx.clearRect(0,0,W,H);
      for (const p of pts){
        const a = clamp(Math.sin(t/900*p.speed + p.phase)*0.55+0.45, 0, 1);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.gold ? "#f5c518" : "#f2efe6";
        if (p.r > 1.3){
          ctx.save(); ctx.translate(p.x,p.y);
          ctx.beginPath();
          for (let k=0;k<4;k++){
            const ang = k*Math.PI/2;
            ctx.lineTo(Math.cos(ang)*p.r*2.4, Math.sin(ang)*p.r*2.4);
            ctx.lineTo(Math.cos(ang+Math.PI/4)*p.r*0.6, Math.sin(ang+Math.PI/4)*p.r*0.6);
          }
          ctx.closePath(); ctx.fill(); ctx.restore();
        } else {
          ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,7); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    });
  })();
})();
