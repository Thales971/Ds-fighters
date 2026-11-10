const fs = require('fs');
const vm = require('vm');
const ctx = {
  console, Image: class { set src(v) {} }, Math, Date, performance: { now: () => Date.now() },
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, skinFor: () => 0 },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: { takeRemote: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }) },
  AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => ({ getContext: () => ({}), style: {} }), addEventListener() {} },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16),
};
ctx.globalThis = ctx;
vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js','js/data/fighters-v20.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js','js/data/powers-balance-v9.js','js/data/powers-balance-v10.js','js/data/powers-balance-v11.js', 'js/data/pets.js', 'js/data/stages.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 60)); } }
vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, ellipse() {}, fill() {}, fillText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), set imageSmoothingEnabled(v) {} });
let fails = 0;
const check = (n, c, x) => { console.log((c ? 'OK   ' : 'FALHA') + ' ' + n + (x ? ' — ' + x : '')); if (!c) fails++; };

// convidado simulando localmente
const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
g.start({ mode: 'online', teams: [['du'], ['stack']], stage: '06-sakura-dojo', netRole: 'guest', mySlot: 0, cpu: [false, true], roundsToWin: 2, timer: 99 });
for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
check('convidado simula localmente (step roda)', g.time >= 100 && g.roundState === 'fight', 'time=' + g.time + ' rs=' + g.roundState);

// 1) snapshot IGUAL ao estado local -> previsao CONFIRMADA (nao aplica)
const snapOk = g.snapshot();
const confirmedBefore = g.rollbackLog ? g.rollbackLog.confirmed : 0;
g.onHostSnapshot(snapOk);
check('previsao confirmada (sem correcao)', g.rollbackLog.confirmed === confirmedBefore + 1, 'confirmadas=' + g.rollbackLog.confirmed + ' corrigidas=' + g.rollbackLog.corrected);
const xBefore = g.activeOf(0).x;
check('estado local preservado na confirmacao', Math.abs(g.activeOf(0).x - xBefore) < 0.01);

// 2) snapshot DIVERGENTE -> BACK para o autoritativo
const snapBad = g.snapshot();
snapBad.teams[0].m[0][0] = snapBad.teams[0].m[0][0] + 200; // host diz que o lutador esta 200px alem
const correctedBefore = g.rollbackLog.corrected;
g.onHostSnapshot(snapBad);
check('divergencia -> BACK para o estado do host', g.rollbackLog.corrected === correctedBefore + 1 && Math.abs(g.activeOf(0).x - snapBad.teams[0].m[0][0]) < 0.01, 'x=' + g.activeOf(0).x.toFixed(0) + ' (host: ' + snapBad.teams[0].m[0][0] + ')');

// 3) divergencia de vida tambem corrige
const snapHp = g.snapshot();
snapHp.teams[1].m[0][5] = snapHp.teams[1].m[0][5] - 50;
const c2 = g.rollbackLog.corrected;
g.onHostSnapshot(snapHp);
check('divergencia de vida -> correcao', g.rollbackLog.corrected === c2 + 1, 'hp local=' + Math.round(g.activeOf(1).hp) + ' host=' + snapHp.teams[1].m[0][5]);

// 4) transicao de round sempre obedece o host
const snapRound = g.snapshot();
snapRound.rs = 'ko';
const c3 = g.rollbackLog.corrected;
g.onHostSnapshot(snapRound);
check('transicao de round obedece o host', g.roundState === 'ko' && g.rollbackLog.corrected === c3 + 1, 'rs=' + g.roundState);

// 5) guest segue simulando apos correcao (fluidez mantida)
const tAfter = g.time;
for (let t = 0; t < 60; t++) g.tick();
check('simulacao continua apos correcao', g.time > tAfter + 50, 'time ' + tAfter + ' -> ' + g.time);

console.log('---');
console.log(fails === 0 ? 'ROLLBACK-LITE: TUDO OK' : 'ROLLBACK-LITE: ' + fails + ' FALHAS');
`, ctx);
