// BELEZA VISUAL (top 3): gradiente de ceu por tema de palco (cacheado),
// camada foreground de grama na frente dos lutadores (so em mapa natural),
// barra de vida ghost com flash de dano + glow em HP baixo.
const fs = require('fs'); const vm = require('vm');
function req(name){ try { return require(name); } catch(e){ return require('/tmp/node_modules/'+name); } }
const { createCanvas } = req('canvas');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas, fs,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {}, pitocoSeq: [], pitocoKey() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), querySelectorAll: () => [], addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} }, dataset: {} } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }

const r = vm.runInContext(`
const mkGradRec = () => {
  const r = { grads: [], linear: 0, fillRect: 0, translates: [], cells: [] };
  const base = { canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() { r.fillRect++; }, strokeRect() {}, drawImage() {}, translate(x, y) { r.translates.push([x, y]); }, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createPattern: () => ({}), set imageSmoothingEnabled(v) {}, set globalAlpha(v) {}, set globalCompositeOperation(v) {}, set fillStyle(v) {}, set strokeStyle(v) {}, set font(v) {}, set textAlign(v) {}, set lineWidth(v) {} };
  return [new Proxy(base, {
    get(t, k) {
      if (k === 'createLinearGradient') return (x0, y0, x1, y1) => { r.linear++; const g = { stops: [], addColorStop(o, c) { g.stops.push([o, c]); } }; r.grads.push(g); return g; };
      if (k === 'createRadialGradient') return () => ({ addColorStop() {} });
      if (k === 'filter') return undefined;
      if (k in t) return t[k];
      return undefined;
    },
    set(t, k, v) { t[k] = v; return true; },
  }), r];
};
const fake2d = () => mkGradRec()[0];
const mk = (stageId) => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } });
  g.start({ mode: 'versus', teams: [['du'], ['stack']], stage: stageId, cpu: [false, false], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};

// ===== 1. CEU POR TEMA =====
const gK = mk('kernel'); /* neve: frio azulado */
const gF = mk('02-volcanic-forge'); /* laranja quente */
const gP = mk('parque-lago'); /* por do sol rosa */
const recK = mkGradRec(); gK.stage.drawBack(recK[0], 0, 0);
const recF = mkGradRec(); gF.stage.drawBack(recF[0], 0, 0);
const recP = mkGradRec(); gP.stage.drawBack(recP[0], 0, 0);
/* le o gradiente de ceu direto do cache do stage (criado no 1o drawBack) */
const skyStops = (g) => (g.stage._skyGrad && g.stage._skyGrad.stops ? g.stage._skyGrad.stops : []);
const topK = skyStops(gK).length ? skyStops(gK)[0][1] : '';
const topF = skyStops(gF).length ? skyStops(gF)[0][1] : '';
const topP = skyStops(gP).length ? skyStops(gP)[0][1] : '';
/* cache: 2a drawBack nao recria o gradiente de ceu (linear cai exatamente 1) */
const lin1 = recK[1].linear; const recK2 = mkGradRec(); gK.stage.drawBack(recK2[0], 0, 0);
const skyCached = gK.stage._skyGrad != null && recK2[1].linear === lin1 - 1;
/* ceu some no horizonte (ultimo stop alpha 0) */
const skyFades = skyStops(gK).some((s) => s[1].indexOf(',0)') >= 0);

// ===== 2. FOREGROUND =====
const gNat = mk('parque-lago'); const gUrb = mk('treino-dojo');
const fgN = gNat.stage.foreground.length, fgU = gUrb.stage.foreground.length;
/* spy no Art.cell durante drawForeground */
const origCell = Art.cell.bind(Art);
Art.images['flora'] = { naturalWidth: 512, naturalHeight: 640 };
const cells = [];
Art.cell = (c, key, row, col, x, y, opts) => { if (key === 'flora') cells.push({ row, scale: opts && opts.scale }); return origCell(c, key, row, col, x, y, opts); };
const recFG = mkGradRec();
gNat.stage.drawForeground(recFG[0], 0);
const cells2 = cells.slice(); cells.length = 0;
for (let t = 0; t < 30; t++) gNat.stage.update(gNat.weather);
gNat.stage.drawForeground(recFG[0], 0);
const cellsB = cells.slice();
Art.cell = origCell;
/* game chama drawForeground no renderScene (sobre lutadores, abaixo do clima) */
const gameSrc = 'GAME_SRC';

// ===== 3. GHOST HP (redHp drena devagar apos dano) =====
const gH = mk('treino-dojo');
const fH = gH.activeOf(0);
fH.redHp = fH.maxHp; fH.hp = fH.maxHp - 60; fH._ghostWait = 0;
const red0 = fH.redHp;
for (let t = 0; t < 40; t++) fH.update(EMPTY_INPUT);
const ghostOk = fH.redHp > fH.hp && fH.redHp < red0; /* trilha vermelha entre hp e redHp, drenando */
for (let t = 0; t < 600; t++) fH.update(EMPTY_INPUT);
const ghostCaughtUp = Math.abs(fH.redHp - fH.hp) < 1.5;

JSON.stringify({ topK, topF, topP, skyCached, skyFades, fgN, fgU, fgCells: cells2.length, fgScales: cells2.map((c) => c.scale), fgSway: JSON.stringify(recFG[1].translates.slice(0, 4)) !== JSON.stringify((() => { const r2 = mkGradRec(); gNat.stage.drawForeground(r2[0], 0); return r2[1].translates.slice(0, 4); })()), ghostOk, ghostCaughtUp });
`, ctx);
const R = JSON.parse(r);

