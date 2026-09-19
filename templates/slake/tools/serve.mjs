// Minimal static server with Range support (video seeking needs it). node tools/serve.mjs [port]
import { createServer } from 'node:http';
import { stat, open } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const port = Number(process.argv[2] || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8' };

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(root, path));
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    const info = await stat(file);
    const type = types[extname(file).toLowerCase()] || 'application/octet-stream';
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    let start = 0, end = info.size - 1, status = 200;
    if (range) {
      if (range[1]) start = Number(range[1]);
      if (range[2]) end = Number(range[2]);
      if (!range[1] && range[2]) { start = info.size - Number(range[2]); end = info.size - 1; }
      end = Math.min(end, info.size - 1);
      status = 206;
    }
    res.writeHead(status, {
      'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1,
      'Cache-Control': 'no-cache', ...(status === 206 ? { 'Content-Range': `bytes ${start}-${end}/${info.size}` } : {}),
    });
    if (req.method === 'HEAD') { res.end(); return; }
    const fh = await open(file, 'r');
    fh.createReadStream({ start, end }).on('close', () => fh.close()).pipe(res);
  } catch (e) {
    res.writeHead(e.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain' }).end(e.code === 'ENOENT' ? 'not found' : String(e));
  }
}).listen(port, () => console.log(`slake → http://localhost:${port}`));
