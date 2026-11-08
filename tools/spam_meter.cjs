const fs = require('fs');
const vm = require('vm');
const ctx = {
  console, Image: class { set src(v) {} }, Math, Date,
  Profile: { SECRET_IDS: ['du','iales','felipinho'], data: { settings: { reducedMotion: false }, unlocked: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, skinFor: () => 0 },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => ({ getContext: () => ({}), style: {} }), addEventListener() {} },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16),
};
ctx.globalThis = ctx;
vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js','js/data/fighters-v20.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js','js/data/powers-balance-v9.js', 'js/data/pets.js', 'js/data/stages.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 60)); } }
vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, ellipse() {}, fill() {}, fillText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), set imageSmoothingEnabled(v) {} });
// mede casts por minuto em partida de 60s com IA nivel 3 (agressiva) dos dois lados
const measure = (aId, bId) => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
  g.start({ mode: 'versus', teams: [[aId], [bId]], stage: '06-sakura-dojo', cpu: [true, true], difficulty: 3, roundsToWin: 99, timer: 60 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  let casts = 0;
  const t0 = g.events.length;
  for (let t = 0; t < 3600; t++) { g.tick(); if (g.roundState !== 'fight') { g.roundState = 'fight'; g.roundStateTime = 0; } g.activeOf(0).hp = g.activeOf(0).maxHp; g.activeOf(1).hp = g.activeOf(1).maxHp; }
  casts = g.events.slice(t0).filter((e) => e.t === 'cast').length;
  return casts;
};
const pairs = [['iales','du'], ['qwen','bhm'], ['emilio','nunes'], ['felipinho','urbano'], ['thl','merc']];
let total = 0;
for (const [a, b] of pairs) {
  const c = measure(a, b);
  total += c;
  console.log(a + ' vs ' + b + ': ' + c + ' casts em 60s (' + (c / 2).toFixed(1) + '/min por lutador)');
}
console.log('---');
console.log('media geral: ' + (total / pairs.length / 2).toFixed(1) + ' casts/min por lutador');
console.log(total / pairs.length / 2 <= 20 ? 'NAO E SPAM (<=20 casts/min)' : 'PODE SER SPAM (>20 casts/min)');
`, ctx);
