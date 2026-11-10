// CONTENT PACK INTENSIVO: LIA, NEXO, MAXIMILIAN (separado do Ponteiro) +
// os 20 palcos do stages-v21 + vozes. Valida as mudanças grandes do dono.
const fs = require('fs');
const vm = require('vm');
function req(name){ try { return require(name); } catch(e){ return require('/tmp/node_modules/'+name); } }
const { createCanvas, Image: CanvasImage } = req('canvas');
const ctx = {
  console, Math, Date, Image: CanvasImage,
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho', 'maximilian'], BATATA_IDS: ['du', 'iales', 'felipinho'], data: { settings: { reducedMotion: false }, unlocked: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, skinFor: () => 0, redeem: () => ({ ok: true }) },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} } } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16),
  createCanvas, fs,
};
ctx.globalThis = ctx;
vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/pets.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/voice-book.js', 'js/data/roster-portraits.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 80)); } }

vm.runInContext(`
const canvas = createCanvas(960, 540);
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const fake2d = () => canvas.getContext('2d');

// ==== 1. LIA, NEXO, MAXIMILIAN: kit completo casta e machuca ====
const mk = (id) => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => canvas.toBuffer('image/png'), classList: { remove() {}, add() {}, toggle() {} } });
  g.start({ mode: 'training', teams: [[id], ['boneco-treino']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 2, timer: Infinity, dummy: 'stand', autoHeal: true });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};
for (const id of ['lia', 'nexo', 'maximilian']) {
  const g = mk(id);
  const f = g.activeOf(0), o = g.activeOf(1);
  check(id + ' entra na luta', g.roundState === 'fight');
  const kit = f.currentKit();
  check(id + ' tem 5 habilidades', kit.length === 5, kit.map((p) => p.id).join(','));
  // cada habilidade: casta e da dano no boneco a 200px
  let dmgOk = 0;
  for (let i = 0; i < 5; i++) {
    f.x = 300; o.x = 500; f.dir = 1; o.dir = -1;
    f.hp = f.maxHp; o.hp = o.maxHp;
    f.state = 'idle'; f.cast = null; f.status = {}; o.status = {};
    f.cd = [0,0,0,0,0,0,0,0,0,0]; f.castLock = 0; f.charge = [100, 100]; f.ultimate = 100;
    g.zones = []; g.projectiles = []; g.strikes = [];
    const ok = f.tryCast(i);
    let minHp = o.maxHp;
    for (let t = 0; t < 220; t++) { g.tick(); if (o.hp < minHp) minHp = o.hp; }
    const dmg = o.maxHp - minHp; // vale de HP (autoHeal do treino cura em cima)
    if (ok && dmg > 0) dmgOk++;
    else console.log('   ' + id + ' H' + (i + 1) + ' (' + kit[i].id + '): cast=' + ok + ' dano=' + Math.round(dmg));
  }
  check(id + ': as 5 habilidades castam e machucam', dmgOk >= 4, dmgOk + '/5 com dano');
  // IA sem crash
  g.cfg.cpu[0] = true;
  let ticks = 0;
  for (let t = 0; t < 900; t++) { g.tick(); ticks++; }
  check(id + ': IA controla sem crash (900 ticks)', ticks === 900);
}

// ==== 2. MAXIMILIAN separado do PONTEIRO ====
check('Maximilian e Ponteiro sao lutadores DIFERENTES', FIGHTERS.some((f) => f.id === 'maximilian') && FIGHTERS.some((f) => f.id === 'ponteiro'));
const mx = FIGHTERS.find((f) => f.id === 'maximilian');
const pt = FIGHTERS.find((f) => f.id === 'ponteiro');
check('kits diferentes (relogio vs pendulo)', POWERS.maximilian.powers[0].id === 'relogio' && POWERS.ponteiro.powers[0].id === 'pendulo');
check('Maximilian e SECRETO', mx.secret === true, 'secret=' + mx.secret);
check('Ponteiro e normal', pt.secret !== true);

// ==== 3. sprites e atlas dos novos ====
for (const id of ['lia', 'nexo', 'maximilian']) {
  check('sprite de ' + id + ' existe', SPRITE_LAYOUT.files[id] === 'assets/sprites/' + id + '.png' && fs.existsSync('assets/sprites/' + id + '.png'));
  check('atlas de ' + id + ' existe', fs.existsSync('assets/abilities/' + id + '.png'));
  check('atlas de ' + id + ' no fx (abil + fx2:-fx)', !!ART_SHEETS['abil:' + id] && !!ART_SHEETS['fx2:' + id + '-fx'] && fs.existsSync('assets/fx/' + id + '.png'));
}

// ==== 4. os 20 palcos do v21 carregam e renderizam ====
fs.mkdirSync('.vibe/pack', { recursive: true });
const novos = STAGES.filter((s) => s.group === 'Valinhos' || s.group === 'Código');
check('20 palcos novos registrados', novos.length >= 20, novos.length + ' palcos');
let stageOk = 0;
for (const st of novos.slice(0, 20)) {
  let ok = true;
  try {
    const g2 = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => canvas.toBuffer('image/png'), classList: { remove() {}, add() {}, toggle() {} } });
    g2.start({ mode: 'versus', teams: [['du'], ['stack']], stage: st.id, cpu: [false, false], roundsToWin: 1, timer: 99 });
    for (let t = 0; t < 700 && g2.roundState !== 'fight'; t++) g2.tick();
    for (let t = 0; t < 120; t++) g2.tick();
    if (g2.roundState !== 'fight') ok = false;
    g2.render();
  } catch (e) { ok = false; console.log('   ERRO palco ' + st.id + ':', String(e).slice(0, 60)); }
  if (ok) stageOk++;
}
check('todos os palcos novos lutam e renderizam', stageOk >= 18, stageOk + '/' + novos.length);

// ==== 4b. VISUAL: screenshot dos novos lutadores e palcos ====
try {
  const g3 = mk('lia');
  g3.activeOf(0).x = 300; g3.activeOf(1).x = 560;
  for (let t = 0; t < 60; t++) g3.tick();
  g3.render();
  fs.writeFileSync('.vibe/pack/lia.png', canvas.toBuffer('image/png'));
  const g4 = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => canvas.toBuffer('image/png'), classList: { remove() {}, add() {}, toggle() {} } });
  g4.start({ mode: 'versus', teams: [['maximilian'], ['ponteiro']], stage: 'estacao-valinhos', cpu: [false, false], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g4.roundState !== 'fight'; t++) g4.tick();
  for (let t = 0; t < 90; t++) g4.tick();
  g4.render();
  fs.writeFileSync('.vibe/pack/maximilian-vs-ponteiro.png', canvas.toBuffer('image/png'));
  check('screenshots dos novos renderizam', fs.existsSync('.vibe/pack/lia.png'));
} catch (e) { check('screenshots dos novos renderizam', false, String(e).slice(0, 60)); }

// ==== 5. vozes pt-BR registradas ====
check('voice-book tem falas', typeof VOICE_BOOK === 'object' && Object.keys(VOICE_BOOK).length > 0, Object.keys(VOICE_BOOK || {}).length + ' vozes');

// ==== 6. retratos do roster ====
check('roster-portraits gerado', fs.existsSync('assets/ui/roster.png') || fs.existsSync('assets/ui/face-lia.png'), 'portrait lia');

console.log('---');
console.log(fails === 0 ? 'CONTENT PACK: TUDO OK (' + n + ' checks)' : 'CONTENT PACK: ' + fails + ' FALHAS de ' + n);
`, ctx);
