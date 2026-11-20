// LYRA, a Maga do JavaScript (arte do dono) + correcao do DALTONIC da Jess.
// - folha de poses 1280x3900 com os 60 quadros, pe na linha, sem magenta,
//   sem o 'buraco' preto dentro do arco do cajado
// - atlas animado + folha extra (circulo de runas da ult e impacto)
// - kit: arrow function (burn), Promise.all (3 setas, lento), event loop
//   (zona: lento + medidor lento), try/catch (aura: reflexo), ULT exclusiva
//   Stack Overflow (raios + poderes do rival em recarga + carga pela metade)
// - balanceada (FORCA 2.05 ~ 50% contra os normais), na grade de selecao, IA ok
// - JESS: com a vitima sendo a CPU (ou 2 jogadores no mesmo PC), a propria
//   vitima aparece cinza/turva no gas rosa (antes a ult parecia nao fazer nada)
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { PNG } = require('pngjs');

const ROOT = path.resolve(__dirname, '..');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const png = (f) => PNG.sync.read(fs.readFileSync(path.join(ROOT, f)));


/* ---------- 1. arte ---------- */
{
  const sh = png('assets/sprites/lyra.png');
  check('folha de poses 1280x3900', sh.width === 1280 && sh.height === 3900, sh.width + 'x' + sh.height);
  const empty = [], feet = [], mag = [];
  for (let r = 0; r < 15; r++) for (let c = 0; c < 4; c++) {
    let cnt = 0, bottom = 0, m = 0;
    for (let y = 0; y < 260; y++) for (let x = 0; x < 320; x++) {
      const i = ((r * 260 + y) * 1280 + c * 320 + x) * 4;
      if (sh.data[i + 3] > 40) { cnt++; bottom = Math.max(bottom, y); if (sh.data[i] > 170 && sh.data[i + 1] < 40 && sh.data[i + 2] > 170) m++; }
    }
    if (cnt < 2500) empty.push(r + ':' + c);
    if (![2, 8, 9].includes(r) && Math.abs(bottom - 246) > 3) feet.push(r + ':' + c + '=' + bottom);
    if (m > 30) mag.push(r + ':' + c + '=' + m);
  }
  check('60 quadros com a maga inteira', empty.length === 0, empty.join(','));
  check('pe na linha do chao nas poses de chao', feet.length === 0, feet.join(','));
  check('sem fundo magenta sobrando', mag.length === 0, mag.join(','));
  /* chute = giro do cajado: o miolo do arco (fundo cercado) tem que ser transparente */
  let dark = 0;
  for (let y = 40; y < 200; y++) for (let x = 0; x < 320; x++) { const i = ((5 * 260 + y) * 1280 + x) * 4; if (sh.data[i + 3] > 200 && sh.data[i] + sh.data[i + 1] + sh.data[i + 2] < 40) dark++; }
  check('sem mancha preta dentro do arco do cajado (chute)', dark < 600, 'px escuros=' + dark);
  const ab = png('assets/abilities/lyra.png');
  const ex = png('assets/abilities/lyra-extra.png');
  check('atlas 512x640 + extra 512x256', ab.width === 512 && ab.height === 640 && ex.width === 512 && ex.height === 256);
  const hash = (img, r, c) => { let h = 0; for (let y = 0; y < 128; y += 2) for (let x = 0; x < 128; x += 2) { const i = ((r * 128 + y) * img.width + c * 128 + x) * 4; h = (h * 31 + img.data[i] + img.data[i + 1] * 3 + img.data[i + 3] * 7) >>> 0; } return h; };
  const fill = (img, r, c) => { let k = 0; for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) if (img.data[((r * 128 + y) * img.width + c * 128 + x) * 4 + 3] > 20) k++; return k; };
  const still = [], vazio = [];
  for (let r = 0; r < 5; r++) { if (new Set([0, 1, 2, 3].map((c) => hash(ab, r, c))).size < 3) still.push(r); for (let c = 0; c < 4; c++) if (fill(ab, r, c) < 600) vazio.push(r + ':' + c); }
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) if (fill(ex, r, c) < 300) vazio.push('extra' + r + ':' + c);
  check('cada poder anima (>= 3 quadros diferentes)', still.length === 0, still.join(','));
  check('nenhum quadro de habilidade vazio', vazio.length === 0, vazio.join(','));
  const face = png('assets/ui/face-lyra.png');
  let fn = 0; for (let i = 3; i < face.data.length; i += 4) if (face.data[i] > 8) fn++;
  check('rosto da HUD da Lyra', face.width === 168 && fn > 3000, 'px=' + fn);
}

