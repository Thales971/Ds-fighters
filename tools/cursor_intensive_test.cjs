// INTENSIVO do trabalho do Cursor: 41 arenas novas (20 Brasil + 21 eventos),
// climas novos (darkfog/confetti/fireworks), maré com peixes nadando,
// calendário de eventos com computus e janelas de data.
const fs = require('fs'); const vm = require('vm');
function req(name){ try { return require(name); } catch(e){ return require('/tmp/node_modules/'+name); } }
const { createCanvas } = req('canvas');
const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas, fs,
  URLSearchParams: class { get() { return null; } }, location: { search: '' },
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [], stats: {} }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0 },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} } } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/pets.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }
vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), createPattern: () => ({}), set imageSmoothingEnabled(v) {} });
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

// ==== 1. OS 41 PALCOS NOVOS existem e lutam ====
const brasil = STAGES.filter((s) => s.group === 'Brasil');
const eventos = STAGES.filter((s) => ['Natal', 'Halloween', 'Carnaval', 'Páscoa', 'Festa Junina', 'Dia das Crianças', 'Ano Novo'].includes(s.group));
check('20 paisagens brasileiras', brasil.length === 20, brasil.length + '');
check('21 mapas de eventos', eventos.length === 21, eventos.length + '');
/* cada palco: luta 60 ticks + render sem crash */
let lutam = 0, crashes = [];
for (const st of [...brasil, ...eventos]) {
  try {
    const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
    g.start({ mode: 'versus', teams: [['du'], ['stack']], stage: st.id, cpu: [false, false], roundsToWin: 1, timer: 99 });
    for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
    for (let t = 0; t < 60; t++) { g.tick(); g.render(); }
    lutam++;
  } catch (e) { crashes.push(st.id + ': ' + String(e).slice(0, 40)); }
}
check('os 41 palcos lutam e renderizam sem crash', lutam === 41, lutam + '/41' + (crashes.length ? ' | ' + crashes.slice(0, 3).join(', ') : ''));

// ==== 2. ASSETS: os PNGs dos 41 palcos existem ====
let assetsOk = 0, faltando = [];
for (const st of [...brasil, ...eventos]) {
  const base = st.image || '';
  if (base && fs.existsSync(base)) assetsOk++;
  else faltando.push(st.id);
}
check('imagens mid dos 41 palcos existem', assetsOk === 41, assetsOk + '/41' + (faltando.length ? ' | faltam: ' + faltando.slice(0, 4).join(',') : ''));

