// CYBER-PSICOPATA v2: arte nova do dono (poses + habilidades) e kit renovado.
// - folha de poses 1280x3900: 60 quadros com conteudo, pe na linha, sem magenta
// - atlas de habilidades: cada linha ANIMA (quadros diferentes), sem franja rosa,
//   folha de impacto 4x1 com conteudo
// - kit: canhao (shot+burn), misseis (barrage+burn), chute foguete (dash),
//   pisao sismico (pillar: lento+vulneravel), ciberneurose (aura+explosao)
// - leve buff: FORCA do v14 subiu (0.408 -> 0.78); IA x IA sem travar
// - versao de cache SO do ciber (os outros lutadores nao rebaixam)
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
  const sh = png('assets/sprites/cyber-psicopata.png');
  check('folha de poses 1280x3900', sh.width === 1280 && sh.height === 3900, sh.width + 'x' + sh.height);
  const empty = [], feet = [], mag = [];
  for (let r = 0; r < 15; r++) for (let c = 0; c < 4; c++) {
    let cnt = 0, bottom = 0, m = 0;
    for (let y = 0; y < 260; y++) for (let x = 0; x < 320; x++) {
      const i = ((r * 260 + y) * 1280 + c * 320 + x) * 4;
      if (sh.data[i + 3] > 40) {
        cnt++; bottom = Math.max(bottom, y);
        if (sh.data[i] > 170 && sh.data[i + 1] < 40 && sh.data[i + 2] > 170) m++;
      }
    }
    if (cnt < 2500) empty.push(r + ':' + c);
    if (r !== 2 && r !== 8 && r !== 9 && Math.abs(bottom - 246) > 3) feet.push(r + ':' + c + '=' + bottom);
    if (m > 30) mag.push(r + ':' + c + '=' + m);
  }
  check('60 quadros com o robo inteiro', empty.length === 0, empty.join(','));
  check('pe na linha do chao (y 246) nas poses de chao', feet.length === 0, feet.join(','));
  check('sem fundo magenta sobrando', mag.length === 0, mag.join(','));

  const ab = png('assets/abilities/cyber-psicopata.png');
  check('atlas de habilidades 512x640', ab.width === 512 && ab.height === 640);
  let fringe = 0;
  for (let i = 0; i < ab.data.length; i += 4) if (ab.data[i + 3] > 60 && ab.data[i] > 170 && ab.data[i + 1] < 40 && ab.data[i + 2] > 170) fringe++;
  check('atlas sem franja magenta', fringe < 60, 'pixels=' + fringe);
  const hash = (img, r, c) => { let h = 0; for (let y = 0; y < 128; y += 2) for (let x = 0; x < 128; x += 2) { const i = ((r * 128 + y) * img.width + c * 128 + x) * 4; h = (h * 31 + img.data[i] + img.data[i + 1] * 3 + img.data[i + 3] * 7) >>> 0; } return h; };
  const fill = (img, r, c) => { let k = 0; for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) if (img.data[((r * 128 + y) * img.width + c * 128 + x) * 4 + 3] > 20) k++; return k; };
  const still = [], vazio = [];
  for (let r = 0; r < 5; r++) {
    if (new Set([0, 1, 2, 3].map((c) => hash(ab, r, c))).size < 3) still.push(r);
    for (let c = 0; c < 4; c++) if (fill(ab, r, c) < 600) vazio.push(r + ':' + c);
  }
  check('cada poder anima (>= 3 quadros diferentes por linha)', still.length === 0, still.join(','));
  check('nenhum quadro de habilidade vazio', vazio.length === 0, vazio.join(','));
  const hit = png('assets/abilities/cyber-psicopata-hit.png');
  const hv = [0, 1, 2, 3].filter((c) => fill(hit, 0, c) < 300);
  check('folha de impacto 512x128 com 4 quadros', hit.width === 512 && hit.height === 128 && hv.length === 0, hv.join(','));
  const face = png('assets/ui/face-cyber-psicopata.png');
  let fn = 0; for (let i = 3; i < face.data.length; i += 4) if (face.data[i] > 8) fn++;
  check('rosto da HUD refeito com a arte nova', face.width === 168 && fn > 3000, 'px=' + fn);
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
check('index.html carrega o fighters-cyber-v2.js depois do rafael e antes do balance-v14',
  files.indexOf('js/data/fighters-cyber-v2.js') > files.indexOf('js/data/fighters-rafael.js') && files.indexOf('js/data/fighters-cyber-v2.js') < files.indexOf('js/data/balance-v14.js'));
