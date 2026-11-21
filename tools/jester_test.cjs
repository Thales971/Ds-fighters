// JESTER (bobo da corte, arte do dono) + IALES fora do modo online.
// - poses das 2 folhas (sem manchas no figurino vinho), atlas animado + extra
// - kit irritante, um efeito diferente por poder: torta (CEGO + lento), sino
//   (VERTIGEM: tela gira), pirulito bumerangue (ELETRIZADO: controle mexe
//   sozinho), code review (SEM PODERES + medidor lento) e ULT exclusiva Grande
//   Final (botoes de poder EMBARALHADOS + travamento)
// - na grade, IA ok; servidor do online recusa o IALES e a grade online o tranca
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
  const sh = png('assets/sprites/jester.png');
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
    if (m > 200) mag.push(r + ':' + c + '=' + m); /* brilho rosa dos efeitos (giro com ✗) e arte */
  }
  check('60 quadros com o Jester inteiro', empty.length === 0, empty.join(','));
  check('pe na linha do chao nas poses de chao', feet.length === 0, feet.join(','));
  check('sem fundo magenta sobrando (so o brilho rosa da arte)', mag.length === 0, mag.join(','));
  /* figurino vinho: a limpeza de rosa transformava a roupa em mancha preta
     (soco: 16% de preto com o bug, ~11% so de cabelo/contorno sem ele) */
  let black = 0, body = 0;
  for (let y = 4 * 260 + 60; y < 4 * 260 + 246; y++) for (let x = 60; x < 260; x++) { const i = (y * 1280 + x) * 4; if (sh.data[i + 3] > 200) { body++; if (sh.data[i] + sh.data[i + 1] + sh.data[i + 2] < 30) black++; } }
  check('figurino sem manchas pretas (soco)', black / Math.max(1, body) < 0.13, (100 * black / Math.max(1, body)).toFixed(1) + '% preto');
  const ab = png('assets/abilities/jester.png');
  const ex = png('assets/abilities/jester-extra.png');
  check('atlas 512x640 + extra 512x256', ab.width === 512 && ab.height === 640 && ex.width === 512 && ex.height === 256);
  const hash = (img, r, c) => { let h = 0; for (let y = 0; y < 128; y += 2) for (let x = 0; x < 128; x += 2) { const i = ((r * 128 + y) * img.width + c * 128 + x) * 4; h = (h * 31 + img.data[i] + img.data[i + 1] * 3 + img.data[i + 3] * 7) >>> 0; } return h; };
  const fill = (img, r, c) => { let k = 0; for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) if (img.data[((r * 128 + y) * img.width + c * 128 + x) * 4 + 3] > 20) k++; return k; };
  const still = [], vazio = [];
  for (let r = 0; r < 5; r++) { if (new Set([0, 1, 2, 3].map((c) => hash(ab, r, c))).size < 3) still.push(r); for (let c = 0; c < 4; c++) if (fill(ab, r, c) < 600) vazio.push(r + ':' + c); }
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) if (fill(ex, r, c) < 300) vazio.push('extra' + r + ':' + c);
  check('cada poder anima (>= 3 quadros diferentes)', still.length === 0, still.join(','));
  check('nenhum quadro de habilidade vazio', vazio.length === 0, vazio.join(','));
  const face = png('assets/ui/face-jester.png');
  let fn = 0; for (let i = 3; i < face.data.length; i += 4) if (face.data[i] > 8) fn++;
  check('rosto da HUD do Jester', face.width === 168 && fn > 3000, 'px=' + fn);
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
check('index.html carrega fighters-jester.js antes do balance-v14', files.includes('js/data/fighters-jester.js') && files.indexOf('js/data/fighters-jester.js') < files.indexOf('js/data/balance-v14.js'));
for (const f of files) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }); } catch (e) { check('carga ' + f, false, e.message.slice(0, 80)); }
}



