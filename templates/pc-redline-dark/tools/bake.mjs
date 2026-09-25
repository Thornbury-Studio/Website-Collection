// Bakes every model-derived figure into the static HTML, so the pages read
// correctly before (or without) JavaScript and no number is ever typed.
//
//   node tools/bake.mjs
//
// Markers look like <!--b:key-->…<!--/b-->. They stay in the output, so
// re-running is idempotent. The model is js/redline-model.js — the same file
// the browser runs — and the readout words come from its own text()/sentence(),
// the same functions the live readout and its aria-live mirror call.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
new Function(readFileSync(path.join(root, 'js/redline-model.js'), 'utf8'))();
const R = globalThis.REDLINE;
const S = R.SPEC, G = S.gpu, T = S.today;
const nf = R.nf;
const pct = (x) => Math.round(x * 100) + '%';
const one = (x) => (Math.round(x * 10) / 10).toFixed(1);

const idle = R.readout(R.idle());
const full = R.readout(R.settled(1));
const it = R.text(idle), ft = R.text(full);

// the fan curve on airflow.html, drawn from R.fanCurve
function fanChart() {
  const W = 720, H = 400, L = 64, Rm = 20, Tm = 34, Bm = 56;
  const w = W - L - Rm, h = H - Tm - Bm;
  const t0 = 30, t1 = 84, r1 = G.fanMaxRPM;
  const x = (t) => L + (t - t0) / (t1 - t0) * w;
  const y = (r) => Tm + h - r / r1 * h;
  let d = '';
  // rising branch: stopped until fanStopC, then the curve
  for (let t = t0; t <= t1 + 1e-9; t += 0.25) {
    const r = t < G.fanStopC ? 0 : R.fanCurve(t, true);
    d += (d ? 'L' : 'M') + x(t).toFixed(1) + ' ' + y(r).toFixed(1);
    if (Math.abs(t - G.fanStopC) < 0.13) d += 'L' + x(t).toFixed(1) + ' ' + y(G.fanStartRPM).toFixed(1);
  }
  const gridR = [800, 1600, 2400, 3200];
  const grid = gridR.map((r) => `<line x1="${L}" x2="${W - Rm}" y1="${y(r).toFixed(1)}" y2="${y(r).toFixed(1)}"/>`).join('');
  const yl = [0, ...gridR].map((r) => `<text x="${L - 10}" y="${(y(r) + 4).toFixed(1)}" text-anchor="end">${nf(r)}</text>`).join('');
  const xl = [30, 40, 50, 60, 70, 80].map((t) => `<text x="${x(t).toFixed(1)}" y="${H - Bm + 24}" text-anchor="middle">${t}</text>`).join('');
  const mark = (t, r, label, anchor, dx, dy) =>
    `<circle class="mark" cx="${x(t).toFixed(1)}" cy="${y(r).toFixed(1)}" r="5"/>` +
    `<text class="mark-l" x="${(x(t) + dx).toFixed(1)}" y="${(y(r) + dy).toFixed(1)}" text-anchor="${anchor}">${label}</text>`;
  return `
          <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="curve-t curve-d">
            <title id="curve-t">GX9900 fan speed against core temperature</title>
            <desc id="curve-d">Fans stopped below ${G.fanStopC} °C. At ${G.fanStopC} °C they start at ${nf(G.fanStartRPM)} RPM and climb in a straight line to ${nf(G.fanTopRPM)} RPM at ${G.fanTopC} °C, then to a ceiling of ${nf(G.fanMaxRPM)} RPM. Idle sits at ${it.temp} with the fans ${it.rpm.toLowerCase()}; sustained full load settles at ${ft.temp} and ${ft.rpm}.</desc>
            <rect class="quiet" x="${x(t0).toFixed(1)}" y="${Tm}" width="${(x(G.fanStopC) - x(t0)).toFixed(1)}" height="${h}"/>
            <text class="quiet-l" x="${(x(t0) + 12).toFixed(1)}" y="${Tm + 22}">fans stopped</text>
            <g class="grid">${grid}<line x1="${L}" x2="${W - Rm}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}"/></g>
            <g class="axis">${yl}${xl}<text x="${W - Rm}" y="${H - 4}" text-anchor="end">GPU core, °C</text><text x="${L}" y="${Tm - 18}" text-anchor="start">RPM</text></g>
            <path class="curve" d="${d}"/>
            ${mark(idle.temp, 0, 'idle', 'start', 10, -12)}
            ${mark(full.temp, full.rpm, 'full load', 'end', -12, -12)}
            <circle class="now" data-now cx="${x(idle.temp).toFixed(1)}" cy="${y(0).toFixed(1)}" r="9"/>
          </svg>`;
}

