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
    const stage = $("#vdStage"); if (!stage) return;
    const CARDS = [
      {n:"05", t:"Torchlight"}, {n:"12", t:"Constellation"}, {n:"19", t:"Decoder"},
      {n:"27", t:"Sticky cursor"}, {n:"33", t:"The stack"}, {n:"47", t:"Bento"}
    ];
    let i = 0;
    function spawn(){
      const c = CARDS[i % CARDS.length]; i++;
      const el = document.createElement("div");
      el.className = "vd-card";
      el.innerHTML = '<span class="n">' + c.n + '</span><span class="t">' + c.t + '</span>' +
        '<span class="flag keep">KEEP</span><span class="flag kill">KILL</span>';
      stage.insertBefore(el, stage.firstChild);
      wire(el);
    }
    function wire(card){
      let sx=0, sy=0, dx=0, dy=0, dragging=false;
      const keep = $(".flag.keep", card), kill = $(".flag.kill", card);
      card.addEventListener("pointerdown", e=>{
        dragging = true; card.setPointerCapture(e.pointerId);
        sx = e.clientX; sy = e.clientY; card.style.transition = "";
      });
      card.addEventListener("pointermove", e=>{
        if (!dragging) return;
        dx = e.clientX - sx; dy = e.clientY - sy;
        const rot = dx * 0.05;
        card.style.transform = "translate(" + dx + "px," + dy + "px) rotate(" + rot + "deg)";
        keep.style.opacity = String(clamp(dx/70, 0, 1));
        kill.style.opacity = String(clamp(-dx/70, 0, 1));
      });
      const release = ()=>{
        if (!dragging) return; dragging = false;
        const THRESH = 90;
        card.style.transition = "transform .35s cubic-bezier(.16,1,.3,1)";
        if (Math.abs(dx) > THRESH){
          card.style.transform = "translate(" + (dx>0?520:-520) + "px," + dy + "px) rotate(" + (dx*0.06) + "deg)";
          setTimeout(()=> card.remove(), 300);
        } else if (dy < -THRESH){
          card.style.transform = "translate(" + dx + "px,-560px) rotate(" + (dx*0.06) + "deg)";
          setTimeout(()=> card.remove(), 300);
        } else {
          card.style.transform = ""; keep.style.opacity = "0"; kill.style.opacity = "0";
        }
        dx = dy = 0;
      };
      card.addEventListener("pointerup", release);
      card.addEventListener("pointercancel", release);
    }
    once(stage, ()=>{ spawn(); spawn(); spawn(); }, .1);
    /* keep the stack fed as cards leave */
    new MutationObserver(()=>{ if (stage.children.length < 2) spawn(); }).observe(stage,{childList:true});
  })();
})();
