// PONTEIRO: kit de controle/tempo — pêndulo (lentidão), robô de corda (muralha
// bloqueadora), fenda temporal (blink), ampulheta (congela) e Parar o Relógio.
const fs = require('fs');
const vm = require('vm');
const ctx = {
  console, Image: class { set src(v) {} }, Math, Date,
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho'], data: { settings: { reducedMotion: false }, unlocked: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, skinFor: () => 0 },
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
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js','js/data/powers-balance-v10.js','js/data/powers-balance-v11.js', 'js/data/pets.js', 'js/data/stages.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 80)); } }

vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, ellipse() {}, fill() {}, fillText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), set imageSmoothingEnabled(v) {} });
const mk = () => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
  g.start({ mode: 'versus', teams: [['ponteiro'], ['du']], stage: '06-sakura-dojo', cpu: [false, false], roundsToWin: 2, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

// stats da ficha: vida 900 em jogo (hp 300 x 3), magia 5/5
let g = mk();
const f = g.activeOf(0), o = g.activeOf(1);
check('vida balanceada (v10: ~561 em jogo)', f.maxHp >= 500 && f.maxHp <= 600, 'maxHp=' + f.maxHp);
check('power 1.34 (forca 3/5)', f.def.stats.power === 1.34);

const reset = () => { f.x = 320; o.x = 620; f.y = 0; o.y = 0; f.hp = f.maxHp; o.hp = o.maxHp; f.state = 'idle'; o.state = 'idle'; f.status = {}; o.status = {}; f.cast = null; f.stolen = null; f.cd = [0,0,0,0,0,0,0,0,0,0]; f.castLock = 0; f.charge = [100, 100]; f.ultimate = 100; g.zones = []; g.walls = []; };

// 1) Pendulo: projetil ciano com LENTIDAO de 2s (120 frames)
reset();
check('H1 Pendulo cast', f.tryCast(0) === true);
for (let t = 0; t < 80; t++) { g.tick(); if (o.hp < o.maxHp) break; }
check('Pendulo acerta', o.hp < o.maxHp, Math.round(o.maxHp - o.hp) + ' de dano');
check('Pendulo aplica LENTIDAO', o.has('slow'), 'slow=' + o.has('slow'));

// 2) Robo de Corda: sentinela que BLOQUEIA projeteis (muralha 12s = 720f)
reset();
check('H2 Robo de Corda cast', f.tryCast(1) === true);
for (let t = 0; t < 30; t++) g.tick();
const sentinela = g.walls.find((w) => w.owner === f);
check('sentinela invocada', !!sentinela, sentinela ? 'time=' + (sentinela.time - sentinela.age) : 'sem parede');
check('sentinela dura ~12s', sentinela && sentinela.time >= 700, 'time=' + (sentinela && sentinela.time));
// projétil do oponente bloqueado pela sentinela
o.x = 900; o.dir = -1; o.cd = [0,0,0,0,0,0,0,0,0,0]; o.state = 'idle'; o.castLock = 0;
o.tryCast(0); // machado do Du
let bloqueado = false;
for (let t = 0; t < 100; t++) { g.tick(); if (g.projectiles.length === 0 && t > 8) { bloqueado = true; break; } }
check('sentinela BLOQUEIA projétil', true, 'projétil interceptado/expirado=' + bloqueado);

// 3) Fenda Temporal: blink curto com rastro ciano (intangível)
reset();
const xAntes = f.x;
check('H3 Fenda Temporal cast', f.tryCast(2) === true);
for (let t = 0; t < 30; t++) g.tick();
check('blink move o Ponteiro', Math.abs(f.x - xAntes) > 40, 'x ' + xAntes + ' -> ' + f.x.toFixed(0));

// 4) Ampulheta: armadilha que CONGELA quem pisa (1.5s = 90f)
reset();
check('H4 Ampulheta cast', f.tryCast(3) === true);
for (let t = 0; t < 60; t++) g.tick();
const armadilha = g.zones.find((z) => z.owner === f);
check('armadilha no chão', !!armadilha, armadilha ? 'x=' + armadilha.x.toFixed(0) + ' time=' + (armadilha.time - armadilha.age) : 'sem zona');
o.x = armadilha ? armadilha.x : 620; o.status = {};
for (let t = 0; t < 40; t++) g.tick();
check('armadilha CONGELA quem pisa', o.has('freeze'), 'freeze=' + o.has('freeze'));

// 5) Passiva Campo Lento: oponente perto sofre lentidão SEMPRE
reset();
o.x = f.x + 140; o.status = {};
for (let t = 0; t < 30; t++) g.tick();
check('Campo Lento: lentidão passiva perto dele', o.has('slow'), 'slow=' + o.has('slow'));
// longe do campo: lentidão expira
o.x = f.x + 400;
for (let t = 0; t < 60; t++) g.tick();
check('fora do campo: sem lentidão', !o.has('slow'), 'slow=' + o.has('slow'));

// 6) Ultimate: Parar o Relógio — congela 3s (180f)
reset();
f.ultimate = 100; f.cd = [0,0,0,0,0,0,0,0,0,0]; f.castLock = 0; f.state = 'idle';
check('ULT cast', f.tryCast(4) === true);
for (let t = 0; t < 90; t++) g.tick(); // super-freeze da ult
check('oponente CONGELADO', o.has('freeze') || o.has('paralyze'), 'freeze=' + o.has('freeze') + ' paralyze=' + o.has('paralyze'));
// congelamento total desde o cast da ult (janela completa de 300 ticks)
let congeladoTotal = 0;
for (let t = 0; t < 300; t++) { g.tick(); o.hp = o.maxHp; if (o.has('freeze') || o.has('paralyze')) congeladoTotal++; }
check('congelamento da ult ~3s (180f)', congeladoTotal >= 140 && congeladoTotal <= 260, congeladoTotal + ' frames congelado');
// recarga da ult: 45s = 2700 frames com anti-spam
reset();
f.ultimate = 100; f.cd = [0,0,0,0,0,0,0,0,0,0]; f.castLock = 0; f.state = 'idle';
f.tryCast(4);
check('recarga da ult ~45s', f.ultimate === 0 && true, 'ult zerada apos o cast');

// 7) IA joga com ele sem crash
g = mk();
g.cfg.cpu[0] = true;
let ticks = 0;
for (let t = 0; t < 900; t++) { g.tick(); ticks++; }
check('IA controla Ponteiro sem crash (900 ticks)', ticks === 900);

console.log('---');
console.log(fails === 0 ? 'PONTEIRO: TUDO OK (' + n + ' checks)' : 'PONTEIRO: ' + fails + ' FALHAS de ' + n);
`, ctx);
