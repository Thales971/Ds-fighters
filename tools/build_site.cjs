#!/usr/bin/env node
/* Monta a pasta do site estatico (pra GitHub Pages / Cloudflare Pages / qualquer
   hospedagem): so o que o jogo usa — index.html, manifest, sw.js, css/, js/,
   assets/ (a arte-fonte fica em arte-fonte/, fora do site). Sem api/ (funcoes so na Vercel).
   Uso: node tools/build_site.cjs [saida]   (padrao: _site) */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
/* carimbo de versao por conteudo antes de copiar (tools/stamp.cjs) */
require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'stamp.cjs')], { stdio: 'inherit' });
const OUT = path.resolve(ROOT, process.argv[2] || '_site');
const FILES = ['index.html', 'manifest.webmanifest', 'sw.js'];
const DIRS = ['css', 'js', 'assets'];
const SKIP = []; /* a arte-fonte mora em arte-fonte/ (fora de assets/): nada pra pular aqui */
/* MUSICA: so publica o audio que o jogo usa (playlist.json + caminhos citados
   no codigo). As copias repetidas que o dono guarda em varias pastas
   (rock/AMV/, rock/One-X/...) ficam no repositorio mas nao vao pro site:
   sem isso o site passava de 1 GB (limite do GitHub Pages). */
const MUSIC_DIR = path.join('assets', 'music');
const usedAudio = new Set();
try {
  const pl = JSON.parse(fs.readFileSync(path.join(ROOT, MUSIC_DIR, 'playlist.json'), 'utf8'));
  for (const k of ['tracks', 'fallback', 'boss', 'shadow', 'menuTracks']) for (const t of pl[k] || []) if (t && t.file) usedAudio.add(path.normalize(t.file));
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

/* MUSICA PESADA: a COPIA PUBLICADA de mp3 acima de 160 kbps vira 128 kbps
   (ffmpeg). O original no repositorio nao muda. Com cache em .cache/site-audio
   (por conteudo), entao so a primeira montagem demora. Sem ffmpeg: copia como
   esta. Desligue com SITE_TRANSCODE=0. */
const { execFileSync, execFile } = require('child_process');
const crypto = require('crypto');
const hasFfmpeg = (() => { if (process.env.SITE_TRANSCODE === '0') return false; try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch (e) { return false; } })();
async function transcodeHeavy() {
  if (!hasFfmpeg) return { n: 0, saved: 0 };
  const CACHE = path.join(ROOT, '.cache', 'site-audio');
  fs.mkdirSync(CACHE, { recursive: true });
  const jobs = [];
  const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); const st = fs.statSync(p); if (st.isDirectory()) walk(p); else if (/\.mp3$/i.test(f)) jobs.push({ p, size: st.size }); } };
  walk(path.join(OUT, MUSIC_DIR));
  let n = 0, saved = 0;
  const heavy = jobs.filter((j) => {
    try {
      const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=bit_rate', '-of', 'csv=p=0', j.p]).toString().trim();
      return Number(out) > 160000;
    } catch (e) { return false; }
  });
  const run = async (j) => {
    const hash = crypto.createHash('md5').update(fs.readFileSync(j.p)).digest('hex');
    const cached = path.join(CACHE, hash + '.mp3');
    if (!fs.existsSync(cached)) {
      await new Promise((res) => execFile('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', j.p, '-codec:a', 'libmp3lame', '-b:a', '128k', '-ac', '2', cached + '.tmp.mp3'], (err) => { if (!err) fs.renameSync(cached + '.tmp.mp3', cached); res(); }));
    }
    if (fs.existsSync(cached)) { const ns = fs.statSync(cached).size; if (ns < j.size) { fs.copyFileSync(cached, j.p); saved += j.size - ns; n++; } }
  };
  for (let i = 0; i < heavy.length; i += 4) await Promise.all(heavy.slice(i, i + 4).map(run));
  return { n, saved };
}
transcodeHeavy().then((t) => {
  const total = bytes - t.saved;
  console.log(`site em ${path.relative(ROOT, OUT) || '.'}: ${n} arquivos, ${(total / 1e6).toFixed(0)} MB (${skippedAudio} audios repetidos/sem uso ficaram fora; ${t.n} musicas pesadas publicadas em 128 kbps, -${(t.saved / 1e6).toFixed(0)} MB)`);
});