/* ---------- 2. motor (mesmos scripts do index.html) ---------- */
let seed = 7;
const M = Object.create(Math);
M.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const fake2d = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'measureText' ? () => ({ width: 10 }) : String(k).startsWith('create') ? () => ({ addColorStop() {} }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
const ctx = {
  console: { log() {}, warn() {}, error() {} }, Audio: class { play() { return Promise.resolve(); } pause() {} }, Math: M, Date, JSON, Image: class { set src(v) { this._src = v; } }, URLSearchParams,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: true }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => true, record() {}, grantAchievement: () => false, hasAchievement: () => true, recordSurvivalBy() {}, recordWinBy() {}, recordStage() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0, releaseAll() {} },
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
const files = [...html.matchAll(/<script src="([^"?]+)/g)].map((m) => m[1])
  .filter((f) => /^(assets\/sprites|js\/data|js\/engine)\//.test(f)).filter((f) => !/engine\/(audio|input)\.js$/.test(f));
check('index.html carrega fighters-lyra.js antes do balance-v14', files.includes('js/data/fighters-lyra.js') && files.indexOf('js/data/fighters-lyra.js') < files.indexOf('js/data/balance-v14.js'));
for (const f of files) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }); } catch (e) { check('carga ' + f, false, e.message.slice(0, 80)); }
}

const R = vm.runInContext(`(() => {
  const f = FIGHTERS.find((x) => x.id === 'lyra');
  const kit = POWERS.lyra.powers;
  return { found: !!f, secret: f && f.secret, stats: f && f.stats, kinds: kit.map((p) => p.kind), names: kit.map((p) => p.name),
    roster: ROSTER_PORTRAITS.order.indexOf('lyra'), rv: ROSTER_PORTRAITS.version, url: SpriteGen.url('lyra'),
    sheets: !!(ART_SHEETS['abil:lyra'] && ART_SHEETS['fx2:lyra'] && ART_SHEETS['fx2:lyra-extra']) };
})()`, ctx);
check('Lyra registrada (normal, nao secreta)', R.found && !R.secret, JSON.stringify(R.stats));
check('kit: arrow function / Promise.all / event loop / try-catch / Stack Overflow', JSON.stringify(R.kinds) === JSON.stringify(['shot', 'shot', 'zone', 'aura', 'stackoverflow']), R.names.join(' | '));
check('balanceada com o FORCA do v14 (2.05)', Math.abs(R.stats.power - 2.296) < 0.01, JSON.stringify(R.stats));
check('na grade de selecao + folhas registradas + cache proprio', R.roster === 52 && R.rv === 'v65-lyra' && R.sheets && /v65-lyra/.test(R.url), R.roster + ' ' + R.rv + ' ' + R.url);

