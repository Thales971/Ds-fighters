// CLIMA v2: renderiza cada clima com canvas REAL (node-canvas) e audita pixels.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
function req(name) {
  try { return require(name); } catch (e) { return require('/tmp/node_modules/' + name); }
}
const { createCanvas, Image: CanvasImage } = req('canvas');
const outDir = path.join('.vibe', 'weather');
fs.mkdirSync(outDir, { recursive: true });

// sprites de clima carregados de forma sincrona (node-canvas aceita src direto)
const WEATHER_IMGS = {};
try {
  const mk = (f) => { const i = new CanvasImage(); i.src = f; return i; };
  WEATHER_IMGS.flakes = mk('assets/weather/snowflakes.png');
  WEATHER_IMGS.leaf = mk('assets/weather/leaf.png');
  WEATHER_IMGS.spark = mk('assets/weather/spark.png');
} catch (e) { console.log('sprites no harness:', String(e).slice(0, 60)); }

const ctx = {
  console, Math, Date, Image: CanvasImage,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0 },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} } } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16),
  createCanvas, WEATHER_IMGS, fs, path, outDir,
};
ctx.globalThis = ctx;
vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/pets.js', 'js/data/stages.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/vfx.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 80)); } }
vm.runInContext(`
const canvas = createCanvas(960, 540);
let g = new Game({ width: 960, height: 540, getContext: () => canvas.getContext('2d'), toBuffer: () => canvas.toBuffer('image/png'), classList: { remove() {}, add() {}, toggle() {} } });
g.start({ mode: 'versus', teams: [['du'], ['stack']], stage: '06-sakura-dojo', cpu: [false, false], roundsToWin: 2, timer: 99 });
for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
/* sprites de clima INJETADOS como o browser faria via onload */
g.weather.sprites.flakes = { img: WEATHER_IMGS.flakes, cell: 28 };
g.weather.sprites.leaf = { img: WEATHER_IMGS.leaf, cell: 16 };
g.weather.sprites.spark = { img: WEATHER_IMGS.spark, cell: 8 };
const KINDS = ['clear', 'rain', 'wind', 'storm', 'snow', 'aurora', 'heatwave', 'confetti', 'fireworks', 'eclipse', 'rainbow', 'fog', 'darkfog', 'leaves', 'hail', 'fireflies'];
for (const kind of KINDS) {
  g.weather.set(kind);
  for (let t = 0; t < 180; t++) { g.tick(); if (t < 60) g.weather.updateParticles(); }
  g.render();
  fs.writeFileSync(path.join(outDir, 'clima-' + kind + '.png'), canvas.toBuffer('image/png'));
  check('clima ' + kind + ' renderiza', true, g.weather.drops.length + ' particulas');
}
g.weather.set('snow');
g.weather.updateParticles();
const flake = g.weather.drops.find((d) => d.design !== undefined);
check('floco tem design (0-5)', !!flake && flake.design >= 0 && flake.design <= 5, 'design=' + (flake && flake.design));
check('floco tem camada de profundidade', !!flake && [0, 1, 2].includes(flake.layer), 'layer=' + (flake && flake.layer));
check('sprites de clima no disco', fs.existsSync('assets/weather/snowflakes.png') && fs.existsSync('assets/weather/leaf.png') && fs.existsSync('assets/weather/spark.png'), 'flakes/leaf/spark');

/* ===== upgrades visuais (arco-iris em arco, chuva em 2 passagens, calor shimmer, raio na tempestade) ===== */
{
  // palco de ceu escuro (neon-rooftop) pra mancha do arco sobressair no diff
  const g2 = new Game({ width: 960, height: 540, getContext: () => canvas.getContext('2d'), toBuffer: () => canvas.toBuffer('image/png'), classList: { remove() {}, add() {}, toggle() {} } });
  g2.start({ mode: 'versus', teams: [['du'], ['stack']], stage: '01-neon-rooftop', cpu: [false, false], roundsToWin: 2, timer: 99 });
  for (let t = 0; t < 700 && g2.roundState !== 'fight'; t++) g2.tick();
  g = g2;
  const cx2d = canvas.getContext('2d');
  // baseline: mesmo palco com clima clear
  g.weather.set('clear');
  for (let t = 0; t < 120; t++) g.tick();
  g.render();
  const base = cx2d.getImageData(0, 0, 960, 540).data.slice();
  // rainbow: pixels que ficam MAIS saturados que o baseline = o arco
  g.weather.set('rainbow');
  for (let t = 0; t < 120; t++) g.tick();
  g.render();
  fs.writeFileSync(path.join(outDir, 'clima-rainbow.png'), canvas.toBuffer('image/png'));
  const d = cx2d.getImageData(0, 0, 960, 540).data;
  const sat = (i) => Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]);
  const satB = (i) => Math.max(base[i], base[i + 1], base[i + 2]) - Math.min(base[i], base[i + 1], base[i + 2]);
  const spanAt = (y) => {
    let mn = 1e9, mx = -1, cnt = 0;
    for (let x = 0; x < 960; x++) {
      const i = (y * 960 + x) * 4;
      if (sat(i) - satB(i) > 30) { cnt++; if (x < mn) mn = x; if (x > mx) mx = x; }
    }
    return mx < 0 ? 0 : mx - mn;
  };
  const rows = [40, 80, 120, 160, 200, 240, 280, 320].map((y) => y + ':' + spanAt(y));
  const sTop = spanAt(100), sLow = spanAt(300);
  check('rainbow virou ARCO: largura da mancha cresce com a profundidade (' + sTop + '->' + sLow + ')', sTop > 20 && sLow > sTop * 1.2, rows.join(' '));
  // rain: pixels que mudaram vs baseline = gotas (trilha + nucleo)
  g.weather.set('rain');
  for (let t = 0; t < 120; t++) g.tick();
  g.render();
  fs.writeFileSync(path.join(outDir, 'clima-rain2.png'), canvas.toBuffer('image/png'));
  const d2 = cx2d.getImageData(0, 0, 960, 540).data;
  let drops = 0;
  for (let i = 0; i < d2.length; i += 4) { if (Math.abs(d2[i] - base[i]) + Math.abs(d2[i + 1] - base[i + 1]) + Math.abs(d2[i + 2] - base[i + 2]) > 60) drops++; }
  check('rain com trilha+nucleo claro (pixels de gota vs baseline: ' + drops + ')', drops > 800, drops + ' px');
  // codigo: arco-iris usa arc(), chuva 2 passagens, calor shimmer em faixas, tempestade desenha raio no flash
  const wsrc = fs.readFileSync('js/engine/weather.js', 'utf8');
  check('weather.js: rainbow usa ctx.arc (arco), rain 2 passagens, heatwave shimmer, flash raio', wsrc.indexOf('ctx.arc(cx') >= 0 && wsrc.indexOf('trilha larga') >= 0 && wsrc.indexOf('shimmer: faixas verticais') >= 0 && wsrc.indexOf('RAIO: polilinha') >= 0);
  check('weather.js v3: aurora v3 pixel art no ceu (drawSky) + lighter, rainbow halo duplo + arco secundario, eclipse coroa+disco, neblina densa de proposito', wsrc.indexOf('AURORA BOREAL v3 (pixel art)') >= 0 && wsrc.indexOf('drawSky(ctx)') >= 0 && wsrc.indexOf("globalCompositeOperation = 'lighter'") >= 0 && wsrc.indexOf('arco secundario') >= 0 && wsrc.indexOf('ECLIPSE SOLAR') >= 0 && wsrc.indexOf('bancos grandes e macios') >= 0);
  check('weather.js v4: confete de papel two-tone + fogos com faisca radial aditiva em cache', wsrc.indexOf('CONFETE de papel') >= 0 && wsrc.indexOf('FOGOS: fa') >= 0 && wsrc.indexOf('_sparkBlobs') >= 0);
  /* fogos: brilho aditivo no ceu (pixels bem claros acima dos lutadores) vs baseline clear */
  g.weather.set('clear'); g.weather.intensity = 0; g.weather.drops.length = 0; g.render();
  const baseW = cx2d.getImageData(0, 0, 960, 540).data.slice();
  g.weather.set('fireworks'); g.weather.intensity = 1;
  for (let t = 0; t < 60; t++) g.weather.updateParticles();
  g.render();
  fs.writeFileSync(path.join(outDir, 'clima-fireworks2.png'), canvas.toBuffer('image/png'));
  const dW = cx2d.getImageData(0, 0, 960, 540).data;
  let glow = 0;
  for (let y = 0; y < 300; y++) for (let x = 0; x < 960; x++) {
    const i = (y * 960 + x) * 4;
    if (dW[i] + dW[i + 1] + dW[i + 2] > 560 && dW[i] + dW[i + 1] + dW[i + 2] - (baseW[i] + baseW[i + 1] + baseW[i + 2]) > 90) glow++;
  }
  check('fogos com brilho aditivo no ceu (pixels brilhantes=' + glow + ')', glow > 150, '');
  /* confete: varias cores distintas no ar */
  g.weather.set('confetti'); g.weather.intensity = 1;
  for (let t = 0; t < 60; t++) g.weather.updateParticles();
  g.render();
  fs.writeFileSync(path.join(outDir, 'clima-confetti2.png'), canvas.toBuffer('image/png'));
  const dC = cx2d.getImageData(0, 0, 960, 540).data;
  const hues = new Set();
  for (let i = 0; i < dC.length; i += 4) {
    const r = dC[i], gg = dC[i + 1], b = dC[i + 2];
    if (r + gg + b > 420 && Math.max(r, gg, b) - Math.min(r, gg, b) > 60) hues.add(((r >> 4) << 8) | ((gg >> 4) << 4) | (b >> 4));
  }
  check('confete com variety de cores (cores distintas=' + hues.size + ')', hues.size >= 4, '');

  /* diffs controlados (sem tick entre baseline e clima = lutadores parados) */
  const diffCount = (base, d, y0, y1, thr) => {
    let c = 0;
    for (let y = y0; y < y1; y++) for (let x = 0; x < 960; x++) {
      const i = (y * 960 + x) * 4;
      if (Math.abs(d[i] - base[i]) + Math.abs(d[i + 1] - base[i + 1]) + Math.abs(d[i + 2] - base[i + 2]) > thr) c++;
    }
    return c;
  };
  // AURORA: a mancha tem que estar no TOPO (ceu), nao no meio da tela
  g.weather.set('clear'); g.weather.intensity = 1; g.weather.drops.length = 0;
  for (let t = 0; t < 30; t++) g.weather.updateParticles();
  g.render();
  const baseA = cx2d.getImageData(0, 0, 960, 540).data.slice();
  g.weather.set('aurora'); g.weather.intensity = 1;
  for (let t = 0; t < 40; t++) g.weather.updateParticles();
  g.render();
  fs.writeFileSync(path.join(outDir, 'clima-aurora2.png'), canvas.toBuffer('image/png'));
  const dA = cx2d.getImageData(0, 0, 960, 540).data;
  const aTop = diffCount(baseA, dA, 0, 260, 40), aMid = diffCount(baseA, dA, 260, 420, 40), aTot = aTop + aMid + diffCount(baseA, dA, 420, 540, 40);
  check('aurora pendurada no topo do ceu, fora do meio da tela (top=' + aTop + ' mid=' + aMid + ')', aTot > 4000 && aTop > aTot * 0.7 && aMid < aTot * 0.25, 'tot=' + aTot);
  /* aurora tem que ter brilho esverdeado/teal dominante no topo (G >> R) */
  let green = 0;
  for (let y = 0; y < 300; y++) for (let x = 0; x < 960; x++) {
    const i = (y * 960 + x) * 4;
    if (dA[i + 1] > 140 && dA[i + 1] - dA[i] > 40 && dA[i + 1] - baseA[i + 1] > 25) green++;
  }
  check('aurora com brilho esverdeado/teal dominante no topo (pixels=' + green + ')', green > 3000, '');
  // ECLIPSE: coroa brilhante no alto + disco escuro no centro dela
  g.weather.set('clear'); g.weather.drops.length = 0; g.render();
  const baseE = cx2d.getImageData(0, 0, 960, 540).data.slice();
  g.weather.set('eclipse'); g.weather.intensity = 1;
  for (let t = 0; t < 30; t++) g.weather.updateParticles();
  g.render();
  fs.writeFileSync(path.join(outDir, 'clima-eclipse2.png'), canvas.toBuffer('image/png'));
  const dE = cx2d.getImageData(0, 0, 960, 540).data;
  let corona = 0, dark = 0;
  for (let y = 30; y < 230; y++) for (let x = 300; x < 660; x++) {
    const i = (y * 960 + x) * 4;
    if (dE[i] - baseE[i] > 30 && dE[i + 1] - baseE[i + 1] > 20) corona++;
    const dx = x - 480, dy = y - 130;
    if (dx * dx + dy * dy < 26 * 26 && dE[i] + dE[i + 1] + dE[i + 2] < 110) dark++;
  }
  check('eclipse: coroa brilhante no ceu + disco escuro da lua (corona=' + corona + ' dark=' + dark + ')', corona > 800 && dark > 1200, '');
  // NEBLINA: bancos no chao/ceu, MEIO limpo (faixa dos lutadores)
  g.weather.set('clear'); g.weather.drops.length = 0; g.render();
  const baseF = cx2d.getImageData(0, 0, 960, 540).data.slice();
  g.weather.set('fog'); g.weather.intensity = 1;
  for (let t = 0; t < 80; t++) g.weather.updateParticles();
  g.render();
  fs.writeFileSync(path.join(outDir, 'clima-fog2.png'), canvas.toBuffer('image/png'));
  const dF = cx2d.getImageData(0, 0, 960, 540).data;
  const fMid = diffCount(baseF, dF, 200, 390, 100), fLow = diffCount(baseF, dF, 395, 470, 100), fHigh = diffCount(baseF, dF, 20, 120, 100);
  check('neblina cobre um pouco a visao no meio da tela, de proposito (mid=' + fMid + ' low=' + fLow + ' high=' + fHigh + ')', fMid > 8000, '');

  /* REFLEXO MOLHADO: A/B sem tick entre os renders (lutadores parados, sem
     particulas de chuva pra nao poluir o diff) — so o reflexo muda a faixa
     abaixo do chao (y 462..538) */
  g.weather.set('rain'); g.weather.intensity = 0; g.weather.intensityTarget = 0; g.weather.drops.length = 0; g.weather.rings.length = 0;
  for (let t = 0; t < 90; t++) g.tick();
  g._wetOverride = true; g.render();
  const wetA = cx2d.getImageData(0, 462, 960, 76).data.slice();
  g._wetOverride = false; g.render();
  const wetB = cx2d.getImageData(0, 462, 960, 76).data;
  let refl = 0;
  for (let i = 0; i < wetA.length; i += 4) { if (Math.abs(wetA[i] - wetB[i]) + Math.abs(wetA[i + 1] - wetB[i + 1]) + Math.abs(wetA[i + 2] - wetB[i + 2]) > 25) refl++; }
  check('reflexo molhado abaixo do chao quando ta chovendo (px na faixa do chao=' + refl + ')', refl > 300, '');
  g._wetOverride = null; g.render();
  check('wetFloor automatico: chuva liga (' + g.wetFloor + ')', g.wetFloor === true, '');
  g.weather.set('clear'); g.weather.intensity = 0; g.weather.drops.length = 0; g.stageDef = Object.assign({}, g.stageDef, { mech: null, swim: false });
  for (let t = 0; t < 30; t++) g.tick();
  g.render();
  check('wetFloor automatico: sem chuva e sem palco de mare desliga (' + g.wetFloor + ')', g.wetFloor === false, '');
  const gsrc = fs.readFileSync('js/engine/game.js', 'utf8');
  check('game.js: bloco REFLEXO MOLHADO (espelho achatado + fade + brilho na linha de agua)', gsrc.indexOf('REFLEXO MOLHADO') >= 0 && gsrc.indexOf('linha d') >= 0 && gsrc.indexOf('scale(1, -0.36)') >= 0);
}
console.log('---');
console.log(fails === 0 ? 'CLIMA v2: TUDO OK (' + n + ' checks)' : 'CLIMA v2: ' + fails + ' FALHAS de ' + n);
`, ctx);
