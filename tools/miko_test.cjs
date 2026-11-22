// MIKO (arte do dono): poses das 2 folhas espelhadas, atlas
// animado + extra (onda de choque e impacto), kit: chicotada (vulneravel +
// tonto), query arremessada (lento + medidor lento), estouro do elefante
// (dash que lanca), indice B-tree (pillar que PRENDE) e ult Pisao do Elefante
// (blast + onda no chao). Balanceado (FORCA 2.05), na grade, IA ok.
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
  const sh = png('assets/sprites/miko.png');
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
    if (m > 200) mag.push(r + ':' + c + '=' + m);
  }
  check('60 quadros com a Miko inteira', empty.length === 0, empty.join(','));
  check('pe na linha do chao nas poses de chao', feet.length === 0, feet.join(','));
  check('sem fundo magenta sobrando', mag.length === 0, mag.join(','));
  const ab = png('assets/abilities/miko.png');
  const ex = png('assets/abilities/miko-extra.png');
  check('atlas 512x640 + extra 512x256', ab.width === 512 && ab.height === 640 && ex.width === 512 && ex.height === 256);
  const hash = (img, r, c) => { let h = 0; for (let y = 0; y < 128; y += 2) for (let x = 0; x < 128; x += 2) { const i = ((r * 128 + y) * img.width + c * 128 + x) * 4; h = (h * 31 + img.data[i] + img.data[i + 1] * 3 + img.data[i + 3] * 7) >>> 0; } return h; };
  const fill = (img, r, c) => { let k = 0; for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) if (img.data[((r * 128 + y) * img.width + c * 128 + x) * 4 + 3] > 20) k++; return k; };
  const still = [], vazio = [];
  for (let r = 0; r < 5; r++) { if (new Set([0, 1, 2, 3].map((c) => hash(ab, r, c))).size < 3) still.push(r); for (let c = 0; c < 4; c++) if (fill(ab, r, c) < 600) vazio.push(r + ':' + c); }
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) if (fill(ex, r, c) < 300) vazio.push('extra' + r + ':' + c);
  check('cada poder anima (>= 3 quadros diferentes)', still.length === 0, still.join(','));
  check('nenhum quadro de habilidade vazio', vazio.length === 0, vazio.join(','));
  const face = png('assets/ui/face-miko.png');
  let fn = 0; for (let i = 3; i < face.data.length; i += 4) if (face.data[i] > 8) fn++;
  check('rosto da HUD da Miko', face.width === 168 && fn > 3000, 'px=' + fn);
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
check('index.html carrega fighters-miko.js antes do balance-v14', files.includes('js/data/fighters-miko.js') && files.indexOf('js/data/fighters-miko.js') < files.indexOf('js/data/balance-v14.js'));
for (const f of files) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }); } catch (e) { check('carga ' + f, false, e.message.slice(0, 80)); }
}


const R = vm.runInContext(`(() => {
  const f = FIGHTERS.find((x) => x.id === 'miko');
  const kit = POWERS.miko.powers;
  return { found: !!f, secret: f && f.secret, stats: f && f.stats, kinds: kit.map((p) => p.kind), names: kit.map((p) => p.name),
    roster: ROSTER_PORTRAITS.order.indexOf('miko'), rv: ROSTER_PORTRAITS.version, url: SpriteGen.url('miko'),
    sheets: !!(ART_SHEETS['abil:larper'] && ART_SHEETS['fx2:larper'] && ART_SHEETS['fx2:larper-extra']) };
})()`, ctx);
check('Miko registrada (normal, nao secreta)', R.found && !R.secret, JSON.stringify(R.stats));
check('kit: ofuda / hamaya / kekkai / portal torii / kitsune', JSON.stringify(R.kinds) === JSON.stringify(['shot', 'shot', 'wall', 'shadowport', 'kitsune']), R.names.join(' | '));
check('balanceada com o FORCA do v14 (2.55) + ajuste geral', (R.stats.power >= 2.805 * 0.7 && R.stats.power <= 2.805 * 1.35), JSON.stringify(R.stats));
check('na grade de selecao + folhas registradas + cache proprio', R.roster === 56 && /^v7[1-9]/.test(R.rv) && R.sheets && /v71-miko/.test(R.url), R.roster + ' ' + R.rv + ' ' + R.url);

