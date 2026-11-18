// BUFF DOS FRACOS NO TORNEIO (arcade existente): classificacao de forca (Balance),
// buff aplicado no Fighter SO no modo arcade (nao mexe no versus), badge BUFF no
// grid do arcade, toast no launchArcade, anti-spam continua segurando no arcade,
// e o torneio arcade segue intacto (6 rivais + chefe).
const fs = require('fs'); const vm = require('vm');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

const store = { reducedMotion: false, quality: 'medium' };
const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas: () => null, fs,
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho', 'maximilian'], data: { settings: store, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting(k, v) { if (v === undefined) return store[k]; store[k] = v; return v; }, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: { room: null, score: null, takeRemote: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }) },
  AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => ({ getContext: () => ({}), style: {} }), querySelectorAll: () => [], addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} }, dataset: {} } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; ctx.store = store; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/fighters-dev-virado.js', 'js/data/fighters-milena.js', 'js/data/fighters-kira.js', 'js/data/fighters-cracker.js', 'js/data/fighters-rafael.js', 'js/data/balance.js', 'js/data/roster-portraits.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }

// ===== 1. Balance: ranking + buff pros fracos =====
{
  const r = vm.runInContext(`
  (function(){
    Balance.reset();
    const rank = Balance.ranking();
    const n = rank.length;
    const buffed = FIGHTERS.filter((d) => d.id !== 'boneco-treino' && Balance.buffFor(d)).length;
    const top = rank[0], bottom = rank[n - 1];
    const iales = rank.find((e) => e.id === 'iales');
    // fraco extremo pega buff forte, topo nao pega nada
    const bottomDef = FIGHTERS.find((d) => d.id === bottom.id);
    const topDef = FIGHTERS.find((d) => d.id === top.id);
    return JSON.stringify({
      n, buffed,
      bottomBuff: Balance.buffFor(bottomDef), topBuff: Balance.buffFor(topDef),
      ialesRank: rank.indexOf(iales),
      sampleTop: top.id + ':' + top.sc.toFixed(2), sampleBottom: bottom.id + ':' + bottom.sc.toFixed(2),
      monotone: rank.every((e, i) => i === 0 || rank[i - 1].sc >= e.sc),
    });
  })()`, ctx);
  const R = JSON.parse(r);
  check('ranking cobre o roster todo (' + R.n + ' lutadores) e esta ordenado', R.n >= 50 && R.monotone, R.sampleTop + ' ... ' + R.sampleBottom);
  check('metade inferior ganha buff (quarto mais fraco = buff forte), metade forte nao ganha', R.buffed >= Math.floor(R.n / 2) && R.buffed <= Math.ceil(R.n / 2) + 1 && R.bottomBuff && R.bottomBuff.hp === 1.25 && R.bottomBuff.power === 1.15 && R.topBuff === null, 'buffed=' + R.buffed + ' bottom=' + JSON.stringify(R.bottomBuff) + ' top=' + R.topBuff);
  check('IALES (forte/secreto) esta no topo do ranking', R.ialesRank >= 0 && R.ialesRank <= 5, 'rank=' + R.ialesRank);
}

// ===== 2. Torneio arcade intacto: 6 rivais + chefe, ordem crescente =====
{
  const r = vm.runInContext(`
  (function(){
    // replica a logica do buildArcade (ui.js) sem DOM: mesma funcao score
    const score = (d) => Balance.score(d);
    const me = 'kira';
    const rivais = FIGHTERS.filter((d) => d.id !== me && d.id !== 'boneco-treino' && !d.secret)
      .map((d) => ({ id: d.id, sc: score(d) }))
      .sort((a, b) => b.sc - a.sc)
      .slice(0, 6).map((r2) => r2.id).reverse();
    const ladder = [...rivais.filter((id) => id !== 'iales'), 'iales'];
    return JSON.stringify({ ladder, n: ladder.length, last: ladder[ladder.length - 1] });
  })()`, ctx);
  const R = JSON.parse(r);
  check('arcade segue intacto: 6 rivais em ordem crescente + chefe IALES no fim', R.n === 7 && R.last === 'iales' && R.ladder.length === 7, JSON.stringify(R.ladder));
}

