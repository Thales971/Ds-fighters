// SITE ESTATICO (GitHub Pages/Cloudflare Pages): tools/build_site.cjs monta a pasta
// e o jogo abre servido num SUBCAMINHO (/Ds-fighters/, como no GitHub Pages):
// tela inicial, luta de demo, nenhum arquivo do jogo com 404, service worker.
const http = require('http'); const fs = require('fs'); const path = require('path'); const os = require('os');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'dsf-site-'));
execFileSync(process.execPath, [path.join(__dirname, 'build_site.cjs'), OUT], { stdio: 'ignore' });
const has = (p) => fs.existsSync(path.join(OUT, p));
check('site tem index, manifest, sw, css, js e assets', ['index.html', 'manifest.webmanifest', 'sw.js', '.nojekyll', 'css/style.css', 'js/main.js', 'assets/sprites/du.png', 'assets/music/playlist.json'].every(has));
check('site sem arte-fonte, ferramentas, api e docs', !has('assets/art-pack') && !has('tools') && !has('api') && !has('bugs') && !has('README.md'));
let size = 0; const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); const s = fs.statSync(p); if (s.isDirectory()) walk(p); else size += s.size; } }; walk(OUT);
check('site cabe no limite do GitHub Pages (< 1 GB)', size < 1e9, (size / 1e6).toFixed(0) + ' MB');
let pw; try { pw = require('playwright'); } catch (e) { pw = null; }
const done = () => { fs.rmSync(OUT, { recursive: true, force: true }); console.log('---'); console.log(fails === 0 ? 'SITE ESTATICO: TUDO OK (' + n + ' checks)' : 'SITE ESTATICO: ' + fails + ' FALHAS de ' + n); process.exit(fails ? 1 : 0); };
if (!pw) { console.log('(sem playwright: pulando o teste no navegador)'); done(); } else {
  const BASE = '/Ds-fighters/';
  const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
  const server = http.createServer((req, res) => {
    let u = decodeURIComponent(req.url.split('?')[0]);
    if (!u.startsWith(BASE)) { res.writeHead(404); return res.end(); }
    u = u.slice(BASE.length) || 'index.html';
    const f = path.join(OUT, u);
    if (!f.startsWith(OUT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  (async () => {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const url = 'http://localhost:' + server.address().port + BASE;
    const b = await pw.chromium.launch(); const p = await b.newPage({ viewport: { width: 960, height: 540 } });
    const miss = []; const errs = [];
    p.on('response', (r) => { const u = new URL(r.url()); if (r.status() === 404 && !u.pathname.includes('/api/')) miss.push(u.pathname); });
    p.on('pageerror', (e) => errs.push(e.message));
    try {
      await p.goto(url, { waitUntil: 'load' });
      await p.waitForFunction(() => window.DSGame && typeof UI !== 'undefined' && UI.screen === 'title', null, { timeout: 30000 });
      await p.waitForTimeout(3000);
      const st = await p.evaluate(() => ({ mode: DSGame.mode, running: DSGame.running }));
      check('jogo abre no subcaminho ' + BASE + ' com a luta de demo', st.mode === 'demo' && st.running, JSON.stringify(st));
      check('nenhum arquivo do jogo com 404', miss.length === 0, miss.slice(0, 5).join(', '));
      const sw = await p.evaluate(async () => Promise.race([navigator.serviceWorker.ready.then((r) => r.scope), new Promise((ok) => setTimeout(() => ok('timeout'), 10000))]));
      check('service worker ativo dentro do subcaminho', String(sw).endsWith(BASE), sw);
      check('sem erro de JS', errs.length === 0, errs.slice(0, 2).join(' | '));
    } catch (e) { check('suite rodou sem excecao', false, e.message.slice(0, 160)); }
    await b.close(); server.close(); done();
  })();
}
