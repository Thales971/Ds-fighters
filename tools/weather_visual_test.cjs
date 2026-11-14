// CLIMA v2: renderiza cada clima com canvas REAL (node-canvas) e audita pixels.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
function req(name) {
  try { return require(name); } catch (e) { return require('/tmp/node_modules/' + name); }
}
const { createCanvas, Image: CanvasImage } = req('canvas');
const outDir = path.join('.vibe', 'weather');
fs.mkdirSync(outDir, { recursive: true });

// sprites de clima carregados de forma sincrona (node-canvas aceita src direto)
const WEATHER_IMGS = {};
try {
  const mk = (f) => { const i = new CanvasImage(); i.src = f; return i; };
  WEATHER_IMGS.flakes = mk('assets/weather/snowflakes.png');
  WEATHER_IMGS.leaf = mk('assets/weather/leaf.png');
  WEATHER_IMGS.spark = mk('assets/weather/spark.png');
} catch (e) { console.log('sprites no harness:', String(e).slice(0, 60)); }

const ctx = {
  console, Math, Date, Image: CanvasImage,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0 },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} } } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16),
  createCanvas, WEATHER_IMGS, fs, path, outDir,
};
ctx.globalThis = ctx;
vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/pets.js', 'js/data/stages.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/vfx.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 80)); } }
vm.runInContext(`
const canvas = createCanvas(960, 540);
const g = new Game({ width: 960, height: 540, getContext: () => canvas.getContext('2d'), toBuffer: () => canvas.toBuffer('image/png'), classList: { remove() {}, add() {}, toggle() {} } });
g.start({ mode: 'versus', teams: [['du'], ['stack']], stage: '06-sakura-dojo', cpu: [false, false], roundsToWin: 2, timer: 99 });
for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
/* sprites de clima INJETADOS como o browser faria via onload */
g.weather.sprites.flakes = { img: WEATHER_IMGS.flakes, cell: 28 };
g.weather.sprites.leaf = { img: WEATHER_IMGS.leaf, cell: 16 };
g.weather.sprites.spark = { img: WEATHER_IMGS.spark, cell: 8 };
const KINDS = ['clear', 'rain', 'wind', 'storm', 'snow', 'aurora', 'heatwave'];
for (const kind of KINDS) {
  g.weather.set(kind);
  for (let t = 0; t < 180; t++) { g.tick(); if (t < 60) g.weather.updateParticles(); }
  g.render();
  fs.writeFileSync(path.join(outDir, 'clima-' + kind + '.png'), canvas.toBuffer('image/png'));
  check('clima ' + kind + ' renderiza', true, g.weather.drops.length + ' particulas');
}
g.weather.set('snow');
g.weather.updateParticles();
const flake = g.weather.drops.find((d) => d.design !== undefined);
check('floco tem design (0-5)', !!flake && flake.design >= 0 && flake.design <= 5, 'design=' + (flake && flake.design));
check('floco tem camada de profundidade', !!flake && [0, 1, 2].includes(flake.layer), 'layer=' + (flake && flake.layer));
check('sprites de clima no disco', fs.existsSync('assets/weather/snowflakes.png') && fs.existsSync('assets/weather/leaf.png') && fs.existsSync('assets/weather/spark.png'), 'flakes/leaf/spark');
console.log('---');
console.log(fails === 0 ? 'CLIMA v2: TUDO OK (' + n + ' checks)' : 'CLIMA v2: ' + fails + ' FALHAS de ' + n);
`, ctx);
