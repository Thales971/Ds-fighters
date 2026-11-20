// INTENSIVO RAFAEL: registro, sprites recortados das 3 folhas do dono (sem magenta/vazios/duplicados,
// todas as celulas olham pra direita -> flip=False em tudo), habilidades bruiser de espadona (golpe de
// monofio beam bleed, soco de chassi shock+slow, dash overclock vuln+whiffRecovery, chuva de estilhacos bleed+slow,
// ult impacto devastador rush+explode+bleed+vuln), passiva FURIA (lowHpRage +25% abaixo de 35% hp),
// render real, IA e modos.
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
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/fighters-dev-virado.js', 'js/data/fighters-milena.js', 'js/data/fighters-kira.js', 'js/data/fighters-rafael.js', 'js/data/fighters-cyber-v2.js', 'js/data/roster-portraits.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }

(async () => {
  // ===== 1. REGISTRO =====
  {
    const r = vm.runInContext(`
    (function(){
      const f = FIGHTERS.find((x) => x.id === 'rafael');
      const kit = POWERS['rafael'];
      const sig = SIGNATURES['rafael'];
      return JSON.stringify({
        found: !!f, name: f && f.name, title: f && f.title, stats: f && f.stats,
        moves: f && Object.keys(f.moves), quotes: f && Object.keys(f.quotes),
        powers: kit ? kit.powers.map((p) => p.id + ':' + p.slot + ':' + p.kind + ':row' + p.row + (p.whiffRecovery ? ':WHIFF' + p.whiffRecovery : '')) : null,
        fxmap: kit ? kit.powers.map((p) => p.id + '=' + Object.keys(p.fx || {}).sort().join('+')) : null,
        sig: sig && sig.trait, rage: sig && sig.lowHpRage, dodge: sig && sig.dodge, sandevistan: !!(sig && sig.sandevistan),
        layoutFile: SPRITE_LAYOUT.files['rafael'],
        perFighter: !!(SPRITE_LAYOUT.perFighter && SPRITE_LAYOUT.perFighter['rafael']),
        artAbil: !!ART_SHEETS['abil:rafael'], artFx2: !!ART_SHEETS['fx2:rafael'],
        roster: ROSTER_PORTRAITS.order.indexOf('rafael'),
        rosterVersion: ROSTER_PORTRAITS.version,
        unlocked: Profile.isUnlocked('rafael'),
      });
    })()`, ctx);
    const R = JSON.parse(r);
    check('registrado no FIGHTERS (RAFAEL / O Fixer de Night City / hp210 power1.3 weight1.3)', R.found && R.name === 'RAFAEL' && R.title === 'O Fixer de Night City' && R.stats.hp === 210 && R.stats.power === 1.3 && R.stats.weight === 1.3 && R.stats.speed === 0.85 && R.moves.join(',') === 'punch,kick' && R.quotes.includes('super'), JSON.stringify({ name: R.name, title: R.title, stats: R.stats }));
    check('POWERS: 5 poderes (beam/blast/dash/rain/ult quake), rows 0-4', R.powers && R.powers.length === 5 && R.powers[0].includes('beam') && R.powers[1].includes('blast') && R.powers[2].includes('dash') && R.powers[3].includes('rain') && R.powers[4].includes('ultimate') && R.powers[4].includes('quake'), R.powers && R.powers.join(' | '));
    check('debuffs nos poderes: monofio bleed, chassi shock+slow, overclock whiff20+vuln, estilhacos bleed+slow, ult quake screen explode+bleed+vuln', R.fxmap && R.powers && R.fxmap[0].includes('bleed') && R.fxmap[1].includes('shock') && R.fxmap[1].includes('slow') && R.powers[2].includes('WHIFF20') && R.fxmap[2].includes('vuln') && R.fxmap[3].includes('bleed') && R.fxmap[3].includes('slow') && R.fxmap[4].includes('explode') && R.powers[4].includes('quake') && R.fxmap[4].includes('bleed') && R.fxmap[4].includes('vuln'), JSON.stringify(R.fxmap));
    check('passiva OVERCLOCK (lowHpRage 1.25 abaixo de 35% hp) na assinatura', R.rage === 1.25 && R.sig === 'OVERCLOCK DO FIXER', 'sig=' + R.sig + ' rage=' + R.rage);
    check('passivas ESQUIVA 15% + SANDEVISTAN na assinatura', R.dodge === 0.15 && R.sandevistan === true, 'dodge=' + R.dodge + ' sandevistan=' + R.sandevistan);
    check('layout/art atlas/grid registrados (rafael no fim do roster) e desbloqueado', R.layoutFile === 'assets/sprites/rafael.png' && R.perFighter && R.artAbil && R.artFx2 && R.roster === 51 && R.sig === 'OVERCLOCK DO FIXER' && R.unlocked, 'roster idx ' + R.roster + ' ' + R.rosterVersion);
  }

  // ===== 2. SPRITES EM DISCO =====
  {
    const POSES = ['idle','walk','jump','crouch','punch','kick','cpunch','ckick','jpunch','jkick','special','hit','block','ko','win'];
    const img = PNG.sync.read(fs.readFileSync('assets/sprites/rafael.png'));
    check('sprites/rafael.png 1280x3900', img.width === 1280 && img.height === 3900, img.width + 'x' + img.height);
    let mag = 0, pink = 0;
    for (let i = 0; i < img.data.length; i += 4) {
      const r = img.data[i], g = img.data[i+1], b = img.data[i+2], a = img.data[i+3];
      if (a > 60 && r > 230 && g < 30 && b > 230) mag++;
      if (a > 60 && r > 180 && g < 70 && b > 140) pink++;
    }
    check('0 px de fundo magenta/rosa remanescente', mag === 0 && pink === 0, `mag=${mag} rosa=${pink}`);
    const CW = 320, CH = 260, BASE = 246, AIR = 220;
    let empty = [], feetBad = [], frozen = [], poseHashes = [];
    for (let pi = 0; pi < 15; pi++) {
      const fhs = [];
      for (let f = 0; f < 4; f++) {
        let n = 0, maxY = -1;
        for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
          const i = ((pi * CH + y) * img.width + f * CW + x) * 4;
          if (img.data[i + 3] > 8) { n++; if (y > maxY) maxY = y; }
        }
        if (n < 200) empty.push(POSES[pi] + ':f' + f);
        const want = POSES[pi].startsWith('j') ? AIR : BASE;
        if (POSES[pi] !== 'ko' && maxY >= 0 && Math.abs(maxY - want) > 14) feetBad.push(POSES[pi] + ':f' + f + '=y' + maxY);
        let h = 0; for (let y = 0; y < CH; y += 3) for (let x = 0; x < CW; x += 3) { const i = ((pi*CH+y)*img.width + f*CW + x)*4; h = (h * 31 + img.data[i+3]) >>> 0; }
        fhs.push(h);
      }
      if (new Set(fhs).size < 2) frozen.push(POSES[pi]);
      poseHashes.push(fhs.join('-'));
    }
    check('15 poses x 4 frames com conteudo, pe na baseline, sem pose congelada', empty.length === 0 && feetBad.length === 0 && frozen.length === 0, [empty.join(','), feetBad.join(','), frozen.join(',')].filter(Boolean).join(' | ') || 'ok');
    check('nenhuma pose duplicada entre si', poseHashes.filter((h, i) => poseHashes.indexOf(h) !== i).length === 0, '');
    const ab = PNG.sync.read(fs.readFileSync('assets/abilities/rafael.png'));
    let abMag = 0; for (let i = 0; i < ab.data.length; i += 4) if (ab.data[i] > 230 && ab.data[i+1] < 30 && ab.data[i+2] > 230 && ab.data[i+3] > 60) abMag++;
    const rows = [];
    for (let r = 0; r < 5; r++) { let c = 0; for (let y = 0; y < 128; y++) for (let x = 128; x < 256; x++) { const i = (r*128+y)*ab.width*4 + x*4; if (ab.data[i+3] > 8) c++; } rows.push(c); }
    check('abilities 512x640 sem magenta, 5 linhas com icone', ab.width === 512 && ab.height === 640 && abMag === 0 && rows.every((c) => c > 500), `mag=${abMag} rows=${rows.join(',')}`);
    const face = PNG.sync.read(fs.readFileSync('assets/ui/face-rafael.png'));
    const port = PNG.sync.read(fs.readFileSync('assets/ui/portrait-rafael.png'));
    let fn = 0; for (let i = 3; i < face.data.length; i += 4) if (face.data[i] > 8) fn++;
    let pn = 0; for (let i = 3; i < port.data.length; i += 4) if (port.data[i] > 8) pn++;
    check('face 168x168 e portrait 320x360 com conteudo', face.width === 168 && port.width === 320 && port.height === 360 && fn > 3000 && pn > 10000, `face=${fn} port=${pn}`);
    const atlas = PNG.sync.read(fs.readFileSync('assets/ui/roster-portraits.png'));
    let cellN = 0; for (let y = 7*96; y < 8*96; y++) for (let x = 2*96; x < 3*96; x++) { const i = (y*atlas.width + x)*4; if (atlas.data[i+3] > 8) cellN++; }
    check('atlas do grid 672x768 e a celula do rafael (idx 51, col2 row7) tem retrato', atlas.width === 672 && atlas.height === 768 && cellN > 2000, `atlas=${atlas.width}x${atlas.height} cell=${cellN}px`);
  }

  // ===== 3+4. RENDER + LUTA REAL =====
  {
    ctx.__mkCanvas = createCanvas;
    const img = await loadImage('assets/sprites/rafael.png');
    ctx.__kImg = img;
    const r = vm.runInContext(`
    (function(){
      SpriteGen.images['rafael'] = __kImg;
      const cv = __mkCanvas(1280, 3900);
      const c = cv.getContext('2d');
      for (let pi = 0; pi < SPRITE_LAYOUT.poses.length; pi++)
        for (let f = 0; f < 4; f++)
          SpriteGen.blit(c, 'rafael', SPRITE_LAYOUT.poses[pi], f, 1, f * 320 + 160, pi * 260 + 246);
      const d = c.getImageData(0, 0, 1280, 3900).data;
      const bad = [];
      for (let pi = 0; pi < 15; pi++) {
        let n = 0;
        for (let y = 0; y < 260; y++) for (let x = 0; x < 1280; x++) { const i = ((pi*260+y)*1280 + x)*4; if (d[i+3] > 8) n++; }
        if (n < 800) bad.push(SPRITE_LAYOUT.poses[pi]);
      }
      /* flip */
      const cv2 = __mkCanvas(640, 260);
      const c2 = cv2.getContext('2d');
      SpriteGen.blit(c2, 'rafael', 'idle', 0, 1, 160, 246);
      SpriteGen.blit(c2, 'rafael', 'idle', 0, -1, 480, 246);
      const d2 = c2.getImageData(0, 0, 640, 260).data;
      let n1 = 0, n2 = 0, diff = 0;
      for (let y = 0; y < 260; y++) for (let x = 0; x < 320; x++) {
        const i = (y*640+x)*4, j = (y*640+x+320)*4;
        if (d2[i+3] > 8) n1++; if (d2[j+3] > 8) n2++;
        if (Math.abs(d2[i]-d2[j]) + Math.abs(d2[i+1]-d2[j+1]) + Math.abs(d2[i+2]-d2[j+2]) > 30) diff++;
      }
      /* luta real */
      const fake2d = () => ({ canvas: null, save(){}, restore(){}, clearRect(){}, fillRect(){}, strokeRect(){}, drawImage(){}, translate(){}, scale(){}, rotate(){}, beginPath(){}, moveTo(){}, lineTo(){}, closePath(){}, quadraticCurveTo(){}, ellipse(){}, arc(){}, fill(){}, stroke(){}, fillText(){}, strokeText(){}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop(){} }), createRadialGradient: () => ({ addColorStop(){} }), createPattern: () => ({}), getImageData: () => ({ data: new Uint8ClampedArray(4) }), putImageData(){} });
      const mk = (opts) => {
        const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), classList: { toggle(){},add(){},remove(){} } });
        g.start(Object.assign({ mode: 'versus', teams: [['rafael'], ['du']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 }, opts || {}));
        for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
        return g;
      };
      const prep = (g) => { const me = g.activeOf(0), op = g.activeOf(1); me.x = 300; op.x = 460; me.dir = 1; op.status = {}; op.guardUp = false; me.cd = [0,0,0,0,0]; me.castLock = 0; me.state = 'idle'; me.cast = null; return [me, op]; };
      const out = { bad, flip: { n1, n2, diff } };
      /* 1. Monofio (beam 270px): dano + stun + BLEED + beam desenhado */
      {
        const g = mk(); const [me, op] = prep(g);
        const hp0 = op.hp;
        me.tryCast(0);
        let bleed = false, stun = 0, beam = false;
        for (let t = 0; t < 160; t++) { g.tick(); if (op.has('bleed')) bleed = true; if (op.stun > 0 || op.state === 'hit') stun++; if (g.beams.some((b) => b.owner === me)) beam = true; }
        out.golpe = { dmg: Math.round((hp0 - op.hp) * 10) / 10, stunTicks: stun, bleed, beam };
      }
      /* 1b. Monofio com alvo FORA do range (270): nao acerta */
      {
        const g = mk(); const [me, op] = prep(g);
        op.x = 300 + 400;
        const hp0 = op.hp;
        me.tryCast(0);
        for (let t = 0; t < 120; t++) g.tick();
        out.golpeLonge = { semDano: op.hp >= hp0, dmg: Math.round((hp0 - op.hp) * 10) / 10 };
      }
      /* 2. Slam no Chao (blast em area no self): dano + shock + slow */
      {
        const g = mk(); const [me, op] = prep(g);
        const hp0 = op.hp;
        me.tryCast(1);
        let shock = false, slow = false;
        for (let t = 0; t < 160; t++) { g.tick(); if (op.has('shock')) shock = true; if (op.has('slow')) slow = true; }
        out.slam = { dmg: Math.round((hp0 - op.hp) * 10) / 10, shock, slow };
      }
      /* 3a. Investida Brutal (dash) ACERTANDO: dano + stun + vuln */
      {
        const g = mk(); const [me, op] = prep(g);
        me.x = 300; op.x = 420;
        const hp0 = op.hp;
        me.tryCast(2);
        let vuln = false;
        for (let t = 0; t < 90; t++) { g.tick(); if (op.has('vuln')) vuln = true; }
        out.investidaHit = { dmg: Math.round((hp0 - op.hp) * 10) / 10, vuln };
      }
      /* 3b. Investida ERRADA (alvo longe): whiffRecovery aplica hitstun >= 20 */
      {
        const g = mk(); const [me, op] = prep(g);
        me.x = 120; op.x = 880; op.status = {};
        me.tryCast(2);
        let hs = 0;
        for (let t = 0; t < 140; t++) { g.tick(); hs = Math.max(hs, me.hitstun); }
        out.investidaWhiff = { hitstunMax: hs };
      }
      /* 4. Chuva de Laminas (rain): dano + bleed + slow */
      {
        const g = mk(); const [me, op] = prep(g);
        me.cd = [0,0,0,0,0]; me.charge = [100, 100]; me.castLock = 0; me.state = 'idle'; me.cast = null;
        me.tryCast(3);
        let bleed = false, slow = false, dmg = 0; const hp0 = op.hp;
        for (let t = 0; t < 300; t++) { g.tick(); if (op.has('bleed')) bleed = true; if (op.has('slow')) slow = true; }
        dmg = Math.round((hp0 - op.hp) * 10) / 10;
        out.chuva = { bleed, slow, dmg };
      }
      /* 5. ULT Quebra-ICE (quake screen, range 460): dano massivo + trava + bleed + vuln, gasta ultimate */
      {
        const g = mk(); const [me, op] = prep(g);
        op.x = 300 + 300; // dentro do range 460 da ult
        const hp0 = op.hp;
        me.ultimate = 100;
        me.tryCast(4);
        let travou = false, bleed = false, vuln = false, ultGasta = me.ultimate === 0, opXMax = 0;
        for (let t = 0; t < 260; t++) { g.tick(); if (op.has('freeze') || op.quakeHold) travou = true; if (op.has('bleed')) bleed = true; if (op.has('vuln')) vuln = true; opXMax = Math.max(opXMax, Math.round(op.x)); }
        out.ult = { travou, bleed, vuln, dmg: Math.round((hp0 - op.hp) * 10) / 10, ultGasta, opXMax };
      }
      /* 6. Passiva FURIA: dano do golpe com vida cheia vs abaixo de 35% (lowHpRage 1.25) */
      {
        const measure = (hpFrac) => {
          const g = mk(); const [me, op] = prep(g);
          me.hp = me.maxHp * hpFrac;
          const hp0 = op.hp;
          me.tryCast(0);
          for (let t = 0; t < 160; t++) g.tick();
          return Math.round((hp0 - op.hp) * 10) / 10;
        };
        const full = measure(1.0), low = measure(0.30);
        out.furia = { full, low, ratio: Math.round((low / Math.max(0.1, full)) * 100) / 100 };
      }
      /* 5b. ESQUIVA + SANDEVISTAN: rnd=0 força o dodge — takeHit retorna false, desvia 70px, invuln, slowmo, afterimage, flash */
      {
        const g = mk(); const [me, op] = prep(g);
        g.rnd = () => 0; // sempre esquiva (chance 0.15 > 0)
        me.state = 'idle'; me.onGround = true; me.status = {};
        const x0 = me.x, sl0 = g.slowmo || 0;
        const landed = me.takeHit(10, { attacker: op });
        out.esquiva = {
          desviou: landed === false,
          moveu: Math.abs(me.x - x0) >= 60,
          invuln: me.has('invuln'),
          slowmo: (g.slowmo || 0) > sl0,
          afterimage: me.afterimage >= 28,
          flashes: (typeof VFX !== 'undefined' && VFX.flashes.length > 0) || g.imgFx.length > 0,
        };
      }
      /* 6. IA dos dois lados + modos */
      const run = (opts, maxTicks) => {
        const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), classList: { toggle(){},add(){},remove(){} } });
        g.start(opts);
        let t = 0;
        for (; t < (maxTicks || 9000) && !g.matchOver; t++) g.tick();
        return { over: g.matchOver, ticks: t };
      };
      let p1 = 0, p2 = 0;
      for (let k = 0; k < 3; k++) { try { if (run({ mode: 'versus', teams: [['rafael'], ['du']], stage: 'random', cpu: [true, true], roundsToWin: 1, timer: 60, difficulty: 1 }).over) p1++; } catch (e) { out.errP1 = e.message; } }
      for (let k = 0; k < 3; k++) { try { if (run({ mode: 'versus', teams: [['du'], ['rafael']], stage: 'random', cpu: [true, true], roundsToWin: 1, timer: 60, difficulty: 2 }).over) p2++; } catch (e) { out.errP2 = e.message; } }
      out.ia = { p1, p2, err: out.errP1 || out.errP2 || null };
      try { out.arcade = run({ mode: 'arcade', teams: [['rafael'], ['stack']], stage: 'random', cpu: [false, true], roundsToWin: 1, timer: 99, difficulty: 1 }); } catch (e) { out.arcade = { err: e.message }; }
      try { out.tag = run({ mode: 'tag', teams: [['rafael', 'kira'], ['du', 'dev-virado']], stage: 'random', cpu: [false, true], roundsToWin: 1, timer: 99, difficulty: 1 }, 12000); } catch (e) { out.tag = { err: e.message }; }
      try { out.surv = run({ mode: 'survival', teams: [['rafael'], ['du']], stage: 'random', cpu: [false, true], roundsToWin: 1, timer: 99, difficulty: 1 }); } catch (e) { out.surv = { err: e.message }; }
      /* sheet sem warning */
      const g = mk();
      out.warn = (g.spriteWarnings || []).filter((w) => w.includes('rafael'));
      return JSON.stringify(out);
    })()`, ctx);
    const R = JSON.parse(r);
    check('blit renderiza as 15 poses no canvas real', R.bad.length === 0, R.bad.join(',') || 'ok');
    check('flip dir=-1 espelha e mantem conteudo', R.flip.n1 > 5000 && R.flip.n2 > 5000 && R.flip.diff > 1000, JSON.stringify(R.flip));
    check('Monofio (beam): dano + stun + SANGRAMENTO + beam no alvo', R.golpe.dmg > 0 && R.golpe.stunTicks > 5 && R.golpe.bleed && R.golpe.beam, JSON.stringify(R.golpe));
    check('Monofio com alvo fora do range (270px) nao causa dano', R.golpeLonge.semDano, JSON.stringify(R.golpeLonge));
    check('Soco de Chassi: área causa dano + ELETRIZADO + LENTO', R.slam.dmg > 0 && R.slam.shock && R.slam.slow, JSON.stringify(R.slam));
    check('Dash de Overclock acertando: dano + VULNERÁVEL', R.investidaHit.dmg > 0 && R.investidaHit.vuln, JSON.stringify(R.investidaHit));
    check('Dash ERRADO: whiffRecovery aplica hitstun >= 20', R.investidaWhiff.hitstunMax >= 20, JSON.stringify(R.investidaWhiff));
    check('Chuva de Estilhaços: chuva causa dano + SANGRAMENTO + LENTO', R.chuva.bleed && R.chuva.slow && R.chuva.dmg > 0, JSON.stringify(R.chuva));
    check('ULT Quebra-ICE: quake screen causa dano massivo + trava + SANGRAMENTO + VULN, gasta ultimate', R.ult.dmg >= 30 && R.ult.travou && R.ult.bleed && R.ult.vuln && R.ult.ultGasta, JSON.stringify(R.ult));
    check('OVERCLOCK: dano abaixo de 35% hp e ~1.25x o dano com vida cheia', R.furia.low > R.furia.full && R.furia.ratio > 1.15 && R.furia.ratio < 1.4, JSON.stringify(R.furia));
    check('ESQUIVA+SANDEVISTAN: golpe desviado (sem dano) + desloca + invuln + slowmo + rastro/flash', R.esquiva.desviou && R.esquiva.moveu && R.esquiva.invuln && R.esquiva.slowmo && R.esquiva.afterimage && R.esquiva.flashes, JSON.stringify(R.esquiva));
    check('IA: 3 partidas como P1 e 3 como P2 completas sem crash', R.ia.p1 === 3 && R.ia.p2 === 3 && !R.ia.err, JSON.stringify(R.ia));
    check('modos arcade/tag/survival sem crash', R.arcade && !R.arcade.err && R.tag && !R.tag.err && R.surv && !R.surv.err, JSON.stringify({ arcade: R.arcade, tag: R.tag, surv: R.surv }));
    check('sem warning de folha do rafael', R.warn.length === 0, JSON.stringify(R.warn));
  }

  console.log('---');
  console.log('RAFAEL INTENSIVO: ' + (fails ? fails + ' FALHAS de ' + n : 'TUDO OK (' + n + ' checks)'));
  process.exit(fails ? 1 : 0);
})();
