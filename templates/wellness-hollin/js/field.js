/* HOLLIN — the field. One raw WebGL2 fragment shader over a full-screen
   triangle (no three.js: there is no geometry, only a field). Two uniforms
   carry the idea: uHeat (1 at 90 °C, 0 at 38 °C) drives rising, domain-warped
   convection and a fine heat shimmer; uCold (0 at 38 °C, 1 at 4 °C) grows an
   abstract six-fold frost in from the edges and slows time until it stops.
   Colours come from HOLLIN.at(T), the same palette as the page.

   Discipline (DARK.md §5): device pixel ratio capped, renders only while the
   tab is visible and the field is on screen, stops drawing once frozen,
   webglcontextlost AND webglcontextrestored handled, and under
   prefers-reduced-motion (or with no WebGL2) it never starts: three still
   posters rendered from this same shader stand in. */
(function () {
  var wrap = document.getElementById('field');
  var HOLL = window.HOLL || {};
  var api = { set: function () {} };
  window.HollinField = api;
  if (!wrap) return;
  function toStatic() { wrap.classList.add('field--static'); }
  if (HOLL.reduced) { toStatic(); return; }

  var VS = '#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0.0,1.0);}';
  var FS = [
    '#version 300 es',
    'precision highp float;',
    'uniform vec2 uRes; uniform float uTime, uHeat, uCold, uLight;',
    'uniform vec3 uGround, uField, uAccent;',
    'out vec4 frag;',
    'float h12(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}',
    'float vn(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);',
    ' return mix(mix(h12(i),h12(i+vec2(1,0)),u.x),mix(h12(i+vec2(0,1)),h12(i+vec2(1,1)),u.x),u.y);}',
    'const mat2 M=mat2(1.6,1.2,-1.2,1.6);',
    'float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*vn(p);p=M*p;a*=.5;}return s;}',
    'float ridge(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){float n=1.-abs(vn(p)*2.-1.);s+=a*n*n;p=M*p;a*=.55;}return s;}',
    'vec2 rot(vec2 p,float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c)*p;}',
    /* frost: crystal facets (cell edges of a jittered grid) at two scales, short needles on three
       axes 60 degrees apart broken up by noise, and a fine ridged filigree, all clumped by fbm */
    'vec2 h22(vec2 p){vec3 q=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));q+=dot(q,q.yzx+33.33);return fract((q.xx+q.yz)*q.zy);}',
    'float cells(vec2 p){vec2 i=floor(p),f=fract(p);float d1=8.,d2=8.;',
    ' for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(x,y);vec2 r=g+h22(i+g)-f;float d=dot(r,r);',
    '  if(d<d1){d2=d1;d1=d;}else if(d<d2){d2=d;}}',
    ' return sqrt(d2)-sqrt(d1);}',
    'float frost(vec2 p){',
    ' float clump=smoothstep(.28,.7,fbm(p*1.3+3.));',
    ' float f=(1.-smoothstep(0.,.045,cells(p*4.)))*.55+(1.-smoothstep(0.,.06,cells(p*11.+5.)))*.35;',
    ' for(int k=0;k<3;k++){vec2 q=rot(p,float(k)*1.0472+.35);',
    '  float n=vn(vec2(q.x*9.,q.y*48.)+float(k)*7.3);',
    '  f+=smoothstep(.78,.95,n)*smoothstep(.45,.8,vn(q*4.+float(k)))*.7;}',
    ' f+=pow(ridge(p*3.6),4.)*.5;',
    ' return f*clump;}',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/uRes;',
    ' vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;',
    ' float t=uTime;',
    /* heat: convection rising from below, domain-warped */
    ' vec2 q=p*1.35+vec2(0.,-t*.16);',
    ' vec2 w=vec2(fbm(q*1.1+vec2(0.,-t*.05)),fbm(q*1.1+vec2(4.7,1.3)+t*.035));',
    ' float f=fbm(q+2.5*w-vec2(0.,t*.09));',
    ' float sh=vn(vec2(p.x*26.+sin(p.y*7.+t*2.6)*.7,p.y*3.-t*1.5));',
    ' float rise=smoothstep(.7,-.8,p.y);',
    ' float steam=smoothstep(.3,.9,f)*mix(.5,1.,rise);',
    ' float wisp=smoothstep(.56,.95,f)*smoothstep(.35,.9,w.x);',
    ' vec3 col=uGround;',
    ' float amt=mix(.28,1.,uHeat)*(1.-uCold*.8);',
    ' col=mix(col,uField,steam*amt*.5);',
    ' col+=uAccent*wisp*uHeat*.16;',
    ' col+=(sh-.5)*.03*uHeat;',
    /* frost: grows in from the edges along an uneven front, with a bright growing rim */
    ' if(uCold>.001){',
    '  vec2 e=min(uv,1.-uv);e.x*=uRes.x/uRes.y;',
    '  float edge=min(e.x,e.y);',
    '  float front=uCold*1.3-edge*1.6+(fbm(p*1.5+11.)-.5)*1.1+(fbm(p*5.+3.)-.5)*.35;',
    '  float cover=smoothstep(0.,.3,front);',
    '  float fr=frost(p*2.2);',
    '  float rim=smoothstep(0.,.03,front)*(1.-smoothstep(.03,.12,front));',
    '  vec3 iceDark=mix(uGround,vec3(.80,.90,.97),.16);',
    '  vec3 iceLight=mix(uGround,uAccent,.10);',
    '  vec3 ice=mix(iceDark,iceLight,uLight);',
    '  vec3 crys=mix(vec3(.86,.94,1.),mix(uGround,uAccent,.30),uLight);',
    '  col=mix(col,ice,cover*.85);',
    '  col=mix(col,crys,clamp(fr*cover*.42+rim*.18,0.,1.));',
    ' }',
    ' col*=mix(1.,smoothstep(1.4,.3,length(p)),.32*(1.-uLight));',
    ' col+=(h12(gl_FragCoord.xy+fract(t)*97.)-.5)/255.;',
    ' frag=vec4(col,1.);',
    '}'
  ].join('\n');

  var canvas = document.createElement('canvas');
  wrap.insertBefore(canvas, wrap.firstChild);
  var gl = null, prog = null, U = {};
  var raf = 0, running = false, lost = false;
  var pageVisible = document.visibilityState !== 'hidden', onScreen = true;
  var simTime = 3.0, last = 0, dirty = true;
  var S = { heat: 1, cold: 0, light: 0, ground: [0, 0, 0], field: [0, 0, 0], accent: [0, 0, 0] };
  var DPR_CAP = matchMedia('(max-width: 880px)').matches ? 1.25 : 1.5;

  function rgb(hex) { return [1, 3, 5].map(function (i) { return parseInt(hex.slice(i, i + 2), 16) / 255; }); }

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
    return s;
  }
  function init() {
    gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
    if (!gl) return false;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link');
    } catch (e) { return false; }
    gl.useProgram(prog);
    gl.bindVertexArray(gl.createVertexArray());
    ['uRes', 'uTime', 'uHeat', 'uCold', 'uLight', 'uGround', 'uField', 'uAccent'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    size();
    return true;
  }
  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    var w = Math.max(1, Math.round(window.innerWidth * dpr)), h = Math.max(1, Math.round(window.innerHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    if (gl) gl.viewport(0, 0, w, h);
    dirty = true;
  }
  function draw() {
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uTime, simTime);
    gl.uniform1f(U.uHeat, S.heat);
    gl.uniform1f(U.uCold, S.cold);
    gl.uniform1f(U.uLight, S.light);
    gl.uniform3fv(U.uGround, S.ground);
    gl.uniform3fv(U.uField, S.field);
    gl.uniform3fv(U.uAccent, S.accent);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  /* Time runs with the heat and stops in the cold: frozen means frozen. */
  function speed() { return (0.55 + 0.65 * S.heat) * (1 - Math.min(1, S.cold * 1.05)); }
  function frame(now) {
    raf = 0;
    if (!running) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    var v = speed();
    simTime += dt * v;
    draw();
    dirty = false;
    if (v > 0.0005) raf = requestAnimationFrame(frame);
    else running = false;           /* frozen: the last frame stays on the canvas */
  }
  function start() {
    if (lost || !gl || !pageVisible || !onScreen) return;
    if (!running) { running = true; last = 0; }
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  api.set = function (a) {
    S.heat = a.heat; S.cold = a.cold; S.light = a.lightK;
    S.ground = rgb(a.ground); S.field = rgb(a.field); S.accent = rgb(a.accent);
    dirty = true;
    if (gl && !lost) { if (speed() <= 0.0005) { draw(); } else start(); }
  };

  if (!init()) { toStatic(); return; }

  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault();               /* tells the browser we want it back */
    lost = true; stop(); toStatic();
  });
  canvas.addEventListener('webglcontextrestored', function () {
    lost = false;
    if (init()) { wrap.classList.remove('field--static'); draw(); start(); }
  });
  document.addEventListener('visibilitychange', function () {
    pageVisible = document.visibilityState !== 'hidden';
    if (pageVisible) start(); else stop();
  });
  /* The field is fixed behind the whole page, so "on screen" means: any of the
     sections it shows through is in view (the photo band covers it). */
  var shows = [].slice.call(document.querySelectorAll('.hero, #ritual, .rest'));
  if ('IntersectionObserver' in window && shows.length) {
    var seen = new Set();
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
      onScreen = seen.size > 0;
      if (onScreen) start(); else stop();
    });
    shows.forEach(function (el) { io.observe(el); });
  }
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { size(); if (!running && gl && !lost) draw(); start(); }, 120); });
  api.gl = function () { return gl; };
  api.isRunning = function () { return running; };
})();
