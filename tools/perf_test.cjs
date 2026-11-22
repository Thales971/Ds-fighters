// PERFORMANCE (13-30fps no celular): pacote de otimizacao por frame.
// 1) wiring: CRT sem mix-blend-mode, demo sem blur, classes perf-low/xlow,
//    weather perfOff/perfScale (aurora: cortinas e raios escalados),
//    game.applyPerf, chroma em meia-res, vinheta off nivel 2, watchdog de
//    fps no main.js, demo pulado na selecao com palco ao vivo, HUD com refs cache;
// 2) funcional (engine real + canvas real): applyPerf liga/desliga tudo,
//    clima reduz particulas com perfScale, perfOff tira clima do frame (diff),
//    chroma meia-res funciona (diff real, readback 480px), aurora escala sem quebrar;
// 3) BENCHMARK: custo medio de game.render() por frame (canvas de CPU = pior caso;
//    na GPU do navegador e mais rapido) com clima ligado no nivel 0 vs nivel 2.
const fs = require('fs'); const vm = require('vm');
function req(name) { return require(name); }
const { createCanvas, Image: CanvasImage, loadImage } = req('canvas');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const R = require('path').resolve(__dirname, '..') + '/';

const css = fs.readFileSync(R + 'css/style.css', 'utf8');
const weatherSrc = fs.readFileSync(R + 'js/engine/weather.js', 'utf8');
const gameSrc = fs.readFileSync(R + 'js/engine/game.js', 'utf8');
const stageSrc = fs.readFileSync(R + 'js/engine/stage.js', 'utf8');
const mainSrc = fs.readFileSync(R + 'js/main.js', 'utf8');
const hudSrc = fs.readFileSync(R + 'js/ui/hud.js', 'utf8');

