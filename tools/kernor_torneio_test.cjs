// KERNOR (chefe final do torneio) + 6 mapas exclusivos do torneio.
// - arte: poses 1280x3900, atlas 4x10 + extra, retrato e 6 mapas
// - kit de chefe: 10 poderes (espinhos com buracos, leque, buraco negro...),
//   resiste a efeitos, secreto, fora do online, desbloqueio por codigo
// - torneio: 6 mapas com clima e evento proprios, termina no Kernor na
//   Fortaleza (versao amaciada), Iales so no Versus
// - lutas IA x IA nos 6 mapas sem travar
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { PNG } = require('pngjs');

const ROOT = path.resolve(__dirname, '..');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const png = (f) => PNG.sync.read(fs.readFileSync(path.join(ROOT, f)));
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* ---------- 1. arte ---------- */
{
  const sh = png('assets/sprites/kernor.png');
  check('folha de poses 1280x3900', sh.width === 1280 && sh.height === 3900, sh.width + 'x' + sh.height);
  let empty = 0;
  for (let r = 0; r < 15; r++) for (let c = 0; c < 4; c++) {
    let cnt = 0;
    for (let y = 0; y < 260; y += 2) for (let x = 0; x < 320; x += 2) if (sh.data[((r * 260 + y) * 1280 + c * 320 + x) * 4 + 3] > 40) cnt++;
    if (cnt < 600) empty++;
  }
  check('60 quadros com o colosso', empty === 0, empty + ' vazios');
  const ab = png('assets/abilities/kernor.png');
  check('atlas de poderes 4x10 (512x1280)', ab.width === 512 && ab.height === 1280, ab.width + 'x' + ab.height);
  check('folha extra (buraco/impacto) existe', fs.existsSync(path.join(ROOT, 'assets/abilities/kernor-extra.png')));
  check('rosto e retrato', ['face', 'portrait'].every((k) => fs.existsSync(path.join(ROOT, `assets/ui/${k}-kernor.png`))));
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
for (const f of files) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }); } catch (e) { check('carga ' + f, false, e.message.slice(0, 80)); }
}
check('index.html carrega fighters-kernor.js e torneio.js', files.includes('js/data/fighters-kernor.js') && files.includes('js/engine/torneio.js'));

const R = vm.runInContext(`(() => {
  const k = FIGHTERS.find((x) => x.id === 'kernor');
  const kit = POWERS.kernor.powers;
  const st = TORNEIO.stages.map((id) => STAGE_LIST.find((s) => s.id === id));
  return {
    secret: k.secret, boss: k.boss, resist: k.statusResist, hp: k.stats.hp, power: k.stats.power,
    n: kit.length, kinds: kit.map((p) => p.kind), ults: kit.filter((p) => p.slot === 'ultimate').length,
    sheets: !!ART_SHEETS['abil:kernor'] && !!ART_SHEETS['fx2:kernor-extra'],
    stages: st.map((s) => s && { id: s.id, w: String(s.weather), m: s.mech, img: s.image }),
    ext: Object.keys(WEATHER_EXT), mechs: Object.keys(MECHS),
    tboss: TORNEIO.boss,
  };
})()`, ctx);
check('Kernor secreto e chefe', R.secret === true && R.boss === true);
check('10 poderes com 2 ults', R.n === 10 && R.ults === 2, R.n + '/' + R.ults);
check('padroes de chefe (espinhos, leque, buraco negro)', ['kspikes', 'kradial', 'kblackhole'].every((k) => R.kinds.includes(k)), R.kinds.join(','));
check('resistencia acima da media (vida e efeitos)', R.hp >= 400 && R.resist > 0.3, R.hp + ' hp, resist ' + R.resist);
check('folhas de efeito registradas', R.sheets);
check('6 mapas do torneio', R.stages.length === 6 && R.stages.every(Boolean), JSON.stringify(R.stages.map((s) => s && s.id)));
check('cada mapa com clima exclusivo', new Set(R.stages.map((s) => s.w)).size === 6 && R.stages.every((s) => R.ext.includes(s.w)), R.stages.map((s) => s.w).join(',') + ' ext=' + R.ext.join(','));
check('cada mapa com evento exclusivo', new Set(R.stages.map((s) => s.m)).size === 6 && R.stages.every((s) => R.mechs.includes(s.m)), R.stages.map((s) => s.m).join(','));
check('imagens dos mapas existem', R.stages.every((s) => fs.existsSync(path.join(ROOT, s.img.split('?')[0]))));
check('torneio termina na Fortaleza', R.stages[5].id === 'torneio-fortaleza-do-dev' && R.tboss === 'kernor');

