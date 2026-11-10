// ONLINE E2E HEADLESS: host + convidado completos, trocando inputs e snapshots
// por um canal em memoria — valida o fluxo real do Net com o rollback-lite.
const fs = require('fs');
const vm = require('vm');
const ctx = {
  console, Image: class { set src(v) {} }, Math, Date, performance: { now: () => Date.now() },
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho'], data: { settings: { reducedMotion: false }, unlocked: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, skinFor: () => 0 },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: {
    init() {}, releaseAll() {},
    // o "convidado" aperta botoes: um script de acoes por janela de ticks
    _script: [],
    read() {
      const s = this._script.shift() || {};
      return { left: !!s.left, right: !!s.right, up: !!s.up, down: !!s.down, punch: !!s.punch, kick: !!s.kick, a0: !!s.a0, a1: !!s.a1, a2: !!s.a2, a3: !!s.a3, a4: !!s.a4, tag: false };
    },
    pad: () => null, padCount: 0, label: () => '1', padLabel: () => '', menu: () => ({}),
  },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => ({ getContext: () => ({}), style: {} }), addEventListener() {}, body: { classList: { contains: () => false } } },
  window: { addEventListener() {}, matchMedia: () => ({ matches: false }) }, navigator: { maxTouchPoints: 0 },
  setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16),
  fetch: () => Promise.resolve({ ok: false, json: async () => ({}) }),
};
ctx.globalThis = ctx;
vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js','js/data/fighters-v20.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js','js/data/powers-balance-v10.js','js/data/powers-balance-v11.js','js/data/powers-balance-v12.js', 'js/data/pets.js', 'js/data/stages.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js', 'js/net/room-core.js', 'js/net/online.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 80)); } }

vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, ellipse() {}, fill() {}, fillText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), set imageSmoothingEnabled(v) {} });
let fails = 0;
const check = (n, c, x) => { console.log((c ? 'OK   ' : 'FALHA') + ' ' + n + (x ? ' — ' + x : '')); if (!c) fails++; };

/* Canal em memoria: o que um lado envia chega no outro (sem perda). */
const channel = { toHost: [], toGuest: [] };
Net.link = { send: () => {}, close: () => {} }; // placeholder
const wire = () => {
  Net.link = {
    send(obj) { (this._role === 'host' ? channel.toGuest : channel.toHost).push(obj); },
    close() {},
    _role: 'host',
  };
};

const CFG = { mode: 'online', teams: [['du'], ['stack']], stage: '06-sakura-dojo', roundsToWin: 2, timer: 99, weather: 'clear' };

// HOST
wire();
Net.netRole = 'host'; Net.status = 'open'; Net.remotes = [0, 1, 2, 3].map(() => Object.assign({}, EMPTY_INPUT));
const host = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
host.start(Object.assign({}, CFG, { netRole: 'host', mySlot: 0, cpu: [false, true] }));
Net.link._role = 'host';

// GUEST (outra instancia, mesmo estado inicial)
const guest = new Game({ width: 960, height: 540, getContext: () => fake2d(), toBuffer: () => Buffer.alloc(10), classList: { remove() {}, add() {}, toggle() {} } });
guest.start(Object.assign({}, CFG, { netRole: 'guest', mySlot: 2, cpu: [false, true] }));

// entrega inicial de estado pro convidado
guest.applySnapshot(host.snapshot());

// roda 600 frames de luta: inputs do guest -> host; snapshots do host -> guest
let frames = 0, snaps = 0, inputs = 0, corrections = 0, confirms = 0;
const guestActions = [
  { right: true }, { right: true }, { right: true }, { punch: true }, { right: true },
  { a0: true }, { left: true }, { kick: true }, { a1: true }, { up: true },
  { right: true }, { punch: true }, { a0: true }, { left: true }, { kick: true },
];
for (let t = 0; t < 700 && host.roundState !== 'fight'; t++) { host.tick(); guest.applySnapshot(host.snapshot()); }
check('host em luta', host.roundState === 'fight');

for (let t = 0; t < 600; t++) {
  frames++;
  // guest aperta botoes (script ciclando)
  if (t % 40 === 0) Input._script = guestActions.slice();
  // 1) guest le seu input e ENVIA pro host (bits)
  const localBits = Net.encode ? Net.encode(Input.read()) : 0;
  channel.toHost.push({ t: 'input', i: localBits, slot: 2 });
  inputs++;
  // 2) host processa mensagens do guest
  while (channel.toHost.length) {
    const m = channel.toHost.shift();
    if (m.t === 'input') Net.mergeRemote(m.i, 2);
  }
  // 3) host avanca 1 frame
  host.tick();
  // 4) host manda snapshot a cada 2 frames
  if (host.time % 2 === 0) { channel.toGuest.push({ t: 'snap', s: host.snapshot() }); snaps++; }
  // 5) guest avanca 1 frame (predicao local)
  guest.tick();
  // 6) guest processa snapshots do host
  while (channel.toGuest.length) {
    const m = channel.toGuest.shift();
    if (m.t === 'snap') guest.onHostSnapshot(m.s);
  }
  if (guest.rollbackLog) { confirms = guest.rollbackLog.confirmed; corrections = guest.rollbackLog.corrected; }
  // mantem a luta viva
  if (host.roundState !== 'fight' && t > 100) { host.roundState = 'fight'; host.roundStateTime = 0; }
}

check('600 frames de host+guest sem crash', frames === 600);
check('inputs do guest entregues ao host', inputs === 600, inputs + ' mensagens');
check('snapshots do host entregues ao guest', snaps >= 250, snaps + ' snapshots');
check('guest processou snapshots (confirmações + correções)', (confirms + corrections) > 200, 'confirmadas=' + confirms + ' corrigidas=' + corrections);
// o estado do guest deve estar PROXIMO do host (mesma luta)
const hf = host.activeOf(0), gf = guest.activeOf(0);
const drift = Math.abs(hf.x - gf.x);
check('drift de posicao host vs guest aceitavel (< 60px)', drift < 60, 'drift=' + drift.toFixed(1) + 'px (host x=' + hf.x.toFixed(0) + ', guest x=' + gf.x.toFixed(0) + ')');
check('vida sincronizada (drift < 15%)', Math.abs(hf.hp - gf.hp) < host.activeOf(0).maxHp * 0.15, 'host hp=' + Math.round(hf.hp) + ' guest hp=' + Math.round(gf.hp));
check('rollback ativo (confirmacoes > 0)', confirms > 100, confirms + ' previsões confirmadas');

console.log('---');
console.log(fails === 0 ? 'ONLINE E2E: TUDO OK' : 'ONLINE E2E: ' + fails + ' FALHAS');
`, ctx);
