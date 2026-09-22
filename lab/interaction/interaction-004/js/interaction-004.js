(function(){
  document.querySelectorAll("[data-mag]").forEach(btn=>{
    btn.addEventListener("pointermove",e=>{
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width/2);
      const dy = e.clientY - (r.top + r.height/2);
      btn.style.transform = `translate(${dx*0.35}px,${dy*0.35}px)`;
    });
    btn.addEventListener("pointerleave",()=>{
      btn.style.transition = "transform .5s cubic-bezier(.16,1,.3,1)";
      btn.style.transform = "translate(0,0)";
      setTimeout(()=>btn.style.transition="",500);
    });
  });
})();
