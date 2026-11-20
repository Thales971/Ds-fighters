// AMBIENTE VISUAL (plano 2026-11-20): enfeites genericos removidos, torcida encaixada por
// arena, mare recortada quadro a quadro e aurora em pixel art atras dos lutadores.
const fs = require('fs'); const vm = require('vm');
function req(name){ try { return require(name); } catch(e){ return require('/tmp/node_modules/'+name); } }
const { createCanvas } = req('canvas');
const { PNG } = req('pngjs');
const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas, fs, PNG,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {}, pitocoSeq: [], pitocoKey() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} } } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/pets.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 80)); } }
vm.runInContext(`
const rec = [];
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage(...a) { rec.push(a); }, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), createPattern: () => ({}), set imageSmoothingEnabled(v) {}, set globalAlpha(v) {}, set globalCompositeOperation(v) {}, set fillStyle(v) {}, set strokeStyle(v) {}, set font(v) {}, set textAlign(v) {}, set lineWidth(v) {}, set filter(v) {} });
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const mk = (stage) => {
  const canvas = { width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } };
  const g = new Game(canvas);
  g.start({ mode: 'versus', teams: [['du'], ['du']], stage, cpu: [true, true], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};
const fakeImg = (w, h) => ({ complete: true, naturalWidth: w, naturalHeight: h, width: w, height: h });

// ===== 1. ENFEITES GENERICOS REMOVIDOS =====
for (const id of ['estacao-valinhos', 'represa', 'sesi', 'parque-lago']) {
  const g = mk(id);
  check(id + ': sem enfeites genericos (props vazio)', !g.stage.props || g.stage.props.length === 0, 'props=' + (g.stage.props ? g.stage.props.length : 'none'));
  if (g.stage.propSheet !== undefined) g.stage.propSheet = fakeImg(384, 64);
  rec.length = 0;
  g.stage.drawBack(fake2d(), 0, 0);
  const cell = rec.filter((a) => a.length === 9 && a[3] === 48 && a[4] === 64);
  check(id + ': nada desenhado com celula 48x64 da sheet de enfeites', cell.length === 0, cell.length + ' draws');
}
{
  const g = mk('represa');
  const L = g.stage.buildLights();
  check('represa (sem def.lights): buildLights sem luz de poste', L.length === 0, L.length + ' luzes');
  const gc = mk('circo');
  check('circo (def.lights): luzes do mapa continuam', gc.stage.buildLights().length === 2, gc.stage.buildLights().length + ' luzes');
}
// ===== 1b. CIRCO: holofote desenhado ANTES do 1o tick da luta (intro) nao pode quebrar o render =====
{
  const strict = Object.assign(fake2d(), { createRadialGradient(...a) { if (!a.every(Number.isFinite)) throw new TypeError('non-finite'); return { addColorStop() {} }; }, createLinearGradient(...a) { if (!a.every(Number.isFinite)) throw new TypeError('non-finite'); return { addColorStop() {} }; } });
  const canvas = { width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } };
  const g = new Game(canvas);
  g.start({ mode: 'versus', teams: [['du'], ['du']], stage: 'circo', cpu: [true, true], roundsToWin: 1, timer: 99 });
  let err = null;
  try { g.mech.draw(strict); } catch (e) { err = e.message; }
  check('circo: holofote desenha na intro (antes do 1o tick) sem erro', !err, err || '');
}
// ===== 2. TORCIDA ENCAIXADA POR ARENA (25 pessoas de 51.2x200 na sheet 1280x200) =====
{
  const PW = 1280 / 25;
  const ids = STAGE_LIST.filter((d) => d.torcida).map((d) => d.id);
  check('7 arenas com torcida', ids.length === 7, ids.join(','));
  for (const id of ids) {
    const g = mk(id);
    const def = STAGE_LIST.find((d) => d.id === id);
    check(id + ': torcida com posicao propria na ficha (rows)', def.torcida && Array.isArray(def.torcida.rows) && def.torcida.rows.length > 0);
    g.stage.crowdSheet = fakeImg(1280, 200);
    rec.length = 0;
    g.stage.drawTorcida(fake2d());
    const ppl = rec.filter((a) => a.length === 9 && a[0] === g.stage.crowdSheet);
    const sizeOk = ppl.length > 0 && ppl.every((a) => Math.abs(a[3] - PW) < 0.01 && a[4] === 200);
    check(id + ': recorta 1 pessoa por vez (51.2x200)', sizeOk, ppl.length + ' pessoas');
    const maxH = Math.max(...ppl.map((a) => a[8]));
    check(id + ': pessoa menor que lutador (altura <= 120px)', maxH <= 120, 'max=' + maxH.toFixed(1));
    const topOk = ppl.every((a) => a[6] >= 0 && a[6] + a[8] <= 458 + 2);
    check(id + ': ninguem cortado no topo nem abaixo do chao', topOk);
    const distinct = new Set(ppl.map((a) => Math.round(a[1] / PW)));
    check(id + ': varia as pessoas (> 5 diferentes)', distinct.size > 5, distinct.size + ' diferentes');
    let adj = 0; for (let i = 1; i < ppl.length; i++) if (ppl[i][1] === ppl[i - 1][1] && ppl[i][6] === ppl[i - 1][6]) adj++;
    check(id + ': sem a mesma pessoa repetida lado a lado', adj === 0, adj + ' repeticoes');
  }
  // ficha antiga com torcida: true (sem rows) cai num default seguro
  const def = STAGE_LIST.find((d) => d.id === 'arquibancada');
  const saved = def.torcida; def.torcida = true;
  const g = mk('arquibancada');
  def.torcida = saved;
  g.stage.crowdSheet = fakeImg(1280, 200);
  rec.length = 0; g.stage.drawTorcida(fake2d());
  const ppl = rec.filter((a) => a.length === 9 && a[0] === g.stage.crowdSheet);
  check('torcida: true sem rows usa default pequeno', ppl.length > 0 && ppl.every((a) => a[8] <= 120 && a[6] >= 0), ppl.length + ' pessoas');
}
// ===== 3. MARE QUADRO A QUADRO (atlas sem riscos de divisoria, agua calma tileavel) =====
{
  const A = (typeof MARE_ATLAS !== 'undefined') ? MARE_ATLAS : null;
  check('mechanics.js expoe MARE_ATLAS (layout do atlas novo)', !!A && Array.isArray(A.waveFrames) && A.waveFrames.length >= 6 && Array.isArray(A.calm));
  if (A) {
    const png = PNG.sync.read(fs.readFileSync('assets/fx/mare.png'));
    const px = (x, y) => { const i = (y * png.width + x) * 4; return [png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]]; };
    const [cx, cy, cw, ch] = A.calm;
    check('atlas contem a faixa calma e todos os quadros', png.width >= cx + cw && A.waveFrames.every(([x, y]) => x + A.fw <= png.width && y + A.fh <= png.height), png.width + 'x' + png.height);
    /* faixa calma tileavel: coluna 0 ~ ultima coluna */
    let d = 0;
    for (let y = cy; y < cy + ch; y++) { const a = px(cx, y), b = px(cx + cw - 1, y); d += Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]); }
    d /= ch * 3;
    check('agua calma tileavel (emenda invisivel, diff medio < 12)', d < 12, 'diff=' + d.toFixed(1));
    let opaque = 0; for (let y = cy; y < cy + ch; y++) for (let x = cx; x < cx + cw; x++) if (px(x, y)[3] > 200) opaque++;
    check('agua calma 100% opaca (sem buraco)', opaque === cw * ch, opaque + '/' + cw * ch);
    /* sem RISCO: nenhuma coluna da faixa de agua de um quadro e uma linha clara/escura destoando das vizinhas */
    let riscos = 0;
    for (const [fx, fy] of A.waveFrames) {
      const y0 = fy + A.fh - A.waterH, y1 = fy + A.fh;
      const colMean = [];
      /* so colunas 100% opacas na faixa de agua (a borda transparente do quadro nao e risco) */
      for (let x = fx; x < fx + A.fw; x++) { let s2 = 0, op = true; for (let y = y0; y < y1; y++) { const p = px(x, y); s2 += p[0] + p[1] + p[2]; if (p[3] < 250) op = false; } colMean.push(op ? s2 / (y1 - y0) : null); }
      for (let i = 2; i < colMean.length - 2; i++) { if (colMean[i] == null || colMean[i - 2] == null || colMean[i + 2] == null) continue; const nb = (colMean[i - 2] + colMean[i + 2]) / 2; if (Math.abs(colMean[i] - nb) > 120) riscos++; }
    }
    check('quadros da onda sem riscos verticais de divisoria', riscos === 0, riscos + ' colunas destoantes');
    /* sem magenta vazando */
    let leak = 0; for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) { const p = px(x, y); if (p[3] > 200 && p[0] > 200 && p[1] < 80 && p[2] > 100) leak++; }
    check('sem magenta vazando no atlas', leak < 20, leak + ' px');
    /* draw: faixa baixa (topo >= -40 e base <= +8) e onda <= 110px de altura acima do chao */
    const calls = [];
    const st = [];
    const c = Object.assign(fake2d(), {
      sx: 1, sy: 1, tx: 0,
      save() { st.push([this.sx, this.sy, this.tx]); }, restore() { [this.sx, this.sy, this.tx] = st.pop() || [1, 1, 0]; },
      translate(x) { this.tx += x * this.sx; }, scale(x, y) { this.sx *= x; this.sy *= y; },
      drawImage(...a) { const r = a.slice(); r.sx = this.sx; r.sy = this.sy; r.tx = this.tx; calls.push(r); },
    });
    /* x de tela efetivo considerando translate/scale horizontal */
    const ex = (a) => a.sx < 0 ? a.tx + a.sx * (a[5] + a[7]) : a.tx + a[5];
    const tide = MECHS.tide;
    const gg = { W: 960, reduced: false, stage: { def: { fauna: ['fish'] }, waveSheet: fakeImg(png.width, png.height) } };
    tide.init(gg); tide.wave = 130; tide.dir = 1;
    tide.draw(c, gg, 100);
    const calm = calls.filter((a) => a.length === 9 && a[3] === cw && a[4] === ch && a[2] === cy && a.sy > 0);
    check('mare desenha faixa calma lado a lado cobrindo a tela', calm.length >= Math.ceil(960 / cw) && Math.min(...calm.map(ex)) <= 0 && Math.max(...calm.map((a) => ex(a) + a[7])) >= 960, calm.length + ' tiles');
    check('faixa de agua baixa, no nivel do chao (topo >= -40, base <= +8)', calm.every((a) => a[6] >= -40 && a[6] + a[8] <= 8), calm.map((a) => a[6] + '..' + (a[6] + a[8]))[0]);
    const wave = calls.filter((a) => a.length === 9 && a[3] === A.fw && a[4] === A.fh && a.sy > 0);
    check('onda animada desenhada (1 quadro por vez)', wave.length === 1, wave.length + ' quadros');
    check('onda com altura <= 110px acima do chao', wave.every((a) => a[6] >= -110 - 8), wave.map((a) => a[6]).join(','));
    /* quadro muda com o tempo e a onda anda no sentido do empurrao */
    const at = (t, dir) => { calls.length = 0; tide.dir = dir; tide.draw(c, gg, t); return calls.filter((a) => a.length === 9 && a[3] === A.fw && a[4] === A.fh && a.sy > 0)[0]; };
    const w1 = at(100, 1), w2 = at(110, 1), w3 = at(100, -1), w4 = at(110, -1);
    check('onda anda pra direita com dir=+1 (e olha pra direita)', w1 && w2 && ex(w2) > ex(w1) && w1.sx > 0, w1 && w2 ? ex(w1) + '->' + ex(w2) : '');
    check('onda anda pra esquerda com dir=-1 (espelhada, olha pra esquerda)', w3 && w4 && ex(w4) < ex(w3) && w3.sx < 0, w3 && w4 ? ex(w3) + '->' + ex(w4) : '');
    const frames = new Set(); for (let t = 0; t < 200; t += 4) { const w = at(t, 1); if (w) frames.add(w[1] + ',' + w[2]); }
    check('onda anima varios quadros ao longo do tempo', frames.size >= 6, frames.size + ' quadros');
  }
}
globalThis.__res = () => ({ fails, n });
`, ctx);
{
  const mainSrc = fs.readFileSync('js/main.js', 'utf8');
  const stageSrc = fs.readFileSync('js/engine/stage.js', 'utf8');
  const r = ctx.__res();
  const ok1 = mainSrc.indexOf('stage-props.png') < 0;
  const ok2 = stageSrc.indexOf('stage-props.png') < 0;
  console.log((ok1 ? 'OK   ' : 'FALHA') + ' main.js nao pre-carrega stage-props.png');
  console.log((ok2 ? 'OK   ' : 'FALHA') + ' stage.js nao carrega stage-props.png');
  const fails = r.fails + (ok1 ? 0 : 1) + (ok2 ? 0 : 1);
  console.log('---');
  console.log(fails ? 'AMBIENTE VISUAL: ' + fails + ' FALHA(S)' : 'AMBIENTE VISUAL: TUDO OK (' + (r.n + 2) + ' checks)');
  process.exit(fails ? 1 : 0);
}
