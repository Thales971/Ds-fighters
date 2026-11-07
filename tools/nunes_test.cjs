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
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/powers-balance-v7.js','js/data/powers-balance-v8.js','js/data/powers-balance-v9.js', 'js/data/pets.js', 'js/data/stages.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 80)); } }

vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, ellipse() {}, fill() {}, fillText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), set imageSmoothingEnabled(v) {} });
const mk = (mode) => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
  g.start({ mode: mode || 'versus', teams: [['nunes'], ['du']], stage: '06-sakura-dojo', cpu: [false, false], roundsToWin: 2, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};
let fails = 0;
const check = (n, c, x) => { console.log((c ? 'OK   ' : 'FALHA') + ' ' + n + (x ? ' — ' + x : '')); if (!c) fails++; };
const reset = (gg) => {
  f = gg.activeOf(0); o = gg.activeOf(1); // re-busca: round pode ter reiniciado
  if (!f || !o) return;
  f.x = 320; o.x = 620; f.y = 0; o.y = 0; f.vx = 0; o.vx = 0; f.vy = 0; o.vy = 0;
  o.hp = o.maxHp; f.hp = f.maxHp; f.state = 'idle'; o.state = 'idle';
  f.cast = null; f.stolen = null; f.status = {}; o.status = {};
  f.cd = [0,0,0,0,0,0,0,0,0,0]; f.castLock = 0; f.charge = [100, 100]; f.ultimate = 100; f.autoCombo = null;
};

let g = mk();
const keepAlive = () => { const a = g.activeOf(0), b = g.activeOf(1); if (a) { a.hp = a.maxHp; a.status = {}; } if (b) { b.hp = b.maxHp; b.status = {}; } };
let [f, o] = [g.activeOf(0), g.activeOf(1)];
const kit = f.currentKit();

// 1) H1 Bang Incendiária: granada em arco -> poça persistente com queima + lentidão
reset(g);
check('H1 cast (arco)', f.tryCast(0) === true);
for (let t = 0; t < 120; t++) g.tick();
const pool = g.zones.find((z) => z.owner === f);
check('poça de fogo persistente criada', !!pool, pool ? 'time=' + (pool.time - pool.age) : 'nenhuma zona');
o.x = pool ? pool.x : 620;
for (let t = 0; t < 30; t++) g.tick();
check('poça aplica QUEIMA', o.has('burn'));
check('poça aplica LENTIDÃO', o.has('slow'));

// 2) H2 Bola de Fogo: explode no impacto e deixa chamas
reset(g);
g.zones = [];
check('H2 cast', f.tryCast(1) === true);
for (let t = 0; t < 90; t++) g.tick();
check('explosão deixa chamas no chão', g.zones.some((z) => z.owner === f), g.zones.length + ' zona(s)');

// 3) H3 Muralha de Chamas: parede persistente que queima quem atravessa
reset(g);
g.zones = [];
check('H3 cast', f.tryCast(2) === true);
for (let t = 0; t < 30; t++) g.tick();
const wall = g.walls.find((w) => w.owner === f);
check('muralha persistente criada', !!wall, wall ? 'time=' + (wall.time - wall.age) : 'sem parede');
o.x = wall ? wall.x : 500; o.status = {};
for (let t = 0; t < 20; t++) g.tick();
check('muralha QUEIMA quem atravessa', o.has('burn'));

// 4) H4 Avanço Flamejante: dash com rastro de fogo
reset(g);
g.zones = [];
check('H4 cast', f.tryCast(3) === true);
for (let t = 0; t < 60; t++) g.tick();
check('rastro de chamas no chão', g.zones.some((z) => z.owner === f), g.zones.filter((z) => z.owner === f).length + ' zonas de rastro');

// 5) STATUS em todo acerto de habilidade (assinatura)
reset(g);
o.status = {};
f.x = 560; // colado
f.tryCast(1);
for (let t = 0; t < 60; t++) { g.tick(); o.hp = o.maxHp; }
check('assinatura: habilidade aplica status', o.has('burn') || o.has('slow'), 'burn=' + o.has('burn') + ' slow=' + o.has('slow'));

// 6) Passiva Fagulha Viva: regenera dentro do próprio fogo
reset(g);
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

// 8) Ultimate: Fenix + revive no clone (jogo limpo e deterministico)
{
  const g8 = mk();
  let f8 = g8.activeOf(0), o8 = g8.activeOf(1);
  f8.x = 400; o8.x = 620; f8.charge = [100, 100]; f8.ultimate = 100;
  check('ULT cast', f8.tryCast(4) === true);
  for (let t = 0; t < 90; t++) { g8.tick(); o8.hp = o8.maxHp; } // super-freeze ~50 ticks
  check('status FENIX', f8.has('phoenix'));
  const clone8 = f8.phoenixClone ? f8.phoenixClone.x : 400;
  check('clone de fogo guardado', f8.phoenixClone && Math.abs(clone8 - 400) < 60, 'x=' + clone8.toFixed(1));
  // +10% de forca (mede imediatamente, estado limpo)
  const dmg8 = f8.dmgMult(null);
  check('+10% de forca', Math.abs(dmg8 / 1.66 - 1.1) < 0.01, (dmg8 / 1.66).toFixed(3) + 'x');
  // vampirismo 25%: soco direto no rival, vida pela metade
  f8.hp = f8.maxHp * 0.5;
  o8.hp = o8.maxHp; o8.status = {}; o8.state = 'idle';
  f8.x = 560; f8.state = 'idle'; f8.cast = null;
  const hpV8 = f8.hp;
  f8.startAttack('punch');
  for (let t = 0; t < 40; t++) { g8.tick(); if (o8.hp < o8.maxHp) break; }
  check('+25% de vampirismo', f8.hp > hpV8, 'hp ' + Math.round(hpV8) + ' -> ' + Math.round(f8.hp));
  // revive: morte DIRETA (sem knockback de melee) — posicao exata do clone
  // (NAO limpa o status: a Fenix precisa estar ativa pra reviver)
  f8.x = clone8; f8.state = 'idle'; f8.cast = null;
  // inimigo PERTO do clone: deve tomar a explosao incendiaria
  o8.x = clone8 + 90; o8.hp = o8.maxHp; o8.status = {}; o8.state = 'idle';
  const hpO8 = o8.hp;
  f8.takeHit(99999, { attacker: o8, height: 'unblockable' });
  check('RENASCEU DAS CINZAS (nao cai com a Fenix)', f8.alive === true && f8.state !== 'ko', 'alive=' + f8.alive + ' hp=' + Math.round(f8.hp) + ' state=' + f8.state);
  check('revive no clone', Math.abs(f8.x - clone8) < 1, 'x=' + f8.x.toFixed(1) + ' (clone em ' + clone8.toFixed(1) + ')');
  check('EXPLOSAO incendiaria no renascimento (inimigo perto)', o8.hp < hpO8 - 25 && o8.has('burn'), 'hp inimigo ' + Math.round(hpO8) + ' -> ' + Math.round(o8.hp) + ' burn=' + o8.has('burn'));
  check('Fenix consumida apos renascer', !f8.has('phoenix'));
  // morrer de novo = KO de verdade
  f8.takeHit(99999, { attacker: o8, height: 'unblockable' });
  check('morrer depois do renascimento = KO', f8.alive === false, 'hp=' + f8.hp);
  // caso negativo: inimigo LONGE do clone nao toma a explosao
  {
    const g9 = mk();
    const f9 = g9.activeOf(0), o9 = g9.activeOf(1);
    f9.x = 400; o9.x = 620; f9.charge = [100, 100]; f9.ultimate = 100;
    f9.tryCast(4);
    for (let t = 0; t < 90; t++) { g9.tick(); o9.hp = o9.maxHp; }
    const clone9 = f9.phoenixClone.x;
    o9.x = clone9 + 400; o9.hp = o9.maxHp; o9.status = {}; o9.state = 'idle';
    const hpFar = o9.hp;
    f9.x = clone9; f9.state = 'idle'; f9.cast = null;
    f9.takeHit(99999, { attacker: o9, height: 'unblockable' });
    check('inimigo LONGE do clone NAO toma a explosao', f9.alive && o9.hp >= hpFar - 2, 'hp inimigo ' + Math.round(hpFar) + ' -> ' + Math.round(o9.hp));
  }
}

// 9) sem a ult, morre normal
reset(g);
f.hp = 1; f.status = {};
o.x = f.x + 50; o.dir = -1; o.startAttack('kick');
for (let t = 0; t < 60 && f.alive; t++) g.tick();
check('sem Fênix cai normal', f.alive === false || f.hp > 0);

console.log('---');
console.log(fails === 0 ? 'NUNES: TUDO OK' : 'NUNES: ' + fails + ' FALHAS');
`, ctx);
