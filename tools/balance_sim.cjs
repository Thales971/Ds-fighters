#!/usr/bin/env node
/* TORNEIO CPU x CPU no motor real (Node, sem desenhar) para medir balanceamento.
   Carrega os mesmos scripts do index.html (dados + motor), roda lutas IA x IA
   de 1 round em arena neutra, sem clima/mecanica/pet, e mede taxa de vitoria.

   Uso:
     node tools/balance_sim.cjs                    -> todos os normais, 2 lutas por par
     node tools/balance_sim.cjs --games 4          -> mais amostras
     node tools/balance_sim.cjs --ids a,b,c        -> so esses (contra o grupo deles)
     node tools/balance_sim.cjs --secret           -> os secretos (contra secretos)
     node tools/balance_sim.cjs --vs normal        -> ids/secretos contra TODOS os normais
     node tools/balance_sim.cjs --out sim.json     -> salva matriz e ranking
     node tools/balance_sim.cjs --seed 7           -> outra semente (Math.random fixo)
     node tools/balance_sim.cjs --mult m.json      -> testa multiplicadores {id: m} em power/hp
     node tools/balance_sim.cjs --pet postgres     -> so o lado testado (--ids) leva esse pet
*/
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true); };
const GAMES = Number(arg('games', 2));
const SEED = Number(arg('seed', 1));

/* Math.random deterministico (mulberry32) para a simulacao ser reproduzivel */
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const M = Object.create(Math); M.random = rng(SEED);

const fake2d = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'measureText' ? () => ({ width: 10 }) : k.startsWith('create') ? () => ({ addColorStop() {} }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
const ctx = {
  console: { log() {}, warn() {}, error() {} }, Audio: class { play() { return Promise.resolve(); } pause() {} }, Math: M, Date, JSON, Image: class { set src(v) {} }, URLSearchParams,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: true }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => true, record() {}, grantAchievement: () => false, hasAchievement: () => true, recordSurvivalBy() {}, recordWinBy() {}, recordStage() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0, releaseAll() {} },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: new Proxy({ hud: new Proxy({}, { get: () => () => {} }), pitocoSeq: [] }, { get: (t, k) => (k in t ? t[k] : () => {}) }),
  HUD: new Proxy({}, { get: () => () => {} }),
  Net: {},
  document: { getElementById: () => null, createElement: () => ({ getContext: () => fake2d(), width: 0, height: 0, style: {} }), querySelectorAll: () => [], querySelector: () => null, addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {}, contains: () => false }, dataset: {} } },
  window: { addEventListener() {}, matchMedia: () => ({ matches: true }) }, navigator: { userAgent: 'node' },
  location: { search: '', hash: '' },
  setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0,
};
ctx.globalThis = ctx;
vm.createContext(ctx);

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"?]+)/g)].map((m) => m[1])
  .filter((f) => /^(assets\/sprites|assets\/stages|assets\/maps|js\/data|js\/engine)\//.test(f))
  .filter((f) => !/engine\/(audio|input)\.js$/.test(f)); /* stubs acima */
for (const f of files) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }); } catch (e) { process.stderr.write('carga ' + f + ': ' + e.message.slice(0, 80) + '\n'); }
}

const api = vm.runInContext('({ Game, FIGHTERS, PETS: typeof PETS !== "undefined" ? PETS : [] })', ctx);
/* --mult arq.json: { id: m } multiplica power e hp do lutador (pra testar ajustes antes de gravar) */
const multFile = arg('mult', null);
if (multFile && multFile !== true) {
  const mult = JSON.parse(fs.readFileSync(multFile, 'utf8'));
  for (const f of api.FIGHTERS) if (mult[f.id]) { f.stats.power = (f.stats.power || 1) * mult[f.id]; f.stats.hp = (f.stats.hp || 100) * mult[f.id]; }
}
const SECRETS = ['du', 'iales', 'felipinho', 'maximilian', 'dolynho'];
const normals = api.FIGHTERS.filter((f) => !f.secret && f.id !== 'boneco-treino' && !SECRETS.includes(f.id)).map((f) => f.id);
const secrets = api.FIGHTERS.filter((f) => SECRETS.includes(f.id)).map((f) => f.id);

