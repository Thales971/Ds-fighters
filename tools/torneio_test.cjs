// TORNEIO LOCAL: balanceamento (fracos ganham buff), chaveamento de 8,
// buff aplicado no Fighter so no modo torneio, fluxo de rounds, anti-spam
// segurando no modo torneio, e wiring de UI (botao, handlers, badge).
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

// ===== 2. Chaveamento =====
{
  const r = vm.runInContext(`
  (function(){
    const out = {};
    // bracket deterministico com rnd fixo
    let seed = 42; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const br = buildTourneyBracket('kira', 8, rnd);
    out.size = br.chave.length;
    out.hasPlayer = br.chave.includes('kira');
    out.unique = new Set(br.chave).size === br.chave.length;
    out.names = br.roundsNames;
    const p0 = tourneyRoundPairings(br.chave, 'kira');
    out.myOpp = p0.myOpp;
    out.pairs0 = p0.pairs.length;
    // resolve 4 rounds sempre vencendo: deve sobrar exatamente o player
    let chave = br.chave, pairs = p0.pairs, rounds = 0;
    while (chave.length > 1 && rounds < 10) {
      const pr = tourneyRoundPairings(chave, 'kira');
      chave = tourneyResolveRound(pr.pairs, 'kira', true, rnd);
      rounds++;
    }
    out.roundsToWin = rounds;
    out.champion = chave[0];
    // se o player perde na primeira, ele sai da chave
    const br2 = buildTourneyBracket('cracker', 8, rnd);
    const pr2 = tourneyRoundPairings(br2.chave, 'cracker');
    const after = tourneyResolveRound(pr2.pairs, 'cracker', false, rnd);
    out.eliminated = !after.includes('cracker');
    out.nextSize = after.length;
    return JSON.stringify(out);
  })()`, ctx);
  const R = JSON.parse(r);
  check('chaveamento de 8 com player incluso, 8 ids unicos, nomes OITAVAS..FINAL', R.size === 8 && R.hasPlayer && R.unique && R.names.join(',') === 'OITAVAS,QUARTAS,FINAL', JSON.stringify({ size: R.size, names: R.names }));
  check('round 0 tem 4 partidas e meu oponente definido', R.pairs0 === 4 && !!R.myOpp, 'myOpp=' + R.myOpp);
  check('vencendo 3 rounds (8->4->2->1) o player e o campeao; perdendo na 1a sai da chave', R.roundsToWin === 3 && R.champion === 'kira' && R.eliminated && R.nextSize === 4, JSON.stringify(R));
}

