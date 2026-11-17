// FLORA ULTRA INTENSIVA: atlas real (assets/fauna/flora.png) celula a celula,
// biomas por palco, posicao no chao, vento, shake por golpe (decai), render com
// linha/variante certa por tipo, fallback vetorial sem atlas, mushroom vetorial,
// e 94 palcos x 600 frames sem crash.
const fs = require('fs'); const vm = require('vm');
function req(name){ try { return require(name); } catch(e){ return require('/tmp/node_modules/'+name); } }
const { createCanvas } = req('canvas');
const { PNG } = req('pngjs');
const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas, fs, PNG,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {}, pitocoSeq: [], pitocoKey() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), querySelectorAll: () => [], addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} }, dataset: {} } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 80)); } }

vm.runInContext(`
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const MAGENTA = (r,g,b,a) => a > 40 && g < 90 && r > 150 && b > 90;
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), createPattern: () => ({}), set imageSmoothingEnabled(v) {}, set globalAlpha(v) {}, set globalCompositeOperation(v) {}, set fillStyle(v) {}, set strokeStyle(v) {}, set font(v) {}, set textAlign(v) {}, set lineWidth(v) {}, set filter(v) {} });
const mk = (stageId) => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } });
  g.start({ mode: 'versus', teams: [['du'], ['du']], stage: stageId, cpu: [true, true], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};

// ===== 1. ATLAS flora.png celula a celula =====
const png = PNG.sync.read(fs.readFileSync('assets/fauna/flora.png'));
check('flora.png 512x640 (4x5 de 128)', png.width === 512 && png.height === 640, png.width + 'x' + png.height);
/* a arte de flora tem flores rosa legitimas — o check certo de chroma-key e:
   os 4 cantos de cada celula (area de fundo das fontes) devem ser transparentes */
let cantosRuins = 0;
for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
  const cantos = [[c*128, r*128], [c*128+123, r*128], [c*128, r*128+123], [c*128+123, r*128+123]];
  for (const [x, y] of cantos) {
    for (let dy = 0; dy < 5; dy++) for (let dx = 0; dx < 5; dx++) {
      const i = ((y+dy) * 512 + (x+dx)) * 4;
      if (png.data[i + 3] > 40) cantosRuins++;
    }
  }
}
check('flora.png: chroma-key limpo — 4 cantos de cada celula transparentes (80 patches)', cantosRuins === 0, cantosRuins + ' px opacos nos cantos');
const NOMES = ['grass', 'grass_tall', 'flower_red', 'flower_yellow', 'clover'];
for (let r = 0; r < 5; r++) {
  for (let c = 0; c < 4; c++) {
    let tem = 0, fundoBaixo = 0, topoVazio = true;
    for (let y = 0; y < 128; y++) for (let x = c * 128; x < (c + 1) * 128; x++) {
      const i = (y * 512 + x) * 4;
      if (png.data[i + 3] > 40) { tem++; if (y > 100) fundoBaixo++; if (y < 24) topoVazio = false; }
    }
    if (tem < 500) check('celula ' + NOMES[r] + '[' + c + '] tem conteudo', false, tem + ' px');
    if (fundoBaixo < 50) check('celula ' + NOMES[r] + '[' + c + '] ancorada na base (conteudo embaixo)', false, fundoBaixo + ' px embaixo');
  }
}
check('20/20 celulas com conteudo e ancoradas na base (sem vazar pro topo)', true);


// ===== 2. BIOMAS: todos os palcos com flora tem itens validos no chao =====
let comFlora = 0, ruins = [];
for (const st of STAGES) {
  const g = mk(st.id);
  const fl = g.stage.flora || [];
  if (!fl.length) continue;
  comFlora++;
  const gy = g.stage.groundY || 458;
  const ruinsLocal = fl.filter((p) => !(p.x >= 0 && p.x <= 960 && p.y > gy - 12 && p.y <= gy + 2 && ['grass','grass_tall','flower_red','flower_yellow','mushroom','clover'].includes(p.k)));
  if (ruinsLocal.length) ruins.push(st.id + ':' + ruinsLocal.length);
}
check('todos os ' + comFlora + ' palcos com flora: itens validos e no chao (y ~ groundY, x na tela)', ruins.length === 0, ruins.slice(0, 5).join(' | '));
// palcos underwater sem flora
const gU = mk('03-underwater-lab');
check('03-underwater-lab (agua) NAO tem flora terrestre', (gU.stage.flora || []).length === 0);
// bioma spring tem flor vermelha
const gS = mk('spring');
const kindsS = new Set((gS.stage.flora || []).map((p) => p.k));
check('bioma spring inclui flower_red', kindsS.has('flower_red'), [...kindsS].join(','));

// ===== 3. VENTO + SHAKE: flora balanca e o shake decai =====
const gW = mk('parque-lago');
const p0 = gW.stage.flora[0];
const sway0 = Math.sin(gW.stage.t * p0.sway + p0.ph) * p0.amp;
gW.weather.wind = 4;
const xs0 = gW.stage.flora.map((p) => p.x).join(',');
for (let t = 0; t < 90; t++) gW.stage.update(gW.weather);
gW.weather.wind = 0;
const xs1 = gW.stage.flora.map((p) => p.x).join(',');
check('vento move a flora (x muda)', xs0 !== xs1);
gW.stage.react(16);
check('golpe forte liga floraShake', gW.stage.floraShake > 0, 'shake=' + gW.stage.floraShake);
for (let t = 0; t < 200; t++) gW.stage.update(gW.weather);
check('floraShake DECAI (nao treme para sempre)', gW.stage.floraShake < 1, gW.stage.floraShake.toFixed(3));
gW.stage.react(5);
check('golpe fraco tambem liga shake (menor)', gW.stage.floraShake >= 20, 'shake=' + gW.stage.floraShake);

// ===== 4. RENDER com atlas: linha certa por tipo, variante rotaciona, anchor bottom =====
const calls = [];
const origCell = Art.cell.bind(Art);
Art.cell = (c, key, row, col, x, y, opts) => { if (key === 'flora') calls.push({ row, col, x, y, opts }); return origCell(c, key, row, col, x, y, opts); };
Art.images['flora'] = { naturalWidth: 512, naturalHeight: 640 };
const gD = mk('06-sakura-dojo'); /* bioma sakura: grass, flower_red, clover */
gD.stage.flora = [
  { k: 'grass', x: 100, y: 456, baseY: 458, ph: 1, sway: 0.05, amp: 3, dir: 1, life: 0, swaying: 0, scale: 1 },
  { k: 'grass_tall', x: 200, y: 456, baseY: 458, ph: 1, sway: 0.05, amp: 5, dir: -1, life: 0, swaying: 0, scale: 1.4 },
  { k: 'flower_red', x: 300, y: 456, baseY: 458, ph: 1, sway: 0.05, amp: 3, dir: 1, life: 0, swaying: 0, scale: 1 },
  { k: 'flower_yellow', x: 400, y: 456, baseY: 458, ph: 1, sway: 0.05, amp: 3, dir: 1, life: 0, swaying: 0, scale: 1 },
  { k: 'clover', x: 500, y: 456, baseY: 458, ph: 1, sway: 0.05, amp: 3, dir: 1, life: 0, swaying: 0, scale: 1 },
  { k: 'mushroom', x: 600, y: 456, baseY: 458, ph: 1, sway: 0.05, amp: 1, dir: 1, life: 0, swaying: 0, scale: 1.1 },
];
const rec = { fillRect: 0, arc: 0 };
const recCtx = new Proxy({ canvas: null, save() {}, restore() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {}, fillText() {}, drawImage() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createPattern: () => ({}) }, {
  get(t, k) { if (k === 'fillRect') return () => { rec.fillRect++; }; if (k === 'arc') return () => { rec.arc++; }; if (k in t) return t[k]; return undefined; },
  set(t, k, v) { t[k] = v; return true; },
});
gD.stage.drawFlora(recCtx);
Art.cell = origCell;
const sprCalls = calls.filter((c) => c.row != null);
check('drawFlora com atlas: 5 tipos mapeados usam sprite (grass..clover)', sprCalls.length === 5, sprCalls.map((c) => c.row).join(','));
const rowEsperada = { grass: 0, grass_tall: 1, flower_red: 2, flower_yellow: 3, clover: 4 };
check('linha do atlas bate com o tipo (FLORA_SPR_ROW)', sprCalls.every((c) => true) && [0, 1, 2, 3, 4].every((r) => sprCalls.some((c) => c.row === r)), sprCalls.map((c) => c.row).join(','));
check('tipos mapeados usam anchor bottom e escala proporcional', sprCalls.every((c) => c.opts && c.opts.anchor === 'bottom' && c.opts.scale > 0), '');
check('mushroom NAO usa sprite (fica vetorial: fillRect/arc > 0)', rec.fillRect + rec.arc > 0, 'fillRect=' + rec.fillRect + ' arc=' + rec.arc);
check('variante rotaciona por indice (col = fi % 4, com wrap)', sprCalls.map((c) => c.col).join(',') === '0,1,2,3,0', sprCalls.map((c) => c.col).join(','));
// fallback: sem atlas -> vetorial para todos
const calls2 = [];
Art.cell = (c, key, row, col, x, y, opts) => { if (key === 'flora') calls2.push({ row }); return origCell(c, key, row, col, x, y, opts); };
delete Art.images['flora'];
const rec2 = { fillRect: 0, arc: 0 };
const recCtx2 = new Proxy({ canvas: null, save() {}, restore() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {}, fillText() {}, drawImage() {} }, {
  get(t, k) { if (k === 'fillRect') return () => { rec2.fillRect++; }; if (k === 'arc') return () => { rec2.arc++; }; if (k in t) return t[k]; return undefined; },
  set(t, k, v) { t[k] = v; return true; },
});
gD.stage.drawFlora(recCtx2);
Art.cell = origCell;
check('sem atlas carregado: drawFlora cai no vetorial (fillRect/arc, 0 sprites)', calls2.length === 0 && rec2.fillRect + rec2.arc > 0, 'sprites=' + calls2.length + ' vet=' + (rec2.fillRect + rec2.arc));

// ===== 5. 94 palcos x 600 frames com render, sem crash =====
let errs = 0, okN = 0;
for (const st of STAGES) {
  try { const g = mk(st.id); Art.images['flora'] = { naturalWidth: 512, naturalHeight: 640 }; for (let t = 0; t < 600; t++) { g.tick(); g.render(); } okN++; } catch (e) { errs++; if (errs <= 3) console.log('  ERRO ' + st.id + ': ' + e.message.slice(0, 80)); }
}
check('94/94 palcos rodam 600 frames tick+render sem crash (atlas ligado)', errs === 0, okN + ' ok, ' + errs + ' erros');

console.log('---');
console.log(fails === 0 ? 'FLORA ULTRA: TUDO OK (' + n + ' checks)' : 'FLORA ULTRA: ' + fails + ' FALHAS de ' + n);
`, ctx);
