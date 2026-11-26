// MODO AJUDA NO TOQUE: avanco ao atacar de longe + defesa sozinho parado.
// Motor real (scripts do index.html), input do jogador 1 controlado pelo teste.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x !== undefined ? ' — ' + x : '')); if (!c) fails++; };
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const blank = () => ({ left: false, right: false, up: false, down: false, punch: false, kick: false, tag: false, a0: false, a1: false, a2: false, a3: false, a4: false, a5: false, a6: false, a7: false, a8: false, a9: false });
const P1 = { cur: blank() };
const settings = {};
const fake2d = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'measureText' ? () => ({ width: 10 }) : k.startsWith('create') ? () => ({ addColorStop() {} }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
const M = Object.create(Math); M.random = rng(3);
const ctx = {
  console: { log() {}, warn() {}, error() {} }, Math: M, Date, JSON, URLSearchParams,
  Image: class { set src(v) {} }, Audio: class { play() { return Promise.resolve(); } pause() {} },
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: true }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: (k) => settings[k], reducedMotion: () => true, record() {}, grantAchievement: () => false, hasAchievement: () => true, recordSurvivalBy() {}, recordWinBy() {}, recordStage() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze(blank()),
  Input: { touchUsed: true, init() {}, read: (slot) => (slot === 0 ? Object.assign({}, P1.cur) : blank()), pad: () => null, padCount: 0, releaseAll() {} },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: new Proxy({ hud: new Proxy({}, { get: () => () => {} }), pitocoSeq: [] }, { get: (t, k) => (k in t ? t[k] : () => {}) }),
  HUD: new Proxy({}, { get: () => () => {} }), Net: {},
  document: { getElementById: () => null, createElement: () => ({ getContext: () => fake2d(), width: 0, height: 0, style: {} }), querySelectorAll: () => [], querySelector: () => null, addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {}, contains: () => false }, dataset: {} } },
  window: { addEventListener() {}, matchMedia: () => ({ matches: true }) }, navigator: { userAgent: 'node' }, location: { search: '', hash: '' },
  setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0,
};
ctx.globalThis = ctx;
vm.createContext(ctx);
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
check('index.html carrega touch-assist.js', /touch-assist\.js/.test(html));
const files = [...html.matchAll(/<script src="([^"?]+)/g)].map((m) => m[1])
  .filter((f) => /^(assets\/sprites|assets\/stages|assets\/maps|js\/data|js\/engine)\//.test(f))
  .filter((f) => !/engine\/(audio|input)\.js$/.test(f));
for (const f of files) { try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }); } catch (e) { check('carga ' + f, false, e.message.slice(0, 80)); } }
const api = vm.runInContext('({ Game, PETS })', ctx);
const canvas = { width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } };
const none = api.PETS[0];

function mk(opts = {}) {
  const g = new api.Game(canvas);
  g.rnd = rng(opts.seed || 5);
  g.start({ mode: opts.mode || 'versus', teams: [[opts.me || 'stack'], [opts.opp || 'du']], stage: 'treino-dojo', cpu: [false, !!opts.cpu2], difficulty: 2, roundsToWin: 1, timer: 99, pets: [none, none] });
  if (g.weather) { g.weather.set('clear'); g.weather.pool = ['clear']; }
  if (g.mech) g.mech.m = {};
  for (let t = 0; t < 900 && g.roundState !== 'fight'; t++) g.tick();
  return g;
}

/* 1) avanco ao atacar de longe */
{
  const g = mk();
  const me = g.activeOf(0), opp = g.activeOf(1);
  me.x = 200; opp.x = 700;
  P1.cur = Object.assign(blank(), { punch: true });
  const i1 = g.inputFor(0);
  check('soco longe do rival: anda na direcao dele em vez de socar o ar', i1.right && !i1.punch, JSON.stringify({ right: i1.right, punch: i1.punch }));
  P1.cur = blank();
  let punched = false, t = 0;
  const x0 = me.x;
  for (; t < 120 && !punched; t++) { const inp = g.inputFor(0); if (inp.punch) punched = true; me.update(inp); opp.update(blank()); g.tickEntities && 0; }
  check('o lutador chega perto e solta o soco guardado', punched && Math.abs(opp.x - me.x) < 200, 'andou ' + Math.round(me.x - x0) + 'px, distancia ' + Math.round(Math.abs(opp.x - me.x)));
  /* mexer o direcional cancela */
  me.x = 200; opp.x = 700;
  P1.cur = Object.assign(blank(), { punch: true }); g.inputFor(0);
  P1.cur = Object.assign(blank(), { left: true });
  const i2 = g.inputFor(0);
  check('mexer o direcional cancela o avanco (o jogador manda)', i2.left && !i2.right);
  P1.cur = blank();
  const i3 = g.inputFor(0);
  check('depois de cancelar nao volta a andar sozinho', !i3.right && !i3.left);
}

