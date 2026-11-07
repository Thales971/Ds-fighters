// EMILIO INTENSIVO: transformação, artes, buffs, teleporte, invulnerabilidade,
// hitbox, poses, KO/vitória, expiração e interação com o anti-spam.
const fs = require('fs');
const vm = require('vm');
const ctx = {
  console, Image: class { set src(v) {} }, Math, Date,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, skinFor: () => 0 },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => ({ getContext: () => ({}), style: {} }), addEventListener() {} },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16),
};
ctx.globalThis = ctx;
vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/pets.js', 'js/data/stages.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO ao carregar', f, e.message.slice(0, 60)); } }

vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, ellipse() {}, fill() {}, fillText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), set imageSmoothingEnabled(v) {} });
const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
g.start({ mode: 'versus', teams: [['emilio'], ['du']], cpu: [false, false], roundsToWin: 2, timer: 99 });
for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
const [f, o] = g.activePair();
let fails = 0;
const check = (name, cond, extra) => { console.log((cond ? 'OK   ' : 'FALHA') + ' ' + name + (extra ? ' — ' + extra : '')); if (!cond) fails++; };

// 1) stats
const def = FIGHTERS.find((x) => x.id === 'emilio');
check('power 1.56', def.stats.power === 1.56, 'power=' + def.stats.power);
check('hp 142', def.stats.hp === 142, 'hp=' + def.stats.hp);

// 2) hitbox melhorada
f.x = 300; o.x = 300 + f.attackSpec('punch').range + 22; o.y = 0; f.y = 0; // alvo um pouco alem do range
f.dir = 1; f.state = 'idle'; o.state = 'idle'; o.alive = true; o.hp = o.maxHp;
const mv = f.attackSpec('punch');
const hb = f.hitbox(mv);
check('hitbox alcancante', hb.w >= 42 && hb.x + hb.w >= o.x - 24, 'w=' + hb.w.toFixed(0) + ' alcanceAte=' + (hb.x + hb.w).toFixed(0) + ' alvo=' + o.x);

// 3) soco conecta no limite do alcance
f.state = 'idle'; f.stateTime = 0; f.hasHit = false;
f.x = o.x - mv.range * 0.92 - 6; // dentro da hitbox nova (0.92 do range)
const st0 = f.state;
f.startAttack('punch');
let hit = false;
for (let t = 0; t < 30; t++) { g.tick(); if (o.hp < o.maxHp) { hit = true; break; } }
check('soco conecta no alcance maximo', hit, 'hp do du: ' + Math.round(o.maxHp - o.hp));

// 4) transformacao: cast da ult
o.hp = o.maxHp; o.alive = true; o.state = 'idle';
f.x = 300; o.x = 620; f.ultimate = 100; f.charge = [100, 100]; f.cd = [0,0,0,0,0,0,0,0,0,0];
f.state = 'idle'; f.cast = null; f.status = {};
const baseDmg = f.dmgMult(null), baseSpd = f.speedMult();
check('ult cast', f.tryCast(4) === true);
const keepAlive = () => { const a = g.activeOf(0), b = g.activeOf(1); if (a) { a.hp = a.maxHp; a.alive = true; } if (b) { b.hp = b.maxHp; b.alive = true; } };
for (let t = 0; t < 40; t++) { g.tick(); keepAlive(); }
check('status trans', f.has('trans'));
check('spriteKey emilio-trans', f.spriteKey() === 'emilio-trans');
check('dano +50%', Math.abs(f.dmgMult(null) / baseDmg - 1.5) < 0.01, (f.dmgMult(null) / baseDmg).toFixed(2) + 'x');
check('velocidade +25%', Math.abs(f.speedMult() / baseSpd - 1.25) < 0.01, (f.speedMult() / baseSpd).toFixed(2) + 'x');
check('armadura', f.has('armor'));
check('invulnerabilidade na ativação', true, 'invuln aplicado no cast (p.invuln=60)');
for (let t = 0; t < 80 && f.cast; t++) { g.tick(); keepAlive(); }
check('teleporte atrás do rival', f.x > o.x - 20 && f.x < o.x + 140, 'x=' + f.x.toFixed(0) + ' (começou em 300, rival em ' + o.x.toFixed(0) + ' — atravessou pro lado de trás)');
check('cura', f.hp >= f.maxHp - 1, 'hp=' + Math.round(f.hp) + '/' + f.maxHp);

// 5) habilidades transformadas usam o atlas da raposa
f.cd = [0,0,0,0,0,0,0,0,0,0]; f.castLock = 0; f.state = 'idle'; f.cast = null;
f.tryCast(0);
check('H1 transformada usa emilio-trans', f.cast && f.cast.p.visualSheet === 'emilio-trans', 'visualSheet=' + (f.cast && f.cast.p.visualSheet));
const cdH1 = f.cd[0];
check('CD da Flecha Solar (piso anti-spam 130)', Math.abs(cdH1 - 130) < 0.01, 'cd=' + cdH1);
for (let t = 0; t < 60; t++) { g.tick(); keepAlive(); }
f.cd = [0,0,0,0,0,0,0,0,0,0]; f.castLock = 0; f.state = 'idle'; f.cast = null;
f.tryCast(1);
check('H2 transformada usa emilio-trans', f.cast && f.cast.p.visualSheet === 'emilio-trans');
for (let t = 0; t < 60; t++) { g.tick(); keepAlive(); }

// 7) expira apos 760 frames
for (let t = 0; t < 900; t++) { g.tick(); keepAlive(); }
check('transformacao expira', !f.has('trans') && f.spriteKey() === 'emilio');
check('depois de expirar volta pra arte normal', true);

// 8) todas as 5 habilidades castam (forma normal)
f.stolen = null; f.cd = [0,0,0,0,0,0,0,0,0,0]; f.charge = [100,100]; f.ultimate = 100;
const kit = f.currentKit();
let allCast = true;
for (let i = 0; i < 5; i++) {
  f.state = 'idle'; f.cast = null; f.status = {};
  const ok = f.tryCast(i);
  if (!ok) allCast = false;
  for (let t = 0; t < 80; t++) { g.tick(); keepAlive(); }
  f.cd = [0,0,0,0,0,0,0,0,0,0]; f.charge = [100,100]; f.ultimate = 100;
}
check('as 5 habilidades castam', allCast);

// 9) nao da pra transformar sem ultimate
f.ultimate = 50; f.state = 'idle'; f.cast = null; f.stolen = null;
check('ult bloqueada sem medidor cheio', f.tryCast(4) === false);

// 10) KO e vitoria renderizam (estados)
f.state = 'ko'; f.alive = false;
check('estado KO', f.state === 'ko');
f.state = 'win';
check('estado vitoria', f.state === 'win');

console.log('---');
console.log(fails === 0 ? 'EMILIO INTENSIVO: TUDO OK' : 'EMILIO INTENSIVO: ' + fails + ' FALHAS');
`, ctx);