// ===== 3. Buff aplicado no Fighter SO no modo arcade (torneio) + dmgMult =====
{
  const r = vm.runInContext(`
  (function(){
    const fake2d = () => ({ canvas: null, save(){}, restore(){}, clearRect(){}, fillRect(){}, drawImage(){}, translate(){}, scale(){}, rotate(){}, beginPath(){}, moveTo(){}, lineTo(){}, closePath(){}, quadraticCurveTo(){}, ellipse(){}, arc(){}, fill(){}, stroke(){}, fillText(){}, strokeText(){}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop(){} }), createRadialGradient: () => ({ addColorStop(){} }), createPattern: () => ({}), getImageData: () => ({ data: new Uint8ClampedArray(4) }), putImageData(){} });
    const mk = (mode, a, b) => {
      const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), classList: { toggle(){},add(){},remove(){} } });
      g.start({ mode, teams: [[a], [b]], stage: 'treino-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
      for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
      return g;
    };
    const rank = Balance.ranking();
    const weakId = rank[rank.length - 1].id, strongId = rank[0].id;
    const weakDef = FIGHTERS.find((d) => d.id === weakId), strongDef = FIGHTERS.find((d) => d.id === strongId);
    const baseWeakHp = Math.round((weakDef.stats.hp || 100) * HEALTH_MULTIPLIER);
    const g1 = mk('arcade', weakId, strongId);
    const fw = g1.activeOf(0), fs = g1.activeOf(1);
    const g2 = mk('versus', weakId, strongId);
    const fw2 = g2.activeOf(0);
    const out = {
      weakId, strongId,
      weakBuff: fw.tourneyBuff, strongBuff: fs.tourneyBuff,
      weakHpArcade: fw.maxHp, weakHpVersus: fw2.maxHp, weakHpBase: baseWeakHp,
      weakDmgTorneio: Math.round(fw.dmgMult() * 100) / 100, weakDmgVersus: Math.round(fw2.dmgMult() * 100) / 100,
      strongHpArcade: fs.maxHp, strongHpBase: Math.round((strongDef.stats.hp || 100) * HEALTH_MULTIPLIER),
    };
    // partida torneio completa sem crash (IA nos dois lados)
    const g3 = new Game({ width: 960, height: 540, getContext: () => fake2d(), classList: { toggle(){},add(){},remove(){} } });
    g3.start({ mode: 'arcade', teams: [['kira'], ['rafael']], stage: 'random', cpu: [true, true], roundsToWin: 1, timer: 60, difficulty: 1 });
    let t = 0; let err = null;
    try { for (; t < 9000 && !g3.matchOver; t++) g3.tick(); } catch (e) { err = e.message; }
    out.match = { over: g3.matchOver, ticks: t, err };
    // anti-spam no modo torneio: H1 do du repetido, intervalo min >= piso do perfil
    const g4 = mk('arcade', 'du', 'stack');
    const f4 = g4.activeOf(0);
    f4.cd = [0,0,0,0,0,0,0,0,0,0]; f4.castLock = 0; f4.state = 'idle'; f4.charge = [100,100]; f4.ultimate = 100;
    const kit = f4.currentKit(); const IDX = kit.findIndex((p) => p.slot === 'simple');
    let casts = 0, gaps = [], lastCast = -999;
    for (let t2 = 0; t2 < 1800; t2++) {
      f4.state = 'idle'; f4.cast = null; f4.y = 0; f4.vy = 0; f4.onGround = true; f4.hitstun = 0; f4.stun = 0; f4.charge = [100,100]; f4.ultimate = 100;
      if (g4.roundState === 'fight' && f4.tryCast(IDX)) { if (lastCast >= 0) gaps.push(t2 - lastCast); lastCast = t2; casts++; }
      g4.tick();
    }
    out.antispamArcade = { casts, minGap: gaps.length ? Math.min(...gaps) : -1, floor: f4.spamProfile().floor };
    return JSON.stringify(out);
  })()`, ctx);
  const R = JSON.parse(r);
  check(`fraco (${R.weakId}) no TORNEIO (arcade) ganha buff e HP sobe; no versus nao muda`, R.weakBuff && R.weakHpArcade > R.weakHpBase && R.weakHpVersus === R.weakHpBase, `hp base=${R.weakHpBase} arcade=${R.weakHpArcade} versus=${R.weakHpVersus} buff=` + JSON.stringify(R.weakBuff));
  check(`dmgMult reflete o buff de forca so no arcade (${R.weakDmgTorneio} vs ${R.weakDmgVersus})`, R.weakDmgTorneio > R.weakDmgVersus * 1.1, '');
  check(`forte (${R.strongId}) nao ganha buff no arcade`, R.strongBuff === null && R.strongHpArcade === R.strongHpBase, `hp=${R.strongHpArcade} base=${R.strongHpBase}`);
  check('partida em modo arcade (IA x IA) completa sem crash', R.match.over && !R.match.err, JSON.stringify(R.match));
  check('anti-spam continua segura no arcade (intervalo min >= piso do perfil)', R.antispamArcade.minGap >= R.antispamArcade.floor - 10, JSON.stringify(R.antispamArcade));
}

// ===== 4. Wiring de UI =====
{
  const html = fs.readFileSync('index.html', 'utf8');
  const ui = fs.readFileSync('js/ui/ui.js', 'utf8');
  const css = fs.readFileSync('css/style.css', 'utf8');
  check('index.html: SEM botao de modo torneio novo (torneio existente intacto) + script balance.js', !/data-go="torneio"/.test(html) && /js\/data\/balance\.js/.test(html) && /data-go="arcade"/.test(html));
  check('ui.js: arcade intacto (buildArcade/launchArcade) + badge BUFF no grid do arcade + toast de buff no launchArcade', /buildArcade/.test(ui) && /launchArcade/.test(ui) && !/buildTorneio/.test(ui) && /f\.mode === 'arcade' && typeof Balance/.test(ui) && /BUFF DE TORNEIO/.test(ui));
  check('ui.js: card do arcade menciona buff dos fracos', /ganham BUFF autom/.test(ui));
  check('css: badge .sx.buff com estilo', /\.cell \.sx\.buff/.test(css));
  check('fighter.js: buff aplicado so quando game.mode === arcade', /game\.mode === 'arcade'/.test(fs.readFileSync('js/engine/fighter.js', 'utf8')) && /tourneyBuff/.test(fs.readFileSync('js/engine/fighter.js', 'utf8')));
}

console.log('---');
console.log('BUFF FRACOS NO TORNEIO (arcade): ' + (fails ? fails + ' FALHAS de ' + n : 'TUDO OK (' + n + ' checks)'));
process.exit(fails ? 1 : 0);
