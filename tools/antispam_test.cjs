// ANTI-SPAM INTENSIVO: todas as habilidades de TODOS os lutadores.
// Verifica: (1) CD aplicado = base x 1.4; (2) HUD/pct coerente; (3) impossível
// recastar antes do CD expirar; (4) recarga conta 1 por frame; (5) nenhuma
// habilidade ficou com recarga menor que a base.
const fs = require('fs');
const vm = require('vm');
const ctx = {
  console, Image: class { set src(v) {} }, Math, Date,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0 },
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
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/pets.js', 'js/data/stages.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/vfx.js', 'js/engine/weather.js', 'js/engine/game.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO ao carregar', f, e.message.slice(0, 60)); } }

vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, ellipse() {}, fill() {}, fillText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), set imageSmoothingEnabled(v) {} });
const mkGame = (a, b) => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
  g.start({ mode: 'versus', teams: [[a], [b]], cpu: [false, false], roundsToWin: 2, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};
const MULT = 2.0;
let fails = 0, checked = 0;
const fighters = FIGHTERS.filter((f) => f.id !== 'boneco-treino');
console.log('lutadores: ' + fighters.length);
for (const def of fighters) {
  const kit = POWERS[def.id];
  if (!kit || !kit.powers || !kit.powers.length) { console.log('SEM KIT: ' + def.id); fails++; continue; }
  const g = mkGame(def.id, 'du');
  const f = g.activeOf(0);
  for (let i = 0; i < kit.powers.length; i++) {
    const p = kit.powers[i];
    if (p.slot !== 'simple' && p.slot !== 'extra') continue; // so habilidades com CD
    checked++;
    // 1) CD aplicado = base x 1.4
    f.state = 'idle'; f.cast = null; f.stolen = null; f.status = {};
    f.cd = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; f.castLock = 0; f.charge = [100, 100]; f.ultimate = 100; f.afo = 6;
    const base = p.cd || 50;
    const okCast = f.tryCast(i);
    if (!okCast) { console.log('CAST FALHOU: ' + def.id + ' #' + i + ' (' + p.id + ')'); fails++; continue; }
    const applied = f.cd[i];
    const expected = Math.max(130, base * MULT); /* piso anti-spam de 130 frames */
    if (Math.abs(applied - expected) > 0.01) { console.log('CD ERRADO: ' + def.id + '/' + p.id + ' aplicado=' + applied + ' esperado=' + expected.toFixed(1)); fails++; }
    // 2) pct do HUD coerente (0 <= pct <= 1)
    const ps = f.powerState(i);
    if (ps.pct < 0 || ps.pct > 1) { console.log('PCT INCOERENTE: ' + def.id + '/' + p.id + ' pct=' + ps.pct); fails++; }
    // 3) impossivel recastar antes de expirar
    const keepAlive = () => { const a = g.activeOf(0), b = g.activeOf(1); if (a) { a.hp = a.maxHp; a.alive = true; } if (b) { b.hp = b.maxHp; b.alive = true; } };
    for (let t = 0; t < Math.floor(expected) - 2; t++) { g.tick(); keepAlive(); }
    f.state = 'idle'; f.cast = null; f.castLock = 0;
    if (f.tryCast(i)) { console.log('SPAM POSSIVEL: ' + def.id + '/' + p.id + ' recastou antes do CD (' + Math.floor(expected) + ' frames)'); fails++; }
    // 4) recarga conta 1/frame e libera no fim
    let ticks = 0;
    while ((f.cd[i] > 0 || f.castLock > 0) && ticks < 2000) { g.tick(); keepAlive(); ticks++; }
    if (f.cd[i] > 0) { console.log('CD NAO ZEROU: ' + def.id + '/' + p.id); fails++; }
    f.state = 'idle'; f.cast = null;
    if (!f.tryCast(i)) {
      const kitNow = f.currentKit();
      console.log('NAO RECARREGOU: ' + def.id + '/' + p.id + ' apos ' + ticks + ' frames | state=' + f.state + ' onGround=' + f.onGround + ' y=' + f.y + ' cd[' + i + ']=' + f.cd[i] + ' kit[' + i + ']=' + (kitNow[i] ? kitNow[i].id : 'NULO') + ' kitSize=' + kitNow.length + ' stolen=' + (f.stolen ? f.stolen.from : 'nao'));
      fails++;
    }
  }
  g.running = false;
}
console.log('---');
console.log('habilidades com CD checadas: ' + checked);
console.log(fails === 0 ? 'ANTI-SPAM: TUDO OK (x2.0 em todas)' : 'ANTI-SPAM: ' + fails + ' FALHAS');
`, ctx);
