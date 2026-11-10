const fs = require('fs');
const vm = require('vm');
const ctx = {
  console, Image: class { set src(v) {} }, Math, Date, JSON,
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: new Proxy({}, { get: () => () => {} }),
  Net: {}, AI: { think: () => ({}) },
  document: { getElementById: () => null, createElement: () => ({ getContext: () => ({}), style: {} }), addEventListener() {} },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16),
  fetch: () => Promise.resolve({ ok: false, json: async () => ({}) }),
};
ctx.globalThis = ctx;
vm.createContext(ctx);
const files = ['js/core/profile.js', 'js/data/fighters.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 80)); } }
vm.runInContext(`
let fails = 0;
const check = (n, c, x) => { console.log((c ? 'OK   ' : 'FALHA') + ' ' + n + (x ? ' — ' + x : '')); if (!c) fails++; };
Profile.data = { unlocked: [], settings: {}, stats: {} };
// 1) Du, Iales, Felipinho TRAVADOS por padrao
check('Du travado por padrao', Profile.isUnlocked('du') === false);
check('Iales travado por padrao', Profile.isUnlocked('iales') === false);
check('Felipinho travado por padrao', Profile.isUnlocked('felipinho') === false);
// 2) Winx e Qwen NORMAIS (destravadas)
check('Qwen destravada (normal)', Profile.isUnlocked('qwen') === true);
check('Winx destravada (normal)', Profile.isUnlocked('winx-exe') === true);
check('Nunes destravado (normal)', Profile.isUnlocked('nunes') === true);
// 3) codigo ADM desbloqueia os tres
const r = Profile.redeem('ADM');
check('ADM desbloqueia', r.ok === true, r.msg);
check('Du liberado', Profile.isUnlocked('du') === true);
check('Iales liberado', Profile.isUnlocked('iales') === true);
check('Felipinho liberado', Profile.isUnlocked('felipinho') === true);
// 4) ADM de novo = ja liberado
const r2 = Profile.redeem('adm');
check('ADM repetido avisa', r2.ok === true && r2.already === true, r2.msg);
// 5) codigos antigos invalidos
const rb = Profile.redeem('batata');
check('codigo BATATA legado (informativo)', rb.ok === true, rb.msg);
const rw = Profile.redeem('winx');
check('codigo WINX invalido agora', rw.ok === false, rw.msg);
console.log(fails === 0 ? 'UNLOCK: TUDO OK' : 'UNLOCK: ' + fails + ' FALHAS');
`, ctx);
