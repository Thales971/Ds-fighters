// Jogador que só aperta botão, e um jogador que joga (IA 2), contra cada degrau.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const fake2d = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : String(k).startsWith('create') ? () => ({ addColorStop() {} }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const math = Object.create(Math);
math.random = mulberry32(1);
const ctx = {
  console: { log() {}, warn() {}, error() {} },
  Audio: class { play() { return Promise.resolve(); } pause() {} },
  Math: math, Date, JSON, Image: class { set src(v) { this._src = v; } }, URLSearchParams,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: true, difficulty: 0 }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: (k) => (k === 'difficulty' ? 0 : null), reducedMotion: () => true, record() {}, grantAchievement: () => false, hasAchievement: () => true, recordSurvivalBy() {}, recordWinBy() {}, recordStage() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; }, save() {} },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0, releaseAll() {} },
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

const out = vm.runInContext(`(() => {
  function seed(n) {
    let a = n >>> 0;
    Math.random = function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const none = PETS.find((p) => p.id === 'none') || PETS[0];
  const cv = { width: 960, height: 540, getContext: () => (${fake2d.toString()})(), classList: { toggle() {}, add() {}, remove() {} } };
  const blank = () => {
    const o = { left: false, right: false, down: false, up: false, punch: false, kick: false, tag: false };
    for (let i = 0; i < 10; i++) o['a' + i] = false;
    return o;
  };
  function play(opp, diff, style, salt) {
    seed(salt);
    const boss = opp === 'kernor';
    const g = new Game(cv);
    g.start({ mode: 'arcade', teams: [['emilio'], [opp]], stage: 'torneio-praca-hello-world', cpu: [style === 'solid', true], difficulty: 0, cpuDifficulty: diff, roundsToWin: 1, timer: boss ? 120 : 80, pets: [none, none], bossFight: boss });
    if (style === 'solid') g.teams[0].members[0].aiLevel = 2;
    const cpu = g.teams[1].members[0];
    let atk = 0, blk = 0, cast = 0, idle = 0, fight = 0;
    Input.read = () => {
      const me = g.teams[0].members[0];
      const them = g.teams[1].members[0];
      const o = blank();
      if (them.x >= me.x) o.right = true; else o.left = true;
      const t = g.time % 16;
      if (t < 5) o.punch = true;
      else if (t < 9) o.kick = true;
      return o;
    };
    let n = 0;
    while (g.running && n++ < 16000) {
      g.tick();
      if (g.roundState !== 'fight') continue;
      fight++;
      if (cpu.state === 'attack' || cpu.state === 'rush') atk++;
      else if (cpu.state === 'block') blk++;
      else if (cpu.state === 'cast') cast++;
      else if (cpu.state === 'idle') idle++;
    }
    const pw = g.teamWins[0] > g.teamWins[1];
    return { opp, diff, style, win: pw, draw: g.teamWins[0] === g.teamWins[1], pHp: Math.round(g.teams[0].members[0].hp), cHp: Math.round(cpu.hp), level: cpu.aiLevel, tune: !!cpu.aiTune, atk, blk, cast, idle, fight, dmg: cpu.bossDmg || cpu.tourneyDmg || 1 };
  }
  const rungs = [
    ['larper', 1, 'medio'],
    ['rafael', 2, 'dificil'],
    ['lyra', 3, 'extremo'],
    ['kernor', 3, 'kernor'],
  ];
  const reps = 4;
  const rows = [];
  for (const [opp, diff, name] of rungs) {
    for (const style of ['mash', 'solid']) {
      let win = 0;
      const samples = [];
      for (let i = 0; i < reps; i++) {
        const r = play(opp, diff, style, (diff * 100 + i * 17 + (style === 'mash' ? 3 : 9)) >>> 0);
        if (r.win) win++;
        samples.push(r);
      }
      rows.push({ name, opp, diff, style, win, reps, samples });
    }
  }
  return rows;
})()`, ctx);

for (const row of out) {
  const s = row.samples[0];
  console.log(row.style.padEnd(5), row.name.padEnd(8), row.win + '/' + row.reps, 'ia=' + s.level, 'tune=' + s.tune, 'dmg=' + s.dmg, 'atk=' + s.atk, 'blk=' + s.blk, 'cast=' + s.cast, 'idle=' + s.idle, 'php=' + s.pHp, 'chp=' + s.cHp);
}
const mash = Object.fromEntries(out.filter((r) => r.style === 'mash').map((r) => [r.name, r.win / r.reps]));
const solid = Object.fromEntries(out.filter((r) => r.style === 'solid').map((r) => [r.name, r.win / r.reps]));
console.log('MASH', JSON.stringify(mash));
console.log('SOLID', JSON.stringify(solid));
const hardMash = mash.dificil <= 0.25;
const extMash = mash.extremo === 0 && mash.kernor === 0;
const solidBand = solid.medio >= 0.5 && solid.dificil <= 0.75 && solid.extremo <= 0.5 && solid.kernor <= 0.5;
console.log(hardMash && extMash ? 'MASH perde do dificil em diante' : 'MASH ainda ganha demais');
console.log(solidBand ? 'SOLID na faixa' : 'SOLID fora da faixa');
process.exit(hardMash && extMash ? 0 : 1);
