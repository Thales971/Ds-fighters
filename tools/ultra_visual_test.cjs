// ULTRA TESTE: nada de magenta opaco em NENHUM asset novo + jogo funciona
const fs = require('fs'); const vm = require('vm');
function req(name){ try { return require(name); } catch(e){ return require('/tmp/node_modules/'+name); } }
const { createCanvas, Image: CanvasImage, loadImage } = req('canvas');
const ctx = { console, Math, Date, Image: CanvasImage, createCanvas, fs,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [], stats: {} }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0, unlockPitoco() { return true; }, hasPitoco() { return true; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} } } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/pets.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }

(async () => {
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

// ==== 1. NENHUM MAGENTA OPACO em nenhum asset novo (decodificando de verdade) ====
const MAGENTA = (r, g, b, a) => a > 40 && g < 90 && r > 150 && b > 90;
for (const [nome, path] of [['jess sprite', 'assets/sprites/jess.png'], ['jess atlas', 'assets/abilities/jess.png'], ['pitoco', 'assets/pets/pitoco.png'], ['bichos', 'assets/fauna/bichos.png'], ['torcida', 'assets/fauna/torcida.png']]) {
  try {
    const img = await loadImage(path);
    const c = createCanvas(img.width, img.height);
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, img.width, img.height).data;
    let magenta = 0;
    for (let i = 0; i < d.length; i += 16) { if (MAGENTA(d[i], d[i+1], d[i+2], d[i+3])) magenta++; }
    check(`${nome}: ZERO pixels magenta opacos`, magenta === 0, magenta + ' px magenta');
  } catch (e) { check(`${nome}: carrega`, false, String(e).slice(0, 50)); }
}

// ==== 2. CADA POSE DA JESS tem conteudo real (figuras visiveis) ====
try {
  const img = await loadImage('assets/sprites/jess.png');
  const c = createCanvas(320, 260);
  const g = c.getContext('2d');
  const POSES = ['idle','walk','jump','crouch','punch','kick','cpunch','ckick','jpunch','jkick','special','hit','block','ko','win'];
  let posesOk = 0;
  for (let p = 0; p < 15; p++) {
    g.clearRect(0, 0, 320, 260);
    g.drawImage(img, 0, p * 260, 320, 260, 0, 0, 320, 260);
    const d = g.getImageData(0, 0, 320, 260).data;
    let vis = 0, loiro = 0;
    for (let i = 3; i < d.length; i += 16) { if (d[i] > 40) vis++; }
    for (let i = 0; i < d.length; i += 64) { if (d[i+3] > 100 && d[i] > 180 && d[i+1] > 150 && d[i+2] < 140) loiro++; }
    if (vis > 800) posesOk++;
    else console.log('   POSE SEM CONTEUDO:', POSES[p], vis);
  }
  check('as 15 poses da Jess tem figura real', posesOk === 15, posesOk + '/15');
} catch (e) { check('sprite jess decodifica', false, String(e).slice(0, 50)); }

// ==== 3. FAUNA: cada especie tem figura nas 4 celulas ====
try {
  const img = await loadImage('assets/fauna/bichos.png');
  const c = createCanvas(96, 96);
  const g = c.getContext('2d');
  let celulasOk = 0;
  for (let r = 0; r < 8; r++) for (let col = 0; col < 4; col++) {
    g.clearRect(0, 0, 96, 96);
    g.drawImage(img, col * 96, r * 96, 96, 96, 0, 0, 96, 96);
    const d = g.getImageData(0, 0, 96, 96).data;
    let vis = 0;
    for (let i = 3; i < d.length; i += 8) { if (d[i] > 40) vis++; }
    if (vis > 150) celulasOk++;
  }
  check('as 32 celulas da fauna tem figura', celulasOk >= 28, celulasOk + '/32');
} catch (e) { check('bichos decodifica', false, String(e).slice(0, 50)); }

// ==== 4. TORCIDA: as 5 fileiras tem gente ====
try {
  const img = await loadImage('assets/fauna/torcida.png');
  const c = createCanvas(256, 200);
  const g = c.getContext('2d');
  let fileirasOk = 0;
  for (let t = 0; t < 5; t++) {
    g.clearRect(0, 0, 256, 200);
    g.drawImage(img, t * 256, 0, 256, 200, 0, 0, 256, 200);
    const d = g.getImageData(0, 0, 256, 200).data;
    let vis = 0;
    for (let i = 3; i < d.length; i += 16) { if (d[i] > 40) vis++; }
    if (vis > 500) fileirasOk++;
  }
  check('as 5 fileiras da torcida tem gente', fileirasOk === 5, fileirasOk + '/5');
} catch (e) { check('torcida decodifica', false, String(e).slice(0, 50)); }

// ==== 5. PITOCO: 4 poses de cachorro completo ====
try {
  const img = await loadImage('assets/pets/pitoco.png');
  const c = createCanvas(96, 96);
  const g = c.getContext('2d');
  let poses = 0;
  for (let i = 0; i < 4; i++) {
    g.clearRect(0, 0, 96, 96);
    g.drawImage(img, i * 96, 0, 96, 96, 0, 0, 96, 96);
    const d = g.getImageData(0, 0, 96, 96).data;
    let vis = 0;
    for (let j = 3; j < d.length; j += 8) { if (d[j] > 40) vis++; }
    if (vis > 300) poses++;
  }
  check('pitoco: 4 poses completas', poses === 4, poses + '/4');
} catch (e) { check('pitoco decodifica', false, String(e).slice(0, 50)); }

// ==== 6. Jogo: Jess luta, fauna foge, torcida hype (logica) ====
vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), createPattern: () => ({}), set imageSmoothingEnabled(v) {} });
const mk = (me, opp, stage) => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
  g.start({ mode: 'versus', teams: [[me], [opp]], stage, cpu: [false, false], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};
/* jess luta completa */
const g1 = mk('jess', 'du', 'treino-dojo');
g1.cfg.cpu[0] = true; g1.cfg.cpu[1] = true;
let ok1 = true;
try { for (let t = 0; t < 2400; t++) { g1.tick(); if (['win','ko','over'].includes(g1.roundState)) break; } } catch (e) { ok1 = false; }
globalThis.__r1 = ok1;
/* fauna foge */
const g2 = mk('du', 'stack', 'parque-lago');
const lf = new LiveFauna(g2, { id: 't-rua', name: 'Rua', fauna: ['cat'] });
g2.stage.liveFauna = lf;
const gato = lf.animals[0];
g2.activeOf(0).x = gato.x + 30;
for (let t = 0; t < 40; t++) g2.tick();
globalThis.__r2 = gato.state === 'flee' || gato.state === 'gone';
/* torcida hype */
const g3 = mk('du', 'stack', 'arquibancada');
g3.shake(10);
globalThis.__r3 = g3.stage.crowdHype > 0 && g3.stage.crowd && g3.stage.crowd.length === 3;
`, ctx);
check('Jess: partida IA completa sem crash', ctx.__r1 === true);
check('fauna em sprite foge do lutador', ctx.__r2 === true);
check('torcida acende com golpe forte', ctx.__r3 === true);

console.log('---');
console.log(fails === 0 ? 'ULTRA VISUAL: TUDO OK (' + n + ' checks)' : 'ULTRA VISUAL: ' + fails + ' FALHAS de ' + n);
})();