const bar = (f) => `<i style="width:${(f * 100).toFixed(1)}%"></i>`;
const today = { vram: T.vramGB, bw: R.todayBandwidthGBs(), tf: R.todayTflops(), w: T.boardW };
const spare = R.vramGB() - R.llmTotalGB();

const V = {
  // live readout, idle and settled full load — the same words the live code prints
  'idle.load': it.load, 'idle.temp': it.temp, 'idle.rpm': it.rpm, 'idle.watts': it.watts, 'idle.state': it.state,
  'full.load': ft.load, 'full.temp': ft.temp, 'full.rpm': ft.rpm, 'full.watts': ft.watts,
  'idle.sentence': R.sentence(idle), 'full.sentence': R.sentence(full),
  'full.rpmShare': pct(full.rpm / G.fanMaxRPM),

  price: 'S$' + nf(S.price), lead: S.leadDays + ' working days', builds: String(S.buildsPerWeek),
  warranty: S.warrantyYears + ' years', service: 'month ' + S.serviceMonth, serviceMonth: String(S.serviceMonth), ship: S.shipKg + ' kg',
  burnH: String(S.burnHours), burn: nf(R.burnSamples()),

  name: G.name, vram: R.vramGB() + ' GB', modules: G.modules + ' × ' + G.moduleGB + ' GB',
  bus: G.busBits + '-bit', gbps: G.gbps + ' Gbps', bw: nf(R.bandwidthGBs()) + ' GB/s',
  tflops: one(R.tflops()), shaders: nf(G.shaders), boost: G.boostGHz.toFixed(2) + ' GHz',
  boardW: G.boardW + ' W', connW: G.connectorW + ' W', idleW: G.idleW + ' W',
  fanStop: G.fanStopC + ' °C', fanRest: G.fanRestC + ' °C', fanStart: nf(G.fanStartRPM) + ' RPM', fanMax: nf(G.fanMaxRPM) + ' RPM',
  gpuFans: G.fans + ' × ' + G.fanMM + ' mm',

  'today.vram': today.vram + ' GB', 'today.bw': nf(today.bw) + ' GB/s', 'today.tf': one(today.tf), 'today.w': today.w + ' W',
  'vs.vram': '+' + R.vsToday(R.vramGB(), today.vram) + '%', 'vs.bw': '+' + R.vsToday(R.bandwidthGBs(), today.bw) + '%',
  'vs.tf': '+' + R.vsToday(R.tflops(), today.tf) + '%', 'vs.w': '+' + R.vsToday(G.boardW, today.w) + '%',
  // bars are whole elements: a marker can't live inside an attribute
  'bar.vram': bar(today.vram / R.vramGB()), 'bar.bw': bar(today.bw / R.bandwidthGBs()),
  'bar.tf': bar(today.tf / R.tflops()), 'bar.w': bar(today.w / G.boardW),
  'today.modules': T.modules + ' × ' + T.moduleGB + ' GB', 'today.bus': T.busBits + '-bit', 'today.gbps': T.gbps + ' Gbps',
  'today.shaders': nf(T.shaders), 'today.boost': T.boostGHz.toFixed(2) + ' GHz',

  cpu: S.cpu.cores + ' cores, ' + S.cpu.threads + ' threads, ' + S.cpu.boostGHz + ' GHz boost',
  cpuW: S.cpu.pptW + ' W', ram: S.ram.gb + ' GB DDR5-' + S.ram.mts + ' (' + S.ram.sticks + ' × ' + S.ram.gb / S.ram.sticks + ' GB)',
  ssd: S.ssd.tb + ' TB PCIe 5.0 NVMe, ' + nf(S.ssd.readMBs) + ' MB/s read',
  psu: nf(S.psu.w) + ' W ' + S.psu.standard + ', ' + S.psu.rating, psuW: nf(S.psu.w) + ' W',
  restW: S.restW + ' W', peak: nf(R.peakSystemW()) + ' W', psuShare: pct(R.psuShare()),

  llmParams: S.llm.paramsB + '-billion-parameter', llmBits: S.llm.bits + '-bit', llmCtx: nf(S.llm.ctx),
  llmW: R.llmWeightsGB() + ' GB', llmKV: R.llmContextGB().toFixed(2) + ' GB', llmTotal: one(R.llmTotalGB()) + ' GB',
  llmSpare: one(spare) + ' GB',

  airFans: S.air.fans + ' × ' + S.air.fanMM + ' mm', airIntakes: String(S.air.intakes), airRise: S.air.riseC + ' °C',
  airM3h: nf(R.airM3h()), airCFM: nf(R.airCFM()), intakeRPM: nf(Math.round(R.intakeRPM() / 10) * 10),
  airShare: pct(R.intakeRPM() / S.air.fanMaxRPM), airMaxRPM: nf(S.air.fanMaxRPM),

  loopMl: S.loop.ml + ' ml', loopC: S.loop.gpuColderC + ' °C', loopMonths: String(S.loop.serviceMonths),
  dBIdle: S.dB.idle + ' dBA', dBLoad: S.dB.load + ' dBA',

  chart: fanChart()
};

