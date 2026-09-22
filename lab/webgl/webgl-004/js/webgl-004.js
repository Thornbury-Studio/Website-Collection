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
  function faceEl(w,h,transform,bg){
    const f = document.createElement("i");
    f.style.cssText = "position:absolute;left:"+(-w/2)+"px;top:"+(-h/2)+"px;width:"+w+"px;height:"+h+"px;transform:"+transform+";background:"+bg+";";
    return f;
  }
  function makeBox(w,d,h,colors,x,y,baseZ){
    const box = document.createElement("div");
    box.style.cssText = "position:absolute;left:"+x+"px;top:"+y+"px;width:0;height:0;"+
      "transform-style:preserve-3d;transform:translateZ("+((baseZ||0)+h/2)+"px);";
    box.appendChild(faceEl(w,d, "rotateX(90deg) translateZ("+(h/2)+"px)", colors.top));
    box.appendChild(faceEl(w,h, "translateZ("+(d/2)+"px)", colors.front));
    box.appendChild(faceEl(d,h, "rotateY(90deg) translateZ("+(w/2)+"px)", colors.right));
    return box;
  }
(function(){
    const scene = $("#mbxScene"); if (!scene) return;
    const GROUND = 10, C = 60; // C — scene is 120px square; every box coordinate below is relative to that centre
    scene.appendChild(makeBox(70,70,GROUND, {top:"#e7e5e2",front:"#c7c4bc",right:"#b3b0a7"}, C-35,C-35));
    scene.appendChild(makeBox(16,16,26, {top:"#9a3324",front:"#7a2819",right:"#5c1e13"}, C-34,C-34, GROUND));
    scene.appendChild(makeBox(12,12,16, {top:"#1f5d50",front:"#173e37",right:"#102a26"}, C+18,C-30, GROUND));
    scene.appendChild(makeBox(14,14,34, {top:"#f5c518",front:"#c9a012",right:"#9c7d0d"}, C+4,C+10, GROUND));
    scene.appendChild(makeBox(10,10,12, {top:"#2c4a7c",front:"#213a63",right:"#172a49"}, C-30,C+20, GROUND));
    let rot = 0;
    live(scene.closest(".mbx-frame"), ()=>{
      rot += 0.09;
      scene.style.transform = "rotateX(58deg) rotateZ(" + (-45 + Math.sin(rot*0.01)*10) + "deg) translateZ(-10px)";
    });
  })();
})();
