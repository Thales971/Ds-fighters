// MAPAS URBANOS (nov/2026): so mapa de RUA tem poca/bueiro/lixo/mato (interior
// e natureza nao), nivel por qualidade, lixo anda com o vento e o dash levanta,
// vapor sai do bueiro, mato deita quando pisa, desenho sem crash em todos os
// palcos x qualidades.
const fs = require('fs'); const vm = require('vm');
function req(name) { return require(name); }
const { createCanvas } = req('canvas');
const { PNG } = req('pngjs');
const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas, fs, PNG,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: (k) => (k === 'quality' ? ctx.__Q || null : null), reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {}, pitocoSeq: [], pitocoKey() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), querySelectorAll: () => [], addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} }, dataset: {} } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/stage-extras.js', 'js/engine/stage-vibe.js', 'js/engine/stage-urban.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
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



// ===== 1. QUEM TEM =====
const RUA = ['cyberpunk', 'rua-centro-noite', 'beco-batman', 'terminal-onibus', 'pos-codigocalipse', 'ouro-preto', 'carnaval-bloco', 'halloween-rua'];
const INTERIOR = ['treino-dojo', 'sesi', 'biblioteca-noturna', 'corredor-datacenter', 'sala-deploy', 'hackerspace', 'cafe-madrugada', 'natal-salao', 'halloween-mansao', 'criancas-loja'];
const NATUREZA = ['parque-lago', 'tijuca', 'lencois', '06-sakura-dojo', '03-underwater-lab'];
const ruaSem = RUA.filter((id) => !mk(id).stage.urbanProfile());
check('mapas de rua tem detalhes urbanos (' + RUA.length + ')', ruaSem.length === 0, ruaSem.join(',') || 'ok');
const intCom = INTERIOR.concat(NATUREZA).filter((id) => STAGES.some((s) => s.id === id) && mk(id).stage.urbanProfile());
check('interior e natureza NAO tem bueiro/poca/lixo', intCom.length === 0, intCom.join(',') || 'ok');
const comUrb = STAGES.filter((s) => mk(s.id).stage.urbanProfile()).length;
check('quantidade de mapas de rua com detalhes (>= 18)', comUrb >= 18, comUrb + ' mapas');

// ===== 2. NIVEL =====
const gQ = mk('cyberpunk');
gQ.quality = 'low'; check('BAIXO: nada', gQ.stage.urbanLevel() === 0);
gQ.quality = 'medium'; check('MEDIO: nivel 2', gQ.stage.urbanLevel() === 2);
gQ.quality = 'high'; check('ALTO: nivel 3 (tudo)', gQ.stage.urbanLevel() === 3);
gQ.perfLevel = 1; check('modo performance 1: so o que e parado (nivel 1)', gQ.stage.urbanLevel() === 1);
gQ.perfLevel = 2; check('modo performance 2: nada', gQ.stage.urbanLevel() === 0);
gQ.perfLevel = 0;

// ===== 3. VIDA: lixo com vento, dash levanta, vapor, mato deita, anel na poca =====
const g = mk('cyberpunk'); g.quality = 'high';
const st = g.stage.urbanInit();
check('cyberpunk tem pocas, bueiro, rachaduras com mato e lixo', st.puddles.length >= 2 && !!st.manhole && st.cracks.length >= 4 && st.weeds.length >= 8 && st.trash.length >= 10,
  'pocas=' + st.puddles.length + ' mato=' + st.weeds.length + ' lixo=' + st.trash.length);
const x0 = st.trash.map((p) => p.x.toFixed(1)).join(',');
g.stage._wind = 3;
for (let t = 0; t < 120; t++) { g.stage.t++; g.stage.urbanUpdate(); }
check('lixo anda com o vento', st.trash.map((p) => p.x.toFixed(1)).join(',') !== x0);
check('vapor sai do bueiro', st.steam.length > 3, st.steam.length + ' nuvens');
const f = g.activeOf(0), alvo = st.trash.find((p) => p.air <= 0) || st.trash[0];
f.x = alvo.x - 10; f.y = 0; f.vx = 8;
g.stage.t++; g.stage.urbanUpdate();
check('dash do lutador levanta o lixo', alvo.air > 0 && alvo.vy < 0, 'air=' + alvo.air + ' vy=' + alvo.vy.toFixed(2));
f.vx = 0;
const w = st.weeds[0];
f.x = w.x - 12;
for (let t = 0; t < 20; t++) { g.stage.t++; g.stage.urbanUpdate(); }
check('mato da rachadura deita quando o lutador pisa', w.bend > 0.08, 'bend=' + w.bend.toFixed(3));
const pd = st.puddles[0];
f.x = pd.x; f.y = 0; f.vx = 4; st.ripples.length = 0;
for (let t = 0; t < 16; t++) { g.stage.t++; g.stage.urbanUpdate(); }
check('pisar na poca faz anel na agua', st.ripples.length > 0, st.ripples.length + ' aneis');

// ===== 4. DESENHO: todos os palcos x 3 qualidades sem crash =====
let errs = 0, ops = 0;
for (const s of STAGES) {
  for (const q of ['low', 'medium', 'high']) {
    try {
      const gg = mk(s.id); gg.quality = q;
      for (let t = 0; t < 20; t++) {
        gg.tick();
        const c = fake2d(); c.canvas = { width: 960, height: 540 }; c.getTransform = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 458 }); c.clip = () => {};
        const fr = c.fillRect; c.fillRect = (...a) => { ops++; return fr.apply(c, a); };
        gg.stage.drawUrbanBack(c); gg.stage.drawUrbanFloor(c, gg.fighters(), gg); gg.stage.drawUrbanFront(c);
      }
    } catch (e) { errs++; if (errs <= 3) console.log('  ERRO ' + s.id + '/' + q + ': ' + e.message.slice(0, 90)); }
  }
}
check('detalhes urbanos desenham em todos os palcos x 3 qualidades sem crash', errs === 0, errs + ' erros');
check('desenham de fato nos mapas de rua (ops > 500)', ops > 500, ops + ' ops');

console.log('---');
console.log(fails === 0 ? 'MAPAS URBANOS: TUDO OK (' + n + ' checks)' : 'MAPAS URBANOS: ' + fails + ' FALHAS de ' + n);
`, ctx);