for (const f of files) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }); } catch (e) { check('carga ' + f, false, e.message.slice(0, 80)); }
}
const R = vm.runInContext(`(() => {
  const f = FIGHTERS.find((x) => x.id === 'cyber-psicopata');
  const kit = POWERS['cyber-psicopata'].powers;
  return {
    stats: f.stats, kinds: kit.map((p) => p.kind), names: kit.map((p) => p.name),
    impact: kit.every((p) => p.visualSheet === 'cyber-psicopata' && (p.impactSheets || []).includes('cyber-psicopata-hit')),
    url: SpriteGen.url('cyber-psicopata'), urlDu: SpriteGen.url('du'), face: SpriteGen.faceUrl('cyber-psicopata'),
    art: Art.url(ART_SHEETS['abil:cyber-psicopata'].src, ART_SHEETS['abil:cyber-psicopata'].v), hitSheet: !!ART_SHEETS['fx2:cyber-psicopata-hit'],
    roster: ROSTER_PORTRAITS.version,
  };
})()`, ctx);
check('kit novo: canhao/misseis/chute/pisao/ciberneurose', JSON.stringify(R.kinds) === JSON.stringify(['shot', 'barrage', 'dash', 'pillar', 'aura']) && R.names[0] === 'Canhão de Plasma' && R.names[3] === 'Pisão Sísmico', R.names.join(' | '));
check('todos os poderes usam a arte nova + explosao de impacto', R.impact && R.hitSheet);
check('leve buff aplicado (FORCA 0.78 sobre power 1.5 / hp 160)', Math.abs(R.stats.power - 1.17) < 0.01 && R.stats.hp === 125, JSON.stringify(R.stats));
check('cache: so o ciber troca de versao', /v=v63-ciber$/.test(R.url) && !/v63-ciber/.test(R.urlDu) && /v63-ciber/.test(R.face) && /v63-ciber/.test(R.art) && /^v[67][0-9]/.test(R.roster), [R.url, R.urlDu, R.face, R.art, R.roster].join(' '));

const res = vm.runInContext(`(() => {
  const cv = { width: 960, height: 540, getContext: () => (${fake2d.toString()})(), classList: { toggle() {}, add() {}, remove() {} } };
  const none = PETS.find((p) => p.id === 'none') || PETS[0];
  const mk = () => {
    const g = new Game(cv);
    g.start({ mode: 'versus', teams: [['cyber-psicopata'], ['hacker']], stage: 'treino-dojo', cpu: [false, false], difficulty: 2, roundsToWin: 1, timer: 99, pets: [none, none] });
    if (g.weather) { g.weather.set('clear'); g.weather.pool = ['clear']; }
    if (g.mech) g.mech.m = {};
    for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
    const me = g.activeOf(0), op = g.activeOf(1);
    me.x = 300; op.x = 480; me.dir = 1; op.dir = -1; op.status = {}; me.cd = [0, 0, 0, 0, 0]; me.charge = [100, 100]; me.ultimate = 100; me.meter = 100; me.castLock = 0; me.state = 'idle'; me.cast = null;
    return [g, me, op];
  };
  const out = {};
  const run = (slot, ticks, watch) => {
    const [g, me, op] = mk();
    const hp0 = op.hp; const seen = {}; let hitFx = 0;
    me.tryCast(slot);
    for (let t = 0; t < ticks; t++) {
      g.tick();
      for (const s of watch) if (op.has(s) || me.has(s)) seen[s] = true;
      hitFx = Math.max(hitFx, g.bursts.filter((b) => b.key === 'fx2:cyber-psicopata-hit').length);
    }
    return { dmg: Math.round((hp0 - op.hp) * 10) / 10, seen, hitFx, aura: !!me.aura };
  };
  out.canhao = run(0, 160, ['burn']);
  out.misseis = run(1, 220, ['burn']);
  out.chute = run(2, 120, []);
  out.pisao = run(3, 160, ['slow', 'vuln']);
  out.ult = run(4, 90, ['overclock', 'aura']);
  /* IA x IA: 4 lutas completas sem travar */
  let done = 0, err = null;
  for (let k = 0; k < 4; k++) {
    try {
      const g = new Game(cv);
      g.start({ mode: 'versus', teams: k % 2 ? [['du'], ['cyber-psicopata']] : [['cyber-psicopata'], ['kira']], stage: 'treino-dojo', cpu: [true, true], difficulty: 3, roundsToWin: 1, timer: 60, pets: [none, none] });
      let guard = 0; while (g.running && guard++ < 9000) g.tick();
      done++;
    } catch (e) { err = String(e.message).slice(0, 120); }
  }
  out.ia = { done, err };
  return out;
})()`, ctx);
check('Canhão de Plasma: acerta e QUEIMA, com explosao de impacto', res.canhao.dmg > 5 && res.canhao.seen.burn && res.canhao.hitFx > 0, JSON.stringify(res.canhao));
check('Bombardeio: misseis acertam e QUEIMAM', res.misseis.dmg > 5 && res.misseis.seen.burn, JSON.stringify(res.misseis));
check('Chute Foguete: acerta', res.chute.dmg > 5, JSON.stringify(res.chute));
check('Pisão Sísmico: acerta + LENTO + VULNERÁVEL', res.pisao.dmg > 5 && res.pisao.seen.slow && res.pisao.seen.vuln, JSON.stringify(res.pisao));
check('Ciberneurose: aura ligada + explosao de ativacao fere quem esta perto', res.ult.aura && res.ult.dmg > 3, JSON.stringify(res.ult));
check('IA x IA: 4 lutas completas sem travar o motor', res.ia.done === 4 && !res.ia.err, JSON.stringify(res.ia));

console.log('---');
console.log(fails === 0 ? 'CIBER V2: TUDO OK (' + n + ' checks)' : 'CIBER V2: ' + fails + ' FALHAS de ' + n);
process.exit(fails ? 1 : 0);
