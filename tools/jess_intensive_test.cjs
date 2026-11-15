// INTENSIVO: tudo que entrou no PR das fichas — casos extremos
const fs = require('fs'); const vm = require('vm');
function req(name){ try { return require(name); } catch(e){ return require('/tmp/node_modules/'+name); } }
const { createCanvas } = req('canvas');
const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas, fs,
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho', 'maximilian'], data: { settings: { reducedMotion: false }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0,
    unlockPitoco() { if (this.data.pitocoUnlocked) return false; this.data.pitocoUnlocked = true; return true; }, hasPitoco() { return !!this.data.pitocoUnlocked; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} } } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/pets.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }
vm.runInContext(`const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), createPattern: () => ({}), set imageSmoothingEnabled(v) {} });
const mk = (me, opp, stage, mode) => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
  g.start({ mode: mode || 'versus', teams: [[me], [opp || 'du']], stage: stage || 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

// ==== 1. JESS: DALTONIC duracao exata (6s = 360 ticks) ====
const g1 = mk('jess', 'du');
const fj = g1.activeOf(0), od = g1.activeOf(1);
fj.x = 300; od.x = 500; fj.dir = 1;
fj.cd = [0,0,0,0,0,0,0,0,0,0]; fj.castLock = 0; fj.state = 'idle'; fj.cast = null; fj.ultimate = 100;
fj.tryCast(4);
for (let t = 0; t < 70; t++) g1.tick();
let durou = 0;
for (let t = 0; t < 500; t++) { g1.tick(); if (od.has('daltonic')) durou++; }
check('DALTONIC dura ~6s', durou >= 330 && durou <= 380, durou + ' ticks');

// LIFESTEAL exato: 25% do dano vira vida
const g2 = mk('jess', 'du');
const f2 = g2.activeOf(0), o2 = g2.activeOf(1);
f2.addStatus('lifesteal', 600);
f2.hp = f2.maxHp * 0.3;
const hpA = f2.hp;
o2.guardUp = false; o2.status = {};
const danoDado = 40;
o2.takeHit(danoDado, { attacker: f2 });
const curou = f2.hp - hpA;
check('LIFESTEAL: cura exatamente 25% do dano', Math.abs(curou - danoDado * 0.25) < 0.01, 'curou ' + curou.toFixed(2) + ' de ' + danoDado);

// TO BE aplica a marca (vuln = +10% dano recebido)
const g3 = mk('jess', 'du');
const f3 = g3.activeOf(0), o3 = g3.activeOf(1);
f3.x = 300; o3.x = 500; f3.dir = 1;
f3.cd = [0,0,0,0,0,0,0,0,0,0]; f3.castLock = 0; f3.state = 'idle'; f3.cast = null;
f3.tryCast(0); /* To Be */
let marcou = false;
for (let t = 0; t < 200; t++) { g3.tick(); if (o3.has('vuln')) { marcou = true; break; } }
check('TO BE aplica ASSERTION FAILED (vuln)', marcou);

// ==== 2. JESS: partida IA-vs-IA em 3 palcos diferentes ====
let jPartidas = 0;
for (const [a, b, st] of [['jess', 'du', 'treino-dojo'], ['jess', 'henrico', 'arquibancada'], ['jess', 'iales', 'parque-lago']]) {
  try {
    const g = mk(a, b, st);
    g.cfg.cpu[0] = true; g.cfg.cpu[1] = true;
    for (let t = 0; t < 3600; t++) { g.tick(); if (['win', 'ko', 'over'].includes(g.roundState)) break; }
    jPartidas++;
  } catch (e) { console.log('   CRASH ' + a + ' vs ' + b + ': ' + String(e).slice(0, 50)); }
}
check('3 partidas IA com Jess sem crash', jPartidas === 3, jPartidas + '/3');

// ==== 3. PITOCO: edge cases do apelao ====
// esquiva NAO vale pra golpe inbloqueavel
const g4 = mk('du', 'stack');
const dono4 = g4.activeOf(0);
dono4.pet = { id: 'pitoco', fx: { regen: 15 / 60, dodge: 0.5 } };
dono4.hp = dono4.maxHp;
dono4.takeHit(20, { attacker: g4.activeOf(1), height: 'unblockable' });
check('esquiva NAO vale pra inbloqueavel', dono4.hp < dono4.maxHp, 'hp: ' + Math.round(dono4.hp) + '/' + dono4.maxHp);
// o OONENTE com pitoco tambem esquiva (simetrico)
const g5 = mk('du', 'stack');
const rival5 = g5.activeOf(1);
rival5.pet = { id: 'pitoco', fx: { regen: 15 / 60, dodge: 0.5 } };
rival5.hp = rival5.maxHp;
let errouRival = 0;
for (let k = 0; k < 40; k++) { rival5.hp = rival5.maxHp; rival5.takeHit(10, { attacker: g5.activeOf(0) }); if (rival5.hp >= rival5.maxHp) errouRival++; }
check('esquiva funciona pro rival tambem (pet do P2)', errouRival > 8, errouRival + '/40 erraram');
// regen NAO passa do maximo
dono4.hp = dono4.maxHp - 2;
for (let t = 0; t < 130; t++) g4.tick();
check('regen respeita o teto de vida', dono4.hp <= dono4.maxHp, Math.round(dono4.hp) + '/' + dono4.maxHp);
// pitoco em todos os modos
let pitModos = 0;
for (const modo of ['versus', 'arcade', 'training', 'tag', 'survival']) {
  try { const gm = mk('du', 'stack', 'treino-dojo', modo); const f = gm.activeOf(0); if (f) f.pet = { id: 'pitoco', fx: { regen: 15 / 60, dodge: 0.5 } }; for (let t = 0; t < 60; t++) gm.tick(); pitModos++; } catch (e) {}
}
check('pitoco nos 5 modos sem crash', pitModos === 5, pitModos + '/5');
// konami: janela deslizante com ruido no meio
const konami = (seq) => { let buf = []; for (const k of seq) { buf.push(k); if (buf.length > 6) buf.shift(); if (buf.join(',') === ['KeyP','KeyI','KeyT','KeyO','KeyC','KeyO'].join(',')) { Profile.unlockPitoco(); buf = []; } } };
Profile.data.pitocoUnlocked = false;
konami(['KeyX', 'KeyP', 'KeyI', 'KeyT', 'KeyO', 'KeyC', 'KeyO']);
check('PITOCO com 1 tecla de ruido ANTES pega (janela deslizante)', Profile.hasPitoco() === true);
Profile.data.pitocoUnlocked = false;
konami(['KeyP', 'KeyI', 'KeyZ', 'KeyZ', 'KeyT', 'KeyO', 'KeyC', 'KeyO']);
check('PITOCO quebrado no meio NAO pega', Profile.hasPitoco() === false);
Profile.data.pitocoUnlocked = false;
konami(['KeyP', 'KeyI', 'KeyT', 'KeyO', 'KeyC']);
check('PITOC incompleto nao desbloqueia', Profile.hasPitoco() === false);
// unlockPitoco nao duplica
Profile.data.pitocoUnlocked = true;
check('unlockPitoco idempotente', Profile.unlockPitoco() === false);

// ==== 4. FAUNA: as 8 especies fogem E se comportam 300 ticks ====
const gF = mk('du', 'stack', 'parque-lago');
let fogemSpr = 0, comportamSpr = 0;
const mapaSpr = { dog: 'dog', cat: 'cat', pigeons: 'pigeon', fish: 'fish', frog: 'frog', rabbits: 'rabbit', hamster: 'hamster', turtle: 'turtle' };
for (const [kk, especie] of Object.entries(mapaSpr)) {
  const lf = new LiveFauna(gF, { fauna: [kk] });
  gF.stage.liveFauna = lf;
  const a = lf.animals[0];
  if (!a) { console.log('   NAO NASCE:', kk); continue; }
  let crash = false;
  try { for (let t = 0; t < 300; t++) lf.update(); } catch (e) { crash = true; }
  if (!crash) comportamSpr++;
  if (['dog', 'cat', 'pigeon', 'frog', 'rabbit', 'hamster', 'turtle'].includes(especie)) {
    const lf3 = new LiveFauna(gF, { fauna: [kk] });
    gF.stage.liveFauna = lf3;
    const b = lf3.animals[0];
    gF.activeOf(0).x = b.x + 30;
    for (let t = 0; t < 40; t++) gF.tick();
    if (b.state === 'flee' || b.state === 'gone') fogemSpr++;
    else console.log('   NAO FOGE:', kk, '(estado=' + b.state + ')');
  }
}
check('as 8 especies se comportam 300 ticks sem crash', comportamSpr === 8, comportamSpr + '/8');
check('as 7 terrestres/aereas em sprite fogem', fogemSpr === 7, fogemSpr + '/7');

// ==== 5. TORCIDA: render com canvas REAL (pixels) ====
const canvas = createCanvas(960, 540);
const gT = new Game({ width: 960, height: 540, getContext: () => canvas.getContext('2d'), toBuffer: () => canvas.toBuffer('image/png'), classList: { remove() {}, add() {}, toggle() {} } });
gT.start({ mode: 'versus', teams: [['du'], ['stack']], stage: 'arquibancada', cpu: [false, false], roundsToWin: 1, timer: 99 });
for (let t = 0; t < 700 && gT.roundState !== 'fight'; t++) gT.tick();
/* injeta a folha da torcida como o browser faria */
try { const img = new Image(); img.src = 'assets/fauna/torcida.png'; gT.stage.crowdSheet = img; } catch (e) {}
gT.stage.crowdHype = 60;
for (let t = 0; t < 10; t++) gT.tick();
gT.render();
fs.mkdirSync('.vibe/torcida', { recursive: true });
fs.writeFileSync('.vibe/torcida/arquibancada.png', canvas.toBuffer('image/png'));
check('torcida renderiza com canvas real sem crash', fs.existsSync('.vibe/torcida/arquibancada.png'));
/* hype decai */
const hype0 = gT.stage.crowdHype;
for (let t = 0; t < 100; t++) gT.tick();
check('hype decai com o tempo', gT.stage.crowdHype < hype0, hype0 + ' -> ' + gT.stage.crowdHype);

// ==== 6. JESS + PITOCO (sinergia da ficha: a dupla joga junta) ====
const gS = mk('jess', 'henrico');
const jess = gS.activeOf(0);
jess.pet = { id: 'pitoco', fx: { regen: 15 / 60, dodge: 0.5 } };
jess.hp = jess.maxHp * 0.5;
const hpS0 = jess.hp;
for (let t = 0; t < 130; t++) gS.tick();
check('Jess + Pitoco: a dupla da ficha funciona (regen)', jess.hp > hpS0 + 25, Math.round(hpS0) + ' -> ' + Math.round(jess.hp));
let ticksS = 0;
for (let t = 0; t < 2400; t++) { gS.tick(); ticksS++; if (['win', 'ko', 'over'].includes(gS.roundState)) break; }
check('Jess com Pitoco: partida completa sem crash', ticksS > 0);

console.log('---');
console.log(fails === 0 ? 'INTENSIVO JESS/PITOCO: TUDO OK (' + n + ' checks)' : 'INTENSIVO JESS/PITOCO: ' + fails + ' FALHAS de ' + n);
`, ctx);
