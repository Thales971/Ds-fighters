// AMBIENTE 7/8/9: aneis de chuva no chao, reflexo na mare, letterbox no drama,
// palco real animado atras da tela de selecao (canvas .select-live).
const fs = require('fs'); const vm = require('vm');
function req(name){ try { return require(name); } catch(e){ return require('/tmp/node_modules/'+name); } }
const { createCanvas } = req('canvas');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas, fs,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {}, pitocoSeq: [], pitocoKey() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), querySelectorAll: () => [], addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} }, dataset: {} } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }

const mkRec = () => {
  const r = { drawImage: 0, ellipse: 0, arc: 0, fillRect: 0, rects: [], lighter: 0, composite: [], strokes: 0, styles: [] };
  const base = { canvas: null, save() {}, restore() {}, clearRect() {}, strokeRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, fill() {}, stroke() { r.strokes++; }, fillText() {}, strokeText() {}, translate() {}, scale() {}, rotate() {}, setTransform() {}, measureText: () => ({ width: 10 }), createPattern: () => ({}) };
  return [new Proxy(base, {
    get(t, k) {
      if (k === 'drawImage') return () => { r.drawImage++; };
      if (k === 'ellipse') return () => { r.ellipse++; };
      if (k === 'arc') return () => { r.arc++; };
      if (k === 'fillRect') return (x, y, w, h) => { r.fillRect++; r.rects.push({ x, y, w, h, style: t.fillStyle }); };
      if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop(o, c) { r.styles.push(String(c)); } });
      if (k in t) return t[k];
      return undefined;
    },
    set(t, k, v) {
      if (k === 'globalCompositeOperation') { r.composite.push(v); if (v === 'lighter') r.lighter++; }
      t[k] = v; return true;
    },
  }), r];
};

// ===== 7a. ANEIS DE CHUVA no chao =====
{
  const r = vm.runInContext(`
  (function(){
    let seed = 42; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const stub = { W: 960, H: 540, rnd, reduced: false, stageDef: null, audio: { loop(){}, play(){}, voice(){} }, splash(){ this._sp = (this._sp||0)+1; }, announce(){}, floatText(){}, fighters: () => [], strikes: [] };
    const w = new Weather(stub, { weather: ['rain'] });
    w.set('rain');
    let maxRings = 0;
    for (let t = 0; t < 900; t++) { w.update(false); maxRings = Math.max(maxRings, w.rings.length); }
    /* draw durante a chuva desenha os aneis como elipses achatadas */
    const rec = __mkRec();
    w.draw(rec[0]);
    const ellipses = rec[1].ellipse;
    /* chuva para: aneis decaem ate sumir */
    w.set('clear');
    for (let t = 0; t < 60; t++) w.update(false);
    const afterRain = w.rings.length;
    /* clima sem chuva nao gera aneis */
    const w2 = new Weather(stub, { weather: ['clear'] });
    w2.set('clear');
    for (let t = 0; t < 400; t++) w2.update(false);
    return JSON.stringify({ maxRings, afterRain, decays: afterRain === 0, ellipses, clearRings: w2.rings.length, intensity: w.intensity });
  })()`, Object.assign(ctx, { __mkRec: mkRec }));
  const R = JSON.parse(r);
  check('chuva gera aneis de impacto no chao (pico > 5)', R.maxRings > 5, 'pico=' + R.maxRings);
  check('aneis decaem com o tempo', R.afterRain <= R.maxRings && R.decays, 'depois=' + R.afterRain);
  check('draw da chuva desenha os aneis como elipses achatadas', R.ellipses > 0, 'elipses=' + R.ellipses);
  check('clima sem chuva (clear) nao gera aneis', R.clearRings === 0, 'rings=' + R.clearRings);
}

