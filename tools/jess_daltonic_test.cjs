// Teste focado no DALTONIC MODE novo: slow constante, gas rosa, tela cinza/turva e controles invertidos.
const fs = require('fs'); const vm = require('vm');
function req(name) { return require(name); }
const { createCanvas } = req('canvas');
const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas, fs,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0,
    unlockPitoco() { this.data.pitocoUnlocked = true; return true; }, hasPitoco() { return !!this.data.pitocoUnlocked; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {}, pitocoSeq: [], pitocoKey() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} } } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/pets.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 80)); } }
vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), createPattern: () => ({}), set imageSmoothingEnabled(v) {}, set globalAlpha(v) {}, set globalCompositeOperation(v) {}, set fillStyle(v) {}, set strokeStyle(v) {}, set font(v) {}, set textAlign(v) {}, set lineWidth(v) {}, set filter(v) {} });
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const mkCanvas = () => { const toggles = []; return { toggles, getContext: () => fake2d(), classList: { toggle: (c, v) => toggles.push([c, v]), add() {}, remove() {} } }; };
const mk = (me, opp) => {
  const canvas = mkCanvas();
  canvas.width = 960; canvas.height = 540;
  const g = new Game(canvas);
  g.start({ mode: 'versus', teams: [[me], [opp || 'du']], stage: 'treino-dojo', cpu: [false, true], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};

// 1. ult aplica daltonic + slow no rival
const g = mk('jess', 'du');
const fj = g.activeOf(0), od = g.activeOf(1);
fj.x = 300; od.x = 500; fj.dir = 1; od.dir = -1;
fj.cd = [0,0,0,0,0,0,0,0,0,0]; fj.castLock = 0; fj.state = 'idle'; fj.cast = null; fj.ultimate = 100;
fj.tryCast(4);
for (let t = 0; t < 70; t++) g.tick();
check('rival marcado com daltonic', od.has('daltonic') === true);
check('rival com slow logo apos a ult', od.has('slow') === true);
check('Jess com lifesteal', fj.has('lifesteal') === true);

// 2. slow CONSTANTE: depois de 300 ticks (5s) ainda esta lento e daltonic
for (let t = 0; t < 300; t++) g.tick();
check('aos 5s o rival continua daltonic', od.has('daltonic') === true, 'left=' + od.left('daltonic'));
check('aos 5s o rival continua LENTO (slow constante)', od.has('slow') === true, 'left=' + od.left('slow'));
check('speedMult do rival reduzida pelo slow (0.55x)', od.speedMult() <= (od.def.stats.speed || 1) * 0.56, od.speedMult().toFixed(2) + ' vs base ' + (od.def.stats.speed || 1));
check('gas rosa spawnado (sparks cor de rosa)', g.sparks.some((s) => s.color === '#ff7ad9'), g.sparks.filter((s) => s.color === '#ff7ad9').length + ' sparks rosa');

// 3. controles invertidos: input direto no daltonicInput
const inv = od.daltonicInput({ left: false, right: true, up: false, down: true, punch: true, kick: false, a0: true, a1: false, a2: false, a3: false, a4: false, a5: false, a6: false, a7: false, a8: false, a9: false });
check('movimento invertido (right vira left)', inv.left === true && inv.right === false);
check('vertical invertido (down vira up)', inv.up === true && inv.down === false);
check('tecla 1 (a0) vira tecla 5 (a4) dentro do kit', inv.a4 === true && inv.a0 === false, 'a0=' + inv.a0 + ' a4=' + inv.a4);
check('soco nao e invertido (nao e botao de poder)', inv.punch === true);
const full0 = { left: false, right: false, up: false, down: false, punch: false, kick: false };
for (let k = 0; k < 10; k++) full0['a' + k] = false;
const inv2 = od.daltonicInput(Object.assign({}, full0, { a1: true, a5: true }));
check('tecla 2 (a1) vira tecla 4 (a3)', inv2.a3 === true && inv2.a1 === false, 'a1=' + inv2.a1 + ' a3=' + inv2.a3);
check('tecla 3 (a2) fica no lugar (meio do espelhamento)', od.daltonicInput(Object.assign({}, full0, { a2: true })).a2 === true);
check('slots alem do kit (a5+) nao sao tocados', inv2.a5 === true && inv2.a9 === false, 'a5=' + inv2.a5 + ' a9=' + inv2.a9);
check('kit do rival tem 5 poderes (teclas 1-5)', od.currentKit().length === 5, 'n=' + od.currentKit().length);

// 3b. caminho real do jogo: segurando RIGHT com daltonic, o rival ANDA PARA A ESQUERDA
const g3 = mk('jess', 'du');
const f3 = g3.activeOf(0), o3 = g3.activeOf(1);
f3.x = 300; o3.x = 520; f3.dir = 1; o3.dir = -1;
f3.cd = [0,0,0,0,0,0,0,0,0,0]; f3.castLock = 0; f3.state = 'idle'; f3.cast = null; f3.ultimate = 100;
f3.tryCast(4);
for (let t = 0; t < 70; t++) g3.tick();
check('rival daltonic no teste de caminho', o3.has('daltonic') === true);
const rightIn = { left: false, right: true, down: false, up: false, punch: false, kick: false };
for (let k = 0; k < 10; k++) rightIn['a' + k] = false;
const origInputFor = g3.inputFor.bind(g3);
g3.inputFor = (ti) => ti === 1 ? Object.assign({}, rightIn) : origInputFor(ti);
o3.state = 'idle'; o3.x = 480; o3.vx = 0;
const x0 = o3.x;
for (let t = 0; t < 40; t++) g3.tick();
check('segurando RIGHT o rival anda para a ESQUERDA (x diminuiu)', o3.x < x0, 'x ' + x0 + ' -> ' + o3.x.toFixed(1));

// 4. tela do jogador local fica cinza/turva (classe daltonic no canvas)
const g2 = mk('du', 'jess'); // P1 humano = du (local), P2 = jess (cpu)
const p1 = g2.activeOf(0), p2 = g2.activeOf(1);
p2.x = 400; p1.x = 300; p2.dir = -1;
p2.cd = [0,0,0,0,0,0,0,0,0,0]; p2.castLock = 0; p2.state = 'idle'; p2.cast = null; p2.ultimate = 100;
p2.tryCast(4);
for (let t = 0; t < 80; t++) { g2.tick(); g2.render(); }
const togDalt = g2.canvas.toggles.filter((t) => t[0] === 'daltonic');
check('classe .daltonic ligada no canvas do jogador atingido', togDalt.length > 0 && togDalt[togDalt.length - 1][1] === true, JSON.stringify(togDalt.slice(-2)));
check('render com gas rosa nao crashou', true);

// 5. depois que o status acaba, a classe desliga
g2.activeOf(0).status.daltonic = 0;
for (let t = 0; t < 5; t++) g2.render();
const off = g2.canvas.toggles.filter((t) => t[0] === 'daltonic');
check('classe .daltonic desliga quando o status acaba', off[off.length - 1][1] === false);

// 6. label de status existe (visivel no HUD de status)
check('STATUS_LABEL tem daltonic', !!STATUS_LABEL.daltonic && STATUS_LABEL.daltonic.t === 'DALTONIC');

console.log('---');
console.log(fails === 0 ? 'DALTONIC NOVO: TUDO OK (' + n + ' checks)' : 'DALTONIC NOVO: ' + fails + ' FALHAS de ' + n);
`, ctx);
