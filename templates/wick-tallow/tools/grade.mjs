import { mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const rawDir = join(here, 'raw');
const imgDir = join(here, '..', 'img');
mkdirSync(imgDir, { recursive: true });

const ffmpeg = 'ffmpeg';
const vf = 'eq=contrast=1.05:brightness=-0.03:gamma=0.97,unsharp=5:5:0.4';

const jobs = [
  { src: 'dip.png', dest: 'dip.webp', w: 1920 },
  { src: 'dip.png', dest: 'dip-960.webp', w: 960 },
  { src: 'packing.png', dest: 'packing.webp', w: 1600 },
  { src: 'packing.png', dest: 'packing-800.webp', w: 800 },
  { src: 'vault.png', dest: 'vault.webp', w: 1600 },
  { src: 'vault.png', dest: 'vault-800.webp', w: 800 },
  { src: 'yard.png', dest: 'yard.webp', w: 1600 },
  { src: 'yard.png', dest: 'yard-800.webp', w: 800 },
  { src: 'splints.png', dest: 'splints.webp', w: 1600 },
  { src: 'splints.png', dest: 'splints-800.webp', w: 800 },
  { src: 'match.png', dest: 'match.webp', w: 1000 },
  { src: 'match.png', dest: 'match-600.webp', w: 600 },
];

function run(src, dest, w, extraVf) {
  const inFile = join(rawDir, src);
  const outFile = join(imgDir, dest);
  const filter = extraVf ? `${vf},${extraVf}` : `${vf},scale=${w}:-2:flags=lanczos`;
  const args = ['-y', '-i', inFile, '-vf', filter, '-c:v', 'libwebp', '-quality', '78', outFile];
  const r = spawnSync(ffmpeg, args, { encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(r.stderr);
    throw new Error('ffmpeg failed ' + dest);
  }
  console.log('ok', dest);
}

const have = new Set(readdirSync(rawDir));
for (const job of jobs) {
  if (!have.has(job.src)) {
    console.log('missing', job.src);
    continue;
  }
  run(job.src, job.dest, job.w);
}

if (have.has('dip.png')) {
  run('dip.png', 'og.webp', 1200, 'scale=1920:-2:flags=lanczos,crop=1200:630:360:180');
}
