// CARIMBO DE VERSAO POR CONTEUDO: index.html, CSS, sw.js e js/asset-hashes.js
// em dia com o conteudo dos arquivos (senao o jogador fica com arquivo velho em
// cache), sem ?v= escrito a mao, e o motor pedindo a arte pelo hash.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const h8 = (p) => crypto.createHash('sha1').update(fs.readFileSync(path.join(ROOT, p))).digest('hex').slice(0, 8);

const r = spawnSync(process.execPath, [path.join(__dirname, 'stamp.cjs'), '--check'], { cwd: ROOT, encoding: 'utf8' });
check('carimbo em dia (node tools/stamp.cjs --check)', r.status === 0, (r.stdout + r.stderr).trim().split('\n').pop());

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)="([^"?#:]+\.(?:js|css|png|jpe?g|webp|webmanifest))(\?v=([^"]*))?"/g)].filter((m) => fs.existsSync(path.join(ROOT, m[1])));
const semHash = refs.filter((m) => !m[3] || !/^[0-9a-f]{8}$/.test(m[3]));
check('todo arquivo local do index.html tem ?v=<hash> (' + refs.length + ')', refs.length > 100 && semHash.length === 0, semHash.slice(0, 4).map((m) => m[1] + (m[2] || '')).join(', ') || 'ok');
const errado = refs.filter((m) => m[1] !== 'js/asset-hashes.js' && m[3] !== h8(m[1]));
check('hash do index.html bate com o conteudo de cada arquivo', errado.length === 0, errado.slice(0, 4).map((m) => m[1]).join(', ') || 'ok');
check('asset-hashes.js e o PRIMEIRO script (antes de layout.js e do motor)', /<script src="js\/asset-hashes\.js\?v=[0-9a-f]{8}"><\/script>\s*<script src="assets\/sprites\/layout\.js/.test(html));

const ctx = { console, Image: class { set src(v) {} } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/asset-hashes.js'), 'utf8') + ';this.B=BUILD_ID;this.H=ASSET_HASH;this.U=assetUrl;', ctx);
check('BUILD_ID e hash de 8 digitos', /^[0-9a-f]{8}$/.test(ctx.B), ctx.B);
check('sw.js usa o cache do build (dsf-<BUILD_ID>)', fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').includes("const CACHE = 'dsf-" + ctx.B + "';"));
const du = 'assets/sprites/du.png';
check('assetUrl troca versao velha pelo hash do conteudo', ctx.U(du + '?v=v47-maresprites') === du + '?v=' + h8(du), ctx.U(du + '?v=v47-maresprites'));
check('assetUrl deixa caminho desconhecido como veio', ctx.U('https://x/y.png') === 'https://x/y.png');
const nAssets = Object.keys(ctx.H).length;
check('mapa cobre as imagens de assets/ (> 600)', nAssets > 600, nAssets + ' assets');

/* o motor pede a arte pelo hash */
vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/sprites/layout.js'), 'utf8') + ';this.SPRITE_LAYOUT=SPRITE_LAYOUT;', ctx);
ctx.document = undefined;
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/engine/sprites.js'), 'utf8') + ';this.SG=SpriteGen;', ctx);
check('SpriteGen.url(du) usa o hash do PNG', ctx.SG.url('du') === du + '?v=' + h8(du), ctx.SG.url('du'));
check('SpriteGen.faceUrl(du) usa o hash do PNG', ctx.SG.faceUrl('du') === 'assets/ui/face-du.png?v=' + h8('assets/ui/face-du.png'), ctx.SG.faceUrl('du'));

/* CSS: imagens com hash */
const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
const cssRefs = [...css.matchAll(/url\(['"]?(\.\.\/assets\/[^'")?]+)(\?v=([0-9a-f]{8}))?['"]?\)/g)];
check('imagens do CSS com ?v=<hash> (' + cssRefs.length + ')', cssRefs.length > 3 && cssRefs.every((m) => m[3] === h8(m[1].slice(3))), '');

console.log(fails ? `CARIMBO: ${fails} FALHAS (${n} checks)` : `CARIMBO: TUDO OK (${n} checks)`);
process.exit(fails ? 1 : 0);
