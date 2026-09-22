(function(){
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pc = document.getElementById("partsCanvas");
  const pctx = pc.getContext("2d");
  let pts = [], mouse = {x:-9999,y:-9999};
  function sizeParts(){
    pc.width = pc.clientWidth; pc.height = pc.clientHeight;
    const n = Math.floor(pc.width * pc.height / 16000);
    pts = Array.from({length:n},()=>({
      x:Math.random()*pc.width, y:Math.random()*pc.height,
      vx:(Math.random()-.5)*.5, vy:(Math.random()-.5)*.5,
    }));
  }
  sizeParts();
  addEventListener("resize",sizeParts);
  document.getElementById("parts").addEventListener("pointermove",e=>{
    const r = pc.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  document.getElementById("parts").addEventListener("pointerleave",()=>{mouse.x=-9999;mouse.y=-9999;});
  let partsVisible = false, partsRaf = 0;
  new IntersectionObserver((es)=>{
    const vis = es[0].isIntersecting;
    if (vis === partsVisible) return;
    partsVisible = vis;
    if (vis && !reduce){ partsRaf = requestAnimationFrame(drawParts); }
    else { cancelAnimationFrame(partsRaf); }
  },{rootMargin:"150px"}).observe(document.getElementById("parts"));
  function drawParts(){
    pctx.clearRect(0,0,pc.width,pc.height);
    for (const p of pts){
      p.x += p.vx; p.y += p.vy;
      if (p.x<0||p.x>pc.width) p.vx*=-1;
      if (p.y<0||p.y>pc.height) p.vy*=-1;
      pctx.fillStyle = "rgba(242,239,230,.55)";
      pctx.fillRect(p.x-1,p.y-1,2,2);
      const dm = Math.hypot(p.x-mouse.x,p.y-mouse.y);
      if (dm < 150){
        pctx.strokeStyle = "rgba(245,197,24,"+(1-dm/150)*.7+")";
        pctx.beginPath(); pctx.moveTo(p.x,p.y); pctx.lineTo(mouse.x,mouse.y); pctx.stroke();
      }
    }
    for (let i=0;i<pts.length;i++){
      for (let j=i+1;j<pts.length;j++){
        const a=pts[i],b=pts[j];
        const d=Math.hypot(a.x-b.x,a.y-b.y);
        if (d<90){
          pctx.strokeStyle="rgba(242,239,230,"+(1-d/90)*.22+")";
          pctx.beginPath();pctx.moveTo(a.x,a.y);pctx.lineTo(b.x,b.y);pctx.stroke();
        }
      }
    }
    if (!reduce && partsVisible) partsRaf = requestAnimationFrame(drawParts);
  }
})();
