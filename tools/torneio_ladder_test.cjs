// Chave fixa do torneio e a dificuldade que a CPU realmente usa.
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
  const order = ['larper', 'cyber-psicopata', 'rafael', 'dev-senior', 'lyra', 'nimbo', 'kernor'];
  const diffs = [1, 1, 2, 2, 3, 3, 3];
  const ladderOk = TORNEIO_LADDER.length === 7 && TORNEIO_LADDER.every((r, i) => r.id === order[i] && r.diff === diffs[i]);
  const none = PETS.find((p) => p.id === 'none') || PETS[0];
  const cv = { width: 960, height: 540, getContext: () => (${fake2d.toString()})(), classList: { toggle() {}, add() {}, remove() {} } };
  const activity = (opp, diff) => {
    const g = new Game(cv);
    g.start({ mode: 'arcade', teams: [['emilio'], [opp]], stage: 'torneio-praca-hello-world', cpu: [false, true], difficulty: 0, cpuDifficulty: diff, roundsToWin: 1, timer: 99, pets: [none, none], bossFight: opp === 'kernor' });
    let atk = 0, move = 0, abi = 0;
    for (let i = 0; i < 280; i++) {
      g.tick();
      if (g.roundState !== 'fight') continue;
      const inp = g.inputFor(1);
      if (inp.punch || inp.kick) atk++;
      if (inp.left || inp.right) move++;
      for (let k = 0; k < 10; k++) if (inp['a' + k]) abi++;
    }
    const cpu = g.teams[1].members[0];
    return { level: cpu.aiLevel, hp: cpu.maxHp, atk, move, abi, boss: !!cpu.bossPhase };
  };
  const rows = order.map((id, i) => Object.assign({ id, want: diffs[i] }, activity(id, diffs[i])));
  const fauna = TORNEIO.stages.map((id) => {
    const s = STAGE_LIST.find((x) => x.id === id);
    const g = new Game(cv);
    g.start({ mode: 'versus', teams: [['emilio'], ['larper']], stage: id, cpu: [false, false], roundsToWin: 1, timer: 99, pets: [none, none] });
    const live = g.stage.liveFauna ? g.stage.liveFauna.animals.length : 0;
    const bats = g.stage.fauna ? g.stage.fauna.length : 0;
    return { id, animals: live + bats, flora: g.stage.flora.length, weather: g.weather.kind, lights: (s.lights || []).length };
  });
  return { ladderOk, rows, fauna };
})()`, ctx);

check('chave fixa na ordem pedida', out.ladderOk, JSON.stringify(out.rows.map((r) => r.id + ':' + r.want)));
for (const r of out.rows) {
  check(r.id + ' usa IA ' + r.want + ' (menu em Fácil não derruba)', r.level === r.want, 'aiLevel ' + r.level);
  check(r.id + ' não fica parado', r.move + r.atk >= 15, 'andar ' + r.move + ' golpes ' + r.atk + ' habilidades ' + r.abi);
}
const med = out.rows.filter((r) => r.want === 1).reduce((s, r) => s + r.atk + r.abi, 0);
const ext = out.rows.filter((r) => r.want === 3).reduce((s, r) => s + r.atk + r.abi, 0);
check('extremo agride mais que o médio', ext > med, 'medio ' + med + ' extremo ' + ext);
const kern = out.rows.find((r) => r.id === 'kernor');
check('Kernor chefe tem 2000 de vida', kern && kern.hp === 2000 && kern.boss, kern && kern.hp);
for (const f of out.fauna) check(f.id + ' tem bicho, planta, clima e luz', f.animals > 0 && f.flora > 0 && f.weather && f.lights > 0, JSON.stringify(f));
console.log(out.rows.map((r) => r.id + ' ia=' + r.level + ' andar=' + r.move + ' golpes=' + r.atk + ' hab=' + r.abi + ' hp=' + r.hp).join('\n'));
console.log(fails ? fails + ' falhas' : n + '/' + n + ' ok');
process.exit(fails ? 1 : 0);