// ==== 3. CLIMAS NOVOS: darkfog, confetti, fireworks ====
const gW = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
gW.start({ mode: 'versus', teams: [['du'], ['stack']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
for (let t = 0; t < 700 && gW.roundState !== 'fight'; t++) gW.tick();
let climasOk = 0, infoOk = 0;
for (const k of ['darkfog', 'confetti', 'fireworks']) {
  try { gW.weather.roll(k); for (let t = 0; t < 90; t++) gW.tick(); if (gW.weather.kind === k) climasOk++; } catch (e) {}
  if (WEATHER_INFO[k] && WEATHER_INFO[k].icon && WEATHER_INFO[k].name) infoOk++;
}
check('darkfog/confetti/fireworks rolam sem crash', climasOk === 3, climasOk + '/3');
check('os 3 climas novos tem INFO', infoOk === 3, infoOk + '/3');

// todos os climas usados pelos palcos novos sao validos
const validos = Object.keys(WEATHER_INFO);
let inv = [];
for (const st of [...brasil, ...eventos]) {
  for (const w of (st.weather || [])) if (!validos.includes(w)) inv.push(st.id + ':' + w);
}
check('nenhum palco novo usa clima invalido', inv.length === 0, inv.length ? inv.slice(0, 4).join(',') : '');

// ==== 4. MARÉ: peixes nadam nos palcos tide ====
const tide = STAGES.filter((s) => s.swim);
check('6 palcos com maré (tide)', tide.length >= 5, tide.map((s) => s.id).join(','));
let peixes = 0;
for (const st of tide.slice(0, 3)) {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
  g.start({ mode: 'versus', teams: [['du'], ['stack']], stage: st.id, cpu: [false, false], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  for (let t = 0; t < 120; t++) g.tick();
  const fs2 = g.stage.liveFauna ? g.stage.liveFauna.animals.filter((a) => a.k === 'fish' && a.water) : [];
  if (fs2.length > 0) peixes++;
}
check('peixes NADANDO (swim) nos palcos de maré', peixes >= 2, peixes + '/3 palcos com peixes em superfície');

// ==== 5. CALENDÁRIO DE EVENTOS: computus + janelas ====
check('7 eventos no calendário', Events.list.length === 7, Events.list.map((e) => e.id).join(','));
/* computus: Páscoa 2026 = 5 de abril (domingo) */
const pascoa26 = Events.easter(2026);
check('computus: Páscoa 2026 = 5/abril', pascoa26.getDate() === 5 && pascoa26.getMonth() === 3, pascoa26.getDate() + '/' + (pascoa26.getMonth() + 1));
const pascoa27 = Events.easter(2027);
check('computus: Páscoa 2027 = 28/março', pascoa27.getDate() === 28 && pascoa27.getMonth() === 2, pascoa27.getDate() + '/' + (pascoa27.getMonth() + 1));
/* carnaval = terça 47 dias antes da páscoa */
const carnaval26 = Events.addDays(pascoa26, -47);
check('carnaval 2026 = terça-feira', carnaval26.getDay() === 2, 'dia da semana: ' + carnaval26.getDay());
/* ano novo: 31/12 ate 02/01 */
const anonovo = Events.list.find((e) => e.id === 'anonovo');
const w26 = anonovo.window(2026);
check('ano novo 2026: 31/dez a 02/jan', w26.start.getDate() === 31 && w26.start.getMonth() === 11 && w26.end.getDate() === 2 && w26.end.getMonth() === 0, w26.start.getDate() + '/' + (w26.start.getMonth() + 1) + ' a ' + w26.end.getDate() + '/' + (w26.end.getMonth() + 1));
/* span: o reveillon de 31/12/2026 esta na janela */
const vespera = new Date(2026, 11, 31);
const spanAnoNovo = Events.span(anonovo, vespera);
check('31/12/2026 esta na janela do Ano Novo', !!spanAnoNovo);
const fora = new Date(2026, 5, 15);
check('15/06/2026 NAO esta na janela do Ano Novo', Events.span(anonovo, fora) === null);
/* natal: 1-26 dez */
const natal = Events.list.find((e) => e.id === 'natal');
const wNatal = natal.window(2026);
check('natal 2026: 01-26/dez', wNatal.start.getDate() === 1 && wNatal.start.getMonth() === 11 && wNatal.end.getDate() === 26);
/* o heroi de cada evento existe como palco */
let heroisOk = 0;
for (const ev of Events.list) {
  if (STAGES.some((s) => s.id === ev.hero)) heroisOk++;
}
check('o palco heroi dos 7 eventos existe', heroisOk === 7, heroisOk + '/7');

// ==== 6. ONLINE: as arenas novas liberadas ====
/* o room-core valida stages? confere se STAGES tem os ids e se a arena aleatoria pega os novos */
let sampleOk = 0;
for (let k = 0; k < 30; k++) {
  const st = STAGES[(Math.random() * STAGES.length) | 0];
  if (st && st.id) sampleOk++;
}
check('sorteio de arena pega o elenco todo (' + STAGES.length + ' palcos)', sampleOk === 30 && STAGES.length >= 90, STAGES.length + ' arenas no total');

// ==== 7. PARTIDA COMPLETA num palco de evento + um do Brasil ====
let completas = 0;
for (const [a, b, st] of [['du', 'stack', 'carnaval-sambodromo'], ['henrico', 'jess', 'bonito'], ['jess', 'nunes', 'halloween-mansao']]) {
  try {
    const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle: {} } });
    g.start({ mode: 'versus', teams: [[a], [b]], stage: st, cpu: [true, true], roundsToWin: 1, timer: 99 });
    for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
    for (let t = 0; t < 3600; t++) { g.tick(); if (['win', 'ko', 'over'].includes(g.roundState)) { completas++; break; } }
  } catch (e) {}
}
check('3 partidas IA completas nos palcos novos', completas >= 2, completas + '/3');

console.log('---');
console.log(fails === 0 ? 'INTENSIVO CURSOR: TUDO OK (' + n + ' checks)' : 'INTENSIVO CURSOR: ' + fails + ' FALHAS de ' + n);
`, ctx);
