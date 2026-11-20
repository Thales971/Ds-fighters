// INTENSIVO KIRA: registro, sprites recortados das 3 folhas do dono (sem magenta/vazios/duplicados),
// habilidades (marretada quake trava+arremessa+shock, muralha aura -50% dano+cura, gancho pull que puxa+vuln+shock,
// erupcao rain burn+shock, ult martelada final rush+explode+shock+vuln), render real, IA e modos.
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
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/fighters-dev-virado.js', 'js/data/fighters-milena.js', 'js/data/fighters-kira.js', 'js/data/roster-portraits.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }

(async () => {
  // ===== 1. REGISTRO =====
  {
    const r = vm.runInContext(`
    (function(){
      const f = FIGHTERS.find((x) => x.id === 'kira');
      const kit = POWERS['kira'];
      const sig = SIGNATURES['kira'];
      return JSON.stringify({
        found: !!f, name: f && f.name, title: f && f.title, stats: f && f.stats,
        moves: f && Object.keys(f.moves), quotes: f && Object.keys(f.quotes),
        powers: kit ? kit.powers.map((p) => p.id + ':' + p.slot + ':' + p.kind + ':row' + p.row + (p.whiffRecovery ? ':WHIFF' + p.whiffRecovery : '')) : null,
        fxmap: kit ? kit.powers.map((p) => p.id + '=' + Object.keys(p.fx || {}).sort().join('+') + (p.defMult ? ':def' + p.defMult : '')) : null,
        sig: sig && sig.trait, stunMult: sig && sig.stunMult,
        layoutFile: SPRITE_LAYOUT.files['kira'],
        perFighter: !!(SPRITE_LAYOUT.perFighter && SPRITE_LAYOUT.perFighter['kira']),
        artAbil: !!ART_SHEETS['abil:kira'], artFx2: !!ART_SHEETS['fx2:kira'],
        roster: ROSTER_PORTRAITS.order.indexOf('kira'),
        rosterVersion: ROSTER_PORTRAITS.version,
        unlocked: Profile.isUnlocked('kira'),
      });
    })()`, ctx);
    const R = JSON.parse(r);
    check('registrada no FIGHTERS (KIRA / A Marteleira / hp200 power1.25)', R.found && R.name === 'KIRA' && R.title === 'A Marteleira' && R.stats.hp === 200 && R.stats.power === 1.25 && R.stats.weight === 1.25 && R.moves.join(',') === 'punch,kick' && R.quotes.includes('super'), JSON.stringify({ name: R.name, title: R.title, stats: R.stats }));
    check('POWERS: 5 poderes (quake/aura/pull/rain/ult rush), rows 0-4', R.powers && R.powers.length === 5 && R.powers[0].includes('quake') && R.powers[1].includes('aura') && R.powers[2].includes('pull') && R.powers[3].includes('rain') && R.powers[4].includes('ultimate') && R.powers[4].includes('rush'), R.powers && R.powers.join(' | '));
    check('debuffs/defesa nos poderes: marretada shock, muralha def0.5, gancho vuln+shock, erupcao burn+shock, ult explode+shock+vuln', R.fxmap && R.powers && R.fxmap[0].includes('shock') && R.fxmap[1].includes('def0.5') && R.fxmap[2].includes('vuln') && R.fxmap[2].includes('shock') && R.fxmap[3].includes('burn') && R.fxmap[3].includes('shock') && R.fxmap[4].includes('explode') && R.fxmap[4].includes('shock') && R.fxmap[4].includes('vuln'), JSON.stringify(R.fxmap));
    check('layout/art atlas/grid registrados (kira no fim do roster) e desbloqueada', R.layoutFile === 'assets/sprites/kira.png' && R.perFighter && R.artAbil && R.artFx2 && R.roster === 49 && R.sig === 'A MARTELEIRA' && R.stunMult === 1.2 && R.unlocked, 'roster idx ' + R.roster + ' ' + R.rosterVersion);
  }

  // ===== 2. SPRITES EM DISCO =====
  {
    const POSES = ['idle','walk','jump','crouch','punch','kick','cpunch','ckick','jpunch','jkick','special','hit','block','ko','win'];
    const img = PNG.sync.read(fs.readFileSync('assets/sprites/kira.png'));
    check('sprites/kira.png 1280x3900', img.width === 1280 && img.height === 3900, img.width + 'x' + img.height);
    let mag = 0;
    for (let i = 0; i < img.data.length; i += 4) if (img.data[i] > 230 && img.data[i+1] < 30 && img.data[i+2] > 230 && img.data[i+3] > 60) mag++;
    check('0 px magenta puro no recorte', mag === 0, mag + ' px');
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
    const ab = PNG.sync.read(fs.readFileSync('assets/abilities/kira.png'));
    let abMag = 0; for (let i = 0; i < ab.data.length; i += 4) if (ab.data[i] > 230 && ab.data[i+1] < 30 && ab.data[i+2] > 230 && ab.data[i+3] > 60) abMag++;
    const rows = [];
    for (let r = 0; r < 5; r++) { let c = 0; for (let y = 0; y < 128; y++) for (let x = 128; x < 256; x++) { const i = (r*128+y)*ab.width*4 + x*4; if (ab.data[i+3] > 8) c++; } rows.push(c); }
    check('abilities 512x640 sem magenta, 5 linhas com icone (martelo/escudo/seta/explosao/ult)', ab.width === 512 && ab.height === 640 && abMag === 0 && rows.every((c) => c > 500), `mag=${abMag} rows=${rows.join(',')}`);
    const face = PNG.sync.read(fs.readFileSync('assets/ui/face-kira.png'));
    const port = PNG.sync.read(fs.readFileSync('assets/ui/portrait-kira.png'));
    let fn = 0; for (let i = 3; i < face.data.length; i += 4) if (face.data[i] > 8) fn++;
    let pn = 0; for (let i = 3; i < port.data.length; i += 4) if (port.data[i] > 8) pn++;
    check('face 168x168 e portrait 320x360 com conteudo', face.width === 168 && port.width === 320 && port.height === 360 && fn > 3000 && pn > 10000, `face=${fn} port=${pn}`);
    const atlas = PNG.sync.read(fs.readFileSync('assets/ui/roster-portraits.png'));
    let cellN = 0; for (let y = 7*96; y < 8*96; y++) for (let x = 0; x < 96; x++) { const i = (y*atlas.width + x)*4; if (atlas.data[i+3] > 8) cellN++; }
    check('atlas do grid cresceu pra 672x768 e a celula da kira (idx 49) tem retrato', atlas.width === 672 && atlas.height === 768 && cellN > 2000, `atlas=${atlas.width}x${atlas.height} cell=${cellN}px`);
  }

  // ===== 3+4. RENDER + LUTA REAL =====
  {
    ctx.__mkCanvas = createCanvas;
    const img = await loadImage('assets/sprites/kira.png');
    ctx.__kImg = img;
    const r = vm.runInContext(`
    (function(){
      SpriteGen.images['kira'] = __kImg;
      const cv = __mkCanvas(1280, 3900);
      const c = cv.getContext('2d');
      for (let pi = 0; pi < SPRITE_LAYOUT.poses.length; pi++)
        for (let f = 0; f < 4; f++)
          SpriteGen.blit(c, 'kira', SPRITE_LAYOUT.poses[pi], f, 1, f * 320 + 160, pi * 260 + 246);
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
      SpriteGen.blit(c2, 'kira', 'idle', 0, 1, 160, 246);
      SpriteGen.blit(c2, 'kira', 'idle', 0, -1, 480, 246);
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
        g.start(Object.assign({ mode: 'versus', teams: [['kira'], ['du']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 }, opts || {}));
        for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
        return g;
      };
      const prep = (g) => { const me = g.activeOf(0), op = g.activeOf(1); me.x = 300; op.x = 460; me.dir = 1; op.status = {}; op.guardUp = false; me.cd = [0,0,0,0,0]; me.castLock = 0; me.state = 'idle'; me.cast = null; return [me, op]; };
      const out = { bad, flip: { n1, n2, diff } };
      /* 1. Marretada (quake no alvo perto): dano + trava (freeze/quakeHold) + SHOCK */
      {
        const g = mk(); const [me, op] = prep(g);
        op.x = 300 + 140;
        const hp0 = op.hp;
        me.tryCast(0);
        let shock = false, travou = false, stun = 0;
        for (let t = 0; t < 160; t++) { g.tick(); if (op.has('shock')) shock = true; if (op.has('freeze') || op.quakeHold) travou = true; if (op.stun > 0 || op.state === 'hit') stun++; }
        out.marretada = { dmg: Math.round((hp0 - op.hp) * 10) / 10, stunTicks: stun, shock, travou };
      }
      /* 2. Muralha Azul (aura): status aura + defMult cai ~50% + cura 15 */
      {
        const g = mk(); const [me, op] = prep(g);
        me.hp = me.maxHp - 50;
        const base = me.defMult();
        me.tryCast(1);
        let aura = false, defAura = 1, healed = false;
        for (let t = 0; t < 60; t++) { g.tick(); if (me.has('aura')) { aura = true; defAura = me.defMult(); } if (me.hp >= me.maxHp - 35) healed = true; }
        out.muralha = { aura, base: Math.round(base * 100) / 100, defAura: Math.round(defAura * 100) / 100, healed };
      }
      /* 3a. Gancho do Martelo (pull) acertando: dano + PUXA o rival + vuln/shock */
      {
        const g = mk(); const [me, op] = prep(g);
        me.x = 300; op.x = 460;
        const hp0 = op.hp, x0 = op.x;
        me.tryCast(2);
        let vuln = false, shock = false;
        for (let t = 0; t < 90; t++) { g.tick(); if (op.has('vuln')) vuln = true; if (op.has('shock')) shock = true; }
        out.ganchoHit = { dmg: Math.round((hp0 - op.hp) * 10) / 10, puxou: op.x < x0 - 40, opX: Math.round(op.x), vuln, shock };
      }
      /* 3b. Gancho com alvo FORA do alcance (380): nao puxa */
      {
        const g = mk(); const [me, op] = prep(g);
        me.x = 120; op.x = 880; op.status = {};
        const x0 = op.x;
        me.tryCast(2);
        for (let t = 0; t < 90; t++) g.tick();
        out.ganchoLonge = { naoPuxou: op.x > x0 - 40, opX: Math.round(op.x) };
      }
      /* 4. Erupcao (rain): dano + BURN */
      {
        const g = mk(); const [me, op] = prep(g);
        me.cd = [0,0,0,0,0]; me.charge = [100, 100]; me.castLock = 0; me.state = 'idle'; me.cast = null;
        me.tryCast(3);
        let burn = false, shock = false, dmg = 0; const hp0 = op.hp;
        for (let t = 0; t < 300; t++) { g.tick(); if (op.has('burn')) burn = true; if (op.has('shock')) shock = true; }
        dmg = Math.round((hp0 - op.hp) * 10) / 10;
        out.erupcao = { burn, shock, dmg };
      }
      /* 5. ULT Martelada Final (rush 4 hits): dano massivo + shock/vuln, gasta ultimate */
      {
        const g = mk(); const [me, op] = prep(g);
        const hp0 = op.hp;
        me.ultimate = 100;
        me.tryCast(4);
        let rushState = false, shock = false, vuln = false, ultGasta = me.ultimate === 0;
        for (let t = 0; t < 260; t++) { g.tick(); if (me.state === 'rush') rushState = true; if (op.has('shock')) shock = true; if (op.has('vuln')) vuln = true; }
        out.ult = { rushState, shock, vuln, dmg: Math.round((hp0 - op.hp) * 10) / 10, ultGasta };
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
      for (let k = 0; k < 3; k++) { try { if (run({ mode: 'versus', teams: [['kira'], ['du']], stage: 'random', cpu: [true, true], roundsToWin: 1, timer: 60, difficulty: 1 }).over) p1++; } catch (e) { out.errP1 = e.message; } }
      for (let k = 0; k < 3; k++) { try { if (run({ mode: 'versus', teams: [['du'], ['kira']], stage: 'random', cpu: [true, true], roundsToWin: 1, timer: 60, difficulty: 2 }).over) p2++; } catch (e) { out.errP2 = e.message; } }
      out.ia = { p1, p2, err: out.errP1 || out.errP2 || null };
      try { out.arcade = run({ mode: 'arcade', teams: [['kira'], ['stack']], stage: 'random', cpu: [false, true], roundsToWin: 1, timer: 99, difficulty: 1 }); } catch (e) { out.arcade = { err: e.message }; }
      try { out.tag = run({ mode: 'tag', teams: [['kira', 'milena'], ['du', 'dev-virado']], stage: 'random', cpu: [false, true], roundsToWin: 1, timer: 99, difficulty: 1 }, 12000); } catch (e) { out.tag = { err: e.message }; }
      try { out.surv = run({ mode: 'survival', teams: [['kira'], ['du']], stage: 'random', cpu: [false, true], roundsToWin: 1, timer: 99, difficulty: 1 }); } catch (e) { out.surv = { err: e.message }; }
      /* sheet sem warning */
      const g = mk();
      out.warn = (g.spriteWarnings || []).filter((w) => w.includes('kira'));
      return JSON.stringify(out);
    })()`, ctx);
    const R = JSON.parse(r);
    check('blit renderiza as 15 poses no canvas real', R.bad.length === 0, R.bad.join(',') || 'ok');
    check('flip dir=-1 espelha e mantem conteudo', R.flip.n1 > 5000 && R.flip.n2 > 5000 && R.flip.diff > 1000, JSON.stringify(R.flip));
    check('Marretada (quake): dano + trava o rival + ELETRIZADO', R.marretada.dmg > 0 && R.marretada.stunTicks > 5 && R.marretada.shock && R.marretada.travou, JSON.stringify(R.marretada));
    check('Muralha Azul: aura liga, defMult cai ~50% e cura 15 HP', R.muralha.aura && R.muralha.defAura < R.muralha.base * 0.65 && R.muralha.healed, JSON.stringify(R.muralha));
    check('Gancho do Martelo acertando: dano + PUXA o rival + VULN + ELETRIZADO', R.ganchoHit.dmg > 0 && R.ganchoHit.puxou && R.ganchoHit.vuln && R.ganchoHit.shock, JSON.stringify(R.ganchoHit));
    check('Gancho com alvo fora do alcance (380px) nao puxa', R.ganchoLonge.naoPuxou, JSON.stringify(R.ganchoLonge));
    check('Erupcao: chuva de explosoes causa dano + QUEIMANDO + ELETRIZADO', R.erupcao.burn && R.erupcao.shock && R.erupcao.dmg > 0, JSON.stringify(R.erupcao));
    check('ULT Martelada Final: rush (state rush) + dano massivo + shock/vuln, gasta ultimate', R.ult.rushState && R.ult.dmg >= 30 && R.ult.shock && R.ult.vuln && R.ult.ultGasta, JSON.stringify(R.ult));
    check('IA: 3 partidas como P1 e 3 como P2 completas sem crash', R.ia.p1 === 3 && R.ia.p2 === 3 && !R.ia.err, JSON.stringify(R.ia));
    check('modos arcade/tag/survival sem crash', R.arcade && !R.arcade.err && R.tag && !R.tag.err && R.surv && !R.surv.err, JSON.stringify({ arcade: R.arcade, tag: R.tag, surv: R.surv }));
    check('sem warning de folha da kira', R.warn.length === 0, JSON.stringify(R.warn));
  }

  console.log('---');
  console.log('KIRA INTENSIVO: ' + (fails ? fails + ' FALHAS de ' + n : 'TUDO OK (' + n + ' checks)'));
  process.exit(fails ? 1 : 0);
})();
