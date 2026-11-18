// AUDITORIA DE SPRITES EM LUTA (canvas real): para kira/cracker/rafael,
// 1) desenha cada pose isolada e procura sprite DUPLO (2+ componentes grandes)
//    ou GIGANTE (altura > 275px);
// 2) roda partida real e casta cada poder, renderizando o frame do disparo:
//    procura blob "humanoide" (aspect 1.2-3.2, altura 140-300) alem do lutador
//    = resto de personagem dentro do atlas de habilidades.
const fs = require('fs'); const vm = require('vm');
function req(name) { try { return require(name); } catch (e) { return require('/tmp/node_modules/' + name); } }
const { createCanvas, Image: CanvasImage, loadImage } = req('canvas');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

const ctx = { console, Math, Date, Image: CanvasImage, createCanvas, loadImage, fs,
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho', 'maximilian'], data: { settings: { reducedMotion: false, quality: 'medium' }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting(k, v) { if (v === undefined) return this.data.settings[k]; this.data.settings[k] = v; return v; }, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: { room: null, score: null, takeRemote: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }) },
  AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), querySelectorAll: () => [], addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} }, dataset: {} } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/fighters-dev-virado.js', 'js/data/fighters-milena.js', 'js/data/fighters-kira.js', 'js/data/fighters-cracker.js', 'js/data/fighters-rafael.js', 'js/data/balance.js', 'js/data/roster-portraits.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }

