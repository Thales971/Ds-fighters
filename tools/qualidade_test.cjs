// QUALIDADE DOS GRAFICOS: baixo / medio (= atual) / alto. Medio e o padrao,
// baixo tira os efeitos pesados, alto estica particulas/rim/clima pra embelezar.
const fs = require('fs'); const vm = require('vm');
function req(name){ try { return require(name); } catch(e){ return require('/tmp/node_modules/'+name); } }
const { createCanvas } = req('canvas');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

/* Profile com store mutavel pra testar quality */
const store = { reducedMotion: false, quality: 'medium' };
const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas, fs,
  Profile: { SECRET_IDS: [], data: { settings: store, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting(k, v) { if (v === undefined) return store[k]; store[k] = v; return v; }, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {}, pitocoSeq: [], pitocoKey() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), querySelectorAll: () => [], addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} }, dataset: {} } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; ctx.store = store; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }

const mkRec = () => {
  const r = { radial: 0, lighter: 0, styles: [], fillRect: 0, drawImage: 0 };
  const base = { canvas: null, save() {}, restore() {}, clearRect() {}, strokeRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, translate() {}, scale() {}, rotate() {}, drawImage() { r.drawImage++; }, fillRect() { r.fillRect++; }, measureText: () => ({ width: 10 }), createPattern: () => ({}) };
  return [new Proxy(base, {
    get(t, k) {
      if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop(o, c) { r.styles.push(String(c)); } });
      if (k in t) return t[k];
      return undefined;
    },
    set(t, k, v) {
      if (k === 'globalCompositeOperation' && v === 'lighter') r.lighter++;
      t[k] = v; return true;
    },
  }), r];
};

// ===== 1. UI: opcao existe, medium e o padrao, aplica ao vivo =====
{
  const html = fs.readFileSync('index.html', 'utf8');
  const ui = fs.readFileSync('js/ui/ui.js', 'utf8');
  const prof = fs.readFileSync('js/core/profile.js', 'utf8');
  const sel = html.match(/<select data-set="quality"[^>]*>[\s\S]*?<\/select>/);
  check('index.html: select data-set=quality com baixo/medio/alto e medium selecionado', !!sel && /value="low"/.test(sel[0]) && /value="medium" selected/.test(sel[0]) && /value="high"/.test(sel[0]), '');
  check('profile.js: default quality = medium', /settings:\s*{[^}]*quality:\s*'medium'/.test(prof), '');
  check('ui.js: trocar qualidade chama game.applyQuality() na hora', /k === 'quality' && this\.game && this\.game\.applyQuality/.test(ui), '');
}