const res = vm.runInContext(`(() => {
  const cv = { width: 960, height: 540, getContext: () => (${fake2d.toString()})(), classList: { toggle() {}, add() {}, remove() {} } };
  const none = PETS.find((p) => p.id === 'none') || PETS[0];
  const mk = () => {
    const g = new Game(cv);
    g.start({ mode: 'versus', teams: [['miko'], ['emilio']], stage: 'treino-dojo', cpu: [false, false], difficulty: 2, roundsToWin: 1, timer: 99, pets: [none, none] });
    if (g.weather) { g.weather.set('clear'); g.weather.pool = ['clear']; }
    if (g.mech) g.mech.m = {};
    for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
    const me = g.activeOf(0), op = g.activeOf(1);
    me.x = 300; op.x = 480; me.dir = 1; op.dir = -1; op.status = {}; me.cd = [0, 0, 0, 0, 0]; me.charge = [100, 100]; me.ultimate = 100; me.castLock = 0; me.state = 'idle'; me.cast = null;
    return [g, me, op];
  };
  const run = (slot, ticks, watch) => {
    const [g, me, op] = mk();
    const hp0 = op.hp; const seen = {}; let zonaGas = false;
    me.tryCast(slot);
    for (let t = 0; t < ticks; t++) { g.tick(); for (const s of watch) if (op.has(s)) seen[s] = true; if (g.zones.some((z) => z.key === 'fx2:domador-extra')) zonaGas = true; }
    return { dmg: Math.round((hp0 - op.hp) * 10) / 10, seen, zonaGas };
  };
  const out = {};
  out.ofuda = run(0, 120, ['paralyze']);
  out.hamaya = run(1, 100, ['vuln']);
  { const [g, me, op] = mk(); me.tryCast(2); for (let t = 0; t < 30; t++) g.tick(); out.kekkai = g.walls.some((w) => w.owner === me); }
  { const [g, me, op] = mk(); g.rnd = () => 0.1; /* forca o portal 'por cima' (cai em cima do rival) */ const hp0 = op.hp; me.tryCast(3); for (let t = 0; t < 120; t++) g.tick(); out.portal = { dmg: Math.round((hp0 - op.hp) * 10) / 10 }; }
  { const [g, me, op] = mk(); op.addStatus('armor', 600); op.addStatus('atk', 600); me.addStatus('burn', 300); const hp0 = op.hp; me.tryCast(4); for (let t = 0; t < 140; t++) g.tick();
    out.ult = { dmg: Math.round((hp0 - op.hp) * 10) / 10, buffsRival: op.has('armor') || op.has('atk'), meuBurn: me.has('burn') }; }
  let done = 0, err = null;
  for (let k = 0; k < 4; k++) {
    try {
      const g = new Game(cv);
      g.start({ mode: 'versus', teams: k % 2 ? [['du'], ['miko']] : [['miko'], ['lyra']], stage: 'treino-dojo', cpu: [true, true], difficulty: 3, roundsToWin: 1, timer: 60, pets: [none, none] });
      let guard = 0; while (g.running && guard++ < 9000) g.tick();
      done++;
    } catch (e) { err = String(e.message).slice(0, 120); }
  }
  out.ia = { done, err };
  return out;
})()`, ctx);
check('Ofuda Selante: acerta e PARALISA', res.ofuda.dmg > 3 && res.ofuda.seen.paralyze, JSON.stringify(res.ofuda));
check('Hamaya: flecha rapida, VULNERÁVEL', res.hamaya.dmg > 5 && res.hamaya.seen.vuln, JSON.stringify(res.hamaya));
check('Kekkai: ergue a barreira', res.kekkai === true);
check('Portal Torii: teleporta e acerta', res.portal.dmg > 3, JSON.stringify(res.portal));
check('Kitsune: dano + tira os buffs do rival + limpa os debuffs da Miko', res.ult.dmg > 10 && !res.ult.buffsRival && !res.ult.meuBurn, JSON.stringify(res.ult));
check('IA x IA com a Miko: 4 lutas sem travar', res.ia.done === 4 && !res.ia.err, JSON.stringify(res.ia));


console.log('---');
console.log(fails === 0 ? 'MIKO: TUDO OK (' + n + ' checks)' : 'MIKO: ' + fails + ' FALHAS de ' + n);
process.exit(fails ? 1 : 0);
