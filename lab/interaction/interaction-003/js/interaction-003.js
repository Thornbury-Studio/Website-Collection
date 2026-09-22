(function(){
  const spot = document.getElementById("spot");
  spot.addEventListener("pointermove",e=>{
    const r = spot.getBoundingClientRect();
    spot.style.setProperty("--mx", (e.clientX - r.left) + "px");
    spot.style.setProperty("--my", (e.clientY - r.top) + "px");
  });
})();
