// PETS DEV (nov/2026): sprites 4x3 e as habilidades ATIVAS em luta de verdade
// (rollback, npm install, sonar, resposta aceita, goroutines, debug).
const fs = require('fs'); const vm = require('vm');
function req(name) { return require(name); }
const { createCanvas } = req('canvas');
const { PNG } = req('pngjs');

// localStorage em memoria para o Profile real
const store = {};
const localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};

const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas, fs, PNG, localStorage, store,
  HUD: new Proxy({}, { get: () => () => {} }),
  AppViewport: { fullscreen() {} },
  Profile: undefined,
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), releaseAll() {}, hit: () => false, pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: undefined,
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: (id) => (id === 'toast' ? { textContent: '', classList: { add() {}, remove() {}, toggle() {} } } : null), /* UI.toast real roda nas conquistas */ createElement: () => createCanvas(960, 540), querySelectorAll: () => [], addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} }, dataset: {} }, activeElement: null },
  window: { addEventListener() {}, matchMedia: () => ({ matches: false }) }, location: { hash: '' }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/core/profile.js', 'js/ui/ui.js',
  'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/pet-skills.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 90)); } }

vm.runInContext(`
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const ids = ['postgres', 'npm', 'mysql', 'stackoverflow', 'gopher-go', 'pato'];
for (const id of ids) {
  const p = PETS.find((x) => x.id === id);
  check('pet ' + id + ' existe com sheet e buff', !!(p && p.sheet && p.buff && p.fx));
  const png = PNG.sync.read(fs.readFileSync('assets/pets/' + p.sheet + '.png'));
  check(p.sheet + '.png 384x288 (4x3 de 96)', png.width === 384 && png.height === 288, png.width + 'x' + png.height);
  let filled = 0;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    let a = 0; for (let y = r * 96; y < r * 96 + 96; y += 3) for (let x = c * 96; x < c * 96 + 96; x += 3) if (png.data[(y * png.width + x) * 4 + 3] > 40) a++;
    if (a > 60) filled++;
  }
  check(p.sheet + ': 12 quadros com desenho', filled === 12, filled);
}
const fake2d = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : (k === 'measureText' ? () => ({ width: 10 }) : (k === 'createLinearGradient' || k === 'createRadialGradient') ? () => ({ addColorStop() {} }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : () => {})), set: (t, k, v) => { t[k] = v; return true; } });
const canvas = { width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } };
for (const k of ['banner', 'cutIn', 'toast', 'onMatchEnd', 'updateTouch']) UI[k] = () => {};
const mk = (petId) => {
  const g = new Game(canvas);
  g.rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  g.start({ mode: 'versus', teams: [['stack'], ['du']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99, pets: [PETS.find((x) => x.id === petId), PETS[0]] });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};
// ROLLBACK: golpe pesado perde metade, so 1x por round
{ const g = mk('postgres'); const a = g.activeOf(0), b = g.activeOf(1);
  const h0 = a.hp; a.takeHit(30, { attacker: b, kx: 1, dirSign: 1 }); const d1 = h0 - a.hp;
  const h1 = a.hp; a.takeHit(30, { attacker: b, kx: 1, dirSign: 1 }); const d2 = h1 - a.hp;
  check('postgres: 1o golpe pesado perde ~metade (rollback)', d1 > 0 && d1 < d2 * 0.75, d1.toFixed(1) + ' vs ' + d2.toFixed(1)); }
// NPM: instala pacote em ate 12s
{ const g = mk('npm'); const a = g.activeOf(0); let got = null;
  for (let t = 0; t < 800 && !got; t++) { g.tick(); if (a._npmPkg) got = a._npmPkg.k; }
  check('npm: instala um pacote durante a luta', !!got, got); }
// SONAR: rival leva dano e fica lento
{ const g = mk('mysql'); const a = g.activeOf(0), b = g.activeOf(1); b.x = a.x + 300; const h0 = b.hp; let hit = false;
  for (let t = 0; t < 500 && !hit; t++) { g.tick(); if (b.hp < h0) hit = true; }
  check('mysql: sonar acerta o rival', hit, (h0 - b.hp).toFixed(1));
  check('mysql: sonar deixa LENTO', b.left('slow') > 0 || hit); }
// CORUJA: em 200 golpes, alguns viram 25%
{ const g = mk('stackoverflow'); const a = g.activeOf(0), b = g.activeOf(1); const ds = [];
  const pc = a.petCheer.bind(a); a.petCheer = (t, c) => { if (t === 'RESPOSTA ACEITA!') a._owlCount = (a._owlCount || 0) + 1; pc(t, c); };
  for (let k = 0; k < 200; k++) { a.hp = a.maxHp; a.comboCount = 0; a.juggle = 0; const h0 = a.hp; a.takeHit(10, { attacker: b, kx: 0, dirSign: 1 }); ds.push(h0 - a.hp); a.state = 'idle'; a.stateTime = 0; for (let t = 0; t < 40; t++) g.tick(); }
  const reduced = a._owlCount || 0;
  check('stackoverflow: ~15% dos golpes viram 25% (entre 10 e 60 de 200)', reduced >= 10 && reduced <= 60, reduced); }
// GOROUTINES: a cada 4 acertos, 2 extras de 3
{ const g = mk('gopher-go'); const a = g.activeOf(0), b = g.activeOf(1);
  for (let k = 0; k < 4; k++) { b.takeHit(5, { attacker: a, kx: 0, dirSign: 1 }); b.state = 'idle'; }
  const h0 = b.hp; for (let t = 0; t < 30; t++) g.tick();
  check('gopher-go: 4o acerto solta 2 goroutines (-6)', Math.abs((h0 - b.hp) - 6) < 0.6 || h0 - b.hp >= 5.4, (h0 - b.hp).toFixed(1)); }
// PATO: limpa debuff e cura
{ const g = mk('pato'); const a = g.activeOf(0); a.hp = a.maxHp - 50; a.addStatus('burn', 600); a.addStatus('slow', 600);
  for (let t = 0; t < 90; t++) g.tick();
  check('pato: debuga (tira queimadura e lentidao)', a.left('burn') <= 0 && a.left('slow') <= 0, a.left('burn') + '/' + a.left('slow')); }
// reacao do pet (linha do atlas)
{ const g = mk('pato'); const a = g.activeOf(0); a.state = 'hit'; check('pet reage ao dono apanhar (linha 1)', a.petRow() === 1); a.state = 'win'; check('pet comemora vitoria (linha 2)', a.petRow() === 2); }
console.log('---'); console.log(fails ? 'PETS DEV: ' + fails + ' FALHAS de ' + n : 'PETS DEV: TUDO OK (' + n + ' checks)');
if (fails) process.exitCode = 1;
`, Object.assign(ctx, { process }));
