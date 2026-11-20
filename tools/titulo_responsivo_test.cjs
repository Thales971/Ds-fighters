// TELA INICIAL + RESPONSIVIDADE (navegador real via Playwright):
// - a tela de START anima de verdade (frames diferentes), com e sem "reduzir animacoes"
// - a luta de demonstracao roda ATRAS da tela inicial
// - em 7 tamanhos de tela o botao START cabe na tela sem rolar e nao ha rolagem lateral
// - no menu, a primeira opcao aparece sem rolar (inclusive celular deitado)
// Sem Playwright instalado (maquina sem navegador), a suite avisa e nao roda.
const http = require('http');
const fs = require('fs');
const path = require('path');

let pw;
try { pw = require('playwright'); } catch (e) {
  console.log('TITULO/RESPONSIVO: PULADO — playwright nao instalado nesta maquina (npm i -D playwright && npx playwright install chromium)');
  process.exit(0);
}

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.json': 'application/json', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(ROOT, u === '/' ? 'index.html' : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

const VIEWS = [
  ['desktop 1366x768', { viewport: { width: 1366, height: 768 } }],
  ['ultrawide 2560x1080', { viewport: { width: 2560, height: 1080 } }],
  ['celular em pe 390x664', { viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true }],
  ['celular deitado 750x342', { viewport: { width: 750, height: 342 }, isMobile: true, hasTouch: true }],
  ['android pequeno 360x640', { viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true }],
  ['android deitado 640x360', { viewport: { width: 640, height: 360 }, isMobile: true, hasTouch: true }],
  ['tablet 810x1080', { viewport: { width: 810, height: 1080 }, isMobile: true, hasTouch: true }],
];

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await pw.chromium.launch();
  const open = async (opt, reduced) => {
    const c = await browser.newContext(Object.assign({ deviceScaleFactor: 1, reducedMotion: reduced ? 'reduce' : 'no-preference' }, opt));
    const p = await c.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(base, { waitUntil: 'load' });
    await p.waitForFunction(() => window.DSGame && typeof UI !== 'undefined' && UI.screen === 'title', null, { timeout: 30000 });
    await p.waitForTimeout(2500);
    return { c, p, errs };
  };
  const diffShots = async (p) => {
    const a = await p.screenshot(); await p.waitForTimeout(700); const b = await p.screenshot();
    let d = 0; const n2 = Math.min(a.length, b.length); for (let i = 0; i < n2; i += 97) if (a[i] !== b[i]) d++;
    return d;
  };
  try {
    /* 1. animacao + demo atras do titulo */
    for (const reduced of [false, true]) {
      const { c, p, errs } = await open(VIEWS[0][1], reduced);
      const st = await p.evaluate(() => ({ mode: DSGame.mode, running: DSGame.running, wrap: document.getElementById('stage-wrap').className }));
      check((reduced ? '[reduzir animacoes] ' : '') + 'luta de demonstracao roda atras da tela inicial', st.mode === 'demo' && st.running && /demo/.test(st.wrap), JSON.stringify(st));
      const d = await diffShots(p);
      check((reduced ? '[reduzir animacoes] ' : '') + 'tela inicial anima (quadros diferentes em 0,7s)', d > 50, d + ' amostras mudaram');
      check((reduced ? '[reduzir animacoes] ' : '') + 'sem erro de JS na tela inicial', errs.length === 0, errs.slice(0, 2).join(' | '));
      await c.close();
    }
    /* 2. responsividade */
    for (const [name, opt] of VIEWS) {
      const { c, p, errs } = await open(opt, false);
      const t = await p.evaluate(() => {
        const r = document.getElementById('btn-start').getBoundingClientRect();
        const l = document.querySelector('#scr-title .logo').getBoundingClientRect();
        const s = document.querySelector('#scr-title');
        return { vw: innerWidth, vh: innerHeight, btn: [r.left, r.top, r.right, r.bottom], logo: [l.left, l.top, l.right, l.bottom], sw: document.documentElement.scrollWidth, scrollTop: s.scrollTop, scrollH: s.scrollHeight, clientH: s.clientHeight };
      });
      const inside = (b) => b[0] >= -1 && b[1] >= -1 && b[2] <= t.vw + 1 && b[3] <= t.vh + 1;
      check(name + ': botao START inteiro na tela sem rolar', inside(t.btn), 'btn=' + t.btn.map(Math.round).join(',') + ' tela=' + t.vw + 'x' + t.vh);
      check(name + ': logo inteiro na tela', inside(t.logo), 'logo=' + t.logo.map(Math.round).join(','));
      check(name + ': sem rolagem lateral', t.sw <= t.vw + 1, 'scrollWidth=' + t.sw);
      await p.evaluate(() => UI.pressStart());
      await p.waitForTimeout(900);
      const m = await p.evaluate(() => {
        const el = document.querySelector('#scr-menu .mm');
        const r = el.getBoundingClientRect();
        return { vw: innerWidth, vh: innerHeight, mm: [r.left, r.top, r.right, r.bottom], screen: UI.screen, sw: document.documentElement.scrollWidth };
      });
      check(name + ': menu abre e a 1a opcao aparece sem rolar', m.screen === 'menu' && m.mm[1] >= -1 && m.mm[3] <= m.vh + 1 && m.mm[2] <= m.vw + 1, 'opcao=' + m.mm.map(Math.round).join(','));
      check(name + ': menu sem rolagem lateral', m.sw <= m.vw + 1, 'scrollWidth=' + m.sw);
      check(name + ': sem erro de JS', errs.length === 0, errs.slice(0, 2).join(' | '));
      await c.close();
    }
  } catch (e) {
    check('suite rodou sem excecao', false, e.message.slice(0, 200));
  }
  await browser.close();
  server.close();
  console.log('---');
  console.log(fails === 0 ? 'TITULO/RESPONSIVO: TUDO OK (' + n + ' checks)' : 'TITULO/RESPONSIVO: ' + fails + ' FALHAS de ' + n);
  process.exit(fails ? 1 : 0);
})();
