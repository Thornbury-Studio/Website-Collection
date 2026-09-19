// Real-browser verification over CDP. Starts nothing itself: run headless Chrome first —
//   chrome.exe --headless=new --hide-scrollbars --remote-debugging-port=9222 --user-data-dir=<scratch> about:blank
// then:  node tools/shot.mjs [desktop|mobile] [url]
// Writes viewport screenshots to tools/shots/ and prints live measurements as JSON.
import { writeFile, mkdir } from 'node:fs/promises';

const mode = process.argv[2] || 'desktop';
const url = process.argv[3] || 'http://localhost:4173/';
const vp = mode === 'mobile' ? { width: 390, height: 844, mobile: true, deviceScaleFactor: 2 } : { width: 1440, height: 900, mobile: false, deviceScaleFactor: 1 };
await mkdir('tools/shots', { recursive: true });

const target = await (await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } if (d.method === 'Page.loadEventFired') loaded?.(); };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let loaded;

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: vp.width, height: vp.height, deviceScaleFactor: vp.deviceScaleFactor, mobile: vp.mobile });
const loadP = new Promise((r) => (loaded = r));
await send('Page.navigate', { url });
await loadP; await sleep(2500);

const shot = async (name) => {
  const { result } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(`tools/shots/${mode}-${name}.png`, Buffer.from(result.data, 'base64'));
};
const scrollTo = async (y) => { await evaluate(`window.scrollTo({top:${y}, behavior:'instant'}); true`); await sleep(700); };
const state = () => evaluate(`(() => {
  const cs = getComputedStyle(document.documentElement);
  const coals = document.querySelector('.furnace__video'), pour = document.querySelector('.pour');
  const stage = document.querySelector('.stage').getBoundingClientRect();
  return {
    scrollY: Math.round(scrollY), heat: cs.getPropertyValue('--heat').trim(), bodyBg: getComputedStyle(document.body).backgroundColor,
    navColor: getComputedStyle(document.querySelector('.top')).color,
    coals: { src: (coals.currentSrc||'').split('/').pop(), ready: coals.readyState, t: +coals.currentTime.toFixed(2), paused: coals.paused, w: coals.videoWidth, h: coals.videoHeight, off: coals.closest('.furnace').classList.contains('is-off') },
    pour:  { src: (pour.currentSrc||'').split('/').pop(), ready: pour.readyState, t: +pour.currentTime.toFixed(2), paused: pour.paused, w: pour.videoWidth, h: pour.videoHeight, opacity: getComputedStyle(pour).opacity },
    titleA: getComputedStyle(document.querySelector('.stage__a')).opacity, titleB: getComputedStyle(document.querySelector('.stage__b')).opacity,
    stageTop: Math.round(stage.top), stageBottom: Math.round(stage.bottom),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth ? document.documentElement.scrollWidth : 0,
    native: CSS.supports('(animation-timeline: view()) and (animation-range: entry)'),
  };
})()`);

const out = {};
out.load = await state();
await shot('00-hero');
const doc = await evaluate('document.documentElement.scrollHeight');
const y = async (sel, frac = 0) => evaluate(`(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return Math.round(r.top + scrollY + r.height * ${frac}); })()`);
const stops = [
  ['01-burn', await y('.burn')],
  ['02-stage-enter', (await y('.stage')) - 200],
  ['03-stage-30', (await y('.stage')) + ((await y('.stage', 1)) - (await y('.stage')) + vp.height) * 0.30 - vp.height],
  ['04-stage-50', (await y('.stage')) + ((await y('.stage', 1)) - (await y('.stage')) + vp.height) * 0.50 - vp.height],
  ['05-stage-70', (await y('.stage')) + ((await y('.stage', 1)) - (await y('.stage')) + vp.height) * 0.70 - vp.height],
  ['06-cold', await y('.cold')],
  ['07-people', await y('.people')],
  ['08-people-2', (await y('.people')) + vp.height * 0.9],
  ['09-order', await y('.order')],
];
for (const [name, top] of stops) { await scrollTo(top); out[name] = await state(); await shot(name); }

// keyboard / form: tab to the order form and submit with an invalid then valid email
await scrollTo(await y('.order'));
out.form = await evaluate(`(async () => {
  const f = document.querySelector('.order__form'); const email = f.elements.email; const done = f.querySelector('.order__done');
  email.value = 'not-an-email'; f.requestSubmit(); await new Promise(r=>setTimeout(r,50));
  const invalid = { valid: email.checkValidity(), done: done.textContent };
  email.value = 'sip@example.com'; f.elements.cases.value = 3; f.requestSubmit(); await new Promise(r=>setTimeout(r,50));
  return { invalid, afterValid: { done: done.textContent, button: f.querySelector('.button').textContent, disabled: f.querySelector('.button').disabled } };
})()`);
await shot('10-order-submitted');
// real keyboard: Tab twice from the top of the page, read what has focus and whether it shows a ring
await scrollTo(0);
await evaluate('document.activeElement && document.activeElement.blur(); true');
// a real click on the hero (no link there) resets the sequential-focus starting point to the top
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: Math.round(vp.width * 0.5), y: Math.round(vp.height * 0.2), button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: Math.round(vp.width * 0.5), y: Math.round(vp.height * 0.2), button: 'left', clickCount: 1 });
for (let i = 0; i < 2; i++) {
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
}
out.focus = await evaluate(`(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { el: a.className, text: a.textContent.trim(), focusVisible: a.matches(':focus-visible'), outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor }; })()`);
await sleep(800);
await shot('11-keyboard-focus');
out.docHeight = doc;
console.log(JSON.stringify(out, null, 1));
await send('Page.close');
ws.close();