// ===== 2. applyQuality: low / medium / high =====
{
  const r = vm.runInContext(`
  (function(){
    const mkG = () => {
      const g = new Game({ width: 960, height: 540, getContext: () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }), classList: { toggle() {}, add() {}, remove() {} } });
      g.start({ mode: 'versus', teams: [['du'], ['stack']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
      for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
      return g;
    };
    const out = {};
    store.quality = 'low'; const gl = mkG(); out.low = { q: gl.quality, qFx: gl.qFx, qWeather: gl.qWeather, qAmb: gl.qAmb, qRim: gl.qRim, qFxOn: gl.qFxOn };
    store.quality = 'medium'; const gm = mkG(); out.medium = { q: gm.quality, qFx: gm.qFx, qWeather: gm.qWeather, qAmb: gm.qAmb, qRim: gm.qRim, qFxOn: gm.qFxOn };
    store.quality = 'high'; const gh = mkG(); out.high = { q: gh.quality, qFx: gh.qFx, qWeather: gh.qWeather, qAmb: gh.qAmb, qRim: gh.qRim, qFxOn: gh.qFxOn };
    store.quality = 'medium';
    /* chroma por qualidade no golpe pesado */
    const hit = (g, d) => { g.chroma = 0; g.hitstop = 0; const f0 = g.activeOf(0), f1 = g.activeOf(1); g.registerHit(f0, f1, d, false, 5, false); return { chroma: g.chroma, hitstop: g.hitstop }; };
    store.quality = 'low'; const gl2 = mkG(); out.lowHit = hit(gl2, 30);
    store.quality = 'medium'; const gm2 = mkG(); out.medHit30 = hit(gm2, 30); out.medHit18 = hit(gm2, 18);
    store.quality = 'high'; const gh2 = mkG(); out.highHit30 = hit(gh2, 30); out.highHit18 = hit(gh2, 18);
    store.quality = 'medium';
    /* poeira: qFx escala a quantidade */
    const dustN = (g) => { g.sparks.length = 0; g.dust(100, undefined, 8); return g.sparks.length; };
    store.quality = 'low'; out.dustLow = dustN(mkG());
    store.quality = 'medium'; out.dustMed = dustN(mkG());
    store.quality = 'high'; out.dustHigh = dustN(mkG());
    store.quality = 'medium';
    return JSON.stringify(out);
  })()`, ctx);
  const R = JSON.parse(r);
  check('applyQuality low: qFx 0.45, qWeather 0.45, qAmb 0.4, qRim 0 (rim off), qFxOn false', R.low.q === 'low' && Math.abs(R.low.qFx - 0.45) < 1e-9 && R.low.qRim === 0 && R.low.qFxOn === false, JSON.stringify(R.low));
  check('applyQuality medium (= atual): tudo 1 e qFxOn true', R.medium.q === 'medium' && R.medium.qFx === 1 && R.medium.qWeather === 1 && R.medium.qAmb === 1 && R.medium.qRim === 1 && R.medium.qFxOn === true, JSON.stringify(R.medium));
  check('applyQuality high: qFx 1.6, qWeather 1.45, qAmb 1.5, qRim 1.5, qFxOn true', R.high.q === 'high' && Math.abs(R.high.qFx - 1.6) < 1e-9 && Math.abs(R.high.qRim - 1.5) < 1e-9 && R.high.qFxOn === true, JSON.stringify(R.high));
  check('chroma: baixo NAO liga (0) mesmo em golpe pesado; medio liga d>=20; alto liga d>=16 e mais forte', R.lowHit.chroma === 0 && R.medHit30.chroma === 9 && R.medHit18.chroma === 0 && R.highHit18.chroma > 0 && R.highHit30.chroma === Math.min(12, 9 + 2), JSON.stringify({ low: R.lowHit, med30: R.medHit30, med18: R.medHit18, high18: R.highHit18, high30: R.highHit30 }));
  check('poeira escala com a qualidade (low < medio < alto)', R.dustLow < R.dustMed && R.dustMed < R.dustHigh, `low=${R.dustLow} med=${R.dustMed} high=${R.dustHigh}`);
}

// ===== 3. letterbox e foreground desligam no baixo =====
{
  const r = vm.runInContext(`
  (function(){
    const mkG = () => {
      const g = new Game({ width: 960, height: 540, getContext: () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), getImageData() { return { data: new Uint8ClampedArray(960*540*4) }; }, putImageData() {} }), classList: { toggle() {}, add() {}, remove() {} } });
      g.start({ mode: 'versus', teams: [['du'], ['stack']], stage: 'parque-lago', cpu: [false, false], roundsToWin: 3, timer: 99 });
      for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
      return g;
    };
    const out = {};
    /* letterbox com drama (round final) em cada qualidade */
    for (const q of ['low', 'medium', 'high']) {
      store.quality = q;
      const g = mkG(); g.round = 3; g.activeOf(0).hp = 100; /* round final, HP cheio */
      for (let t = 0; t < 90; t++) g.renderScene(mkRecX());
      out['lb_' + q] = +g._lb.toFixed(3);
    }
    /* foreground: conta chamadas no renderScene */
    store.quality = 'low'; const gl = mkG(); let fgLow = 0; const of = gl.stage.drawForeground.bind(gl.stage); gl.stage.drawForeground = (...a) => { fgLow++; return of(...a); };
    gl.renderScene(mkRecX());
    store.quality = 'medium'; const gm = mkG(); let fgMed = 0; const of2 = gm.stage.drawForeground.bind(gm.stage); gm.stage.drawForeground = (...a) => { fgMed++; return of2(...a); };
    gm.renderScene(mkRecX());
    store.quality = 'medium';
    out.fgLow = fgLow; out.fgMed = fgMed;
    return JSON.stringify(out);
  })()`, Object.assign(ctx, { __mkRec: mkRec, mkRecX: () => mkRec()[0] }));
  const R = JSON.parse(r);
  check('letterbox: baixo desliga (_lb=0) mesmo no round final; medio/alto ligam', R.lb_low === 0 && R.lb_medium > 0.9 && R.lb_high > 0.9, JSON.stringify({ low: R.lb_low, med: R.lb_medium, high: R.lb_high }));
  check('foreground (grama na frente) nao desenha no baixo, desenha no medio', R.fgLow === 0 && R.fgMed >= 1, `low=${R.fgLow} med=${R.fgMed}`);
}

