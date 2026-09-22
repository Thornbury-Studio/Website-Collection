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
    const tile = $("#lpTile"), ring = $("#lpRing"), menu = $("#lpMenu");
    if (!tile) return;
    const circle = $("circle", ring);
    const CIRC = 126;
    let raf = 0, t0 = 0, held = false;
    function frame(t){
      const p = clamp((t - t0) / 620, 0, 1);
      circle.style.strokeDashoffset = String(CIRC * (1-p));
      if (p >= 1){
        ring.classList.remove("on"); placeMenu(); menu.classList.add("on");
        held = false; return;
      }
      if (held) raf = requestAnimationFrame(frame);
    }
    function placeMenu(){
      const home = tile.parentElement.getBoundingClientRect();
      const tr = tile.getBoundingClientRect();
      const mw = menu.offsetWidth || 150;
      let left = clampNum(tr.left - home.left + tr.width/2 - mw/2, 8, home.width - mw - 8);
      let top = tr.bottom - home.top + 10;
      const mh = menu.offsetHeight || 132;
      if (top + mh > home.height - 8) top = tr.top - home.top - mh - 10;
      menu.style.left = left + "px"; menu.style.top = top + "px";
    }
    function clampNum(v,a,b){ return v<a?a:v>b?b:v; }
    function start(e){
      if (menu.classList.contains("on")) return;
      held = true; t0 = performance.now(); ring.classList.add("on");
      circle.style.strokeDashoffset = String(CIRC);
      raf = requestAnimationFrame(frame);
    }
    /* the release handler double-checks elapsed wall-clock time rather
       than trusting that the rAF loop already ticked past the threshold —
       a backgrounded or throttled tab can otherwise miss the frame that
       would have opened the menu even though the hold was long enough. */
    function cancel(){
      if (!held) return;
      held = false; cancelAnimationFrame(raf);
      if (performance.now() - t0 >= 620){
        circle.style.strokeDashoffset = "0";
        ring.classList.remove("on"); placeMenu(); menu.classList.add("on");
      } else {
        ring.classList.remove("on");
      }
    }
    tile.addEventListener("pointerdown", start);
    tile.addEventListener("pointerup", cancel);
    tile.addEventListener("pointerleave", cancel);
    tile.addEventListener("pointercancel", cancel);
    tile.addEventListener("contextmenu", e=> e.preventDefault());
    tile.parentElement.addEventListener("pointerdown", e=>{
      if (!menu.contains(e.target) && e.target !== tile && !tile.contains(e.target)){
        menu.classList.remove("on");
      }
    });
    $$("button", menu).forEach(b=> b.addEventListener("click", ()=> menu.classList.remove("on")));
  })();
})();
