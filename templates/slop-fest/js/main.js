// Slop-Fest: fake chatbot, fake cookie banner, fake "live" counters.
var msgs=["👋 Hi there! I'm Slopbot, your AI dining assistant! How can I elevate your experience today?",
"Great question! As an AI, I don't eat, but I'm told our Quantum Truffle Synergy is a game-changer! 🚀",
"I'd be happy to help with that! Unfortunately I can't access reservations. Please call 555-0123. ✨"];
var i=0,bot=document.getElementById('bot'),box=document.getElementById('botmsg');
bot.onclick=function(){box.style.display='block';box.textContent=msgs[i++%msgs.length];};
document.getElementById('ok').onclick=function(){document.getElementById('cookie').remove();};
document.querySelector('form').onsubmit=function(e){e.preventDefault();alert('🎉 Welcome to the Slop-Fest family! You\'re on the list!');};
// "live" counter that is just a number going up
var n=10247,el=document.getElementById('live');
setInterval(function(){n+=Math.floor(Math.random()*3);el.textContent=n.toLocaleString()+'+';},1800);
