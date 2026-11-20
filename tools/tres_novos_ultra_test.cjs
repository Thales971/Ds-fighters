// ULTRA INTENSIVO — KIRA + CRACKER + RAFAEL (os 3 novos juntos):
// registro, sprites em disco (tamanho exato, 0 magenta, 15 poses x 4 frames com conteudo,
// pe na baseline, sem pose congelada/duplicada, SEM SPRITE EXTRA (componente de borda = respingo
// da celula vizinha, o bug da Jess/Rafael/Cracker), atlas de habilidades, rosto/retrato no grid,
// render real + flip, cada poder em luta real (dano + status medidos), aura (kira), whiff punido
// (kira/rafael), OVERCLOCK do rafael (lowHpRage nos limites 35%), combo poder->soco, KO pela ult,
// IA dos dois lados, arcade/tag/survival/treino, qualidade baixa, sem warnings de folha.
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
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/fighters-dev-virado.js', 'js/data/fighters-milena.js', 'js/data/fighters-kira.js', 'js/data/fighters-cracker.js', 'js/data/fighters-rafael.js', 'js/data/roster-portraits.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }

// ---------- util JS puro: componentes conectados numa celula (downsample 4x) ----------
function cellComponents(img, px0, py0) {
  const CW = 320, CH = 260, K = 4;
  const w = CW / K, h = CH / K;
  const m = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = ((py0 + y * K) * img.width + px0 + x * K) * 4;
    if (img.data[i + 3] > 40) m[y * w + x] = 1;
  }
  const lab = new Int32Array(w * h); let nc = 0;
  for (let i = 0; i < w * h; i++) {
    if (!m[i] || lab[i]) continue;
    nc++; const stack = [i]; lab[i] = nc;
    while (stack.length) {
      const c = stack.pop(); const cx = c % w, cy = (c / w) | 0;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (m[j] && !lab[j]) { lab[j] = nc; stack.push(j); }
      }
    }
  }
  const sizes = new Array(nc + 1).fill(0); const edge = new Array(nc + 1).fill(false); const cxs = new Array(nc + 1).fill(0);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const l = lab[y * w + x]; if (!l) continue;
    sizes[l]++; cxs[l] += x;
    if (x === 0 || x === w - 1) edge[l] = true;
  }
  return { sizes, edge, cxs: cxs.map((v, i) => (i ? v / sizes[i] : 0)), w };
}

const FIGHTERS_CFG = {
  kira: { title: 'A Marteleira', stats: { hp: 200, power: 1.25, speed: 0.95, weight: 1.25 }, rosterIdx: 49,
    powers: ['quake', 'aura', 'pull', 'rain', 'rush'],
    expect: [ { st: ['shock'], dmg: 15, quake: true }, { aura: true }, { st: ['vuln', 'shock'], dmg: 8, pull: true }, { st: ['burn', 'shock'], dmg: 10 }, { st: ['shock', 'vuln'], dmg: 25, ult: true, rush: true } ] },
  cracker: { title: 'O Hacker', stats: { hp: 175, power: 1.1, speed: 1.12, weight: 0.95 }, rosterIdx: 50,
    powers: ['shot', 'steal', 'shadowport', 'zone', 'barrage'],
    expect: [ { st: ['poison', 'slow'], dmg: 8 }, { st: ['glitch'], dmg: 5, steal: true }, { st: ['glitch'], dmg: 8, invuln: true, blink: true }, { st: ['burn', 'slow'], dmg: 8, zone: true }, { st: ['locked', 'glitch', 'blind'], dmg: 10, ult: true, barrage: true } ] },
  rafael: { title: 'O Fixer de Night City', stats: { hp: 210, power: 1.3, speed: 0.85, weight: 1.3 }, rosterIdx: 51,
    powers: ['beam', 'blast', 'dash', 'rain', 'quake'],
    expect: [ { st: ['bleed'], dmg: 15, beam: true }, { st: ['shock', 'slow'], dmg: 10 }, { st: ['vuln'], dmg: 12, whiff: 20 }, { st: ['bleed', 'slow'], dmg: 12 }, { st: ['bleed', 'vuln'], dmg: 30, ult: true, quake: true } ],
    rage: true },
};