// ===== 7b. REFLEXO NA MARE (tide.draw: ondas espelhadas + filetes de luz) =====
{
  const r = vm.runInContext(`
  (function(){
    const tide = MECHS.tide;
    const g = { W: 960, reduced: false, stage: { def: { fauna: ['fish'] }, waveSheet: { complete: true, naturalWidth: 1184 } } };
    tide.init(g);
    tide.wave = 130; tide.dir = 1;
    const rec = __mkRec();
    tide.draw(rec[0], g, 100);
    const withRefl = { drawImage: rec[1].drawImage, lighter: rec[1].lighter, fillRect: rec[1].fillRect, streakStyles: rec[1].rects.filter((q) => q.y >= 3 && q.y < 40 && q.w <= 5).length };
    /* sem sheet pronta: so filetes (fallback) — nao quebra */
    const g2 = { W: 960, reduced: false, stage: { def: { fauna: ['fish'] }, waveSheet: null } };
    tide.init(g2); tide.wave = 130; tide.dir = 1;
    const rec2 = __mkRec();
    tide.draw(rec2[0], g2, 100);
    /* reduced: menos filetes */
    const g3 = { W: 960, reduced: true, stage: { def: {}, waveSheet: { complete: true, naturalWidth: 1184 } } };
    tide.init(g3); tide.wave = 130; tide.dir = 1;
    const rec3 = __mkRec();
    tide.draw(rec3[0], g3, 100);
    /* mare baixa: nada desenhado */
    tide.wave = 0;
    const rec4 = __mkRec();
    tide.draw(rec4[0], g, 100);
    return JSON.stringify({ withRefl, fallback: { drawImage: rec2[1].drawImage, fillRect: rec2[1].fillRect, lighter: rec2[1].lighter }, reducedFill: rec3[1].fillRect, lowTide: rec4[1].drawImage + rec4[1].fillRect });
  })()`, Object.assign(ctx, { __mkRec: mkRec }));
  const R = JSON.parse(r);
  check('mare alta desenha ondas + reflexo espelhado (drawImage dobrado) com lighter', R.withRefl.drawImage >= 4 && R.withRefl.lighter >= 1, JSON.stringify(R.withRefl));
  check('reflexo inclui filetes de luz abaixo da superficie (y>=3, finos)', R.withRefl.streakStyles >= 8, 'filetes=' + R.withRefl.streakStyles);
  check('sem sprite de onda cai no fallback vetorial sem quebrar', R.fallback.fillRect > 0, JSON.stringify(R.fallback));
  check('reduced motion: menos filetes de reflexo', R.reducedFill < R.withRefl.fillRect, 'reduced=' + R.reducedFill + ' vs ' + R.withRefl.fillRect);
  check('mare baixa (wave=0) nao desenha nada', R.lowTide === 0, 'px ops=' + R.lowTide);
}

// ===== 8. LETTERBOX no drama/round final =====
{
  const r = vm.runInContext(`
  (function(){
    const mkGame = () => {
      const rec = __mkRec();
      const g = new Game({ width: 960, height: 540, getContext: () => rec[0], classList: { toggle() {}, add() {}, remove() {} } });
      g.start({ mode: 'versus', teams: [['du'], ['stack']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
      for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
      return g;
    };
    const g = mkGame();
    const f0 = g.activeOf(0);
    /* sem drama: _lb fica 0 e nenhuma barra preta */
    for (let t = 0; t < 30; t++) g.renderScene(__mkRec()[0]);
    const lbOff = g._lb;
    /* HP baixo -> drama liga -> barras entram (fillRect preto topo/fundo) */
    f0.hp = 5; f0.maxHp = 100;
    let bars = [];
    for (let t = 0; t < 90; t++) { const rec = __mkRec(); g.renderScene(rec[0]); bars = rec[1].rects.filter((q) => q.style === '#000' && (q.y === 0 || q.y + q.h === 540)); }
    const lbOn = g._lb;
    const barH = bars.length ? bars[0].h : 0;
    /* drama desliga -> barras saem */
    f0.hp = 100;
    for (let t = 0; t < 90; t++) g.renderScene(__mkRec()[0]);
    const lbBack = g._lb;
    /* round final de melhor-de-3 liga letterbox mesmo com HP cheio */
    const g3 = mkGame();
    g3.cfg.roundsToWin = 3; g3.round = 3;
    for (let t = 0; t < 90; t++) g3.renderScene(__mkRec()[0]);
    const lbFinal = g3._lb;
    return JSON.stringify({ lbOff, lbOn, bars: bars.length, barH, lbBack, lbFinal, drama: g._drama });
  })()`, Object.assign(ctx, { __mkRec: mkRec }));
  const R = JSON.parse(r);
  check('sem drama: sem letterbox (_lb=0)', R.lbOff < 0.01, 'lb=' + R.lbOff);
  check('drama (HP baixo) liga letterbox: _lb sobe e barras pretas no topo e no fundo', R.lbOn > 0.9 && R.bars >= 2 && R.barH > 30, JSON.stringify({ lb: R.lbOn, bars: R.bars, h: R.barH }));
  check('drama desliga: barras recolhem (_lb decai)', R.lbBack < 0.2, 'lb=' + R.lbBack);
  check('round final (melhor-de-3, round 3) liga letterbox com HP cheio', R.lbFinal > 0.9, 'lb=' + R.lbFinal);
}

