// Aperta cada tecla de habilidade todo quadro. A recarga tem de segurar
// em versus, arcade, survival e treino (medidor infinito).
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const fake2d = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : String(k).startsWith('create') ? () => ({ addColorStop() {} }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
const ctx = {
  console: { log() {}, warn() {}, error() {} },
  Audio: class { play() { return Promise.resolve(); } pause() {} },
  Math, Date, JSON, Image: class { set src(v) { this._src = v; } }, URLSearchParams,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: true, difficulty: 0 }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => true, record() {}, grantAchievement: () => false, hasAchievement: () => true, recordSurvivalBy() {}, recordWinBy() {}, recordStage() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco: () => false, save() {} },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; }, pad: () => null, padCount: 0, releaseAll() {} },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: new Proxy({ hud: new Proxy({}, { get: () => () => {} }), pitocoSeq: [] }, { get: (t, k) => (k in t ? t[k] : () => {}) }),
  HUD: new Proxy({}, { get: () => () => {} }), Net: {},
  document: { getElementById: () => null, createElement: () => ({ getContext: () => fake2d(), width: 0, height: 0, style: {} }), querySelectorAll: () => [], querySelector: () => null, addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {}, contains: () => false }, dataset: {} } },
  window: { addEventListener() {}, matchMedia: () => ({ matches: true }) }, navigator: { userAgent: 'node' }, location: { search: '', hash: '' },
  setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0,
};
ctx.globalThis = ctx;
vm.createContext(ctx);
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"?]+)/g)].map((m) => m[1]).filter((f) => /^(assets\/sprites|js\/data|js\/engine)\//.test(f)).filter((f) => !/engine\/(audio|input)\.js$/.test(f));
for (const f of files) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });

function run(mode, who, hold) {
  return vm.runInContext(`(() => {
    const none = PETS.find((p) => p.id === 'none') || PETS[0];
    const cv = { width: 960, height: 540, getContext: () => (${fake2d.toString()})(), classList: { toggle() {}, add() {}, remove() {} } };
    const g = new Game(cv);
    g.start({ mode: ${JSON.stringify(mode)}, teams: [[${JSON.stringify(who)}], ['larper']], stage: 'treino-dojo', cpu: [false, true], difficulty: 1, roundsToWin: 1, timer: 99, pets: [none, none], infiniteMeter: ${mode === 'training'} });
    const me = g.teams[0].members[0];
    const casts = [];
    const orig = me.startCast.bind(me);
    me.startCast = function (i, p) { casts.push({ i, t: g.fightFrames, slot: p.slot }); return orig(i, p); };
    const blank = () => { const o = { left: false, right: false, down: false, up: false, punch: false, kick: false, tag: false }; for (let k = 0; k < 10; k++) o['a' + k] = false; return o; };
    let cur = blank();
    Input.read = () => cur;
    let frames = 0;
    while (g.roundState !== 'fight' && frames++ < 200) g.tick();
    me.charge = [100, 100];
    me.ultimate = 100;
    const start = g.fightFrames;
    for (let i = 0; i < 420; i++) {
      const o = blank();
      ${hold}
      cur = o;
      g.tick();
      me.charge = [100, 100];
      me.ultimate = 100;
    }
    const mine = casts.filter((c) => c.t >= start);
    const gap = (pred) => {
      const list = mine.filter(pred);
      let min = 999;
      for (let i = 1; i < list.length; i++) min = Math.min(min, list[i].t - list[i - 1].t);
      return min;
    };
    let any = 999;
    for (let i = 1; i < mine.length; i++) any = Math.min(any, mine[i].t - mine[i - 1].t);
    return { n: mine.length, any, same0: gap((c) => c.i === 0), same2: gap((c) => c.i === 2), same4: gap((c) => c.i === 4) };
  })()`, ctx);
}

