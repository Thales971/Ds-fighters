// INTENSIVO MILENA: registro, sprites recortados (sem magenta/vazios/duplicados),
// habilidades (alerta slow, varredura stun, dash iFrames, erros em cascata glitch,
// ult tela azul kernel), render real, IA e modos.
const fs = require('fs'); const vm = require('vm');
function req(name){ try { return require(name); } catch(e){ return require('/tmp/node_modules/'+name); } }
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
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/fighters-dev-virado.js', 'js/data/fighters-milena.js', 'js/data/roster-portraits.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }

(async () => {
  // ===== 1. REGISTRO =====
  {
    const r = vm.runInContext(`
    (function(){
      const f = FIGHTERS.find((x) => x.id === 'milena');
      const kit = POWERS['milena'];
      const sig = SIGNATURES['milena'];
      return JSON.stringify({
        found: !!f, name: f && f.name, title: f && f.title, stats: f && f.stats,
        moves: f && Object.keys(f.moves), quotes: f && Object.keys(f.quotes),
        powers: kit ? kit.powers.map((p) => p.id + ':' + p.slot + ':' + p.kind + ':row' + p.row + (p.kernel ? ':KERNEL' : '')) : null,
        fxmap: kit ? kit.powers.map((p) => p.id + '=' + Object.keys(p.fx || {}).sort().join('+')) : null,
        sig: sig && sig.trait,
        layoutFile: SPRITE_LAYOUT.files['milena'],
        perFighter: !!(SPRITE_LAYOUT.perFighter && SPRITE_LAYOUT.perFighter['milena']),
        artAbil: !!ART_SHEETS['abil:milena'], artFx2: !!ART_SHEETS['fx2:milena'],
        roster: ROSTER_PORTRAITS.order.includes('milena'),
        unlocked: Profile.isUnlocked('milena'),
      });
    })()`, ctx);
    const R = JSON.parse(r);
    check('registrada no FIGHTERS (nome/titulo/stats/moves/quotes)', R.found && R.name === 'MILENA' && R.title === 'A Janela de Erro' && R.stats.hp === 170 && R.moves.join(',') === 'punch,kick' && R.quotes.includes('super'), JSON.stringify({ name: R.name, title: R.title, stats: R.stats }));
    check('POWERS: 5 poderes (shot/blast/dash/rain/ult kernel), rows 0-4', R.powers && R.powers.length === 5 && R.powers[4].includes('ultimate') && R.powers[4].includes('KERNEL'), R.powers && R.powers.join(' | '));
    check('BUFF: power 1.12 e debuffs no oponente (alerta slow+vuln, varredura chill, fuga vuln, cascata glitch+blind+poison, ult bleed+blind)', R.stats.power === 1.12 && R.fxmap && R.fxmap[0].includes('slow') && R.fxmap[0].includes('vuln') && R.fxmap[1].includes('chill') && R.fxmap[2].includes('vuln') && R.fxmap[3].includes('glitch') && R.fxmap[3].includes('blind') && R.fxmap[3].includes('poison') && R.fxmap[4].includes('bleed') && R.fxmap[4].includes('blind'), JSON.stringify(R.fxmap));
    check('layout/art atlas/grid registrados e desbloqueada por padrao', R.layoutFile === 'assets/sprites/milena.png' && R.perFighter && R.artAbil && R.artFx2 && R.roster && R.unlocked && R.sig === 'ALERTA DO SISTEMA', '');
  }

  // ===== 2. SPRITES EM DISCO =====
  {
    const POSES = ['idle','walk','jump','crouch','punch','kick','cpunch','ckick','jpunch','jkick','special','hit','block','ko','win'];
    const img = PNG.sync.read(fs.readFileSync('assets/sprites/milena.png'));
    check('sprites/milena.png 1280x3900', img.width === 1280 && img.height === 3900, img.width + 'x' + img.height);
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
    const ab = PNG.sync.read(fs.readFileSync('assets/abilities/milena.png'));
    let abMag = 0; for (let i = 0; i < ab.data.length; i += 4) if (ab.data[i] > 230 && ab.data[i+1] < 30 && ab.data[i+2] > 230 && ab.data[i+3] > 60) abMag++;
    const rows = [];
    for (let r = 0; r < 5; r++) { let c = 0; for (let y = 0; y < 128; y++) for (let x = 128; x < 256; x++) { const i = (r*128+y)*ab.width*4 + x*4; if (ab.data[i+3] > 8) c++; } rows.push(c); }
    check('abilities 512x640 sem magenta, 5 linhas com icone', ab.width === 512 && ab.height === 640 && abMag === 0 && rows.every((c) => c > 500), `mag=${abMag} rows=${rows.join(',')}`);
    const face = PNG.sync.read(fs.readFileSync('assets/ui/face-milena.png'));
    const port = PNG.sync.read(fs.readFileSync('assets/ui/portrait-milena.png'));
    let fn = 0; for (let i = 3; i < face.data.length; i += 4) if (face.data[i] > 8) fn++;
    let pn = 0; for (let i = 3; i < port.data.length; i += 4) if (port.data[i] > 8) pn++;
    check('face 168x168 e portrait 320x360 com conteudo', face.width === 168 && port.width === 320 && port.height === 360 && fn > 3000 && pn > 10000, `face=${fn} port=${pn}`);
  }

  // ===== 3+4. RENDER + LUTA REAL =====
  {
    const img = await loadImage('assets/sprites/milena.png');
    ctx.__mImg = img;
    const r = vm.runInContext(`
    (function(){
      SpriteGen.images['milena'] = __mImg;
      /* render real das 15 poses */
      const cv = createCanvas(1280, 3900);
      const c = cv.getContext('2d');
      for (let pi = 0; pi < SPRITE_LAYOUT.poses.length; pi++)
        for (let f = 0; f < 4; f++)
          SpriteGen.blit(c, 'milena', SPRITE_LAYOUT.poses[pi], f, 1, f * 320 + 160, pi * 260 + 246);
      const d = c.getImageData(0, 0, 1280, 3900).data;
      const bad = [];
      for (let pi = 0; pi < 15; pi++) {
        let n = 0;
        for (let y = 0; y < 260; y++) for (let x = 0; x < 1280; x++) { const i = ((pi*260+y)*1280 + x)*4; if (d[i+3] > 8) n++; }
        if (n < 800) bad.push(SPRITE_LAYOUT.poses[pi]);
      }
      /* flip */
      const cv2 = createCanvas(640, 260);
      const c2 = cv2.getContext('2d');
      SpriteGen.blit(c2, 'milena', 'idle', 0, 1, 160, 246);
      SpriteGen.blit(c2, 'milena', 'idle', 0, -1, 480, 246);
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
        g.start(Object.assign({ mode: 'versus', teams: [['milena'], ['du']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 }, opts || {}));
        for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
        return g;
      };
      const prep = (g) => { const me = g.activeOf(0), op = g.activeOf(1); me.x = 300; op.x = 460; me.dir = 1; op.status = {}; op.guardUp = false; me.cd = [0,0,0,0,0]; me.castLock = 0; me.state = 'idle'; me.cast = null; return [me, op]; };
      const out = { bad, flip: { n1, n2, diff } };
      /* 1. Alerta (shot) aplica slow */
      {
        const g = mk(); const [me, op] = prep(g);
        me.tryCast(0);
        let slow = false, vuln = false, dmg = 0; const hp0 = op.hp;
        for (let t = 0; t < 200; t++) { g.tick(); if (op.has('slow')) slow = true; if (op.has('vuln')) vuln = true; }
        dmg = Math.round((hp0 - op.hp) * 10) / 10;
        out.alerta = { slow, vuln, dmg };
      }
      /* 2. Varredura Verde (blast) stun + dano */
      {
        const g = mk(); const [me, op] = prep(g);
        op.hp = op.maxHp;
        const hp0 = op.hp;
        me.tryCast(1);
        let stun = 0, chill = false;
        for (let t = 0; t < 160; t++) { g.tick(); if (op.stun > 0 || op.state === 'hit') stun++; if (op.has('chill')) chill = true; }
        out.varredura = { dmg: Math.round(hp0 - op.hp), stunTicks: stun, chill };
      }
      /* 3. Fuga do Erro (dash phase): iFrames + dano atravessando */
      {
        const g = mk(); const [me, op] = prep(g);
        me.x = 300; op.x = 420;
        const hp0 = op.hp;
        me.tryCast(2);
        let inv = false, vuln = false;
        for (let t = 0; t < 80; t++) { g.tick(); if (me.has('invuln')) inv = true; if (op.has('vuln')) vuln = true; }
        out.fuga = { invuln: inv, vuln, dmg: Math.round((hp0 - op.hp) * 10) / 10 };
      }
      /* 4. Erros em Cascata (rain) aplica glitch */
      {
        const g = mk(); const [me, op] = prep(g);
        me.cd = [0,0,0,0,0]; me.charge = [100, 100]; me.castLock = 0; me.state = 'idle'; me.cast = null;
        me.tryCast(3);
        let gl = false, blind = false, poison = false, dmg = 0; const hp0 = op.hp;
        for (let t = 0; t < 300; t++) { g.tick(); if (op.has('glitch')) gl = true; if (op.has('blind')) blind = true; if (op.has('poison')) poison = true; }
        dmg = Math.round((hp0 - op.hp) * 10) / 10;
        out.cascata = { glitch: gl, blind, poison, dmg };
      }
      /* 5. ULT Tela Azul: kernel -> game.bsod > 0 e dano massivo */
      {
        const g = mk(); const [me, op] = prep(g);
        const hp0 = op.hp;
        me.ultimate = 100;
        me.tryCast(4);
        let bsod = 0, ultGasta = me.ultimate === 0, bleed = false, blind = false;
        for (let t = 0; t < 200; t++) { g.tick(); bsod = Math.max(bsod, g.bsod); if (op.has('bleed')) bleed = true; if (op.has('blind')) blind = true; }
        out.ult = { bsod, bleed, blind, dmg: Math.round((hp0 - op.hp) * 10) / 10, ultGasta };
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
      for (let k = 0; k < 3; k++) { try { if (run({ mode: 'versus', teams: [['milena'], ['du']], stage: 'random', cpu: [true, true], roundsToWin: 1, timer: 60, difficulty: 1 }).over) p1++; } catch (e) { out.errP1 = e.message; } }
      for (let k = 0; k < 3; k++) { try { if (run({ mode: 'versus', teams: [['du'], ['milena']], stage: 'random', cpu: [true, true], roundsToWin: 1, timer: 60, difficulty: 2 }).over) p2++; } catch (e) { out.errP2 = e.message; } }
      out.ia = { p1, p2, err: out.errP1 || out.errP2 || null };
      try { out.arcade = run({ mode: 'arcade', teams: [['milena'], ['stack']], stage: 'random', cpu: [false, true], roundsToWin: 1, timer: 99, difficulty: 1 }); } catch (e) { out.arcade = { err: e.message }; }
      try { out.tag = run({ mode: 'tag', teams: [['milena', 'jess'], ['du', 'dev-virado']], stage: 'random', cpu: [false, true], roundsToWin: 1, timer: 99, difficulty: 1 }, 12000); } catch (e) { out.tag = { err: e.message }; }
      try { out.surv = run({ mode: 'survival', teams: [['milena'], ['du']], stage: 'random', cpu: [false, true], roundsToWin: 1, timer: 99, difficulty: 1 }); } catch (e) { out.surv = { err: e.message }; }
      /* sheet sem warning */
      const g = mk();
      out.warn = (g.spriteWarnings || []).filter((w) => w.includes('milena'));
      return JSON.stringify(out);
    })()`, ctx);
    const R = JSON.parse(r);
    check('blit renderiza as 15 poses no canvas real', R.bad.length === 0, R.bad.join(',') || 'ok');
    check('flip dir=-1 espelha e mantem conteudo', R.flip.n1 > 5000 && R.flip.n2 > 5000 && R.flip.diff > 1000, JSON.stringify(R.flip));
    check('Alerta do Sistema: projétil causa dano e aplica SLOW + VULN', R.alerta.dmg > 0 && R.alerta.slow && R.alerta.vuln, JSON.stringify(R.alerta));
    check('Varredura Verde: blast no alvo causa dano + stun + CHILL', R.varredura.dmg > 0 && R.varredura.stunTicks > 10 && R.varredura.chill, JSON.stringify(R.varredura));
    check('Fuga do Erro: dash com iFrames causa dano atravessando + VULN no rival', R.fuga.invuln && R.fuga.dmg > 0 && R.fuga.vuln, JSON.stringify(R.fuga));
    check('Erros em Cascata: chuva aplica GLITCH + CEGO + VENENO + dano', R.cascata.glitch && R.cascata.blind && R.cascata.poison && R.cascata.dmg > 0, JSON.stringify(R.cascata));
    check('ULT Tela Azul de Kernel: bsod>0 + SANGRAMENTO + CEGO, dano massivo, gasta ultimate', R.ult.bsod > 0 && R.ult.bleed && R.ult.blind && R.ult.dmg >= 25 && R.ult.ultGasta, JSON.stringify(R.ult));
    check('IA: 3 partidas como P1 e 3 como P2 completas sem crash', R.ia.p1 === 3 && R.ia.p2 === 3 && !R.ia.err, JSON.stringify(R.ia));
    check('modos arcade/tag/survival sem crash', R.arcade && !R.arcade.err && R.tag && !R.tag.err && R.surv && !R.surv.err, JSON.stringify({ arcade: R.arcade, tag: R.tag, surv: R.surv }));
    check('sem warning de folha da milena', R.warn.length === 0, JSON.stringify(R.warn));
  }

  console.log('---');
  console.log('MILENA INTENSIVO: ' + (fails ? fails + ' FALHAS de ' + n : 'TUDO OK (' + n + ' checks)'));
  process.exit(fails ? 1 : 0);
})();
