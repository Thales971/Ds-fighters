// FPS ILIMITADO + FLUIDEZ EM ALTA TAXA (120/144/240 Hz):
// - opcao "Sem limite" de FPS e a primeira/default nas opcoes (fpsCap=0) + opcao 240
// - sim fixa a 60 Hz (STEP) com acumulador e render por rAF (main.js)
// - interpolacao (alpha) cobre lutadores, projeteis, strikes, zonas, pickups E fauna viva
// - halos de luz cacheados (nao recria gradiente por frame -> render barato em 240 Hz)
// - torcida faz barulho no hype (sfx crowd, com throttle)
const fs = require('fs'); const vm = require('vm');
function req(name){ try { return require(name); } catch(e){ return require('/tmp/node_modules/'+name); } }
const { createCanvas } = req('canvas');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

// ===== 1. opcoes de FPS no HTML =====
const html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/data-set="fpsCap"[^>]*>([^<]*(?:<option[^>]*>[^<]*<\/option>)+)/);
const sel = html.match(/<select data-set="fpsCap"[^>]*>([\s\S]*?)<\/select>/);
check('select de limite de FPS existe com "Sem limite" como primeira opcao (default = ilimitado)', !!sel && /value="0"[^>]*>Sem limite/.test(sel[1]) && sel[1].indexOf('value="0"') < sel[1].indexOf('value="60"'), sel ? sel[1].replace(/\s+/g, ' ').slice(0, 120) : 'sem select');
check('tem opcao 240 alem de 60/120/144', !!sel && /value="240"/.test(sel[1]) && /value="144"/.test(sel[1]) && /value="120"/.test(sel[1]) && /value="60"/.test(sel[1]));
check('mostrar FPS existe (showFps)', /data-set="showFps"/.test(html));

