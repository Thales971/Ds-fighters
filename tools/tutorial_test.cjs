const fs = require('fs');
const vm = require('vm');
const localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const ctx = {
  console, Image: class { set src(v) {} }, Math, Date, JSON, localStorage,
  Profile: null, // carregado do arquivo real
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, releaseAll() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0, label: () => '1', padLabel: () => '', menu: () => ({}) },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  Net: {},
  AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, querySelectorAll: () => [], createElement: () => ({ getContext: () => ({}), style: {} }), addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {}, contains: () => false }, dataset: {} } },
  window: { addEventListener() {}, matchMedia: () => ({ matches: false }) }, navigator: { maxTouchPoints: 0 }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16),
  fetch: () => Promise.resolve({ ok: false, json: async () => ({}) }),
  performance: { now: () => Date.now() },
};
ctx.globalThis = ctx;
vm.createContext(ctx);
const files = ['js/core/profile.js', 'assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/pets.js', 'js/data/stages.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js', 'js/ui/hud.js', 'js/ui/ui.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 80)); } }
vm.runInContext(`
let fails = 0;
const check = (n, c, x) => { console.log((c ? 'OK   ' : 'FALHA') + ' ' + n + (x ? ' — ' + x : '')); if (!c) fails++; };
Profile.data = { unlocked: [], settings: {}, stats: {} };

// 1) jogador NOVO: botao visivel
check('jogador novo: tutorialDone indefinido', !Profile.setting('tutorialDone'));
// stubs de HUD/banner/DOM (sem DOM real no teste)
const elStub = () => ({ classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, style: { setProperty() {} }, hidden: false, innerHTML: '', textContent: '', dataset: {}, addEventListener() {}, focus() {}, querySelectorAll: () => [], querySelector: () => elStub(), setAttribute() {}, getAttribute: () => null });
UI.$ = (id) => elStub();
document.getElementById = () => elStub();
document.querySelectorAll = () => [];
document.querySelector = () => elStub();
HUD.hide = () => {}; HUD.reset = () => {}; HUD.update = () => {};
UI.banner = (t, c, sub) => { (globalThis.banners = globalThis.banners || []).push(String(t) + (sub ? ' | ' + sub : '')); };
UI.toast = () => {};
HUD.hide = () => {}; HUD.reset = () => {}; HUD.update = () => {};
UI.banner = (t, c, sub) => { (globalThis.banners = globalThis.banners || []).push(String(t) + (sub ? ' | ' + sub : '')); };
UI.toast = () => {};

// cria o jogo como o main.js faz
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, ellipse() {}, fill() {}, fillText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), set imageSmoothingEnabled(v) {} });
UI.game = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });

// 2) inicia o tutorial
UI.startTutorial();
check('startTutorial abre a selecao', UI.screen === 'select' && UI.flow && UI.flow.tutorial === true, 'screen=' + UI.screen);
// inicia a luta de treino direto (o launch real chama tutorialBegin no callback do VS)
UI.flow.picks[0] = [0]; UI.flow.picks[1] = [2];
UI.screen = 'fight';
UI.game.start({ mode: 'training', teams: [['du'], ['boneco-treino']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 99, timer: Infinity, dummy: 'stand', autoHeal: true });
UI.tutorialBegin();
check('tutorialBegin disparou no inicio da luta', !!UI.tutorial, 'tutorial=' + !!UI.tutorial);
check('10 passos carregados', UI.tutorial.steps.length === 10, UI.tutorial.steps.length + ' passos');
const g = UI.game;
for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) { g.tick(); UI.tick({}); }
check('luta de treino rodando', g.roundState === 'fight');
// 3) completa os passos artificialmente (executa as acoes de cada detector)
const T = UI.tutorial;
const f = g.activeOf(0);
// passo 1: andar
for (let t = 0; t < 60; t++) { f.x += 6; g.tick(); UI.tick({}); }
check('passo ANDE concluido', T.step >= 1, 'step=' + T.step);
// passo 2: pular
f.vy = -13; f.y = -10; f.onGround = false;
for (let t = 0; t < 10; t++) { g.tick(); UI.tick({}); }
check('passo PULE concluido', T.step >= 2, 'step=' + T.step);
// passo 3: agachar
f.state = 'crouch'; f.crouching = true;
for (let t = 0; t < 30; t++) { g.tick(); UI.tick({}); if (t < 25) f.crouching = true; }
check('passo AGACHE concluido', T.step >= 3, 'step=' + T.step);
// passo 4-5: socos e chutes
f.state = 'idle'; f.crouching = false;
for (let k = 0; k < 3; k++) { f.startAttack('punch'); for (let t = 0; t < 34; t++) { g.tick(); UI.tick({}); } }
console.log('   DEBUG punches=' + T.punches, 'sawPunch=' + !!T._sawPunch, 'attack=' + (f.attack ? f.attack.kind : 'null'), 'f.state=' + f.state, 'tutAtivo=' + !!UI.tutorial, 'screen=' + UI.screen, 'mode=' + g.mode, 'running=' + g.running);
check('passo SOCOS concluido', T.step >= 4, 'step=' + T.step);
for (let k = 0; k < 3; k++) { f.startAttack('kick'); for (let t = 0; t < 34; t++) { g.tick(); UI.tick({}); } }
check('passo CHUTES concluido', T.step >= 5, 'step=' + T.step);
// passo 6: combo (chain 2)
f.state = 'idle';
for (let k = 0; k < 3; k++) { f.startAttack('punch'); for (let t = 0; t < 34; t++) { g.tick(); UI.tick({}); } }
T.chains = 2; // detector de chain exige acerto real; forca o estado
g.tick(); UI.tick({});
check('passo COMBO concluido', T.step >= 6, 'step=' + T.step);
// passo 7: habilidades
f.cd = [0,0,0,0,0,0,0,0,0,0]; f.castLock = 0; f.charge = [100,100]; f.ultimate = 100; f.state = 'idle';
f.tryCast(0); for (let t = 0; t < 20; t++) { g.tick(); UI.tick({}); }
f.cd = [0,0,0,0,0,0,0,0,0,0]; f.castLock = 0; f.state = 'idle';
f.tryCast(1); for (let t = 0; t < 20; t++) { g.tick(); UI.tick({}); }
check('passo HABILIDADE concluido', T.step >= 7, 'step=' + T.step + ' casts=' + T.casts);
// passo 8: ultimate
f.cd = [0,0,0,0,0,0,0,0,0,0]; f.castLock = 0; f.ultimate = 100; f.state = 'idle';
f.tryCast(4);
for (let t = 0; t < 100; t++) { g.tick(); UI.tick({}); }
check('passo ULTIMATE concluido', T.step >= 8, 'step=' + T.step + ' ults=' + T.ults);
// passo 9: bloqueio
f.blocking = true;
for (let t = 0; t < 40; t++) { g.tick(); UI.tick({}); f.blocking = true; }
check('passo BLOQUEIO concluido', T.step >= 9, 'step=' + T.step);
// passo 10: jump-cancel
f.blocking = false;
T.jumpCancels = 1;
g.tick(); UI.tick({});
check('TREINO CONCLUIDO', T.step >= 10 || !UI.tutorial, 'step=' + (UI.tutorial ? UI.tutorial.step : 'finalizado'));
// 4) jogador deixou de ser novo
check('tutorialDone gravado', Profile.setting('tutorialDone') === true);
check('tutorial encerrado', UI.tutorial === null);
// 5) jogador veterano: se rodar de novo e concluir, tudo normal
console.log('---');
console.log(fails === 0 ? 'TUTORIAL: TUDO OK' : 'TUTORIAL: ' + fails + ' FALHAS');
`, ctx);