// ================= 1. WIRING =================
check('css: CRT overlay SEM mix-blend-mode (blend em tela cheia mata fps no mobile)', /#app\.crt::after\s*\{[^}]*\}/.test(css) && !/mix-blend-mode/.test(css.match(/#app\.crt::after\s*\{[^}]*\}/)[0]));
check('css: stage-wrap.demo sem blur()', !/blur\(/.test(css.match(/#stage-wrap\.demo\s*\{[^}]*\}/)[0]));
check('css: body.perf-low/xlow escondem CRT, animacoes, blur da pausa, select-live no xlow', /body\.perf-low #app\.crt::after/.test(css) && /body\.perf-xlow \.select-live/.test(css) && /body\.perf-low #scr-pause/.test(css));
check('weather.js: draw()/drawSky() respeitam perfOff; update() escala por perfScale; aurora corta cortinas por perfScale', weatherSrc.indexOf('if (this.perfOff) return;') >= 0 && weatherSrc.indexOf('if (this.perfOff || this.kind !== \'aurora\') return;') >= 0 && weatherSrc.indexOf('wantBase') >= 0 && weatherSrc.indexOf('(this.perfScale || 1)') >= 0 && /Math\.round\(4 \* \(this\.perfScale/.test(weatherSrc));
check('game.js: applyPerf(nivel) + perfLevel no construtor + fauna parada no nivel 2', /applyPerf\(level\) \{/.test(gameSrc) && gameSrc.indexOf('this.perfLevel = 0;') >= 0 && gameSrc.indexOf('this.perfLevel < 2') >= 0);
check('game.js: applyChroma em MEIA RESOLUCAO (sem getImageData em tela cheia)', gameSrc.indexOf('(W * 0.5)') >= 0 && gameSrc.indexOf('_chromaCv') >= 0 && gameSrc.indexOf('ox.drawImage(ctx.canvas || this.canvas, 0, 0, w2, h2)') >= 0 && gameSrc.indexOf('ctx.drawImage(cv, 0, 0, W, H)') >= 0);
check('stage.js: drawVignette pula no nivel 2 (perfVignetteOff)', stageSrc.indexOf('if (this.perfVignetteOff) return;') >= 0);
check('main.js: selBgOn pula tick E render do demo na selecao com palco ao vivo', mainSrc.indexOf("const skipGame = selBgOn || demoHidden;") >= 0 && mainSrc.indexOf("if (!skipGame) { game.capturePrev(); game.tick(); Net.frame(game); }") >= 0 && mainSrc.indexOf('if (game.stage && !skipGame) game.render(') >= 0 && mainSrc.indexOf("UI.screen === 'select' && !!UI._selBg") >= 0);
check('main.js: watchdog de fps (fps<38 por ~2s desce nivel, >55 por ~5s sobe, quality=low tranca nivel 2)', mainSrc.indexOf('window.__perf') >= 0 && mainSrc.indexOf('P.bad >= 4') >= 0 && mainSrc.indexOf('P.good >= 10') >= 0 && mainSrc.indexOf("q === 'low') P.level = 2") >= 0 && mainSrc.indexOf('game.applyPerf(P.level)') >= 0);
check('hud.js: refs cacheadas (side._r) e writes so quando mudam (setW/setT)', hudSrc.indexOf('side._r = {') >= 0 && hudSrc.indexOf('const setW = (el, v)') >= 0 && hudSrc.indexOf('const setT = (el, v)') >= 0 && hudSrc.indexOf("q('.fill')") < 0);

// ================= 2+3. FUNCIONAL + BENCHMARK (engine real, canvas real) =================
const bodyClass = new Set();
const ctx = { console, Math, Date, Image: CanvasImage, createCanvas, loadImage, fs,
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho', 'maximilian', 'dolynho'], data: { settings: { reducedMotion: false, quality: 'medium' }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting(k, v) { if (v === undefined) return this.data.settings[k]; this.data.settings[k] = v; return v; }, reducedMotion: () => false, record() {}, grantAchievement() {}, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, recordStage() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({}), Input: { init() {}, read: () => ({}), pad: () => null, padCount: 0, hit: () => false, menu: () => ({}), releaseAll() {} },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: { room: null, frame() {}, takeRemote: () => ({}) }, AI: { think() { return {}; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), querySelectorAll: () => [], querySelector: () => null, addEventListener() {}, body: { classList: { add: (c) => bodyClass.add(c), remove: (c) => bodyClass.delete(c), contains: (c) => bodyClass.has(c), toggle: (c, f) => { if (f === undefined) { bodyClass.has(c) ? bodyClass.delete(c) : bodyClass.add(c); } else if (f) bodyClass.add(c); else bodyClass.delete(c); } }, dataset: {} } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16), performance: { now: () => Date.now() } };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/balance.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/fighters-dolynho.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/fighters-dev-virado.js', 'js/data/fighters-milena.js', 'js/data/fighters-kira.js', 'js/data/fighters-cracker.js', 'js/data/fighters-rafael.js', 'js/data/fighters-cyber-v2.js', 'js/data/roster-portraits.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/data/accessories.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(R + f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 80)); } }

(async () => {
  await vm.runInContext('(async () => { SpriteGen.images.du = await loadImage("' + R + 'assets/sprites/du.png"); SpriteGen.images.stack = await loadImage("' + R + 'assets/sprites/stack.png"); })()', ctx);
  const r = await vm.runInContext(`
  (async () => {
    const canvas = createCanvas(960, 540);
    canvas.classList = { remove(){}, add(){}, toggle(){} }; /* canvas real: applyChroma faz drawImage(this.canvas) */
    const cx2d = canvas.getContext('2d');
    const g = new Game(canvas);
    g.start({ mode: 'versus', teams: [['du'], ['stack']], stage: '06-sakura-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
    for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
    for (let t = 0; t < 30; t++) g.tick();
    g.stage.img = await loadImage('assets/maps/06-sakura-dojo.jpg'); g.stage.ready = true;
    g.paused = true; g.time = 400; g.stage.t = 40; g.shakeMag = 0; g.freeze = 0; g.slowmo = 0;
    const f0 = g.activeOf(0), f1 = g.activeOf(1);
    const fix = (f, x, dir) => { f.x = x; f.y = 0; f.state = 'idle'; f.frame = 0; f.stateTime = 3; f.dir = dir; f.vx = 0; f.vy = 0; f.alive = true; f.hp = f.maxHp; f.status = {}; f.attack = null; f.cast = null; };
    fix(f0, 380, 1); fix(f1, 580, -1);
    const diff = (a, b) => { let c = 0; for (let i = 0; i < a.length; i += 4) { if (Math.abs(a[i]-b[i]) + Math.abs(a[i+1]-b[i+1]) + Math.abs(a[i+2]-b[i+2]) > 30) c++; } return c; };
    const grab = () => { cx2d.clearRect(0, 0, 960, 540); g.render(1); return cx2d.getImageData(0, 0, 960, 540).data.slice(); };
    const out = {};
    // --- applyPerf niveis ---
    g.applyPerf(1);
    out.l1 = { qFx: g.qFxOn, ps: g.weather && g.weather.perfScale, pOff: g.weather && g.weather.perfOff, body: document.body.classList.contains('perf-low') };
    g.applyPerf(2);
    out.l2 = { qFx: g.qFxOn, pOff: g.weather.perfOff, vig: g.stage.perfVignetteOff, body: document.body.classList.contains('perf-xlow') && document.body.classList.contains('perf-low') };
    g.applyPerf(0);
    out.l0 = { qFx: g.qFxOn, ps: g.weather.perfScale, pOff: g.weather.perfOff, body: !document.body.classList.contains('perf-low') && !document.body.classList.contains('perf-xlow') };
    // --- clima: perfScale reduz particulas; perfOff tira do frame (diff real) ---
    const W = g.weather;
    W.kind = 'rain'; W.pool = ['rain']; W.changeAt = 1e9; W.intensity = 1; W.intensityTarget = 1; W.perfScale = 1; W.perfOff = false; W.drops.length = 0;
    for (let t = 0; t < 40; t++) W.update(false);
    out.rainFull = W.drops.length;
    W.perfScale = 0.45; W.drops.length = 0;
    for (let t = 0; t < 40; t++) W.update(false);
    out.rainScaled = W.drops.length;
    W.perfScale = 1; W.drops.length = 0;
    for (let t = 0; t < 40; t++) W.update(false);
    g.chroma = 0; const A = grab();
    W.perfOff = true; const B = grab();
    W.perfOff = false; out.rainDiff = diff(A, B);
    // --- chroma meia-res ---
    g.chroma = 0; const C0 = grab();
    g.chroma = 8; let chromaErr = null;
    try { grab(); } catch (e) { chromaErr = e.message; }
    const C1 = grab();
    out.chroma = { err: chromaErr, diff: diff(C0, C1), cvw: g._chromaCv && g._chromaCv.width };
    g.chroma = 0;
    // --- aurora com perfScale ---
    W.kind = 'aurora'; W.pool = ['aurora']; W.perfScale = 0.45; W.drops.length = 0;
    for (let t = 0; t < 40; t++) W.update(false);
    let aurErr = null; let aurPx = -1;
    try { cx2d.clearRect(0, 0, 960, 540); W.intensity = 1; W.drawSky(cx2d); /* aurora agora e ceu (coordenadas de tela, atras dos lutadores) */ const d = cx2d.getImageData(0, 0, 960, 540).data; aurPx = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 10) aurPx++; } catch (e) { aurErr = e.message; } /* como no jogo: translate(0, GROUND_Y) */
    out.aurora = { err: aurErr, px: aurPx, drops: W.drops.length };
    // --- BENCHMARK: custo medio de render por frame (canvas de CPU = pior caso) ---
    const bench = (label) => { const t0 = Date.now(); for (let i = 0; i < 120; i++) { g.time = 400 + i; g.stage.t = 40 + i; cx2d.clearRect(0, 0, 960, 540); g.render(1); } const ms = (Date.now() - t0) / 120; out[label] = Math.round(ms * 100) / 100; };
    W.kind = 'rain'; W.pool = ['rain']; W.perfScale = 1; W.perfOff = false; W.drops.length = 0; W.intensity = 1; W.intensityTarget = 1;
    for (let t = 0; t < 40; t++) W.update(false);
    g.applyPerf(0); bench('msL0');           // nivel 0 com chuva cheia
    g.applyPerf(1); bench('msL1');           // nivel 1: sem fx, clima 45%
    g.applyPerf(2); bench('msL2');           // nivel 2: sem clima/vinheta
    g.applyPerf(0); W.kind = 'clear'; W.pool = ['clear'];
    return JSON.stringify(out);
  })()`, ctx);
  const P = JSON.parse(r);
  check('applyPerf(1): qFxOn=false, clima 45%, body.perf-low', P.l1.qFx === false && P.l1.ps === 0.45 && P.l1.pOff === false && P.l1.body === true, JSON.stringify(P.l1));
  check('applyPerf(2): clima off, vinheta off, body.perf-xlow+perf-low', P.l2.qFx === false && P.l2.pOff === true && P.l2.vig === true && P.l2.body === true, JSON.stringify(P.l2));
  check('applyPerf(0): restaura tudo (qFxOn=true, clima 100%, sem classes)', P.l0.qFx === true && P.l0.ps === 1 && P.l0.pOff === false && P.l0.body === true, JSON.stringify(P.l0));
  check('clima: perfScale 0.45 reduz gotas de chuva (' + P.rainFull + ' -> ' + P.rainScaled + ')', P.rainFull >= 100 && P.rainScaled >= 35 && P.rainScaled <= P.rainFull * 0.55, P.rainFull + '/' + P.rainScaled);
  check('perfOff tira o clima do frame renderizado (diff=' + P.rainDiff + ' px)', P.rainDiff > 1500);
  check('chroma meia-res: sem erro, muda pixels (diff=' + P.chroma.diff + '), readback em ' + P.chroma.cvw + 'px (nao 960)', !P.chroma.err && P.chroma.diff > 500 && P.chroma.cvw === 480, JSON.stringify(P.chroma));
  check('aurora com perfScale 0.45: desenha sem erro (' + P.aurora.px + ' px)', !P.aurora.err && P.aurora.px > 500, JSON.stringify(P.aurora));
  check('BENCHMARK render: nivel 2 (sem clima) mais rapido que nivel 0 com chuva — L0=' + P.msL0 + 'ms L1=' + P.msL1 + 'ms L2=' + P.msL2 + 'ms por frame (canvas CPU, pior caso; GPU do navegador e mais rapida)', P.msL2 < P.msL0, 'L0=' + P.msL0 + 'ms L1=' + P.msL1 + 'ms L2=' + P.msL2 + 'ms');

  console.log('---');
  console.log('BENCH (software, 960x540): nivel0=' + P.msL0 + 'ms nivel1=' + P.msL1 + 'ms nivel2=' + P.msL2 + 'ms por frame => limite teorico ' + Math.round(1000 / P.msL2) + '+ fps no nivel 2 (na GPU fica ainda mais rapido)');
  console.log(fails === 0 ? 'PERFORMANCE: TUDO OK (' + n + ' checks)' : 'PERFORMANCE: ' + fails + ' FALHAS de ' + n);
  process.exit(fails ? 1 : 0);
})();
