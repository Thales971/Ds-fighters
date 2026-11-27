// CAÇA-BUG DE MENUS (navegador real, PC e celular): abre cada item do menu
// principal e clica em todos os botoes visiveis da tela; numa luta, abre a
// PAUSA e usa os botoes dela; termina a luta e usa os botoes do RESULTADO.
// Nenhum erro de pagina pode aparecer. (Pegou: filtro de favoritos vazio +
// escolher lutador quebrava o card da CPU.)
// Pula botoes que mexem em conta/dados/rede (apagar, login, online...).
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
const SKIP = /apagar|resetar|excluir|sair da conta|deletar|online|criar sala|entrar|conectar|login|google|baixar|exportar|compartilhar|instalar/i;

(async () => {
  await new Promise((r) => server.listen(0, r));
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await pw.chromium.launch();
  try {
    for (const vp of [{ name: 'PC', o: { viewport: { width: 1280, height: 720 } } }, { name: 'CELULAR', o: { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true } }]) {
      const ctx = await b.newContext(vp.o);
      const p = await ctx.newPage();
      const errs = [];
      p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
      await p.goto(url);
      await p.waitForFunction(() => typeof UI !== 'undefined' && UI.screen === 'title', null, { timeout: 30000 });
      await p.evaluate(() => { DSGame.applyPerf = () => {}; UI._nudgeShown = 99; UI.pressStart(); });
      await p.waitForFunction(() => UI.screen === 'menu', null, { timeout: 8000 });
      const gos = await p.evaluate(() => [...document.querySelectorAll('#scr-menu [data-go]')].map((e) => e.dataset.go));
      let clicks = 0;
      for (const go of gos) {
        await p.evaluate(() => { if (DSGame.running && DSGame.stop) DSGame.stop(); UI.toMenu(); });
        await p.evaluate((g) => UI.menuGo(g), go).catch((e) => errs.push('menuGo ' + go + ': ' + e.message.slice(0, 100)));
        await p.waitForTimeout(250);
        clicks += await p.evaluate((skip) => {
          const s = document.getElementById('scr-' + UI.screen);
          if (!s) return 0;
          const re = new RegExp(skip, 'i');
          const bts = [...s.querySelectorAll('button')].filter((x) => x.offsetParent && !re.test(x.innerText));
          let k = 0;
          for (const bt of bts.slice(0, 25)) { try { bt.click(); k++; } catch (e) { /* conta no pageerror */ } }
          return k;
        }, SKIP.source).catch(() => 0);
        await p.waitForTimeout(150);
      }
      check(vp.name + ': todos os ' + gos.length + ' itens do menu abrem e os botoes respondem sem erro (' + clicks + ' cliques)', errs.length === 0, errs.slice(0, 3).join(' | '));

      /* PAUSA e RESULTADO numa luta de verdade */
      const before = errs.length;
      await p.evaluate(() => { if (DSGame.running && DSGame.stop) DSGame.stop(); UI.toMenu(); });
      await p.evaluate(() => {
        UI._selFilter = 'all'; UI._selQuery = '';
        UI.menuGo('versus');
        const ok = FIGHTERS.findIndex((d) => Profile.isUnlocked(d.id) && !UI.modeBanned(d.id, 'versus') && !(Profile.isLoginLocked && Profile.isLoginLocked(d.id)));
        UI.flow.cursor[0] = ok; UI.selConfirm(0);
        UI.flow.cursor[1] = ok + 1 < FIGHTERS.length && Profile.isUnlocked(FIGHTERS[ok + 1].id) ? ok + 1 : ok;
      });
      await p.waitForTimeout(300);
      await p.evaluate(() => { if (UI.screen === 'select') UI.selConfirm(1); });
      await p.waitForFunction(() => UI.screen === 'stage', null, { timeout: 5000 }).catch(() => {});
      await p.evaluate(() => { const bt = document.getElementById('btn-fight'); if (bt) bt.click(); });
      await p.waitForFunction(() => DSGame.running && DSGame.roundState === 'fight', null, { timeout: 20000 }).catch(() => errs.push('luta nao comecou'));
      for (const id of ['btn-pause-moves', 'btn-pause-opts', 'btn-resume']) {
        await p.evaluate(() => UI.pause());
        await p.waitForTimeout(200);
        await p.evaluate((id) => { const bt = document.getElementById(id); if (bt && bt.offsetParent) bt.click(); }, id);
        await p.waitForTimeout(200);
        await p.evaluate(() => { if (UI.screen !== 'fight' && UI.screen !== 'pause') { if (UI.back) UI.back(); } });
      }
      await p.evaluate(() => { if (UI.screen === 'pause') document.getElementById('btn-resume').click(); });
      await p.evaluate(() => { const g = DSGame; for (let r = 0; r < 3; r++) { const f = g.activeOf(1); if (f) { f.hp = 1; f.takeHit(50, { attacker: g.activeOf(0), kx: 1, dirSign: 1, stun: 5, noScale: true }); } } });
      await p.waitForFunction(() => UI.screen === 'results' || UI.screen === 'vs', null, { timeout: 30000 }).catch(() => {});
      for (let k = 0; k < 4 && (await p.evaluate(() => UI.screen)) !== 'results'; k++) {
        await p.evaluate(() => { const g = DSGame; if (!g.running) return; const f = g.activeOf(1); if (f) { f.hp = 1; f.takeHit(50, { attacker: g.activeOf(0), kx: 1, dirSign: 1, stun: 5, noScale: true }); } });
        await p.waitForTimeout(2500);
      }
      const res = await p.evaluate(() => UI.screen);
      for (const id of ['btn-again', 'btn-res-select', 'btn-res-menu']) {
        await p.evaluate((id) => { const bt = document.getElementById(id); if (bt && bt.offsetParent) bt.click(); }, id);
        await p.waitForTimeout(600);
        await p.evaluate(() => { if (DSGame.running && DSGame.stop) DSGame.stop(); });
      }
      check(vp.name + ': pausa (golpes, opcoes, continuar) e resultado (' + res + ') sem erro', errs.length === before, errs.slice(before, before + 3).join(' | '));
      await ctx.close();
    }
  } catch (e) {
    check('execucao sem excecao', false, e.message.split('\n')[0]);
  } finally {
    await b.close();
    server.close();
  }
  console.log(fails ? `MENUS (CLIQUES): ${fails} FALHAS (${n} checks)` : `MENUS (CLIQUES): TUDO OK (${n} checks)`);
  process.exit(fails ? 1 : 0);
})();
