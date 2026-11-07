// BHM: combo automatico de socos e chutes apos o teleporte (Portal Sombrio).
const fs = require('fs');
const vm = require('vm');
const ctx = {
  console, Image: class { set src(v) {} }, Math, Date,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, skinFor: () => 0 },
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
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/powers-balance-v7.js','js/data/powers-balance-v8.js', 'js/data/pets.js', 'js/data/stages.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 80)); } }

vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, ellipse() {}, fill() {}, fillText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), set imageSmoothingEnabled(v) {} });
const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
g.start({ mode: 'versus', teams: [['bhm'], ['du']], cpu: [false, false], roundsToWin: 2, timer: 99 });
for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
const [f, o] = g.activePair();
let fails = 0;
const check = (name, cond, extra) => { console.log((cond ? 'OK   ' : 'FALHA') + ' ' + name + (extra ? ' — ' + extra : '')); if (!cond) fails++; };

// stats v7
const def = FIGHTERS.find((x) => x.id === 'bhm');
check('BHM power 1.38 (nerf)', def.stats.power === 1.38, 'power=' + def.stats.power);
check('BHM hp 144 (nerf)', def.stats.hp === 144);

// kit v7: dano +20% (plasma 14 -> 16.8 ~ arredondado)
const plasma = POWERS.bhm.powers.find((p) => p.id === 'plasma');
check('Bola Sombria no nivel v7 (nerf)', plasma.dmg >= 16, 'dmg=' + plasma.dmg);

// combo automatico: casta o Portal Sombrio (indice 3, charge meter 1) colado no rival
f.x = 500; o.x = 560; o.y = 0; f.y = 0;
f.charge = [100, 100]; f.ultimate = 100; f.cd = [0,0,0,0,0,0,0,0,0,0];
f.state = 'idle'; f.cast = null; f.status = {}; f.stolen = null;
const ok = f.tryCast(3);
check('Portal Sombrio cast', ok === true);
const hp0 = o.hp;
// roda o teleporte inteiro (sink + emerge + recover) + combo
let comboHits = 0;
const kindsVistos = new Set();
for (let t = 0; t < 400; t++) {
  g.tick();
  o.hp = Math.max(o.hp, 1); o.alive = true; // nao deixa morrer no meio
  if (t % 20 === 0) console.log('   t=' + t, 'phase=' + (f.shadowPort ? f.shadowPort.phase : 'null'), 'state=' + f.state, 'autoCombo=' + JSON.stringify(f.autoCombo || null), 'x=' + f.x.toFixed(0), 'ox=' + o.x.toFixed(0));
  if (f.attack) { kindsVistos.add(f.attack.kind); f.attack._contado || (f.attack._contado = true, comboHits++); }
}
check('combo automatico disparou', comboHits >= 3, comboHits + ' golpes');
check('sequencia de socos E chutes', kindsVistos.has('punch') && kindsVistos.has('kick'), [...kindsVistos].join(','));
check('dano no rival', o.hp < o.maxHp, Math.round(o.maxHp - o.hp) + ' de dano');

// Qwen/Winx: power na faixa 1.50-1.70 e kit menos apelao
const qwen = FIGHTERS.find((x) => x.id === 'qwen');
const winx = FIGHTERS.find((x) => x.id === 'winx-exe');
check('Qwen power 1.46 (nerf de equilibrio)', qwen.stats.power === 1.46, 'power=' + qwen.stats.power);
check('Winx power 1.52 (entre 1.50 e 1.70)', winx.stats.power >= 1.50 && winx.stats.power <= 1.70, 'power=' + winx.stats.power);
const qwenUlt = POWERS.qwen.powers.find((p) => p.slot === 'ultimate');
check('Qwen ult menos apelao (transform mais curto)', (qwenUlt.time || 0) <= 780, 'time=' + qwenUlt.time);
const sig = SIGNATURES.qwen;
check('assinatura Qwen reduzida', sig.ability.drain <= 0.05 && sig.ability.lock <= 25, JSON.stringify(sig.ability));

// Du e Felipinho
const du = FIGHTERS.find((x) => x.id === 'du');
const feli = FIGHTERS.find((x) => x.id === 'felipinho');
check('Du power 1.58 (v8)', du.stats.power === 1.58, 'power=' + du.stats.power);
check('Felipinho power 1.62 (v8)', feli.stats.power === 1.62, 'power=' + feli.stats.power);
const apoc = POWERS.du.powers.find((p) => p.id === 'apoc');
check('Du apoc 66 de dano / 8 hits (v8)', apoc.dmg === 66 && apoc.hits === 8, 'dmg=' + apoc.dmg + ' hits=' + apoc.hits);

// fracos buffados
['stack', 'gemini', 'meta', 'mis', 'grika', 'engenheira-prompt', 'odette', 'thl', 'dev-senior'].forEach((id) => {
  const d = FIGHTERS.find((x) => x.id === id);
  check(id + ' buffado', d.stats.power >= 1.42, 'power=' + d.stats.power + ' hp=' + d.stats.hp);
});

console.log('---');
console.log(fails === 0 ? 'BHM/BALANCE: TUDO OK' : 'BHM/BALANCE: ' + fails + ' FALHAS');
`, ctx);
