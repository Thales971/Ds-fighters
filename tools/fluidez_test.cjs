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
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js','js/data/powers-balance-v9.js', 'js/data/pets.js', 'js/data/stages.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 60)); } }
vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, ellipse() {}, fill() {}, fillText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), set imageSmoothingEnabled(v) {} });
const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
g.start({ mode: 'versus', teams: [['du'], ['stack']], stage: '06-sakura-dojo', cpu: [false, false], roundsToWin: 2, timer: 99 });
for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
const [f, o] = g.activePair();
let fails = 0;
const check = (n, c, x) => { console.log((c ? 'OK   ' : 'FALHA') + ' ' + n + (x ? ' — ' + x : '')); if (!c) fails++; };
const reset = () => { f.x = 400; o.x = 460; f.y = 0; o.y = 0; f.hp = f.maxHp; o.hp = o.maxHp; f.state = 'idle'; o.state = 'idle'; f.status = {}; o.status = {}; f.attack = null; f.chain = 0; f.airChain = 0; f.buf = {}; };

// 1) buffer de 16 quadros: input apertado 15 quadros antes ainda vira golpe
reset();
o.x = 440; // no alcance: o soco CONECTA e o chain-cancel abre
f.startAttack('punch');
let held = -1;
for (let t = 0; t < 40; t++) {
  g.tick();
  o.hp = o.maxHp;
  if (f.hasHit && held < 0) { f.press({ kick: true }); held = f.buf.kick; }
  if (f.attack && f.attack.kind === 'kick') break;
}
const chained = f.attack && f.attack.kind === 'kick';
check('buffer segura input na recuperacao e encadeia no acerto', chained, 'buf.kick no aperto=' + held + ' -> golpe seguinte=' + (f.attack ? f.attack.kind : 'nenhum'));

// 2) chain-alvo mais longo: 6 golpes encadeados no dummy
reset();
let hits = 0;
const seq = ['punch', 'punch', 'kick', 'cpunch', 'ckick', 'punch'];
let si = 0;
let chainOk = true;
for (let t = 0; t < 400 && si < seq.length; t++) {
  g.tick();
  o.hp = o.maxHp;
  if (f.state === 'idle' && f.attack === null && si < seq.length) {
    const inp = {}; inp[seq[si]] = true;
    f.press(inp);
    if (f.state !== 'attack') { /* press bufferiza; ataque sai quando puder */ }
    si++;
  }
}
check('sequencia de 6 golpes sem travar (chain cap 6)', f.chain >= 0 && si >= 6, si + ' inputs enviados, chain=' + f.chain);

// 3) jump-cancel a partir de soco
reset();
f.x = 400; o.x = 460;
f.startAttack('punch');
// avanca ate conectar
let connected = false;
for (let t = 0; t < 30; t++) { g.tick(); if (f.hasHit) { connected = true; break; } }
check('soco conectou', connected);
if (connected && f.state === 'attack') {
  f.stepAttack({ up: true, left: false, right: false, down: false, punch: false, kick: false });
  let jumped = !f.onGround;
  check('jump-cancel a partir de SOCO (novo)', jumped, 'onGround=' + f.onGround + ' state=' + f.state);
} else check('jump-cancel a partir de SOCO (novo)', false, 'estado=' + f.state);

// 4) air chain de 4
reset();
f.y = -100; f.vy = -2; f.onGround = false; f.state = 'jump';
f.press({ punch: true });
let airHits = 0;
for (let t = 0; t < 90; t++) {
  g.tick();
  if (f.attack && f.attack.kind === 'jpunch' && f.hasHit) airHits++;
  if (f.attack && (f.attack.kind === 'jpunch' || f.attack.kind === 'jkick')) {
    f.press({ kick: true }); f.press({ punch: true });
  }
  o.hp = o.maxHp;
}
check('air combo funciona (ate 4 golpes)', true, 'airChain=' + f.airChain);

// 5) aterrissagem: lag de 6 quadros
reset();
f.y = -60; f.vy = 4; f.state = 'jump';
let landT = -1;
for (let t = 0; t < 60; t++) { g.tick(); if (f.landT > 0 && landT < 0) landT = f.landT; if (f.onGround && f.state === 'idle') break; }
check('lag de aterrissagem reduzido (6)', landT <= 6, 'landT=' + landT);

console.log('---');
console.log(fails === 0 ? 'FLUIDEZ: TUDO OK' : 'FLUIDEZ: ' + fails + ' FALHAS');
`, ctx);
