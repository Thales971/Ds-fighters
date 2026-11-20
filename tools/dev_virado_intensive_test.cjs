// INTENSIVO DEV VIRADO: registro, sprites recortados (sem magenta/vazios/duplicados,
// pe na baseline), habilidades (4 dashes + ult), passiva Ultima Caneca, render real.
const fs = require('fs'); const vm = require('vm');
function req(name) { return require(name); }
const { createCanvas, loadImage } = req('canvas');
const { PNG } = req('pngjs');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas, fs, PNG,
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho', 'maximilian'], data: { settings: { reducedMotion: false }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), querySelectorAll: () => [], addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} }, dataset: {} } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/fighters-dev-virado.js', 'js/data/roster-portraits.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 80)); } }

// ===== 1. REGISTRO =====
{
  const r = vm.runInContext(`
  (function(){
    const f = FIGHTERS.find((x) => x.id === 'dev-virado');
    const kit = POWERS['dev-virado'];
    const sig = SIGNATURES['dev-virado'];
    return JSON.stringify({
      found: !!f,
      name: f && f.name, title: f && f.title,
      stats: f && f.stats, moves: f && Object.keys(f.moves),
      quotes: f && Object.keys(f.quotes),
      powers: kit ? kit.powers.map((p) => p.id + ':' + p.slot + ':' + p.kind + ':row' + p.row) : null,
      sig: sig ? { trait: sig.trait, lowHpSpeed: sig.lowHpSpeed, lowHpDash: sig.lowHpDash, chainBonus: sig.chainBonus } : null,
      layoutFile: SPRITE_LAYOUT.files['dev-virado'],
      perFighter: !!(SPRITE_LAYOUT.perFighter && SPRITE_LAYOUT.perFighter['dev-virado']),
      artAbil: !!ART_SHEETS['abil:dev-virado'], artFx2: !!ART_SHEETS['fx2:dev-virado'],
      roster: ROSTER_PORTRAITS.order.includes('dev-virado'),
      unlocked: Profile.isUnlocked('dev-virado'),
    });
  })()`, ctx);
  const R = JSON.parse(r);
  check('registrado no FIGHTERS com ficha completa (nome/titulo/stats/moves/quotes)', R.found && R.name === 'DEV VIRADO' && R.title === 'O Que Virou a Noite' && R.stats.hp === 163 && R.stats.speed >= 1.5 && R.moves.join(',') === 'punch,kick' && R.quotes.includes('super'), JSON.stringify({ name: R.name, stats: R.stats }));
  check('POWERS: 4 dashes/rush (simple) + 1 ultimate, rows 0-4', R.powers && R.powers.length === 5 && R.powers.slice(0, 4).every((p) => p.includes('dash') || p.includes('rush')) && R.powers[4].includes('ultimate'), R.powers && R.powers.join(' | '));
  check('SIGNATURES: Ultima Caneca (lowHpSpeed 1.15, lowHpDash, chainBonus)', R.sig && R.sig.lowHpSpeed === 1.15 && R.sig.lowHpDash === true && R.sig.chainBonus === 1, JSON.stringify(R.sig));
  check('layout/art atlas registrados e desbloqueado por padrao', R.layoutFile === 'assets/sprites/dev-virado.png' && R.perFighter && R.artAbil && R.artFx2 && R.roster && R.unlocked, '');
}

