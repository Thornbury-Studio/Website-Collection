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
    const list = $("#roList"); if (!list) return;
    function renumber(){
      $$(".ro-row", list).forEach((r,i)=> $(".n", r).textContent = String(i+1).padStart(2,"0"));
    }
    $$(".ro-row", list).forEach(row=>{
      const grip = $(".grip", row);
      let dragging = false, sy = 0, startTop = 0, rowH = 0;
      grip.addEventListener("pointerdown", e=>{
        dragging = true; grip.setPointerCapture(e.pointerId);
        sy = e.clientY; rowH = row.offsetHeight; startTop = row.offsetTop;
        row.classList.add("dragging");
        row.style.position = "relative"; row.style.zIndex = "9";
      });
      grip.addEventListener("pointermove", e=>{
        if (!dragging) return;
        const dy = e.clientY - sy;
        row.style.transform = "translateY(" + dy + "px)";
        const rows = $$(".ro-row", list);
        const idx = rows.indexOf(row);
        const targetCenter = startTop + dy + rowH/2;
        rows.forEach((r,i)=>{
          if (r === row) return;
          const c = r.offsetTop + rowH/2;
          if (i < idx && targetCenter < c){ list.insertBefore(row, r); sy = e.clientY; startTop = row.offsetTop - dy; }
          if (i > idx && targetCenter > c){ list.insertBefore(row, r.nextSibling); sy = e.clientY; startTop = row.offsetTop - dy; }
        });
      });
      const release = ()=>{
        if (!dragging) return; dragging = false;
        row.classList.remove("dragging");
        row.style.transition = "transform .2s ease";
        row.style.transform = "";
        setTimeout(()=>{ row.style.transition = ""; }, 210);
        renumber();
      };
      grip.addEventListener("pointerup", release);
      grip.addEventListener("pointercancel", release);
    });
  })();
})();
