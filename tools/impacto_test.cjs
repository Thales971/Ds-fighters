// POLIMENTO DE IMPACTO: hit-stop forte + aberracao cromatica (RGB split) no golpe
// pesado/KO, rim light na cor do time atras do sprite, poeira ao correr/dash/bloquear.
const fs = require('fs'); const vm = require('vm');
function req(name) { return require(name); }
const { createCanvas } = req('canvas');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas, fs,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {}, pitocoSeq: [], pitocoKey() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), querySelectorAll: () => [], addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} }, dataset: {} } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }

// ===== 1. ABERRACAO CROMATICA: RGB split real num canvas pequeno =====
{
  const c = createCanvas(16, 4);
  const x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, 16, 4);
  x.fillStyle = 'rgb(255,255,255)'; x.fillRect(2, 0, 3, 4); /* faixa branca no meio (R e B presentes) */
  const before = x.getImageData(0, 0, 16, 4).data;
  const GameCls = vm.runInContext('Game', ctx);
  GameCls.prototype.applyChroma.call({ chroma: 6, reduced: false }, x, 16, 4);
  const after = x.getImageData(0, 0, 16, 4).data;
  let rShifted = 0, bShifted = 0;
  for (let i = 0; i < before.length; i += 4) {
    if (after[i] !== before[i]) rShifted++;
    if (after[i + 2] !== before[i + 2]) bShifted++;
  }
  check('applyChroma desloca os canais R e B (RGB split) so quando chroma>0', rShifted > 0 && bShifted > 0, 'R mudaram=' + rShifted + ' B mudaram=' + bShifted);
  const before2 = x.getImageData(0, 0, 16, 4).data;
  GameCls.prototype.applyChroma.call({ chroma: 0, reduced: false }, x, 16, 4);
  const after2 = x.getImageData(0, 0, 16, 4).data;
  check('chroma=0 (ou reduced): nao toca nos pixels (barato)', before2.every((v, i) => after2[i] === v));
}