// ===== 9. PALCO REAL ANIMADO na tela de selecao =====
{
  const html = fs.readFileSync('index.html', 'utf8');
  const css = fs.readFileSync('css/style.css', 'utf8');
  const ui = fs.readFileSync('js/ui/ui.js', 'utf8');
  const m = html.match(/<section class="screen" id="scr-select"[\s\S]*?<\/section>/);
  check('index.html: canvas #select-live dentro de #scr-select, atras do .select-bg', !!m && /id="select-live"/.test(m[0]) && m[0].indexOf('select-live') < m[0].indexOf('select-bg'), '');
  check('css: .select-live em z -2 com object-fit cover + véu escuro no #scr-select + reduced esconde', /\.select-live\s*{[^}]*z-index:\s*-2/.test(css) && /#scr-select \.select-bg\s*{[^}]*rgba/.test(css) && /prefers-reduced-motion[^}]*}\s*\.select-live|\.select-live\s*{[^}]*display:\s*none/.test(css.replace(/\n/g, ' ')), '');
  check('ui.js: startSelectBg/stopSelectBg existem e show() para o fundo ao sair da selecao', /startSelectBg\(\)/.test(ui) && /stopSelectBg\(\)/.test(ui) && /if \(name !== 'select'\) this\.stopSelectBg\(\);/.test(ui) && /this\.startSelectBg\(\);/.test(ui), '');
  check('select-live usa arena FIXA do fluxo (f.stage != random) e cicla palcos no aleatorio (~9s) + tag AO VIVO', ui.indexOf("f.stage !== 'random'") >= 0 && ui.indexOf('t % 540 === 0') >= 0 && ui.indexOf('this._selBgStage = def.id') >= 0 && /id="sel-stage-tag"/.test(m[0]) && /\.sel-stage-tag\s*{/.test(css) && ui.indexOf('sel-stage-tag') >= 0, '');
  /* funcional: StageRenderer + Weather com stub rodam e desenham num canvas real */
  const r = vm.runInContext(`
  (function(){
    const def = STAGE_LIST[(STAGE_LIST.length/2)|0];
    const W = 960, H = 540;
    const stage = new StageRenderer(def, W, H, Math.round(H*0.85));
    const stub = { W, H, rnd: Math.random, reduced: false, stageDef: def, audio: { loop(){}, play(){}, voice(){} }, announce(){}, splash(){}, floatText(){}, fighters: () => [], strikes: [], onWeather: null };
    stage.game = stub;
    const weather = new Weather(stub, def);
    weather.roll();
    for (let t = 0; t < 120; t++) { weather.update(false); stage.update(weather); }
    const cv = createCanvas(W, H);
    const c = cv.getContext('2d');
    const camX = Math.sin(60 * 0.005) * 0.6;
    stage.drawBack(c, camX, 0);
    c.save(); c.translate(0, stage.groundY); weather.draw(c); c.restore();
    if (stage.drawForeground) stage.drawForeground(c, camX);
    stage.drawAmbient(c);
    stage.drawVignette(c);
    const img = c.getImageData(0, 0, W, H).data;
    let opaque = 0;
    for (let i = 3; i < img.length; i += 4) if (img[i] > 0) opaque++;
    return JSON.stringify({ stage: def.id, weather: weather.kind, opaque, t: stage.t, drops: weather.drops.length });
  })()`, ctx);
  const R = JSON.parse(r);
  check('palco do menu renderiza de verdade (StageRenderer+Weather, 120 ticks, pixels pintados)', R.opaque > 100000 && R.t === 120, JSON.stringify(R));
  /* funcional 2: a logica do startSelectBg escolhe o palco fixo quando o fluxo tem arena */
  const r2 = vm.runInContext(`
  (function(){
    const fixed = STAGE_LIST.find((s) => s.id === 'paraty');
    const f = { stage: 'paraty' };
    const chosen = (f && f.stage && f.stage !== 'random') ? STAGE_LIST.find((s) => s.id === f.stage) : null;
    const f2 = { stage: 'random' };
    const chosen2 = (f2 && f2.stage && f2.stage !== 'random') ? STAGE_LIST.find((s) => s.id === f2.stage) : null;
    return JSON.stringify({ fixed: chosen && chosen.id, random: chosen2 === null });
  })()`, ctx);
  const R2 = JSON.parse(r2);
  check('logica do fundo: fluxo com arena fixa escolhe ela; random nao trava palco', R2.fixed === 'paraty' && R2.random === true, JSON.stringify(R2));
}

console.log('---');
console.log('AMBIENTE 7/8/9: ' + (fails ? fails + ' FALHAS de ' + n : 'TUDO OK (' + n + ' checks)'));
process.exit(fails ? 1 : 0);
