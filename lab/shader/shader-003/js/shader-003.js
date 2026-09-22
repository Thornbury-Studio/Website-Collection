(function(){
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce){
    const turb = document.querySelector("#grainF feTurbulence");
    setInterval(()=>turb.setAttribute("seed", String(Math.floor(Math.random()*100))), 90);
  }
})();