// ===== 2. hit-stop + chroma no golpe pesado / KO (game) =====
const r = vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), createPattern: () => ({}), set imageSmoothingEnabled(v) {}, set globalAlpha(v) {}, set globalCompositeOperation(v) {}, set fillStyle(v) {}, set strokeStyle(v) {}, set font(v) {}, set textAlign(v) {}, set lineWidth(v) {}, set filter(v) {}, getImageData() { return { data: new Uint8ClampedArray(4) }; }, putImageData() {} });
const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } });
g.start({ mode: 'versus', teams: [['du'], ['stack']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
const f0 = g.activeOf(0), f1 = g.activeOf(1);
const hs0 = g.hitstop, ch0 = g.chroma;
g.registerHit(f0, f1, 30, false, 5, false);   /* golpe pesado d=30 */
const heavy = { hitstop: g.hitstop, chroma: g.chroma };
g.registerHit(f0, f1, 8, false, 2, false);    /* golpe leve d=8 */
const light = { hitstop: g.hitstop, chroma: g.chroma };
g.registerHit(f0, f1, 30, true, 5, false);    /* bloqueado: nao liga chroma */
const blocked = { chroma: g.chroma };
/* chroma decai no tick */
const chBefore = g.chroma;
for (let t = 0; t < 3; t++) g.tick();
const chromaDecay = g.chroma < chBefore;
/* render com chroma>0 chama getImageData; com chroma=0 nao chama */
let gi = 0, pi = 0;
const rec = new Proxy({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), getImageData() { gi++; return { data: new Uint8ClampedArray(960 * 540 * 4) }; }, putImageData() { pi++; } }, { get(t, k) { return k in t ? t[k] : undefined; }, set(t, k, v) { t[k] = v; return true; } });
g.chroma = 5;
g.renderScene(rec);
const withChroma = gi;
g.chroma = 0;
gi = 0;
g.renderScene(rec);
JSON.stringify({ heavy, light, blocked, chromaDecay, withChroma, noChroma: gi, put: pi });
`, ctx);
const R = JSON.parse(r);
check('golpe pesado (d>=26) liga chroma e hit-stop >= 7', R.heavy.chroma >= 9 && R.heavy.hitstop >= 7, JSON.stringify(R.heavy));
check('golpe medio (d>=20) liga chroma menor, sem hit-stop extra', R.light.chroma >= 6 && R.light.chroma <= R.heavy.chroma, JSON.stringify(R.light));
check('golpe BLOQUEADO nao liga chroma', R.blocked.chroma === R.light.chroma, '');
check('chroma decai com o tempo', R.chromaDecay, '');
check('render com chroma>0 aplica RGB split (getImageData/putImageData); com chroma=0 nao (barato)', R.withChroma > 0 && R.noChroma === 0 && R.put > 0, 'get=' + R.withChroma + ' put=' + R.put);
const gSrc = fs.readFileSync('js/engine/game.js', 'utf8');
check('K.O. liga chroma forte (12)', /this\.chroma = 12/.test(gSrc), '');

// ===== 3. RIM LIGHT na cor do time (aura radial + 4 blits deslocados com lighter) =====
const r2 = vm.runInContext(`
const g2 = new Game({ width: 960, height: 540, getContext: () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }), classList: { toggle() {}, add() {}, remove() {} } });
g2.start({ mode: 'versus', teams: [['du'], ['stack']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
for (let t = 0; t < 700 && g2.roundState !== 'fight'; t++) g2.tick();
let lighterN = 0; const radStops = []; let blits = 0;
const origBlit = SpriteGen.blit.bind(SpriteGen);
SpriteGen.blit = (...a) => { blits++; return origBlit(...a); };
const recR = new Proxy({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }) }, {
  get(t, k) {
    if (k === 'createRadialGradient') return () => { const g = { stops: [], addColorStop(o, c) { g.stops.push(c); radStops.push(c); } }; return g; };
    return k in t ? t[k] : undefined;
  },
  set(t, k, v) { if (k === 'globalCompositeOperation' && v === 'lighter') lighterN++; t[k] = v; return true; },
});
const fa = g2.activeOf(0); /* time 0 = azul */
fa.state = 'idle';
const b0 = blits, l0 = lighterN;
fa.draw(recR);
const rim0 = { blits: blits - b0, lighter: lighterN - l0, stops: radStops.filter((c) => /63,208,255/.test(c)).length };
radStops.length = 0;
const fb = g2.activeOf(1); /* time 1 = vermelho */
const b1 = blits, l1 = lighterN;
fb.state = 'idle';
fb.draw(recR);
const rim1 = { blits: blits - b1, lighter: lighterN - l1, stops: radStops.filter((c) => /255,75,107/.test(c)).length };
SpriteGen.blit = origBlit;
JSON.stringify({ rim0, rim1 });
`, ctx);
const R2 = JSON.parse(r2);
check('lutador time 0 ganha rim: aura radial CIANA + 4 blits extras com lighter', R2.rim0.stops >= 1 && R2.rim0.blits >= 4 && R2.rim0.lighter >= 1, JSON.stringify(R2.rim0));
check('lutador time 1 ganha rim VERMELHO', R2.rim1.stops >= 1, JSON.stringify(R2.rim1));
check('rim desliga quando rage/armor/overclock (nao briga com o glow de status)', (() => { const s = fs.readFileSync('js/engine/fighter.js', 'utf8'); return /!this\.has\('rage'\) && !this\.has\('armor'\) && !this\.has\('overclock'\)/.test(s); })(), '');

// ===== 4. POEIRA: correr, dash e bloqueio =====
const r3 = vm.runInContext(`
const g3 = new Game({ width: 960, height: 540, getContext: () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }), classList: { toggle() {}, add() {}, remove() {} } });
g3.start({ mode: 'versus', teams: [['du'], ['stack']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
for (let t = 0; t < 700 && g3.roundState !== 'fight'; t++) g3.tick();
const f = g3.activeOf(0);
const dustCount = () => g3.sparks.filter((s) => s.dust).length;
/* correr rapido no chao gera poeira */
f.state = 'walk'; f.onGround = true; f.vx = 8; f.y = 0;
const d0 = dustCount();
const IN_RIGHT = { left: false, right: true, down: false, up: false, punch: false, kick: false };
for (let t = 0; t < 300; t++) { f.state = 'walk'; f.onGround = true; f.vx = 8; f.update(IN_RIGHT); }
const runDust = dustCount() - d0;
/* dash gera poeira no comeco + rastro */
f.state = 'idle'; f.stateTime = 0; f.vx = 0;
const d1 = dustCount();
f.startDash(1);
for (let t = 0; t < 12; t++) f.update(EMPTY_INPUT);
const dashDust = dustCount() - d1;
/* bloqueio gera poeira azul */
const f2 = g3.activeOf(1);
f2.state = 'idle'; f2.onGround = true; f2.blocking = true; f2.y = 0; f2.hp = f2.maxHp; f2.status = {};
const d2 = dustCount();
f2.takeHit(6, { attacker: f, height: 'mid', kx: 3, dirSign: 1 });
const blockDust = dustCount() - d2;
JSON.stringify({ runDust, dashDust, blockDust, state: f2.state });
`, ctx);
const R3 = JSON.parse(r3);
check('correr rapido solta poeira no chao', R3.runDust > 0, R3.runDust + ' particulas');
check('dash solta poeira (comeco + rastro)', R3.dashDust > 0, R3.dashDust + ' particulas');
check('bloqueio solta poeira azul e entra em blockstun', R3.blockDust > 0 && R3.state === 'blockstun', R3.blockDust + ' particulas, state=' + R3.state);

console.log('---');
console.log(fails === 0 ? 'IMPACTO: TUDO OK (' + n + ' checks)' : 'IMPACTO: ' + fails + ' FALHAS de ' + n);
process.exit(fails ? 1 : 0);