/* 2) defesa sozinho */
{
  const g = mk();
  const me = g.activeOf(0), opp = g.activeOf(1);
  me.x = 400; opp.x = 480; me.dir = 1; opp.dir = -1;
  opp.state = 'attack'; opp.stateTime = 1; opp.attack = { startup: 6, active: 3, height: 'mid' };
  P1.cur = blank();
  const b1 = g.inputFor(0);
  check('parado e o rival ataca perto: segura pra tras (defende)', b1.left && !b1.right && !b1.down, JSON.stringify({ l: b1.left, r: b1.right, d: b1.down }));
  opp.attack = { startup: 6, active: 3, height: 'low' };
  const b2 = g.inputFor(0);
  check('golpe baixo: defende agachado', b2.left && b2.down);
  P1.cur = Object.assign(blank(), { right: true });
  const b3 = g.inputFor(0);
  check('se o jogador esta andando, a ajuda nao mexe', b3.right && !b3.left);
  P1.cur = Object.assign(blank(), { punch: true });
  const b4 = g.inputFor(0);
  check('se o jogador esta atacando, a ajuda nao defende no lugar dele', b4.punch && !b4.left);
  P1.cur = blank();
  opp.state = 'idle'; opp.attack = null;
  const b5 = g.inputFor(0);
  check('sem ameaca, parado continua parado', !b5.left && !b5.right && !b5.down);
}

/* 3) quando NAO ajuda */
{
  const cases = [
    ['opcao desligada', () => { settings.touchAssist = false; }, () => { delete settings.touchAssist; }],
    ['sem toque (teclado/controle)', () => { ctx.Input.touchUsed = false; }, () => { ctx.Input.touchUsed = true; }],
  ];
  for (const [name, on, off] of cases) {
    on();
    const g = mk();
    const me = g.activeOf(0), opp = g.activeOf(1);
    me.x = 200; opp.x = 700;
    P1.cur = Object.assign(blank(), { punch: true });
    const i = g.inputFor(0);
    check(name + ': sem ajuda (soco sai normal)', i.punch && !i.right);
    off();
  }
  const go = mk({ mode: 'online' });
  check('online: Modo Ajuda nunca liga', go.assistOn(0) === false);
  const g2 = mk();
  check('jogador 2 nunca recebe ajuda', g2.assistOn(1) === false);
  P1.cur = blank();
}

/* 4) luta de verdade: parado contra a CPU, com e sem ajuda */
function idleFight(assist, seed) {
  if (!assist) settings.touchAssist = false; else delete settings.touchAssist;
  const g = mk({ cpu2: true, opp: 'nunes', seed });
  P1.cur = blank();
  const me = g.activeOf(0);
  const h0 = me.hp;
  for (let t = 0; t < 1500 && g.running && g.roundState === 'fight'; t++) g.tick();
  delete settings.touchAssist;
  return { lost: h0 - Math.max(0, me.hp), blocks: (g._assist && g._assist.blocks) || 0 };
}
{
  let a = 0, b = 0, blocks = 0;
  for (const s of [3, 9, 21]) { const w = idleFight(true, s), wo = idleFight(false, s); a += w.lost; b += wo.lost; blocks += w.blocks; }
  check('parado 25 s contra a CPU: com ajuda leva bem menos dano', a < b * 0.75, 'com ajuda ' + Math.round(a) + ' x sem ' + Math.round(b));
  check('a ajuda defendeu de verdade (varias vezes)', blocks > 20, blocks + ' quadros defendendo');
}

console.log('\n' + (fails ? `MODO AJUDA: ${fails} FALHAS (${n} checks)` : `MODO AJUDA: TUDO OK (${n} checks)`));
process.exit(fails ? 1 : 0);
