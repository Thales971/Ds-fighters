// MAPAS NOVOS DO DONO + CLIMAS EXCLUSIVOS:
// Metropole Dia & Noite (diaenoite: laser divisor + medidor +10% no lado do dia),
// Churrasco na Laje (churrasco: cura lenta + espetinho de energia),
// Data Center Abandonado (apagao: tela escurece + surto eletrico).
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { PNG } = require('pngjs');

const ROOT = path.resolve(__dirname, '..');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

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

const fsx = require('fs');
for (const f of ['metropole-dia-noite', 'churrasco-laje', 'datacenter-abandonado']) {
  const buf = fsx.readFileSync(path.join(ROOT, 'assets/maps/' + f + '.jpg'));
  /* JPEG SOF0: altura/largura */
  let i = 2, wh = null;
  while (i < buf.length) { const m = buf[i + 1]; const len = buf.readUInt16BE(i + 2); if (m >= 0xc0 && m <= 0xc2) { wh = [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)]; break; } i += 2 + len; }
  check('mapa ' + f + ' 960x540', wh && wh[0] === 960 && wh[1] === 540, JSON.stringify(wh));
}
const R = vm.runInContext(`(() => {
  const out = {};
  const ids = ['metropole-dia-noite', 'churrasco-laje', 'datacenter-abandonado'];
  const ex = { 'metropole-dia-noite': 'diaenoite', 'churrasco-laje': 'churrasco', 'datacenter-abandonado': 'apagao' };
  out.stages = ids.map((id) => { const s = STAGE_LIST.find((x) => x.id === id); return s && s.weather.includes(ex[id]) && !!WEATHER_INFO[ex[id]]; });
  out.exclusivo = Object.values(ex).every((k) => STAGE_LIST.filter((s) => (s.weather || []).includes(k)).length === 1);
  const cv = { width: 960, height: 540, getContext: () => __fake2d(), classList: { toggle() {}, add() {}, remove() {} } };
  const none = PETS.find((p) => p.id === 'none') || PETS[0];
  const mk = (stage, wk) => {
    const g = new Game(cv);
    g.start({ mode: 'versus', teams: [['du'], ['jess']], stage, cpu: [false, false], roundsToWin: 1, timer: 99, pets: [none, none] });
    for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
    g.weather.pool = [wk]; g.weather.changeAt = 1e9; g.weather.set(wk);
    if (g.mech) g.mech.m = {};
    return g;
  };
  /* DIA & NOITE */
  {
    const g = mk('metropole-dia-noite', 'diaenoite');
    const A = g.activeOf(0), B = g.activeOf(1);
    A.x = 200; const dia = A.meterRate(); A.x = 760; const noite = A.meterRate(); A.x = 200; B.x = 760;
    out.diaMeter = Math.round(dia / noite * 100) / 100;
    g.weather._exAt = 2; let laser = false;
    for (let t = 0; t < 10; t++) { g.tick(); A.x = 200; B.x = 760; if (g.strikes.some((s) => Math.abs(s.x - 480) < 5)) laser = true; }
    out.laser = laser;
    const hp0 = A.hp; g.weather._exAt = 2;
    for (let t = 0; t < 90; t++) { g.tick(); A.x = 480; B.x = 760; }
    out.laserDmg = Math.round((hp0 - A.hp) * 10) / 10;
  }
  /* CHURRASCO */
  {
    const g = mk('churrasco-laje', 'churrasco');
    const A = g.activeOf(0), B = g.activeOf(1);
    A.x = 200; B.x = 760; A.hp = A.maxHp - 20; B.hp = B.maxHp - 20;
    const h0 = A.hp;
    g.weather._exAt = 1e9;
    for (let t = 0; t < 250; t++) { g.tick(); A.x = 200; B.x = 760; }
    out.cura = Math.round((A.hp - h0) * 10) / 10;
    g.weather._exAt = 2; g.pickups.length = 0;
    for (let t = 0; t < 5; t++) g.tick();
    out.espetinho = g.pickups.some((p) => p.def.id === 'nrg');
  }
  /* APAGAO */
  {
    const g = mk('datacenter-abandonado', 'apagao');
    const A = g.activeOf(0), B = g.activeOf(1);
    A.x = 300; B.x = 660;
    const s0 = A.hp + B.hp;
    g.weather._exAt = 2;
    for (let t = 0; t < 4; t++) g.tick();
    out.apagao = g.weather._blackout > 100;
    out.surto = (s0 - A.hp - B.hp) >= 2.5 && (A.has('shock') || B.has('shock'));
    try { g.weather.drawOverlay(cv.getContext(), 960, 540); g.weather.draw(cv.getContext()); out.draw = true; } catch (e) { out.draw = String(e.message); }
    try { for (let t = 0; t < 2500 && g.running; t++) g.tick(); out.luta = true; } catch (e) { out.luta = String(e.message).slice(0, 100); }
  }
  return out;
})()`, ctx);
check('3 mapas registrados com o clima exclusivo e a descricao', R.stages.every(Boolean), JSON.stringify(R.stages));
check('cada clima exclusivo so aparece no mapa dele', R.exclusivo);
check('Dia & Noite: lado do DIA enche o medidor 10% mais rapido', R.diaMeter === 1.1, String(R.diaMeter));
check('Dia & Noite: laser divisor dispara no meio e fere quem esta nele', R.laser && R.laserDmg > 3, 'laser=' + R.laser + ' dano=' + R.laserDmg);
check('Churrasco: cheiro de churrasco cura os dois', R.cura >= 2, '+' + R.cura);
check('Churrasco: sai espetinho (energia) no chao', R.espetinho);
check('Apagao: tela apaga e o surto da choque em quem esta no chao', R.apagao && R.surto, JSON.stringify({ a: R.apagao, s: R.surto }));
check('desenha os climas e luta inteira sem travar', R.draw === true && R.luta === true, R.draw + ' ' + R.luta);
console.log('---');
console.log(fails === 0 ? 'MAPAS NOVOS: TUDO OK (' + n + ' checks)' : 'MAPAS NOVOS: ' + fails + ' FALHAS de ' + n);
process.exit(fails ? 1 : 0);
