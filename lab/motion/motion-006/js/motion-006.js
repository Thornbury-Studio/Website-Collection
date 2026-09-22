(function(){
  const sgridGrid = document.getElementById("sgridGrid");
  const CELLS = 40;
  for (let i=0;i<CELLS;i++){
    const c = document.createElement("div");
    c.className = "sgrid-cell";
    c.style.transitionDelay = (i * 28) + "ms";
    sgridGrid.appendChild(c);
  }
  const sgrid = document.getElementById("sgrid");
  new IntersectionObserver((es)=>{
    es.forEach(e=>{ if (e.isIntersecting) sgrid.classList.add("on"); });
  },{threshold:.25}).observe(sgrid);
})();
