// CACA DE BUGS: todo lutador solta TODAS as habilidades (sem erro, sem vida/
// posicao/ultimate virando NaN ou saindo da arena) e todo mapa roda uma luta
// IA x IA com render (sem erro).
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const fake2d = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : String(k).startsWith('create') ? () => ({ addColorStop() {} }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
const ctx = {
  console: { log() {}, warn() {}, error() {} },
  Audio: class { play() { return Promise.resolve(); } pause() {} },
  Math, Date, JSON, Image: class { set src(v) { this._src = v; } }, URLSearchParams,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: true, difficulty: 0 }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => true, record() {}, grantAchievement: () => false, hasAchievement: () => true, recordSurvivalBy() {}, recordWinBy() {}, recordStage() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco: () => false, save() {} },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; }, pad: () => null, padCount: 0, releaseAll() {} },
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
const files = [...html.matchAll(/<script src="([^"?]+)/g)].map((m) => m[1]).filter((f) => /^(assets\/sprites|js\/data|js\/engine)\//.test(f)).filter((f) => !/engine\/(audio|input)\.js$/.test(f));
for (const f of files) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });

const r = vm.runInContext(`(() => {
  const none = PETS.find((p) => p.id === 'none') || PETS[0];
  const cv = { width: 960, height: 540, getContext: () => (${fake2d.toString()})(), classList: { toggle() {}, add() {}, remove() {} } };
  const bad = (f) => !Number.isFinite(f.hp) || !Number.isFinite(f.x) || !Number.isFinite(f.y) || !Number.isFinite(f.ultimate) || f.x < -200 || f.x > 1160 || f.y > 50 || f.hp > f.maxHp + 1;
  const out = { kit: [], stage: [], nan: [] };
  const ids = FIGHTERS.filter((d) => d.id !== 'boneco-treino').map((d) => d.id);
  const stages = STAGE_LIST.map((s) => s.id);
  /* 1) cada lutador solta tudo */
  ids.forEach((id, n) => {
    const g = new Game(cv);
    const opp = ids[(n + 7) % ids.length];
    try {
      g.start({ mode: 'versus', teams: [[id], [opp]], stage: stages[n % stages.length], cpu: [false, false], roundsToWin: 1, timer: 99, pets: [none, none] });
      for (let i = 0; i < 300 && g.roundState !== 'fight'; i++) g.tick();
      const a = g.activeOf(0), b = g.activeOf(1);
      const kit = a.currentKit();
      for (let s = 0; s < kit.length; s++) {
        a.x = 380; b.x = 560; a.dir = 1; a.cd = a.cd.map(() => 0); a.charge = [100, 100]; a.ultimate = 100; a.meter = 100; a.castLock = 0; a.spamShared = 0; a.state = 'idle'; a.cast = null; b.hp = b.maxHp;
        a.tryCast(s);
        for (let i = 0; i < 90; i++) { g.tick(); if (bad(a) || bad(b)) { out.nan.push(id + '#' + s + ' ' + JSON.stringify({ hp: b.hp, x: b.x, y: b.y, ax: a.x, ay: a.y, au: a.ultimate })); break; } }
      }
    } catch (e) { out.kit.push(id + ': ' + (e.stack || e.message).split('\\n').slice(0, 2).join(' | ')); }
  });
  /* 2) cada mapa: luta IA x IA curta */
  stages.forEach((st, n) => {
    const g = new Game(cv);
    try {
      g.start({ mode: 'versus', teams: [[ids[n % ids.length]], [ids[(n * 5 + 3) % ids.length]]], stage: st, cpu: [true, true], difficulty: 3, roundsToWin: 1, timer: 30, pets: [none, none] });
      for (let i = 0; i < 600 && g.running; i++) { g.tick(); if (i % 30 === 0) g.render(0.5); }
    } catch (e) { out.stage.push(st + ': ' + (e.stack || e.message).split('\\n').slice(0, 2).join(' | ')); }
  });
  out.counts = { lutadores: ids.length, mapas: stages.length };
  return out;
})()`, ctx);

check('todo lutador solta todas as habilidades sem erro', r.kit.length === 0, r.kit.slice(0, 3).join(' || '));
check('nenhum numero invalido (vida/posicao/ultimate) nem lutador fora da arena', r.nan.length === 0, r.nan.slice(0, 3).join(' || '));
check('todo mapa roda luta IA x IA com render sem erro', r.stage.length === 0, r.stage.slice(0, 3).join(' || '));
check('cobertura: 60+ lutadores e 100+ mapas', r.counts.lutadores >= 60 && r.counts.mapas >= 100, JSON.stringify(r.counts));
console.log(`\nCACA DE BUGS: ${fails ? fails + ' FALHAS' : 'TUDO OK'} (${n} checks)`);
process.exit(fails ? 1 : 0);
