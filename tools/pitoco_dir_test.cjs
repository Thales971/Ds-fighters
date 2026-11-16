// PITOCO: o sprite da folha olha para a ESQUERDA no cru — o pet deve ser desenhado
// com dir = -dono.dir para acompanhar o dono e olhar pro lado da luta.
const fs = require('fs'); const vm = require('vm');
function req(name){ try { return require(name); } catch(e){ return require('/tmp/node_modules/'+name); } }
const { createCanvas } = req('canvas');
const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas, fs,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0,
    unlockPitoco() { this.data.pitocoUnlocked = true; return true; }, hasPitoco() { return !!this.data.pitocoUnlocked; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {}, pitocoSeq: [], pitocoKey() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} } } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/pets.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 80)); } }
vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), createPattern: () => ({}), set imageSmoothingEnabled(v) {}, set globalAlpha(v) {}, set globalCompositeOperation(v) {}, set fillStyle(v) {}, set strokeStyle(v) {}, set font(v) {}, set textAlign(v) {}, set lineWidth(v) {}, set filter(v) {}, set shadowColor(v) {}, set shadowBlur(v) {} });
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const mk = () => {
  const canvas = { width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } };
  const g = new Game(canvas);
  g.start({ mode: 'versus', teams: [['du'], ['du']], stage: 'treino-dojo', cpu: [true, true], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};

const g = mk();
const dono = g.activeOf(0);
dono.pet = { id: 'pitoco', row: -1, fx: { dodge: 0.5, regen: 15 / 60 } };
dono.state = 'idle'; dono.alive = true; dono.benched = false;

// espia o Art.cell para capturar o dir usado no desenho do pitoco
const calls = [];
const origCell = Art.cell.bind(Art);
Art.cell = (c2, key, row, col, x, y, opts) => { calls.push({ key, row, col, x, y, dir: opts && opts.dir }); return false; };

for (const dir of [1, -1]) {
  dono.dir = dir; dono.x = 400; dono.y = 0; dono.frame = 0;
  calls.length = 0;
  dono.draw(fake2d());
  const pit = calls.find((c) => c.key === 'pitoco');
  check('pitoco desenhado com dir = -dono.dir quando dono.dir=' + dir, !!pit && pit.dir === -dir, pit ? 'dir=' + pit.dir : 'nao desenhou');
  check('pitoco fica ATRAS do dono (px = x - dir*78)', !!pit && pit.x === 400 - dir * 78, pit ? 'x=' + pit.x : '');
}
Art.cell = origCell;

// pet da folha 'pets' continua com dir = dono.dir (folha olha pra direita no cru)
dono.pet = { id: 'cat', row: 1, fx: {} };
for (const dir of [1, -1]) {
  dono.dir = dir; dono.frame = 0;
  calls.length = 0;
  Art.cell = (c2, key, row, col, x, y, opts) => { calls.push({ key, dir: opts && opts.dir }); return false; };
  dono.draw(fake2d());
  const pet = calls.find((c) => c.key === 'pets');
  check('pet da folha pets continua dir = dono.dir (' + dir + ')', !!pet && pet.dir === dir, pet ? 'dir=' + pet.dir : 'nao desenhou');
}
Art.cell = origCell;

console.log('---');
console.log(fails === 0 ? 'PITOCO DIR: TUDO OK (' + n + ' checks)' : 'PITOCO DIR: ' + fails + ' FALHAS de ' + n);
`, ctx);
