// APP INSTALAVEL (fase 6, PWA): manifesto + icones + service worker seguro.
// - instala no Android/iPhone/Windows pelo navegador ("Instalar app"/"Adicionar a tela")
// - abre SEM INTERNET depois da 1a visita
// - codigo (html/js/css) SEMPRE da rede quando online: nunca prende versao velha
//   (o index antigo tinha um "mata-service-worker" justamente por isso)
// - imagens do cache (atualiza em segundo plano); musica e API nunca entram no cache
// - botao INSTALAR aparece quando o navegador oferece instalacao
const http = require('http'); const fs = require('fs'); const path = require('path');
const { PNG } = require('pngjs');
const ROOT = path.resolve(__dirname, '..');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

/* ===== 1. manifesto e icones ===== */
let man = null;
try { man = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8')); } catch (e) { /* sem manifesto */ }
check('manifest.webmanifest existe e e JSON valido', !!man);
if (man) {
  check('manifesto: nome, inicio, tela cheia/standalone, cores', !!man.name && !!man.short_name && !!man.start_url && /fullscreen|standalone/.test(man.display) && !!man.background_color && !!man.theme_color, JSON.stringify({ n: man.name, d: man.display }));
  const sizes = {};
  for (const ic of man.icons || []) {
    const f = path.join(ROOT, ic.src);
    if (!fs.existsSync(f)) { sizes[ic.src] = 'falta'; continue; }
    const png = PNG.sync.read(fs.readFileSync(f));
    sizes[ic.src] = png.width + 'x' + png.height + (ic.purpose ? ' ' + ic.purpose : '');
    check('icone ' + ic.src + ' do tamanho declarado (' + ic.sizes + ')', ic.sizes === png.width + 'x' + png.height && png.width === png.height);
  }
  check('icones 192, 512 e 512 maskable', (man.icons || []).some((i) => i.sizes === '192x192') && (man.icons || []).some((i) => i.sizes === '512x512' && !i.purpose) && (man.icons || []).some((i) => i.sizes === '512x512' && /maskable/.test(i.purpose || '')), JSON.stringify(sizes));
}
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
check('index.html liga o manifesto e o icone do iPhone', /<link rel="manifest" href="manifest\.webmanifest"/.test(html) && /rel="apple-touch-icon"/.test(html));
check('index.html nao desinstala mais o service worker a cada visita', !/registration\.unregister\(\)/.test(html) && !/caches\.delete\(/.test(html));

let pw;
try { pw = require('playwright'); } catch (e) { pw = null; }
if (!pw) {
  console.log('(navegador indisponivel: pulando a parte do service worker)');
  finish();
} else {
  /* servidor estatico + 2 rotas de prova que mudam a cada pedido */
  let probe = 0;
  const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    if (u === '/js/__prova.js') { probe++; res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'max-age=600' }); /* igual ao GitHub Pages: 10 min de cache */ return res.end('window.__prova=' + probe + ';'); }
    if (u === '/api/__prova') { probe++; res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ n: probe })); }
    const f = path.join(ROOT, u === '/' ? 'index.html' : u);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  (async () => {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const base = 'http://localhost:' + server.address().port + '/';
    const browser = await pw.chromium.launch();
    const c = await browser.newContext({ viewport: { width: 960, height: 540 } });
    const p = await c.newPage();
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    try {
      await p.goto(base, { waitUntil: 'load' });
      await p.waitForFunction(() => window.DSGame && typeof UI !== 'undefined' && UI.screen === 'title', null, { timeout: 30000 });
      const reg = await p.evaluate(async () => { if (!('serviceWorker' in navigator)) return 'sem suporte'; const r = await Promise.race([navigator.serviceWorker.ready.then(() => 'pronto'), new Promise((ok) => setTimeout(() => ok('timeout'), 15000))]); return r; });
      check('service worker registra e fica pronto', reg === 'pronto', reg);
      await p.reload({ waitUntil: 'load' });
      await p.waitForFunction(() => typeof UI !== 'undefined' && UI.screen === 'title', null, { timeout: 30000 });
      check('service worker controla a pagina', await p.evaluate(() => !!navigator.serviceWorker.controller));
      await p.waitForTimeout(2500);
      /* codigo: sempre da rede quando online */
      const a1 = await p.evaluate(async () => (await (await fetch('js/__prova.js')).text()));
      const a2 = await p.evaluate(async () => (await (await fetch('js/__prova.js')).text()));
      check('codigo (js) vem sempre da rede quando online, mesmo com o servidor mandando cache de 10 min (GitHub Pages)', a1 !== a2, a1 + ' -> ' + a2);
      /* API e musica nunca no cache */
      await p.evaluate(async () => { await fetch('api/__prova'); try { await fetch('assets/music/playlist.json'); } catch (e) {} });
      const keys = await p.evaluate(async () => { const out = []; for (const k of await caches.keys()) { const c2 = await caches.open(k); for (const r of await c2.keys()) out.push(new URL(r.url).pathname); } return out; });
      check('cache guardou codigo e imagens da 1a visita', keys.some((k) => /\/js\/main\.js$/.test(k)) && keys.some((k) => /\.png$/.test(k)) && keys.some((k) => k === '/' || /index\.html$/.test(k)), keys.length + ' itens');
      check('API nunca entra no cache', !keys.some((k) => k.startsWith('/api/')), keys.filter((k) => k.startsWith('/api/')).join(','));
      check('musica (mp3) nunca entra no cache do service worker', !keys.some((k) => /\.mp3$/.test(k)));
      /* sem internet */
      await c.setOffline(true);
      await p.reload({ waitUntil: 'load' });
      const off = await p.waitForFunction(() => typeof UI !== 'undefined' && UI.screen === 'title' && !!window.DSGame, null, { timeout: 30000 }).then(() => true).catch(() => false);
      check('abre SEM INTERNET depois da 1a visita (tela inicial + jogo)', off);
      await c.setOffline(false);
      /* botao instalar */
      const inst = await p.evaluate(async () => {
        const btn = document.getElementById('btn-install');
        if (!btn) return { btn: false };
        const before = !btn.hidden;
        let prompted = false;
        const ev = new Event('beforeinstallprompt'); ev.prompt = () => { prompted = true; return Promise.resolve(); }; ev.userChoice = Promise.resolve({ outcome: 'accepted' });
        window.dispatchEvent(ev);
        const shown = !btn.hidden;
        btn.click(); await new Promise((r) => setTimeout(r, 50));
        return { btn: true, before, shown, prompted };
      });
      check('botao INSTALAR escondido ate o navegador oferecer, aparece e chama o prompt', inst.btn && !inst.before && inst.shown && inst.prompted, JSON.stringify(inst));
      check('sem erro de JS', errs.length === 0, errs.slice(0, 2).join(' | '));
    } catch (e) {
      check('suite rodou sem excecao', false, e.message.slice(0, 200));
    }
    await browser.close();
    server.close();
    finish();
  })();
}
function finish() {
  console.log('---');
  console.log(fails === 0 ? 'PWA: TUDO OK (' + n + ' checks)' : 'PWA: ' + fails + ' FALHAS de ' + n);
  process.exit(fails ? 1 : 0);
}
