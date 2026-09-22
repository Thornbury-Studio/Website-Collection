(function(){
  const wave = document.getElementById("wave");
  const wtxt = wave.textContent;
  wave.textContent = "";
  [...wtxt].forEach((ch,i)=>{
    const s = document.createElement("span");
    s.textContent = ch;
    s.style.animationDelay = (i * 0.07) + "s";
    wave.appendChild(s);
  });
})();
