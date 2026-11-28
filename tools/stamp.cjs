#!/usr/bin/env node
/* CARIMBO DE VERSAO AUTOMATICO (cache busting por conteudo).

   Antes: cada arquivo tinha um ?v= escrito a mao (v47-maresprites, v98-...),
   ~150 lugares. Esquecer de trocar um = jogador com arquivo velho em cache
   ("o jogo parece 5 commits atrasado"). Agora a versao E o conteudo:

   - js/asset-hashes.js (gerado): ASSET_HASH { 'assets/...png': '1a2b3c4d' }
     para TODA imagem/json de assets/, BUILD_ID (hash de tudo junto) e
     assetUrl(caminho) -> 'caminho?v=<hash do arquivo>'. O motor pede as
     folhas por assetUrl: arte nova = URL nova na hora; arte igual = cache.
   - index.html: todo <script src> / <link href> / <img src> local ganha
     ?v=<hash do arquivo> (o proprio asset-hashes.js tambem).
   - sw.js: o nome do cache vira 'dsf-<BUILD_ID>': build novo instala service
     worker novo, que apaga o cache de imagens antigo.

   Uso: node tools/stamp.cjs          (carimba)
        node tools/stamp.cjs --check  (so confere; sai 1 se algo estiver velho)
   Roda sozinho no npm test (tools/run-tests.cjs) e no build do GitHub Pages
   (tools/build_site.cjs); o teste stamp_test.cjs barra commit sem carimbo. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const CHECK = process.argv.includes('--check');
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const hashOf = (buf) => crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8);
const hashFile = (p) => hashOf(fs.readFileSync(path.join(ROOT, p)));

/* assets que o jogo pede por URL (musica fica de fora: streaming, sem cache do SW) */
const ASSET_EXT = /\.(png|jpe?g|webp|gif|svg|json)$/i;
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'music') walk(p, out); }
    else if (ASSET_EXT.test(e.name)) out.push(rel(p));
  }
  return out;
}

const changed = [];
function write(file, content) {
  const abs = path.join(ROOT, file);
  const old = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
  if (old === content) return;
  changed.push(file);
  if (!CHECK) fs.writeFileSync(abs, content);
}

/* 1. mapa de hashes dos assets */
const assets = walk(path.join(ROOT, 'assets'), []).sort();
const map = {};
for (const a of assets) map[a] = hashFile(a);

/* 1b. CSS: url(../assets/...) ganha ?v=<hash> (fonte, neve, morcegos, retratos...) */
for (const f of fs.readdirSync(path.join(ROOT, 'css')).filter((x) => x.endsWith('.css'))) {
  const cp = 'css/' + f;
  const css = fs.readFileSync(path.join(ROOT, cp), 'utf8');
  const out = css.replace(/url\((['"]?)(\.\.\/assets\/[^'")?#]+)(\?v=[^'")]*)?\1\)/g, (m, q, u) => {
    const p = u.replace(/^\.\.\//, '');
    if (!fs.existsSync(path.join(ROOT, p))) return m;
    return 'url(' + q + u + '?v=' + hashFile(p) + q + ')';
  });
  write(cp, out);
}

/* 2. index.html: carimba tudo que e local (menos o proprio asset-hashes, feito no fim) */
const htmlPath = 'index.html';
let html = fs.readFileSync(path.join(ROOT, htmlPath), 'utf8');
const stampRefs = (text, skip) => text.replace(/((?:src|href)=")([^"?#:]+\.(?:js|css|png|jpe?g|webp|svg|webmanifest|json))(\?v=[^"]*)?"/g, (m, pre, p, q) => {
  if (skip && skip(p)) return m;
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f)) return m; /* externo/inexistente: nao mexe */
  return pre + p + '?v=' + hashFile(p) + '"';
});
html = stampRefs(html, (p) => p === 'js/asset-hashes.js');

/* 3. BUILD_ID = hash de todo o codigo + assets (muda a cada mudanca real) */
const codeFiles = [...html.matchAll(/(?:src|href)="([^"?#:]+\.(?:js|css))\?v=/g)].map((m) => m[1]).filter((p) => p !== 'js/asset-hashes.js');
const all = crypto.createHash('sha1');
for (const p of codeFiles.sort()) all.update(p + ':' + hashFile(p) + '\n');
for (const a of assets) all.update(a + ':' + map[a] + '\n');
all.update('index:' + hashOf(html.replace(/\?v=[0-9a-f]{8}/g, '')));
const BUILD_ID = all.digest('hex').slice(0, 8);

/* 4. js/asset-hashes.js */
const hashesJs = `/* GERADO por tools/stamp.cjs — nao edite a mao (rode: node tools/stamp.cjs).
   Versao de cada asset = hash do conteudo: arte nova muda a URL sozinha. */
var BUILD_ID = '${BUILD_ID}';
var ASSET_HASH = ${JSON.stringify(map)};
/* 'assets/x.png' ou 'assets/x.png?v=velho' -> 'assets/x.png?v=<hash>' */
function assetUrl(src) {
  const s = String(src || '');
  const p = s.split('?')[0];
  const h = ASSET_HASH[p];
  return h ? p + '?v=' + h : s;
}
/* GARANTIA GLOBAL: toda imagem que o jogo cria com caminho 'assets/...' sai com
   o hash, mesmo de um carregador que esqueceu de chamar assetUrl. */
(function () {
  try {
    if (typeof HTMLImageElement === 'undefined') return;
    const d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    if (!d || !d.set) return;
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      configurable: true, enumerable: d.enumerable, get: d.get,
      set(v) { d.set.call(this, typeof v === 'string' && v.indexOf('assets/') === 0 ? assetUrl(v) : v); },
    });
  } catch (e) { /* navegador sem suporte: cada carregador ja chama assetUrl */ }
})();
`;
write('js/asset-hashes.js', hashesJs);
html = html.replace(/(src=")js\/asset-hashes\.js(\?v=[^"]*)?"/, '$1js/asset-hashes.js?v=' + hashOf(hashesJs) + '"');
if (!/js\/asset-hashes\.js\?v=/.test(html)) {
  console.error('index.html precisa carregar js/asset-hashes.js antes dos outros scripts');
  process.exit(2);
}
write(htmlPath, html);

/* 5. sw.js: cache por build */
const swPath = 'sw.js';
const sw = fs.readFileSync(path.join(ROOT, swPath), 'utf8').replace(/const CACHE = '[^']*';/, `const CACHE = 'dsf-${BUILD_ID}';`);
write(swPath, sw);

if (CHECK) {
  if (changed.length) { console.log('CARIMBO DESATUALIZADO: ' + changed.join(', ') + ' — rode: node tools/stamp.cjs'); process.exit(1); }
  console.log('carimbo ok (build ' + BUILD_ID + ', ' + assets.length + ' assets)');
} else {
  console.log((changed.length ? 'carimbado: ' + changed.join(', ') : 'nada mudou') + ' (build ' + BUILD_ID + ', ' + assets.length + ' assets)');
}
