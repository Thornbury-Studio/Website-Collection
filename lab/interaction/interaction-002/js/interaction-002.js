(function(){
  const tintStage = document.getElementById("tintStage");
  tintStage.querySelectorAll(".tint-row").forEach(row=>{
    row.addEventListener("mouseenter",()=>tintStage.style.backgroundColor = row.dataset.ink);
    row.addEventListener("mouseleave",()=>tintStage.style.backgroundColor = tintStage.dataset.base);
  });
})();
