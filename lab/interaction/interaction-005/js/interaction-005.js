(function(){
  document.querySelectorAll("[data-tilt]").forEach(card=>{
    card.addEventListener("pointermove",e=>{
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left)/r.width - .5;
      const py = (e.clientY - r.top)/r.height - .5;
      card.style.transform = `rotateY(${px*22}deg) rotateX(${-py*22}deg)`;
    });
    card.addEventListener("pointerleave",()=>{
      card.style.transition = "transform .6s cubic-bezier(.16,1,.3,1)";
      card.style.transform = "rotateY(0) rotateX(0)";
      setTimeout(()=>card.style.transition="",600);
    });
  });
})();
