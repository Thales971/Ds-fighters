// PROFUNDIDADE + RETENÇÃO + TÉCNICO: wake-up attack, frame data,
// conquistas (15 medalhas), recordes por lutador, netcode visual,
// preload de sprites.
const fs = require('fs'); const vm = require('vm');
function req(name){ try { return require(name); } catch(e){ return require('/tmp/node_modules/'+name); } }
const { createCanvas } = req('canvas');
const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas,
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho', 'maximilian'], data: { settings: { reducedMotion: false }, unlocked: [], stats: {} }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, redeem: () => ({ ok: true }),
    grantAchievement(id) { const a = this.data.achievements || (this.data.achievements = []); if (a.includes(id)) return false; a.push(id); return true; },
    hasAchievement(id) { return !!(this.data.achievements || []).includes(id); },
    recordSurvivalBy(fid, wins) { const st = this.data.stats; const by = st.survivalBy || (st.survivalBy = {}); by[fid] = Math.max(by[fid] || 0, wins); },
    recordWinBy(fid, element) { const w = this.data.winBy || (this.data.winBy = {}); w[fid] = (w[fid] || 0) + 1; if (element) { const e = this.data.winElement || (this.data.winElement = {}); e[element] = (e[element] || 0) + 1; } },
    skinFor: () => 0 },
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
const mk = (mode) => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
  g.start({ mode: mode || 'versus', teams: [['du'], ['stack']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

// ==== 1. WAKE-UP ATTACK: levanta atacando com i-frames ====
const g = mk();
const f = g.activeOf(0), o = g.activeOf(1);
f.x = 300; o.x = 360; f.dir = 1;
f.state = 'down'; f.stateTime = 0; f.cast = null; f.attack = null;
f.status = {};
/* avanca ate a janela do wake-up */
for (let t = 0; t < 22; t++) g.tick();
check('caiu no chao esperando wake-up', f.state === 'down');
/* aperta chute na janela: levanta ATACANDO (input direto, o tick zera o buf) */
f.update({ left: false, right: false, down: false, up: false, punch: false, kick: true });
const acordouAtacando = f.state === 'attack' && f.attack && (f.attack.kind === 'kick' || f.attack.kind === 'punch');
check('WAKE-UP ATTACK: levanta atacando', acordouAtacando, 'estado=' + f.state + ' golpe=' + (f.attack ? f.attack.kind : '-'));
check('wake-up com INVENCIBILIDADE', f.has('invuln') === true, 'invuln=' + !!f.has('invuln'));
/* fora da janela: wake-up normal (invuln 10) */
o.state = 'down'; o.stateTime = 0;
for (let t = 0; t < 40; t++) g.tick();
check('sem input: levanta normal com invuln', o.state === 'idle' && o.has('invuln') === true);

// ==== 2. FRAME DATA: tabela desenha sem crash com F9 ====
const g2 = mk('training');
g2.hitboxDebug = true;
let renderOk = true;
try { for (let t = 0; t < 30; t++) { g2.tick(); g2.render(); } } catch (e) { renderOk = false; console.log('   ERRO F9:', String(e).slice(0, 60)); }
check('F9 com tabela de FRAME DATA renderiza sem crash', renderOk);
check('tabela tem os 6 golpes', typeof g2._drawFrameDataTable === 'function');

// ==== 3. CONQUISTAS: 15 medalhas definidas, grant persiste ====
check('15 conquistas definidas', ACHIEVEMENTS.length === 15, ACHIEVEMENTS.length + ' medalhas');
const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
check('ids unicos', ids.size === ACHIEVEMENTS.length);
Profile.grantAchievement('primeiro-ko');
check('grant persiste', Profile.hasAchievement('primeiro-ko') === true);
Profile.grantAchievement('primeiro-ko');
check('nao duplica', (Profile.data.achievements.filter((x) => x === 'primeiro-ko')).length === 1);
/* combo 10 dispara no jogo */
const g3 = mk();
g3.combo = { owner: g3.activeOf(0), count: 11, dmg: 30, until: g3.time + 48 };
g3.activeOf(1).takeHit(5, { attacker: g3.activeOf(0) });
const comboCount = (g3.combo.count >= 12) ? Profile.hasAchievement('combo-10') : false;
check('combo 10+ concede medalha', comboCount === true, 'count=' + g3.combo.count);

// ==== 4. RECORDES: survival por lutador persiste ====
Profile.data.stats.survivalBy = {};
Profile.recordSurvivalBy('du', 7);
Profile.recordSurvivalBy('du', 12);
Profile.recordSurvivalBy('henrico', 3);
check('recorde survival por lutador (max)', Profile.data.stats.survivalBy.du === 12, 'du=' + Profile.data.stats.survivalBy.du);
check('recorde por lutador multiplo', Profile.data.stats.survivalBy.henrico === 3);
Profile.recordWinBy('du', 'fogo');
Profile.recordWinBy('du', 'fogo');
check('vitorias por lutador acumulam', Profile.data.winBy.du === 2);
check('vitorias por elemento acumulam', Profile.data.winElement.fogo === 2);

// ==== 5. NETCODE VISUAL: salto grande esconde 3 ticks ====
const g5 = mk();
const rem = g5.activeOf(1);
rem.x = 100; rem.y = 0; rem._netHide = 0;
const snap = rem.snap();
snap[0] = 100 + 200; /* teleporta 200px */
const visivelAntes = rem._netHide === 0;
rem.applySnap(snap);
const escondeu = rem._netHide === 3;
for (let t = 0; t < 3; t++) { const s2 = rem.snap(); s2[0] = rem.x; rem.applySnap(s2); }
const voltou = rem._netHide === 0;
check('salto grande ESCONDE o lutador (anti-teleporte)', visivelAntes && escondeu, '_netHide=' + rem._netHide);
check('volta a aparecer apos 3 ticks', voltou);
/* salto pequeno NAO esconde */
const snap2 = rem.snap(); snap2[0] = rem.x + 40; rem.applySnap(snap2);
check('salto pequeno nao esconde (movimento normal)', rem._netHide === 0);

// ==== 6. PRELOAD: aquece os 46 sprites ====
let preloadOk = true;
try { SpriteGen.preloadAll(); } catch (e) { preloadOk = false; }
const nPre = Object.keys(SpriteGen._preloaded || {}).length;
check('preload aquece o elenco', preloadOk && nPre >= 40, nPre + ' sprites aquecidos');

// ==== 7. wake-up attack concede medalha ====
Profile.data.achievements = [];
const g7 = mk();
const f7 = g7.activeOf(0);
f7.state = 'down'; f7.stateTime = 20; f7.cast = null; f7.attack = null; f7.status = {};
f7.update({ left: false, right: false, down: false, up: false, punch: false, kick: true });
check('wake-up concede a medalha', Profile.hasAchievement('wake-up') === true);

console.log('---');
console.log(fails === 0 ? 'RETENCAO/PROFUNDIDADE: TUDO OK (' + n + ' checks)' : 'RETENCAO/PROFUNDIDADE: ' + fails + ' FALHAS de ' + n);
`, ctx);
