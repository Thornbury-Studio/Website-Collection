(function(){
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const blobShapes = [
    "M100,18 C138,18 182,44 182,96 C182,150 140,182 96,182 C50,182 18,146 18,98 C18,48 60,18 100,18 Z",
    "M100,26 C150,10 190,60 174,104 C160,148 150,186 100,178 C52,170 8,142 22,92 C34,50 62,38 100,26 Z",
    "M96,14 C136,26 186,52 178,102 C170,154 132,190 88,178 C46,166 14,136 22,88 C30,44 58,4 96,14 Z"
  ];
  const blobPath = document.getElementById("blobPath");
  let bi = 0;
  blobPath.setAttribute("d", blobShapes[0]);
  if (!reduce){
    blobPath.style.transition = "d 2.6s ease-in-out";
    setInterval(()=>{
      bi = (bi+1) % blobShapes.length;
      blobPath.setAttribute("d", blobShapes[bi]);
      blobPath.style.d = `path("${blobShapes[bi]}")`;
    }, 2800);
  }
})();
