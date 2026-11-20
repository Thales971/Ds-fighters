#!/usr/bin/env node
/* Monta a pasta do site estatico (pra GitHub Pages / Cloudflare Pages / qualquer
   hospedagem): so o que o jogo usa — index.html, manifest, sw.js, css/, js/,
   assets/ (sem a arte-fonte assets/art-pack). Sem api/ (funcoes so na Vercel).
   Uso: node tools/build_site.cjs [saida]   (padrao: _site) */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(ROOT, process.argv[2] || '_site');
const FILES = ['index.html', 'manifest.webmanifest', 'sw.js'];
const DIRS = ['css', 'js', 'assets'];
const SKIP = [path.join('assets', 'art-pack')];
fs.rmSync(OUT, { recursive: true, force: true });
let n = 0, bytes = 0;
const copy = (rel) => {
  if (SKIP.some((s) => rel === s || rel.startsWith(s + path.sep))) return;
  const src = path.join(ROOT, rel);
  const st = fs.statSync(src);
  if (st.isDirectory()) { for (const f of fs.readdirSync(src)) copy(path.join(rel, f)); return; }
  if (/\.(md|py)$/i.test(rel)) return;
  const dst = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  n++; bytes += st.size;
};
for (const f of FILES) copy(f);
for (const d of DIRS) copy(d);
fs.writeFileSync(path.join(OUT, '.nojekyll'), ''); /* GitHub Pages: nao processar com Jekyll */
fs.writeFileSync(path.join(OUT, '404.html'), fs.readFileSync(path.join(ROOT, 'index.html')));
console.log(`site em ${path.relative(ROOT, OUT) || '.'}: ${n} arquivos, ${(bytes / 1e6).toFixed(0)} MB`);
