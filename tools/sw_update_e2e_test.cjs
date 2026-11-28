// ATUALIZACAO SEM LIMPAR CACHE (navegador real, service worker de verdade):
// o jogador abre o jogo (vira app com service worker), sai uma versao nova
// (sw.js com outro BUILD_ID), o navegador instala o worker novo e a pagina
// RECARREGA SOZINHA quando o jogador esta no titulo/menu — nunca no meio da
// luta. Depois disso o cache de imagens do build velho foi apagado.
const http = require('http');
const fs = require('fs');
const path = require('path');
let pw;
try { pw = require('playwright'); } catch (e) { console.log('SKIP playwright ausente'); process.exit(0); }

const ROOT = path.resolve(__dirname, '..');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg' };
let build = 'aaaaaaaa'; /* o servidor troca o BUILD do sw.js pra simular deploy novo */
const server = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  let f = path.join(ROOT, u);
  if (u === '/' ) f = path.join(ROOT, 'index.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  if (f.includes(path.join('assets', 'music') + path.sep)) { r.writeHead(200, { 'Content-Type': 'audio/mpeg' }); return r.end(); }
  if (u === '/sw.js') {
    const sw = fs.readFileSync(f, 'utf8').replace(/const CACHE = '[^']*';/, `const CACHE = 'dsf-${build}';`);
    r.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-cache' });
    return r.end(sw);
  }
  r.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
});
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await pw.chromium.launch();
  try {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
    await p.goto(url);
    await p.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller === null, null, { timeout: 5000 }).catch(() => {});
    await p.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration()) && !!(await navigator.serviceWorker.ready), null, { timeout: 20000 });
    /* 2a visita: pagina controlada pelo worker do build aaaaaaaa */
    await p.reload();
    await p.waitForFunction(() => !!navigator.serviceWorker.controller && typeof UI !== 'undefined' && UI.screen === 'title', null, { timeout: 30000 });
    const caches0 = await p.evaluate(async () => (await caches.keys()).sort());
    check('primeira versao instalada (cache dsf-aaaaaaaa)', caches0.includes('dsf-aaaaaaaa'), caches0.join(','));
    await p.evaluate(() => { window.__marca = 'pagina-velha'; DSGame.applyPerf = () => {}; UI._nudgeShown = 99; UI.pressStart(); });
    await p.waitForFunction(() => UI.screen === 'menu', null, { timeout: 8000 });

    /* em LUTA: sai versao nova -> nao pode recarregar no meio da luta */
    await p.evaluate(() => DSGame.start({ mode: 'versus', teams: [['henrico'], ['kira']], stage: 'treino-dojo', cpu: [true, true], roundsToWin: 1, timer: 99 }));
    await p.evaluate(() => { UI.screen = 'fight'; });
    build = 'bbbbbbbb';
    await p.evaluate(async () => { const reg = await navigator.serviceWorker.getRegistration(); await reg.update(); });
    await sleep(3500);
    const duranteLuta = await p.evaluate(() => window.__marca);
    check('versao nova saiu durante a luta: a pagina NAO recarrega no meio', duranteLuta === 'pagina-velha', String(duranteLuta));

    /* volta pro menu: recarrega sozinha com a pagina nova */
    await p.evaluate(() => { if (DSGame.stop) DSGame.stop(); UI.toMenu(); });
    await p.waitForFunction(() => window.__marca === undefined, null, { timeout: 10000 }).catch(() => {});
    const depois = await p.evaluate(() => window.__marca);
    check('ao voltar pro menu a pagina recarrega sozinha (versao nova, sem limpar cache)', depois === undefined, String(depois));
    await p.waitForFunction(() => typeof UI !== 'undefined' && UI.screen === 'title', null, { timeout: 30000 });
    const caches1 = await p.evaluate(async () => (await caches.keys()).sort());
    check('cache do build velho apagado, so o do build novo', caches1.includes('dsf-bbbbbbbb') && !caches1.includes('dsf-aaaaaaaa'), caches1.join(','));
    const selo = await p.evaluate(() => document.getElementById('build').textContent);
    check('selo mostra o BUILD_ID (hash de 8 digitos)', /^build [0-9a-f]{8}$/.test(selo), selo);
    check('nenhum erro de pagina', errs.length === 0, errs.slice(0, 3).join(' | '));
    await ctx.close();
  } catch (e) {
    check('execucao sem excecao', false, e.message.split('\n')[0]);
  } finally {
    await b.close();
    server.close();
  }
  console.log(fails ? `ATUALIZACAO AUTOMATICA: ${fails} FALHAS (${n} checks)` : `ATUALIZACAO AUTOMATICA: TUDO OK (${n} checks)`);
  process.exit(fails ? 1 : 0);
})();
