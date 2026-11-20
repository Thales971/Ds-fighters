// HUD (barras de vida/ultimate): numa luta que comeca DEPOIS de outra (a demo da
// tela inicial ja conta), as barras tem que preencher e acompanhar o dano.
// Bug: HUD.reset recriava o HTML mas o update seguia escrevendo nas refs antigas
// (side._r), em elementos que nao estavam mais na tela -> barras vazias.
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
let pw; try { pw = require('playwright'); } catch (e) { console.log('HUD: PULADO — playwright nao instalado'); process.exit(0); }
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(ROOT, u === '/' ? 'index.html' : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const b = await pw.chromium.launch(); const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  try {
    await p.goto('http://localhost:' + server.address().port + '/', { waitUntil: 'load' });
    await p.waitForFunction(() => window.DSGame && typeof UI !== 'undefined' && UI.screen === 'title', null, { timeout: 30000 });
    const fight = async (n) => {
      await p.evaluate(() => { const g = DSGame; g.start({ mode: 'versus', teams: [['du'], ['jess']], stage: 'treino-dojo', cpu: [false, true], roundsToWin: 2, timer: 99 }); UI.show('fight'); HUD.show(); });
      await p.waitForFunction(() => DSGame.roundState === 'fight', null, { timeout: 20000 });
      await p.waitForTimeout(400);
      const full = await p.evaluate(() => [...document.querySelectorAll('#hud .side .life .fill')].map((e) => e.getBoundingClientRect().width / e.parentElement.getBoundingClientRect().width));
      await p.evaluate(() => { const f = DSGame.activeOf(1); f.hp = f.maxHp * 0.4; f.ultimate = 60; });
      await p.waitForTimeout(300);
      const after = await p.evaluate(() => {
        const side = document.querySelector('#hud .side[data-team="1"]');
        const fr = (s) => { const e = side.querySelector(s); return e.getBoundingClientRect().width / e.parentElement.getBoundingClientRect().width; };
        return { vida: fr('.life .fill'), ult: fr('.ult i') };
      });
      check('luta ' + n + ': barras de vida cheias no comeco', full.length === 2 && full.every((v) => v > 0.95), full.map((v) => v.toFixed(2)).join(','));
      check('luta ' + n + ': barra acompanha o dano (40%) e a ultimate (60%)', Math.abs(after.vida - 0.4) < 0.05 && Math.abs(after.ult - 0.6) < 0.08, JSON.stringify(after));
    };
    await fight(1); /* a demo da tela inicial ja rodou antes */
    await fight(2);
  } catch (e) { check('suite rodou sem excecao', false, e.message.slice(0, 160)); }
  await b.close(); server.close();
  console.log('---'); console.log(fails === 0 ? 'HUD: TUDO OK (' + n + ' checks)' : 'HUD: ' + fails + ' FALHAS de ' + n);
  process.exit(fails ? 1 : 0);
})();
