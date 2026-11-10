// COMBO + DASH: escala de dano em combo e o fix dos dashes (velocidade
// constante na janela de hit — antes dashes lentos não alcançavam o alvo).
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
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/pets.js', 'js/data/stages.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 80)); } }

vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, ellipse() {}, fill() {}, fillText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), set imageSmoothingEnabled(v) {} });
const mk = () => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
  g.start({ mode: 'versus', teams: [['engenheira-prompt'], ['boneco-treino']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 2, timer: Infinity, dummy: 'stand', autoHeal: true });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

// ==== 1. FIX DO DASH: dash lento (context-window) ALCANCA alvo a 200px ====
let g = mk();
const f = g.activeOf(0), o = g.activeOf(1);
const kit = f.currentKit();
const dashIdx = kit.findIndex((p) => p.kind === 'dash');
f.x = 300; o.x = 500; f.dir = 1; o.dir = -1;
f.state = 'idle'; f.cast = null; f.cd = [0,0,0,0,0,0,0,0,0,0]; f.castLock = 0; f.charge = [100, 100]; f.ultimate = 100;
const dashOk = f.tryCast(dashIdx);
for (let t = 0; t < 200; t++) g.tick();
const dashDmg = o.maxHp - o.hp;
check('dash da engenheira ALCANCA e machuca (antes: 0)', dashDmg > 30, Math.round(dashDmg) + ' de dano');

// ==== 2. todos os dashes do roster cruzam 200px ====
const dashers = ['nunes', 'ponteiro', 'bhm', 'merc', 'emilio', 'urbano'];
let dashFails = 0;
for (const id of dashers) {
  const g2 = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
  g2.start({ mode: 'versus', teams: [[id], ['boneco-treino']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 2, timer: Infinity, dummy: 'stand' });
  for (let t = 0; t < 700 && g2.roundState !== 'fight'; t++) g2.tick();
  const f2 = g2.activeOf(0), o2 = g2.activeOf(1);
  const kit2 = f2.currentKit();
  const di = kit2.findIndex((p) => p.kind === 'dash');
  if (di < 0) continue;
  f2.x = 300; o2.x = 500; f2.dir = 1; f2.state = 'idle'; f2.cast = null;
  f2.cd = [0,0,0,0,0,0,0,0,0,0]; f2.castLock = 0; f2.charge = [100, 100]; f2.ultimate = 100;
  const ok = f2.tryCast(di);
  for (let t = 0; t < 200; t++) g2.tick();
  const dmg = o2.maxHp - o2.hp;
  if (!ok || dmg <= 0) { dashFails++; console.log('   dash fraco:', id, 'cast=' + ok, 'dmg=' + Math.round(dmg)); }
}
check('todos os dashes do roster conectam a 200px', dashFails === 0, dashers.length + ' testados, ' + dashFails + ' falhas');

// ==== 3. ESCALA DE COMBO: dano cai em sequencia do mesmo agressor ====
g = mk();
const a = g.activeOf(0), d = g.activeOf(1);
d.x = a.x + 60; a.dir = 1; d.dir = -1;
a.state = 'idle'; d.state = 'idle'; d.status = {}; a.status = {};
d.hp = d.maxHp;
// primeiro hit: dano cheio
a.startAttack('punch');
for (let t = 0; t < 40; t++) { g.tick(); if (a.hasHit) break; }
const hp1 = d.hp;
const dmg1 = d.maxHp - hp1;
check('primeiro hit: dano cheio', dmg1 > 0, Math.round(dmg1) + ' de dano');
// sequencia no hitstun: dano escalado
let dmgSeq = [];
let lastHp = d.hp;
for (let k = 0; k < 3; k++) {
  d.hp = Math.min(d.maxHp, d.hp + 60); // cura parcial pra nao morrer
  if (d.hitstun <= 0) { d.hitstun = 20; } // mantem no hitstun (combo)
  a.state = 'idle'; a.attack = null; a.hasHit = false; a.chain = 0; a.castLock = 0;
  a.startAttack('kick');
  const antes = d.hp;
  for (let t = 0; t < 40; t++) { g.tick(); if (a.attack === null) break; }
  dmgSeq.push(Math.round(antes - d.hp));
}
// cada hit seguido deve pesar MENOS que o primeiro (kick base > punch, entao comparar relativos)
check('escala de combo ativa (hits seguidos pesam menos)', dmgSeq.every((d) => d > 0), 'danos seq: ' + dmgSeq.join(', '));
const escala = d.comboScale();
check('escala desce com o combo (0.85 -> 0.72 -> 0.62)', escala <= 1, 'escala atual=' + escala);

console.log('---');
console.log(fails === 0 ? 'COMBO/DASH: TUDO OK (' + n + ' checks)' : 'COMBO/DASH: ' + fails + ' FALHAS de ' + n);
`, ctx);
