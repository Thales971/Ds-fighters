// AMBIENTE VISUAL (plano 2026-11-20): enfeites genericos removidos, torcida encaixada por
// arena, mare recortada quadro a quadro e aurora em pixel art atras dos lutadores.
const fs = require('fs'); const vm = require('vm');
function req(name) { return require(name); }
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
{ const { Image: CImg } = req('canvas'); const im = new CImg(); im.src = fs.readFileSync('assets/fx/mare.png'); ctx.__mareImg = im; ctx.__CImg = CImg; }
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
    tide.init(gg); tide.permaTide = true; tide.wave = 130; tide.dir = 1;
    tide.draw(c, gg, 100);
    const calm = calls.filter((a) => a.length === 9 && a[3] === cw && a[4] === ch && a[2] === cy && a.sy > 0);
    check('mare desenha faixa calma lado a lado cobrindo a tela', calm.length >= Math.ceil(960 / cw) && Math.min(...calm.map(ex)) <= 0 && Math.max(...calm.map((a) => ex(a) + a[7])) >= 960, calm.length + ' tiles');
    check('faixa de agua baixa, no nivel do chao (topo >= -40, base <= +8)', calm.every((a) => a[6] >= -40 && a[6] + a[8] <= 8), calm.map((a) => a[6] + '..' + (a[6] + a[8]))[0]);
    const wave = calls.filter((a) => a.length === 9 && a[3] === A.fw && a[4] === A.fh && a.sy > 0);
    check('onda animada desenhada (1 quadro por vez)', wave.length === 1, wave.length + ' quadros');
    check('onda com crista inteira e altura <= 145px acima do chao (pico da maior onda)', wave.every((a) => a[6] >= -145), wave.map((a) => a[6]).join(','));
    /* quadro muda com o tempo e a onda anda no sentido do empurrao */
    const at = (t, dir) => { calls.length = 0; tide.dir = dir; for (let k = 0; k < 10; k++) tide.tick(gg); tide.draw(c, gg, t); return calls.filter((a) => a.length === 9 && a[3] === A.fw && a[4] === A.fh && a.sy > 0)[0]; };
    const w1 = at(100, 1), w2 = at(110, 1), w3 = at(100, -1), w4 = at(110, -1);
    check('onda anda pra direita com dir=+1 (e olha pra direita)', w1 && w2 && ex(w2) > ex(w1) && w1.sx > 0, w1 && w2 ? ex(w1) + '->' + ex(w2) : '');
    check('onda anda pra esquerda com dir=-1 (espelhada, olha pra esquerda)', w3 && w4 && ex(w4) < ex(w3) && w3.sx < 0, w3 && w4 ? ex(w3) + '->' + ex(w4) : '');
    const frames = new Set(); for (let t = 0; t < 200; t += 4) { const w = at(t, 1); if (w) frames.add(w[1] + ',' + w[2]); }
    check('onda anima varios quadros ao longo do tempo', frames.size >= 6, frames.size + ' quadros');
  }
}
// ===== 4. AURORA EM PIXEL ART, ATRAS DA TORCIDA/LUTADORES =====
{
  const g = mk('sesi');
  const Wt = g.weather;
  check('Weather.drawSky existe', typeof Wt.drawSky === 'function');
  if (typeof Wt.drawSky === 'function') {
    Wt.set('aurora'); Wt.intensity = 1; Wt.perfScale = 1; Wt.perfOff = false;
    for (let t = 0; t < 40; t++) Wt.updateParticles();
    /* draw() (camada da frente, por cima dos lutadores) nao pinta aurora */
    let ops = 0;
    const cnt = Object.assign(fake2d(), { fillRect() { ops++; }, fill() { ops++; }, drawImage() { ops++; }, stroke() { ops++; } });
    Wt.draw(cnt); Wt.drawOverlay(cnt, 960, 540);
    check('aurora nao e mais desenhada na frente dos lutadores (draw/drawOverlay)', ops === 0, ops + ' ops');
    /* ordem: ceu da aurora antes da torcida no drawBack */
    const order = [];
    const oSky = Wt.drawSky, oT = g.stage.drawTorcida;
    Wt.drawSky = function () { order.push('sky'); };
    g.stage.drawTorcida = function () { order.push('torcida'); };
    g.stage.drawBack(fake2d(), 0, 0);
    Wt.drawSky = oSky; g.stage.drawTorcida = oT;
    check('drawBack desenha o ceu da aurora ANTES da torcida (atras de tudo)', order.join(',') === 'sky,torcida', order.join(','));
    /* pixels reais sobre um ceu de DIA claro */
    const cv = createCanvas(960, 540); const c2 = cv.getContext('2d');
    const day = () => { c2.globalCompositeOperation = 'source-over'; c2.globalAlpha = 1; c2.fillStyle = 'rgb(150,200,240)'; c2.fillRect(0, 0, 960, 540); };
    day(); const base = c2.getImageData(0, 0, 960, 540).data.slice();
    let err = null; try { Wt.drawSky(c2); } catch (e) { err = e.message; }
    check('drawSky desenha sem erro', !err, err || '');
    const d = c2.getImageData(0, 0, 960, 540).data;
    const lum = (arr, y0, y1) => { let s3 = 0; for (let y = y0; y < y1; y++) for (let x = 0; x < 960; x++) { const i = (y * 960 + x) * 4; s3 += arr[i] * 0.3 + arr[i + 1] * 0.59 + arr[i + 2] * 0.11; } return s3 / ((y1 - y0) * 960); };
    check('ceu de cima escurece (noite da aurora) em vez de estourar', lum(d, 0, 160) < lum(base, 0, 160) - 25, lum(base, 0, 160).toFixed(0) + ' -> ' + lum(d, 0, 160).toFixed(0));
    let sat = 0; for (let y = 0; y < 320; y++) for (let x = 0; x < 960; x++) { const i = (y * 960 + x) * 4; if (d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 245) sat++; }
    check('sem estouro em branco (< 5% saturado na faixa do ceu)', sat < 960 * 320 * 0.05, (100 * sat / (960 * 320)).toFixed(1) + '%');
    let green = 0; for (let y = 0; y < 320; y++) for (let x = 0; x < 960; x++) { const i = (y * 960 + x) * 4; if (d[i + 1] > d[i] + 40 && d[i + 1] > 110) green++; }
    check('cortinas verde/teal visiveis no ceu', green > 6000, green + ' px');
    let below = 0; for (let y = 330; y < 540; y++) for (let x = 0; x < 960; x++) { const i = (y * 960 + x) * 4; if (Math.abs(d[i] - base[i]) + Math.abs(d[i + 1] - base[i + 1]) + Math.abs(d[i + 2] - base[i + 2]) > 6) below++; }
    check('aurora fica no ceu (nada abaixo de y=330)', below === 0, below + ' px');
    /* pixel art: blocos 4x4 — pixel x e x+1 iguais dentro do bloco */
    let same = 0, tot = 0;
    for (let y = 0; y < 320; y += 3) for (let x = 0; x < 956; x++) { if (x % 4 === 3) continue; const i = (y * 960 + x) * 4; const changed = Math.abs(d[i] - base[i]) + Math.abs(d[i + 1] - base[i + 1]) > 30; if (!changed) continue; tot++; if (d[i] === d[i + 4] && d[i + 1] === d[i + 5] && d[i + 2] === d[i + 6]) same++; }
    check('aurora em pixel art (blocos nitidos 4x, sem degrade liso)', tot > 2000 && same / tot > 0.95, (100 * same / Math.max(1, tot)).toFixed(1) + '% de ' + tot);
    /* perfScale menor desenha sem erro; perfOff nao desenha */
    Wt.perfScale = 0.45; day(); err = null; try { Wt.drawSky(c2); } catch (e) { err = e.message; }
    const dq = c2.getImageData(0, 0, 960, 320).data; let ch2 = 0; for (let i = 0; i < dq.length; i += 4) if (Math.abs(dq[i + 1] - base[i + 1]) > 20) ch2++;
    check('perfScale 0.45: aurora desenha sem erro', !err && ch2 > 3000, (err || '') + ' ' + ch2 + ' px');
    Wt.perfScale = 1; Wt.perfOff = true; day(); Wt.drawSky(c2);
    const dOff = c2.getImageData(0, 0, 960, 540).data; let chOff = 0; for (let i = 0; i < dOff.length; i += 4) if (dOff[i] !== base[i] || dOff[i + 1] !== base[i + 1]) chOff++;
    check('perfOff (modo performance 2): sem aurora', chOff === 0, chOff + ' px');
    Wt.perfOff = false;
    /* movimento reduzido: imagem parada */
    g.reduced = true; for (let t = 0; t < 120; t++) Wt.update(false); /* deixa a qtd de estrelas assentar (reduzido usa 35%) */
    day(); Wt.drawSky(c2); const r1 = c2.getImageData(0, 0, 960, 320).data.slice();
    for (let t = 0; t < 30; t++) Wt.update(false);
    day(); Wt.drawSky(c2); const r2 = c2.getImageData(0, 0, 960, 320).data; let dr = 0; for (let i = 0; i < r1.length; i += 4) if (r1[i] !== r2[i] || r1[i + 1] !== r2[i + 1]) dr++;
    check('movimento reduzido: aurora parada', dr === 0, dr + ' px mudaram');
    g.reduced = false;
    /* sem reduzido: anima */
    day(); Wt.drawSky(c2); const a1 = c2.getImageData(0, 0, 960, 320).data.slice();
    for (let t = 0; t < 30; t++) Wt.update(false);
    day(); Wt.drawSky(c2); const a2 = c2.getImageData(0, 0, 960, 320).data; let da = 0; for (let i = 0; i < a1.length; i += 4) if (a1[i + 1] !== a2[i + 1]) da++;
    check('aurora anima (cortinas ondulam)', da > 2000, da + ' px');
    /* outros climas: drawSky nao faz nada */
    Wt.set('rain'); day(); Wt.drawSky(c2); const dr2 = c2.getImageData(0, 0, 960, 540).data; let chR = 0; for (let i = 0; i < dr2.length; i += 4) if (dr2[i] !== base[i]) chR++;
    check('outros climas: drawSky nao desenha', chR === 0, chR + ' px');
  }
}
// ===== 5. REVISAO FINAL =====
{
  const A = MARE_ATLAS;
  const tide = Object.assign({}, MECHS.tide);
  const gg = { W: 960, reduced: false, pushX: 0, rnd: Math.random, announce() {}, audio: { play() {} }, stage: { def: { fauna: ['fish'] }, waveSheet: __mareImg } };
  tide.init(gg); tide.dir = 1; tide.permaTide = true; tide.wave = 130;
  /* 5a. onda sem "bloco" de agua mais escuro: dentro e fora da onda a agua tem o mesmo tom */
  let guard = 0;
  do { tide.tick(gg); guard++; } while (!(tide.waveX > 150 && tide.waveX < 650) && guard < 2000);
  check('mare guarda a posicao da onda no estado (waveX)', Number.isFinite(tide.waveX), String(tide.waveX));
  const cv = createCanvas(960, 540); const c3 = cv.getContext('2d');
  c3.fillStyle = 'rgb(120,110,100)'; c3.fillRect(0, 0, 960, 540);
  c3.save(); c3.translate(0, 458); tide.draw(c3, gg, 300); c3.restore();
  const dd = c3.getImageData(0, 0, 960, 540).data;
  const colLum = []; for (let x = 0; x < 960; x++) { let s4 = 0; for (let y = 458 - 26; y < 458 + 2; y++) { const i = (y * 960 + x) * 4; s4 += dd[i] * 0.3 + dd[i + 1] * 0.59 + dd[i + 2] * 0.11; } colLum.push(s4 / 28); }
  if (Number.isFinite(tide.waveX)) {
    const wx = Math.round(tide.waveX);
    const inside = [], outside = [];
    for (let x = 0; x < 960; x++) { if (x > wx + 30 && x < wx + A.fw - 30) inside.push(colLum[x]); else if (x < wx - 10 || x > wx + A.fw + 10) outside.push(colLum[x]); }
    const mean = (a) => a.reduce((p, q) => p + q, 0) / a.length;
    const diffIO = Math.abs(mean(inside) - mean(outside));
    check('agua dentro da onda = agua fora (sem bloco escuro andando)', diffIO < 6, 'dif=' + diffIO.toFixed(1));
    let edge = 0; for (const ex0 of [wx, wx + A.fw]) { if (ex0 < 8 || ex0 > 950) continue; const a1 = mean(colLum.slice(ex0 - 6, ex0)), a2 = mean(colLum.slice(ex0, ex0 + 6)); edge = Math.max(edge, Math.abs(a1 - a2)); }
    check('sem borda vertical dura nas laterais da onda', edge < 8, 'salto=' + edge.toFixed(1));
  }
  /* 5b. troca de sentido nao teleporta a onda nem a faixa */
  const st2 = []; const calls2 = [];
  const c4 = Object.assign(fake2d(), { sx: 1, sy: 1, tx: 0, save() { st2.push([this.sx, this.sy, this.tx]); }, restore() { [this.sx, this.sy, this.tx] = st2.pop() || [1, 1, 0]; }, translate(x) { this.tx += x * this.sx; }, scale(x, y) { this.sx *= x; this.sy *= y; }, drawImage(...a) { const r = a.slice(); r.sx = this.sx; r.sy = this.sy; r.tx = this.tx; calls2.push(r); } });
  const ex2 = (a) => a.sx < 0 ? a.tx + a.sx * (a[5] + a[7]) : a.tx + a[5];
  const snap = () => { calls2.length = 0; tide.draw(c4, gg, 400); const w = calls2.find((a) => a.length === 9 && a[3] === A.fw && a[4] === A.fh && a.sy > 0); const tiles = calls2.filter((a) => a.length === 9 && a[3] === A.calm[2] && a[4] === A.calm[3] && a.sy > 0).map(ex2).sort((p, q) => p - q); return { w: w ? ex2(w) : NaN, tile: tiles.find((v) => v >= 0) }; };
  const b1 = snap(); tide.dir = -1; tide.tick(gg); const b2 = snap(); tide.dir = 1;
  check('troca de sentido: onda continua no mesmo lugar (sem teleporte)', Math.abs(b2.w - b1.w) <= 4, b1.w + ' -> ' + b2.w);
  check('troca de sentido: faixa de agua nao pula', Math.abs(b2.tile - b1.tile) <= 2 || Math.abs(b2.tile - b1.tile) >= A.calm[2] - 2, b1.tile + ' -> ' + b2.tile);
  /* 5c. crista da maior onda nao cortada reta no topo do quadro */
  const png2 = PNG.sync.read(fs.readFileSync('assets/fx/mare.png'));
  let cut = 0; for (const [fx, fy] of A.waveFrames) for (let x = fx; x < fx + A.fw; x++) if (png2.data[((fy) * png2.width + x) * 4 + 3] > 40) cut++;
  check('nenhuma crista cortada no topo do quadro', cut === 0, cut + ' px na 1a linha');
}
{
  /* 5d. preview AO VIVO da selecao (480x270, chao em 230): torcida proporcional, dentro da tela */
  for (const def of STAGE_LIST.filter((d) => d.torcida)) {
    const sr = new StageRenderer(def, 480, 270, 230);
    sr.crowdSheet = fakeImg(1280, 200);
    rec.length = 0; sr.drawTorcida(fake2d());
    const ppl = rec.filter((a) => a.length === 9 && a[0] === sr.crowdSheet);
    const ok = ppl.length > 0 && ppl.every((a) => a[5] >= -1 && a[5] + a[7] <= 482 && a[6] >= 0 && a[6] + a[8] <= 232 && a[8] <= 60);
    check('selecao 480x270 (' + def.id + '): torcida proporcional e dentro da tela', ok, ppl.length + ' pessoas, max y=' + Math.max(...ppl.map((a) => a[6] + a[8])).toFixed(0));
  }
  const uiSrc = fs.readFileSync('js/ui/ui.js', 'utf8');
  check('selecao: palco ao vivo enxerga o clima (stub.weather) -> aurora aparece', /stub\.weather = weather/.test(uiSrc));
  const stub = { W: 480, H: 270, rnd: Math.random, reduced: false, audio: { loop() {}, play() {}, voice() {} }, announce() {}, splash() {}, floatText() {}, fighters: () => [], strikes: [] };
  const w5 = new Weather(stub, STAGE_LIST.find((d) => d.id === 'kernel'));
  w5.set('aurora'); w5.intensity = 1; for (let t = 0; t < 40; t++) w5.update(false);
  const cs = createCanvas(480, 270); const c5 = cs.getContext('2d'); c5.fillStyle = 'rgb(150,200,240)'; c5.fillRect(0, 0, 480, 270);
  w5.drawSky(c5);
  const d5 = c5.getImageData(0, 0, 480, 270).data;
  let right = 0, low = 0; for (let y = 0; y < 270; y++) for (let x = 0; x < 480; x++) { const i = (y * 480 + x) * 4; const ch3 = Math.abs(d5[i] - 150) + Math.abs(d5[i + 1] - 200) + Math.abs(d5[i + 2] - 240) > 10; if (ch3 && x > 440 && y < 120) right++; if (ch3 && y > 165) low++; }
  check('aurora em 480x270: escala junto (cobre ate a direita, fica no ceu)', right > 200 && low === 0, 'direita=' + right + ' abaixo=' + low);
}
{
  /* 5e. aurora sem alocar ImageData a cada repintura */
  const g6 = mk('kernel'); const W6 = g6.weather; W6.set('aurora'); W6.intensity = 1;
  const cv6 = createCanvas(960, 540); const c6 = cv6.getContext('2d');
  W6.drawSky(c6);
  let made = 0; const realGet = W6._auroraCv.getContext.bind(W6._auroraCv);
  W6._auroraCv.getContext = (k) => { const x = realGet(k); if (!x.__wrapped) { const o = x.createImageData.bind(x); x.createImageData = (...a) => { made++; return o(...a); }; x.__wrapped = true; } return x; };
  for (let i = 0; i < 6; i++) { W6.update(false); W6.update(false); W6.drawSky(c6); }
  check('aurora reaproveita o ImageData entre repinturas', made === 0, made + ' createImageData em 6 repinturas');
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