const R = vm.runInContext(`(() => {
  const f = FIGHTERS.find((x) => x.id === 'jester');
  const kit = POWERS.jester.powers;
  return { found: !!f, secret: f && f.secret, stats: f && f.stats, kinds: kit.map((p) => p.kind), names: kit.map((p) => p.name),
    roster: ROSTER_PORTRAITS.order.indexOf('jester'), rv: ROSTER_PORTRAITS.version, url: SpriteGen.url('jester'),
    sheets: !!(ART_SHEETS['abil:jester'] && ART_SHEETS['fx2:jester'] && ART_SHEETS['fx2:jester-extra']) };
})()`, ctx);
check('Jester registrado (normal, nao secreto)', R.found && !R.secret, JSON.stringify(R.stats));
check('kit: torta / sino / pirulito / code review / grande final', JSON.stringify(R.kinds) === JSON.stringify(['shot', 'blast', 'shot', 'barrage', 'jesterfinale']), R.names.join(' | '));
check('balanceado com o FORCA do v14 (2.9)', Math.abs(R.stats.power - 3.335) < 0.01, JSON.stringify(R.stats));
check('na grade de selecao + folhas registradas + cache proprio', R.roster === 54 && /^v[67][0-9]/.test(R.rv) && R.sheets && /v67-jester/.test(R.url), R.roster + ' ' + R.rv + ' ' + R.url);

const res = vm.runInContext(`(() => {
  const cv = { width: 960, height: 540, getContext: () => (${fake2d.toString()})(), classList: { toggle() {}, add() {}, remove() {} } };
  const none = PETS.find((p) => p.id === 'none') || PETS[0];
  const mk = () => {
    const g = new Game(cv);
    g.start({ mode: 'versus', teams: [['jester'], ['hacker']], stage: 'treino-dojo', cpu: [false, false], difficulty: 2, roundsToWin: 1, timer: 99, pets: [none, none] });
    if (g.weather) { g.weather.set('clear'); g.weather.pool = ['clear']; }
    if (g.mech) g.mech.m = {};
    for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
    const me = g.activeOf(0), op = g.activeOf(1);
    me.x = 300; op.x = 480; me.dir = 1; op.dir = -1; op.status = {}; me.cd = [0, 0, 0, 0, 0]; me.charge = [100, 100]; me.ultimate = 100; me.castLock = 0; me.state = 'idle'; me.cast = null;
    return [g, me, op];
  };
  const run = (slot, ticks, watch, extra, setup) => {
    const [g, me, op] = mk();
    if (setup) setup(g, me, op);
    const hp0 = op.hp; const seen = {}; let volta = false; let maxD = 0;
    me.tryCast(slot);
    for (let t = 0; t < ticks; t++) {
      g.tick();
      for (const s of watch) if (op.has(s)) seen[s] = true;
      for (const pr of g.projectiles) if (pr.owner === me) { maxD = Math.max(maxD, Math.abs(pr.x - me.x)); if (maxD > 120 && pr.vx * me.dir < 0) volta = true; }
    }
    const o = { dmg: Math.round((hp0 - op.hp) * 10) / 10, seen, volta };
    if (extra) Object.assign(o, extra(g, me, op));
    return o;
  };
  const out = {};
  out.torta = run(0, 160, ['blind', 'slow']);
  out.sino = run(1, 120, ['vertigo']);
  out.pirulito = run(2, 200, ['shock']);
  out.volta = run(2, 160, [], null, (g, me, op) => { me.x = 80; op.x = 900; }).volta;
  out.review = run(3, 200, ['locked', 'meterSlow']);
  out.ult = run(4, 120, ['shuffled', 'glitch'], (g, me, op) => {
    const perm = op._shuf || [];
    const mapped = op.shuffledInput({ a0: true, a1: false, a2: false, a3: false, a4: false });
    const pressed = Object.keys(mapped).filter((k) => /^a\\d$/.test(k) && mapped[k]);
    return { perm, embaralhou: perm.length >= 2 && !perm.every((v, k) => v === k), pressed };
  });
  let done = 0, err = null;
  for (let k = 0; k < 4; k++) {
    try {
      const g = new Game(cv);
      g.start({ mode: 'versus', teams: k % 2 ? [['du'], ['jester']] : [['jester'], ['larper']], stage: 'treino-dojo', cpu: [true, true], difficulty: 3, roundsToWin: 1, timer: 60, pets: [none, none] });
      let guard = 0; while (g.running && guard++ < 9000) g.tick();
      done++;
    } catch (e) { err = String(e.message).slice(0, 120); }
  }
  out.ia = { done, err };
  return out;
})()`, ctx);
check('Torta na Cara: acerta, CEGO + LENTO', res.torta.dmg > 3 && res.torta.seen.blind && res.torta.seen.slow, JSON.stringify(res.torta));
check('Sino do Bobo: acerta e da VERTIGEM (tela gira)', res.sino.dmg > 3 && res.sino.seen.vertigo, JSON.stringify(res.sino));
check('Pirulito Hipnotico: deixa ELETRIZADO e, se errar, VOLTA (bumerangue)', res.pirulito.seen.shock && res.volta, JSON.stringify(res.pirulito) + ' volta=' + res.volta);
check('Code Review: SEM PODERES + MEDIDOR LENTO', res.review.seen.locked && res.review.seen.meterSlow, JSON.stringify(res.review));
check('Grande Final: dano + BOTOES EMBARALHADOS (1 vira outro poder) + travamento', res.ult.dmg > 10 && res.ult.seen.shuffled && res.ult.seen.glitch && res.ult.embaralhou, JSON.stringify(res.ult));
check('IA x IA com o Jester: 4 lutas sem travar', res.ia.done === 4 && !res.ia.err, JSON.stringify(res.ia));

