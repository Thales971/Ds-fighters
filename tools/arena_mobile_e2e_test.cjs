// ARENA CHEIA NO CELULAR (navegador real): numa luta com o celular deitado a
// arena usa a altura toda da tela (antes ficava com ~1/3 da tela, 430x242 num
// 844x390, espremida entre colunas reservadas pros controles). Controles por
// cima das bordas; PAUSA/TELA CHEIA nao encostam no direcional; icones de
// poder de baixo somem (os botoes de poder ja mostram a recarga).
const http = require('http');
const fs = require('fs');
const path = require('path');
let pw;
try { pw = require('playwright'); } catch (e) { console.log('SKIP playwright ausente'); process.exit(0); }

const ROOT = path.resolve(__dirname, '..');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg' };
const server = http.createServer((q, r) => {
  let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (q.url === '/' || q.url.startsWith('/?')) f = path.join(ROOT, 'index.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  if (f.includes(path.join('assets', 'music') + path.sep)) { r.writeHead(200, { 'Content-Type': 'audio/mpeg' }); return r.end(); }
  r.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
});

(async () => {
  await new Promise((r) => server.listen(0, r));
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await pw.chromium.launch();
  try {
    for (const [w, h] of [[844, 390], [915, 412], [740, 360], [667, 375]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
      const p = await ctx.newPage();
      const errs = [];
      p.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
      await p.goto(url);
      await p.waitForFunction(() => typeof UI !== 'undefined' && UI.screen === 'title', null, { timeout: 30000 });
      await p.evaluate(() => { DSGame.applyPerf = () => {}; UI._nudgeShown = 99; UI.pressStart(); });
      await p.waitForFunction(() => UI.screen === 'menu', null, { timeout: 8000 });
      await p.evaluate(() => {
        UI._selFilter = 'all'; UI._selQuery = '';
        UI.menuGo('versus');
        const ok = FIGHTERS.findIndex((d) => Profile.isUnlocked(d.id) && !UI.modeBanned(d.id, 'versus') && !(Profile.isLoginLocked && Profile.isLoginLocked(d.id)));
        UI.flow.cursor[0] = ok; UI.selConfirm(0); UI.flow.cursor[1] = ok; UI.selConfirm(1);
      });
      await p.waitForFunction(() => UI.screen === 'stage', null, { timeout: 6000 });
      await p.evaluate(() => document.getElementById('btn-fight').click());
      await p.waitForFunction(() => DSGame.running && DSGame.roundState === 'fight', null, { timeout: 20000 });
      await p.waitForTimeout(400);
      const r = await p.evaluate(() => {
        const box = (sel) => { const e = document.querySelector(sel); if (!e || !e.offsetParent) return null; const q = e.getBoundingClientRect(); return { x: q.x, y: q.y, w: q.width, h: q.height }; };
        const c = document.getElementById('game').getBoundingClientRect();
        return {
          vw: innerWidth, vh: innerHeight, cw: c.width, ch: c.height, cx: c.x, cy: c.y,
          full: document.body.classList.contains('arena-full'),
          hudBottom: !!box('.hud-bottom'),
          tool: box('.touch-toolbar'), dpad: box('#touch-controls .dpad'),
        };
      });
      const pct = Math.round((r.cw * r.ch) / (r.vw * r.vh) * 100);
      const tag = w + 'x' + h + ': ';
      check(tag + 'arena ocupa >= 75% da tela (era ~22-37%)', pct >= 75, pct + '% (' + Math.round(r.cw) + 'x' + Math.round(r.ch) + ')');
      check(tag + 'arena usa a altura toda e fica centralizada', Math.abs(r.ch - r.vh) <= 2 && Math.abs((r.cx + r.cw / 2) - r.vw / 2) <= 2, Math.round(r.ch) + '/' + r.vh);
      check(tag + 'modo arena-full ligado e icones de poder de baixo escondidos', r.full && !r.hudBottom);
      const sep = r.tool && r.dpad ? r.dpad.y - (r.tool.y + r.tool.h) : -999;
      check(tag + 'PAUSA/TELA CHEIA nao encostam no direcional', sep >= 0, 'folga ' + Math.round(sep) + 'px');
      check(tag + 'sem erro de pagina', errs.length === 0, errs.slice(0, 2).join(' | '));
      await ctx.close();
    }
    /* celular em pe e PC nao mudam */
    const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
    const p = await ctx.newPage();
    await p.goto(url);
    await p.waitForFunction(() => typeof UI !== 'undefined' && UI.screen === 'title', null, { timeout: 30000 });
    check('PC nao entra no modo arena-full', !(await p.evaluate(() => document.body.classList.contains('arena-full'))));
    await ctx.close();
  } catch (e) {
    check('execucao sem excecao', false, e.message.split('\n')[0]);
  } finally {
    await b.close();
    server.close();
  }
  console.log(fails ? `ARENA CELULAR: ${fails} FALHAS (${n} checks)` : `ARENA CELULAR: TUDO OK (${n} checks)`);
  process.exit(fails ? 1 : 0);
})();
