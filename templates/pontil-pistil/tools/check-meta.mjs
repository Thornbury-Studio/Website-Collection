/* Fails if any shipped image still carries EXIF, XMP, ICC text or C2PA/JUMBF data. */
import sharp from 'sharp';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
let bad = 0;
for (const f of readdirSync(dir)) {
  if (!/\.(webp|png|jpe?g)$/i.test(f)) continue;
  const m = await sharp(join(dir, f)).metadata();
  const dirty = m.exif || m.xmp || m.iptc || m.tifftagPhotoshop;
  const raw = (await import('node:fs')).readFileSync(join(dir, f)).toString('latin1');
  const c2pa = /c2pa|jumb|contentcredentials|Adobe Photoshop|Exif\0/.test(raw);
  console.log(f.padEnd(24), dirty || c2pa ? 'METADATA' : 'clean');
  if (dirty || c2pa) bad++;
}
process.exit(bad ? 1 : 0);
