// CLIMA BOLHAS DE SABAO: arte do dono recortada (vidro translucido, sem
// magenta), clima registrado (info + arenas), bolhas sobem, estouram em
// lutador/projetil, dao +1,5 de ultimate a quem estourou e renascem.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { PNG } = require('pngjs');

const ROOT = path.resolve(__dirname, '..');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

/* ---------- arte ---------- */
const at = PNG.sync.read(fs.readFileSync(path.join(ROOT, 'assets/weather/bubbles.png')));
check('atlas de bolhas 384x192 (4x2 de 96)', at.width === 384 && at.height === 192, at.width + 'x' + at.height);
const px = (x, y) => { const i = (y * at.width + x) * 4; return [at.data[i], at.data[i + 1], at.data[i + 2], at.data[i + 3]]; };
const vazio = [];
let mag = 0;
for (let k = 0; k < 8; k++) {
  let c = 0;
  for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) {
    const p = px((k % 4) * 96 + x, ((k / 4) | 0) * 96 + y);
    if (p[3] > 30) c++;
    if (p[3] > 90 && p[0] > 170 && p[1] < 50 && p[2] > 170) mag++;
  }
  if (c < 400) vazio.push(k);
}
check('8 quadros com conteudo (4 bolhas + 4 de estouro)', vazio.length === 0, vazio.join(','));
check('sem fundo magenta sobrando', mag < 30, 'px=' + mag);
const miolo = px(1 * 96 + 48, 48)[3];
check('miolo da bolha e vidro translucido (alpha < 60%)', miolo > 0 && miolo < 153, 'alpha=' + miolo);

/* ---------- motor ---------- */
const fake2d = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'measureText' ? () => ({ width: 10 }) : String(k).startsWith('create') ? () => ({ addColorStop() {} }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
let seed = 3;
const M = Object.create(Math);
M.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const ctx = {
  console: { log() {}, warn() {}, error() {} }, Audio: class { play() { return Promise.resolve(); } pause() {} }, Math: M, Date, JSON, Image: class { set src(v) {} }, URLSearchParams,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => false, hasAchievement: () => true, recordSurvivalBy() {}, recordWinBy() {}, recordStage() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0, releaseAll() {} },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: new Proxy({ hud: new Proxy({}, { get: () => () => {} }), pitocoSeq: [] }, { get: (t, k) => (k in t ? t[k] : () => {}) }),
  HUD: new Proxy({}, { get: () => () => {} }), Net: {},
  document: { getElementById: () => null, createElement: () => ({ getContext: () => fake2d(), width: 0, height: 0, style: {} }), querySelectorAll: () => [], querySelector: () => null, addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {}, contains: () => false }, dataset: {} } },
  window: { addEventListener() {}, matchMedia: () => ({ matches: false }) }, navigator: { userAgent: 'node' }, location: { search: '', hash: '' },
  setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0, __fake2d: fake2d,
};
ctx.globalThis = ctx;
vm.createContext(ctx);
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const f of [...html.matchAll(/<script src="([^"?]+)/g)].map((m) => m[1]).filter((f) => /^(assets\/sprites|js\/data|js\/engine)\//.test(f)).filter((f) => !/engine\/(audio|input)\.js$/.test(f))) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }); } catch (e) { check('carga ' + f, false, e.message.slice(0, 80)); }
}
const R = vm.runInContext(`(() => {
  const out = {};
  out.info = WEATHER_INFO.bubbles;
  out.stages = STAGE_LIST.filter((s) => (s.weather || []).includes('bubbles')).map((s) => s.id);
  const cv = { width: 960, height: 540, getContext: () => __fake2d(), classList: { toggle() {}, add() {}, remove() {} } };
  const none = PETS.find((p) => p.id === 'none') || PETS[0];
  const g = new Game(cv);
  g.start({ mode: 'versus', teams: [['du'], ['jess']], stage: 'circo', cpu: [false, false], roundsToWin: 1, timer: 99, pets: [none, none] });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  g.weather.pool = ['bubbles']; g.weather.changeAt = 1e9; g.weather.set('bubbles');
  for (let t = 0; t < 120; t++) g.tick();
  const w = g.weather;
  out.count = w.drops.length;
  out.designs = [...new Set(w.drops.map((d) => d.design))].sort();
  /* sobem: mede uma bolha livre longe dos lutadores */
  const A = g.activeOf(0), B = g.activeOf(1);
  A.x = 120; B.x = 840;
  const free = w.drops.find((d) => d.pop < 0);
  if (free) { free.x = 480; free.y = -300; }
  const y0 = free ? free.y : 0;
  w.updateParticles();
  out.sobe = free ? free.y < y0 : null;
  /* estoura no lutador e da ultimate */
  w.drops.forEach((d) => { d.pop = -1; d.x = 480; d.y = -400; });
  const alvo = w.drops[0];
  alvo.x = A.x; alvo.y = A.y - 100;
  const u0 = A.ultimate = 10;
  const popped = w._popBubbles();
  out.pop = { popped, estado: alvo.pop, ult: Math.round((A.ultimate - u0) * 10) / 10 };
  /* renasce depois dos quadros de estouro */
  for (let t = 0; t < 20; t++) w.updateParticles();
  out.renasce = alvo.pop === -1 && alvo.y > 0;
  /* projetil tambem estoura */
  const b2 = w.drops[1];
  b2.pop = -1; b2.x = 600; b2.y = -150;
  g.projectiles.push({ x: 600, y: -150, dead: false });
  out.proj = w._popBubbles() >= 1 && b2.pop === 0;
  g.projectiles.length = 0;
  /* desenha sem erro (com e sem sprite) */
  try { w.draw(cv.getContext()); w.drawOverlay(cv.getContext(), 960, 540); out.draw = true; } catch (e) { out.draw = String(e.message); }
  /* luta inteira no clima sem travar */
  try { for (let t = 0; t < 3000 && g.running; t++) g.tick(); out.luta = true; } catch (e) { out.luta = String(e.message).slice(0, 100); }
  return out;
})()`, ctx);
check('clima registrado (nome, icone e regra)', R.info && R.info.name === 'Bolhas de Sabão' && /ultimate/.test(R.info.desc), JSON.stringify(R.info));
check('bolhas aparecem em 6 arenas', R.stages.length === 6, R.stages.join(','));
check('clima gera bolhas dos 4 tipos', R.count >= 15 && R.designs.length === 4, 'qtd=' + R.count + ' tipos=' + R.designs.join(','));
check('bolhas sobem', R.sobe === true, String(R.sobe));
check('encostar estoura a bolha e da +1,5 de ultimate', R.pop.popped >= 1 && R.pop.estado === 0 && R.pop.ult === 1.5, JSON.stringify(R.pop));
check('bolha estourada renasce no chao', R.renasce === true);
check('projetil tambem estoura bolha', R.proj === true);
check('desenha clima e ambientacao sem erro', R.draw === true, String(R.draw));
check('luta inteira com bolhas sem travar', R.luta === true, String(R.luta));

console.log('---');
console.log(fails === 0 ? 'BOLHAS: TUDO OK (' + n + ' checks)' : 'BOLHAS: ' + fails + ' FALHAS de ' + n);
process.exit(fails ? 1 : 0);