// ceu por tema: cores distintas e tematicas
const parse = (s) => { const m = /rgba\((\d+),(\d+),(\d+)/.exec(s || ''); return m ? [+m[1], +m[2], +m[3]] : null; };
const kC = parse(R.topK), fC = parse(R.topF), pC = parse(R.topP);
check('ceu do kernel e frio/azulado (b > r)', !!kC && kC[2] > kC[0], R.topK);
check('ceu da forja e quente/laranja (r > b)', !!fC && fC[0] > fC[2], R.topF);
check('ceu do parque e rosa/quente (r > b, nao frio)', !!pC && pC[0] > pC[2], R.topP);
check('3 temas diferentes dao 3 ceus diferentes', R.topK !== R.topF && R.topF !== R.topP && R.topK !== R.topP, '');
check('gradiente de ceu CACHEADO (2a drawBack nao recria) e some no horizonte', R.skyCached && R.skyFades, 'cached=' + R.skyCached + ' fades=' + R.skyFades);

// foreground
check('mapa natural (parque-lago) tem camada foreground; urbano (treino-dojo) NAO tem', R.fgN >= 4 && R.fgU === 0, 'parque=' + R.fgN + ' treino=' + R.fgU);
check('foreground desenha tufos GRANDES do atlas de flora (scale > 1)', R.fgCells >= 4 && R.fgScales.every((s) => s > 1), 'cells=' + R.fgCells + ' scales=' + R.fgScales.map((s) => s.toFixed(2)).join(','));
check('foreground balanca com o tempo (vento/sway)', R.fgSway === true, '');
const gSrc = fs.readFileSync('js/engine/game.js', 'utf8');
check('renderScene chama stage.drawForeground sobre os lutadores e abaixo do clima', /drawForeground\(ctx, camX\)[\s\S]{0,140}weather\.draw/.test(gSrc), '');

// ghost HP
check('apos dano o redHp fica ENTRE hp e max (trilha vermelha) e drena devagar', R.ghostOk, '');
check('depois de 600 ticks o ghost alcanca o hp (nao trava)', R.ghostCaughtUp, '');
const hudSrc = fs.readFileSync('js/ui/hud.js', 'utf8');
const cssSrc = fs.readFileSync('css/style.css', 'utf8');
check('HUD tem dmgflash + classe hit no dano (flash branco na barra)', /dmgflash/.test(hudSrc) && /classList\.toggle\('hit'/.test(hudSrc));
check('CSS: red com glow, dmgflash anima, low pulsa com glow, reduced desliga', /\.life \.red \{[^}]*box-shadow/.test(cssSrc) && /@keyframes dmgflash/.test(cssSrc) && /@keyframes lowGlow/.test(cssSrc) && /body\.reduced[^{]*\.life\.hit/.test(cssSrc));

// render longo sem crash com as 3 coisas ligada
const r2 = vm.runInContext(`
const g = mk('parque-lago');
let err = null;
try { for (let t = 0; t < 400; t++) { g.tick(); g.render(0.5); } } catch (e) { err = e.message.slice(0, 80); }
JSON.stringify({ err });
`, ctx);
check('400 frames tick+render(0.5) no parque-lago (ceu+foreground+lerp) sem crash', JSON.parse(r2).err === null, JSON.parse(r2).err || 'ok');

console.log('---');
console.log(fails === 0 ? 'BELEZA VISUAL: TUDO OK (' + n + ' checks)' : 'BELEZA: ' + fails + ' FALHAS de ' + n);
process.exit(fails ? 1 : 0);
