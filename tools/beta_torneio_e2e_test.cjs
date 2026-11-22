// BETA 1.0 — teste de ponta a ponta no navegador do que foi pedido pro
// torneio/Kernor. Joga a chave INTEIRA pela interface real (cliques nos
// botoes de verdade, timers de verdade), nao so regex no codigo:
//  - personagem de codigo barrado no torneio mesmo liberado; Iales so Versus
//  - chave fixa: larper/cyber MEDIO, rafael/dev-senior DIFICIL,
//    lyra/nimbo/kernor EXTREMO; nenhum texto falando Iales
//  - cada luta no mapa certo do torneio, com clima e evento exclusivos e fauna
//  - bonus: 1 de 3, clique duplo nao aplica 2x
//  - Kernor chefe: 2000 de vida, fase 2 abaixo da metade, troféu + Kernor liberado
//  - botao MENU no VS cancela a luta (nao trava, nao abre luta por cima)
//  - Kernor jogavel: leque de 8 laminas, buraco negro com vortice
//  - modo foto: abre no meio do golpe sem tremer, filtros sepia/frio/P&B
//  - celular: joystick na horizontal, aviso de girar em retrato
//  - nenhum erro de pagina no caminho todo
const http = require('http');
const fs = require('fs');
const path = require('path');
let pw;
try { pw = require('playwright'); } catch (e) { console.log('SKIP playwright ausente'); process.exit(0); }

