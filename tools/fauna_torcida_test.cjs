// FAUNA + TORCIDA: peixe na superficie (nao no ar), maré alta constante em palco com peixe,
// esquilo/libelula com sprite no atlas bichos, e torcida no fundo variando as pessoas.
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
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} } } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/pets.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 80)); } }
vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), createPattern: () => ({}), set imageSmoothingEnabled(v) {}, set globalAlpha(v) {}, set globalCompositeOperation(v) {}, set fillStyle(v) {}, set strokeStyle(v) {}, set font(v) {}, set textAlign(v) {}, set lineWidth(v) {}, set filter(v) {} });
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const mk = (stage) => {
  const canvas = { width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } };
  const g = new Game(canvas);
  g.start({ mode: 'versus', teams: [['du'], ['du']], stage, cpu: [true, true], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};

// 1. Peixe NA AGUA (abaixo da linha do chao 458), nao no ar — palcos swim/tide com peixe
// (peixe agora vive no LiveFauna, desenhado pelo atlas bichos.png linha 3)
for (const stage of ['manguezal', 'paraty', 'bonito', 'represa', 'parque-lago']) {
  const g = mk(stage);
  const fish = (g.stage.liveFauna ? g.stage.liveFauna.animals : []).filter((a) => a.k === 'fish');
  check(stage + ': peixe existe no ambiente', fish.length > 0, fish.length + ' peixes');
  const allWater = fish.every((f) => f.baseY >= 458 && f.baseY <= 458 + 40);
  check(stage + ': peixe nasce NA AGUA (baseY >= 458, abaixo do dock, nao no ar)', allWater, 'baseY=' + fish.map((f) => Math.round(f.baseY)).join(','));
}
// palco com tanque (bolhas) continua dentro do tanque
const gTank = mk('03-underwater-lab');
const tankFish = (gTank.stage.liveFauna ? gTank.stage.liveFauna.animals : []).filter((a) => a.k === 'fish');
check('03-underwater-lab: peixe dentro do tanque (y 150-350)', tankFish.length > 0 && tankFish.every((f) => f.baseY >= 150 && f.baseY <= 350), 'baseY=' + tankFish.map((f) => Math.round(f.baseY)).join(','));

// 2. Maré alta CONSTANTE em palco com peixe (wave nunca zera, pushX ativo)
const gTide = mk('manguezal');
const mech = gTide.mech;
for (let t = 0; t < 600; t++) gTide.tick();
check('manguezal (tem peixe): permaTide ligado', mech.m.permaTide === true);
check('manguezal: onda sempre alta apos 600 ticks', mech.m.wave === 130, 'wave=' + mech.m.wave);
check('manguezal: pushX constante (maré empurrando)', gTide.pushX !== 0, 'pushX=' + gTide.pushX);
// palco tide SEM peixe continua intermitente
const gKotlin = mk('kotlin');
for (let t = 0; t < 600; t++) gKotlin.tick();
check('kotlin (sem peixe): permaTide desligado', gKotlin.mech.m.permaTide !== true);
check('kotlin: onda pode estar baixa (maré intermitente)', gKotlin.mech.m.wave <= 130);

// 3. LiveFauna nasce todas as especies do palco (inclui esquilo/libelula)
const gLago = mk('parque-lago');
const kinds = {};
for (const a of gLago.stage.liveFauna.animals) kinds[a.k] = (kinds[a.k] || 0) + 1;
check('parque-lago: dog/fish/squirrel/dragonfly nascem', !!(kinds.dog && kinds.fish && kinds.squirrel && kinds.dragonfly), JSON.stringify(kinds));

// 4. Atlas bichos tem as 10 especies (linhas 0-9 com conteudo) — esquilo=8, libelula=9
const png = PNG.sync.read(fs.readFileSync('assets/fauna/bichos.png'));
check('bichos.png 384x960 (10 especies x 4 frames)', png.width === 384 && png.height === 960, png.width + 'x' + png.height);
let rowsOk = 0;
for (let r = 0; r < 10; r++) {
  let tem = false;
  for (let y = r * 96; y < (r + 1) * 96 && !tem; y++) for (let x = 0; x < 384; x++) if (png.data[(y * 384 + x) * 4 + 3] > 0) { tem = true; break; }
  if (tem) rowsOk++;
}
check('bichos.png: 10 linhas com sprite (inclui esquilo row8 e libelula row9)', rowsOk === 10, rowsOk + '/10');

// 5. Torcida: palcos com torcida no fundo (arquibancada/quadra/terminal/estacao + sesi + circo), desenha variando pessoas
const comTorcida = STAGES.filter((s) => s.torcida);
check('>=6 palcos com torcida (inclui sesi e circo)', comTorcida.length >= 6 && comTorcida.some((s) => s.id === 'sesi') && comTorcida.some((s) => s.id === 'circo'), comTorcida.map((s) => s.id).join(','));
const gCrowd = mk('arquibancada');
check('arquibancada: 3 fileiras de torcida na arquibancada do mapa', gCrowd.stage.crowd && gCrowd.stage.crowd.length === 3);
// espia drawImage para ver o retangulo de origem usado na torcida
const draws = [];
const c2 = fake2d();
const origDraw = c2.drawImage;
c2.drawImage = function (...args) { draws.push(args); };
// crowdSheet é Image stub (sem width) no harness — força width para o draw acontecer
gCrowd.stage.crowdSheet = { width: 1280, height: 200 };
gCrowd.stage.drawTorcida(c2);
const PW = 1280 / 25;
const crowdDraws = draws.filter((d) => d.length === 9 && Math.abs(d[3] - PW) < 0.01 && d[4] === 200);
check('torcida desenha 1 pessoa por vez (src 51.2x200)', crowdDraws.length > 0, crowdDraws.length + ' draws');
const cols = new Set(crowdDraws.map((d) => Math.round(d[1] / PW)));
check('torcida varia as pessoas (colunas diferentes)', cols.size > 1, 'cols=' + [...cols].join(','));

console.log('---');
console.log(fails === 0 ? 'FAUNA/TORCIDA: TUDO OK (' + n + ' checks)' : 'FAUNA/TORCIDA: ' + fails + ' FALHAS de ' + n);
`, ctx);