// ===== 3. Buff aplicado no Fighter SO no modo torneio + dmgMult =====
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
    const g1 = mk('torneio', weakId, strongId);
    const fw = g1.activeOf(0), fs = g1.activeOf(1);
    const g2 = mk('versus', weakId, strongId);
    const fw2 = g2.activeOf(0);
    const out = {
      weakId, strongId,
      weakBuff: fw.tourneyBuff, strongBuff: fs.tourneyBuff,
      weakHpTorneio: fw.maxHp, weakHpVersus: fw2.maxHp, weakHpBase: baseWeakHp,
      weakDmgTorneio: Math.round(fw.dmgMult() * 100) / 100, weakDmgVersus: Math.round(fw2.dmgMult() * 100) / 100,
      strongHpTorneio: fs.maxHp, strongHpBase: Math.round((strongDef.stats.hp || 100) * HEALTH_MULTIPLIER),
    };
    // partida torneio completa sem crash (IA nos dois lados)
    const g3 = new Game({ width: 960, height: 540, getContext: () => fake2d(), classList: { toggle(){},add(){},remove(){} } });
    g3.start({ mode: 'torneio', teams: [['kira'], ['rafael']], stage: 'random', cpu: [true, true], roundsToWin: 1, timer: 60, difficulty: 1 });
    let t = 0; let err = null;
    try { for (; t < 9000 && !g3.matchOver; t++) g3.tick(); } catch (e) { err = e.message; }
    out.match = { over: g3.matchOver, ticks: t, err };
    // anti-spam no modo torneio: H1 do du repetido, intervalo min >= piso do perfil
    const g4 = mk('torneio', 'du', 'stack');
    const f4 = g4.activeOf(0);
    f4.cd = [0,0,0,0,0,0,0,0,0,0]; f4.castLock = 0; f4.state = 'idle'; f4.charge = [100,100]; f4.ultimate = 100;
    const kit = f4.currentKit(); const IDX = kit.findIndex((p) => p.slot === 'simple');
    let casts = 0, gaps = [], lastCast = -999;
    for (let t2 = 0; t2 < 1800; t2++) {
      f4.state = 'idle'; f4.cast = null; f4.y = 0; f4.vy = 0; f4.onGround = true; f4.hitstun = 0; f4.stun = 0; f4.charge = [100,100]; f4.ultimate = 100;
      if (g4.roundState === 'fight' && f4.tryCast(IDX)) { if (lastCast >= 0) gaps.push(t2 - lastCast); lastCast = t2; casts++; }
      g4.tick();
    }
    out.antispamTorneio = { casts, minGap: gaps.length ? Math.min(...gaps) : -1, floor: f4.spamProfile().floor };
    return JSON.stringify(out);
  })()`, ctx);
  const R = JSON.parse(r);
  check(`fraco (${R.weakId}) no torneio ganha buff e HP sobe; no versus nao muda`, R.weakBuff && R.weakHpTorneio > R.weakHpBase && R.weakHpVersus === R.weakHpBase, `hp base=${R.weakHpBase} torneio=${R.weakHpTorneio} versus=${R.weakHpVersus} buff=` + JSON.stringify(R.weakBuff));
  check(`dmgMult reflete o buff de forca so no torneio (${R.weakDmgTorneio} vs ${R.weakDmgVersus})`, R.weakDmgTorneio > R.weakDmgVersus * 1.1, '');
  check(`forte (${R.strongId}) nao ganha buff no torneio`, R.strongBuff === null && R.strongHpTorneio === R.strongHpBase, `hp=${R.strongHpTorneio} base=${R.strongHpBase}`);
  check('partida em modo torneio (IA x IA) completa sem crash', R.match.over && !R.match.err, JSON.stringify(R.match));
  check('anti-spam segura no modo torneio (intervalo min >= piso do perfil)', R.antispamTorneio.minGap >= R.antispamTorneio.floor - 10, JSON.stringify(R.antispamTorneio));
}

// ===== 4. Wiring de UI =====
{
  const html = fs.readFileSync('index.html', 'utf8');
  const ui = fs.readFileSync('js/ui/ui.js', 'utf8');
  const css = fs.readFileSync('css/style.css', 'utf8');
  check('index.html: botao data-go="torneio" no menu + script balance.js', /data-go="torneio"/.test(html) && /js\/data\/balance\.js/.test(html));
  check('ui.js: handlers do torneio (startFlow, afterSelect, torneioNext, onMatchEnd, buildTorneio/launchTorneio)', /buildTorneio/.test(ui) && /launchTorneio/.test(ui) && /torneioNext/.test(ui) && /game\.mode === 'torneio'/.test(ui) && /'torneio'/.test(ui));
  check('ui.js: badge BUFF no grid so no modo torneio', /sx buff/.test(ui) && /Balance\.buffFor/.test(ui));
  check('css: badge .sx.buff com estilo', /\.cell \.sx\.buff/.test(css));
  check('fighter.js: buff aplicado so quando game.mode === torneio', /game\.mode === 'torneio'/.test(fs.readFileSync('js/engine/fighter.js', 'utf8')) && /tourneyBuff/.test(fs.readFileSync('js/engine/fighter.js', 'utf8')));
}

console.log('---');
console.log('TORNEIO: ' + (fails ? fails + ' FALHAS de ' + n : 'TUDO OK (' + n + ' checks)'));
process.exit(fails ? 1 : 0);
