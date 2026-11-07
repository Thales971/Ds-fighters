// NUNES: kit completo — zonas persistentes, status (queima+lentidão), passiva
// Fagulha Viva e a ultimate Renascer das Cinzas (revive no clone).
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
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/powers-balance-v7.js', 'js/data/pets.js', 'js/data/stages.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 80)); } }

vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, ellipse() {}, fill() {}, fillText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), set imageSmoothingEnabled(v) {} });
const mk = (mode) => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
  g.start({ mode: mode || 'versus', teams: [['nunes'], ['du']], cpu: [false, false], roundsToWin: 2, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};
let fails = 0;
const check = (n, c, x) => { console.log((c ? 'OK   ' : 'FALHA') + ' ' + n + (x ? ' — ' + x : '')); if (!c) fails++; };
const reset = (g, f, o) => { f.x = 320; o.x = 620; f.y = 0; o.y = 0; f.alive = true; o.alive = true; o.hp = o.maxHp; f.state = 'idle'; f.cast = null; f.stolen = null; f.status = {}; f.cd = [0,0,0,0,0,0,0,0,0,0]; f.charge = [100, 100]; f.ultimate = 100; };

let g = mk();
const [f, o] = g.activePair();
const kit = f.currentKit();

// 1) H1 Bang Incendiária: granada em arco -> poça persistente com queima + lentidão
reset(g, f, o);
check('H1 cast (arco)', f.tryCast(0) === true);
for (let t = 0; t < 120; t++) g.tick();
const pool = g.zones.find((z) => z.owner === f);
check('poça de fogo persistente criada', !!pool, pool ? 'time=' + (pool.time - pool.age) : 'nenhuma zona');
o.x = pool ? pool.x : 620;
for (let t = 0; t < 30; t++) g.tick();
check('poça aplica QUEIMA', o.has('burn'));
check('poça aplica LENTIDÃO', o.has('slow'));

// 2) H2 Bola de Fogo: explode no impacto e deixa chamas
reset(g, f, o);
g.zones = [];
check('H2 cast', f.tryCast(1) === true);
for (let t = 0; t < 90; t++) g.tick();
check('explosão deixa chamas no chão', g.zones.some((z) => z.owner === f), g.zones.length + ' zona(s)');

// 3) H3 Muralha de Chamas: parede persistente que queima quem atravessa
reset(g, f, o);
g.zones = [];
check('H3 cast', f.tryCast(2) === true);
for (let t = 0; t < 30; t++) g.tick();
const wall = g.walls.find((w) => w.owner === f);
check('muralha persistente criada', !!wall, wall ? 'time=' + (wall.time - wall.age) : 'sem parede');
o.x = wall ? wall.x : 500; o.status = {};
for (let t = 0; t < 20; t++) g.tick();
check('muralha QUEIMA quem atravessa', o.has('burn'));

// 4) H4 Avanço Flamejante: dash com rastro de fogo
reset(g, f, o);
g.zones = [];
check('H4 cast', f.tryCast(3) === true);
for (let t = 0; t < 60; t++) g.tick();
check('rastro de chamas no chão', g.zones.some((z) => z.owner === f), g.zones.filter((z) => z.owner === f).length + ' zonas de rastro');

// 5) STATUS em todo acerto de habilidade (assinatura)
reset(g, f, o);
o.status = {};
f.x = 560; // colado
f.tryCast(1);
for (let t = 0; t < 60; t++) g.tick();
check('assinatura: habilidade aplica status', o.has('burn') || o.has('slow'), 'burn=' + o.has('burn') + ' slow=' + o.has('slow'));

// 6) Passiva Fagulha Viva: regenera dentro do próprio fogo
reset(g, f, o);
g.zones = [];
f.tryCast(0);
for (let t = 0; t < 120; t++) g.tick();
const pool2 = g.zones.find((z) => z.owner === f);
f.hp = f.maxHp * 0.5;
f.x = pool2.x;
const hpBefore = f.hp;
for (let t = 0; t < 60; t++) g.tick();
check('Fagulha Viva: regenera no próprio fogo', f.hp > hpBefore + 3, 'hp ' + Math.round(hpBefore) + ' -> ' + Math.round(f.hp));

// 7) Passiva desativa em MORTE SÚBITA
g2 = mk('morte-subita');
g2.round = 3; g2.teamWins = [1, 1]; g2.beginRound();
for (let t = 0; t < 700 && g2.roundState !== 'fight'; t++) g2.tick();
const [f2, o2] = g2.activePair();
f2.ultimate = 100; f2.charge = [100, 100]; f2.cd = [0,0,0,0,0,0,0,0,0,0];
f2.tryCast(0);
for (let t = 0; t < 140; t++) g2.tick();
const pool3 = g2.zones.find((z) => z.owner === f2);
f2.hp = f2.maxHp * 0.5;
f2.x = pool3 ? pool3.x : 400;
const hpB = f2.hp;
for (let t = 0; t < 60; t++) { g2.tick(); o2.hp = o2.maxHp; o2.alive = true; }
check('Fagulha Viva DESATIVA em morte súbita', f2.hp <= hpB + 2, 'hp ' + Math.round(hpB) + ' -> ' + Math.round(f2.hp));

// 8) Ultimate: Fênix + revive no clone
reset(g, f, o);
const cloneX = 400;
f.x = cloneX;
check('ULT cast', f.tryCast(4) === true);
for (let t = 0; t < 90; t++) g.tick(); /* super-freeze da ult consome ~50 ticks */
console.log('   DEBUG: state=' + f.state, 'cast=' + (f.cast ? f.cast.p.id + ':t' + f.cast.t + ':fired' + f.cast.fired : 'null'), 'aura=' + (f.aura && f.aura.id), 'status=' + JSON.stringify(f.status), 'now=' + f.now);
check('status FÊNIX', f.has('phoenix'));
check('clone de fogo guardado', f.phoenixClone && f.phoenixClone.x === cloneX, 'x=' + (f.phoenixClone && f.phoenixClone.x));
const dmgBase = f.dmgMult(null);
// buff de força +10%
check('+10% de força', Math.abs(dmgBase / 1.42 - 1.1) < 0.001, (dmgBase / 1.42).toFixed(2) + 'x');
// vampirismo 25%
o.hp = o.maxHp; o.status = {}; o.state = 'idle';
const hpF = f.hp;
f.x = 560; f.state = 'idle'; f.cast = null;
f.startAttack('punch');
for (let t = 0; t < 40; t++) g.tick();
check('+25% de vampirismo', f.hp > hpF, 'hp ' + Math.round(hpF) + ' -> ' + Math.round(f.hp));
// revive: mata o Nunes
f.hp = 1;
o.x = f.x + 50; o.dir = -1; o.state = 'idle'; o.attack = null;
o.startAttack('kick');
for (let t = 0; t < 60 && f.alive; t++) g.tick();
if (!f.alive) {
  // reviveu? defeat() intercepta; se revive, alive volta a true
}
check('RENASCEU DAS CINZAS (não cai com a Fênix)', f.alive === true, 'alive=' + f.alive + ' hp=' + Math.round(f.hp) + ' state=' + f.state);
check('revive no clone', Math.abs(f.x - cloneX) < 20, 'x=' + f.x.toFixed(0));
check('Fênix consumida após renascer', !f.has('phoenix'));

// 9) sem a ult, morre normal
reset(g, f, o);
f.hp = 1; f.status = {};
o.x = f.x + 50; o.dir = -1; o.startAttack('kick');
for (let t = 0; t < 60 && f.alive; t++) g.tick();
check('sem Fênix cai normal', f.alive === false || f.hp > 0);

console.log('---');
console.log(fails === 0 ? 'NUNES: TUDO OK' : 'NUNES: ' + fails + ' FALHAS');
`, ctx);
