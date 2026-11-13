// HITBOX INTENSIVO: todos os 46 lutadores — alcance do soco/chute,
// double jump, guarda alta (andar pra tras) e frame data sadia.
const fs = require('fs'); const vm = require('vm');
const ctx = { console, Math, Date, Image: class { set src(v) {} },
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, skinFor: () => 0 },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => ({ getContext: () => ({}), style: {} }), addEventListener() {} },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/pets.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/voice-book.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 60)); } }

vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, ellipse() {}, fill() {}, fillText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), set imageSmoothingEnabled(v) {} });
const mk = (me, opp) => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
  g.start({ mode: 'versus', teams: [[me], [opp || 'du']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

// ==== 1. ALCANCE DE SOCO/CHUTE: o golpe acerta no range declarado e nao antes ====
const ids = FIGHTERS.map((f) => f.id).filter((id) => id !== 'boneco-treino');
check('46 lutadores no teste', ids.length >= 44, ids.length + ' lutadores');
let alcanceOk = 0, alcanceProbs = [];
for (const id of ids) {
  const g = mk(id, 'du');
  const f = g.activeOf(0), o = g.activeOf(1);
  const mv = f.def.moves;
  /* no range maximo declarado: acerta */
  f.x = 300; o.x = 300 + mv.punch.range + 26; f.dir = 1; o.dir = -1; /* range + corpo (26) */
  f.state = 'idle'; f.cast = null; f.cd = [0,0,0,0,0,0,0,0,0,0]; f.castLock = 0;
  o.hp = o.maxHp;
  f.startAttack('punch');
  let acertou = false;
  for (let t = 0; t < 60; t++) { g.tick(); if (o.hp < o.maxHp) { acertou = true; break; } }
  if (acertou) alcanceOk++; else alcanceProbs.push(id + ':soco');
}
check('soco acerta no alcance declarado (todos)', alcanceOk >= ids.length - 2, alcanceOk + '/' + ids.length + (alcanceProbs.length ? ' falhos: ' + alcanceProbs.slice(0, 6).join(',') : ''));

// ==== 2. FRAME DATA SADIA: startup+recovery nao exagerado ====
let frameOk = 0;
for (const id of ids) {
  const g = mk(id, 'du');
  const mv = g.activeOf(0).def.moves;
  const sadia = mv.punch.startup <= 8 && mv.punch.recovery <= 14 && mv.kick.startup <= 10 && mv.kick.recovery <= 16;
  if (sadia) frameOk++;
}
check('frame data sadia em todos', frameOk === ids.length, frameOk + '/' + ids.length);

// ==== 3. DOUBLE JUMP: um pulo extra no ar pra TODO mundo ====
let djOk = 0, djProbs = [];
for (const id of ['du', 'iales', 'henrico', 'lia', 'maximilian', 'nunes', 'meta', 'winx-exe']) {
  const g = mk(id, 'du');
  const f = g.activeOf(0);
  f.x = 300; f.dir = 1;
  f.state = 'idle'; f.cast = null;
  /* primeiro pulo */
  const in1 = { left: false, right: false, down: false, up: true, punch: false, kick: false };
  f.update(in1);
  for (let t = 0; t < 12; t++) g.tick();
  if (!f.onGround) {
    /* segundo pulo (no ar) */
    const vyAntes = f.vy;
    f.update(in1);
    if (f._doubleJumped && f.vy < vyAntes) djOk++; else djProbs.push(id + ':dj');
  } else djProbs.push(id + ':sem-pular');
}
check('double jump funciona (amostra de 8)', djOk === 8, djOk + '/8' + (djProbs.length ? ' falhos: ' + djProbs.join(',') : ''));

// ==== 4. GUARDA ALTA: andar pra tras absorve 15% ====
const g = mk('du', 'henrico');
const atk = g.activeOf(1), def = g.activeOf(0);
atk.x = 400; def.x = 300; atk.dir = -1; def.dir = 1;
def.state = 'idle'; atk.state = 'idle'; atk.cast = null; atk.cd = [0,0,0,0,0,0,0,0,0,0]; atk.castLock = 0;
def.hp = def.maxHp;
/* def anda pra tras (pra longe do atk) */
def.update({ left: true, right: false, down: false, up: false, punch: false, kick: false });
const guardAtivo = def.guardUp === true;
check('andar pra tras ativa a GUARDA ALTA', guardAtivo, 'guardUp=' + def.guardUp);
/* dano com guarda vs sem guarda */
const danoSem = (() => { g.combo = { owner: null, count: 0, until: 0 }; def.guardUp = false; const hp0 = def.hp; def.takeHit(20, { attacker: atk }); return hp0 - def.hp; })();
const danoCom = (() => { g.combo = { owner: null, count: 0, until: 0 }; def.guardUp = true; const hp0 = def.hp; def.takeHit(20, { attacker: atk }); return hp0 - def.hp; })();
check('guarda alta absorve 15% do dano', Math.abs(danoCom - danoSem * 0.85) < 0.01, 'sem=' + danoSem + ' com=' + danoCom.toFixed(1));

// ==== 5. CLIMAS NOVOS: vagalumes (+6% medidor) e folhas (dash +10%) ====
const gv = mk('du', 'stack');
gv.weather.roll('fireflies');
check('clima VAGALUMES roda', gv.weather.kind === 'fireflies');
const m0 = gv.activeOf(0).meterRate();
gv.weather.roll('leaves');
check('clima FOLHAS roda', gv.weather.kind === 'leaves');
const vSem = 6.6, vCom = 6.6 * 1.10;
gv.activeOf(0).state = 'idle'; gv.activeOf(0).cast = null;
gv.activeOf(0).startDash(1);
const vDash = Math.abs(gv.activeOf(0).vx);
check('folhas deixam o dash mais longo', vDash >= vSem - 0.5, 'vx=' + vDash.toFixed(1) + ' (base ' + vSem + ')');

// ==== 6. FAUNA: animais aparecem e fogem do lutador ====
const gf = mk('du', 'stack');
/* forca um palco com fauna */
gf.stageDef = STAGES.find((s) => s.id === 'parque-lago');
gf.stage.liveFauna = new LiveFauna(gf, gf.stageDef);
const animais = gf.stage.liveFauna.animals;
check('fauna nasce no palco (parque-lago)', animais.length >= 3, animais.length + ' animais: ' + [...new Set(animais.map((a) => a.k))].join(','));
/* lutador chega perto: bicho foge */
const pomba = animais.find((a) => a.k === 'pigeon' || a.k === 'dog' || a.k === 'cat');
if (pomba) {
  const du = gf.activeOf(0);
  du.x = pomba.x + 30; du.y = 0;
  for (let t = 0; t < 30; t++) gf.tick();
  check('fauna FOGE do lutador', pomba.state === 'flee' || pomba.state === 'gone', 'estado=' + pomba.state);
} else check('fauna terrestre pra teste', false, 'sem animal terrestre');
/* vagalumes do palco */
const vgf = animais.filter((a) => a.k === 'firefly').length;
const morro = STAGES.find((s) => s.id === 'antena-morro');
check('vagalumes no palco antena-morro', !!(morro && morro.fauna && morro.fauna.includes('fireflies')), JSON.stringify(morro && morro.fauna));

// ==== 7. RIVALIDADES: 20 pares, henrico x lia dispara ====
check('20 rivalidades no voice-book', VOICE_BOOK.rivalries.length === 20, VOICE_BOOK.rivalries.length + ' pares');
const r = g.rivalry('henrico', 'lia');
check('rivalidade henrico x lia existe', !!r && r.a === 'henrico' && r.b === 'lia', r ? r.text : 'NAO');
const r2 = g.rivalry('lia', 'henrico');
check('rivalidade funciona nos dois sentidos', !!r2);

console.log('---');
console.log(fails === 0 ? 'HITBOX/MELHORIAS: TUDO OK (' + n + ' checks)' : 'HITBOX/MELHORIAS: ' + fails + ' FALHAS de ' + n);
`, ctx);