/* resistencia: efeitos duram menos */
const res = vm.runInContext(`(() => {
  const cv = { width: 960, height: 540, getContext: () => (${fake2d.toString()})(), classList: { toggle() {}, add() {}, remove() {} } };
  const none = PETS.find((p) => p.id === 'none') || PETS[0];
  const out = { burn: 0, pull: 0, errs: [], ends: [] };
  const g = new Game(cv);
  g.start({ mode: 'versus', teams: [['kernor'], ['jess']], stage: 'torneio-fortaleza-do-dev', cpu: [false, false], roundsToWin: 1, timer: 99, pets: [none, none] });
  const k = g.activeOf(0), j = g.activeOf(1);
  k.addStatus('burn', 100); out.burn = k.status && (k.status.burn || 0);
  /* buraco negro puxa */
  k.x = 300; j.x = 700; k.dir = 1; k.ultimate = 100; k.meter = 100; k.charge = [100, 100]; k.cd = Array(10).fill(0);
  const before = j.x;
  k.tryCast(9);
  for (let i = 0; i < 90; i++) g.tick();
  out.pull = before - j.x;
  /* todos os poderes sem erro */
  for (let s = 0; s < 10; s++) {
    try { k.cd = Array(10).fill(0); k.charge = [100, 100]; k.ultimate = 100; k.meter = 100; k.castLock = 0; k.cast = null; k.state = 'idle'; k.tryCast(s); for (let i = 0; i < 80; i++) g.tick(); } catch (e) { out.errs.push(s + ':' + e.message); }
  }
  /* IA x IA nos 6 mapas */
  for (const st of TORNEIO.stages) {
    try {
      const h = new Game(cv);
      h.start({ mode: 'arcade', teams: [['jess'], ['kernor']], stage: st, cpu: [true, true], difficulty: 3, roundsToWin: 1, timer: 60, pets: [none, none], bossScale: { team: 1, power: 0.55, hp: 0.76 } });
      let n = 0; while (h.running && n++ < 9000) h.tick();
      out.ends.push(st + ':' + n);
    } catch (e) { out.errs.push(st + ':' + e.message); }
  }
  return out;
})()`, ctx);
check('efeitos duram menos no Kernor', res.burn > 0 && res.burn < 100, 'burn ' + res.burn);
check('buraco negro puxa o rival', res.pull > 30, Math.round(res.pull) + 'px');
check('10 poderes + 6 mapas sem erro', res.errs.length === 0, res.errs.join(' | '));
check('lutas nos 6 mapas terminam', res.ends.length === 6 && res.ends.every((e) => +e.split(':')[1] < 9000), res.ends.join(','));

/* ---------- 3. regras ---------- */
for (const f of ['js/net/room-core.js', 'online-server/room-core.js']) {
  check(f + ': Kernor e Iales fora do online', /ONLINE_BANNED\s*=\s*\[[^\]]*'iales'[^\]]*'kernor'/.test(read(f)));
}
const prof = read('js/core/profile.js');
check('Kernor entre os secretos e com desbloqueio proprio', /SECRET_IDS[^;]*'kernor'/.test(prof) && /ids = \['kernor'\]/.test(prof));
const ui = read('js/ui/ui.js');
check('chefe do torneio e o Kernor na chave fixa', /TORNEIO_LADDER/.test(read('js/engine/torneio.js')) && /bossFight: isBoss && opp === 'kernor'/.test(ui));
check('Iales so no Versus', /modeBanned/.test(ui) && /iales[^\n]*versus/.test(ui));
check('game.js aplica bossScale', /bossScale/.test(read('js/engine/game.js')));

console.log(`\n${n - fails}/${n} ok`);
process.exit(fails ? 1 : 0);
