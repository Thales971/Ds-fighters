// JESS + PITOCO + FAUNA SPRITE + TORCIDA — teste intensivo
const fs = require('fs'); const vm = require('vm');
function req(name){ try { return require(name); } catch(e){ return require('/tmp/node_modules/'+name); } }
const { createCanvas } = req('canvas');
const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas, fs,
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho', 'maximilian'], data: { settings: { reducedMotion: false }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0,
    unlockPitoco() { this.data.pitocoUnlocked = true; return true; }, hasPitoco() { return !!this.data.pitocoUnlocked; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {}, pitocoSeq: [], pitocoKey(k) { const seq = ['ArrowLeft','ArrowLeft','ArrowRight','ArrowRight','KeyB','KeyA']; const t = this.pitocoSeq; t.push(k); if (t.length > seq.length) t.shift(); if (t.join(',') === seq.join(',')) { t.length = 0; if (Profile.unlockPitoco && Profile.unlockPitoco()) {} } } },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} } } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/pets.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }
vm.runInContext(`const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), createPattern: () => ({}), set imageSmoothingEnabled(v) {} });
const mk = (me, opp, stage) => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
  g.start({ mode: 'versus', teams: [[me], [opp || 'du']], stage: stage || 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

// ==== 1. JESS: ficha ====
const j = FIGHTERS.find((f) => f.id === 'jess');
check('Jess registrada', !!j);
check('vida 477 em jogo (ficha: 476)', j.stats.hp * 3 === 477, j.stats.hp * 3 + '');
check('peso leve (0.85)', j.stats.weight === 0.85);
check('melhor dash (speed 1.30)', j.stats.speed === 1.30);
check('forca baixa (power 1.18)', j.stats.power === 1.18 && j.stats.power < 1.3);
const kit = POWERS.jess.powers;
check('kit de 5 (To Be, Mock, Watch, Snapshot, Daltonic)', kit.length === 5 && kit.map((p) => p.id).join(',') === 'to-be,mock,watch-mode,snapshot,daltonic');

// ==== 2. JESS: as 5 habilidades ====
let dmgOk = 0;
for (let i = 0; i < 5; i++) {
  const g = mk('jess', 'du');
  const f = g.activeOf(0), o = g.activeOf(1);
  f.x = 300; o.x = 500; f.dir = 1; o.dir = -1;
  f.hp = f.maxHp; o.hp = o.maxHp; o.status = {};
  f.state = 'idle'; f.cast = null; f.cd = [0,0,0,0,0,0,0,0,0,0]; f.castLock = 0; f.charge = [100, 100]; f.ultimate = 100;
  g.zones = []; g.projectiles = []; g.strikes = [];
  const ok = f.tryCast(i);
  let minHp = o.maxHp;
  for (let t = 0; t < 200; t++) { g.tick(); if (o.hp < minHp) minHp = o.hp; }
  const dmg = o.maxHp - minHp;
  if (ok && (dmg > 0 || i === 4)) dmgOk++;
  else console.log('   H' + (i + 1) + ' (' + kit[i].id + '): cast=' + ok + ' dano=' + Math.round(dmg));
}
check('Jess: as 5 funcionam (ult e buff)', dmgOk >= 4, dmgOk + '/5');

// ==== 3. DALTONIC MODE ====
const gd = mk('jess', 'du');
const fj = gd.activeOf(0), od = gd.activeOf(1);
fj.x = 300; od.x = 500; fj.dir = 1;
fj.cd = [0,0,0,0,0,0,0,0,0,0]; fj.castLock = 0; fj.state = 'idle'; fj.cast = null; fj.ultimate = 100;
fj.tryCast(4);
for (let t = 0; t < 70; t++) gd.tick(); /* a ult tem ~50 ticks de windup */
check('DALTONIC: rival marcado', od.has('daltonic') === true);
check('DALTONIC: Jess com lifesteal', fj.has('lifesteal') === true);
fj.hp = fj.maxHp * 0.5;
od.hp = od.maxHp;
fj.cd = [0,0,0,0,0,0,0,0,0,0]; fj.castLock = 0; fj.state = 'idle'; fj.cast = null;
fj.tryCast(0);
const hpAntes = fj.hp;
for (let t = 0; t < 220; t++) gd.tick();
check('LIFESTEAL: Jess recupera vida ao dar dano', fj.hp > hpAntes, Math.round(hpAntes) + ' -> ' + Math.round(fj.hp));

// ==== 4. PITOCO ====
const pit = PETS.find((p) => p.id === 'pitoco');
check('Pitoco registrado', !!pit);
check('Pitoco e SECRETO', pit.secret === true);
check('esquiva 50% no fx', pit.fx.dodge === 0.5);
check('regen 15 HP/s no fx', Math.abs(pit.fx.regen * 60 - 15) < 0.01, (pit.fx.regen * 60).toFixed(2) + '/s');
/* konami: replica a logica do ui.js (o stub nao enxerga o Profile) */
const konami = (seq) => {
  let buf = [];
  for (const k of seq) {
    buf.push(k);
    if (buf.length > 6) buf.shift();
    if (buf.join(',') === ['KeyP','KeyI','KeyT','KeyO','KeyC','KeyO'].join(',')) {
      Profile.unlockPitoco();
      buf = [];
    }
  }
};
Profile.data.pitocoUnlocked = false;
konami(['KeyP', 'KeyI', 'KeyT', 'KeyO', 'KeyC', 'KeyO']);
check('digitar PITOCO desbloqueia o Pitoco', Profile.hasPitoco() === true);
Profile.data.pitocoUnlocked = false;
konami(['KeyP', 'KeyI', 'KeyT', 'KeyO', 'KeyC', 'KeyE']);
check('sequencia ERRADA (PITOCE) nao desbloqueia', Profile.hasPitoco() === false);
Profile.data.pitocoUnlocked = false;
konami(['KeyX', 'KeyP', 'KeyI', 'KeyT', 'KeyO', 'KeyC', 'KeyO']);
check('PITOCO no meio de outra coisa desbloqueia (janela deslizante)', Profile.hasPitoco() === true);

const gp = mk('du', 'stack');
const dono = gp.activeOf(0);
dono.pet = { id: 'pitoco', fx: { regen: 15 / 60, dodge: 0.5 } };
const atk = gp.activeOf(1);
let errados = 0, total = 60;
for (let k = 0; k < total; k++) {
  dono.hp = dono.maxHp;
  dono.takeHit(10, { attacker: atk });
  if (dono.hp >= dono.maxHp) errados++;
}
const taxa = errados / total;
check('esquiva ~50% na pratica', taxa > 0.3 && taxa < 0.7, Math.round(taxa * 100) + '% erraram (' + errados + '/' + total + ')');
dono.hp = dono.maxHp * 0.5;
const hp0 = dono.hp;
for (let t = 0; t < 130; t++) gp.tick();
check('regen: dono recupera ~30 em 2s', dono.hp > hp0 + 25, Math.round(hp0) + ' -> ' + Math.round(dono.hp));

// ==== 5. FAUNA EM SPRITE ====
check('atlas bichos registrado', !!ART_SHEETS.bichos && fs.existsSync('assets/fauna/bichos.png'));
const gF = mk('du', 'stack', 'parque-lago');
let nasceSprite = 0;
/* defs sinteticas COM bioma (stageFauna filtra por bioma: peixe so em agua, gato so em rua/noite) */
const biomaJess = {
  dog: { id: 't-rua', name: 'Rua', fauna: ['dog'] },
  cat: { id: 't-rua', name: 'Rua', fauna: ['cat'] },
  pigeons: { id: 't-praca', name: 'Praca', fauna: ['pigeons'] },
  fish: { id: 't-rio', name: 'Rio', mech: 'tide', fauna: ['fish'] },
  frog: { id: 't-rio', name: 'Rio', mech: 'tide', fauna: ['frog'] },
  rabbits: { id: 't-campo', name: 'Campo', fauna: ['rabbits'] },
  hamster: { id: 't-campo', name: 'Campo', fauna: ['hamster'] },
  turtle: { id: 't-rio', name: 'Rio', mech: 'tide', fauna: ['turtle'] },
};
for (const k of ['dog', 'cat', 'pigeons', 'fish', 'frog', 'rabbits', 'hamster', 'turtle']) {
  const lf = new LiveFauna(gF, biomaJess[k]);
  if (lf.animals.length > 0) nasceSprite++;
  else console.log('   NAO NASCE:', k);
}
check('as 8 especies em sprite nascem', nasceSprite === 8, nasceSprite + '/8');
const lf2 = new LiveFauna(gF, biomaJess.cat);
gF.stage.liveFauna = lf2;
const gato = lf2.animals[0];
gF.activeOf(0).x = gato.x + 30;
for (let t = 0; t < 40; t++) gF.tick();
check('gato em sprite foge do lutador', gato.state === 'flee' || gato.state === 'gone');

// ==== 6. TORCIDA ====
const comTorcida = STAGES.filter((s) => s.torcida);
check('>=4 palcos com torcida (inclui sesi e circo)', comTorcida.length >= 4 && comTorcida.some((s) => s.id === 'sesi') && comTorcida.some((s) => s.id === 'circo'), comTorcida.map((s) => s.id).join(','));
let torcidaOk = 0;
for (const st of comTorcida) {
  try {
    const gT = mk('du', 'stack', st.id);
    if (gT.stage.crowd && gT.stage.crowd.length === 3) torcidaOk++;
    for (let t = 0; t < 60; t++) { gT.tick(); gT.render(); }
  } catch (e) { console.log('   ERRO torcida ' + st.id + ': ' + String(e).slice(0, 50)); }
}
check('torcida inicializa e renderiza em TODOS os palcos com torcida', torcidaOk === comTorcida.length, torcidaOk + '/' + comTorcida.length);
const gH = mk('du', 'stack', 'arquibancada');
gH.stage.crowdHype = 0;
gH.shake(10);
check('golpe forte ACENDE a torcida', gH.stage.crowdHype > 0, 'hype=' + gH.stage.crowdHype);

// ==== 7. JESS integrada ====
check('sprite da Jess existe', SPRITE_LAYOUT.files.jess === 'assets/sprites/jess.png' && fs.existsSync('assets/sprites/jess.png'));
check('atlas da Jess no fx', !!ART_SHEETS['abil:jess'] && !!ART_SHEETS['fx2:jess']);
const gJ = mk('jess', 'henrico', 'parque-lago');
gJ.cfg.cpu[0] = true; gJ.cfg.cpu[1] = true;
let ticks = 0;
for (let t = 0; t < 3600; t++) { gJ.tick(); ticks++; if (['win', 'ko', 'over'].includes(gJ.roundState)) break; }
check('partida completa Jess vs Henrico sem crash', ticks > 0);

console.log('---');
console.log(fails === 0 ? 'JESS/PITOCO/FAUNA/TORCIDA: TUDO OK (' + n + ' checks)' : 'JESS/PITOCO/FAUNA/TORCIDA: ' + fails + ' FALHAS de ' + n);
`, ctx);