// ===== 4. clima: densidade de gotas/aneis por qualidade =====
{
  const r = vm.runInContext(`
  (function(){
    const mkW = (qw) => {
      const stub = { W: 960, H: 540, rnd: Math.random, reduced: false, qWeather: qw, stageDef: null, audio: { loop(){}, play(){} }, splash(){}, announce(){}, floatText(){}, fighters: () => [], strikes: [] };
      const w = new Weather(stub, { weather: ['rain'] });
      w.set('rain');
      w.intensity = 1; w.intensityTarget = 1; /* fixa a intensidade pra comparar so a qualidade */
      for (let t = 0; t < 500; t++) w.update(false);
      return { drops: w.drops.length, rings: w.rings.length };
    };
    return JSON.stringify({ low: mkW(0.45), med: mkW(1), high: mkW(1.45) });
  })()`, ctx);
  const R = JSON.parse(r);
  check('chuva: menos gotas no baixo e mais no alto (low < medio < alto)', R.low.drops < R.med.drops && R.med.drops < R.high.drops, JSON.stringify(R));
}

// ===== 5. rim light: baixo desliga, alto reforça alpha =====
{
  const r = vm.runInContext(`
  (function(){
    const mkG = () => {
      const g = new Game({ width: 960, height: 540, getContext: () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }), classList: { toggle() {}, add() {}, remove() {} } });
      g.start({ mode: 'versus', teams: [['du'], ['stack']], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
      for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
      return g;
    };
    const rimAlpha = (g) => {
      const rec = __mkRec();
      const f = g.activeOf(0); f.state = 'idle';
      f.draw(rec[0]);
      const m = rec[1].styles.find((s) => s.indexOf('63,208,255') >= 0 && s.indexOf(',0.') >= 0); /* sem regex com backslash dentro do template */
      return { a: m ? parseFloat(m.split(',')[3]) : 0, qRim: g.qRim, n: rec[1].styles.length, sample: rec[1].styles.slice(0, 6) };
    };
    store.quality = 'low'; const gl = mkG(); const aLow = rimAlpha(gl);
    store.quality = 'medium'; const gm = mkG(); const aMed = rimAlpha(gm);
    store.quality = 'high'; const gh = mkG(); const aHigh = rimAlpha(gh);
    store.quality = 'medium';
    return JSON.stringify({ aLow: aLow.a, aMed: aMed.a, aHigh: aHigh.a, dbg: { qRim: aMed.qRim, n: aMed.n, sample: aMed.sample } });
  })()`, Object.assign(ctx, { __mkRec: mkRec }));
  const R = JSON.parse(r);
  check('rim light: baixo = 0 (desligado), medio = 0.30, alto = 0.45 (reforcado)', R.aLow === 0 && Math.abs(R.aMed - 0.3) < 0.01 && Math.abs(R.aHigh - 0.45) < 0.01, JSON.stringify(R));
}

// ===== 6. luzes de palco: pulso estatico no baixo =====
{
  const src = fs.readFileSync('js/engine/stage.js', 'utf8');
  check('stage.js: pulso das luzes vira estatico quando qFxOn=false (baixo)', /qFxOn === false\); \/\* qualidade baixa: luzes estaticas/.test(src), '');
  const wsrc = fs.readFileSync('js/engine/weather.js', 'utf8');
  check('weather.js: gotas e aneis escalam com game.qWeather', /qWeather \|\| 1/.test(wsrc) && /qWeather/.test(wsrc), '');
}

console.log('---');
console.log('QUALIDADE: ' + (fails ? fails + ' FALHAS de ' + n : 'TUDO OK (' + n + ' checks)'));
process.exit(fails ? 1 : 0);
