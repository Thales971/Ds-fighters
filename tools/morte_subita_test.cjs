// MORTE SÚBITA (round final): fogo liga na hora, o calor fere os DOIS e cresce com o
// tempo (teto 2.4 a cada 40 ticks), +5% de dano, e no fim da contagem cai quem tem menos vida.
const fs = require('fs');
const vm = require('vm');
/* Math.random fixo + arena neutra: antes o clima/mecanica sorteados (chuva,
   regen, hazards) mudavam o calor medido e a suite falhava as vezes */
let seed = 11;
const M = Object.create(Math);
M.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const ctx = {
  console, Image: class { set src(v) {} }, Math: M, Date,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0 },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => ({ getContext: () => ({}), style: {} }), addEventListener() {} },
  window: { addEventListener() {} },
  setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16),
};
ctx.globalThis = ctx;
vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/pets.js', 'js/data/stages.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO ao carregar', f, e.message.slice(0, 60)); } }
const api = vm.runInContext('({Game,FIGHTERS})', ctx);
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, ellipse() {}, fill() {}, fillText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), set imageSmoothingEnabled(v) {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }) });
const canvas = { width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } };

let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const g = new api.Game(canvas);
g.start({ mode: 'versus', teams: [['du'], ['du']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 2, timer: 99 });
const calm = () => { if (g.weather) { g.weather.set('clear'); g.weather.pool = ['clear']; g.weather.changeAt = 1e9; } if (g.mech) g.mech.m = {}; };
calm();
for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
check('round 1: sem morte subita', g.inferno === null);
g.round = 3; g.teamWins = [1, 1]; g.beginRound(); calm();
for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
check('round final: morte subita preparada', !!g.inferno && g.suddenLeft > 0, JSON.stringify(g.inferno) + ' contagem=' + g.suddenLeft);
g.tick();
check('fogo liga logo no comeco da luta do round final', g.inferno.active === true);
const [a, b] = g.activePair();
a.x = 300; b.x = 660;
/* calor fere os dois, sem ninguem encostar em nada */
const hpA = a.hp, hpB = b.hp;
for (let t = 0; t < 240; t++) { g.tick(); a.x = 300; b.x = 660; }
check('calor da arena fere os DOIS lutadores', a.hp < hpA - 1 && b.hp < hpB - 1, 'A ' + hpA.toFixed(1) + '->' + a.hp.toFixed(1) + ' | B ' + hpB.toFixed(1) + '->' + b.hp.toFixed(1));
/* o calor cresce com o tempo */
const chip = (ticks) => { const h0 = a.hp; for (let t = 0; t < ticks; t++) { g.tick(); a.x = 300; b.x = 660; a.hp = Math.max(a.hp, 1); } return h0 - a.hp; };
const early = chip(240);
for (let t = 0; t < 1200; t++) { g.tick(); a.hp = a.maxHp; b.hp = b.maxHp; a.x = 300; b.x = 660; }
const late = chip(240);
check('calor aumenta com o tempo', late > early * 1.3, 'inicio=' + early.toFixed(2) + ' depois=' + late.toFixed(2));
/* chamas CRESCEM: parede de fogo avanca com o tempo e quem encosta nela leva o dobro */
{
  const t0 = g.inferno.t;
  g.inferno.t = 60; const h1 = g.infernoHeat();
  g.inferno.t = 30 * 60; const h2 = g.infernoHeat();
  g.inferno.t = 60 * 60; const h3 = g.infernoHeat();
  check('chamas se intensificam com o tempo (calor 0 -> 1)', h1 < 0.1 && h2 > 0.6 && h3 === 1, [h1, h2, h3].map((v) => v.toFixed(2)).join(' '));
  g.inferno.t = 30 * 60 - 1;
  a.x = 480; b.x = 20; a.hp = a.maxHp; b.hp = b.maxHp;
  g.tick();
  const da = a.maxHp - a.hp, db = b.maxHp - b.hp;
  check('quem encosta na parede de fogo leva o dobro', db > da * 1.6 && da > 0, 'centro=' + da.toFixed(2) + ' parede=' + db.toFixed(2));
  g.inferno.t = t0; a.x = 300; b.x = 660;
}
/* online: o convidado recebe o tempo do fogo no snapshot */
{
  const src = fs.readFileSync('js/engine/game.js', 'utf8');
  check('snapshot do online leva a morte subita pro convidado', /inf: this\.inferno \? this\.inferno\.t : -1/.test(src) && /s\.inf >= 0/.test(src));
}
/* +5% de dano com o fogo ativo */
const dm = (on) => { const s = g.inferno.active; g.inferno.active = on; const v = a.dmgMult ? a.dmgMult() : null; g.inferno.active = s; return v; };
const on = dm(true), off = dm(false);
if (on != null) check('fogo ativo: +5% de dano', Math.abs(on / off - 1.05) < 0.001, on.toFixed(3) + ' vs ' + off.toFixed(3));
/* fim da contagem: cai quem tem MENOS vida */
a.hp = a.maxHp * 0.3; b.hp = b.maxHp * 0.9; g.suddenLeft = 1;
g.tick();
check('fim da contagem: quem tem menos vida cai', !a.alive || a.hp <= 0, 'A hp=' + a.hp.toFixed(1) + ' alive=' + a.alive + ' | B hp=' + b.hp.toFixed(1));
console.log('---');
console.log(fails === 0 ? 'MORTE SUBITA: TUDO OK (' + n + ' checks)' : 'MORTE SUBITA: ' + fails + ' FALHAS de ' + n);
process.exit(fails ? 1 : 0);
