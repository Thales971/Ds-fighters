// PONTEIRO INTENSIVO: edge cases do Relojoeiro — interações de congelamento,
// roubo de kit, snapshot online, IA, encadeamentos e limites do time-stop.
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
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js','js/data/powers-balance-v10.js','js/data/powers-balance-v11.js','js/data/powers-balance-v12.js', 'js/data/pets.js', 'js/data/stages.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 80)); } }

vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, ellipse() {}, fill() {}, fillText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), set imageSmoothingEnabled(v) {} });
const mk = (opp) => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
  g.start({ mode: 'versus', teams: [['ponteiro'], [opp || 'du']], stage: '06-sakura-dojo', cpu: [false, false], roundsToWin: 2, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const reset = (g, f, o) => { g.zones = []; g.walls = []; f.x = 320; o.x = 620; f.y = 0; o.y = 0; f.hp = f.maxHp; o.hp = o.maxHp; f.state = 'idle'; o.state = 'idle'; f.cast = null; f.stolen = null; f.status = {}; o.status = {}; f.cd = [0,0,0,0,0,0,0,0,0,0]; f.castLock = 0; f.charge = [100, 100]; f.ultimate = 100; };

// ==== 1. as 5 habilidades em sequencia rapida (anti-spam respeitado) ====
let g = mk();
let f = g.activeOf(0), o = g.activeOf(1);
let allOk = true;
for (let i = 0; i < 5; i++) {
  f.cd = [0,0,0,0,0,0,0,0,0,0]; f.castLock = 0; f.state = 'idle'; f.cast = null; f.charge = [100,100]; f.ultimate = 100;
  if (!f.tryCast(i)) allOk = false;
  for (let t = 0; t < 110; t++) { g.tick(); o.hp = o.maxHp; }
}
check('as 5 habilidades castam em sequencia', allOk);

// ==== 2. PENDULO: lentidao real (velocidade do alvo cai ~45%) ====
reset(g, f, o);
const velBase = o.speedMult(); // BASE limpa, antes de qualquer cast
f.tryCast(0);
for (let t = 0; t < 40; t++) g.tick();
const velLenta = o.speedMult();
check('Pendulo deixa o alvo LENTO de verdade', velLenta < velBase * 0.8, 'velocidade ' + velBase.toFixed(2) + ' -> ' + velLenta.toFixed(2));

// ==== 3. ROBO DE CORDA: bloqueia projétil e expira sozinho ====
reset(g, f, o);
f.tryCast(1);
for (let t = 0; t < 20; t++) g.tick();
check('robo invocado', g.walls.some((w) => w.owner === f));
for (let t = 0; t < 750; t++) g.tick();
check('robo expira sozinho (~12s)', !g.walls.some((w) => w.owner === f));

// ==== 4. AMPULHETA: congela e o congelamento impede agir ====
g = mk(); f = g.activeOf(0); o = g.activeOf(1);
reset(g, f, o);
f.tryCast(3);
for (let t = 0; t < 60; t++) g.tick();
const trap = g.zones.find((z) => z.owner === f);
o.x = trap.x;
for (let t = 0; t < 30; t++) g.tick();
check('ampulheta CONGELA', o.has('freeze'));
const podiaAgir = o.canAct();
check('congelado NAO pode agir', !podiaAgir, 'canAct=' + podiaAgir);
// sai da armadilha e o congelamento expira
o.x = 200;
for (let t = 0; t < 200; t++) g.tick();
check('congelamento do trap expira (fora da armadilha)', !o.has('freeze') && o.canAct(), 'freeze=' + o.has('freeze'));

// ==== 5. ULT: Parar o Relógio congela; Ponteiro AGE durante ====
g = mk(); f = g.activeOf(0); o = g.activeOf(1);
reset(g, f, o);
f.tryCast(4);
for (let t = 0; t < 100; t++) g.tick();
check('oponente congelado pela ULT', o.has('freeze') || o.has('paralyze'));
// o Ponteiro pode agir durante o congelamento
const euAgo = f.canAct();
check('Ponteiro AGE durante o time-stop', euAgo, 'canAct=' + euAgo);
// o oponente não pode
const oAgo = o.canAct();
check('oponente TRAVADO durante o time-stop', !oAgo, 'canAct=' + oAgo);

// ==== 6. Campo Lento passivo nao afeta o proprio Ponteiro ====
reset(g, f, o);
o.x = f.x + 100;
for (let t = 0; t < 30; t++) g.tick();
check('Campo Lento afeta so o OPONENTE', o.has('slow') && !f.has('slow'), 'opp slow=' + o.has('slow') + ' self slow=' + f.has('slow'));

// ==== 7. Roubo de kit do Iales: kit do Ponteiro roubado funciona ====
g = mk('iales'); const ia = g.activeOf(1); const pt = g.activeOf(0);
check('luta contra Iales roda', g.roundState === 'fight');
ia.x = 300; pt.x = 340; pt.status = {}; ia.status = {};
ia.charge = [100, 100]; ia.ultimate = 100; ia.cd = [0,0,0,0,0,0,0,0,0,0]; ia.castLock = 0; ia.state = 'idle';
const roubou = ia.tryCast(2); // Ctrl+C
for (let t = 0; t < 60 && !ia.stolen; t++) g.tick();
check('Iales roubou o kit do Ponteiro', roubou && ia.stolen && ia.stolen.from === 'ponteiro', 'from=' + (ia.stolen && ia.stolen.from));
check('kit roubado tem as habilidades do Ponteiro', ia.currentKit().some((p) => p.id === 'pendulo'), ia.currentKit().slice(0, 5).map((p) => p.id).join(','));

// ==== 8. Snapshot online com zonas/robô/congelamento ====
g = mk(); f = g.activeOf(0); o = g.activeOf(1);
reset(g, f, o);
f.tryCast(1); f.tryCast(3);
for (let t = 0; t < 40; t++) g.tick();
const snap = g.snapshot();
check('snapshot com robo+armadilha nao crasha', snap && Number.isInteger(snap.t), 't=' + snap.t);

// ==== 9. IA controla o Ponteiro (900 ticks) ====
g = mk(); g.cfg.cpu[0] = true;
let ticks = 0;
for (let t = 0; t < 900; t++) { g.tick(); ticks++; }
check('IA controla Ponteiro sem crash', ticks === 900);

// ==== 10. Morte súbita: Campo Lento + fogo do modo juntos ====
g = mk();
g.round = 3; g.teamWins = [1, 1]; g.beginRound();
for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
check('Ponteiro em morte súbita sem crash', g.roundState === 'fight');

// ==== 11. Time-stop + inimigo com IALES (imune a status) ====
g = mk('iales'); f = g.activeOf(0); const ial = g.activeOf(1);
reset(g, f, ial);
f.tryCast(4);
for (let t = 0; t < 100; t++) g.tick();
check('IALES e IMUNE ao time-stop (campeao)', !ial.has('freeze') && !ial.has('paralyze'), 'freeze=' + ial.has('freeze') + ' paralyze=' + ial.has('paralyze'));

// ==== 12. HUD/ícones: atlas tem as 5 linhas preenchidas (via ART_SHEETS) ====
check('atlas do Ponteiro registrado no fx', !!ART_SHEETS['abil:ponteiro'] && !!ART_SHEETS['fx2:ponteiro']);

console.log('---');
console.log(fails === 0 ? 'PONTEIRO INTENSIVO: TUDO OK (' + n + ' checks)' : 'PONTEIRO INTENSIVO: ' + fails + ' FALHAS de ' + n);
`, ctx);
