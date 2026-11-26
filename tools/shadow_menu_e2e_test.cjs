// VOCÊ MESMO (menu): revanche contra a propria sombra, no navegador real.
//  - botao escondido ate vencer a si mesmo no torneio (conquista eu-mesmo)
//  - com a conquista: aparece, abre a selecao solo, qualquer lutador liberado
//  - luta sombria direto (sem chave): 10 min, 3 vidas, memoria 1000, musica sombria
//  - vitoria e derrota com tela propria; REVANCHE repete; TROCAR LUTADOR volta pra selecao
//  - a luta sombria nao entra na estatistica anonima de balanceamento
//  - nenhum erro de pagina
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
  /* trilhas (assets/music): resposta vazia, o teste nao precisa ouvir e os mp3 sao pesados; os efeitos vao inteiros (sao decodificados) */
  if (f.includes(path.join('assets', 'music') + path.sep)) { r.writeHead(200, { 'Content-Type': 'audio/mpeg' }); return r.end(); }
  r.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  await new Promise((r) => server.listen(0, r));
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await pw.chromium.launch();
  const errs = [];
  try {
    const p = await b.newPage({ viewport: { width: 960, height: 540 } });
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(url);
    await p.waitForFunction(() => typeof UI !== 'undefined' && UI.screen === 'title', null, { timeout: 30000 });
    /* o convite de login (Lyra) aparece sozinho depois de algumas lutas e cobre os botoes do resultado: fora deste teste */
    await p.evaluate(() => { DSGame.applyPerf = () => {}; UI._nudgeShown = 99; UI.pressStart(); });
    await p.waitForFunction(() => UI.screen === 'menu', null, { timeout: 8000 });

    const before = await p.evaluate(() => ({ hidden: document.getElementById('btn-shadow-mode').hidden, has: Profile.hasAchievement('eu-mesmo') }));
    check('sem a conquista: botao VOCE MESMO escondido', before.hidden && !before.has, JSON.stringify(before));
    const blocked = await p.evaluate(() => { UI.menuGo('shadow'); return UI.screen; });
    check('sem a conquista: menuGo("shadow") nao abre a luta', blocked === 'menu', blocked);

    await p.evaluate(() => { Profile.grantAchievement('eu-mesmo'); UI.toMenu(); });
    const after = await p.evaluate(() => { const bt = document.getElementById('btn-shadow-mode'); return { hidden: bt.hidden, text: bt.innerText, visible: !!bt.offsetParent }; });
    check('com a conquista: botao VOCE MESMO aparece no menu', !after.hidden && after.visible && /VOCÊ MESMO/.test(after.text), JSON.stringify(after));

    await p.click('#btn-shadow-mode');
    await p.waitForFunction(() => UI.screen === 'select', null, { timeout: 5000 });
    const sel = await p.evaluate(() => ({ mode: UI.flow.mode, title: document.getElementById('sel-title').textContent, card: document.getElementById('card-1').innerText }));
    check('abre a selecao no modo shadow', sel.mode === 'shadow' && /ENFRENTAR/.test(sel.title), JSON.stringify(sel));
    check('card do rival explica a luta', /VOCÊ MESMO/.test(sel.card) && /fragmentos/i.test(sel.card), sel.card.slice(0, 80));

    /* escolhe um lutador de codigo liberado: no torneio e barrado, aqui pode */
    const pick = await p.evaluate(() => {
      const id = 'du';
      if (!Profile.isUnlocked(id)) { Profile.data.unlocked.push(id); Profile.save(); }
      UI.flow.cursor[0] = FIGHTERS.findIndex((d) => d.id === id);
      UI.selConfirm(0);
      return { id, picks: UI.flow.picks[0].slice() };
    });
    await p.waitForFunction(() => UI.screen === 'vs' || UI.screen === 'fight', null, { timeout: 6000 });
    const vs = await p.evaluate(() => document.getElementById('vs-1') && document.getElementById('vs-1').innerText);
    check('VS mostra VOCE MESMO', /VOCÊ MESMO/.test(vs || ''), vs);
    await p.waitForFunction(() => DSGame.running && DSGame.shadow && DSGame.roundState === 'fight', null, { timeout: 15000 });
    const fight = await p.evaluate(() => { const g = DSGame, me = g.activeOf(0), sh = g.activeOf(1); return { mode: g.mode, id: me.def.id, shId: sh.def.id, shadow: !!sh.shadowSelf, mem: sh.maxHp, hp: me.maxHp, lives: me.shadowLives, timer: g.cfg.timer, music: g.cfg.music, flowMode: UI.flow.mode, hud: !document.getElementById('shadow-hud').hidden }; });
    check('luta sombria direto, sem chave do torneio', fight.mode === 'shadow' && fight.shadow && fight.flowMode === 'shadow', JSON.stringify(fight));
    check('lutador de codigo liberado pode ser usado', fight.id === pick.id && fight.shId === pick.id, fight.id + ' x ' + fight.shId);
    check('mesmas regras: 10 min, 3 vidas de 500, memoria 1000, musica sombria, HUD', fight.timer === 600 && fight.lives === 3 && fight.hp === 500 && fight.mem === 1000 && fight.music === 'shadow' && fight.hud, JSON.stringify(fight));

    /* vitoria: zera a memoria com um fragmento */
    await p.evaluate(() => { const g = DSGame, S = g.shadow, me = g.activeOf(0); S.mem = 10; g.activeOf(1).hp = 10; S.frags = [{ x: me.x, y: -100, vy: 1, rot: 0, vr: 0, ph: 0, shape: 1, age: 9 }]; });
    await p.waitForFunction(() => UI.screen === 'results', null, { timeout: 15000 });
    await sleep(300);
    const win = await p.evaluate(() => ({ title: document.getElementById('res-title').textContent, rank: [...document.querySelectorAll('.tourney-rank')].map((e) => e.innerText).join(' | '), again: document.getElementById('btn-again').textContent, next: document.getElementById('btn-next').hidden, best: Profile.setting('shadowBest'), score: document.querySelector('.score').innerText }));
    check('vitoria: tela propria', win.title === 'VOCÊ VENCEU A SI MESMO!' && /desfez de novo/.test(win.rank), JSON.stringify(win));
    check('vitoria: sem "Luta x/7" e sem proxima luta', win.next && !/Luta \d/.test(win.score), win.score);
    check('vitoria: guarda o melhor tempo', Number(win.best) > 0, win.best);

    /* REVANCHE repete a mesma luta sombria */
    await p.click('#btn-again');
    await p.waitForFunction(() => DSGame.running && DSGame.shadow && DSGame.roundState === 'fight', null, { timeout: 15000 });
    const re = await p.evaluate(() => ({ mode: DSGame.mode, shadow: !!DSGame.activeOf(1).shadowSelf, mem: DSGame.shadow.mem, lives: DSGame.activeOf(0).shadowLives }));
    check('REVANCHE recomeca a luta sombria do zero', re.mode === 'shadow' && re.shadow && re.mem === 1000 && re.lives === 3, JSON.stringify(re));

    /* derrota: perde as 3 vidas */
    await p.evaluate(() => {
      const g = DSGame, me = g.activeOf(0), sh = g.activeOf(1);
      for (let k = 0; k < 3; k++) { me.status = {}; me.hp = 1; me.takeHit(80, { attacker: sh, kx: 1, dirSign: 1, stun: 5, noScale: true }); }
    });
    await p.waitForFunction(() => UI.screen === 'results', null, { timeout: 15000 });
    await sleep(300);
    const lose = await p.evaluate(() => ({ title: document.getElementById('res-title').textContent, rank: [...document.querySelectorAll('.tourney-rank')].map((e) => e.innerText).join(' | ') }));
    check('derrota: tela propria com memoria restante', lose.title === 'A SOMBRA VENCEU' && /memória restante/.test(lose.rank), JSON.stringify(lose));

    /* TROCAR LUTADOR volta pra selecao do modo shadow */
    await p.click('#btn-res-select');
    await p.waitForFunction(() => UI.screen === 'select', null, { timeout: 6000 });
    check('TROCAR LUTADOR volta pra selecao do VOCE MESMO', await p.evaluate(() => UI.flow.mode === 'shadow'));

    /* estatistica anonima ignora a luta sombria */
    const st = await p.evaluate(() => {
      let sent = 0;
      const of = window.fetch;
      window.fetch = (...a) => { if (String(a[0]).includes('match')) sent++; return Promise.resolve({ ok: true, json: () => ({}) }); };
      try {
        MatchStats.record({ mode: 'shadow', cfg: { shadowFight: true }, teams: DSGame.teams }, { winner: 0, seconds: 10 });
        MatchStats.record({ mode: 'arcade', cfg: { shadowFight: true }, teams: DSGame.teams }, { winner: 0, seconds: 10 });
      } finally { window.fetch = of; }
      return sent;
    });
    check('luta sombria fora da estatistica de balanceamento', st === 0, st + ' envios');

    /* VOLTAR das conquistas (era data-go="menu", que so funciona dentro do menu) */
    await p.evaluate(() => { UI.toMenu(); UI.menuGo('conquistas'); });
    await sleep(300);
    await p.click('#scr-conquistas [data-back]');
    await sleep(300);
    check('botao VOLTAR das conquistas volta pro menu', await p.evaluate(() => UI.screen === 'menu'));
    const dead = await p.evaluate(() => [...document.querySelectorAll('.screen:not(#scr-menu) [data-go]')].map((e) => e.closest('.screen').id));
    check('nenhum botao data-go fora do menu (eles nao respondem la)', dead.length === 0, dead.join(','));

    await p.evaluate(() => UI.toMenu());
    check('nenhum erro de pagina', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) {
    check('execucao sem excecao', false, e.message.split('\n').slice(0, 12).join(' | '));
  } finally {
    await b.close();
    server.close();
  }
  console.log(fails ? `VOCE MESMO (MENU): ${fails} FALHAS (${n} checks)` : `VOCE MESMO (MENU): TUDO OK (${n} checks)`);
  process.exit(fails ? 1 : 0);
})();