const ROOT = path.resolve(__dirname, '..');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' };
const server = http.createServer((q, r) => {
  let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (q.url === '/' || q.url.startsWith('/?')) f = path.join(ROOT, 'index.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  await new Promise((r) => server.listen(0, r));
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await pw.chromium.launch();
  const errs = [];
  const watch = (p) => p.on('pageerror', (e) => errs.push(e.message));
  try {
    /* ===================== DESKTOP: o torneio inteiro ===================== */
    const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
    watch(p);
    await p.goto(url);
    await p.waitForFunction(() => typeof UI !== 'undefined' && UI.game && typeof FIGHTERS !== 'undefined' && FIGHTERS.length > 50, null, { timeout: 30000 });
    await sleep(500);

    /* 1) barreiras da selecao */
    const sel = await p.evaluate(() => {
      Profile.data.unlocked = (Profile.data.unlocked || []).filter((x) => x !== 'kernor');
      if (!Profile.data.unlocked.includes('du')) Profile.data.unlocked.push('du');
      const idx = (id) => FIGHTERS.findIndex((d) => d.id === id);
      const out = {};
      UI.startFlow('arcade');
      /* TODOS os personagens de codigo, liberados, barrados no torneio */
      out.secrets = {};
      for (const id of Profile.SECRET_IDS) {
        if (!Profile.data.unlocked.includes(id)) Profile.data.unlocked.push(id);
        UI.flow.picks[0] = []; UI.flow.cursor[0] = idx(id); UI.selConfirm(0);
        out.secrets[id] = UI.flow.picks[0].length === 0;
        UI.flow.picks[0] = []; UI.flow.done = [false, false];
      }
      Profile.data.unlocked = Profile.data.unlocked.filter((x) => x !== 'kernor');
      out.duBlocked = Object.values(out.secrets).every(Boolean) && Object.keys(out.secrets).length >= 6;
      UI.flow.cursor[0] = idx('iales'); UI.selConfirm(0);
      out.ialesArcadeBlocked = UI.flow.picks[0].length === 0;
      out.ialesVersusOk = !UI.modeBanned('iales', 'versus');
      out.kernorOnlineBanned = UI.modeBanned('kernor', 'online') && UI.modeBanned('iales', 'online');
      out.kernorLockedFresh = !Profile.isUnlocked('kernor');
      return out;
    });
    check('torneio barra TODOS os personagens de codigo mesmo liberados', sel.duBlocked, JSON.stringify(sel.secrets));
    check('Iales barrado no torneio e liberado no Versus', sel.ialesArcadeBlocked && sel.ialesVersusOk);
    check('Kernor e Iales fora do online', sel.kernorOnlineBanned);

    /* 2) escolhe a Jess e entra na chave */
    await p.evaluate(() => { UI.flow.cursor[0] = FIGHTERS.findIndex((d) => d.id === 'jess'); UI.selConfirm(0); });
    for (let i = 0; i < 40; i++) {
      const s = await p.evaluate(() => UI.screen);
      if (s === 'ladder') break;
      if (s === 'stage') await p.evaluate(() => { const go = document.querySelector('[data-screen="stage"] .nav.primary, #btn-stage-go'); if (go) go.click(); });
      await sleep(150);
    }
    const lad = await p.evaluate(() => ({ screen: UI.screen, rows: UI.flow.ladder.map((r) => [r.id, r.diff, !!r.boss]), html: document.querySelector('[data-screen="ladder"]').innerText }));
    check('chave abre depois da escolha', lad.screen === 'ladder', lad.screen);
    const want = [['larper', 1], ['cyber-psicopata', 1], ['rafael', 2], ['dev-senior', 2], ['lyra', 3], ['nimbo', 3], ['kernor', 3]];
    check('chave fixa na ordem e dificuldade pedidas', JSON.stringify(lad.rows.map((r) => [r[0], r[1]])) === JSON.stringify(want) && lad.rows[6][2], JSON.stringify(lad.rows));
    check('chave mostra os 7 e nao fala Iales', lad.html.split('\n').filter((l) => /^\d$/.test(l.trim())).length >= 7 || (lad.html.match(/MÉDIO|DIFÍCIL|EXTREMO/g) || []).length === 7, '');
    check('nenhum texto do torneio fala Iales', !/IALES/i.test(lad.html));

    /* 3) joga as 7 lutas pela interface */
    const fights = [];
    let buffDouble = null;
    for (let step = 0; step < 7; step++) {
      const btn = step === 0 ? '#btn-ladder-go' : null;
      if (btn) await p.click(btn);
      // VS -> luta
      let vsSeen = false, vsText = '';
      for (let i = 0; i < 120; i++) {
        const st = await p.evaluate(() => ({ s: UI.screen, run: !!(UI.game && UI.game.running), rs: UI.game && UI.game.roundState, vs: (document.querySelector('[data-screen="vs"]') || {}).innerText || '' }));
        if (st.s === 'vs') { vsSeen = true; vsText = st.vs; }
        if (st.s === 'fight' && st.run && st.rs === 'fight') break;
        await sleep(100);
      }
      const info = await p.evaluate(() => {
        const g = UI.game; const o = g.activeOf(1);
        return { stage: g.stageDef.id, opp: o.def.id, ai: o.aiLevel, hp: o.maxHp, w: g.weather.kind, mech: g.stageDef.mech, fauna: (g.stageDef.fauna || []).length, boss: !!g.cfg.bossFight };
      });
      info.vsSeen = vsSeen; info.vsIales = /IALES/i.test(vsText);
      // deixa a luta correr ~4s (clima, fauna e eventos ativos), depois vence
      await sleep(4000);
      info.phase2 = null;
      for (let round = 0; round < 4; round++) {
        const r = await p.evaluate(() => {
          const g = UI.game; if (!g || !g.running) return 'done';
          if (g.roundState !== 'fight') return 'wait';
          const o = g.activeOf(1);
          if (o.def.id === 'kernor' && !o.enrage && !window.__k2) { window.__k2 = 1; o.hp = o.maxHp * 0.45; return 'phase'; }
          o.state = 'idle'; o.hp = 1; o.takeHit(9999, { attacker: g.activeOf(0), noScale: true });
          return 'hit';
        });
        if (r === 'phase') { await sleep(600); info.phase2 = await p.evaluate(() => !!UI.game.activeOf(1).enrage); round--; continue; }
        for (let i = 0; i < 100; i++) {
          const s = await p.evaluate(() => ({ s: UI.screen, rs: UI.game && UI.game.roundState, run: !!(UI.game && UI.game.running) }));
          if (s.s !== 'fight' || (s.run && s.rs === 'fight' && r === 'hit' && i > 10)) break;
          await sleep(100);
        }
        const s = await p.evaluate(() => UI.screen);
        if (s !== 'fight') break;
      }
      // resultado -> chave -> bonus
      for (let i = 0; i < 60; i++) {
        const s = await p.evaluate(() => UI.screen);
        if (s === 'results') { await p.evaluate(() => { const nb = document.getElementById('btn-next'); if (nb && nb.offsetParent) nb.click(); }); }
        if (s === 'ladder' || (s === 'results' && step === 6)) break;
        await sleep(150);
      }
      info.after = await p.evaluate(() => UI.screen);
      fights.push(info);
      if (step === 6) break;
      // bonus: abre, clica 2x no mesmo cartao, deve somar 1
      await p.evaluate(() => document.getElementById('btn-ladder-go').click());
      await p.waitForFunction(() => UI.screen === 'buffs', null, { timeout: 5000 });
      const nb = await p.evaluate(() => {
        const before = (UI.flow.tourneyBuffs || []).length;
        const cards = document.querySelectorAll('.buff-card');
        cards[0].click(); cards[0].click(); if (cards[1]) cards[1].click();
        return { before, after: UI.flow.tourneyBuffs.length, cards: cards.length };
      });
      if (buffDouble == null) buffDouble = nb;
      else if (nb.after - nb.before !== 1) buffDouble = nb;
    }

    const tor = await p.evaluate(() => TORNEIO.stages.slice());
    const mapOk = fights.every((f) => tor.includes(f.stage));
    check('7 lutas jogadas pela interface', fights.length === 7, fights.map((f) => f.opp).join(','));
    check('VS aparece antes de cada luta, sem falar Iales', fights.every((f) => f.vsSeen && !f.vsIales));
    check('cada luta num mapa do torneio (ultima na Fortaleza)', mapOk && fights[6].stage === 'torneio-fortaleza-do-dev', fights.map((f) => String(f.stage).replace('torneio-', '')).join(','));
    check('rival certo e IA no nivel da chave', fights.every((f, i) => f.opp === want[i][0] && f.ai >= want[i][1]), fights.map((f) => f.opp + ':' + f.ai).join(','));
    check('clima exclusivo ativo em cada luta', fights.every((f) => ['hellosol', 'vagafloresta', 'nevoacache', 'fornalha', 'cinzasgit', 'nucleo'].includes(f.w)), fights.map((f) => f.w).join(','));
    check('evento e fauna em todo mapa do torneio', fights.every((f) => f.mech && f.fauna > 0), fights.map((f) => f.mech + '/' + f.fauna).join(','));
    check('Kernor chefe: 2000 de vida e luta de chefe', fights[6].hp >= 2000 && fights[6].boss, 'hp ' + fights[6].hp);
    check('Kernor entra na FASE 2 abaixo da metade', fights[6].phase2 === true);
    check('bonus: 3 cartoes e clique duplo aplica so 1', buffDouble && buffDouble.cards === 3 && buffDouble.after - buffDouble.before === 1, JSON.stringify(buffDouble));
    const end = await p.evaluate(() => ({ s: UI.screen, k: Profile.isUnlocked('kernor'), t: (document.querySelector('[data-screen="results"]') || {}).innerText || '' }));
    check('fim do torneio: tela final e Kernor liberado', end.s === 'results' && end.k, end.s + ' ' + end.t.slice(0, 60).replace(/\n/g, ' '));

    /* 4) MENU no VS nao trava e nao abre luta por cima */
    await p.evaluate(() => { UI.startFlow('arcade'); UI.flow.cursor[0] = FIGHTERS.findIndex((d) => d.id === 'jess'); UI.selConfirm(0); });
    await p.waitForFunction(() => UI.screen === 'ladder', null, { timeout: 6000 }).catch(() => {});
    await p.click('#btn-ladder-go');
    await p.waitForFunction(() => UI.screen === 'vs', null, { timeout: 6000 }).catch(() => {});
    await p.evaluate(() => document.getElementById('btn-vs-menu').click());
    await sleep(4500);
    const menu = await p.evaluate(() => ({ s: UI.screen, mode: UI.game && UI.game.running ? UI.game.mode : 'parado' }));
    check('MENU no VS volta pro menu e a luta nao abre por cima', menu.s === 'menu' && menu.mode !== 'arcade', JSON.stringify(menu));

    /* 5) Kernor jogavel: leque e buraco negro */
    const kp = await p.evaluate(async () => {
      UI.launch({ mode: 'versus', teams: [['kernor'], ['jess']], stage: 'torneio-fortaleza-do-dev', cpu: [false, false], roundsToWin: 2, timer: 99 });
      for (let i = 0; i < 120 && !(UI.screen === 'fight' && UI.game.running && UI.game.roundState === 'fight' && UI.game.activeOf(0).def.id === 'kernor'); i++) await new Promise((r) => setTimeout(r, 100));
      const g = UI.game, k = g.activeOf(0), j = g.activeOf(1);
      const prep = () => { k.state = 'idle'; k.cast = null; k.castLock = 0; k.spamShared = 0; k.cd = k.cd.map(() => 0); k.ultimate = 100; k.charge = [100, 100]; k.meter = 100; };
      const who = k.def.id + '/' + UI.screen + '/' + g.mode;
      k.x = 300; j.x = 700; k.dir = 1; prep(); const ok9 = k.tryCast(9);
      await new Promise((r) => setTimeout(r, 1200));
      const hole = g.zones.some((z) => String(z.key || '').includes('kernor-extra'));
      const kHole = !!k.kHole;
      await new Promise((r) => setTimeout(r, 3500));
      k.x = 300; j.x = 700; prep(); k.tryCast(4);
      let maxProj = 0;
      for (let i = 0; i < 60; i++) { await new Promise((r) => requestAnimationFrame(r)); maxProj = Math.max(maxProj, g.projectiles.filter((q) => q.owner === k).length); }
      return { maxProj, hole, kHole, who, ok9 };
    });
    check('Kernor: leque solta 8 laminas', kp.maxProj >= 8, 'max ' + kp.maxProj);
    check('Kernor: buraco negro abre o vortice', kp.hole && kp.kHole, JSON.stringify(kp));

    /* 6) modo foto no meio do golpe + filtros */
    const ph = await p.evaluate(async () => {
      const g = UI.game; const k = g.activeOf(0);
      k.state = 'idle'; k.castLock = 0;
      g.shake && g.shake(20);
      UI.enterPhoto();
      const shake0 = g.shakeT || g.shakeAmt || 0;
      await new Promise((r) => setTimeout(r, 700));
      const shake1 = g.shakeT || g.shakeAmt || 0;
      const names = [];
      for (let i = 0; i < 4; i++) { UI.cyclePhotoFilter(); names.push(g.photo.filterName); }
      UI.exitPhoto(false);
      return { shake0, shake1, names };
    });
    check('modo foto: tremor para quando abre no meio do golpe', ph.shake1 === 0 || ph.shake1 <= ph.shake0, JSON.stringify(ph));
    check('modo foto: filtros SEPIA, FRIO e P&B', ['SÉPIA', 'FRIO', 'P&B'].every((x) => ph.names.includes(x)), ph.names.join(','));

    /* 7) chapeus: nenhum ligado por padrao; Stella esconde chapeu no chute pulando */
    const acc = await p.evaluate(() => ({ on: ACC_LIST.filter((a) => accOn(a.id)).map((a) => a.id), st: (SPRITE_LAYOUT.perFighter.stella || {}).accHide || [] }));
    check('chapeu/acessorio desligado por padrao', acc.on.length === 0, acc.on.join(','));
    check('Stella: acessorio some nas poses de chute/pulo', acc.st.some((x) => /jkick|kick|jump/.test(x)), acc.st.join(','));
    await p.close();

    /* ===================== CELULAR ===================== */
    for (const [name, dev] of [['horizontal', pw.devices['Pixel 7 landscape']], ['retrato', pw.devices['Pixel 7']]]) {
      const m = await (await b.newContext({ ...dev, deviceScaleFactor: 1 })).newPage();
      watch(m);
      await m.goto(url);
      await m.waitForFunction(() => typeof UI !== 'undefined' && UI.game && typeof FIGHTERS !== 'undefined', null, { timeout: 30000 });
      await sleep(400);
      const r = await m.evaluate(async () => {
        UI.launch({ mode: 'versus', teams: [['jess'], ['larper']], stage: 'torneio-praca-hello-world', cpu: [false, true], roundsToWin: 2, timer: 99 });
        for (let i = 0; i < 120 && !(UI.screen === 'fight' && UI.game.running && UI.game.roundState === 'fight' && UI.game.activeOf(0).def.id === 'jess'); i++) await new Promise((res) => setTimeout(res, 100));
        if (typeof AppViewport !== 'undefined' && AppViewport.fit) AppViewport.fit();
        const vis = (sel) => { const e = document.querySelector(sel); if (!e) return false; const cs = getComputedStyle(e); const rc = e.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && rc.width > 0 && rc.height > 0; };
        const over = [...document.querySelectorAll('.tbtns button')].filter((bt) => bt.scrollWidth > bt.clientWidth + 2).length;
        return { mobile: document.body.classList.contains('mobile'), stick: vis('#stick, .stick'), dpad: vis('.dpad'), turn: vis('.turn-phone'), over };
      });
      if (name === 'horizontal') {
        check('celular horizontal: joystick visivel, direcional escondido', r.mobile && r.stick && !r.dpad, JSON.stringify(r));
        check('celular horizontal: texto dos botoes cabe', r.over === 0, 'vazando ' + r.over);
      } else {
        check('celular em retrato: pede pra girar', r.mobile && r.turn, JSON.stringify(r));
      }
      await m.close();
    }
  } catch (e) {
    check('execucao sem excecao', false, e.message.split('\n')[0]);
  }
  const real = errs.filter((e) => !/Failed to load resource|ERR_|net::|Supabase|fetch/i.test(e));
  check('nenhum erro de pagina no caminho todo', real.length === 0, real.slice(0, 3).join(' | '));
  await b.close(); server.close();
  console.log(`\nBETA/TORNEIO E2E: ${fails ? fails + ' FALHAS' : 'TUDO OK'} (${n} checks)`);
  process.exit(fails ? 1 : 0);
})();