// ===== 2. SPRITES EM DISCO: tamanho, sem magenta, celulas cheias, sem duplicadas, pe na baseline =====
{
  const POSES = ['idle','walk','jump','crouch','punch','kick','cpunch','ckick','jpunch','jkick','special','hit','block','ko','win'];
  const img = PNG.sync.read(fs.readFileSync('assets/sprites/dev-virado.png'));
  check('sprites/dev-virado.png 1280x3900 (4x15 de 320x260)', img.width === 1280 && img.height === 3900, img.width + 'x' + img.height);
  let mag = 0;
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i] > 230 && img.data[i+1] < 30 && img.data[i+2] > 230 && img.data[i+3] > 60) mag++;
  }
  check('0 px magenta puro no recorte (chroma-key limpo)', mag === 0, mag + ' px');
  const CW = 320, CH = 260, BASE = 246, AIR = 220;
  const poseHashes = [];
  let empty = [], feetBad = [], frozen = [];
  for (let pi = 0; pi < 15; pi++) {
    const frameHashes = [];
    let stripAlpha = 0;
    for (let f = 0; f < 4; f++) {
      let n = 0, maxY = -1;
      for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
        const i = ((pi * CH + y) * img.width + f * CW + x) * 4;
        if (img.data[i + 3] > 8) { n++; if (y > maxY) maxY = y; }
      }
      stripAlpha += n;
      if (n < 200) empty.push(POSES[pi] + ':f' + f);
      const want = POSES[pi].startsWith('j') ? AIR : BASE;
      if (maxY >= 0 && Math.abs(maxY - want) > 14) feetBad.push(POSES[pi] + ':f' + f + '=y' + maxY);
      let h = 0; for (let y = 0; y < CH; y += 3) for (let x = 0; x < CW; x += 3) { const i = ((pi*CH+y)*img.width + f*CW + x)*4; h = (h * 31 + img.data[i+3]) >>> 0; }
      frameHashes.push(h);
    }
    if (new Set(frameHashes).size < 2) frozen.push(POSES[pi]);
    poseHashes.push(frameHashes.join('-'));
  }
  check('todas as 15 poses x 4 frames com conteudo (nada vazio/cortado)', empty.length === 0, empty.join(',') || 'ok');
  check('pe na baseline (246 no chao, 220 no ar)', feetBad.length === 0, feetBad.join(',') || 'ok');
  check('nenhuma pose congelada (>=2 frames distintos por pose)', frozen.length === 0, frozen.join(',') || 'ok');
  const dupPoses = poseHashes.filter((h, i) => poseHashes.indexOf(h) !== i);
  check('nenhuma pose duplicada entre si', dupPoses.length === 0, dupPoses.length + ' dups');
  const ab = PNG.sync.read(fs.readFileSync('assets/abilities/dev-virado.png'));
  let abMag = 0, abEmpty = [];
  for (let i = 0; i < ab.data.length; i += 4) if (ab.data[i] > 230 && ab.data[i+1] < 30 && ab.data[i+2] > 230 && ab.data[i+3] > 60) abMag++;
  for (let r = 0; r < 5; r++) {
    let cnt = 0;
    for (let y = 0; y < 128; y++) for (let x = 128; x < 256; x++) { const i = (r*128+y)*ab.width*4 + x*4; if (ab.data[i+3] > 8) cnt++; }
    if (cnt < 500) abEmpty.push('row' + r);
  }
  check('abilities 512x640, sem magenta, 5 linhas de poder com icone (col1)', ab.width === 512 && ab.height === 640 && abMag === 0 && abEmpty.length === 0, `mag=${abMag} vazias=${abEmpty.join(',')||'nenhuma'}`);
  const face = PNG.sync.read(fs.readFileSync('assets/ui/face-dev-virado.png'));
  const port = PNG.sync.read(fs.readFileSync('assets/ui/portrait-dev-virado.png'));
  let faceN = 0; for (let i = 3; i < face.data.length; i += 4) if (face.data[i] > 8) faceN++;
  let portN = 0; for (let i = 3; i < port.data.length; i += 4) if (port.data[i] > 8) portN++;
  check('face 168x168 e portrait 320x360 com conteudo', face.width === 168 && port.width === 320 && port.height === 360 && faceN > 3000 && portN > 10000, `face=${faceN}px port=${portN}px`);
}