// page descriptions carry figures too, so they're baked as whole elements
const meta = (d, og) => `<meta name="description" content="${d}">
<meta property="og:description" content="${og || d}">`;
Object.assign(V, {
  'meta.index': meta(`REDLINE One: a single desktop workstation built around the ${G.name} — ${V.vram} of GDDR7, ${V.boardW}, fans that stop at idle. One configuration, hand-built in Singapore, ${S.buildsPerWeek} a week.`,
    `One machine around the ${G.name}. ${V.vram}, ${V.boardW}, and a fan curve that stops completely when you don't need it.`),
  'meta.gx': meta(`The ${G.name}: ${V.vram} of GDDR7 on a ${V.bus} bus, ${V.bw}, ${V.tflops} TFLOPS FP32, ${V.boardW} on one 12V-2×6 connector. The card REDLINE is built around.`,
    `${V.vram}, ${V.bw}, ${V.boardW} on one cable. The spec sheet, set against the fastest card on sale today.`),
  'meta.air': meta(`REDLINE is air-cooled on purpose: ${V.airFans} fans, ${V.airM3h} m³ an hour at full load, and a ${G.name} fan curve that stops below ${V.fanStop}.`,
    `Why a ${V.peak} workstation ships without water — and the fan curve its live readout runs on.`),
  'meta.order': meta(`REDLINE One, one configuration: ${V.price} GST included, ${V.lead} from order to dispatch, ${V.burnH}-hour burn-in, ${V.warranty} parts and labour.`,
    `${V.price}. ${V.lead}. ${V.burnH} hours at full load before it ships.`)
});

const files = ['index.html', 'gx9900.html', 'airflow.html', 'order.html'];
let total = 0;
const missing = new Set();
for (const f of files) {
  const p = path.join(root, f);
  const src = readFileSync(p, 'utf8');
  let n = 0;
  const out = src.replace(/<!--b:([\w.]+)-->[\s\S]*?<!--\/b-->/g, (m, key) => {
    if (!(key in V)) { missing.add(key); return m; }
    n++;
    return `<!--b:${key}-->${V[key]}<!--/b-->`;
  });
  if (out !== src) writeFileSync(p, out);
  console.log(f, n, 'figures');
  total += n;
}
if (missing.size) { console.error('unknown keys:', [...missing].join(', ')); process.exit(1); }
console.log(total, 'baked');
