// STRESS/EDGE do DEV VIRADO: combos da ficha, dash errado (janela de punicao),
// limite exato da passiva, flip do sprite, KO pela ult, bleed permanente, modos
// arcade/survival/tag/treino, IA dos dois lados, reset de round, qualidade baixa.
const fs = require('fs'); const vm = require('vm');
function req(name) { return require(name); }
const { createCanvas, loadImage } = req('canvas');
const { PNG } = req('pngjs');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

const store = { reducedMotion: false, quality: 'medium' };
const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas, fs, PNG,
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho', 'maximilian'], data: { settings: store, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting(k, v) { if (v === undefined) return store[k]; store[k] = v; return v; }, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), querySelectorAll: () => [], addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} }, dataset: {} } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; ctx.store = store; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/fighters-dev-virado.js', 'js/data/roster-portraits.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }

(async () => {
  const img = await loadImage('assets/sprites/dev-virado.png');
  ctx.__dvImg = img;

  const r = vm.runInContext(`
  (function(){
    SpriteGen.images['dev-virado'] = __dvImg;
    const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), createPattern: () => ({}), getImageData() { return { data: new Uint8ClampedArray(4) }; }, putImageData() {} });
    const mk = (opts) => {
      const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } });
      g.start(Object.assign({ mode: 'versus', teams: [['dev-virado'], ['du']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 }, opts || {}));
      for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
      return g;
    };
    const prep = (g) => { const me = g.activeOf(0), op = g.activeOf(1); me.x = 300; op.x = 430; me.dir = 1; op.status = {}; op.guardUp = false; me.cd = [0,0,0,0,0]; me.castLock = 0; me.state = 'idle'; me.cast = null; return [me, op]; };
    const out = {};

    /* 1. COMBO "Coffee run" da ficha: Commit Push -> canetada -> Rebase */
    {
      const g = mk(); const [me, op] = prep(g);
      const hp0 = op.hp;
      me.tryCast(0); /* commit push */
      for (let t = 0; t < 60; t++) g.tick();
      me.update({ left:false, right:false, down:false, up:false, punch:true, kick:false }); /* canetada */
      for (let t = 0; t < 40; t++) g.tick();
      me.cd = [0,0,0,0,0]; me.castLock = 0; me.state = 'idle'; me.cast = null; me.x = Math.max(60, op.x - 120); me.dir = 1;
      me.tryCast(1); /* rebase */
      for (let t = 0; t < 200; t++) g.tick();
      out.coffee = { dano: Math.round((hp0 - op.hp) * 10) / 10, opState: op.state };
    }
    /* 2. SETUP AEREO: Hotfix lanca -> Force Merge no pouso */
    {
      const g = mk(); const [me, op] = prep(g);
      const hp0 = op.hp;
      me.tryCast(3); /* hotfix uppercut */
      let airborne = false;
      for (let t = 0; t < 120; t++) { g.tick(); if (op.y < -40) airborne = true; }
      /* espera pousar e aplica force merge */
      let waited = 0;
      while (op.y < -2 && waited < 200) { g.tick(); waited++; }
      me.cd = [0,0,0,0,0]; me.castLock = 0; me.state = 'idle'; me.cast = null; me.x = op.x - 110; me.dir = 1;
      me.tryCast(2);
      for (let t = 0; t < 120; t++) g.tick();
      out.aereo = { lancou: airborne, dano: Math.round((hp0 - op.hp) * 10) / 10 };
    }
    /* 3. DASH ERRADO: longe do alvo -> janela de punicao longa; DASH CERTO -> curta */
    {
      const g = mk(); const [me, op] = prep(g);
      me.x = 80; op.x = 880; me.dir = 1;
      me.tryCast(0);
      let punish = 0, hsWhiff = 0;
      for (let t = 0; t < 200; t++) { g.tick(); if (!me.canAct()) punish++; hsWhiff = Math.max(hsWhiff, me.hitstun); }
      const g2 = mk(); const [me2, op2] = prep(g2);
      me2.x = 300; op2.x = 400; me2.dir = 1; /* perto: conecta */
      me2.tryCast(0);
      let punishHit = 0, hit = false, hsHit = 0;
      for (let t = 0; t < 200; t++) { g2.tick(); if (!me2.canAct()) punishHit++; if (op2.hp < op2.maxHp) hit = true; hsHit = Math.max(hsHit, me2.hitstun); }
      out.whiff = { punishTicks: punish, punishTicksHit: punishHit, acertou: hit, hsWhiff, hsHit, dano: op.hp === op.maxHp ? 0 : 1 };
    }
    /* 4. ABERTURA DE ULT: Force Merge stun -> ult conecta tudo */
    {
      const g = mk(); const [me, op] = prep(g);
      op.hp = 120;
      const hp0 = op.hp;
      me.tryCast(2); /* force merge stun */
      for (let t = 0; t < 60; t++) g.tick();
      me.cd = [0,0,0,0,0]; me.castLock = 0; me.state = 'idle'; me.cast = null; me.ultimate = 100;
      me.x = op.x - 100; me.dir = 1;
      me.tryCast(4);
      let hits = 0, last = hp0;
      for (let t = 0; t < 400; t++) { g.tick(); if (op.hp < last) { hits++; last = op.hp; } }
      out.ultOpen = { hits, dano: Math.round(hp0 - op.hp), ko: op.state === 'ko' || !op.alive };
    }
    /* 5. KO PELA ULT: vida baixa -> ult mata e aplica bleed antes */
    {
      const g = mk(); const [me, op] = prep(g);
      op.hp = 30;
      me.ultimate = 100; me.tryCast(4);
      let bleedAntes = false, ko = false;
      for (let t = 0; t < 500; t++) { g.tick(); if (op.has('bleed')) bleedAntes = true; if (op.state === 'ko' || !op.alive) { ko = true; break; } }
      out.ultKo = { ko, bleedAntes };
    }
    /* 6. BLEED PERMANENTE: apos ult, dano por segundo sem novos golpes */
    {
      const g = mk(); const [me, op] = prep(g);
      me.ultimate = 100; me.tryCast(4);
      for (let t = 0; t < 250; t++) g.tick();
      const hpA = op.hp;
      for (let t = 0; t < 600; t++) g.tick(); /* 10s de bleed sem encostar */
      out.bleedPerm = { danoEm10s: Math.round((hpA - op.hp) * 10) / 10, aindaSangrando: op.has('bleed') };
    }
    /* 7. PASSIVA limite exato: 25.0% NAO ativa, 24% ativa */
    {
      const g = mk(); const me = g.activeOf(0);
      me.hp = me.maxHp * 0.25; const s25 = me.speedMult();
      me.hp = me.maxHp * 0.24; const s24 = me.speedMult();
      me.hp = me.maxHp; const sFull = me.speedMult();
      out.passLimite = { sFull: +sFull.toFixed(3), s25: +s25.toFixed(3), s24: +s24.toFixed(3), ok: Math.abs(s25 - sFull) < 0.001 && s24 > sFull * 1.1 };
    }
    /* 8. RESET DE ROUND: melhor de 3, round 2 comeca limpo e a passiva continua valendo */
    {
      const g = mk({ roundsToWin: 2 });
      const me = g.activeOf(0), op = g.activeOf(1);
      me.hp = 5; /* morre -> proximo round */
      op.takeHit(9999, { attacker: me });
      let rounds = 0;
      for (let t = 0; t < 3000 && g.round < 3 && !g.matchOver; t++) { g.tick(); rounds = Math.max(rounds, g.round); }
      const me2 = g.activeOf(0);
      me2.hp = me2.maxHp * 0.2;
      const spLow = me2.speedMult();
      out.roundReset = { rounds, matchOver: g.matchOver, spLowAfterReset: +spLow.toFixed(3) };
    }
    /* 9. Sprite sem warning de folha (expectedHeight bate) */
    {
      const g = mk();
      out.sheetWarn = (g.spriteWarnings || []).filter((w) => w.includes('dev-virado'));
      out.expectedH = SpriteGen.expectedHeight();
    }
    return JSON.stringify(out);
  })()`, ctx);
  const R = JSON.parse(r);
  check('combo Coffee run (Commit Push -> canetada -> Rebase) causa dano alto', R.coffee.dano >= 40, JSON.stringify(R.coffee));
  check('setup aereo: Hotfix lanca e Force Merge no pouso soma dano', R.aereo.lancou && R.aereo.dano >= 25, JSON.stringify(R.aereo));
  check('dash errado (whiff): +20f de hitstun de punicao e janela maior; dash certo NAO pega hitstun', R.whiff.punishTicks >= 25 && R.whiff.dano === 0 && R.whiff.acertou && R.whiff.hsWhiff >= 20 && R.whiff.hsHit === 0 && R.whiff.punishTicks > R.whiff.punishTicksHit, JSON.stringify(R.whiff));
  check('abertura de ult apos stun do Force Merge: ult conecta varios hits', R.ultOpen.hits >= 3 && R.ultOpen.dano >= 40, JSON.stringify(R.ultOpen));
  check('ult mata com vida baixa e aplicou bleed antes do KO', R.ultKo.ko && R.ultKo.bleedAntes, JSON.stringify(R.ultKo));
  check('bleed permanente: ~10s sem golpes ainda causa dano e continua sangrando', R.bleedPerm.danoEm10s >= 15 && R.bleedPerm.aindaSangrando, JSON.stringify(R.bleedPerm));
  check('passiva no limite exato: 25.0% NAO ativa, 24% ativa (+15%)', R.passLimite.ok, JSON.stringify(R.passLimite));
  check('reset de round funciona (melhor de 3) e a passiva segue valendo no round novo', R.roundReset.rounds >= 2 && R.roundReset.spLowAfterReset > 1.7, JSON.stringify(R.roundReset));
  check('sem warning de folha do dev-virado (altura esperada bate)', R.sheetWarn.length === 0, JSON.stringify(R.sheetWarn) + ' expectedH=' + R.expectedH);

  // ===== 10. FLIP: dir=-1 espelha e continua com conteudo =====
  {
    const r2 = vm.runInContext(`
    (function(){
      const cv = createCanvas(640, 260);
      const c = cv.getContext('2d');
      SpriteGen.blit(c, 'dev-virado', 'idle', 0, 1, 160, 246);
      SpriteGen.blit(c, 'dev-virado', 'idle', 0, -1, 480, 246);
      const d = c.getImageData(0, 0, 640, 260).data;
      let n1 = 0, n2 = 0, diff = 0;
      for (let y = 0; y < 260; y++) for (let x = 0; x < 320; x++) {
        const i = (y * 640 + x) * 4, j = (y * 640 + x + 320) * 4;
        if (d[i + 3] > 8) n1++;
        if (d[j + 3] > 8) n2++;
        if (Math.abs(d[i] - d[j]) + Math.abs(d[i+1] - d[j+1]) + Math.abs(d[i+2] - d[j+2]) > 30) diff++;
      }
      return JSON.stringify({ n1, n2, diff });
    })()`, ctx);
    const R2 = JSON.parse(r2);
    check('flip (dir=-1) espelha o sprite e mantem conteudo (n1≈n2, pixels diferentes)', R2.n1 > 5000 && R2.n2 > 5000 && R2.diff > 1000, JSON.stringify(R2));
  }

  // ===== 11. MODOS + IA dos dois lados =====
  {
    const r3 = vm.runInContext(`
    (function(){
      const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), createPattern: () => ({}), getImageData() { return { data: new Uint8ClampedArray(4) }; }, putImageData() {} });
      const run = (opts, maxTicks) => {
        const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } });
        g.start(opts);
        let t = 0;
        for (; t < (maxTicks || 6000) && !g.matchOver; t++) g.tick();
        return { over: g.matchOver, ticks: t, round: g.round, err: null };
      };
      const out = {};
      /* IA jogando de Dev Virado (P2) vs du: 3 partidas */
      let cpuOk = 0, cpuWins = 0;
      for (let k = 0; k < 3; k++) {
        try {
          const r = run({ mode: 'versus', teams: [['du'], ['dev-virado']], stage: 'random', cpu: [true, true], roundsToWin: 1, timer: 60, difficulty: 2 }, 9000);
          if (r.over) { cpuOk++; if (g_winner(r)) cpuWins++; }
        } catch (e) { out.errCpu = e.message; }
      }
      function g_winner() { return false; }
      out.cpuDv = { completos: cpuOk, err: out.errCpu || null };
      /* Dev Virado como P1 vs CPU: 3 partidas */
      let p1Ok = 0;
      for (let k = 0; k < 3; k++) {
        try {
          const r = run({ mode: 'versus', teams: [['dev-virado'], ['du']], stage: 'random', cpu: [true, true], roundsToWin: 1, timer: 60, difficulty: 1 }, 9000);
          if (r.over) p1Ok++;
        } catch (e) { out.errP1 = e.message; }
      }
      out.p1Dv = { completos: p1Ok, err: out.errP1 || null };
      /* arcade (torneio) com ele de P1 */
      try { out.arcade = run({ mode: 'arcade', teams: [['dev-virado'], ['stack']], stage: 'random', cpu: [false, true], roundsToWin: 1, timer: 99, difficulty: 1 }, 9000); } catch (e) { out.arcade = { err: e.message }; }
      /* survival 3 degraus */
      let surv = 0;
      try {
        for (let k = 0; k < 3; k++) {
          const r = run({ mode: 'survival', teams: [['dev-virado'], ['du']], stage: 'random', cpu: [false, true], roundsToWin: 1, timer: 99, difficulty: k }, 9000);
          if (r.over) surv++;
          else break;
        }
        out.survival = { degraus: surv };
      } catch (e) { out.survival = { err: e.message }; }
      /* tag 2x2 */
      try { out.tag = run({ mode: 'tag', teams: [['dev-virado', 'jess'], ['du', 'stack']], stage: 'random', cpu: [false, true], roundsToWin: 1, timer: 99, difficulty: 1 }, 12000); } catch (e) { out.tag = { err: e.message }; }
      /* treino com boneco */
      try { out.treino = run({ mode: 'training', teams: [['dev-virado'], ['boneco-treino']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 }, 3000); } catch (e) { out.treino = { err: e.message }; }
      /* qualidade baixa renderizando com ele (sem crash, sem rim) */
      try {
        const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } });
        g.start({ mode: 'versus', teams: [['dev-virado'], ['du']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
        for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
        store.quality = 'low';
        g.applyQuality();
        const rec = { fillRect(){}, drawImage(){}, save(){}, restore(){}, clearRect(){}, translate(){}, scale(){}, beginPath(){}, arc(){}, fill(){}, moveTo(){}, lineTo(){}, ellipse(){}, createRadialGradient: () => ({ addColorStop(){} }), createLinearGradient: () => ({ addColorStop(){} }), getImageData: () => ({ data: new Uint8ClampedArray(960*540*4) }), putImageData(){}, measureText: () => ({ width: 10 }), createPattern: () => ({}) };
        const p = new Proxy(rec, { get(t, k) { return k in t ? t[k] : undefined; }, set(t, k, v) { t[k] = v; return true; } });
        for (let t = 0; t < 30; t++) g.renderScene(p);
        store.quality = 'medium';
        out.lowQ = { qFxOn: g.qFxOn, qRim: g.qRim };
      } catch (e) { out.lowQ = { err: e.message }; }
      return JSON.stringify(out);
    })()`, Object.assign(ctx, {}));
    const R3 = JSON.parse(r3);
    check('IA como Dev Virado (P2): 3 partidas completas sem crash', R3.cpuDv.completos === 3 && !R3.cpuDv.err, JSON.stringify(R3.cpuDv));
    check('Dev Virado como P1 vs CPU: 3 partidas completas sem crash', R3.p1Dv.completos === 3 && !R3.p1Dv.err, JSON.stringify(R3.p1Dv));
    check('modo arcade (torneio) com ele: partida roda ate o fim sem crash', R3.arcade && !R3.arcade.err, JSON.stringify(R3.arcade));
    check('survival: 3 degraus seguidos sem crash', R3.survival && R3.survival.degraus === 3, JSON.stringify(R3.survival));
    check('tag 2x2 com ele + jess: sem crash', R3.tag && !R3.tag.err, JSON.stringify(R3.tag));
    check('treino com boneco: sem crash', R3.treino && !R3.treino.err, JSON.stringify(R3.treino));
    check('qualidade baixa: renderScene com dev-virado sem crash, qFxOn=false qRim=0', R3.lowQ && !R3.lowQ.err && R3.lowQ.qFxOn === false && R3.lowQ.qRim === 0, JSON.stringify(R3.lowQ));
  }

  console.log('---');
  console.log('DEV VIRADO STRESS: ' + (fails ? fails + ' FALHAS de ' + n : 'TUDO OK (' + n + ' checks)'));
  process.exit(fails ? 1 : 0);
})();
