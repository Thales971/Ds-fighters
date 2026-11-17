// LUZ + AMBIENTACAO INTENSIVOS: sombra no chao (some no ar), halo de status
// (overclock/astra/trans/phoenix/aura) com radial+lighter, filtros de status
// (chill/shock), vignheta do palco (cacheada), faíscas com glow+gravidade,
// particulas de ambiente do palco (ember/petal/bubble/neon/glitch/code/mote/
// sparkd) com teto, e drama/tensao de audio.
const fs = require('fs'); const vm = require('vm');
function req(name){ try { return require(name); } catch(e){ return require('/tmp/node_modules/'+name); } }
const { createCanvas } = req('canvas');
const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas, fs,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({ _tension: null, setTension(v) { this._tension = v; } }, { get(t, k) { if (k in t) return t[k]; return () => {}; } }),
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
/* ctx gravador: conta drawImage/radial/lighter/ellipse/filter/gradientes */
const mkRec = () => {
  const r = { drawImage: 0, radial: 0, lighter: 0, ellipse: 0, filters: [], linear: 0, fillRect: 0, arc: 0 };
  const base = { canvas: null, save() {}, restore() {}, clearRect() {}, strokeRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, translate() {}, scale() {}, rotate() {}, setTransform() {}, measureText: () => ({ width: 10 }), createPattern: () => ({}) };
  return [new Proxy(base, {
    get(t, k) {
      if (k === 'drawImage') return () => { r.drawImage++; };
      if (k === 'ellipse') return () => { r.ellipse++; };
      if (k === 'fillRect') return () => { r.fillRect++; };
      if (k === 'arc') return () => { r.arc++; };
      if (k === 'createRadialGradient') return () => { r.radial++; return { addColorStop() {} }; };
      if (k === 'createLinearGradient') return () => { r.linear++; return { addColorStop() {} }; };
      if (k === 'filter') return undefined;
      if (k in t) return t[k];
      return undefined;
    },
    set(t, k, v) {
      if (k === 'globalCompositeOperation' && v === 'lighter') r.lighter++;
      if (k === 'filter' && v && v !== 'none') r.filters.push(v);
      t[k] = v; return true;
    },
  }), r];
};
const mk = (stageId) => {
  const rec = mkRec(); /* recorder persistente: o Game chama getContext a cada render */
  const g = new Game({ width: 960, height: 540, getContext: () => rec[0], _rec: rec[1], classList: { toggle() {}, add() {}, remove() {} } });
  g.start({ mode: 'versus', teams: [['du'], ['du']], stage: stageId || 'treino-dojo', cpu: [true, true], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};

// ===== 1. SOMBRA no chao some no ar =====
const g1 = mk('treino-dojo');
const f1 = g1.activeOf(0);
f1.y = 0; f1.state = 'idle';
let r1 = mkRec(); f1.draw(r1[0]);
check('no chao: sombra desenhada (arco + gradiente radial)', r1[1].arc > 0 && r1[1].radial > 0, 'arc=' + r1[1].arc + ' radial=' + r1[1].radial);
f1.y = -260; /* bem alto */
let r2 = mkRec(); f1.draw(r2[0]);
check('no ar (y=-260): sombra ainda desenhada (arco + radial)', r2[1].arc > 0 && r2[1].radial > 0, 'arc=' + r2[1].arc);
// compara alpha: intercepta addColorStop do radial pra pegar o alpha da sombra
let alphaChao = 0, alphaAr = 0;
const mkRecAlpha = (store) => new Proxy({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createPattern: () => ({}) }, {
  get(t, k) {
    if (k === 'createRadialGradient') return (...a) => ({ addColorStop: (o, c) => { const m = /rgba\\(0,0,0,([\\d.]+)\\)/.exec(c); if (m && parseFloat(m[1]) > 0.05) store.v = parseFloat(m[1]); } });
    if (k in t) return t[k];
    return undefined;
  },
  set(t, k, v) { t[k] = v; return true; },
});
f1.y = 0; const sa = { v: 0 }; f1.draw(mkRecAlpha(sa));
f1.y = -260; const sb = { v: 0 }; f1.draw(mkRecAlpha(sb));
check('sombra mais forte no chao que no ar (alpha ' + sa.v.toFixed(2) + ' > ' + sb.v.toFixed(2) + ')', sa.v > sb.v, 'chao=' + sa.v + ' ar=' + sb.v);
f1.y = 0;

// ===== 2. HALO de status (radial + lighter) =====
for (const [st, nome] of [['overclock', 'overclock'], ['astra', 'astra'], ['trans', 'trans'], ['phoenix', 'phoenix']]) {
  f1.status = {}; f1.addStatus(st, 600); f1.aura = st === 'aura' ? { color: '#c77dff' } : f1.aura;
  const rr = mkRec(); f1.draw(rr[0]);
  check('halo de status ' + nome + ': radial gradient + composite lighter', rr[1].radial > 0 && rr[1].lighter > 0, 'radial=' + rr[1].radial + ' lighter=' + rr[1].lighter);
}
f1.status = {}; f1.addStatus('aura', 600); f1.aura = { color: '#c77dff', id: 'x' };
{
  const rr = mkRec(); f1.draw(rr[0]);
  check('halo de aura (cor do poder): radial + lighter', rr[1].radial > 0 && rr[1].lighter > 0, 'radial=' + rr[1].radial);
}
f1.status = {}; f1.aura = null;
{
  const rr = mkRec(); f1.draw(rr[0]);
  check('sem status: SEM halo (radial so da sombra)', rr[1].radial === 1, 'radial=' + rr[1].radial);
}
// halo desligado com reduced motion
const gR = mk('treino-dojo'); gR.reduced = true;
const fR = gR.activeOf(0); fR.status = {}; fR.addStatus('overclock', 600);
const rrR = mkRec(); fR.draw(rrR[0]);
check('reduced motion: halo de status DESLIGADO', rrR[1].lighter === 0, 'lighter=' + rrR[1].lighter);
gR.reduced = false;

// ===== 3. Filtros de status (chill/shock) =====
f1.status = {}; f1.addStatus('chill', 600);
let rf = mkRec(); f1.draw(rf[0]);
check('chill aplica filtro no sprite (saturate/hue-rotate)', rf[1].filters.some((f) => /saturate/.test(f)), rf[1].filters.join('|'));
f1.status = {}; f1.addStatus('shock', 600); f1.frame = 0; /* frame%6<2 -> filtro liga */
let rf2 = mkRec(); f1.draw(rf2[0]);
check('shock aplica filtro piscando (brightness)', rf2[1].filters.some((f) => /brightness\\(1\\.8\\)/.test(f)), rf2[1].filters.join('|'));
f1.status = {};

// ===== 4. Vignette do palco (canvas cacheado + drawImage no render) =====
const gV = mk('treino-dojo');
const recV = gV.canvas._rec;
recV.drawImage = 0;
gV.render();
check('render desenha a vignette (drawImage do canvas cacheado)', recV.drawImage > 0 && gV.stage.vignette != null, 'drawImage=' + recV.drawImage + ' vignette=' + (gV.stage.vignette ? 'cacheado' : 'null'));
const v1 = gV.stage.vignette;
gV.render();
check('vignette reutiliza o mesmo canvas (cache, nao recria)', gV.stage.vignette === v1);

// ===== 5. Faíscas com glow + gravidade =====
const gS = mk('treino-dojo');
gS.sparks = [];
gS.spark(480, 200, '#ffd27d', { count: 10, speed: 2, glow: true });
check('spark() com count cria 10 faíscas', gS.sparks.length === 10, gS.sparks.length + '');
check('faíscas com opts.glow ficam glow=true', gS.sparks.every((s) => s.glow === true));
const vy0 = gS.sparks[0].vy;
for (let t = 0; t < 10; t++) gS.tick();
check('gravidade nas faíscas (vy aumenta)', gS.sparks.length === 0 || gS.sparks[0].vy > vy0, 'vy ' + vy0.toFixed(2) + ' -> ' + (gS.sparks[0] ? gS.sparks[0].vy.toFixed(2) : 'morreu'));
const recS = gS.canvas._rec;
recS.lighter = 0;
gS.spark(480, 200, '#7df9ff', { count: 5, speed: 1, glow: true });
gS.render();
check('render das faíscas usa composite lighter (glow aditivo)', recS.lighter > 0, 'lighter=' + recS.lighter);

// ===== 6. Partículas de AMBIENTE do palco (teto + nascem + nao crash) =====
const defAmb = { id: 'teste-amb', image: null, weather: ['clear'], embers: true, petals: true, bubbles: true, fireflies: true, neon: true, glitch: true, code: true, motes: true, sparks: true, flora: ['grass'] };
const gA = mk('treino-dojo');
gA.stage.def = Object.assign({}, gA.stage.def, defAmb);
gA.stage.ambient = [];
for (let t = 0; t < 600; t++) { gA.stage.update(gA.weather); }
const kindsAmb = new Set(gA.stage.ambient.map((p) => p.k));
check('ambiente nasce particulas de varios tipos', kindsAmb.size >= 5, [...kindsAmb].join(','));
check('ambiente respeita o teto (~110)', gA.stage.ambient.length <= 115, gA.stage.ambient.length + ' particulas');
let ambErr = null;
try { const recA = mkRec(); for (let t = 0; t < 300; t++) { gA.stage.update(gA.weather); gA.stage.drawBack(recA[0], 0, 0); } } catch (e) { ambErr = e.message; }
check('ambiente: 300 updates + drawBack sem crash', ambErr === null, ambErr || '');
// reduced motion: teto menor
const gAr = mk('treino-dojo');
gAr.stage.def = Object.assign({}, gAr.stage.def, defAmb);
gAr.stage.ambient = [];
gAr.reduced = true; gAr.stage.reducedFlag = true;
for (let t = 0; t < 600; t++) gAr.stage.update(gAr.weather);
check('reduced motion: teto de particulas menor (<=40)', gAr.stage.ambient.length <= 45, gAr.stage.ambient.length + '');

// ===== 7. Drama/tensao de audio (HP baixo ou round final liga) =====
const gD = mk('treino-dojo');
gD.cfg.roundsToWin = 3; gD.round = 0; gD.roundState = 'fight'; /* garante que nao e round final */
const fD = gD.activeOf(0);
fD.hp = fD.maxHp * 0.2; /* <=30% -> drama */
AudioSys._tension = null;
for (let t = 0; t < 5; t++) { gD.tick(); gD.render(); }
check('HP <=30% liga drama: AudioSys.setTension(true)', AudioSys._tension === true, 'tension=' + AudioSys._tension);
gD.fighters().forEach((f) => { f.hp = f.maxHp; f.addStatus('invuln', 9999); }); /* ninguem low, round atual */
AudioSys._tension = null;
for (let t = 0; t < 3; t++) gD.render();
check('HP alto desliga drama: setTension(false) e _drama=false', AudioSys._tension === false && gD._drama === false, 'tension=' + AudioSys._tension + ' _drama=' + gD._drama);

// ===== 8. Palcos com neon/glitch/code reais 600 frames sem crash =====
let neonErrs = 0;
for (const st of ['04-neon-city-exe', '05-fight-exe', '01-centro-de-dados', '02-chuva-de-codigo', '03-laboratorio-95']) {
  try { const g = mk(st); const rec = mkRec(); for (let t = 0; t < 600; t++) { g.tick(); g.render(); } } catch (e) { neonErrs++; console.log('  ERRO ' + st + ': ' + e.message.slice(0, 70)); }
}
check('palcos neon/glitch/codigo/sparks: 600 frames sem crash', neonErrs === 0, neonErrs + ' erros');

console.log('---');
console.log(fails === 0 ? 'LUZ/AMB: TUDO OK (' + n + ' checks)' : 'LUZ/AMB: ' + fails + ' FALHAS de ' + n);
`, ctx);
