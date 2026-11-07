// MORTE SÚBITA: paredes de fogo ativam, avançam, causam dano contínuo e podem matar.
const fs = require('fs');
const vm = require('vm');
const ctx = {
  console, Image: class { set src(v) {} }, Math, Date,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, skinFor: () => 0 },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => ({ getContext: () => ({}), style: {} }), addEventListener() {} },
  window: { addEventListener() {} },
  setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16),
};
ctx.globalThis = ctx;
vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/pets.js', 'js/data/stages.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO ao carregar', f, e.message.slice(0, 60)); } }
const api = vm.runInContext('({Game,FIGHTERS})', ctx);
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, ellipse() {}, fill() {}, fillText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), set imageSmoothingEnabled(v) {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }) });
const canvas = { width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } };

const g = new api.Game(canvas);
g.start({ mode: 'morte-subita', teams: [['du'], ['du']], cpu: [false, false], roundsToWin: 2, timer: 99 });
for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
const [a, b] = g.activePair();
console.log('round 1 -> inferno:', g.inferno === null ? 'NULL (OK — fogo so no round final)' : 'FALHOU (fogo no round 1)');
// pula pro round final (3)
g.round = 3; g.teamWins = [1, 1]; g.beginRound();
for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
console.log('round 3 -> inferno:', JSON.stringify(g.inferno));

// 1) aviso aos 360 ticks de luta (ainda inativo)
for (let t = 0; t < 400 && g.inferno.t < 360; t++) g.tick();
console.log('aviso aos 360 ticks (ainda inativo):', g.inferno.t >= 360 && !g.inferno.active ? 'OK' : 'FALHOU');

// 2) ativa aos 720
for (let t = 0; t < 400 && !g.inferno.active; t++) g.tick();
console.log('ativa apos t=720: active =', g.inferno.active, g.inferno.active ? 'OK' : 'FALHOU');

// 3) paredes avançam
const l0 = g.inferno.left, r0 = g.inferno.right;
for (let t = 0; t < 300; t++) g.tick();
console.log('paredes: left', l0.toFixed(0), '->', g.inferno.left.toFixed(0), '| right', r0.toFixed(0), '->', g.inferno.right.toFixed(0),
  (g.inferno.left > l0 && g.inferno.right < r0) ? 'OK' : 'FALHOU');

// 4) dano continuo: coloca o lutador A na parede
a.x = g.inferno.left - 10;
const hp0 = a.hp;
for (let t = 0; t < 60; t++) { g.tick(); a.x = Math.min(a.x, g.inferno.left - 5); } // mantem dentro do fogo
console.log('dano continuo: hp', Math.round(hp0), '->', Math.round(a.hp), a.hp < hp0 - 10 ? 'OK' : 'FALHOU');
console.log('burn aplicado:', a.has('burn') ? 'OK' : 'FALHOU');

// 4b) calor da arena: dano continuo nos DOIS sem tocar o fogo
a.x = 480; b.x = 520;
const hpA = a.hp, hpB = b.hp;
for (let t = 0; t < 300; t++) g.tick();
console.log('calor da arena (dano nos dois): A', Math.round(hpA), '->', Math.round(a.hp), '| B', Math.round(hpB), '->', Math.round(b.hp),
  (a.hp < hpA - 3 && b.hp < hpB - 3) ? 'OK' : 'FALHOU');

// 4c) medidor mais rapido com fogo ativo
a.ultimate = 0; a.charge = [0, 0];
const u0 = a.ultimate;
a.gain(true, 1);
const g1 = a.ultimate - u0;
const infSave = g.inferno.active; g.inferno.active = false;
a.ultimate = 0;
a.gain(true, 1);
const g2 = a.ultimate;
g.inferno.active = infSave;
console.log('medidor: com fogo', g1.toFixed(2), 'vs sem fogo', g2.toFixed(2), (g1 > g2 * 1.3) ? 'OK (1.6x)' : 'FALHOU');

// 5) fogo mata: segura o A na parede ate cair (B sempre com HP cheio)
let ko = false;
for (let t = 0; t < 3000 && !ko; t++) {
  g.tick();
  b.hp = b.maxHp; b.alive = true;
  if (a.alive) a.x = Math.min(a.x, g.inferno.left - 5);
  else ko = true;
}
console.log('morte pelo fogo:', ko ? 'OK (K.O. por queimadura)' : 'FALHOU');

// 6) gap minimo trava no centro
for (let t = 0; t < 5000 && !g.matchOver; t++) { g.tick(); b.hp = b.maxHp; b.alive = true; }
console.log('gap final:', Math.round(g.inferno.right - g.inferno.left), '(esperado ~230)');
console.log('roundState:', g.roundState);