/* ---------- 3. IALES fora do online ---------- */
{
  const RC = require(path.join(ROOT, 'js/net/room-core.js'));
  const srv = fs.readFileSync(path.join(ROOT, 'online-server/room-core.js'), 'utf8');
  check('lista de banidos do online tem o iales (cliente e servidor iguais)', RC.ONLINE_BANNED.includes('iales') && srv === fs.readFileSync(path.join(ROOT, 'js/net/room-core.js'), 'utf8'));
  const rooms = RC.createRooms({ setTimeout, clearTimeout });
  const mkConn = (id) => ({ id, inbox: [], send(m) { this.inbox.push(typeof m === 'string' ? JSON.parse(m) : m); } });
  const a = mkConn('a');
  rooms.onMessage(a, { t: 'hello', v: RC.PROTOCOL, name: 'A' });
  rooms.onMessage(a, { t: 'create', mode: '1v1', stagePool: ['treino-dojo'] });
  rooms.onMessage(a, { t: 'pick', fighters: ['iales'], pet: 'none' });
  const err = a.inbox.find((m) => m.t === 'error');
  check('servidor recusa o IALES no online', err && err.code === 'banned', JSON.stringify(err));
  a.inbox.length = 0;
  rooms.onMessage(a, { t: 'pick', fighters: ['jester'], pet: 'none' });
  check('servidor aceita o Jester no online', !a.inbox.some((m) => m.t === 'error'), JSON.stringify(a.inbox.filter((m) => m.t === 'error')));
  const ui = fs.readFileSync(path.join(ROOT, 'js/ui/ui.js'), 'utf8');
  check('grade do online tranca o banido e a confirmacao avisa', /f\.mode === 'online' && UI\.onlineBanned\(d\.id\)/.test(ui) && /não pode ser usado no online/.test(ui));
}

console.log('---');
console.log(fails === 0 ? 'JESTER: TUDO OK (' + n + ' checks)' : 'JESTER: ' + fails + ' FALHAS de ' + n);
process.exit(fails ? 1 : 0);
