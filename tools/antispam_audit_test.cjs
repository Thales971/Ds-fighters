// AUDITORIA ANTI-SPAM REAL: instrumenta Fighter.prototype.startCast durante
// partidas IA x IA de verdade em cada modo e mede, por lutador:
//  - intervalo minimo entre casts do MESMO slot (>= piso do perfil / 90 carga / 150 ult)
//  - intervalo minimo entre QUALQUER dois casts (>= castLock do perfil)
//  - casts feitos com cd[i] > 0 (furaria o anti-spam) — so o assist de tag faz isso (cd zerado depois)
const fs = require('fs'), vm = require('vm');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const ctx = { console, Image: class { set src(v) {} }, Math, Date,
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho', 'maximilian'], data: { settings: { reducedMotion: false, quality: 'medium' }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting(k, v) { if (v === undefined) return this.data.settings[k]; this.data.settings[k] = v; return v; }, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: { room: null, score: null, takeRemote: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }) },
  AI: null,
  document: { getElementById: () => null, createElement: () => ({ getContext: () => ({}), style: {} }), querySelectorAll: () => [], addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} }, dataset: {} } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/fighters-dev-virado.js', 'js/data/fighters-milena.js', 'js/data/fighters-kira.js', 'js/data/fighters-cracker.js', 'js/data/fighters-rafael.js', 'js/data/balance.js', 'js/data/roster-portraits.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, String(e).slice(0, 80)); } }

const r = vm.runInContext(`
(function(){
  const AUDIT = [];
  const FighterCls = Fighter;
  const origStart = FighterCls.prototype.startCast;
  FighterCls.prototype.startCast = function(i, p) {
    const prof = this.spamProfile();
    AUDIT.push({
      mode: this.game.mode, fid: this.def.id, who: this.team + ':' + this.slot,
      slot: p.slot, kind: p.kind || '', i, t: this.game.time, round: this.game.round,
      cdBefore: this.cd[i] || 0, floor: prof.floor, lock: prof.castLock, shared: prof.shared,
      assist: !!this.assistT,
    });
    return origStart.call(this, i, p);
  };
  const fake2d = () => ({ canvas: null, save(){}, restore(){}, clearRect(){}, fillRect(){}, drawImage(){}, translate(){}, scale(){}, rotate(){}, beginPath(){}, moveTo(){}, lineTo(){}, closePath(){}, quadraticCurveTo(){}, ellipse(){}, arc(){}, fill(){}, stroke(){}, fillText(){}, strokeText(){}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop(){} }), createRadialGradient: () => ({ addColorStop(){} }), createPattern: () => ({}), getImageData: () => ({ data: new Uint8ClampedArray(4) }), putImageData(){} });
  const mkGame = (mode, extra) => {
    const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), classList: { toggle(){}, add(){}, remove(){} } });
    const cfg = Object.assign({ mode, teams: [['kira'], ['rafael']], stage: 'treino-dojo', cpu: [true, true], roundsToWin: 1, timer: 99, difficulty: 2 }, extra || {});
    g.start(cfg);
    return g;
  };
  const runMode = (mode, extra, ticks) => {
    AUDIT.length = 0;
    const g = mkGame(mode, extra);
    let err = null;
    try { for (let t = 0; t < ticks && !g.matchOver; t++) g.tick(); } catch (e) { err = e.message; }
    return { mode, err, ticks: g.time, events: AUDIT.slice() };
  };
  const modes = [
    runMode('versus', null, 5400),
    runMode('training', { teams: [['kira'], ['boneco-treino']], dummy: 'cpu', autoHeal: true }, 5400),
    runMode('arcade', { teams: [['kira'], ['rafael']] }, 5400),
    runMode('tag', { teams: [['kira', 'cracker'], ['rafael', 'milena']] }, 5400),
    runMode('survival', { teams: [['kira'], ['rafael']] }, 7200),
    runMode('morte-subita', { teams: [['kira'], ['rafael']], roundsToWin: 1 }, 5400),
    runMode('demo', { teams: [['cracker'], ['rafael']] }, 5400),
  ];
  // analise: por (who, slot) gap minimo entre casts consecutivos; por who gap global >= lock
  const analysis = modes.map((m) => {
    const byWhoSlot = {}, byWho = {}, furadas = [];
    for (const e of m.events) {
      const ks = e.who + '|i' + e.i + '|' + e.slot;
      if (!byWhoSlot[ks]) byWhoSlot[ks] = [];
      byWhoSlot[ks].push(e);
      (byWho[e.who] = byWho[e.who] || []).push(e);
      if (e.cdBefore > 0 && !e.assist) furadas.push(e.mode + ' ' + e.fid + ' slot=' + e.slot + ' cdBefore=' + e.cdBefore + ' t=' + e.t);
    }
    const slotMin = {};
    for (const ks in byWhoSlot) {
      const evs = byWhoSlot[ks].sort((a, b) => a.t - b.t);
      let mn = Infinity;
      for (let k = 1; k < evs.length; k++) { if (evs[k].round === evs[k - 1].round) mn = Math.min(mn, evs[k].t - evs[k - 1].t); }
      const e0 = evs[0];
      const piso = e0.slot === 'ultimate' ? 150 : e0.slot === 'charge' ? 90 : e0.floor;
      slotMin[ks] = { n: evs.length, min: mn === Infinity ? -1 : mn, piso, lock: e0.lock, fid: e0.fid, slot: e0.slot, i: e0.i };
    }
    const lockMin = {};
    for (const w in byWho) {
      const evs = byWho[w].sort((a, b) => a.t - b.t);
      let mn = Infinity;
      for (let k = 1; k < evs.length; k++) { if (evs[k].round === evs[k - 1].round) mn = Math.min(mn, evs[k].t - evs[k - 1].t); }
      lockMin[w] = { n: evs.length, min: mn === Infinity ? -1 : mn, lock: evs[0].lock, fid: evs[0].fid };
    }
    // trava COMPARTILHADA: min gap entre casts de simples/extras (qualquer indice) do mesmo lutador
    const sharedMin = {};
    for (const w in byWho) {
      const evs = byWho[w].filter((e) => e.slot === 'simple' || e.slot === 'extra').sort((a, b) => a.t - b.t);
      let mn = Infinity;
      for (let k = 1; k < evs.length; k++) { if (evs[k].round === evs[k - 1].round) mn = Math.min(mn, evs[k].t - evs[k - 1].t); }
      if (evs.length) sharedMin[w] = { n: evs.length, min: mn === Infinity ? -1 : mn, shared: evs[0].shared, fid: evs[0].fid };
    }
    return { mode: m.mode, err: m.err, ticks: m.ticks, nEvents: m.events.length, slotMin, lockMin, sharedMin, furadas };
  });
  return JSON.stringify(analysis);
})()`, ctx);

