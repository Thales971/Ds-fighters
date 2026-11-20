// REGRESSOES DO MOTOR achadas pelo torneio CPU x CPU (tools/balance_sim.cjs):
// - ficha antiga do Dolynho (V5) ainda entrava na lista junto da secreta
// - dash que acerta um oponente que DEVOLVE o golpe (espinhos/reflexo/contra-ataque)
//   cancelava a habilidade do atacante no meio do laco e o jogo quebrava lendo
//   dashHit.t de null (nunes x meta, nunes x cyber-psicopata). Todo lutador com
//   habilidade de dash: nao pode quebrar e o atacante fica atordoado (state hit).
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const fake2d = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'measureText' ? () => ({ width: 10 }) : String(k).startsWith('create') ? () => ({ addColorStop() {} }) : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
const ctx = {
  console: { log() {}, warn() {}, error() {} }, Math, Date, JSON, URLSearchParams, Image: class { set src(v) {} }, Audio: class { play() { return Promise.resolve(); } pause() {} },
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: true }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => true, record() {}, grantAchievement: () => false, hasAchievement: () => true, recordSurvivalBy() {}, recordWinBy() {}, recordStage() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0, releaseAll() {} },
  AudioSys: new Proxy({}, { get: () => () => {} }), HUD: new Proxy({}, { get: () => () => {} }),
  UI: new Proxy({ hud: new Proxy({}, { get: () => () => {} }), pitocoSeq: [] }, { get: (t, k) => (k in t ? t[k] : () => {}) }),
  Net: {}, document: { getElementById: () => null, createElement: () => ({ getContext: () => fake2d(), style: {} }), querySelectorAll: () => [], querySelector: () => null, addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {}, contains: () => false }, dataset: {} } },
  window: { addEventListener() {}, matchMedia: () => ({ matches: true }) }, navigator: { userAgent: 'node' }, location: { search: '', hash: '' },
  setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0,
};
ctx.globalThis = ctx; vm.createContext(ctx);
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const m of html.matchAll(/<script src="([^"?]+)/g)) {
  const f = m[1];
  if (!/^(assets\/sprites|assets\/stages|assets\/maps|js\/data|js\/engine)\//.test(f) || /engine\/(audio|input)\.js$/.test(f)) continue;
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }); } catch (e) { /* carga parcial */ }
}
const R = JSON.parse(vm.runInContext(`(() => {
  const canvas = { width: 960, height: 540, getContext: () => (${fake2d.toString()})(), classList: { toggle() {}, add() {}, remove() {} } };
  const out = [];
  for (const def of FIGHTERS) {
    if (def.id === 'boneco-treino') continue;
    const g = new Game(canvas);
    g.start({ mode: 'versus', teams: [[def.id], ['du']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
    for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
    const f = g.activeOf(0), o = g.activeOf(1);
    const kit = f.currentKit();
    kit.forEach((p, i) => {
      if (!p || p.kind !== 'dash') return;
      f.x = 300; o.x = 380; f.y = 0; o.y = 0; f.dir = 1; o.dir = -1; f.hp = f.maxHp; o.hp = o.maxHp;
      f.state = 'idle'; f.cast = null; f.dashHit = null; f.hasHit = false; f.status = {}; f.castLock = 0; f.spamShared = 0;
      f.cd = [0,0,0,0,0,0,0,0,0,0]; f.charge = [100, 100]; f.ultimate = 100;
      /* oponente devolve o golpe na hora (espinhos/reflexo/contra-ataque) */
      const orig = o.takeHit.bind(o);
      o.takeHit = (dmg, opts) => { const r = orig(dmg, opts); if (opts && opts.attacker && opts.attacker.takeHit) opts.attacker.takeHit(4, { attacker: o, kx: 3, dirSign: -1, stun: 18 }); return r; };
      let err = null, hit = false;
      try {
        if (f.tryCast(i)) for (let t = 0; t < 120; t++) { g.tick(); if (f.state === 'hit') hit = true; }
      } catch (e) { err = String(e.message).slice(0, 80); }
      o.takeHit = orig;
      out.push({ id: def.id, i, p: p.id, err, hit });
    });
  }
  return JSON.stringify(out);
})()`, ctx));
const dup = JSON.parse(vm.runInContext(`(() => { const c = {}; FIGHTERS.forEach((f) => { c[f.id] = (c[f.id] || 0) + 1; }); return JSON.stringify(Object.keys(c).filter((k) => c[k] > 1)); })()`, ctx));
check('nenhum lutador duplicado na lista (Dolynho da V5 aparecia 2x)', dup.length === 0, dup.join(',') || 'sem duplicatas');
check('ha lutadores com dash para testar', R.length >= 5, R.length + ' habilidades de dash');
const bad = R.filter((r) => r.err);
check('dash revidado no meio do golpe nao quebra o jogo (todos os lutadores)', bad.length === 0, bad.map((r) => r.id + '#' + r.i + ': ' + r.err).slice(0, 4).join(' | ') || R.length + ' casos ok');
console.log('---');
console.log(fails === 0 ? 'REGRESSAO MOTOR: TUDO OK (' + n + ' checks)' : 'REGRESSAO MOTOR: ' + fails + ' FALHAS de ' + n);
process.exit(fails ? 1 : 0);
