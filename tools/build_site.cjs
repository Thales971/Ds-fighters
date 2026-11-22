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
/* MUSICA: so publica o audio que o jogo usa (playlist.json + caminhos citados
   no codigo). As copias repetidas que o dono guarda em varias pastas
   (rock/AMV/, rock/One-X/...) ficam no repositorio mas nao vao pro site:
   sem isso o site passava de 1 GB (limite do GitHub Pages). */
const MUSIC_DIR = path.join('assets', 'music');
const usedAudio = new Set();
try {
  const pl = JSON.parse(fs.readFileSync(path.join(ROOT, MUSIC_DIR, 'playlist.json'), 'utf8'));
  for (const k of ['tracks', 'fallback', 'boss']) for (const t of pl[k] || []) if (t && t.file) usedAudio.add(path.normalize(t.file));
  if (pl.menu && pl.menu.file) usedAudio.add(path.normalize(pl.menu.file));
} catch (e) { /* sem playlist: publica tudo */ }
const codeRefs = (() => {
  let txt = '';
  const grab = (d) => { for (const f of fs.readdirSync(path.join(ROOT, d))) { const r = path.join(d, f); const st = fs.statSync(path.join(ROOT, r)); if (st.isDirectory()) grab(r); else if (/\.(js|html|json)$/.test(f)) txt += fs.readFileSync(path.join(ROOT, r), 'utf8'); } };
  try { grab('js'); txt += fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'); } catch (e) { /* ok */ }
  return txt;
})();
const audioUsed = (rel) => !usedAudio.size || usedAudio.has(rel) || codeRefs.includes(rel.split(path.sep).join('/'));
let skippedAudio = 0;
fs.rmSync(OUT, { recursive: true, force: true });
let n = 0, bytes = 0;
const copy = (rel) => {
  if (SKIP.some((s) => rel === s || rel.startsWith(s + path.sep))) return;
  const src = path.join(ROOT, rel);
  const st = fs.statSync(src);
  if (st.isDirectory()) { for (const f of fs.readdirSync(src)) copy(path.join(rel, f)); return; }
  if (/\.(md|py)$/i.test(rel)) return;
  if (rel.startsWith(MUSIC_DIR + path.sep) && /\.(mp3|ogg|m4a|wav)$/i.test(rel) && !audioUsed(rel)) { skippedAudio++; return; }
  const dst = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  n++; bytes += st.size;
};
for (const f of FILES) copy(f);
for (const d of DIRS) copy(d);
fs.writeFileSync(path.join(OUT, '.nojekyll'), ''); /* GitHub Pages: nao processar com Jekyll */
fs.writeFileSync(path.join(OUT, '404.html'), fs.readFileSync(path.join(ROOT, 'index.html')));
console.log(`site em ${path.relative(ROOT, OUT) || '.'}: ${n} arquivos, ${(bytes / 1e6).toFixed(0)} MB (${skippedAudio} audios repetidos/sem uso ficaram fora)`);
