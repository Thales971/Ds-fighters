#!/usr/bin/env node
/* Servidor estático mínimo para rodar o jogo em http:// (o jogo não funciona
   direito em file:// por causa de módulos, canvas e iframes same-origin).

   Uso: node tools/dev_server.mjs [porta]        (padrão 8099)
   Imprime a URL base; Ctrl+C encerra. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2] || process.env.PORT || 8099);
/* --override <caminho-da-url>=<arquivo>  simula arquivo velho em cache
   (ex.: layout.js antigo) sem mexer no repositório. Repetível. */
const OVERRIDES = {};
process.argv.slice(3).forEach((a) => {
  const m = /^(.*?)=(.*)$/.exec(a);
  if (m) OVERRIDES[m[1].replace(/^\/+/, '')] = m[2];
});
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const key = url.replace(/^\/+/, '');
  let file = OVERRIDES[key] || path.join(ROOT, url === '/' ? 'index.html' : key);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end('fora da raiz'); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain' }).end('404 ' + url); return; }
    res.writeHead(200, {
      'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(buf);
  });
});

server.listen(PORT, '127.0.0.1', () => console.log(`http://127.0.0.1:${PORT}/`));