for (const mode of ['versus', 'arcade', 'survival', 'training']) {
  const one = run(mode, 'ponteiro', 'o.a0 = true;');
  check(mode + ': a mesma habilidade espera a recarga', one.same0 >= 90, JSON.stringify(one));
}
const rot = run('versus', 'emilio', 'o.a0 = true; o.a1 = true;');
check('emilio (chain): H1 e H2 não saem colados', rot.any >= 70, JSON.stringify(rot));
const ult = run('training', 'ponteiro', 'o.a4 = true;');
check('ultimate no treino com medidor infinito espera a recarga', ult.same4 >= 120, JSON.stringify(ult));
const charge = run('training', 'ponteiro', 'o.a2 = true;');
check('carga no treino com medidor infinito espera a recarga', charge.same2 >= 80, JSON.stringify(charge));
const scaled = vm.runInContext(`(() => {
  const none = PETS.find((p) => p.id === 'none') || PETS[0];
  const cv = { width: 960, height: 540, getContext: () => (${fake2d.toString()})(), classList: { toggle() {}, add() {}, remove() {} } };
  const g = new Game(cv);
  g.start({ mode: 'versus', teams: [['ponteiro'], ['larper']], stage: 'treino-dojo', cpu: [false, true], roundsToWin: 1, timer: 99, pets: [none, none] });
  let frames = 0;
  while (g.roundState !== 'fight' && frames++ < 200) g.tick();
  const me = g.teams[0].members[0];
  const foe = g.teams[1].members[0];
  foe.hitstun = 0;
  const before = foe.hp;
  foe.takeHit(20, { attacker: me, stun: 40, height: 'mid' });
  const first = before - foe.hp;
  foe.hitstun = 30;
  const mid = foe.hp;
  foe.takeHit(20, { attacker: me, stun: 40, height: 'mid' });
  return { first, second: mid - foe.hp };
})()`, ctx);
check('o segundo golpe do mesmo combo causa menos dano', scaled.second > 0 && scaled.second < scaled.first - 0.5, JSON.stringify(scaled));
const mult = vm.runInContext('ABILITY_CD_MULT', ctx);
check('o multiplicador global de recarga está ligado', mult >= 2, String(mult));
console.log(fails ? fails + ' falhas' : n + '/' + n + ' ok');
/* ANTI-SPAM por "calor": habilidade atras de habilidade (humano) perde dano,
   atordoamento e duracao de efeitos; CPU e quem respira entre elas nao. */
const heat = vm.runInContext(`(() => {
  const none = PETS.find((p) => p.id === 'none') || PETS[0];
  const cv = { width: 960, height: 540, getContext: () => (${fake2d.toString()})(), classList: { toggle() {}, add() {}, remove() {} } };
  const g = new Game(cv);
  g.start({ mode: 'versus', teams: [['jess'], ['larper']], stage: 'treino-dojo', cpu: [false, true], difficulty: 1, roundsToWin: 1, timer: 99, pets: [none, none] });
  const me = g.teams[0].members[0], cpu = g.teams[1].members[0];
  const go = (f, gap) => { for (let k = 0; k < 5; k++) { f.frame = (f.frame || 0) + gap; f.state = 'idle'; f.cast = null; f.castLock = 0; f.spamShared = 0; f.cd = f.cd.map(() => 0); f.tryCast(0); } };
  const m0 = me.spamDmgMult();
  go(me, 120);
  const hot = { heat: me.spamHeat, mult: me.spamDmgMult(), dmgHot: me.dmgMult({}), dmgBasic: me.dmgMult() };
  go(cpu, 120);
  const calm = g.teams[0].members[0];
  calm.spamHeat = 0; go(calm, 260);
  return { m0, hot, cpuHeat: cpu.spamHeat || 0, calmHeat: calm.spamHeat };
})()`, ctx);
check('anti-spam: 5 habilidades coladas esquentam e cortam o dano', heat.m0 === 1 && heat.hot.heat >= 3 && heat.hot.mult < 0.7 && heat.hot.dmgHot < heat.hot.dmgBasic, JSON.stringify(heat));
check('anti-spam: CPU nao esquenta; quem espera ~3s entre habilidades tambem nao', heat.cpuHeat === 0 && heat.calmHeat === 0, JSON.stringify(heat));
/* MIS: a vertigem da ult inverte os controles da CPU (a tela so vira pro humano) */
const vert = vm.runInContext(`(() => {
  const none = PETS.find((p) => p.id === 'none') || PETS[0];
  const cv = { width: 960, height: 540, getContext: () => (${fake2d.toString()})(), classList: { toggle() {}, add() {}, remove() {} } };
  const out = {};
  for (const v of [false, true]) {
    const g = new Game(cv);
    g.start({ mode: 'versus', teams: [['mis'], ['jess']], stage: 'treino-dojo', cpu: [false, true], difficulty: 2, roundsToWin: 1, timer: 99, pets: [none, none] });
    for (let i = 0; i < 300 && g.roundState !== 'fight'; i++) g.tick();
    const m = g.activeOf(0), c = g.activeOf(1);
    m.x = 300; c.x = 700;
    let toward = 0;
    for (let i = 0; i < 90; i++) { if (v) c.status.vertigo = c.now + 60; const x0 = c.x; g.tick(); if (c.x < x0 - 0.5) toward++; }
    out[v ? 'com' : 'sem'] = toward;
  }
  return out;
})()`, ctx);
check('Mis: vertigem inverte os controles da CPU', vert.sem > 30 && vert.com < vert.sem / 3, JSON.stringify(vert));
process.exit(fails ? 1 : 0);
