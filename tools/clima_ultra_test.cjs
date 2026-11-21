// CLIMA ULTRA INTENSIVO: 17 tipos de clima (set direto + rotacao natural),
// particulas com teto, vento/fricção, tempestade com raios, granizo machuca,
// arco-iris cura, neve deixa lento, sprites de clima validos, pools dos 94 palcos
// so com tipos validos, e 94 palcos x 600 frames trocando clima sem crash.
const fs = require('fs'); const vm = require('vm');
function req(name) { return require(name); }
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
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), createPattern: () => ({}), set imageSmoothingEnabled(v) {}, set globalAlpha(v) {}, set globalCompositeOperation(v) {}, set fillStyle(v) {}, set strokeStyle(v) {}, set font(v) {}, set textAlign(v) {}, set lineWidth(v) {}, set filter(v) {} });
const mk = (stageId, timer) => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } });
  g.start({ mode: 'versus', teams: [['du'], ['du']], stage: stageId || 'treino-dojo', cpu: [true, true], roundsToWin: 1, timer: timer || 999 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};

// ===== 1. Pools dos 94 palcos: so tipos validos =====
const TIPOS = Object.keys(WEATHER_INFO);
let ruinsPool = [];
for (const st of STAGES) for (const w of (st.weather || ['clear'])) if (!WEATHER_INFO[w]) ruinsPool.push(st.id + ':' + w);
check('94 palcos: todos os climas dos pools existem em WEATHER_INFO (' + TIPOS.length + ' tipos)', ruinsPool.length === 0, ruinsPool.slice(0, 5).join(' | '));
check('20 tipos de clima definidos (16 + bolhas + 3 exclusivos dos mapas novos)', TIPOS.length === 20 && ['bubbles', 'diaenoite', 'churrasco', 'apagao'].every((k) => TIPOS.includes(k)), TIPOS.join(','));

// ===== 2. Sprites de clima existem e tem o tamanho certo =====
const dims = { 'assets/weather/snowflakes.png': [168, 28], 'assets/weather/leaf.png': [16, 16], 'assets/weather/spark.png': [8, 8], 'assets/weather/petals.png': [42, 14], 'assets/weather/neon.png': [20, 10] };
for (const [f, [w, h]] of Object.entries(dims)) {
  const p = PNG.sync.read(fs.readFileSync(f));
  check(f + ' ' + w + 'x' + h, p.width === w && p.height === h, p.width + 'x' + p.height);
}

// ===== 3. Cada tipo de clima: 600 ticks update+draw sem crash, particulas no teto =====
const COM_PARTICULAS = { rain: 110, storm: 150, snow: 120, wind: 28, aurora: 48, heatwave: 22, fog: 10, darkfog: 12, fireflies: 24, leaves: 34, confetti: 40, fireworks: 18, hail: 32, eclipse: 14, clear: 10 };
let errClima = [];
for (const kind of TIPOS) {
  try {
    const g = mk('treino-dojo');
    g.weather.set(kind);
    for (let t = 0; t < 600; t++) { g.weather.update(true); g.weather.draw(fake2d()); g.tick(); }
    const want = COM_PARTICULAS[kind] || 0;
    /* intensity varia 0.6..1 por set (clear=0 por definicao) — cheque faixa baixa */
    if (kind !== 'clear' && want > 0 && (g.weather.drops.length < Math.floor(want * 0.55) || g.weather.drops.length > want)) errClima.push(kind + ': drops=' + g.weather.drops.length + ' want=' + want);
  } catch (e) { errClima.push(kind + ': ' + e.message.slice(0, 60)); }
}
check('16/16 climas: 600 ticks update+draw sem crash e particulas no teto', errClima.length === 0, errClima.slice(0, 4).join(' | '));

// ===== 4. Vento empurra; chuva/escorregadio; neve lento =====
const gW = mk('treino-dojo');
gW.weather.set('wind');
for (let t = 0; t < 120; t++) gW.weather.update(true);
check('wind: vento nao-zero (empurra lutadores)', Math.abs(gW.weather.wind) > 0.3, 'wind=' + gW.weather.wind.toFixed(2));
gW.weather.set('storm');
let maxWind = 0;
for (let t = 0; t < 600; t++) { gW.weather.update(true); maxWind = Math.max(maxWind, Math.abs(gW.weather.wind)); }
check('storm: vento forte em algum momento (rajada > 0.8) e friccao alta (chao molhado)', gW.weather.friction() > 1 && maxWind > 0.8, 'friction=' + gW.weather.friction() + ' maxWind=' + maxWind.toFixed(2));
gW.weather.set('rain');
check('rain: friccao > 1 (escorregadio)', gW.weather.friction() > 1, '' + gW.weather.friction());
gW.weather.set('clear');
check('clear: friccao base 1 e vento 0', gW.weather.friction() === 1 && gW.weather.wind === 0);
const gSnow = mk('treino-dojo');
const fS = gSnow.activeOf(0);
gSnow.weather.set('clear');
const spdBase = fS.speedMult();
gSnow.weather.set('snow');
for (let t = 0; t < 60; t++) { gSnow.weather.update(true); gSnow.tick(); }
check('snow: velocidade reduzida (~8% mais lento)', fS.speedMult() < spdBase * 0.95, spdBase.toFixed(3) + ' -> ' + fS.speedMult().toFixed(3));

// ===== 5. Tempestade: raio (strike) cai e flash liga =====
const gSt = mk('treino-dojo');
gSt.weather.set('storm');
let hadStrike = 0, hadFlash = 0;
for (let t = 0; t < 1200; t++) { gSt.weather.update(true); if (gSt.strikes.length) hadStrike++; if (gSt.weather.flash > 0) hadFlash++; gSt.tick(); }
check('storm: pelo menos 1 RAIO caiu em 1200 ticks (strike na arena)', hadStrike > 0, hadStrike + ' strikes');
check('storm: flash (clarão) ligou alguma vez', hadFlash > 0, hadFlash + ' frames com flash');

// ===== 6. Granizo machuca quem ta no chao; arco-iris cura =====
const gH = mk('treino-dojo');
gH.weather.set('hail');
const fH = gH.activeOf(0); fH.y = 0; fH.status = {}; fH.addStatus('invuln', 0); fH.hp = fH.maxHp;
for (let t = 0; t < 1200; t++) { gH.weather.update(true); gH.tick(); }
check('hail: granizo lascou dano em quem tava no chao', fH.hp < fH.maxHp, 'hp=' + Math.round(fH.hp) + '/' + fH.maxHp);
const gRb = mk('treino-dojo');
gRb.cfg.cpu = [false, false]; /* ninguem ataca: so o clima cura */
gRb.weather.set('rainbow');
const fR1 = gRb.activeOf(0), fR2 = gRb.activeOf(1);
fR1.addStatus('invuln', 99999); fR2.addStatus('invuln', 99999);
const hpR1 = fR1.maxHp - 50, hpR2 = fR2.maxHp - 80;
fR1.hp = hpR1; fR2.hp = hpR2;
for (let t = 0; t < 600; t++) { gRb.weather.update(true); gRb.tick(); }
check('rainbow: cura lenta nos DOIS lutadores', fR1.hp > hpR1 && fR2.hp > hpR2, Math.round(fR1.hp) + '>' + hpR1 + ' & ' + Math.round(fR2.hp) + '>' + hpR2);

// ===== 7. Rotacao natural de clima num palco com pool variado =====
const gRot = mk('parque-lago', 99999); /* pool: clear, wind, leaves, rainbow; timer longo p/ round nao acabar */
gRot.cfg.cpu = [false, false]; /* ninguem se mata: round dura ate o timer */
gRot.activeOf(0).addStatus('invuln', 999999); gRot.activeOf(1).addStatus('invuln', 999999); /* round nao acaba por KO */
const vistos = new Set([gRot.weather.kind]);
for (let t = 0; t < 12000; t++) { gRot.tick(); vistos.add(gRot.weather.kind); if (vistos.size >= 3) break; }
check('clima ROTACIONA sozinho durante o round (pool variado, >=3 tipos)', vistos.size >= 3, [...vistos].join(','));

// ===== 8. 94 palcos x 600 frames com clima ativo + render, sem crash =====
let errs = 0, okN = 0;
for (const st of STAGES) {
  try { const g = mk(st.id); for (let t = 0; t < 600; t++) { g.tick(); g.render(); } okN++; } catch (e) { errs++; if (errs <= 3) console.log('  ERRO ' + st.id + ': ' + e.message.slice(0, 80)); }
}
check('94/94 palcos: 600 frames tick+render com clima sem crash', errs === 0, okN + ' ok, ' + errs + ' erros');

// ===== 9. reduced motion: menos particulas =====
const gRed = mk('treino-dojo');
gRed.reduced = true;
gRed.weather.set('rain');
for (let t = 0; t < 400; t++) gRed.weather.update(true);
check('reduced motion: chuva com ~35% das gotas', gRed.weather.drops.length <= Math.floor(110 * 0.4) + 1, gRed.weather.drops.length + ' gotas (max normal 110)');

// ===== 10. Intensidade entra/sai SUAVEM (lerp) + palcos monotomos ganharam climas novos =====
const gL = mk('treino-dojo');
gL.weather.set('rain');
check('set(rain): intensityTarget em 0.6..1 e intensity ainda baixo logo apos o set (transicao suave)', gL.weather.intensityTarget >= 0.6 && gL.weather.intensityTarget <= 1 && gL.weather.intensity < 0.3, 'intensity=' + gL.weather.intensity.toFixed(2) + ' target=' + gL.weather.intensityTarget.toFixed(2));
for (let t = 0; t < 500; t++) gL.weather.update(true);
check('500 ticks depois a chuva CHEGA no talo (intensity converge pro target)', Math.abs(gL.weather.intensity - gL.weather.intensityTarget) < 0.02 && gL.weather.drops.length >= Math.floor(110 * 0.55), 'intensity=' + gL.weather.intensity.toFixed(2) + ' gotas=' + gL.weather.drops.length);
gL.weather.set('clear');
for (let t = 0; t < 600; t++) gL.weather.update(true);
check('set(clear): clima DESLIGA devagar (intensity -> 0, sem corte seco)', gL.weather.intensityTarget === 0 && gL.weather.intensity < 0.05, 'intensity=' + gL.weather.intensity.toFixed(3));
const poolsNovos = { 'dojo-noite': ['fireflies', 'eclipse'], 'circo': ['confetti', 'fireworks'], 'pizzaria': ['fireflies'], 'kernel': ['aurora'], '09-orbital-core': ['aurora', 'eclipse', 'fireflies'], 'cyberpunk': ['storm', 'fog'], 'pos-codigocalipse': ['darkfog', 'fireflies'], '02-volcanic-forge': ['heatwave'], 'rust': ['heatwave'], 'corredor-datacenter': ['darkfog'], 'sala-deploy': ['fog'], 'estudio-pixel': ['fireflies'], 'sesi': ['wind', 'rain'], 'sesi-patio': ['leaves'], 'senai-valinhos': ['rain'], 'area-de-trabalho': ['rain', 'fog'] };
let poolBad = [];
for (const id of Object.keys(poolsNovos)) {
  const st = STAGES.find((s) => s.id === id);
  if (!st || !poolsNovos[id].every((w) => (st.weather || []).includes(w))) poolBad.push(id);
}
if (!STAGE_EXTRA['01-centro-de-dados'].weather.includes('darkfog')) poolBad.push('EXTRA:01-centro-de-dados');
check('palcos antes monotonos ganharam climas novos no pool (' + (Object.keys(poolsNovos).length + 1) + ' palcos)', poolBad.length === 0, poolBad.join(',') || 'ok');
let motesBad = [];
for (const st of STAGES) {
  const g = mk(st.id);
  if (!(g.stage.ambient || []).some((p) => p.k === 'mote')) motesBad.push(st.id);
}
check('TODOS os ' + STAGES.length + ' palcos tem motes de poeira nascendo (padrao ligado no engine)', motesBad.length === 0, motesBad.slice(0, 5).join(',') || STAGES.length + '/' + STAGES.length);

console.log('---');
console.log(fails === 0 ? 'CLIMA ULTRA: TUDO OK (' + n + ' checks)' : 'CLIMA ULTRA: ' + fails + ' FALHAS de ' + n);
`, ctx);
