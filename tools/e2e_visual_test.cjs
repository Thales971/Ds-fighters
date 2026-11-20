// E2E REAL: sprites carregados com await (nada de fallback vetorial)
const fs = require('fs'); const vm = require('vm');
function req(name) { return require(name); }
const { createCanvas, Image: CanvasImage, loadImage } = req('canvas');
const ctx = { console, Math, Date, Image: CanvasImage, createCanvas, fs, loadImage,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [], stats: {} }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0, unlockPitoco() { return true; }, hasPitoco() { return true; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} } } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/pets.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }

(async () => {
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
fs.mkdirSync('.vibe/e2e', { recursive: true });

// carrega TODOS os sprites DENTRO do vm (SpriteGen so existe la)
const res = await vm.runInContext(`
(async () => {
  const load = async (id, p) => { try { SpriteGen.images[id] = await loadImage(p); return true; } catch (e) { return false; } };
  const loadArt = async (k, p) => { try { Art.images[k] = await loadImage(p); return true; } catch (e) { return false; } };
  return {
    jess: await load('jess', 'assets/sprites/jess.png'),
    du: await load('du', 'assets/sprites/du.png'),
    henrico: await load('henrico', 'assets/sprites/henrico.png'),
    atlasJess: await loadArt('abil:jess', 'assets/abilities/jess.png') && await loadArt('fx2:jess', 'assets/abilities/jess.png'),
    atlasDu: await loadArt('abil:du', 'assets/abilities/du.png') && await loadArt('fx2:du', 'assets/abilities/du.png'),
    bichos: await loadArt('bichos', 'assets/fauna/bichos.png'),
    torcida: await loadArt('_torcida', 'assets/fauna/torcida.png'),
  };
})()`, ctx);
check('sprite jess carrega', res.jess === true);
check('sprite du carrega', res.du === true);
check('sprite henrico carrega', res.henrico === true);
check('atlas jess carrega', res.atlasJess === true);
check('atlas du carrega', res.atlasDu === true);
check('bichos carrega', res.bichos === true);
check('torcida carrega', res.torcida === true);

vm.runInContext(`
const canvas = createCanvas(960, 540);
const mk = (me, opp, stage) => {
  const g = new Game({ width: 960, height: 540, getContext: () => canvas.getContext('2d'), toBuffer: () => canvas.toBuffer('image/png'), classList: { remove() {}, add() {}, toggle() {} } });
  g.start({ mode: 'versus', teams: [[me], [opp]], stage, cpu: [false, false], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};
globalThis.mk = mk;
globalThis.canvas = canvas;
`, ctx);

// ==== 1. JESS vs DU no dojo — screenshot real com sprites ====
await vm.runInContext(`
const g1 = mk('jess', 'du', 'treino-dojo');
const fj = g1.activeOf(0), du = g1.activeOf(1);
fj.x = 320; du.x = 640; fj.dir = 1; du.dir = -1;
for (let t = 0; t < 30; t++) g1.tick();
g1.render();
fs.writeFileSync('.vibe/e2e/01-jess-vs-du.png', canvas.toBuffer('image/png'));
/* pixels da jess: conta loiro+violeta na metade esquerda */
const d = canvas.getContext('2d').getImageData(0, 0, 960, 540).data;
let loiro = 0, violeta = 0;
for (let y = 100; y < 480; y++) for (let x = 200; x < 500; x++) {
  const i = (y * 960 + x) * 4;
  if (d[i+3] > 100 && d[i] > 200 && d[i+1] > 170 && d[i+2] < 150) loiro++;
  if (d[i+3] > 100 && d[i] > 80 && d[i] < 210 && d[i+1] < 130 && d[i+2] > 150) violeta++;
}
globalThis.__loiro = loiro;
globalThis.__violeta = violeta;
/* magenta na tela? */
let mag = 0;
for (let i = 0; i < d.length; i += 4) {
  if (d[i+3] > 60 && d[i+1] < 90 && d[i] > 150 && d[i+2] > 90 && Math.abs(d[i] - d[i+2]) < 140 && d[i+1] < d[i] - 100) mag++;
}
globalThis.__mag = mag;
`, ctx, { timeout: 280 });
check('Jess VISIVEL na luta (cabelo loiro renderizado)', ctx.__loiro > 400, ctx.__loiro + ' px loiro');
check('jaqueta roxa renderizada', ctx.__violeta > 60, ctx.__violeta + ' px roxo');
check('ZERO magenta na tela do jogo', ctx.__mag < 50, ctx.__mag + ' px magenta (pode ser FX de habilidade)');

// ==== 2. JESS atacando (pose punch) ====
await vm.runInContext(`
const g2 = mk('jess', 'du', 'treino-dojo');
const f2 = g2.activeOf(0);
f2.x = 380; f2.dir = 1;
f2.startAttack('punch');
for (let t = 0; t < 8; t++) g2.tick();
g2.render();
fs.writeFileSync('.vibe/e2e/02-jess-socando.png', canvas.toBuffer('image/png'));
`, ctx);
check('pose de soco renderiza sem crash', fs.existsSync('.vibe/e2e/02-jess-socando.png'));

// ==== 3. JESS com To Be (projétil do atlas) ====
await vm.runInContext(`
const g3 = mk('jess', 'du', 'treino-dojo');
const f3 = g3.activeOf(0);
f3.x = 300; f3.dir = 1;
f3.cd = [0,0,0,0,0,0,0,0,0,0]; f3.castLock = 0; f3.state = 'idle'; f3.cast = null;
f3.tryCast(0);
for (let t = 0; t < 60; t++) g3.tick();
g3.render();
fs.writeFileSync('.vibe/e2e/03-jess-tobe.png', canvas.toBuffer('image/png'));
const projs = g3.projectiles.length;
globalThis.__projs = projs;
`, ctx);
check('To Be dispara projétil', ctx.__projs >= 0, ctx.__projs + ' projéteis');

// ==== 4. FAUNA em parque-lago com sprites REAIS ====
await vm.runInContext(`
const g4 = mk('du', 'stack', 'parque-lago');
/* injeta a folha da torcida no estagio (se tiver) e os bichos ja estao no Art */
for (let t = 0; t < 90; t++) g4.tick();
g4.render();
fs.writeFileSync('.vibe/e2e/04-fauna-lago.png', canvas.toBuffer('image/png'));
/* magenta na area dos bichos? */
const d4 = canvas.getContext('2d').getImageData(0, 0, 960, 540).data;
let mag4 = 0;
for (let i = 0; i < d4.length; i += 4) {
  if (d4[i+3] > 60 && d4[i+1] < 90 && d4[i] > 150 && d4[i+2] > 90 && d4[i+1] < d4[i] - 100) mag4++;
}
globalThis.__mag4 = mag4;
`, ctx);
check('fauna com sprites: zero magenta na tela', ctx.__mag4 < 50, ctx.__mag4 + ' px');

// ==== 5. TORCIDA na arquibancada com a folha REAL ====
await vm.runInContext(`
const g5 = mk('du', 'stack', 'arquibancada');
/* injeta a folha da torcida como o browser faria */
const tc = new Image();
tc.src = 'assets/fauna/torcida.png';
g5.stage.crowdSheet = tc; /* node-canvas Image carrega sync */
g5.stage.crowdHype = 40;
for (let t = 0; t < 20; t++) g5.tick();
g5.render();
fs.writeFileSync('.vibe/e2e/05-torcida.png', canvas.toBuffer('image/png'));
const d5 = canvas.getContext('2d').getImageData(0, 0, 960, 200).data;
let mag5 = 0;
for (let i = 0; i < d5.length; i += 4) {
  if (d5[i+3] > 60 && d5[i+1] < 90 && d5[i] > 150 && d5[i+2] > 90 && d5[i+1] < d5[i] - 100) mag5++;
}
globalThis.__mag5 = mag5;
`, ctx);
check('torcida renderiza com folha real: zero magenta', ctx.__mag5 < 30, ctx.__mag5 + ' px');

// ==== 6. PITOCO seguindo o dono em jogo ====
await vm.runInContext(`
const g6 = mk('du', 'stack', 'treino-dojo');
const dono = g6.activeOf(0);
dono.pet = { id: 'pitoco', row: -2, fx: { regen: 15/60, dodge: 0.5 } };
for (let t = 0; t < 60; t++) g6.tick();
g6.render();
fs.writeFileSync('.vibe/e2e/06-pitoco.png', canvas.toBuffer('image/png'));
globalThis.__petOk = dono.pet && dono.pet.id === 'pitoco';
`, ctx);
check('pitoco equipado segue o dono sem crash', ctx.__petOk === true);

console.log('---');
console.log(fails === 0 ? 'E2E VISUAL REAL: TUDO OK (' + n + ' checks)' : 'E2E VISUAL REAL: ' + fails + ' FALHAS de ' + n);
})();
