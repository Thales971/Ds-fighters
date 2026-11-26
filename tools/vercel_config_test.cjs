// VERCEL (fase 5): o plano gratis estourou "Fast Data Transfer" (114/100 GB).
// Causa: vercel.json mandava "no-store" em TUDO — cada visita baixava de novo
// ~400 imagens e as musicas. Aqui garantimos:
// - assets (imagens/musicas) com cache no navegador (>= 1 dia)
// - HTML/JS/CSS revalidam (304 de poucos bytes quando nada mudou), nunca no-store
// - API sem cache
// - .vercelignore tira do upload a arte-fonte/prints (nao usados pelo site) e
//   mantem tudo que o site e a API usam (inclusive tools/supabase_keepalive.js,
//   que o api/keepalive.js importa)
const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const rules = (cfg.headers || []).map((h) => ({ source: h.source, cc: ((h.headers || []).find((x) => x.key.toLowerCase() === 'cache-control') || {}).value || '' }));
/* path-to-regexp simplificado do Vercel: (.*) e (a|b) */
const match = (src, p) => new RegExp('^' + src.replace(/\//g, '\\/') + '$').test(p);
const ccFor = (p) => { const r = rules.filter((x) => match(x.source, p)); return r.length ? r[r.length - 1].cc : ''; };
check('nenhuma regra manda no-store pra todo o site', !rules.some((r) => r.source === '/(.*)' && /no-store/.test(r.cc)), JSON.stringify(rules.map((r) => r.source)));
for (const p of ['/assets/sprites/du.png', '/assets/music/rock/x.mp3', '/assets/maps/v21/represa-far.png']) {
  const cc = ccFor(p); const age = +(cc.match(/max-age=(\d+)/) || [0, 0])[1];
  check('cache no navegador para ' + p, age >= 86400 && !/no-store/.test(cc), cc || 'sem regra');
}
for (const p of ['/', '/index.html', '/js/main.js', '/css/style.css']) {
  const cc = ccFor(p);
  check('revalida (sem no-store) ' + p, /max-age=0/.test(cc) && /must-revalidate/.test(cc) && !/no-store/.test(cc), cc || 'sem regra');
}
check('API sem cache', /no-store/.test(ccFor('/api/tournaments')), ccFor('/api/tournaments'));
/* .vercelignore com a mesma semantica do .gitignore */
const ignored = (p) => { try { execFileSync('git', ['-c', 'core.excludesFile=' + path.join(ROOT, '.vercelignore'), 'check-ignore', '--no-index', '-q', p], { cwd: ROOT, stdio: 'ignore' }); return true; } catch (e) { return false; } };
for (const p of ['index.html', 'js/main.js', 'css/style.css', 'assets/music/rock/x.mp3', 'assets/sprites/du.png', 'api/keepalive.js', 'api/tournaments.js', 'tools/supabase_keepalive.js', 'vercel.json']) check('vai pro deploy: ' + p, !ignored(p));
for (const p of ['arte-fonte/personagens/a.jpg', 'arte-fonte/pitoco-pet/a.jpg', 'arte-fonte/milena-personagem/a.png', 'arte-fonte/fauna/a.png', 'arte-fonte/torcida/a.jpg', 'arte-fonte/dev-virado-personagem/a.png', 'arte-fonte/flora/a.png', 'arte-fonte/esquilo-libelula/a.png', 'arte-fonte/inspiracoes/a.jpg', 'arte-fonte/art-pack/source/a.png', 'tools/run-tests.cjs', 'docs/a.md', 'online-server/server.js', 'node_modules/x/index.js', 'README.md']) check('fora do deploy: ' + p, ignored(p));
console.log('---');
console.log(fails === 0 ? 'VERCEL CONFIG: TUDO OK (' + n + ' checks)' : 'VERCEL CONFIG: ' + fails + ' FALHAS de ' + n);
process.exit(fails ? 1 : 0);
