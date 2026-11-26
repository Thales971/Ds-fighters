// VIBE DOS MAPAS + FLORA v2 (nov/2026): tema por palco, nivel por qualidade
// (baixo desliga, medio leve, alto = maximo), desenho sem crash em todos os
// palcos e qualidades, flora por bioma com moitas/profundidade e planta que
// deita quando o lutador passa por cima.
const fs = require('fs'); const vm = require('vm');
function req(name) { return require(name); }
const { createCanvas } = req('canvas');
const { PNG } = req('pngjs');
const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas, fs, PNG,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: (k) => (k === 'quality' ? ctx.__Q || null : null), reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {}, pitocoSeq: [], pitocoKey() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), querySelectorAll: () => [], addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} }, dataset: {} } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/stage-extras.js', 'js/engine/stage-vibe.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 80)); } }

vm.runInContext(`
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const MAGENTA = (r,g,b,a) => a > 40 && g < 90 && r > 150 && b > 90;
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), createPattern: () => ({}), set imageSmoothingEnabled(v) {}, set globalAlpha(v) {}, set globalCompositeOperation(v) {}, set fillStyle(v) {}, set strokeStyle(v) {}, set font(v) {}, set textAlign(v) {}, set lineWidth(v) {}, set filter(v) {} });
const mk = (stageId) => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } });
  g.start({ mode: 'versus', teams: [['du'], ['du']], stage: stageId, cpu: [true, true], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};


// ===== 1. TEMA: todo palco tem um tema valido =====
const semTema = [];
const temas = {};
for (const st of STAGES) {
  const g = mk(st.id);
  const th = g.stage.vibeTheme();
  if (!th || !th.grade || th.grade.length !== 2 || !th.mote || !(th.n > 0)) semTema.push(st.id);
  temas[th.name] = (temas[th.name] || 0) + 1;
}
check('todos os ' + STAGES.length + ' palcos tem tema de vibe valido', semTema.length === 0, semTema.slice(0, 5).join(',') || JSON.stringify(temas));
check('temas variados (pelo menos 6 diferentes)', Object.keys(temas).length >= 6, JSON.stringify(temas));
const tema = (id) => { const g = mk(id); return g.stage.vibeTheme().name; };
check('03-underwater-lab = agua', tema('03-underwater-lab') === 'agua', tema('03-underwater-lab'));
check('02-volcanic-forge = fogo', tema('02-volcanic-forge') === 'fogo', tema('02-volcanic-forge'));
check('cyberpunk = neon', tema('cyberpunk') === 'neon', tema('cyberpunk'));
check('parque-lago = natureza', tema('parque-lago') === 'natureza', tema('parque-lago'));
check('biblioteca-noturna = noite', tema('biblioteca-noturna') === 'noite', tema('biblioteca-noturna'));

// ===== 2. NIVEL por qualidade / movimento reduzido / performance =====
const gQ = mk('parque-lago');
gQ.quality = 'low'; check('qualidade BAIXA: vibe desligada', gQ.stage.vibeLevel() === 0);
gQ.quality = 'medium'; check('qualidade MEDIA: vibe leve (1)', gQ.stage.vibeLevel() === 1);
gQ.quality = 'high'; check('qualidade ALTA (maximo): vibe completa (2)', gQ.stage.vibeLevel() === 2);
gQ.perfLevel = 1; check('modo performance 1: cai pra leve', gQ.stage.vibeLevel() === 1);
gQ.perfLevel = 2; check('modo performance 2: desliga', gQ.stage.vibeLevel() === 0);
gQ.perfLevel = 0; gQ.reduced = true; check('movimento reduzido: desliga', gQ.stage.vibeLevel() === 0);
gQ.reduced = false;

// ===== 3. DESENHO: todos os palcos x 3 qualidades, sem crash, desenha algo =====
let errs = 0, ops = 0;
const rec = () => { const c = fake2d(); const o = {}; for (const k of ['fillRect', 'arc', 'drawImage']) { const f = c[k]; c[k] = (...a) => { ops++; return f.apply(c, a); }; } c.canvas = { width: 960, height: 540 }; c.setTransform = () => {}; return c; };
for (const st of STAGES) {
  for (const q of ['low', 'medium', 'high']) {
    try {
      const g = mk(st.id); g.quality = q;
      for (let t = 0; t < 30; t++) { g.tick(); const c = rec(); g.stage.drawVibeBack(c); g.stage.drawVibeFront(c); g.stage.drawVibeGrade(c); }
    } catch (e) { errs++; if (errs <= 3) console.log('  ERRO ' + st.id + '/' + q + ': ' + e.message.slice(0, 90)); }
  }
}
check('vibe desenha em todos os palcos x 3 qualidades sem crash', errs === 0, errs + ' erros');
check('vibe desenha de fato (operacoes de desenho > 0)', ops > 1000, ops + ' ops');
const gL = mk('parque-lago'); gL.quality = 'low'; let opsLow = 0;
{ const c = fake2d(); c.fillRect = () => { opsLow++; }; c.arc = () => { opsLow++; }; gL.stage.drawVibeBack(c); gL.stage.drawVibeFront(c); gL.stage.drawVibeGrade(c); }
check('qualidade BAIXA nao desenha nada da vibe', opsLow === 0, opsLow + ' ops');

// ===== 4. FLORA v2: moitas, profundidade, quantidade por qualidade, deita com o lutador =====
globalThis.__Q = 'medium';
const gF = mk('parque-lago');
const nMed = gF.stage.flora.length;
check('parque-lago tem flora com profundidade (z) e variante (v)', nMed > 10 && gF.stage.flora.every((p) => p.z >= 0 && p.z <= 1 && Number.isInteger(p.v)), nMed + ' plantas');
check('flora ordenada de tras pra frente (y crescente)', gF.stage.flora.every((p, i, a) => i === 0 || a[i - 1].y <= p.y));
globalThis.__Q = 'high';
const nHigh = mk('parque-lago').stage.flora.length;
globalThis.__Q = 'low';
const nLow = mk('parque-lago').stage.flora.length;
globalThis.__Q = null;
check('quantidade sobe com a qualidade (baixo < medio < alto)', nLow < nMed && nMed < nHigh, nLow + ' < ' + nMed + ' < ' + nHigh);
const deserto = STAGES.find((s) => /lencois|dunas|deserto|caatinga/.test(s.id));
if (deserto) { const kd = new Set(mk(deserto.id).stage.flora.map((p) => p.k)); check('bioma de areia (' + deserto.id + ') tem capim seco/cacto', kd.has('dry') || kd.has('cactus'), [...kd].join(',')); }
/* lutador em cima da planta: ela deita pro lado oposto e volta */
const pl = gF.stage.flora[0];
const f0 = gF.activeOf(0);
f0.x = pl.x - 20; f0.y = 0;
const f1 = gF.activeOf(1); f1.x = 900; if (Math.abs(pl.x - 900) < 60) f1.x = 60;
for (let t = 0; t < 20; t++) gF.stage.update(gF.weather);
check('planta deita quando o lutador passa (bend > 0 pro lado oposto)', pl.bend > 0.08, 'bend=' + pl.bend.toFixed(3));
f0.x = pl.x + 300 > 950 ? pl.x - 300 : pl.x + 300;
for (let t = 0; t < 120; t++) gF.stage.update(gF.weather);
check('planta volta quando o lutador sai', Math.abs(pl.bend) < 0.05, 'bend=' + pl.bend.toFixed(3));

console.log('---');
console.log(fails === 0 ? 'VIBE/FLORA v2: TUDO OK (' + n + ' checks)' : 'VIBE/FLORA v2: ' + fails + ' FALHAS de ' + n);
`, ctx);