(async () => {
  // injeta imagens reais
  await vm.runInContext(`
  (async () => {
    const load = async (id, p) => { try { SpriteGen.images[id] = await loadImage(p); return true; } catch (e) { return false; } };
    const loadArt = async (k, p) => { try { Art.images[k] = await loadImage(p); return true; } catch (e) { return false; } };
    for (const fid of ['kira', 'cracker', 'rafael', 'du']) {
      await load(fid, 'assets/sprites/' + fid + '.png');
      await loadArt('abil:' + fid, 'assets/abilities/' + fid + '.png');
      await loadArt('fx2:' + fid, 'assets/abilities/' + fid + '.png');
    }
  })()`, ctx);

  // ===== 1. poses isoladas =====
  const r1 = await vm.runInContext(`
  (async () => {
    const out = {};
    const scenarios = [
      ['idle', (f) => { f.state = 'idle'; f.stateTime = 8; f.frame = 32; }],
      ['walk', (f) => { f.state = 'walk'; f.stateTime = 5; f.frame = 20; f.walkPhase = 2; f.vx = 3; }],
      ['jump', (f) => { f.state = 'jump'; f.y = -120; f.vy = -4; f.stateTime = 4; f.frame = 10; }],
      ['crouch', (f) => { f.state = 'crouch'; f.stateTime = 6; f.frame = 10; }],
      ['punch', (f) => { f.state = 'attack'; f.attack = f.attackSpec('punch'); f.stateTime = 8; f.frame = 10; }],
      ['kick', (f) => { f.state = 'attack'; f.attack = f.attackSpec('kick'); f.stateTime = 10; f.frame = 12; }],
      ['cpunch', (f) => { f.state = 'attack'; f.attack = f.attackSpec('cpunch'); f.stateTime = 4; f.frame = 6; }],
      ['ckick', (f) => { f.state = 'attack'; f.attack = f.attackSpec('ckick'); f.stateTime = 4; f.frame = 6; }],
      ['jpunch', (f) => { f.state = 'attack'; f.attack = f.attackSpec('jpunch'); f.stateTime = 6; f.y = -80; f.frame = 8; }],
      ['jkick', (f) => { f.state = 'attack'; f.attack = f.attackSpec('jkick'); f.stateTime = 6; f.y = -80; f.frame = 8; }],
      ['special', (f) => { f.state = 'cast'; f.cast = { p: f.currentKit()[0], i: 0, t: 12, fired: true }; f.stateTime = 12; f.frame = 20; }],
      ['hit', (f) => { f.state = 'hit'; f.stateTime = 4; f.frame = 30; }],
      ['block', (f) => { f.state = 'block'; f.stateTime = 5; f.frame = 14; }],
      ['ko', (f) => { f.state = 'ko'; f.stateTime = 10; f.frame = 40; }],
      ['win', (f) => { f.state = 'win'; f.stateTime = 10; f.frame = 36; }],
      ['dash', (f) => { f.state = 'dash'; f.stateTime = 6; f.frame = 16; f.afterimage = 0; }],
    ];
    for (const fid of ['kira', 'cracker', 'rafael']) {
      const canvas = createCanvas(960, 540);
      const cx2d = canvas.getContext('2d');
      const g = new Game({ width: 960, height: 540, getContext: () => cx2d, classList: { toggle(){}, add(){}, remove(){} } });
      g.start({ mode: 'versus', teams: [[fid], ['du']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
      for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
      const f = g.activeOf(0);
      out[fid] = {};
      for (const [name, setup] of scenarios) {
        // reseta
        f.state = 'idle'; f.attack = null; f.cast = null; f.afterimage = 0; f.y = 0; f.vy = 0; f.onGround = true; f.x = 300; f.frame = 10; f.stateTime = 0; f.walkPhase = 0; f.vx = 0; f.dir = 1; f.flashWhite = 0; f.status = {}; f.aura = null;
        setup(f);
        const c2 = createCanvas(500, 540);
        const x2 = c2.getContext('2d');
        x2.clearRect(0, 0, 500, 540);
        x2.save();
        x2.translate(0, 458);
        try { f.draw(x2); } catch (e) { out[fid][name] = { err: e.message }; continue; }
        x2.restore();
        const d = x2.getImageData(0, 0, 500, 540).data;
        // componentes de conteudo (alpha > 10)
        const W = 500, H = 540;
        const a = new Uint8Array(W * H);
        for (let i = 0; i < W * H; i++) a[i] = d[i * 4 + 3] > 10 ? 1 : 0;
        // labeling simples BFS
        const lab = new Int32Array(W * H).fill(-1);
        const comps = [];
        for (let i = 0; i < W * H; i++) {
          if (!a[i] || lab[i] >= 0) continue;
          const q = [i]; lab[i] = comps.length;
          let sz = 0, minx = W, maxx = 0, miny = H, maxy = 0;
          while (q.length) {
            const p = q.pop(); sz++;
            const px = p % W, py = (p / W) | 0;
            if (px < minx) minx = px; if (px > maxx) maxx = px;
            if (py < miny) miny = py; if (py > maxy) maxy = py;
            for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
              const nx = px + dx, ny = py + dy;
              if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
              const np = ny * W + nx;
              if (a[np] && lab[np] < 0) { lab[np] = comps.length; q.push(np); }
            }
          }
          comps.push({ sz, minx, maxx, miny, maxy, w: maxx - minx + 1, h: maxy - miny + 1 });
        }
        const big = comps.filter((c) => c.sz > 600);
        const maxH = big.length ? Math.max(...big.map((c) => c.h)) : 0;
        const maxW = big.length ? Math.max(...big.map((c) => c.w)) : 0;
        // duplos: 2+ componentes grandes com centros distantes > 90px
        let dup = false;
        for (let i = 0; i < big.length; i++) for (let j = i + 1; j < big.length; j++) {
          const ci = big[i], cj = big[j];
          const dcx = Math.abs((ci.minx + ci.maxx) / 2 - (cj.minx + cj.maxx) / 2);
          const dcy = Math.abs((ci.miny + ci.maxy) / 2 - (cj.miny + cj.maxy) / 2);
          if (Math.hypot(dcx, dcy) > 90) dup = true;
        }
        out[fid][name] = { nBig: big.length, maxH, maxW, dup, comps: big.map((c) => c.sz + '@' + c.w + 'x' + c.h) };
      }
      g.running = false;
    }
    return JSON.stringify(out);
  })()`, ctx);
  const poses = JSON.parse(r1);
  for (const fid of ['kira', 'cracker', 'rafael']) {
    for (const name of Object.keys(poses[fid])) {
      const p = poses[fid][name];
      if (p.err) { check(`${fid} pose ${name}: render sem erro`, false, p.err); continue; }
      const giant = p.maxH > 275 || p.maxW > 320;
      // dash pode ter afterimage (ate 3 comps sobrepostos); fora isso so 1 componente grande
      const maxBig = name === 'dash' ? 3 : 1;
      check(`${fid} pose ${name}: sem sprite duplo/gigante`, !p.dup && !giant && p.nBig <= maxBig, JSON.stringify(p));
    }
  }

  // ===== 2. cast de cada poder em partida real =====
  const r2 = await vm.runInContext(`
  (async () => {
    const canvas = createCanvas(960, 540);
    const cx2d = canvas.getContext('2d');
    const out = {};
    for (const fid of ['kira', 'cracker', 'rafael']) {
      out[fid] = {};
      const g = new Game({ width: 960, height: 540, getContext: () => cx2d, classList: { toggle(){}, add(){}, remove(){} } });
      g.start({ mode: 'versus', teams: [[fid], ['du']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
      for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
      const f = g.activeOf(0), foe = g.activeOf(1);
      foe.x = f.x + 260; foe.hp = foe.maxHp; foe.state = 'idle'; foe.alive = true;
      const kit = f.currentKit();
      for (let i = 0; i < kit.length; i++) {
        // reseta estado
        f.state = 'idle'; f.cast = null; f.castLock = 0; f.spamShared = 0; f.cd = [0,0,0,0,0,0,0,0,0,0]; f.charge = [100,100]; f.ultimate = 100; f.y = 0; f.vy = 0; f.onGround = true; f.hitstun = 0; f.stun = 0; f.x = 300; f.hp = f.maxHp; f.alive = true; f.status = {};
        foe.x = f.x + 240; foe.hp = foe.maxHp; foe.state = 'idle'; foe.alive = true; foe.hitstun = 0; foe.stun = 0; foe.y = 0; foe.onGround = true;
        g.projectiles.length = 0; g.strikes.length = 0; g.zones.length = 0; g.beams.length = 0;
        const ok = f.tryCast(i);
        if (!ok) { out[fid][i] = { err: 'cast recusado' }; continue; }
        let firedAt = -1;
        for (let t = 0; t < 200; t++) {
          g.tick();
          if (f.cast && f.cast.fired && firedAt < 0) firedAt = t;
          if (firedAt >= 0 && t >= firedAt + 6) break;
        }
        // renderiza no momento do disparo
        cx2d.clearRect(0, 0, 960, 540);
        g.render(1);
        const d = cx2d.getImageData(0, 0, 960, 540).data;
        const W = 960, H = 540;
        const a = new Uint8Array(W * H);
        for (let k = 0; k < W * H; k++) a[k] = d[k * 4 + 3] > 10 ? 1 : 0;
        const lab = new Int32Array(W * H).fill(-1);
        const comps = [];
        for (let k = 0; k < W * H; k++) {
          if (!a[k] || lab[k] >= 0) continue;
          const q = [k]; lab[k] = comps.length;
          let sz = 0, minx = W, maxx = 0, miny = H, maxy = 0;
          while (q.length) {
            const p = q.pop(); sz++;
            const px = p % W, py = (p / W) | 0;
            if (px < minx) minx = px; if (px > maxx) maxx = px;
            if (py < miny) miny = py; if (py > maxy) maxy = py;
            for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
              const nx = px + dx, ny = py + dy;
              if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
              const np = ny * W + nx;
              if (a[np] && lab[np] < 0) { lab[np] = comps.length; q.push(np); }
            }
          }
          comps.push({ sz, minx, maxx, miny, maxy, w: maxx - minx + 1, h: maxy - miny + 1, cx: (minx + maxx) / 2, cy: (miny + maxy) / 2 });
        }
        // suspeitos de "personagem dentro do efeito": blob grande, humanoide (aspect 1.2-3.2), perto do lutador
        const suspects = comps.filter((c) => c.sz > 1500 && c.h >= 140 && c.h <= 300 && c.h / Math.max(c.w, 1) >= 1.2 && c.h / Math.max(c.w, 1) <= 3.2 && Math.abs(c.cx - f.x) < 160);
        out[fid][i] = { p: kit[i].id, firedAt, nSuspects: suspects.length, suspects: suspects.map((c) => c.sz + '@' + c.w + 'x' + c.h), fighterX: f.x };
        // limpa pro proximo poder
        g.projectiles.length = 0; g.strikes.length = 0; g.zones.length = 0; g.beams.length = 0;
      }
      g.running = false;
    }
    return JSON.stringify(out);
  })()`, ctx);
  const casts = JSON.parse(r2);
  for (const fid of ['kira', 'cracker', 'rafael']) {
    for (const i of Object.keys(casts[fid])) {
      const c = casts[fid][i];
      if (c.err) { check(`${fid} poder ${i}: castou`, false, c.err); continue; }
      // o proprio lutador conta 1 suspeito; mais que 1 = personagem extra no efeito
      check(`${fid} poder ${c.p} (i=${i}): sem sprite de personagem extra no efeito`, c.nSuspects <= 1, JSON.stringify(c));
    }
  }

  console.log('---');
  console.log('AUDITORIA SPRITES EM LUTA: ' + (fails ? fails + ' FALHAS de ' + n : 'TUDO OK (' + n + ' checks)'));
  process.exit(fails ? 1 : 0);
})();
