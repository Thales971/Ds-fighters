// CONTROLES DE TOQUE v2 (celular deitado), com toques de verdade (CDP):
//  - layout arcade: SOCO/CHUTE grandes, poderes em arco, ULT maior; TROCA so no 2x2
//  - recarga visivel nos poderes (--cd) e brilho quando pronto
//  - segurar SOCO repete o golpe (combo facil); desligavel nas opcoes
//  - joystick flutuante no lado esquerdo; andar puxando um pouco pra cima nao pula
//  - soltar o dedo solta tudo; nenhum botao sobreposto; nenhum erro de pagina
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  await new Promise((r) => server.listen(0, r));
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await pw.chromium.launch();
  const errs = [];
  try {
    const ctx = await b.newContext({ ...pw.devices['Pixel 7 landscape'] });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push(e.message));
    const cdp = await ctx.newCDPSession(p);
    const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) });
    await p.goto(url);
    await p.waitForFunction(() => typeof UI !== 'undefined' && UI.screen === 'title', null, { timeout: 30000 });
    const fight = async (teams, mode) => {
      await p.evaluate(([tm, md]) => { DSGame.applyPerf = () => {}; UI.launch({ mode: md, teams: tm, stage: 'treino-dojo', cpu: [false, true], difficulty: 0, roundsToWin: 2, timer: 99, pets: [PETS[0], PETS[0]] }); }, [teams, mode]);
      await p.waitForFunction(() => UI.screen === 'fight' && DSGame.roundState === 'fight', null, { timeout: 20000 });
      await sleep(600);
    };
    await fight([['du'], ['nunes']], 'versus');
    /* CPU parada: so o jogador mexe */
    await p.evaluate(() => { DSGame.cfg.cpu[1] = false; });

    const lay = await p.evaluate(() => {
      const r = (sel) => { const e = document.querySelector(sel); if (!e || e.hidden || !e.offsetParent) return null; const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, cx: b.left + b.width / 2, cy: b.top + b.height / 2 }; };
      const btns = [...document.querySelectorAll('#touch-controls .tbtns button')].filter((e) => !e.hidden && e.offsetParent).map((e) => { const b = e.getBoundingClientRect(); return { k: e.dataset.k, x: b.left, y: b.top, w: b.width, h: b.height }; });
      let overlap = 0;
      for (let i = 0; i < btns.length; i++) for (let j = i + 1; j < btns.length; j++) {
        const A = btns[i], B = btns[j];
        const cx = (A.x + A.w / 2) - (B.x + B.w / 2), cy = (A.y + A.h / 2) - (B.y + B.h / 2);
        if (Math.hypot(cx, cy) < (A.w + B.w) / 2 - 2) overlap++; /* botoes redondos */
      }
      const vw = innerWidth, vh = innerHeight;
      const off = btns.filter((q) => q.x < 0 || q.y < 0 || q.x + q.w > vw + 1 || q.y + q.h > vh + 1).length;
      return { punch: r('[data-k="MouseLeft"]'), kick: r('[data-k="MouseRight"]'), p1: r('[data-power="0"]'), ult: r('[data-power="4"]'), tag: r('.t-tag'), stick: r('#stick'), zone: r('#stick-zone'), dpad: r('#dpad'), overlap, off, n: btns.length, vw, vh };
    });
    check('SOCO e CHUTE grandes (>= 60px)', lay.punch && lay.punch.w >= 60 && lay.kick.w >= 60, lay.punch && lay.punch.w + 'px');
    check('poderes >= 48px e ULT maior que os outros', lay.p1 && lay.p1.w >= 48 && lay.ult && lay.ult.w > lay.p1.w, lay.p1 && (lay.p1.w + ' / ' + lay.ult.w));
    check('TROCA escondida no 1x1', !lay.tag);
    check('nenhum botao em cima do outro e todos dentro da tela', lay.overlap === 0 && lay.off === 0, 'sobrepostos ' + lay.overlap + ' · fora ' + lay.off + ' · ' + lay.n + ' botoes');
    check('padrao no celular: DIRECIONAL grande (>= 160px) e sem joystick', lay.dpad && lay.dpad.w >= 160 && !lay.stick && !lay.zone, JSON.stringify({ dpad: lay.dpad && lay.dpad.w, stick: !!lay.stick, zone: !!lay.zone }));
    check('direcional nao encosta nos botoes de ataque', lay.dpad && lay.p1 && lay.dpad.x + lay.dpad.w < lay.p1.x - 40);

    /* DIRECIONAL: toque, deslize entre setas, cantos, folga contra pulo */
    {
      const D = lay.dpad, R = D.w / 2;
      const at = (fx, fy) => [D.cx + fx * R, D.cy + fy * R];
      const keys = () => p.evaluate(() => ({ k: [...Input.keys].filter((x) => /^Key[WASD]$/.test(x)).sort().join(','), on: [...document.querySelectorAll('#dpad i.on')].map((e) => e.className.replace(' on', '')).join(',') }));
      await touch('touchStart', [at(0.72, 0)]); await sleep(40);
      const r1 = await keys();
      check('direcional: seta direita anda pra frente e acende', r1.k === 'KeyD' && /d-right/.test(r1.on), JSON.stringify(r1));
      await touch('touchMove', [at(0.72, -0.3)]); await sleep(40);
      const r2 = await keys();
      check('direcional: dedo escorregando um pouco pra cima NAO pula', r2.k === 'KeyD', r2.k);
      await touch('touchMove', [at(0.55, -0.6)]); await sleep(40);
      const r3 = await keys();
      check('direcional: canto de cima = pulo pra frente (diagonal)', r3.k === 'KeyD,KeyW', r3.k);
      await touch('touchMove', [at(-0.72, 0.05)]); await sleep(40);
      const r4 = await keys();
      check('direcional: deslizar ate a seta esquerda sem soltar troca a direcao', r4.k === 'KeyA', r4.k);
      await touch('touchMove', [at(0, 0.72)]); await sleep(40);
      const r5 = await keys();
      check('direcional: seta de baixo agacha', r5.k === 'KeyS', r5.k);
      await touch('touchMove', [at(0.04, 0.03)]); await sleep(40);
      const r6 = await keys();
      check('direcional: centro = parado', r6.k === '', r6.k);
      await touch('touchEnd', []); await sleep(40);
      const r7 = await keys();
      check('direcional: soltar o dedo solta tudo e apaga as setas', r7.k === '' && r7.on === '', JSON.stringify(r7));
      /* andar com o direcional e socar ao mesmo tempo */
      await touch('touchStart', [at(0.72, 0)]);
      await touch('touchStart', [at(0.72, 0), [lay.punch.cx, lay.punch.cy]]); await sleep(60);
      const both = await p.evaluate(() => [...Input.keys]);
      await touch('touchEnd', []); await sleep(40);
      check('direcional: andar e socar juntos (dois dedos)', both.includes('KeyD') && both.includes('MouseLeft'), both.join(','));
      const opt = await p.evaluate(() => { const e = document.querySelector('[data-set="touchMove"]'); return e && [...e.options].map((o) => o.value).join(','); });
      check('opcao pra trocar direcional/joystick existe', opt === 'dpad,stick', opt);
    }

    /* recarga visivel: gasta o poder 1 e ve o --cd subir */
    const cd = await p.evaluate(async () => {
      const f = DSGame.activeOf(0);
      const b = document.querySelector('[data-power="0"]');
      const before = { ready: b.classList.contains('ready'), cd: getComputedStyle(b).getPropertyValue('--cd').trim() };
      f.cd[0] = 200; f.spamShared = 0;
      await new Promise((r) => setTimeout(r, 300));
      const during = { ready: b.classList.contains('ready'), cd: parseFloat(getComputedStyle(b).getPropertyValue('--cd')) || 0 };
      f.cd[0] = 0; f.castLock = 0; f.spamShared = 0;
      await new Promise((r) => setTimeout(r, 300));
      const after = { ready: b.classList.contains('ready'), cd: parseFloat(getComputedStyle(b).getPropertyValue('--cd')) || 0 };
      return { before, during, after };
    });
    check('poder recarregando escurece (--cd > 0, sem brilho)', cd.during.cd > 0.3 && !cd.during.ready, JSON.stringify(cd.during));
    check('poder pronto brilha (classe ready, --cd 0)', cd.after.ready && cd.after.cd === 0, JSON.stringify(cd.after));

    /* segurar SOCO: varios golpes (borda nova a cada ~8 quadros) */
    const countHits = async (code, ms, x, y) => {
      await p.evaluate((c) => { window.__hits = 0; const oe = Input.endFrame.bind(Input); Input.endFrame = () => { if (Input.pressed.has(c)) window.__hits++; oe(); }; window.__oe = oe; }, code);
      await touch('touchStart', [[x, y]]);
      await sleep(ms);
      await touch('touchEnd', []);
      await sleep(80);
      return p.evaluate(() => { Input.endFrame = window.__oe; return window.__hits; });
    };
    const held = await countHits('MouseLeft', 900, lay.punch.cx, lay.punch.cy);
    check('segurar SOCO por ~1 s repete o golpe (>= 5 socos)', held >= 5, held + ' socos');
    const keysAfter = await p.evaluate(() => [...Input.keys]);
    check('soltar o SOCO solta a tecla', !keysAfter.includes('MouseLeft'), keysAfter.join(','));
    await p.evaluate(() => Profile.setting('touchAuto', false));
    const single = await countHits('MouseLeft', 900, lay.punch.cx, lay.punch.cy);
    check('combo facil desligado nas opcoes: segurar = 1 soco', single === 1, single + ' socos');
    await p.evaluate(() => Profile.setting('touchAuto', true));

    /* MODO JOYSTICK (opcao): o resto do teste roda nele */
    const ls = await p.evaluate(() => {
      Profile.setting('touchMove', 'stick'); UI.updateTouch(); if (AppViewport.fit) AppViewport.fit();
      const r = (sel) => { const e = document.querySelector(sel); if (!e || e.hidden || !e.offsetParent) return null; const b = e.getBoundingClientRect(); return { x: b.left, w: b.width }; };
      return { stick: r('#stick'), zone: r('#stick-zone'), dpad: r('#dpad'), vw: innerWidth };
    });
    check('opcao joystick: joystick (>= 128px) e zona flutuante aparecem, direcional some', ls.stick && ls.stick.w >= 128 && ls.zone && ls.zone.x < 5 && ls.zone.w > ls.vw * 0.3 && !ls.dpad, JSON.stringify(ls));

    /* joystick flutuante: pousa o dedo no meio do lado esquerdo */
    const sx = lay.vw * 0.22, sy = lay.vh * 0.62;
    await touch('touchStart', [[sx, sy]]);
    await sleep(60);
    const fl = await p.evaluate(() => { const s = document.getElementById('stick'); const b = s.getBoundingClientRect(); return { floating: s.classList.contains('floating'), cx: b.left + b.width / 2, cy: b.top + b.height / 2, keys: [...Input.keys] }; });
    check('tocar no lado esquerdo traz o joystick pra baixo do dedo', fl.floating && Math.abs(fl.cx - sx) < 12 && Math.abs(fl.cy - sy) < 12, JSON.stringify(fl));
    check('so pousar o dedo nao anda nem pula (zona morta)', fl.keys.length === 0, fl.keys.join(','));
    await touch('touchMove', [[sx + 50, sy - 16]]);
    await sleep(60);
    const walk = await p.evaluate(() => [...Input.keys]);
    check('arrastar pra frente um pouco inclinado: anda e NAO pula', walk.includes('KeyD') && !walk.includes('KeyW'), walk.join(','));
    await touch('touchMove', [[sx + 30, sy - 50]]);
    await sleep(60);
    const jump = await p.evaluate(() => [...Input.keys]);
    check('arrastar pra cima na diagonal: pula pra frente', jump.includes('KeyW') && jump.includes('KeyD'), jump.join(','));
    await touch('touchMove', [[sx - 50, sy + 4]]);
    await sleep(60);
    const back = await p.evaluate(() => [...Input.keys]);
    check('arrastar pra tras: anda pra tras (defende), sem agachar', back.includes('KeyA') && !back.includes('KeyS') && !back.includes('KeyD'), back.join(','));
    await touch('touchEnd', []);
    await sleep(80);
    const rel = await p.evaluate(() => { const s = document.getElementById('stick'); return { keys: [...Input.keys], floating: s.classList.contains('floating'), left: s.style.left }; });
    check('soltar o dedo: para tudo e o joystick volta pro lugar', rel.keys.length === 0 && !rel.floating && !rel.left, JSON.stringify(rel));

    /* inverter rapido: arrasta longe pra frente e volta so ~45px */
    await touch('touchStart', [[sx, sy]]);
    await touch('touchMove', [[sx + 60, sy]]);
    await touch('touchMove', [[sx + 140, sy]]);
    await sleep(40);
    const far = await p.evaluate(() => [...Input.keys]);
    await touch('touchMove', [[sx + 95, sy]]);
    await sleep(40);
    const rev = await p.evaluate(() => ({ keys: [...Input.keys], left: parseFloat(document.getElementById('stick').style.left) }));
    await touch('touchEnd', []);
    await sleep(40);
    check('joystick acompanha o dedo: depois de arrastar longe, voltar ~45px ja inverte (defende)', far.includes('KeyD') && rev.keys.includes('KeyA') && !rev.keys.includes('KeyD'), JSON.stringify({ far, rev }));
    /* segundo dedo no lado esquerdo nao mexe no joystick nem solta ele */
    await touch('touchStart', [[sx, sy]]);
    await touch('touchMove', [[sx + 50, sy]]);
    await touch('touchStart', [[sx + 50, sy], [sx - 40, sy - 60]]);
    await touch('touchMove', [[sx + 50, sy], [sx - 120, sy - 60]]);
    await sleep(40);
    const two = await p.evaluate(() => [...Input.keys]);
    await touch('touchMove', [[sx + 50, sy]]); /* CDP: some da lista = esse dedo soltou */
    await sleep(40);
    const stillOn = await p.evaluate(() => [...Input.keys]);
    await touch('touchEnd', []);
    await sleep(40);
    check('segundo dedo no lado esquerdo nao mexe no joystick', two.includes('KeyD') && !two.includes('KeyA'), two.join(','));
    check('soltar o segundo dedo nao solta o joystick', stillOn.includes('KeyD'), stillOn.join(','));

    /* dois dedos: anda com o joystick e soca ao mesmo tempo */
    await touch('touchStart', [[sx, sy]]);
    await touch('touchMove', [[sx + 50, sy]]);
    await touch('touchStart', [[sx + 50, sy], [lay.punch.cx, lay.punch.cy]]);
    await sleep(80);
    const both = await p.evaluate(() => [...Input.keys]);
    await touch('touchEnd', []);
    check('dois dedos: andar e socar juntos', both.includes('KeyD') && both.includes('MouseLeft'), both.join(','));

    /* luta conta como "no toque" pra nota do torneio */
    check('luta marcada como jogada no toque', await p.evaluate(() => Input.touchUsed === true));

    /* 2x2: TROCA aparece */
    await p.evaluate(() => UI.toMenu());
    await fight([['du', 'stack'], ['nunes', 'rafael']], 'tag');
    await sleep(400);
    const tag = await p.evaluate(() => { const e = document.querySelector('.t-tag'); return !!(e && !e.hidden && e.offsetParent); });
    check('TROCA aparece no 2x2', tag);
    await p.evaluate(() => UI.toMenu());
    check('nenhum erro de pagina', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) {
    check('execucao sem excecao', false, e.message.split('\n')[0]);
  } finally {
    await b.close();
    server.close();
  }
  console.log(fails ? `CONTROLES DE TOQUE: ${fails} FALHAS (${n} checks)` : `CONTROLES DE TOQUE: TUDO OK (${n} checks)`);
  process.exit(fails ? 1 : 0);
})();
