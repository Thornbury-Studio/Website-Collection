// Seek latency per encode: the number that decides whether scrubbing stutters.
//   node tools/seek-test.mjs [port]
// Needs `python tools/media.py --test` (writes tools/shots/enc/) and a static server
// on 127.0.0.1:8731 serving the repo root.
import { open } from './cdp.mjs';

const base = 'http://127.0.0.1:8731/templates/lodge-morke/';
const files = ['tools/shots/enc/intra-crf27.mp4', 'tools/shots/enc/intra-crf31.mp4', 'tools/shots/enc/gop12-crf27.mp4', 'film/descent-s.mp4'];

const page = await open({ port: +(process.argv[2] || 9333) });
await page.goto(base + 'tools/media.py', 300); // any same-origin page
for (const f of files) {
  const r = await page.eval(`(async () => {
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = ${JSON.stringify(base + f)};
    document.body.appendChild(v);
    await new Promise((res, rej) => { v.oncanplaythrough = res; v.onerror = () => rej(new Error('load')); });
    const dur = v.duration, fps = 24;
    v.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;object-fit:cover';
    // time to the frame actually being presented, not just the seeked event
    const seek = (t) => new Promise((res) => { const s = performance.now(); v.requestVideoFrameCallback((now, md) => res(performance.now() - s)); v.currentTime = t; });
    const step = [], jump = [];
    for (let i = 0; i < 60; i++) step.push(await seek(Math.min(dur - 0.01, (i + 0.5) / fps)));           // one frame at a time, like a slow scroll
    for (let i = 0; i < 40; i++) jump.push(await seek(((i * 37) % 190 + 0.5) / fps));                   // random jumps, like a flick
    const st = (a) => { a = a.slice().sort((x, y) => x - y); return { med: +a[a.length >> 1].toFixed(1), p95: +a[Math.floor(a.length * 0.95)].toFixed(1), max: +a[a.length - 1].toFixed(1) }; };
    v.remove();
    return { dur: +dur.toFixed(3), w: v.videoWidth, h: v.videoHeight, step: st(step), jump: st(jump) };
  })()`);
  console.log(f.padEnd(34), JSON.stringify(r));
}
await page.close();
