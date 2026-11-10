// AMBIENCIA v2: cada mapa tem vida propria — petalas, neon, glitch, codigo, motes.
const fs = require('fs'); const vm = require('vm');
function req(name){ try { return require(name); } catch(e){ return require('/tmp/node_modules/'+name); } }
const { createCanvas, Image: CanvasImage } = req('canvas');
const ctx = {
  console, Math, Date, Image: CanvasImage,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, skinFor: () => 0 },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} } } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16),
  createCanvas, fs,
};
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/stages/sheets.js', 'assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/pets.js', 'js/data/stages.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 80)); } }
vm.runInContext(`
const canvas = createCanvas(960, 540);
const g = new Game({ width: 960, height: 540, getContext: () => canvas.getContext('2d'), toBuffer: () => canvas.toBuffer('image/png'), classList: { remove() {}, add() {}, toggle() {} } });
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
fs.mkdirSync('.vibe/ambience', { recursive: true });
const CASES = [
  ['japan', 'petal', 'petalas de cerejeira'],
  ['04-neon-city-exe', 'neon', 'neon piscando'],
  ['01-centro-de-dados', 'code', 'chuva de codigo'],
  ['14-catedral-sql', 'mote', 'poeira de luz'],
  ['06-fabrica-de-bugs', 'sparkd', 'faiscas de solda'],
];
for (const [stageId, kind, label] of CASES) {
  const g = new Game({ width: 960, height: 540, getContext: () => canvas.getContext('2d'), toBuffer: () => canvas.toBuffer('image/png'), classList: { remove() {}, add() {}, toggle() {} } });
  g.start({ mode: 'versus', teams: [['du'], ['stack']], stage: stageId, cpu: [false, false], roundsToWin: 2, timer: 99, weather: 'clear' });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  // injeta sprites como o browser faria
  if (g.stage.ambSprites) {
    for (const [k, f] of [['petals', 'assets/weather/petals.png'], ['neon', 'assets/weather/neon.png']]) {
      const img = new Image(); img.src = f;
      g.stage.ambSprites[k] = img;
    }
  }
  for (let t = 0; t < 400; t++) g.tick();
  const count = g.stage.ambient.filter((p) => p.k === kind).length;

  g.render();
  fs.writeFileSync('.vibe/ambience/' + stageId + '.png', canvas.toBuffer('image/png'));
  check(stageId + ' tem ' + label, count > 0, count + ' particulas');
}
console.log('---');
console.log(fails === 0 ? 'AMBIENCIA: TUDO OK (' + n + ' checks)' : 'AMBIENCIA: ' + fails + ' FALHAS de ' + n);
`, ctx);
