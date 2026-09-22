(function(){
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (s,r)=> (r||document).querySelector(s);
  const $$ = (s,r)=> [...(r||document).querySelectorAll(s)];
  const clamp = (v,a,b)=> v<a?a:v>b?b:v;
  function once(el, fn, threshold){
    let fired = false;
    new IntersectionObserver((es,o)=>{
      if (!es[0].isIntersecting || fired) return;
      fired = true; o.disconnect(); fn();
    },{threshold: threshold==null ? .2 : threshold}).observe(el);
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
    ctx.globalCompositeOperation = "lighter";
    for (let i=0;i<5;i++){
      const cx = rnd()*w, cy = rnd()*h, r = (0.18+rnd()*0.42)*Math.max(w,h);
      const rg = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
      rg.addColorStop(0, pal[2] + "2a"); rg.addColorStop(1, "#00000000");
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    const vg = ctx.createRadialGradient(w*.5,h*.45,Math.min(w,h)*.16,w*.5,h*.5,Math.max(w,h)*.78);
    vg.addColorStop(0,"rgba(0,0,0,0)"); vg.addColorStop(1,"rgba(0,0,0,.46)");
    ctx.fillStyle = vg; ctx.fillRect(0,0,w,h);
  }
(function(){
    const sheet = $("#bsSheet"), handle = $("#bsHandle"); if (!sheet) return;
    const H = ()=> sheet.parentElement.clientHeight;
    const STOPS = [0.86, 0.42, 0.04]; // fraction of height left showing as translateY
    let stop = 0, sy=0, startY=0, dragging=false, lastY=0, lastT=0, vel=0;
    function place(frac, animate){
      sheet.style.transition = animate ? "transform .32s cubic-bezier(.16,1,.3,1)" : "none";
      sheet.style.transform = "translateY(" + (frac*100) + "%)";
    }
    place(STOPS[0], false);
    handle.addEventListener("pointerdown", e=>{
      dragging = true; handle.setPointerCapture(e.pointerId);
      sy = e.clientY; startY = STOPS[stop]*H(); lastY = e.clientY; lastT = performance.now();
      sheet.style.transition = "none";
    });
    handle.addEventListener("pointermove", e=>{
      if (!dragging) return;
      const dy = e.clientY - sy;
      const px = clamp(startY + dy, STOPS[2]*H(), STOPS[0]*H());
      sheet.style.transform = "translateY(" + px + "px)";
      const t = performance.now();
      if (t > lastT){ vel = (e.clientY - lastY) / (t - lastT); lastY = e.clientY; lastT = t; }
    });
    const release = ()=>{
      if (!dragging) return; dragging = false;
      const cur = (parseFloat(sheet.style.transform.replace(/[^-\d.]/g,"")) || 0) / H();
      let target = 0;
      if (vel > 0.55) target = Math.min(STOPS.length-1, stop+1);
      else if (vel < -0.55) target = Math.max(0, stop-1);
      else {
        let bd = Infinity;
        STOPS.forEach((s,i)=>{ const d = Math.abs(s-cur); if (d<bd){bd=d; target=i;} });
      }
      stop = target; vel = 0;
      place(STOPS[stop], true);
    };
    handle.addEventListener("pointerup", release);
    handle.addEventListener("pointercancel", release);
  })();
})();