let pool = arg('secret', false) ? secrets : normals;
const idsArg = arg('ids', null);
if (idsArg && idsArg !== true) pool = String(idsArg).split(',');
const vs = arg('vs', null) === 'normal' ? normals : pool;

const canvas = { width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } };
const none = api.PETS.find((p) => p.id === 'none') || api.PETS[0];
const petArg = arg('pet', null);
const testPet = petArg && petArg !== true ? api.PETS.find((p) => p.id === petArg) : null;
if (petArg && petArg !== true && !testPet) { console.error('pet nao existe: ' + petArg); process.exit(1); }
const CRASH = {};
function fight(a, b, pa, pb) {
  const g = new api.Game(canvas);
  g.start({ mode: 'versus', teams: [[a], [b]], stage: 'treino-dojo', cpu: [true, true], difficulty: 2, roundsToWin: 1, timer: 60, pets: [pa || none, pb || none] });
  if (g.weather) { g.weather.set('clear'); g.weather.pool = ['clear']; }
  if (g.mech) g.mech.m = {};
  let guard = 0;
  try {
    while (g.running && guard < 9000) { g.tick(); guard++; }
  } catch (e) {
    const key = a + ' x ' + b + ': ' + String(e.message).slice(0, 80) + ' @ ' + (String(e.stack).split('\n')[1] || '').trim();
    CRASH[key] = (CRASH[key] || 0) + 1;
    return -1;
  }
  if (g.teamWins[0] === g.teamWins[1]) {
    const A = g.activeOf(0), B = g.activeOf(1);
    const ra = A.hp / A.maxHp, rb = B.hp / B.maxHp;
    return ra === rb ? -1 : ra > rb ? 0 : 1;
  }
  return g.teamWins[0] > g.teamWins[1] ? 0 : 1;
}

const t0 = Date.now();
const stat = {};
const mat = {};
for (const id of new Set([...pool, ...vs])) stat[id] = { w: 0, l: 0, d: 0 };
let n = 0;
for (const a of pool) {
  mat[a] = {};
  for (const b of vs) {
    if (a === b) continue;
    let wa = 0, played = 0;
    for (let k = 0; k < GAMES; k++) {
      /* alterna os lados para nao favorecer o P1 */
      const swap = k % 2 === 1;
      const r = swap ? fight(b, a, none, testPet) : fight(a, b, testPet, none);
      const aWon = r === -1 ? null : (swap ? r === 1 : r === 0);
      played++;
      if (aWon === null) { stat[a].d++; stat[b].d++; wa += 0.5; }
      else if (aWon) { stat[a].w++; stat[b].l++; wa++; }
      else { stat[a].l++; stat[b].w++; }
      n++;
    }
    mat[a][b] = wa / played;
  }
}
const rate = (s) => (s.w + s.d * 0.5) / Math.max(1, s.w + s.l + s.d);
const rank = pool.map((id) => ({ id, wr: rate(stat[id]), ...stat[id] })).sort((x, y) => y.wr - x.wr);
console.log(`${n} lutas em ${((Date.now() - t0) / 1000).toFixed(0)}s (seed ${SEED}, ${GAMES}/par)`);
for (const r of rank) console.log(r.id.padEnd(16) + (100 * r.wr).toFixed(1).padStart(6) + '%  ' + `${r.w}V ${r.l}D ${r.d}E`);
const wrs = rank.map((r) => r.wr);
const mean = wrs.reduce((p, q) => p + q, 0) / wrs.length;
const sd = Math.sqrt(wrs.reduce((p, q) => p + (q - mean) ** 2, 0) / wrs.length);
console.log(`media ${(100 * mean).toFixed(1)}%  desvio ${(100 * sd).toFixed(1)}  faixa ${(100 * wrs[wrs.length - 1]).toFixed(1)}..${(100 * wrs[0]).toFixed(1)}%`);
const crashes = Object.entries(CRASH);
if (crashes.length) { console.log('TRAVAMENTOS DO MOTOR (' + crashes.length + '):'); for (const [k, v] of crashes) console.log('  ' + v + 'x ' + k); }
const out = arg('out', null);
if (out && out !== true) fs.writeFileSync(out, JSON.stringify({ seed: SEED, games: GAMES, rank, matrix: mat }, null, 1));
