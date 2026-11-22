// ACESSORIOS — ENCAIXE NA CABECA (fase 2):
// - SpriteGen.headBox mede a cabeca de verdade (largura mediana logo abaixo do topo),
//   sem se enganar com mecha/rabo de cavalo
// - accPlacement encaixa cada tipo: chapeu SENTADO na cabeca (sem flutuar, sem ficar
//   gigante), oculos nos olhos, faixa na testa, fone em volta
// - 6 acessorios (gorro + bone/oculos/coroa/fone/faixa), 1 por "lugar" (slot)
// - pixel real: com gorro ligado em 10 lutadores, o gorro cobre o topo da cabeca
const fs = require('fs'); const vm = require('vm');
function req(name) { return require(name); }
const { createCanvas, Image: CanvasImage, loadImage } = req('canvas');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
// ===== 2-5. vm com engine real =====
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
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/balance.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/fighters-dev-virado.js', 'js/data/fighters-milena.js', 'js/data/fighters-kira.js', 'js/data/fighters-cracker.js', 'js/data/fighters-rafael.js', 'js/data/fighters-cyber-v2.js', 'js/data/fighters-lyra.js', 'js/data/fighters-larper.js', 'js/data/fighters-jester.js', 'js/data/fighters-domador.js', 'js/data/roster-portraits.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/data/accessories.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }

/* + os lutadores novos (cabeca medida pelo tronco: elefante, cajado, bolinhas) */
const SAMPLE = ['du', 'jess', 'stack', 'henrico', 'lobao', 'kira', 'hacker', 'merc', 'grika', 'xeon', 'cyber-psicopata', 'lyra', 'larper', 'jester', 'domador'];
(async () => {
  await vm.runInContext(`(async () => {
    for (const id of ${JSON.stringify(SAMPLE)}) SpriteGen.images[id] = await loadImage('assets/sprites/' + id + '.png');
    for (const a of ACC_LIST) ACC_IMAGES[a.id] = await loadImage(a.src);
  })()`, ctx);

  // ===== 1. catalogo =====
  const cat = JSON.parse(vm.runInContext(`JSON.stringify(ACC_LIST.map((a) => ({ id: a.id, slot: a.slot, fit: a.fit, on: accOn(a.id), src: a.src })))`, ctx));
  const ids = cat.map((a) => a.id);
  check('6 acessorios (gorro, bone, oculos, coroa, fone, faixa)', ['gorro-natal', 'bone', 'oculos', 'coroa', 'fone', 'faixa'].every((i) => ids.includes(i)), ids.join(','));
  check('todo acessorio tem PNG, slot e tipo de encaixe', cat.every((a) => fs.existsSync(a.src) && a.slot && a.fit), JSON.stringify(cat.map((a) => [a.id, a.slot, a.fit])));
  check('padrao: nenhum acessorio ligado (o jogador liga)', cat.filter((a) => a.on).length === 0, cat.filter((a) => a.on).map((a) => a.id).join());
  const ex = JSON.parse(vm.runInContext(`(() => {
    let s = accToggle({ 'gorro-natal': true }, 'bone', true);
    const r1 = { gorro: !!s['gorro-natal'], bone: !!s.bone };
    s = accToggle(s, 'oculos', true);
    const r2 = { bone: !!s.bone, oculos: !!s.oculos };
    s = accToggle(s, 'coroa', true);
    const r3 = { bone: !!s.bone, coroa: !!s.coroa, oculos: !!s.oculos };
    return JSON.stringify({ r1, r2, r3 });
  })()`, ctx));
  check('ligar o bone desliga o gorro (mesmo lugar: cabeca)', ex.r1.bone && !ex.r1.gorro, JSON.stringify(ex.r1));
  check('oculos convive com chapeu (lugares diferentes)', ex.r2.bone && ex.r2.oculos, JSON.stringify(ex.r2));
  check('coroa troca o bone e mantem os oculos', ex.r3.coroa && !ex.r3.bone && ex.r3.oculos, JSON.stringify(ex.r3));

  // ===== 2. medida da cabeca =====
  const boxes = JSON.parse(vm.runInContext(`JSON.stringify(Object.fromEntries(${JSON.stringify(SAMPLE)}.map((id) => [id, SpriteGen.headBox(id, 'idle')])))`, ctx));
  const anc = JSON.parse(vm.runInContext(`JSON.stringify(Object.fromEntries(${JSON.stringify(SAMPLE)}.map((id) => [id, SpriteGen.headAnchor(id, 'idle')])))`, ctx));
  for (const id of SAMPLE) {
    const b = boxes[id];
    check(id + ': cabeca medida com largura plausivel (18..90px)', b && b.w >= 18 && b.w <= 90 && b.y >= 0 && b.y < 140, JSON.stringify(b));
  }
  const fb = JSON.parse(vm.runInContext(`JSON.stringify(SpriteGen.headBox('lutador-sem-imagem', 'idle'))`, ctx));
  check('headBox sem imagem: fallback seguro', fb && fb.w > 0 && fb.h > 0, JSON.stringify(fb));

  // ===== 3. encaixe por tipo =====
  for (const id of SAMPLE) {
    const P = JSON.parse(vm.runInContext(`(() => {
      const b = SpriteGen.headBox('${id}', 'idle');
      const out = {};
      for (const a of ACC_LIST) { const im = ACC_IMAGES[a.id]; out[a.id] = accPlacement(a, b, 1, im.width, im.height); }
      return JSON.stringify({ b, out });
    })()`, ctx));
    const { b, out } = P;
    const g = out['gorro-natal'];
    check(id + ': gorro do tamanho da cabeca (1.1..1.5x largura)', g.w >= b.w * 1.1 && g.w <= b.w * 1.5, 'gorro=' + g.w.toFixed(0) + ' cabeca=' + b.w.toFixed(0));
    const bottom = g.y + g.h;
    check(id + ': gorro SENTADO na cabeca (base entre 20% e 60% da altura da cabeca)', bottom >= b.y + b.h * 0.2 && bottom <= b.y + b.h * 0.6, 'base=' + bottom.toFixed(0) + ' topo=' + b.y + ' h=' + b.h.toFixed(0));
    const o = out.oculos, oy = o.y + o.h / 2;
    check(id + ': oculos na altura dos olhos', oy >= b.y + b.h * 0.3 && oy <= b.y + b.h * 0.6 && o.w <= b.w * 1.15, 'centro=' + oy.toFixed(0));
    const f = out.faixa, fy = f.y + f.h / 2;
    check(id + ': faixa na testa', fy >= b.y + b.h * 0.12 && fy <= b.y + b.h * 0.4, 'centro=' + fy.toFixed(0));
  }

  // ===== 4. pixel real: gorro cobre o topo da cabeca em 10 lutadores =====
  const R = JSON.parse(await vm.runInContext(`(async () => {
    const canvas = createCanvas(960, 540); const cx = canvas.getContext('2d');
    const g = new Game(Object.assign(canvas, { classList: { remove() {}, add() {}, toggle() {} } }));
    const res = {};
    for (const id of ${JSON.stringify(SAMPLE)}) {
      g.start({ mode: 'versus', teams: [[id], ['du']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
      for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
      const f = g.activeOf(0); f.x = 300; f.y = 0; f.state = 'idle'; f.frame = 0; f.dir = 1;
      g.activeOf(1).x = 760;
      Profile.setting('acc', { 'gorro-natal': false }); cx.clearRect(0, 0, 960, 540); g.render(1);
      const a = cx.getImageData(0, 0, 960, 540).data.slice();
      Profile.setting('acc', { 'gorro-natal': true }); cx.clearRect(0, 0, 960, 540); g.render(1);
      const b = cx.getImageData(0, 0, 960, 540).data;
      let minY = 1e9, maxY = -1, cnt = 0, minX = 1e9, maxX = -1;
      for (let y = 0; y < 458; y++) for (let x = 120; x < 480; x++) { const i = (y * 960 + x) * 4; if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 60) { cnt++; if (y < minY) minY = y; if (y > maxY) maxY = y; if (x < minX) minX = x; if (x > maxX) maxX = x; } }
      const L = SPRITE_LAYOUT; const hb = SpriteGen.headBox(id, 'idle');
      const sc = (L.perFighter && L.perFighter[id] && L.perFighter[id].poseScale && L.perFighter[id].poseScale.idle) || L.drawScale || 1;
      const headTop = f.y + 458 - L.baseline * sc + hb.y * sc;
      res[id] = { cnt, minY, maxY, w: maxX - minX, headTop: Math.round(headTop), headW: Math.round(hb.w * sc), headH: Math.round(hb.h * sc) };
      g.stop && g.stop();
    }
    return JSON.stringify(res);
  })()`, ctx));
  for (const id of SAMPLE) {
    const r = R[id];
    check(id + ': gorro desenhado e cobrindo o topo da cabeca (nao flutua)', r.cnt > 200 && r.maxY >= r.headTop + r.headH * 0.15, JSON.stringify(r));
    check(id + ': gorro nao fica gigante (largura <= 1.7x cabeca)', r.w <= r.headW * 1.7 + 6, JSON.stringify(r));
  }

  console.log('---');
  console.log(fails === 0 ? 'ACESSORIOS/ENCAIXE: TUDO OK (' + n + ' checks)' : 'ACESSORIOS/ENCAIXE: ' + fails + ' FALHAS de ' + n);
  process.exit(fails ? 1 : 0);
})();
