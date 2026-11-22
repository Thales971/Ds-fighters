#!/usr/bin/env node
/* GERA A TABELA UNICA de balanceamento (js/data/balance-final.js).
   Carrega os mesmos scripts do index.html ate o balance-final.js (exclusive),
   le os stats finais de cada lutador normal e grava os numeros absolutos.
   Depois disso, ajuste de forca/vida/velocidade e so editar a tabela.
   Uso: node tools/balance_snapshot.cjs            -> regrava a tabela
        node tools/balance_snapshot.cjs --so-relatorio -> SO lista o dano final de cada habilidade (nao grava) */
/* TORNEIO CPU x CPU no motor real (Node, sem desenhar) para medir balanceamento.
   Carrega os mesmos scripts do index.html (dados + motor), roda lutas IA x IA
   de 1 round em arena neutra, sem clima/mecanica/pet, e mede taxa de vitoria.

   Uso:
     node tools/balance_sim.cjs                    -> todos os normais, 2 lutas por par
     node tools/balance_sim.cjs --games 4          -> mais amostras
     node tools/balance_sim.cjs --ids a,b,c        -> so esses (contra o grupo deles)
     node tools/balance_sim.cjs --secret           -> os secretos (contra secretos)
     node tools/balance_sim.cjs --vs normal        -> ids/secretos contra TODOS os normais
     node tools/balance_sim.cjs --out sim.json     -> salva matriz e ranking
     node tools/balance_sim.cjs --seed 7           -> outra semente (Math.random fixo)
     node tools/balance_sim.cjs --mult m.json      -> testa multiplicadores {id: m} em power/hp
*/
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true); };
const GAMES = Number(arg('games', 2));
const SEED = Number(arg('seed', 1));

/* Math.random deterministico (mulberry32) para a simulacao ser reproduzivel */
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const M = Object.create(Math); M.random = rng(SEED);

const fake2d = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'measureText' ? () => ({ width: 10 }) : k.startsWith('create') ? () => ({ addColorStop() {} }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
const ctx = {
  console: { log() {}, warn() {}, error() {} }, Audio: class { play() { return Promise.resolve(); } pause() {} }, Math: M, Date, JSON, Image: class { set src(v) {} }, URLSearchParams,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: true }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => true, record() {}, grantAchievement: () => false, hasAchievement: () => true, recordSurvivalBy() {}, recordWinBy() {}, recordStage() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0, releaseAll() {} },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: new Proxy({ hud: new Proxy({}, { get: () => () => {} }), pitocoSeq: [] }, { get: (t, k) => (k in t ? t[k] : () => {}) }),
  HUD: new Proxy({}, { get: () => () => {} }),
  Net: {},
  document: { getElementById: () => null, createElement: () => ({ getContext: () => fake2d(), width: 0, height: 0, style: {} }), querySelectorAll: () => [], querySelector: () => null, addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {}, contains: () => false }, dataset: {} } },
  window: { addEventListener() {}, matchMedia: () => ({ matches: true }) }, navigator: { userAgent: 'node' },
  location: { search: '', hash: '' },
  setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0,
};
ctx.globalThis = ctx;
vm.createContext(ctx);

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"?]+)/g)].map((m) => m[1])
  .filter((f) => /^(assets\/sprites|assets\/stages|assets\/maps|js\/data|js\/engine)\//.test(f))
  .filter((f) => !/engine\/(audio|input)\.js$/.test(f)); /* stubs acima */

const stop = files.indexOf('js/data/balance-final.js');
for (const f of (stop >= 0 ? files.slice(0, stop) : files)) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }); } catch (e) { process.stderr.write('carga ' + f + ': ' + e.message.slice(0, 80) + '\n'); }
}
const rows = vm.runInContext(`FIGHTERS.filter((f) => !f.secret && f.id !== 'boneco-treino' && f.stats).map((f) => ({ id: f.id, name: f.name, s: f.stats }))`, ctx);
const r3 = (v) => Math.round(v * 1000) / 1000;
const line = (x) => `  '${x.id}': { power: ${r3(x.s.power || 1)}, hp: ${Math.round(x.s.hp || 100)}, speed: ${r3(x.s.speed || 1)}, weight: ${r3(x.s.weight || 1)}, meterRate: ${r3(x.s.meterRate || 1)} }, /* ${x.name} */`;
const out = `/* ============================================================
   TABELA UNICA DE BALANCEAMENTO (nov/2026, PR 127)
   Os numeros FINAIS de cada lutador normal: forca (dano), vida, velocidade,
   peso e ganho de medidor. Antes, cada valor passava por varias camadas
   (fighters*.js -> powers-balance-v6..v13 -> balance-v14 FORCA/AJUSTE/DANO)
   e ninguem sabia o numero real. Agora: quer mexer num lutador, mexe AQUI.
   Os de codigo (secretos) nao entram. As habilidades (dano de cada golpe)
   continuam nos arquivos de kit; o relatorio delas sai com:
     node tools/balance_snapshot.cjs --kits
   Gerado por tools/balance_snapshot.cjs; regravar SO depois de mexer nas
   camadas antigas (ele le o resultado delas).
   ============================================================ */
const BALANCE_FINAL = {
${rows.map(line).join('\n')}
};
(() => {
  for (const f of FIGHTERS) {
    const s = BALANCE_FINAL[f.id];
    if (s && f.stats && !f.secret) Object.assign(f.stats, s);
  }
})();
`;
if (!process.argv.includes('--so-relatorio')) { fs.writeFileSync(path.join(ROOT, 'js/data/balance-final.js'), out); console.log('tabela gravada:', rows.length, 'lutadores'); }
if (process.argv.includes('--kits') || process.argv.includes('--so-relatorio')) {
  const kits = vm.runInContext(`FIGHTERS.filter((f) => !f.secret && POWERS[f.id]).map((f) => [f.id, f.stats.power, POWERS[f.id].powers.map((p) => [p.name, p.slot, p.dmg || 0, p.cd || 0])])`, ctx);
  for (const [id, pw, ps] of kits) console.log(id.padEnd(18), 'forca', r3(pw), '|', ps.map((p) => `${p[0]} ${p[2]}${p[2] ? '(x' + r3(pw) + '=' + Math.round(p[2] * pw) + ')' : ''}`).join(' · '));
}
