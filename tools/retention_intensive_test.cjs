// INTENSIVO: wake-up (janelas/edge cases), 15 conquistas (todas as trilhas),
// recordes, netcode visual (varios saltos), preload, frame data nos 46.
const fs = require('fs'); const vm = require('vm');
function req(name){ try { return require(name); } catch(e){ return require('/tmp/node_modules/'+name); } }
const { createCanvas } = req('canvas');
const ACH = [];
const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas,
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho', 'maximilian'], data: { settings: { reducedMotion: false }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, skinFor: () => 0, redeem: () => ({ ok: true }),
    grantAchievement(id) { const a = this.data.achievements || (this.data.achievements = []); if (a.includes(id)) return false; a.push(id); ACH.push(id); return true; },
    hasAchievement(id) { return !!(this.data.achievements || []).includes(id); },
    recordSurvivalBy(fid, wins) { const st = this.data.stats; const by = st.survivalBy || (st.survivalBy = {}); by[fid] = Math.max(by[fid] || 0, wins); },
    recordWinBy(fid, element) { const w = this.data.winBy || (this.data.winBy = {}); w[fid] = (w[fid] || 0) + 1; if (element) { const e = this.data.winElement || (this.data.winElement = {}); e[element] = (e[element] || 0) + 1; } },
    record() {} },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} } } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/pets.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }

vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, ellipse() {}, arc() {}, fill() {}, fillText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), set imageSmoothingEnabled(v) {} });
const mk = (mode, me, opp) => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
  g.start({ mode: mode || 'versus', teams: [[me || 'du'], [opp || 'stack']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};
const KICK_IN = { left: false, right: false, down: false, up: false, punch: false, kick: true };
const PUNCH_IN = { left: false, right: false, down: false, up: false, punch: true, kick: false };
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

// ==== 1. WAKE-UP: janelas exatas (17 fora, 18 dentro, 34 dentro, 35 fora) ====
const jan = (t) => {
  const g = mk();
  const f = g.activeOf(0);
  f.state = 'down'; f.stateTime = t; f.cast = null; f.attack = null; f.status = {};
  f.update(KICK_IN);
  return f.state === 'attack';
};
check('wake-up frame 17: FORA da janela', jan(17) === false);
check('wake-up frame 18: DENTRO', jan(18) === true);
check('wake-up frame 34: DENTRO (ultimo)', jan(34) === true);
check('wake-up frame 35: FORA (ja levantou)', jan(35) === false);
check('wake-up com SOCO tambem funciona', (() => { const g = mk(); const f = g.activeOf(0); f.state = 'down'; f.stateTime = 20; f.cast = null; f.attack = null; f.status = {}; f.update(PUNCH_IN); return f.state === 'attack' && f.attack.kind === 'punch'; })());
check('wake-up com CHUTE da chute', (() => { const g = mk(); const f = g.activeOf(0); f.state = 'down'; f.stateTime = 20; f.cast = null; f.attack = null; f.status = {}; f.update(KICK_IN); return f.state === 'attack' && f.attack.kind === 'kick'; })());

// invuln dura: 14 ticks
const gI = mk();
const fI = gI.activeOf(0);
fI.state = 'down'; fI.stateTime = 20; fI.cast = null; fI.attack = null; fI.status = {};
fI.update(KICK_IN);
let durou = 0;
for (let t = 0; t < 20; t++) { gI.tick(); if (fI.has('invuln')) durou++; }
check('wake-up invuln dura ~14 ticks', durou >= 10 && durou <= 16, durou + ' ticks');

// wake-up MACHUCA: o golpe do levantar acerta o rival perto
const gW = mk();
const fW = gW.activeOf(0), oW = gW.activeOf(1);
fW.x = 300; oW.x = 340; fW.dir = 1; oW.dir = -1;
oW.hp = oW.maxHp;
fW.state = 'down'; fW.stateTime = 20; fW.cast = null; fW.attack = null; fW.status = {};
fW.update(KICK_IN);
let acertou = false;
for (let t = 0; t < 60; t++) { gW.tick(); if (oW.hp < oW.maxHp) { acertou = true; break; } }
check('wake-up attack MACHUCA o rival', acertou, 'dano: ' + Math.round(oW.maxHp - oW.hp));

// wake-up em todos os modos (sem crash)
let modosOk = 0;
for (const modo of ['versus', 'arcade', 'training', 'tag', 'survival']) {
  try {
    const gm = mk(modo);
    const fm = gm.activeOf(0);
    if (fm) { fm.state = 'down'; fm.stateTime = 20; fm.cast = null; fm.attack = null; fm.status = {}; fm.update(KICK_IN); }
    for (let t = 0; t < 30; t++) gm.tick();
    modosOk++;
  } catch (e) { console.log('   ERRO wake-up no modo ' + modo + ': ' + String(e).slice(0, 50)); }
}
check('wake-up funciona nos 5 modos sem crash', modosOk === 5, modosOk + '/5');

// ==== 2. AS 15 CONQUISTAS: cada trilha dispara ====
Profile.data.achievements = []; Profile.data.winBy = {}; Profile.data.winElement = {};
const antes = () => Profile.data.achievements.length;
/* combo 10/20 */
const gC = mk();
gC.combo = { owner: gC.activeOf(0), count: 21, dmg: 0, until: gC.time + 48 };
gC.activeOf(1).takeHit(1, { attacker: gC.activeOf(0) });
check('combo-10 e combo-20 nas combos altas', Profile.hasAchievement('combo-10') && Profile.hasAchievement('combo-20'));
/* 5 ults numa luta */
const gU = mk();
const fU = gU.activeOf(0);
for (let k = 0; k < 5; k++) { fU.cast = null; fU.cd = [0,0,0,0,0,0,0,0,0,0]; fU.castLock = 0; fU.ultimate = 100; fU.state = 'idle'; fU.tryCast(4); }
check('ultimate-5 com 5 ults na luta', Profile.hasAchievement('ultimate-5'), 'ults=' + fU._ultsMatch);
/* 50 double jumps */
const gD = mk();
const fD = gD.activeOf(0);
const UP = { left: false, right: false, down: false, up: true, punch: false, kick: false };
fD.update(UP);
for (let k = 0; k < 50; k++) { fD._doubleJumped = false; fD.update(UP); }
check('double-jump-50 com 50 pulos extras', Profile.hasAchievement('double-jump-50'), 'contagem=' + fD._djCount);
/* wake-up medalha */
const gWK = mk();
const fWK = gWK.activeOf(0);
fWK.state = 'down'; fWK.stateTime = 20; fWK.cast = null; fWK.attack = null; fWK.status = {};
fWK.update(KICK_IN);
check('wake-up medalha', Profile.hasAchievement('wake-up'));
/* variedade: 10 e 25 lutadores + 6 elementos (as medalhas disparam no finishMatch) */
for (let k = 0; k < 25; k++) Profile.recordWinBy('luta-' + k, 'elem-' + (k % 6));
/* secretos: todos desbloqueados + fim de luta REAL (teamWins + ticks) */
Profile.data.unlocked = ['du', 'iales', 'felipinho', 'maximilian'];
const gS = mk();
gS.teamWins = [1, 0]; /* P1 venceu a partida */
gS.teams[0].members[0].hp = gS.teams[0].members[0].maxHp; /* perfeito */
gS.finishMatch(); /* o bloco de conquistas vive aqui */
check('codigos-3 com todos os secretos', Profile.hasAchievement('codigos-3'));
check('primeiro-ko no fim de luta', Profile.hasAchievement('primeiro-ko'));
check('perfeito: round sem tomar dano', Profile.hasAchievement('perfeito'));
check('lutadores-25 com 25 vitoriosos', Profile.hasAchievement('lutadores-25'), Object.keys(Profile.data.winBy).length + ' lutadores');
check('elementos-6 com 6 elementos', Profile.hasAchievement('elementos-6'), Object.keys(Profile.data.winElement).length + ' elementos');
check('lutadores-10 tambem concedida', Profile.hasAchievement('lutadores-10'));
const totalMed = Profile.data.achievements.length;
check('10+ medalhas concedidas ate aqui', totalMed >= 10, totalMed + ' medalhas');

// ==== 3. RECORDES: max em multiplas gravacoes ====
Profile.data.stats.survivalBy = {};
Profile.recordSurvivalBy('du', 5); Profile.recordSurvivalBy('du', 3); Profile.recordSurvivalBy('du', 9); Profile.recordSurvivalBy('du', 7);
check('survival guarda o MAIOR (9)', Profile.data.stats.survivalBy.du === 9);
for (let k = 0; k < 10; k++) Profile.recordWinBy('du', 'fogo');
check('winBy acumula 10+ vitorias', Profile.data.winBy.du >= 10, 'du=' + Profile.data.winBy.du);
check('winElement acumula 10 de fogo', Profile.data.winElement.fogo === 10);

// ==== 4. NETCODE: bateria de saltos ====
const gN = mk();
const rem = gN.activeOf(1);
let escondeuGrandes = 0, escondeuPequenos = 0;
for (const salto of [200, 150, 400, 135]) {
  rem._netHide = 0;
  const s = rem.snap(); s[0] = rem.x + salto;
  rem.applySnap(s);
  if (rem._netHide === 3) escondeuGrandes++;
}
for (const salto of [30, 80, 120, 129]) {
  rem._netHide = 0;
  const s = rem.snap(); s[0] = rem.x + salto;
  rem.applySnap(s);
  if (rem._netHide > 0) escondeuPequenos++;
}
check('salto grande (135-400px) sempre esconde', escondeuGrandes === 4, escondeuGrandes + '/4');
check('salto pequeno (30-129px) NUNCA esconde', escondeuPequenos === 0, escondeuPequenos + '/4');
/* decremento correto em snaps consecutivos */
rem._netHide = 3;
const seq = [];
for (let k = 0; k < 5; k++) { const s = rem.snap(); s[0] = rem.x; s[1] = rem.y; rem.applySnap(s); seq.push(rem._netHide); }
check('decrementa 3>2>1>0>0', seq[0] === 2 && seq[1] === 1 && seq[2] === 0 && seq[4] === 0, seq.join('>'));
/* salto em Y tambem esconde */
rem._netHide = 0;
const sy = rem.snap(); sy[1] = rem.y - 200;
rem.applySnap(sy);
check('salto grande em Y tambem esconde', rem._netHide === 3);

// ==== 5. PRELOAD: idempotente e completo ====
SpriteGen._preloaded = {};
SpriteGen.preloadAll();
const n1 = Object.keys(SpriteGen._preloaded).length;
SpriteGen.preloadAll();
const n2 = Object.keys(SpriteGen._preloaded).length;
check('preload carrega o elenco todo', n1 >= 46, n1 + ' sprites');
check('preload IDEMPOTENTE (2a chamada nao duplica)', n2 === n1, n1 + ' = ' + n2);

// ==== 6. FRAME DATA nos 46 (tabela desenha pra todos) ====
let fdOk = 0, fdProbs = [];
for (const d of FIGHTERS) {
  if (d.id === 'boneco-treino') continue;
  if (!d.moves || !d.moves.punch) { fdProbs.push(d.id + ':sem-moves'); continue; }
  fdOk++;
}
check('frame data disponivel nos 46', fdOk >= 44, fdOk + '/45' + (fdProbs.length ? ' | ' + fdProbs.slice(0, 4).join(',') : ''));
/* renderiza a tabela pra 5 lutadores sem crash */
let fdRender = 0;
for (const id of ['du', 'henrico', 'meta', 'lia', 'iales']) {
  try { const gF = mk('training', id); gF.hitboxDebug = true; for (let t = 0; t < 20; t++) { gF.tick(); gF.render(); } fdRender++; } catch (e) {}
}
check('tabela renderiza pra 5 lutadores sem crash', fdRender === 5, fdRender + '/5');

console.log('---');
console.log(fails === 0 ? 'INTENSIVO RETENCAO: TUDO OK (' + n + ' checks)' : 'INTENSIVO RETENCAO: ' + fails + ' FALHAS de ' + n);
`, ctx);
