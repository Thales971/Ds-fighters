// AMBIENTE VISUAL (plano 2026-11-20): enfeites genericos removidos, torcida encaixada por
// arena, mare recortada quadro a quadro e aurora em pixel art atras dos lutadores.
const fs = require('fs'); const vm = require('vm');
function req(name){ try { return require(name); } catch(e){ return require('/tmp/node_modules/'+name); } }
const { createCanvas } = req('canvas');
const { PNG } = req('pngjs');
const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas, fs, PNG,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {}, pitocoSeq: [], pitocoKey() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} } } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/pets.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 80)); } }
vm.runInContext(`
const rec = [];
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage(...a) { rec.push(a); }, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), createPattern: () => ({}), set imageSmoothingEnabled(v) {}, set globalAlpha(v) {}, set globalCompositeOperation(v) {}, set fillStyle(v) {}, set strokeStyle(v) {}, set font(v) {}, set textAlign(v) {}, set lineWidth(v) {}, set filter(v) {} });
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const mk = (stage) => {
  const canvas = { width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } };
  const g = new Game(canvas);
  g.start({ mode: 'versus', teams: [['du'], ['du']], stage, cpu: [true, true], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};
const fakeImg = (w, h) => ({ complete: true, naturalWidth: w, naturalHeight: h, width: w, height: h });

// ===== 1. ENFEITES GENERICOS REMOVIDOS =====
for (const id of ['estacao-valinhos', 'represa', 'sesi', 'parque-lago']) {
  const g = mk(id);
  check(id + ': sem enfeites genericos (props vazio)', !g.stage.props || g.stage.props.length === 0, 'props=' + (g.stage.props ? g.stage.props.length : 'none'));
  if (g.stage.propSheet !== undefined) g.stage.propSheet = fakeImg(384, 64);
  rec.length = 0;
  g.stage.drawBack(fake2d(), 0, 0);
  const cell = rec.filter((a) => a.length === 9 && a[3] === 48 && a[4] === 64);
  check(id + ': nada desenhado com celula 48x64 da sheet de enfeites', cell.length === 0, cell.length + ' draws');
}
{
  const g = mk('represa');
  const L = g.stage.buildLights();
  check('represa (sem def.lights): buildLights sem luz de poste', L.length === 0, L.length + ' luzes');
  const gc = mk('circo');
  check('circo (def.lights): luzes do mapa continuam', gc.stage.buildLights().length === 2, gc.stage.buildLights().length + ' luzes');
}
// ===== 1b. CIRCO: holofote desenhado ANTES do 1o tick da luta (intro) nao pode quebrar o render =====
{
  const strict = Object.assign(fake2d(), { createRadialGradient(...a) { if (!a.every(Number.isFinite)) throw new TypeError('non-finite'); return { addColorStop() {} }; }, createLinearGradient(...a) { if (!a.every(Number.isFinite)) throw new TypeError('non-finite'); return { addColorStop() {} }; } });
  const canvas = { width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } };
  const g = new Game(canvas);
  g.start({ mode: 'versus', teams: [['du'], ['du']], stage: 'circo', cpu: [true, true], roundsToWin: 1, timer: 99 });
  let err = null;
  try { g.mech.draw(strict); } catch (e) { err = e.message; }
  check('circo: holofote desenha na intro (antes do 1o tick) sem erro', !err, err || '');
}
// ===== 2. TORCIDA ENCAIXADA POR ARENA (25 pessoas de 51.2x200 na sheet 1280x200) =====
{
  const PW = 1280 / 25;
  const ids = STAGE_LIST.filter((d) => d.torcida).map((d) => d.id);
  check('7 arenas com torcida', ids.length === 7, ids.join(','));
  for (const id of ids) {
    const g = mk(id);
    const def = STAGE_LIST.find((d) => d.id === id);
    check(id + ': torcida com posicao propria na ficha (rows)', def.torcida && Array.isArray(def.torcida.rows) && def.torcida.rows.length > 0);
    g.stage.crowdSheet = fakeImg(1280, 200);
    rec.length = 0;
    g.stage.drawTorcida(fake2d());
    const ppl = rec.filter((a) => a.length === 9 && a[0] === g.stage.crowdSheet);
    const sizeOk = ppl.length > 0 && ppl.every((a) => Math.abs(a[3] - PW) < 0.01 && a[4] === 200);
    check(id + ': recorta 1 pessoa por vez (51.2x200)', sizeOk, ppl.length + ' pessoas');
    const maxH = Math.max(...ppl.map((a) => a[8]));
    check(id + ': pessoa menor que lutador (altura <= 120px)', maxH <= 120, 'max=' + maxH.toFixed(1));
    const topOk = ppl.every((a) => a[6] >= 0 && a[6] + a[8] <= 458 + 2);
    check(id + ': ninguem cortado no topo nem abaixo do chao', topOk);
    const distinct = new Set(ppl.map((a) => Math.round(a[1] / PW)));
    check(id + ': varia as pessoas (> 5 diferentes)', distinct.size > 5, distinct.size + ' diferentes');
    let adj = 0; for (let i = 1; i < ppl.length; i++) if (ppl[i][1] === ppl[i - 1][1] && ppl[i][6] === ppl[i - 1][6]) adj++;
    check(id + ': sem a mesma pessoa repetida lado a lado', adj === 0, adj + ' repeticoes');
  }
  // ficha antiga com torcida: true (sem rows) cai num default seguro
  const def = STAGE_LIST.find((d) => d.id === 'arquibancada');
  const saved = def.torcida; def.torcida = true;
  const g = mk('arquibancada');
  def.torcida = saved;
  g.stage.crowdSheet = fakeImg(1280, 200);
  rec.length = 0; g.stage.drawTorcida(fake2d());
  const ppl = rec.filter((a) => a.length === 9 && a[0] === g.stage.crowdSheet);
  check('torcida: true sem rows usa default pequeno', ppl.length > 0 && ppl.every((a) => a[8] <= 120 && a[6] >= 0), ppl.length + ' pessoas');
}
globalThis.__res = () => ({ fails, n });
`, ctx);
{
  const mainSrc = fs.readFileSync('js/main.js', 'utf8');
  const stageSrc = fs.readFileSync('js/engine/stage.js', 'utf8');
  const r = ctx.__res();
  const ok1 = mainSrc.indexOf('stage-props.png') < 0;
  const ok2 = stageSrc.indexOf('stage-props.png') < 0;
  console.log((ok1 ? 'OK   ' : 'FALHA') + ' main.js nao pre-carrega stage-props.png');
  console.log((ok2 ? 'OK   ' : 'FALHA') + ' stage.js nao carrega stage-props.png');
  const fails = r.fails + (ok1 ? 0 : 1) + (ok2 ? 0 : 1);
  console.log('---');
  console.log(fails ? 'AMBIENTE VISUAL: ' + fails + ' FALHA(S)' : 'AMBIENTE VISUAL: TUDO OK (' + (r.n + 2) + ' checks)');
  process.exit(fails ? 1 : 0);
}
