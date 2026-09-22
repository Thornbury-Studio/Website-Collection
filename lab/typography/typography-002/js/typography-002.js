(function(){
  const scramLines = [
    "websites, audited and designed like they matter.",
    "no rentals. you own the repo, the domain, the mailbox.",
    "say the number. keep, kill, or bend."
  ];
  const scramEl = document.getElementById("scramTxt");
  const CHARS = "!<>-_\\/[]{}\u2014=+*^?#";
  let li = 0;
  function scrambleTo(text, done){
    let frameN = 0;
    const total = text.length * 3 + 20;
    (function step(){
      let out = "";
      for (let i=0;i<text.length;i++){
        if (frameN/3 > i) out += text[i];
        else out += CHARS[Math.floor(Math.random()*CHARS.length)];
      }
      scramEl.textContent = out;
      frameN++;
      if (frameN < total) requestAnimationFrame(step);
      else { scramEl.textContent = text; done && done(); }
    })();
  }
  (function cycle(){
    scrambleTo(scramLines[li], ()=>{
      setTimeout(()=>{
        li = (li+1) % scramLines.length;
        cycle();
      }, 2600);
    });
  })();
})();
