const fs = require('fs');
const vm = require('vm');
const ctx = {
  console, fs, Image: class { set src(v) {} }, Math, Date, JSON,
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
// 6) ANTI-VAZAMENTO: codigo errado NAO pode listar os codigos validos na msg
const rx = Profile.redeem('xyz-errado-123');
const msgPad = ' ' + String(rx.msg || '').toLowerCase() + ' ';
const vaza = [' adm ', ' batata ', ' relogio ', ' pitoco '].some((w) => msgPad.indexOf(w) >= 0);
check('msg de codigo invalido NAO vaza os codigos validos', rx.ok === false && !vaza, JSON.stringify(rx.msg));
const psrc = fs.readFileSync('js/core/profile.js', 'utf8');
const NL = String.fromCharCode(10);
const badLine = psrc.split(NL).find((l) => l.indexOf('ok: false') >= 0 && (l.indexOf('adm') >= 0 || l.indexOf('batata') >= 0 || l.indexOf('relogio') >= 0));
check('profile.js: nenhuma linha de erro lista codigos', !badLine, badLine ? badLine.trim().slice(0, 80) : '');
console.log(fails === 0 ? 'UNLOCK: TUDO OK' : 'UNLOCK: ' + fails + ' FALHAS');
`, ctx);
/* 7) README e arquivos publicos nao podem conter os codigos secretos */
{
  const leakers = [];
  const CODEWORDS = ['adm', 'batata', 'relogio'];
  const hasCode = (s) => {
    const t = ' ' + s.toLowerCase().replace(/[^a-zà-ú ]/g, ' ') + ' ';
    return CODEWORDS.some((w) => t.indexOf(' ' + w + ' ') >= 0);
  };
  const mdFiles = fs.readdirSync('.').filter((f) => f.endsWith('.md')).concat(fs.existsSync('docs') ? fs.readdirSync('docs').filter((f) => f.endsWith('.md')).map((f) => 'docs/' + f) : []);
  for (const f of mdFiles) {
    if (hasCode(fs.readFileSync(f, 'utf8'))) leakers.push(f);
  }
  if (hasCode(fs.readFileSync('index.html', 'utf8'))) leakers.push('index.html');
  // comentarios de codigo nao podem citar os codigos (linhas // ou /* ... */)
  for (const f of ['js/ui/ui.js', 'js/data/fighters-pack.js', 'js/core/profile.js', 'js/data/pets.js']) {
    const s = fs.readFileSync(f, 'utf8');
    const commentLines = s.split('\n').filter((l) => l.trim().startsWith('//') || l.trim().startsWith('/*') || l.indexOf('/*') >= 0);
    if (commentLines.some(hasCode)) leakers.push(f + ' (comentario)');
  }
  const n0 = (typeof fails !== 'undefined') ? fails : 0;
  console.log((leakers.length === 0 ? 'OK   ' : 'FALHA') + ' README/arquivos publicos sem vazar codigos secretos' + (leakers.length ? ' — ' + leakers.join(', ') : ''));
  if (leakers.length) process.exitCode = 1;
}

