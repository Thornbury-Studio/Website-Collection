// Scroll performance probe: real wheel input for a few seconds, then report what
// the page actually did per frame.
//   node templates/lodge-morke/tools/perf.mjs [url] [cdpPort] [width] [height]
//   COLD=1  start scrolling at once, with the cache disabled (frames still arriving)
//   DPR=1.5 device pixel ratio;  NOTCH=1  wheel notches (100px, ~8/s) instead of a smooth stream
// Reports frame intervals (rAF), long tasks, how many film frames the canvas drew
// per second, how far the film trails the scroll (in film frames), and how many of
// the 97 frames had arrived.
import { open, sleep } from './cdp.mjs';

const url = process.argv[2] || 'http://127.0.0.1:8732/templates/lodge-morke/index.html';
const port = +(process.argv[3] || 9333);
const width = +(process.argv[4] || 1440), height = +(process.argv[5] || 900);
const cold = process.env.COLD === '1';
const dpr = +(process.env.DPR || 1);
const notch = process.env.NOTCH === '1';

const page = await open({ port, width, height, dpr });
if (cold) { await page.send('Network.enable'); await page.send('Network.setCacheDisabled', { cacheDisabled: true }); }
await page.goto(url, cold ? 600 : 2500);
for (let i = 0; i < 80; i++) {
  const s = await page.eval('window.MORKE && MORKE.state()');
  if (s && (s.ready || cold)) break;
  await sleep(100);
}
if (!cold) for (let i = 0; i < 100 && (await page.eval('MORKE.state().loaded')) < 97; i++) await sleep(100);

await page.eval(`(() => {
  const P = window.__perf = { frames: [], long: [], slow: [], lag: [], d0: MORKE.state().draws, t0: performance.now() };
  let last = performance.now();
  (function raf(t) {
    const s = MORKE.state();
    if (t - last > 50) P.slow.push([Math.round(t - last), Math.round(scrollY), s.chapter]);
    P.frames.push(t - last); last = t;
    P.lag.push(Math.abs(s.target * 96 - s.frame));
    requestAnimationFrame(raf);
  })(last);
  new PerformanceObserver((l) => l.getEntries().forEach((e) => P.long.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: false });
})()`);

const t0 = Date.now();
while (Date.now() - t0 < 6000) {
  if (notch) { await page.wheel(100); await sleep(120); } else { await page.wheel(60); await sleep(16); }
}
await sleep(800);

const r = await page.eval(`(() => {
  const P = window.__perf, f = P.frames.slice(5).sort((a, b) => a - b), n = f.length, s = MORKE.state();
  const q = (a, p) => a.length ? +a[Math.min(a.length - 1, Math.floor(a.length * p))].toFixed(1) : null;
  const lag = P.lag.slice(5).sort((a, b) => a - b);
  const secs = (performance.now() - P.t0) / 1000;
  return {
    seconds: +secs.toFixed(1), fps: +(n / secs).toFixed(1),
    frameMs: { p50: q(f, 0.5), p95: q(f, 0.95), max: q(f, 1 - 1e-9), over33: f.filter(x => x > 33.4).length, over50: f.filter(x => x > 50).length },
    longTasks: { n: P.long.length, max: P.long.length ? Math.max(...P.long) : 0 },
    filmDrawsPerSec: +((s.draws - P.d0) / secs).toFixed(1),
    filmTrailFrames: { p50: q(lag, 0.5), p95: q(lag, 0.95) },
    framesLoaded: s.loaded, mode: s.mode, film: s.film, scrollY: Math.round(scrollY),
    slowFrames: P.slow.slice(0, 10),
  };
})()`);
console.log(JSON.stringify(r, null, 1));
await page.close();
