// NEBLINA: clima fog — bancos de neblina + tela embaçada (.fogged)
const fs = require('fs'); const vm = require('vm');
function req(name){ try { return require(name); } catch(e){ return require('/tmp/node_modules/'+name); } }
const { createCanvas } = req('canvas');
const ctx = {
  console, Math, Date, Image: class { set src(v){} },
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
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js','js/data/powers-balance-v12.js','js/data/powers-balance-v13.js', 'js/data/pets.js', 'js/data/stages.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 80)); } }
vm.runInContext(`
const canvas = createCanvas(960, 540);
let fogged = false;
const canvasStub = { getContext: () => canvas.getContext('2d'), classList: { toggle(c, on) { if (c === 'fogged') fogged = !!on; }, add() {}, remove() {} } };
const g = new Game({ width: 960, height: 540, getContext: () => canvas.getContext('2d'), toBuffer: () => canvas.toBuffer('image/png'), classList: canvasStub.classList });
g.canvas = canvasStub;
g.start({ mode: 'versus', teams: [['du'], ['stack']], stage: '01-centro-de-dados', cpu: [false, false], roundsToWin: 2, timer: 99 });
for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
// WEATHER_INFO tem a neblina
check('WEATHER_INFO tem neblina', !!WEATHER_INFO.fog, WEATHER_INFO.fog ? WEATHER_INFO.fog.name : 'sem');
// pool do centro de dados inclui fog
const pool = (typeof STAGE_EXTRA === 'object') ? STAGE_EXTRA['01-centro-de-dados'] : (STAGES.find((s) => s.id === '01-centro-de-dados') || {});
check('stage 01 tem fog no pool', ((pool && pool.weather) || []).includes('fog'), JSON.stringify(pool && pool.weather));
// seta a neblina e roda
g.weather.set('fog');
for (let t = 0; t < 180; t++) g.tick();
check('particulas de neblina', g.weather.drops.length > 8, g.weather.drops.length + ' bancos');
g.render();
fs.mkdirSync('.vibe/weather', { recursive: true });
fs.writeFileSync('.vibe/weather/clima-fog.png', canvas.toBuffer('image/png'));
check('classe .fogged ativada na tela', fogged === true, 'fogged=' + fogged);
// sai da neblina: tela volta ao normal
g.weather.set('clear');
for (let t = 0; t < 30; t++) g.tick();
g.render();
check('sai da neblina: tela limpa', fogged === false, 'fogged=' + fogged);
console.log('---');
console.log(fails === 0 ? 'NEBLINA: TUDO OK (' + n + ' checks)' : 'NEBLINA: ' + fails + ' FALHAS de ' + n);
`, ctx);