const A = JSON.parse(r);
for (const m of A) {
  const badSlots = Object.entries(m.slotMin).filter(([, v]) => v.min >= 0 && v.min < v.piso - 10).map(([k, v]) => k + ' min=' + v.min + '<piso' + v.piso + ' (' + v.n + ' casts)');
  const badLock = Object.entries(m.lockMin).filter(([, v]) => v.min >= 0 && v.min < v.lock - 8).map(([k, v]) => k + ' min=' + v.min + '<lock' + v.lock);
  const badShared = Object.entries(m.sharedMin || {}).filter(([, v]) => v.min >= 0 && v.min < v.shared - 10).map(([k, v]) => k + ' min=' + v.min + '<shared' + v.shared);
  check(`[${m.mode}] ${m.nEvents} casts em ${m.ticks}f sem erro — nenhum slot abaixo do piso`, !m.err && badSlots.length === 0, badSlots.join('; ') || 'todos >= piso');
  check(`[${m.mode}] trava global respeitada entre casts consecutivos do mesmo lutador`, badLock.length === 0, badLock.join('; ') || 'ok');
  check(`[${m.mode}] anti-spam COMPARTILHADO: simples/extras nao saem antes do piso global (sem rotacao H1->H2->H3)`, badShared.length === 0, badShared.join('; ') || Object.entries(m.sharedMin || {}).map(([k, v]) => k + '=' + (v.min < 0 ? '-' : v.min) + 'f/' + v.shared).join(' '));
  check(`[${m.mode}] nenhum cast com cooldown ativo (furo de anti-spam)`, m.furadas.length === 0, m.furadas.slice(0, 5).join('; ') || 'ok');
}
// resumo por modo/slot para o log
const resumo = A.map((m) => m.mode + ': ' + Object.entries(m.slotMin).map(([k, v]) => k.split('|')[1] + '=' + (v.min < 0 ? '-' : v.min) + 'f/' + v.piso).join(' ')).join('\n');
console.log('--- resumo min-gap por slot (min/piso):'); console.log(resumo);
console.log('---');
console.log('AUDITORIA ANTI-SPAM POR MODO: ' + (fails ? fails + ' FALHAS de ' + n : 'TUDO OK (' + n + ' checks)'));
process.exit(fails ? 1 : 0);