(async () => {
  for (const fid of Object.keys(FIGHTERS_CFG)) {
    const cfg = FIGHTERS_CFG[fid];
    console.log('===== ' + fid.toUpperCase() + ' =====');
    // ===== 1. REGISTRO =====
    {
      const r = vm.runInContext(`
      (function(){
        const f = FIGHTERS.find((x) => x.id === '${fid}');
        const kit = POWERS['${fid}'];
        const sig = SIGNATURES['${fid}'];
        return JSON.stringify({
          found: !!f, name: f && f.name, title: f && f.title, stats: f && f.stats,
          moves: f && Object.keys(f.moves), quotes: !!(f && f.quotes && f.quotes.super && f.quotes.super.length),
          powers: kit ? kit.powers.map((p) => p.kind + ':row' + p.row + (p.whiffRecovery ? ':W' + p.whiffRecovery : '') + (p.defMult ? ':def' + p.defMult : '') + (Object.keys(p.fx||{}).length ? ':fx' + Object.keys(p.fx).length : '')) : null,
          sig: sig && sig.trait, rage: sig && sig.lowHpRage, stunMult: sig && sig.stunMult,
          layoutFile: SPRITE_LAYOUT.files['${fid}'],
          perFighter: !!(SPRITE_LAYOUT.perFighter && SPRITE_LAYOUT.perFighter['${fid}']),
          artAbil: !!ART_SHEETS['abil:${fid}'], artFx2: !!ART_SHEETS['fx2:${fid}'],
          roster: ROSTER_PORTRAITS.order.indexOf('${fid}'),
          unlocked: Profile.isUnlocked('${fid}'),
        });
      })()`, ctx);
      const R = JSON.parse(r);
      check(`${fid}: registrado (nome/titulo/stats/moves/quotes)`, R.found && R.name === fid.toUpperCase() && R.title === cfg.title && R.stats.hp === cfg.stats.hp && R.stats.power === cfg.stats.power && R.moves.join(',') === 'punch,kick' && R.quotes, JSON.stringify({ name: R.name, title: R.title, stats: R.stats }));
      check(`${fid}: 5 poderes rows 0-4 nos kinds esperados`, R.powers && R.powers.length === 5 && cfg.powers.every((k, i) => R.powers[i].startsWith(k)), R.powers && R.powers.join(' | '));
      check(`${fid}: layout/art/grid (roster idx ${cfg.rosterIdx}) e desbloqueado`, R.layoutFile === `assets/sprites/${fid}.png` && R.perFighter && R.artAbil && R.artFx2 && R.roster === cfg.rosterIdx && R.unlocked, 'idx ' + R.roster + ' sig ' + R.sig);
    }

    // ===== 2. SPRITES EM DISCO (inclui deteccao de sprite extra) =====
    {
      const POSES = ['idle','walk','jump','crouch','punch','kick','cpunch','ckick','jpunch','jkick','special','hit','block','ko','win'];
      const img = PNG.sync.read(fs.readFileSync(`assets/sprites/${fid}.png`));
      check(`${fid}: sprites 1280x3900`, img.width === 1280 && img.height === 3900, img.width + 'x' + img.height);
      let mag = 0;
      for (let i = 0; i < img.data.length; i += 4) if (img.data[i] > 230 && img.data[i+1] < 30 && img.data[i+2] > 230 && img.data[i+3] > 60) mag++;
      check(`${fid}: 0 px magenta puro`, mag === 0, mag + ' px');
      let empty = [], feetBad = [], frozen = [], dup = [], extra = [];
      const hashes = [];
      for (let pi = 0; pi < 15; pi++) {
        const fhs = [];
        for (let f = 0; f < 4; f++) {
          let cnt = 0, maxY = -1;
          for (let y = 0; y < 260; y++) for (let x = 0; x < 320; x++) {
            const i = ((pi * 260 + y) * img.width + f * 320 + x) * 4;
            if (img.data[i + 3] > 8) { cnt++; if (y > maxY) maxY = y; }
          }
          if (cnt < 200) empty.push(POSES[pi] + ':f' + f);
          const want = POSES[pi].startsWith('j') ? 220 : 246;
          if (POSES[pi] !== 'ko' && maxY >= 0 && Math.abs(maxY - want) > 14) feetBad.push(POSES[pi] + ':f' + f + '=y' + maxY);
          let h = 0; for (let y = 0; y < 260; y += 3) for (let x = 0; x < 320; x += 3) { const i = ((pi*260+y)*img.width + f*320 + x)*4; h = (h * 31 + img.data[i+3]) >>> 0; }
          fhs.push(h);
          // sprite extra: componente de borda (esq/dir) < 25% do maior, > 400px reais (25 no downsample)
          const cc = cellComponents(img, f * 320, pi * 260);
          const mx = Math.max(...cc.sizes.slice(1));
          for (let l = 1; l < cc.sizes.length; l++) {
            if (cc.sizes[l] > 25 && cc.edge[l] && cc.sizes[l] < mx * 0.25) extra.push(`${POSES[pi]}:f${f}:comp${cc.sizes[l]*16}px@cx${Math.round(cc.cxs[l]*4)}`);
          }
        }
        if (new Set(fhs).size < 2) frozen.push(POSES[pi]);
        hashes.push(fhs.join('-'));
      }
      if (hashes.filter((h, i) => hashes.indexOf(h) !== i).length) dup.push('ha poses duplicadas');
      check(`${fid}: 15 poses x 4 frames com conteudo e pe na baseline`, empty.length === 0 && feetBad.length === 0, [empty.join(','), feetBad.join(',')].filter(Boolean).join(' | ') || 'ok');
      check(`${fid}: sem pose congelada e sem pose duplicada`, frozen.length === 0 && dup.length === 0, [frozen.join(','), dup.join(',')].filter(Boolean).join(' ') || 'ok');
      check(`${fid}: SEM sprite extra (sem respingo de celula vizinha nas bordas)`, extra.length === 0, extra.slice(0, 6).join(' | ') || 'ok');
      const ab = PNG.sync.read(fs.readFileSync(`assets/abilities/${fid}.png`));
      let abMag = 0; for (let i = 0; i < ab.data.length; i += 4) if (ab.data[i] > 230 && ab.data[i+1] < 30 && ab.data[i+2] > 230 && ab.data[i+3] > 60) abMag++;
      const rows = [];
      for (let r = 0; r < 5; r++) { let c = 0; for (let y = 0; y < 128; y++) for (let x = 128; x < 256; x++) { const i = (r*128+y)*ab.width*4 + x*4; if (ab.data[i+3] > 8) c++; } rows.push(c); }
      check(`${fid}: abilities 512x640 sem magenta, 5 linhas com icone`, ab.width === 512 && ab.height === 640 && abMag === 0 && rows.every((c) => c > 500), `mag=${abMag} rows=${rows.join(',')}`);
      const face = PNG.sync.read(fs.readFileSync(`assets/ui/face-${fid}.png`));
      const port = PNG.sync.read(fs.readFileSync(`assets/ui/portrait-${fid}.png`));
      let fn = 0; for (let i = 3; i < face.data.length; i += 4) if (face.data[i] > 8) fn++;
      let pn = 0; for (let i = 3; i < port.data.length; i += 4) if (port.data[i] > 8) pn++;
      check(`${fid}: face 168x168 e portrait 320x360 com conteudo`, face.width === 168 && port.width === 320 && port.height === 360 && fn > 3000 && pn > 10000, `face=${fn} port=${pn}`);
      const atlas = PNG.sync.read(fs.readFileSync('assets/ui/roster-portraits.png'));
      const col = cfg.rosterIdx % 7, row = (cfg.rosterIdx / 7) | 0;
      let cellN = 0; for (let y = row*96; y < row*96+96; y++) for (let x = col*96; x < col*96+96; x++) { const i = (y*atlas.width + x)*4; if (atlas.data[i+3] > 8) cellN++; }
      check(`${fid}: retrato no atlas do grid (idx ${cfg.rosterIdx})`, cellN > 2000, `cell=${cellN}px atlas=${atlas.width}x${atlas.height}`);
    }

    // ===== 3+4. RENDER REAL + LUTAS REAIS =====
    {
      ctx.__mkCanvas = createCanvas;
      const img = await loadImage(`assets/sprites/${fid}.png`);
      ctx.__img = img;
      const r = vm.runInContext(`
      (function(){
        SpriteGen.images['${fid}'] = __img;
        const cv = __mkCanvas(1280, 3900);
        const c = cv.getContext('2d');
        for (let pi = 0; pi < SPRITE_LAYOUT.poses.length; pi++)
          for (let f = 0; f < 4; f++)
            SpriteGen.blit(c, '${fid}', SPRITE_LAYOUT.poses[pi], f, 1, f * 320 + 160, pi * 260 + 246);
        const d = c.getImageData(0, 0, 1280, 3900).data;
        const bad = [];
        for (let pi = 0; pi < 15; pi++) { let n = 0; for (let y = 0; y < 260; y++) for (let x = 0; x < 1280; x++) { const i = ((pi*260+y)*1280 + x)*4; if (d[i+3] > 8) n++; } if (n < 800) bad.push(SPRITE_LAYOUT.poses[pi]); }
        const cv2 = __mkCanvas(640, 260);
        const c2 = cv2.getContext('2d');
        SpriteGen.blit(c2, '${fid}', 'idle', 0, 1, 160, 246);
        SpriteGen.blit(c2, '${fid}', 'idle', 0, -1, 480, 246);
        const d2 = c2.getImageData(0, 0, 640, 260).data;
        let n1 = 0, n2 = 0, diff = 0;
        for (let y = 0; y < 260; y++) for (let x = 0; x < 320; x++) {
          const i = (y*640+x)*4, j = (y*640+x+320)*4;
          if (d2[i+3] > 8) n1++; if (d2[j+3] > 8) n2++;
          if (Math.abs(d2[i]-d2[j]) + Math.abs(d2[i+1]-d2[j+1]) + Math.abs(d2[i+2]-d2[j+2]) > 30) diff++;
        }
        const fake2d = () => ({ canvas: null, save(){}, restore(){}, clearRect(){}, fillRect(){}, strokeRect(){}, drawImage(){}, translate(){}, scale(){}, rotate(){}, beginPath(){}, moveTo(){}, lineTo(){}, closePath(){}, quadraticCurveTo(){}, ellipse(){}, arc(){}, fill(){}, stroke(){}, fillText(){}, strokeText(){}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop(){} }), createRadialGradient: () => ({ addColorStop(){} }), createPattern: () => ({}), getImageData: () => ({ data: new Uint8ClampedArray(4) }), putImageData(){} });
        const WATCH = ['bleed','shock','vuln','slow','poison','blind','glitch','burn','locked','chill','freeze'];
        const mk = (opts) => {
          const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), classList: { toggle(){},add(){},remove(){} } });
          g.start(Object.assign({ mode: 'versus', teams: [['${fid}'], ['du']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 }, opts || {}));
          for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
          return g;
        };
        const prep = (g) => { const me = g.activeOf(0), op = g.activeOf(1); me.x = 380; op.x = 450; me.dir = 1; op.status = {}; op.guardUp = false; me.cd = [0,0,0,0,0]; me.charge = [100,100]; me.castLock = 0; me.state = 'idle'; me.cast = null; return [me, op]; };
        const castAndWatch = (row, ticks) => {
          const g = mk(); const [me, op] = prep(g);
          const hp0 = op.hp, x0 = op.x, mx0 = me.x;
          if (row === 2 && '${fid}' === 'cracker') g.rnd = () => 0.1; // blink por cima -> slam
          if (row === 2 && '${fid}' === 'kira') op.x = me.x + 300; // alvo longe dentro do range do pull (380)
          me.tryCast(row);
          const seen = {}; let inv = false, rush = false, stun = 0, aura = false, defA = 1, defB = 1;
          let beam = false, zona = false, travou = false, maxProj = 0, puxou = false, roubou = false, teleportou = false;
          defB = me.defMult();
          for (let t = 0; t < ticks; t++) {
            g.tick();
            for (const s of WATCH) if (op.has(s)) seen[s] = true;
            if (me.has('invuln')) inv = true;
            if (me.state === 'rush') rush = true;
            if (me.has('aura')) { aura = true; defA = me.defMult(); }
            if (op.stun > 0 || op.state === 'hit') stun++;
            if (g.beams.some((b) => b.owner === me)) beam = true;
            if (g.zones.some((z) => z.owner === me)) zona = true;
            if (op.has('freeze') || op.quakeHold) travou = true;
            maxProj = Math.max(maxProj, g.projectiles.length);
            if (Math.abs(op.x - mx0) < 100 && op.x !== x0) puxou = true;
            if (me.stolen) roubou = true;
            if (Math.abs(me.x - mx0) > 30 || me.hidden) teleportou = true;
          }
          return { dmg: Math.round((hp0 - op.hp) * 10) / 10, seen, inv, rush, stun, aura, defA, defB, beam, zona, travou, maxProj, puxou, roubou, teleportou };
        };
        const out = { bad, flip: { n1, n2, diff }, powers: [] };
        for (let row = 0; row < 5; row++) {
          if (row === 4) { const g = mk(); const [me, op] = prep(g); const hp0 = op.hp; me.ultimate = 100; me.tryCast(4); const gasta = me.ultimate === 0; const seen = {}; let rush = false, travou = false, maxProj = 0; for (let t = 0; t < 300; t++) { g.tick(); for (const s of WATCH) if (op.has(s)) seen[s] = true; if (me.state === 'rush') rush = true; if (op.has('freeze') || op.quakeHold) travou = true; maxProj = Math.max(maxProj, g.projectiles.length); } out.powers.push({ row, dmg: Math.round((hp0 - op.hp) * 10) / 10, seen, rush, travou, maxProj, ultGasta: gasta }); }
          else out.powers.push(Object.assign({ row }, castAndWatch(row, 260)));
        }
        /* whiff do dash (row 2) e da ult (row 4) quando o poder tem whiffRecovery */
        const whiff = (row, ticks) => {
          const g = mk(); const [me, op] = prep(g);
          me.x = 120; op.x = 880; op.status = {};
          if (row === 4) me.ultimate = 100;
          me.tryCast(row);
          let hs = 0;
          for (let t = 0; t < ticks; t++) { g.tick(); hs = Math.max(hs, me.hitstun); }
          return hs;
        };
        out.whiffDash = whiff(2, 160);
        /* combo: poder row0 acertando + soco em seguida = dano extra */
        {
          const g = mk(); const [me, op] = prep(g);
          me.x = 400; op.x = 452;
          const hp0 = op.hp;
          me.tryCast(0);
          let t = 0;
          for (; t < 200 && op.hp === hp0; t++) g.tick();
          for (; t < 260 && (me.state !== 'idle' || me.cast); t++) g.tick();
          const afterPower = hp0 - op.hp;
          for (let k = 0; k < 40; k++) { me.update({ left: false, right: false, down: false, up: false, punch: true, kick: false }); g.tick(); me.update({ left: false, right: false, down: false, up: false, punch: false, kick: false }); g.tick(); }
          out.combo = { powerDmg: Math.round(afterPower * 10) / 10, total: Math.round((hp0 - op.hp) * 10) / 10 };
        }
        /* KO pela ult: op com pouca vida morre */
        {
          const g = mk(); const [me, op] = prep(g);
          op.hp = 10; me.ultimate = 100;
          me.tryCast(4);
          let t = 0;
          for (; t < 500 && op.alive && g.roundState === 'fight'; t++) g.tick();
          out.koUlt = { dead: !op.alive, ticks: t };
        }
        /* FURIA do rafael: dano row0 com 100% vs 30% vs 36% de vida */
        if ('${fid}' === 'rafael') {
          const measure = (frac) => { const g = mk(); const [me, op] = prep(g); me.hp = me.maxHp * frac; const hp0 = op.hp; me.tryCast(0); for (let t = 0; t < 200; t++) g.tick(); return Math.round((hp0 - op.hp) * 10) / 10; };
          out.rage = { full: measure(1.0), low30: measure(0.30), mid36: measure(0.36) };
        }
        /* IA dos dois lados + modos + qualidade baixa */
        const run = (opts, maxTicks) => {
          const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), classList: { toggle(){},add(){},remove(){} } });
          g.start(opts);
          let t = 0;
          for (; t < (maxTicks || 9000) && !g.matchOver; t++) g.tick();
          return { over: g.matchOver, ticks: t };
        };
        let p1 = 0, p2 = 0;
        for (let k = 0; k < 3; k++) { try { if (run({ mode: 'versus', teams: [['${fid}'], ['du']], stage: 'random', cpu: [true, true], roundsToWin: 1, timer: 60, difficulty: 1 }).over) p1++; } catch (e) { out.errP1 = e.message; } }
        for (let k = 0; k < 3; k++) { try { if (run({ mode: 'versus', teams: [['du'], ['${fid}']], stage: 'random', cpu: [true, true], roundsToWin: 1, timer: 60, difficulty: 2 }).over) p2++; } catch (e) { out.errP2 = e.message; } }
        out.ia = { p1, p2, err: out.errP1 || out.errP2 || null };
        try { out.arcade = run({ mode: 'arcade', teams: [['${fid}'], ['stack']], stage: 'random', cpu: [false, true], roundsToWin: 1, timer: 99, difficulty: 1 }); } catch (e) { out.arcade = { err: e.message }; }
        try { out.tag = run({ mode: 'tag', teams: [['${fid}', 'milena'], ['du', 'dev-virado']], stage: 'random', cpu: [false, true], roundsToWin: 1, timer: 99, difficulty: 1 }, 12000); } catch (e) { out.tag = { err: e.message }; }
        try { out.surv = run({ mode: 'survival', teams: [['${fid}'], ['du']], stage: 'random', cpu: [false, true], roundsToWin: 1, timer: 99, difficulty: 1 }); } catch (e) { out.surv = { err: e.message }; }
        try { out.treino = run({ mode: 'versus', teams: [['${fid}'], ['du']], stage: 'treino-dojo', cpu: [false, true], roundsToWin: 1, timer: 30, difficulty: 1 }, 4000); } catch (e) { out.treino = { err: e.message }; }
        store.quality = 'low';
        try { const g = mk(); for (let t = 0; t < 300 && g.roundState !== 'fight'; t++) g.tick(); for (let t = 0; t < 120; t++) { g.tick(); g.render(1); } out.lowQ = { qFxOn: g.qFxOn, qRim: g.qRim, err: null }; } catch (e) { out.lowQ = { err: e.message }; }
        store.quality = 'medium';
        const g2 = mk();
        out.warn = (g2.spriteWarnings || []).filter((w) => w.includes('${fid}'));
        return JSON.stringify(out);
      })()`, ctx);
      const R = JSON.parse(r);
      check(`${fid}: blit renderiza as 15 poses no canvas real`, R.bad.length === 0, R.bad.join(',') || 'ok');
      check(`${fid}: flip dir=-1 espelha e mantem conteudo`, R.flip.n1 > 5000 && R.flip.n2 > 5000 && R.flip.diff > 1000, JSON.stringify(R.flip));
      for (let row = 0; row < 5; row++) {
        const ex = cfg.expect[row], got = R.powers[row];
        const extras = [];
        if (ex.quake) extras.push(['quake trava', got.travou]);
        if (ex.pull) extras.push(['pull puxou o rival', got.puxou]);
        if (ex.steal) extras.push(['steal roubou o kit', got.roubou]);
        if (ex.blink) extras.push(['blink teleportou', got.teleportou]);
        if (ex.zone) extras.push(['zone criada', got.zona]);
        if (ex.beam) extras.push(['beam desenhado', got.beam]);
        if (ex.barrage) extras.push(['barrage soltou projeteis', got.maxProj >= 3]);
        if (ex.rush) extras.push(['estado rush', got.rush]);
        if (ex.aura) {
          check(`${fid}: poder row${row} (aura) liga aura e derruba defMult`, got.aura && got.defA < got.defB * 0.7, JSON.stringify(got));
        } else if (ex.ult) {
          check(`${fid}: ULT row4 com dano >= ${ex.dmg} + status ${ex.st.join('+')} + gasta ultimate + [${extras.map((e) => e[0]).join(',')}]`, got.ultGasta && got.dmg >= ex.dmg && ex.st.every((s) => got.seen[s]) && extras.every((e) => e[1]), JSON.stringify(got));
        } else {
          check(`${fid}: poder row${row} causa dano >= ${ex.dmg} + status ${ex.st.join('+')}${ex.invuln ? ' + iFrames' : ''}${extras.length ? ' + ' + extras.map((e) => e[0]).join(',') : ''}`, got.dmg >= ex.dmg && ex.st.every((s) => got.seen[s]) && (!ex.invuln || got.inv) && extras.every((e) => e[1]), JSON.stringify(got));
        }
        if (ex.whiff) check(`${fid}: dash row${row} ERRADO pune com hitstun >= ${ex.whiff}`, R.whiffDash >= ex.whiff, 'hitstun=' + R.whiffDash);
      }
      check(`${fid}: combo poder->soco causa dano extra alem do poder`, R.combo.total > R.combo.powerDmg && R.combo.powerDmg > 0, JSON.stringify(R.combo));
      check(`${fid}: KO pela ultimate (op com 10 hp morre)`, R.koUlt.dead, JSON.stringify(R.koUlt));
      if (cfg.rage) {
        const ratioLow = R.rage.low30 / Math.max(0.1, R.rage.full), ratioMid = R.rage.mid36 / Math.max(0.1, R.rage.full);
        check(`${fid}: FURIA - lowHpRage: dano em 30% hp ~1.25x (${ratioLow.toFixed(2)}) e SEM bonus em 36% (${ratioMid.toFixed(2)})`, ratioLow > 1.15 && ratioLow < 1.4 && ratioMid < 1.08, JSON.stringify(R.rage));
      }
      check(`${fid}: IA 3x como P1 e 3x como P2 sem crash`, R.ia.p1 === 3 && R.ia.p2 === 3 && !R.ia.err, JSON.stringify(R.ia));
      check(`${fid}: modos arcade/tag/survival/treino sem crash`, R.arcade && !R.arcade.err && R.tag && !R.tag.err && R.surv && !R.surv.err && R.treino && !R.treino.err, JSON.stringify({ a: R.arcade, t: R.tag, s: R.surv, tr: R.treino }));
      check(`${fid}: qualidade baixa renderiza sem crash (qFxOn=false)`, R.lowQ && !R.lowQ.err && R.lowQ.qFxOn === false, JSON.stringify(R.lowQ));
      check(`${fid}: sem warning de folha`, R.warn.length === 0, JSON.stringify(R.warn));
    }
  }

  console.log('---');
  console.log('TRES NOVOS ULTRA (kira+cracker+rafael): ' + (fails ? fails + ' FALHAS de ' + n : 'TUDO OK (' + n + ' checks)'));
  process.exit(fails ? 1 : 0);
})();
