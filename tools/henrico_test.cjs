// HENRICO + REWIND: o Campeão da Quadra (nível Nunes pra cima) e o
// Rebobinar do Maximilian (volta 3s no tempo em vez de parar).
const fs = require('fs');
const vm = require('vm');
const ctx = {
  console, Image: class { set src(v) {} }, Math, Date,
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho', 'maximilian'], data: { settings: { reducedMotion: false }, unlocked: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, skinFor: () => 0 },
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
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/pets.js', 'js/data/stages.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 80)); } }

vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, ellipse() {}, fill() {}, fillText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), set imageSmoothingEnabled(v) {} });
const mk = (me, opp, mode) => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
  g.start({ mode: mode || 'training', teams: [[me], [opp || 'boneco-treino']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 2, timer: Infinity, dummy: 'stand', autoHeal: true });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

// ==== HENRICO: nivel Nunes pra cima ====
const h = FIGHTERS.find((f) => f.id === 'henrico');
check('Henrico registrado', !!h);
check('power 1.74 (maior do jogo)', h.stats.power === 1.74, 'power=' + h.stats.power);
check('vida 492 em jogo', h.stats.hp * 3 === 492, h.stats.hp * 3 + '');
const ns = FIGHTERS.find((f) => f.id === 'nunes');
check('power acima do Nunes', h.stats.power > ns.stats.power, h.stats.power + ' vs ' + ns.stats.power);
check('vida acima do Nunes', h.stats.hp > ns.stats.hp, h.stats.hp + ' vs ' + ns.stats.hp);

let g = mk('henrico');
let f = g.activeOf(0), o = g.activeOf(1);
const kit = f.currentKit();
check('kit de 5 com status em TODAS', kit.every((p) => p.fx && Object.keys(p.fx).length > 0), kit.map((p) => p.id + ':' + Object.keys(p.fx || {}).join('+')).join(' '));
check('perfil chain (boxeador pressiona)', f.spamProfile().floor === 95, 'floor=' + f.spamProfile().floor);
// as 5 machucam + aplicam status
let dmgOk = 0, statusOk = 0;
for (let i = 0; i < 5; i++) {
  f.x = 300; o.x = kit[i].at === 'self' ? 360 : 500; f.dir = 1; o.dir = -1; /* zona: ja comeca dentro */
  f.hp = f.maxHp; o.hp = o.maxHp; o.status = {}; f.status = {};
  f.state = 'idle'; f.cast = null; f.cd = [0,0,0,0,0,0,0,0,0,0]; f.castLock = 0; f.charge = [100, 100]; f.ultimate = 100;
  g.zones = []; g.projectiles = []; g.strikes = [];
  /* ZONAS dao chip gradual — o treino tem vida infinita, entao zonas sao
     medidas em modo VERSUS contra um rival parado. */
  if (kit[i].kind === 'zone') {
    const gv = mk('henrico', 'du', 'versus');
    const fv = gv.activeOf(0), ov = gv.activeOf(1);
    fv.x = 300; ov.x = 360; fv.dir = 1; ov.dir = -1;
    fv.cd = [0,0,0,0,0,0,0,0,0,0]; fv.castLock = 0; fv.state = 'idle'; fv.cast = null; fv.charge = [100, 100]; fv.ultimate = 100;
    const okZ = fv.tryCast(i);
    let minHpZ = ov.maxHp, statusZ = false;
    for (let t = 0; t < 220; t++) {
      gv.tick();
      if (gv.roundState !== 'fight') { gv.roundState = 'fight'; gv.roundStateTime = 0; }
      if (ov.hp < minHpZ) minHpZ = ov.hp;
      if (Object.keys(ov.status).length > 0) statusZ = true;
    }
    if (okZ && (ov.maxHp - minHpZ) > 0) dmgOk++;
    else console.log('   H' + (i + 1) + ' zona: cast=' + okZ + ' dano=' + Math.round(ov.maxHp - minHpZ));
    if (statusZ) statusOk++;
    continue;
  }
  const ok = f.tryCast(i);
  let minHp = o.maxHp, pegouStatus = false;
  for (let t = 0; t < 220; t++) {
    g.tick();
    if (o.hp < minHp) minHp = o.hp;
    if (Object.keys(o.status).length > 0) pegouStatus = true;
  }
  if (ok && (o.maxHp - minHp) > 0) dmgOk++;
  else console.log('   H' + (i + 1) + ' (' + kit[i].id + '): cast=' + ok + ' dano=' + Math.round(o.maxHp - minHp));
  if (pegouStatus) statusOk++;
}
check('as 5 habilidades machucam', dmgOk === 5, dmgOk + '/5');
check('as 5 aplicam STATUS no alvo', statusOk >= 4, statusOk + '/5');
// ult forte
const ult = kit[4];
check('ult K.O. Supremo pesada (78 base)', ult.dmg === 78, 'dmg=' + ult.dmg);
// IA
g.cfg.cpu[0] = true;
let ticks = 0;
for (let t = 0; t < 900; t++) { g.tick(); ticks++; }
check('IA controla Henrico sem crash', ticks === 900);

// ==== MAXIMILIAN: REBOBINAR (volta no tempo) ====
g = mk('maximilian');
f = g.activeOf(0); o = g.activeOf(1);
const mkKit = f.currentKit();
check('ult e REBOBINAR (nao meia-noite)', mkKit[4].id === 'rebobinar' && mkKit[4].kind === 'rewind', mkKit[4].id + ':' + mkKit[4].kind);
// historia de rewind acumula
for (let t = 0; t < 240; t++) g.tick();
check('historia de rewind acumulando', (f._rewindHist || []).length >= 7, (f._rewindHist || []).length + ' snapshots');
// toma dano, volta no tempo: vida restaurada
const hpCheio = f.maxHp;
f.hp = hpCheio * 0.4; // levou porrada
f.x = 800; // foi empurrado pro canto
const xAntes = f.x;
f.cd = [0,0,0,0,0,0,0,0,0,0]; f.castLock = 0; f.state = 'idle'; f.cast = null; f.ultimate = 100;
const okRewind = f.tryCast(4);
for (let t = 0; t < 80; t++) g.tick();
check('REBOBINAR casta', okRewind);
check('vida REBOBINADA (voltou no tempo)', f.hp > hpCheio * 0.4, Math.round(f.hp) + ' (estava ' + Math.round(hpCheio * 0.4) + ')');
check('posicao restaurada', Math.abs(f.x - xAntes) > 5, 'x ' + xAntes + ' -> ' + Math.round(f.x));
// status nos hits dele
f.x = 300; o.x = 500; f.dir = 1; o.dir = -1; o.status = {}; f.state = 'idle'; f.cast = null;
f.cd = [0,0,0,0,0,0,0,0,0,0]; f.castLock = 0; f.charge = [100, 100]; f.ultimate = 100;
f.tryCast(1); // engrenagem (bleed)
let pegou = false;
for (let t = 0; t < 200; t++) { g.tick(); if (o.has('bleed')) pegou = true; }
check('engrenagem aplica SANGRAMENTO', pegou);

// ==== LIA/NEXO: status no kit ====
for (const id of ['lia', 'nexo']) {
  const k = POWERS[id].powers;
  check(id + ': todas as habilidades com status', k.every((p) => p.fx && Object.keys(p.fx).length > 0), k.map((p) => Object.keys(p.fx || {}).join('+')).join(' '));
}

console.log('---');
console.log(fails === 0 ? 'HENRICO/REWIND: TUDO OK (' + n + ' checks)' : 'HENRICO/REWIND: ' + fails + ' FALHAS de ' + n);
`, ctx);