// ===== 2. loop principal: sim fixa 60 Hz + render na taxa do monitor =====
const mainSrc = fs.readFileSync('js/main.js', 'utf8');
check('main.js: STEP = 1000/60 com acumulador (sim fixa 60 Hz, deterministica)', /STEP = 1000 \/ 60/.test(mainSrc) && /acc \+=/.test(mainSrc) && /while \(acc >= STEP/.test(mainSrc));
check('main.js: render chama game.render(alpha) com interpolacao e respeita fpsCap', /game\.render\(Math\.max\(0, Math\.min\(1, acc \/ STEP\)\)\)/.test(mainSrc) && /fpsCap/.test(mainSrc));
check('main.js: sem fpsCap (0) renderiza TODO rAF = taxa do monitor (ilimitado)', /if \(!cap \|\| now - lastDraw >= 1000 \/ cap - 1\)/.test(mainSrc));

// ===== 3. interpolacao cobre todas as entidades moveis =====
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
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), createPattern: () => ({}), set imageSmoothingEnabled(v) {}, set globalAlpha(v) {}, set globalCompositeOperation(v) {}, set fillStyle(v) {}, set strokeStyle(v) {}, set font(v) {}, set textAlign(v) {}, set lineWidth(v) {}, set filter(v) {} });
const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } });
g.start({ mode: 'versus', teams: [['du'], ['stack']], stage: 'parque-lago', cpu: [false, false], roundsToWin: 1, timer: 99 });
for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
/* injeta entidades moveis de cada tipo e ve se o lerp as cobre no render(alpha) */
g.strikes.push({ x: 100, y: 0, _px: 100, _py: 0, draw() {} });
g.zones.push({ x: 200, y: 0, _px: 200, _py: 0, draw() {} });
g.pickups.push({ x: 300, y: -50, _px: 300, _py: -50, draw() {} });
g.capturePrev();
g.strikes[0].x = 160; g.zones[0].x = 260; g.pickups[0].x = 360;
const f = g.activeOf(0); f._px = 400; f._py = 0; f.x = 460; f.y = 0;
const lf = g.stage.liveFauna; const a0 = lf.animals[0]; a0._px = 500; a0._py = 100; a0.x = 560; a0.y = 100;
const seen = {};
const origRS = g.renderScene.bind(g);
g.renderScene = (ctx) => { seen.f = f.x; seen.s = g.strikes[0].x; seen.z = g.zones[0].x; seen.p = g.pickups[0].x; seen.a = a0.x; origRS(ctx); };
g.render(0.5);
JSON.stringify({ f: seen.f, s: seen.s, z: seen.z, p: seen.p, a: seen.a, afterF: f.x, afterS: g.strikes[0].x });
`, ctx);
const R = JSON.parse(r);
check('render(0.5) interpola LUTADOR (400->460 vira 430 no meio do frame)', R.f === 430, 'f=' + R.f);
check('render(0.5) interpola STRIKE (100->160 vira 130)', R.s === 130, 's=' + R.s);
check('render(0.5) interpola ZONA (200->260 vira 230)', R.z === 230, 'z=' + R.z);
check('render(0.5) interpola PICKUP (300->360 vira 330)', R.p === 330, 'p=' + R.p);
check('render(0.5) interpola FAUNA viva (500->560 vira 530)', R.a === 530, 'a=' + R.a);
check('depois do render as posicoes voltam ao valor real (lerp so dentro do frame)', R.afterF === 460 && R.afterS === 160, R.afterF + '/' + R.afterS);

// ===== 4. halo de luz cacheado: 2o frame nao recria gradiente =====
const r2 = vm.runInContext(`
const g2 = new Game({ width: 960, height: 540, getContext: () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), set imageSmoothingEnabled(v) {} }), classList: { toggle() {}, add() {}, remove() {} } });
g2.start({ mode: 'versus', teams: [['du'], ['stack']], stage: 'circo', cpu: [false, false], roundsToWin: 1, timer: 99 });
for (let t = 0; t < 700 && g2.roundState !== 'fight'; t++) g2.tick();
/* conta createRadialGradient durante drawBack: 1a cria cache (fora do ctx), 2a deve ser 0 */
let rad = 0, draws = 0;
const rec = new Proxy({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, drawImage() { draws++; }, translate() {}, scale() {}, rotate() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }) }, {
  get(t, k) { if (k === 'createRadialGradient') return () => { rad++; return { addColorStop() {} }; }; return k in t ? t[k] : undefined; },
  set(t, k, v) { t[k] = v; return true; },
});
g2.stage.drawBack(rec, 0, 0);
const rad1 = rad, dr1 = draws;
g2.stage.drawBack(rec, 0, 0);
JSON.stringify({ rad1, rad2: rad, dr1, dr2: draws, lights: g2.stage.lights.length, cached: g2.stage.lights.filter((L) => L._halo).length });
`, ctx);
const L = JSON.parse(r2);
check('drawLights cacheia o halo em offscreen (todas as luzes do mapa com _halo; postes removidos)', L.cached === L.lights && L.lights >= 2, L.cached + '/' + L.lights);
check('2a drawBack NAO recria gradiente radial (radial=0) e usa drawImage (leve p/ 240 Hz)', L.rad2 === L.rad1 && L.dr2 > L.dr1, 'rad ' + L.rad1 + '->' + L.rad2 + ', drawImage ' + L.dr1 + '->' + L.dr2);

// ===== 5. torcida faz barulho no hype (throttle) =====
const r3 = vm.runInContext(`
const calls = [];
const g3 = new Game({ width: 960, height: 540, getContext: () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }), classList: { toggle() {}, add() {}, remove() {} } });
g3.start({ mode: 'versus', teams: [['du'], ['stack']], stage: 'sesi', cpu: [false, false], roundsToWin: 1, timer: 99 });
for (let t = 0; t < 700 && g3.roundState !== 'fight'; t++) g3.tick();
g3.audio = { play: (s, o) => { if (s === 'crowd') calls.push(s); }, tone() {}, loop() {} };
g3.stage.react(10); g3.stage.react(12); /* dois golpes fortes seguidos: 1 som so (throttle) */
for (let t = 0; t < 120; t++) g3.stage.update(g3.weather);
g3.stage.react(15);
JSON.stringify({ crowdCalls: calls.length, hype: g3.stage.crowdHype });
`, ctx);
const C = JSON.parse(r3);
check("golpe forte no palco com torcida toca sfx 'crowd' (1x com throttle)", C.crowdCalls >= 1 && C.crowdCalls <= 2, C.crowdCalls + ' calls, hype=' + C.hype);

console.log('---');
console.log(fails === 0 ? 'FPS/FLUIDEZ: TUDO OK (' + n + ' checks)' : 'FPS/FLUIDEZ: ' + fails + ' FALHAS de ' + n);
process.exit(fails ? 1 : 0);
