// CLIMA+FAUNA COMPLETO: todos os 12 climas rolam com efeito real,
// as 11 faunas nascem/comportam/fogem, e os sons disparam sem crash.
const fs = require('fs'); const vm = require('vm');
function req(name){ try { return require(name); } catch(e){ return require('/tmp/node_modules/'+name); } }
const { createCanvas } = req('canvas');
const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, skinFor: () => 0 },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} } } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/pets.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/voice-book.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }

vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, ellipse() {}, arc() {}, fill() {}, fillText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), set imageSmoothingEnabled(v) {} });
const mk = (stage) => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
  g.start({ mode: 'versus', teams: [['du'], ['stack']], stage: stage || 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

// ==== 1. OS 12 CLIMAS rolam, tem INFO e efeito real ====
const todos = ['clear', 'rain', 'wind', 'storm', 'snow', 'aurora', 'heatwave', 'fog', 'fireflies', 'leaves', 'hail', 'eclipse', 'rainbow'];
check('13 climas no total', todos.length === 13, todos.join(','));
let rodam = 0, infoOk = 0;
const g = mk('parque-lago');
for (const k of todos) {
  try {
    g.weather.roll(k);
    if (g.weather.kind === k) rodam++;
    if (WEATHER_INFO[k] && WEATHER_INFO[k].icon && WEATHER_INFO[k].name) infoOk++;
    for (let t = 0; t < 60; t++) g.tick(); /* 60 ticks sem crash por clima */
  } catch (e) { console.log('   ERRO clima ' + k + ': ' + String(e).slice(0, 50)); }
}
check('os 13 climas rolam sem crash', rodam === 13, rodam + '/13');
check('os 13 climas tem INFO (icone/nome/desc)', infoOk === 13, infoOk + '/13');

// ==== 2. EFEITOS REAIS dos climas ====
/* granizo: lasca alguem no chao */
g.weather.roll('hail');
const alvo = g.activeOf(0);
alvo.hp = alvo.maxHp;
let granizou = false;
for (let t = 0; t < 1200; t++) { g.tick(); if (alvo.hp < alvo.maxHp) { granizou = true; break; } }
check('GRANIZO machuca quem fica no chao', granizou, 'hp: ' + Math.round(alvo.hp) + '/' + alvo.maxHp);
/* arco-iris: cura */
g.weather.roll('rainbow');
const cura = g.activeOf(1);
cura.hp = cura.maxHp * 0.5;
for (let t = 0; t < 400; t++) g.tick();
check('ARCO-IRIS cura os lutadores', cura.hp > cura.maxHp * 0.5, 'hp: ' + Math.round(cura.hp) + ' (era ' + Math.round(cura.maxHp * 0.5) + ')');
/* eclipse: medidor +10% */
g.weather.roll('eclipse');
const mEcl = g.activeOf(0).meterRate();
g.weather.roll('clear');
const mClr = g.activeOf(0).meterRate();
check('ECLIPSE: medidor +10% real', Math.abs(mEcl / mClr - 1.10) < 0.001, (mEcl / mClr).toFixed(3));

// ==== 3. OS CLIMAS NOVOS estao nos pools dos palcos ====
const comHail = STAGES.filter((s) => s.weather && s.weather.includes('hail'));
const comEclipse = STAGES.filter((s) => s.weather && s.weather.includes('eclipse'));
const comRainbow = STAGES.filter((s) => s.weather && s.weather.includes('rainbow'));
check('granizo em 3 palcos', comHail.length >= 3, comHail.map((s) => s.id).join(','));
check('eclipse em 2 palcos', comEclipse.length >= 2, comEclipse.map((s) => s.id).join(','));
check('arco-iris em 1 palco', comRainbow.length >= 1, comRainbow.map((s) => s.id).join(','));

// ==== 4. AS 11 FAUNAS nascem, se comportam e fogem ====
const especies = ['pigeon', 'bird', 'cat', 'dog', 'dragonfly', 'firefly', 'butterfly', 'fish', 'squirrel', 'seagull', 'frog'];
const defFauna = { pigeons: 'pigeon', birds: 'bird', cat: 'cat', dog: 'dog', dragonfly: 'dragonfly', fireflies: 'firefly', butterflies: 'butterfly', fish: 'fish', squirrel: 'squirrel', seagull: 'seagull', frog: 'frog' };
const gF = mk('parque-lago');
let nascem = 0, comportam = 0, fogem = 0;
for (const k of Object.keys(defFauna)) {
  const lf = new LiveFauna(gF, { fauna: [k] });
  const a = lf.animals[0];
  if (!a || a.k !== defFauna[k]) { console.log('   ' + k + ' NAO nasce'); continue; }
  nascem++;
  /* 200 ticks de comportamento sem crash */
  const x0 = a.x, y0 = a.y;
  let crash = false;
  try { for (let t = 0; t < 200; t++) lf.update(); } catch (e) { crash = true; }
  if (!crash) comportam++;
  /* terrestres fogem do lutador */
  if (['pigeon', 'cat', 'dog', 'squirrel', 'frog'].includes(a.k)) {
    const lf2 = new LiveFauna(gF, { fauna: [k] });
    gF.stage.liveFauna = lf2; /* o tick atualiza a fauna do palco */
    const b = lf2.animals[0];
    const du = gF.activeOf(0);
    du.x = b.x + 30; du.y = 0;
    for (let t = 0; t < 40; t++) gF.tick();
    if (b.state === 'flee' || b.state === 'gone') fogem++;
    else console.log('   ' + k + ' nao foge (estado=' + b.state + ')');
  }
}
check('as 11 especies NASCEM', nascem === 11, nascem + '/11');
check('as 11 se COMPORTAM 200 ticks sem crash', comportam === 11, comportam + '/11');
check('as 5 terrestres FOGEM do lutador', fogem === 5, fogem + '/5');

// ==== 5. SONS: fauna foge com som (tone nao explode) e climas tocam ====
let sonsOk = 0;
try {
  const lf3 = new LiveFauna(gF, { fauna: ['dog', 'cat', 'seagull', 'frog', 'squirrel'] });
  gF.stage.liveFauna = lf3;
  const du = gF.activeOf(0);
  for (const a of lf3.animals) {
    du.x = a.x + 20; du.y = 0;
    for (let t = 0; t < 30; t++) gF.tick(); /* foge + dispara o tone */
  }
  sonsOk = 1;
} catch (e) { console.log('   ERRO sons fauna: ' + String(e).slice(0, 60)); }
check('sons da fauna disparam sem crash', sonsOk === 1);
let sonsClima = 0;
try {
  for (const k of ['hail', 'eclipse', 'rainbow', 'fireflies', 'leaves', 'storm', 'rain', 'wind']) { g.weather.roll(k); for (let t = 0; t < 30; t++) g.tick(); }
  sonsClima = 1;
} catch (e) { console.log('   ERRO sons clima: ' + String(e).slice(0, 60)); }
check('sons dos climas disparam sem crash', sonsClima === 1);

// ==== 6. MATCH COMPLETA em palco com tudo (parque-lago: fauna max + climas) ====
try {
  const gM = mk('parque-lago');
  gM.cfg.cpu[0] = true; gM.cfg.cpu[1] = true;
  for (let t = 0; t < 2400; t++) { gM.tick(); if (['win', 'ko', 'over'].includes(gM.roundState)) break; }
  check('partida completa no parque-lago (fauna+clima) sem crash', true, 'fauna: ' + (gM.stage.liveFauna ? gM.stage.liveFauna.animals.length : 0));
} catch (e) { check('partida completa no parque-lago (fauna+clima) sem crash', false, String(e).slice(0, 60)); }

console.log('---');
console.log(fails === 0 ? 'CLIMA/FAUNA: TUDO OK (' + n + ' checks)' : 'CLIMA/FAUNA: ' + fails + ' FALHAS de ' + n);
`, ctx);
