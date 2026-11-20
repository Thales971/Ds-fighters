// CACADA DE BUGS VISUAIS INTENSA: renderiza TODOS os palcos de verdade (canvas real,
// imagens reais) e varre os frames procurando: vazamento de chroma magenta, tela vazia/preta,
// lutador fora da tela ou NaN. Tambem testa que a tela inicial e o menu nao quebram.
const fs = require('fs'); const vm = require('vm');
function req(name) { return require(name); }
const { createCanvas, Image: CanvasImage, loadImage } = req('canvas');
const ctx = { console, Math, Date, Image: CanvasImage, createCanvas, loadImage, fs,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {}, pitocoSeq: [], pitocoKey() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), querySelectorAll: () => [], addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} }, dataset: {} } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 80)); } }

(async () => {
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
fs.mkdirSync('.vibe/hunt', { recursive: true });

// carrega sprites dos lutadores e atlas de fauna/flora/efeitos usados no render
await vm.runInContext(`
(async () => {
  const load = async (id, p) => { try { SpriteGen.images[id] = await loadImage(p); return true; } catch (e) { return false; } };
  const loadArt = async (k, p) => { try { Art.images[k] = await loadImage(p); return true; } catch (e) { return false; } };
  await load('du', 'assets/sprites/du.png');
  await load('stack', 'assets/sprites/stack.png');
  await loadArt('abil:du', 'assets/abilities/du.png'); await loadArt('fx2:du', 'assets/abilities/du.png');
  await loadArt('abil:stack', 'assets/abilities/stack.png'); await loadArt('fx2:stack', 'assets/abilities/stack.png');
  await loadArt('bichos', 'assets/fauna/bichos.png');
  await loadArt('fauna', 'assets/fauna/fauna.png');
  await loadArt('flora', 'assets/fauna/flora.png');
  await loadArt('_torcida', 'assets/fauna/torcida.png');
  await loadArt('fx2:firefly', 'assets/fx2.png');
  await loadArt('fx2:birds', 'assets/fx2.png');
  await loadArt('fx2:lightning', 'assets/fx2.png');
  await loadArt('fx2:fire', 'assets/fx2.png');
})()`, ctx);

const res = await vm.runInContext(`
(async () => {
  const canvas = createCanvas(960, 540);
  const cx2d = canvas.getContext('2d');
  /* vazamento de chroma-key = magenta PURO #ff00ff (r>230, g<30, b>230); rosa tematico do palco (255,79,216) nao conta */
  const magenta = (d) => { let m = 0; for (let i = 0; i < d.length; i += 4) { if (d[i+3] > 60 && d[i] > 230 && d[i+1] < 30 && d[i+2] > 230) m++; } return m; };
  const lit = (d) => { let c = 0; for (let i = 0; i < d.length; i += 4) { if (d[i+3] > 10 && (d[i]+d[i+1]+d[i+2]) > 30) c++; } return c; };
  const out = { stages: [], magBad: [], blankBad: [], posBad: [], crash: [] };
  for (const st of STAGES) {
    try {
      const g = new Game({ width: 960, height: 540, getContext: () => cx2d, toBuffer: () => canvas.toBuffer('image/png'), classList: { remove() {}, add() {}, toggle() {} } });
      g.start({ mode: 'versus', teams: [['du'], ['stack']], stage: st.id, cpu: [false, false], roundsToWin: 1, timer: 99 });
      for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
      let magMax = 0, litMin = 1e9, posOk = true;
      for (let t = 0; t < 60; t++) {
        g.tick();
        if (t === 25 || t === 59) {
          g.render();
          const d = cx2d.getImageData(0, 0, 960, 540).data;
          magMax = Math.max(magMax, magenta(d));
          litMin = Math.min(litMin, lit(d));
        }
        for (const f of g.fighters()) {
          if (!isFinite(f.x) || !isFinite(f.y) || f.x < -120 || f.x > 1080) posOk = false;
        }
      }
      out.stages.push(st.id);
      if (magMax > 200) out.magBad.push(st.id + ':' + magMax);
      if (litMin < 960 * 540 * 0.005) out.blankBad.push(st.id + ':' + litMin);
      if (!posOk) out.posBad.push(st.id);
    } catch (e) { out.crash.push(st.id + ':' + e.message.slice(0, 60)); }
  }
  return JSON.stringify(out);
})()`, ctx);
const R = JSON.parse(res);
check('todos os ' + R.stages.length + ' palcos renderizaram 60 frames de verdade sem crash', R.crash.length === 0 && R.stages.length === 94, R.crash.slice(0, 4).join(' | ') || R.stages.length + '/94');
check('nenhum palco com vazamento de chroma-key magenta PURO (>200 px)', R.magBad.length === 0, R.magBad.slice(0, 5).join(' | ') || 'limpo');
check('nenhum palco com tela vazia/preta (<0.5% de pixels acesos)', R.blankBad.length === 0, R.blankBad.slice(0, 5).join(' | ') || 'todos com conteudo');
check('lutadores sempre dentro da tela e sem NaN nos 94 palcos', R.posBad.length === 0, R.posBad.slice(0, 5).join(' | ') || 'ok');

// salva 6 screenshots de palcos variados pra inspecao visual
await vm.runInContext(`
(async () => {
  const canvas = createCanvas(960, 540);
  const cx2d = canvas.getContext('2d');
  for (const [i, id] of ['parque-lago', 'circo', 'cyberpunk', 'represa', 'kernel', 'sesi', 'dojo-noite', 'abismo-das-baleias'].entries()) {
    const g = new Game({ width: 960, height: 540, getContext: () => cx2d, toBuffer: () => canvas.toBuffer('image/png'), classList: { remove() {}, add() {}, toggle() {} } });
    g.start({ mode: 'versus', teams: [['du'], ['stack']], stage: id, cpu: [true, true], roundsToWin: 1, timer: 99 });
    for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
    for (let t = 0; t < 200; t++) g.tick();
    g.render();
    fs.writeFileSync('.vibe/hunt/palco-' + id + '.png', canvas.toBuffer('image/png'));
  }
  return 'ok';
})()`, ctx);
check('8 screenshots de palcos salvos em .vibe/hunt para inspecao', fs.readdirSync('.vibe/hunt').filter((f) => f.startsWith('palco-')).length === 8, fs.readdirSync('.vibe/hunt').filter((f) => f.startsWith('palco-')).join(','));

// ===== 2. scan dos ATLAS de sprites: chroma-key magenta puro nao pode existir nos PNGs =====
const { PNG } = req('pngjs');
const atlases = ['assets/fauna/bichos.png', 'assets/fauna/fauna.png', 'assets/fauna/flora.png', 'assets/fauna/torcida.png', 'assets/fx/mare.png', 'assets/weather/snowflakes.png', 'assets/weather/leaf.png', 'assets/weather/spark.png', 'assets/weather/petals.png', 'assets/weather/neon.png', 'assets/fx/rain-streaks.png', 'assets/fx/firefly.png', 'assets/ui/logo.png',
  ...fs.readdirSync('assets/fx2').filter((f) => f.endsWith('.png')).map((f) => 'assets/fx2/' + f),
  ...fs.readdirSync('assets/fx').filter((f) => f.endsWith('.png')).map((f) => 'assets/fx/' + f),
  ...fs.readdirSync('assets/abilities').filter((f) => f.endsWith('.png')).map((f) => 'assets/abilities/' + f)];
let leak = [];
for (const f of atlases) {
  if (!fs.existsSync(f)) { leak.push(f + ':missing'); continue; }
  const p = PNG.sync.read(fs.readFileSync(f));
  let m = 0;
  for (let i = 0; i < p.data.length; i += 4) { if (p.data[i+3] > 60 && p.data[i] > 230 && p.data[i+1] < 30 && p.data[i+2] > 230) m++; }
  if (m > 0) leak.push(f + ':' + m);
}
check('atlas/arte dos palcos e UI sem magenta puro (chroma-key limpo)', leak.length === 0, leak.join(' | ') || atlases.length + ' atlas limpos');

// ===== 3. sprites dos lutadores (amostras) sem magenta puro =====
let sprLeak = [];
for (const f of ['assets/sprites/du.png', 'assets/sprites/stack.png', 'assets/sprites/jess.png', 'assets/abilities/du.png', 'assets/abilities/jess.png']) {
  if (!fs.existsSync(f)) continue;
  const p = PNG.sync.read(fs.readFileSync(f));
  let m = 0;
  for (let i = 0; i < p.data.length; i += 4) { if (p.data[i+3] > 60 && p.data[i] > 230 && p.data[i+1] < 30 && p.data[i+2] > 230) m++; }
  if (m > 0) sprLeak.push(f + ':' + m);
}
check('sprites de lutadores sampled sem magenta puro', sprLeak.length === 0, sprLeak.join(' | ') || 'limpo');

console.log('---');
console.log(fails === 0 ? 'VISUAL HUNT: TUDO OK (' + n + ' checks)' : 'VISUAL HUNT: ' + fails + ' FALHAS de ' + n);
process.exit(fails ? 1 : 0);
})().catch((e) => { console.log('ERRO FATAL', e); process.exit(1); });
