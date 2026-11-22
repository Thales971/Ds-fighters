// TABELA UNICA de balanceamento (js/data/balance-final.js):
// - carregada logo depois do balance-v14 no index.html
// - cobre TODOS os lutadores normais, nenhum de codigo
// - numeros sao os que valem no jogo (stats do FIGHTERS = tabela)
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"?]+)/g)].map((m) => m[1]);
check('balance-final.js logo depois do balance-v14', files.indexOf('js/data/balance-final.js') === files.indexOf('js/data/balance-v14.js') + 1);
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
const files2 = [...html.matchAll(/<script src="([^"?]+)/g)].map((m) => m[1])
  .filter((f) => /^(assets\/sprites|js\/data|js\/engine)\//.test(f)).filter((f) => !/engine\/(audio|input)\.js$/.test(f));
for (const f of files2) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }); } catch (e) { check('carga ' + f, false, e.message.slice(0, 80)); }
}
const R = vm.runInContext(`(() => {
  const normais = FIGHTERS.filter((f) => !f.secret && f.id !== 'boneco-treino').map((f) => f.id);
  const tab = Object.keys(BALANCE_FINAL);
  const secretos = FIGHTERS.filter((f) => f.secret).map((f) => f.id);
  const ruins = tab.filter((id) => { const s = BALANCE_FINAL[id]; return !(s.power > 0.5 && s.power < 6 && s.hp >= 50 && s.hp <= 1000 && s.speed > 0.5 && s.speed < 2); });
  const diverge = tab.filter((id) => { const f = FIGHTERS.find((x) => x.id === id); return !f || Math.abs(f.stats.power - BALANCE_FINAL[id].power) > 1e-9 || f.stats.hp !== BALANCE_FINAL[id].hp; });
  return { faltam: normais.filter((id) => !tab.includes(id)), secretos: tab.filter((id) => secretos.includes(id)), ruins, diverge, n: tab.length };
})()`, ctx);
check('tabela cobre todos os normais', R.faltam.length === 0, R.faltam.join(','));
check('nenhum personagem de codigo na tabela', R.secretos.length === 0, R.secretos.join(','));
check('valores dentro do razoavel (forca, vida, velocidade; o jogo ainda limita a vida em 500)', R.ruins.length === 0, R.ruins.join(','));
check('o jogo usa exatamente os numeros da tabela', R.diverge.length === 0, R.diverge.join(','));
console.log(`\nTABELA DE BALANCEAMENTO: ${fails ? fails + ' FALHAS' : 'TUDO OK'} (${n} checks, ${R.n} lutadores)`);
process.exit(fails ? 1 : 0);
