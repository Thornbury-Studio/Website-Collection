(function(){
  const prev = document.getElementById("prev");
  const prevFloat = document.getElementById("prevFloat");
  prev.querySelectorAll(".prev-row").forEach(row=>{
    row.addEventListener("mouseenter",()=>{
      prev.classList.add("dimmed");
      prevFloat.style.background = row.dataset.fill;
      prevFloat.classList.add("on");
    });
    row.addEventListener("mouseleave",()=>{
      prev.classList.remove("dimmed");
      prevFloat.classList.remove("on");
    });
  });
  prev.addEventListener("pointermove",e=>{
    prevFloat.style.left = (e.clientX + 26) + "px";
    prevFloat.style.top = (e.clientY - 140) + "px";
  });
})();