const res = vm.runInContext(`(() => {
  const cv = { width: 960, height: 540, getContext: () => (${fake2d.toString()})(), classList: { toggle() {}, add() {}, remove() {} } };
  const none = PETS.find((p) => p.id === 'none') || PETS[0];
  const mk = (a, b) => {
    const g = new Game(cv);
    g.start({ mode: 'versus', teams: [[a || 'lyra'], [b || 'hacker']], stage: 'treino-dojo', cpu: [false, false], difficulty: 2, roundsToWin: 1, timer: 99, pets: [none, none] });
    if (g.weather) { g.weather.set('clear'); g.weather.pool = ['clear']; }
    if (g.mech) g.mech.m = {};
    for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
    const me = g.activeOf(0), op = g.activeOf(1);
    me.x = 300; op.x = 480; me.dir = 1; op.dir = -1; op.status = {}; me.cd = [0, 0, 0, 0, 0]; me.charge = [100, 100]; me.ultimate = 100; me.castLock = 0; me.state = 'idle'; me.cast = null;
    return [g, me, op];
  };
  const run = (slot, ticks, watch, setup) => {
    const [g, me, op] = mk();
    if (setup) setup(g, me, op);
    const hp0 = op.hp; const seen = {};
    me.tryCast(slot);
    for (let t = 0; t < ticks; t++) { g.tick(); for (const s of watch) if (op.has(s) || me.has(s)) seen[s] = true; }
    return { dmg: Math.round((hp0 - op.hp) * 10) / 10, seen, opCd: op.cd.slice(0, 2), opCharge: op.charge.map(Math.round), zones: g.zones.length };
  };
  const out = {};
  out.arrow = run(0, 160, ['burn']);
  out.promise = run(1, 200, ['slow']);
  out.loop = run(2, 200, ['slow', 'meterSlow']);
  out.trycatch = run(3, 30, ['reflect']);
  out.ult = run(4, 140, ['paralyze'], (g, me, op) => { op.charge = [80, 80]; op.cd = [0, 0, 0, 0, 0]; });
  /* IA x IA */
  let done = 0, err = null;
  for (let k = 0; k < 4; k++) {
    try {
      const g = new Game(cv);
      g.start({ mode: 'versus', teams: k % 2 ? [['du'], ['lyra']] : [['lyra'], ['jess']], stage: 'treino-dojo', cpu: [true, true], difficulty: 3, roundsToWin: 1, timer: 60, pets: [none, none] });
      let guard = 0; while (g.running && guard++ < 9000) g.tick();
      done++;
    } catch (e) { err = String(e.message).slice(0, 120); }
  }
  out.ia = { done, err };
  /* JESS: vitima CPU -> nuvem + cinza desenhados na propria vitima */
  {
    const [g, me, op] = mk('jess', 'du');
    let cloud = 0; const orig = op._drawDaltonicCloud.bind(op); op._drawDaltonicCloud = (c) => { cloud++; return orig(c); };
    op.addStatus('daltonic', 300, me);
    g._daltonicOn = false; op.draw(cv.getContext());
    const fora = cloud;
    g._daltonicOn = true; op.draw(cv.getContext());
    out.jess = { fora, tela: cloud - fora };
  }
  return out;
})()`, ctx);
check('Arrow Function: acerta e QUEIMA', res.arrow.dmg > 5 && res.arrow.seen.burn, JSON.stringify(res.arrow));
check('Promise.all: setas acertam e deixam LENTO', res.promise.dmg > 3 && res.promise.seen.slow, JSON.stringify(res.promise));
check('Event Loop: zona com dano + LENTO + MEDIDOR LENTO', res.loop.dmg > 1 && res.loop.seen.slow && res.loop.seen.meterSlow, JSON.stringify(res.loop));
check('try { } catch: escudo de REFLEXO ligado', res.trycatch.seen.reflect, JSON.stringify(res.trycatch));
check('Stack Overflow: dano + circulo + poderes do rival em recarga + carga pela metade', res.ult.dmg > 10 && res.ult.opCd[0] > 60 && res.ult.opCd[1] > 60 && res.ult.opCharge.every((c) => c < 75), JSON.stringify(res.ult));
check('IA x IA com a Lyra: 4 lutas sem travar', res.ia.done === 4 && !res.ia.err, JSON.stringify(res.ia));
check('JESS Daltonic: vitima fora da tela cinza ganha nuvem rosa (e nao duplica quando a tela ja esta cinza)', res.jess.fora === 1 && res.jess.tela === 0, JSON.stringify(res.jess));

console.log('---');
console.log(fails === 0 ? 'LYRA + JESS: TUDO OK (' + n + ' checks)' : 'LYRA + JESS: ' + fails + ' FALHAS de ' + n);
process.exit(fails ? 1 : 0);