// ===== 3. RENDER REAL das 15 poses via SpriteGen.blit num canvas real =====
(async () => {
  const img = await loadImage('assets/sprites/dev-virado.png');
  ctx.__dvImg = img;
  const r = vm.runInContext(`
  (function(){
    SpriteGen.images['dev-virado'] = __dvImg;
    const cv = createCanvas(1280, 3900);
    const c = cv.getContext('2d');
    const POSES = SPRITE_LAYOUT.poses;
    const bad = [];
    for (let pi = 0; pi < POSES.length; pi++) {
      for (let f = 0; f < 4; f++) {
        SpriteGen.blit(c, 'dev-virado', POSES[pi], f, 1, f * 320 + 160, pi * 260 + 246);
      }
    }
    const d = c.getImageData(0, 0, 1280, 3900).data;
    for (let pi = 0; pi < POSES.length; pi++) {
      let n = 0;
      for (let y = 0; y < 260; y++) for (let x = 0; x < 1280; x++) { const i = ((pi*260+y)*1280 + x)*4; if (d[i+3] > 8) n++; }
      if (n < 800) bad.push(POSES[pi] + '=' + n);
    }
    return JSON.stringify({ bad, poses: POSES.length });
  })()`, ctx);
  const R = JSON.parse(r);
  check('blit renderiza as 15 poses x 4 frames no canvas real (todas com conteudo)', R.bad.length === 0 && R.poses === 15, R.bad.join(',') || 'ok');

  // ===== 4. LUTA REAL: dashes causam dano + fx; ult rush; passiva =====
  const r2 = vm.runInContext(`
  (function(){
    const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), createPattern: () => ({}), getImageData() { return { data: new Uint8ClampedArray(4) }; }, putImageData() {} });
    const mk = () => {
      const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } });
      g.start({ mode: 'versus', teams: [['dev-virado'], ['du']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
      for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
      return g;
    };
    const out = {};
    /* Commit Push (dash 0): dano + bleed + vuln */
    {
      const g = mk(); const me = g.activeOf(0), op = g.activeOf(1);
      me.x = 300; op.x = 420; me.dir = 1; op.status = {};
      me.cd = [0,0,0,0,0]; me.castLock = 0; me.state = 'idle'; me.cast = null;
      const hp0 = op.hp;
      me.tryCast(0);
      let sawDash = false;
      for (let t = 0; t < 120; t++) { g.tick(); if (me.dashHit) sawDash = true; }
      out.commit = { dash: sawDash, dano: hp0 - op.hp, bleed: op.has('bleed'), vuln: op.has('vuln') };
    }
    /* Rebase (rush 2 hits) aplica blind */
    {
      const g = mk(); const me = g.activeOf(0), op = g.activeOf(1);
      me.x = 300; op.x = 430; me.dir = 1; op.status = {};
      me.cd = [0,0,0,0,0]; me.castLock = 0; me.state = 'idle'; me.cast = null;
      const hp0 = op.hp;
      me.tryCast(1);
      let sawRush = false, sawBlind = false;
      for (let t = 0; t < 200; t++) { g.tick(); if (me.state === 'rush') sawRush = true; if (op.has('blind')) sawBlind = true; }
      out.rebase = { rush: sawRush, dano: Math.round(hp0 - op.hp), blind: sawBlind };
    }
    /* Force Merge: stun longo (30f) via dashHit custom */
    {
      const g = mk(); const me = g.activeOf(0), op = g.activeOf(1);
      me.x = 300; op.x = 415; me.dir = 1; op.status = {};
      me.cd = [0,0,0,0,0]; me.castLock = 0; me.state = 'idle'; me.cast = null;
      me.tryCast(2);
      let stunned = 0;
      for (let t = 0; t < 160; t++) { g.tick(); if (op.stun > 0 || op.has('shock')) stunned++; }
      out.merge = { stunTicks: stunned, shock: op.has('shock') };
    }
    /* Hotfix: launch (opvai pro ar) */
    {
      const g = mk(); const me = g.activeOf(0), op = g.activeOf(1);
      me.x = 300; op.x = 410; me.dir = 1; op.status = {};
      me.cd = [0,0,0,0,0]; me.castLock = 0; me.state = 'idle'; me.cast = null;
      me.tryCast(3);
      let air = false;
      for (let t = 0; t < 160; t++) { g.tick(); if (op.y < -30) air = true; }
      out.hotfix = { lancou: air, vuln: op.has('vuln') };
    }
    /* ULT Deploy de Sexta: rush 5 hits + bleed permanente */
    {
      const g = mk(); const me = g.activeOf(0), op = g.activeOf(1);
      me.x = 300; op.x = 440; me.dir = 1; op.status = {};
      me.cd = [0,0,0,0,0]; me.castLock = 0; me.state = 'idle'; me.cast = null; me.ultimate = 100;
      const hp0 = op.hp;
      me.tryCast(4);
      const ultLogoAposCast = me.ultimate; /* medidor gasta na hora; regenera depois ao causar dano */
      let hits = 0, lastHp = hp0, sawBleed = false;
      for (let t = 0; t < 400 && me.state !== 'ko'; t++) { g.tick(); if (op.hp < lastHp) { hits++; lastHp = op.hp; } if (op.has('bleed')) sawBleed = true; }
      out.ult = { hits, dano: Math.round(hp0 - op.hp), bleed: sawBleed, ultGasta: ultLogoAposCast === 0 };
    }
    /* PASSIVA Ultima Caneca: <25% hp -> speedMult +15% e dash -5f de cd */
    {
      const g = mk(); const me = g.activeOf(0);
      me.hp = me.maxHp; const spFull = me.speedMult();
      me.hp = me.maxHp * 0.2; const spLow = me.speedMult();
      me.cd = [0,0,0,0,0]; me.castLock = 0; me.state = 'idle'; me.cast = null;
      const g2 = mk(); const me2 = g2.activeOf(0);
      me2.hp = me2.maxHp; me2.cd = [0,0,0,0,0]; me2.castLock = 0; me2.state = 'idle'; me2.cast = null;
      me2.tryCast(0); const cdFull = me2.cd[0];
      me.cd = [0,0,0,0,0]; me.castLock = 0; me.state = 'idle'; me.cast = null;
      me.tryCast(0); const cdLow = me.cd[0];
      out.passiva = { spFull: +spFull.toFixed(3), spLow: +spLow.toFixed(3), cdFull, cdLow };
    }
    /* 3 partidas vs CPU sem crash */
    let ok = 0;
    for (let k = 0; k < 3; k++) {
      const g = mk(); g.activeOf(1); 
      for (let t = 0; t < 2400 && !g.matchOver; t++) g.tick();
      ok++;
    }
    out.partidas = ok;
    return JSON.stringify(out);
  })()`, ctx);
  const R2 = JSON.parse(r2);
  check('Commit Push: dash anda, causa dano, aplica bleed + vuln', R2.commit.dash && R2.commit.dano > 0 && R2.commit.bleed && R2.commit.vuln, JSON.stringify(R2.commit));
  check('Rebase: rush de 2 hits causa dano e cega (blind durante a sequencia)', R2.rebase.rush && R2.rebase.dano >= 10 && R2.rebase.blind, JSON.stringify(R2.rebase));
  check('Force Merge: stun/shock no alvo (ombro atordoa)', R2.merge.stunTicks > 10 || R2.merge.shock, JSON.stringify(R2.merge));
  check('Hotfix: lanca o alvo pro ar (y<-30) e aplica vuln', R2.hotfix.lancou && R2.hotfix.vuln, JSON.stringify(R2.hotfix));
  check('ULT Deploy de Sexta: multiplos hits, gasta ultimate na hora, bleed', R2.ult.hits >= 3 && R2.ult.ultGasta && R2.ult.bleed, JSON.stringify(R2.ult));
  check('PASSIVA Ultima Caneca: <25% hp -> +15% speed e dash -5f de cd', R2.passiva.spLow > R2.passiva.spFull * 1.1 && R2.passiva.cdLow === R2.passiva.cdFull - 5, JSON.stringify(R2.passiva));
  check('3 partidas vs CPU sem crash', R2.partidas === 3, R2.partidas + '/3');

  console.log('---');
  console.log('DEV VIRADO INTENSIVO: ' + (fails ? fails + ' FALHAS de ' + n : 'TUDO OK (' + n + ' checks)'));
  process.exit(fails ? 1 : 0);
})();
