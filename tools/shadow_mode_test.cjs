// O SEU MAIOR INIMIGO (nov/2026): luta contra a versao sombria de si mesmo.
// Motor real (scripts do index.html), IA real, render com canvas de verdade.
// Cobre: montagem (3 vidas x 500, memoria 1000, 10 min, nevoa escura),
// anulacao de golpe/chip/veneno, fragmentos (pegar = dano, cair = 10 s
// paralisada), vidas, fim por tempo e por memoria, vidro transparente,
// efeitos escuros da sombra, playlist sombria e musica do menu.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createCanvas } = require('canvas');

const ROOT = path.resolve(__dirname, '..');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x !== undefined ? ' — ' + x : '')); if (!c) fails++; };

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const M = Object.create(Math); M.random = rng(11);
const store = {};
const ctx = {
  console: { log() {}, warn() {}, error() {} }, Math: M, Date, JSON, URLSearchParams, createCanvas,
  Image: class { set src(v) {} },
  Audio: class { play() { return Promise.resolve(); } pause() {} removeAttribute() {} },
  localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => false, hasAchievement: () => true, recordSurvivalBy() {}, recordWinBy() {}, recordStage() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false, tag: false, a0: false, a1: false, a2: false, a3: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0, releaseAll() {} },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: new Proxy({ hud: new Proxy({}, { get: () => () => {} }), pitocoSeq: [] }, { get: (t, k) => (k in t ? t[k] : () => {}) }),
  HUD: new Proxy({}, { get: () => () => {} }),
  Net: {},
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), querySelectorAll: () => [], querySelector: () => null, addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {}, contains: () => false }, dataset: {} } },
  window: { addEventListener() {}, matchMedia: () => ({ matches: false }) }, navigator: { userAgent: 'node' },
  location: { search: '', hash: '' },
  setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0,
};
ctx.globalThis = ctx;
vm.createContext(ctx);
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
check('index.html carrega shadow-mode.js depois do game.js', /game\.js[^]*impact-fx\.js[^]*shadow-mode\.js/.test(html));
const files = [...html.matchAll(/<script src="([^"?]+)/g)].map((m) => m[1])
  .filter((f) => /^(assets\/sprites|assets\/stages|assets\/maps|js\/data|js\/engine)\//.test(f))
  .filter((f) => !/engine\/(audio|input)\.js$/.test(f));
let loadErr = '';
for (const f of files) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }); } catch (e) { loadErr += f + ': ' + e.message.slice(0, 80) + '; '; }
}
check('todos os scripts do motor carregam', !loadErr, loadErr || files.length + ' arquivos');
const api = vm.runInContext('({ Game, Fighter, PETS, FIGHTERS, STAGE_LIST, AI })', ctx);
const SH = api.Game.SHADOW;
const GY = vm.runInContext('GROUND_Y', ctx);
check('Game.SHADOW exportado (1000 memoria, 500 x 3 vidas, 10 s de paralisia)', SH && SH.SHADOW_HP === 1000 && SH.PLAYER_HP === 500 && SH.LIVES === 3 && SH.STUN === 600);

const realCanvas = () => { const c = createCanvas(960, 540); c.classList = { toggle() {}, add() {}, remove() {} }; return c; };
const none = api.PETS[0];
function mk(id = 'stack', opts = {}) {
  const g = new api.Game(realCanvas());
  g.rnd = rng(opts.seed || 5);
  g.applyPerf = () => {};
  g.start({ mode: 'arcade', teams: [[id], [id]], stage: opts.stage || 'random', weather: 'darkfog', shadowFight: true, bossFight: false, cpuDifficulty: 3, difficulty: 3, cpu: [false, true], pets: [none, none], roundsToWin: 1, timer: 600, music: 'shadow' });
  for (let t = 0; t < 900 && g.roundState !== 'fight'; t++) g.tick();
  return g;
}
const tickN = (g, k) => { for (let t = 0; t < k && g.running; t++) g.tick(); };

/* ---------- 1. montagem ---------- */
{
  const g = mk();
  const me = g.activeOf(0), sh = g.activeOf(1);
  check('round chega em "fight"', g.roundState === 'fight', g.roundState);
  check('sombra marcada (shadowSelf) e mesmo lutador do jogador', sh.shadowSelf === true && sh.def.id === me.def.id);
  check('nome da sombra = SOMBRA DE <nome>', /^SOMBRA DE /.test(sh.def.name), sh.def.name);
  check('memoria da sombra 1000/1000', sh.maxHp === 1000 && sh.hp === 1000, sh.hp + '/' + sh.maxHp);
  check('jogador 500 de vida e 3 vidas', me.maxHp === 500 && me.hp === 500 && me.shadowLives === 3, me.hp + '/' + me.maxHp + ' x' + me.shadowLives);
  check('luta de 10 minutos (36000 quadros)', Math.round(g.cfg.timer * 60) === 36000, g.cfg.timer);
  check('clima fixo: nevoa escura', g.weather.kind === 'darkfog' && g.weather.pool.length === 1 && g.weather.pool[0] === 'darkfog', g.weather.kind);
  check('sprite da sombra com filtro escuro (skinHue em string)', typeof sh.skinHue === 'string' && /hue-rotate/.test(sh.skinHue));
  check('jogador sem filtro sombrio', typeof me.skinHue !== 'string');
  check('mapa aleatorio escolhido', !!g.stageDef && !!g.stageDef.id, g.stageDef && g.stageDef.id);
  check('IA da sombra no nivel maximo', sh.aiLevel === 3 || api.AI.level(3) === sh.aiLevel, sh.aiLevel);
}

/* ---------- 2. leitura perfeita: nada entra fora do atordoamento ---------- */
{
  const g = mk();
  const me = g.activeOf(0), sh = g.activeOf(1);
  const r1 = sh.takeHit(40, { attacker: me, kx: 4, dirSign: 1, stun: 20 });
  check('soco anulado (takeHit devolve false e memoria intacta)', r1 === false && sh.hp === 1000, sh.hp);
  const r2 = sh.takeHit(120, { attacker: me, height: 'unblockable', ability: true, heavy: true, kx: 20, dirSign: 1, stun: 60, fx: { burn: 200, stun: 1 } });
  check('ultimate imbloqueavel tambem anulada', r2 === false && sh.hp === 1000, sh.hp);
  sh.chip(50, me);
  check('chip anulado', sh.hp === 1000);
  sh.status.burn = sh.now + 600; sh.status.poison = sh.now + 600;
  tickN(g, 240);
  check('queimadura/veneno nao tiram memoria', sh.hp === 1000, sh.hp);
  sh.hp = 0; sh.defeat(1);
  check('cair por caminho estranho e recusado (volta a memoria)', sh.hp === 1000 && sh.state !== 'ko', sh.state);
  check('anular gera janela de punicao', g.shadow.punishes >= 2, g.shadow.punishes);
}

/* ---------- 3. a IA pune: luta real 20 s com jogador parado ---------- */
{
  const g = mk('stack', { seed: 9 });
  const me = g.activeOf(0), sh = g.activeOf(1);
  let crash = null;
  try { tickN(g, 1200); } catch (e) { crash = e.message; }
  check('20 s de IA sombria sem travar o motor', !crash, crash);
  const lost = (500 - me.hp) + (3 - me.shadowLives) * 500;
  check('a sombra bate no jogador parado', lost > 40, lost.toFixed(0) + ' de dano');
  check('memoria da sombra intacta sem fragmentos', sh.hp === 1000 || g.shadow.collected > 0 || g.shadow.fallen > 0, sh.hp);
}

/* ---------- 4. fragmentos de memoria ---------- */
{
  const g = mk();
  const S = g.shadow;
  let t = 0;
  while (!S.frags.length && t < 900) { g.tick(); t++; }
  check('fragmento nasce na luta (ate 15 s)', S.frags.length > 0, t + ' quadros');
  const fr = S.frags[0];
  check('fragmento nasce no alto e cai devagar', fr && fr.y < -300 && fr.vy > 0.5 && fr.vy < 1.3, fr && fr.y.toFixed(0) + ' vy ' + fr.vy.toFixed(2));
  /* pegar: o jogador encosta */
  const me = g.activeOf(0), sh = g.activeOf(1);
  me.x = fr.x; me.y = 0; fr.y = -120;
  g.tick();
  check('pegar fragmento tira 55 de memoria', sh.hp === 1000 - SH.FRAG_DMG && S.mem === sh.hp && S.collected === 1, sh.hp);
  check('fragmento pego some', !S.frags.includes(fr));
}
{
  const g = mk();
  const S = g.shadow;
  const me = g.activeOf(0), sh = g.activeOf(1);
  S.next = 1; g.tick();
  const fr = S.frags[0];
  fr.x = me.x + 400 > 900 ? me.x - 400 : me.x + 400; fr.y = -0.4;
  g.tick(); g.tick();
  check('fragmento que cai no chao paralisa a sombra por 10 s', sh._shadowStun >= SH.STUN - 3 && S.fallen === 1, sh._shadowStun);
  check('paralisada: nao age (canAct falso) e input vazio', !sh.canAct() && JSON.stringify(g.inputFor(1)) === JSON.stringify(ctx.EMPTY_INPUT));
  const x0 = sh.x;
  tickN(g, 120);
  check('paralisada fica imovel', Math.abs(sh.x - x0) < 20, (sh.x - x0).toFixed(1));
  check('paralisia passou do teto de 72 quadros do status', sh.has('paralyze') && sh._shadowStun > 400, sh._shadowStun);
  const h0 = sh.hp;
  sh.takeHit(30, { attacker: me, kx: 2, dirSign: 1, stun: 10 });
  tickN(g, 15); /* passa o hit-stop */
  check('paralisada: o golpe entra e a memoria cai', sh.hp < h0 && g.shadow.mem === sh.hp, h0 + ' -> ' + sh.hp.toFixed(1));
  const hAfter = sh.hp;
  tickN(g, 500);
  check('10 s depois acorda', !(sh._shadowStun > 0) && !sh.has('paralyze'), sh._shadowStun);
  sh.takeHit(30, { attacker: me, kx: 2, dirSign: 1, stun: 10 });
  check('acordada volta a anular tudo (memoria fica)', Math.abs(sh.hp - hAfter) < 0.01 && g.shadow.mem === sh.hp, sh.hp.toFixed(1));
}

/* ---------- 5. vidas ---------- */
{
  const g = mk();
  const me = g.activeOf(0), sh = g.activeOf(1);
  me.hp = 5; me.takeHit(50, { attacker: sh, kx: 2, dirSign: 1, stun: 10, noScale: true });
  check('1a queda: perde vida, volta com 500, luta continua', me.shadowLives === 2 && me.hp === 500 && g.roundState === 'fight' && me.has('invuln'), me.shadowLives + ' ' + me.hp);
  me.status = {}; me.hp = 5; me.takeHit(50, { attacker: sh, kx: 2, dirSign: 1, stun: 10, noScale: true });
  check('2a queda: ultima vida', me.shadowLives === 1 && me.hp === 500 && g.roundState === 'fight');
  me.status = {}; me.hp = 5; me.takeHit(50, { attacker: sh, kx: 2, dirSign: 1, stun: 10, noScale: true });
  check('3a queda: K.O. e a sombra vence', g.roundState === 'ko' && g.teamWins[1] === 1, g.roundState + ' ' + g.teamWins);
}

/* ---------- 6. fim: sobreviver aos 10 min e zerar a memoria ---------- */
{
  const g = mk();
  g.roundTimer = 2;
  tickN(g, 10);
  check('acabou o tempo: jogador vence (sobreviveu)', g.teamWins[0] === 1 && g.teamWins[1] === 0, g.teamWins);
}
{
  const g = mk();
  const S = g.shadow, me = g.activeOf(0), sh = g.activeOf(1);
  S.mem = 30; sh.hp = 30;
  S.next = 1; g.tick();
  const fr = S.frags[0]; me.x = fr.x; fr.y = -120; g.tick();
  check('fragmento que zera a memoria derruba a sombra', !sh.alive && g.teamWins[0] === 1, g.teamWins);
}
{
  const g = new api.Game(realCanvas()); g.applyPerf = () => {};
  g.start({ mode: 'versus', teams: [['stack'], ['du']], stage: 'treino-dojo', cpu: [true, true], difficulty: 2, roundsToWin: 1, timer: 60, pets: [none, none] });
  tickN(g, 400);
  check('luta normal nao vira sombria', !g.shadow && !g.activeOf(1).shadowSelf && g.activeOf(1).maxHp <= 500);
  const b = g.activeOf(1), h0 = b.hp; b.takeHit(20, { attacker: g.activeOf(0), kx: 1, dirSign: 1 });
  check('luta normal: golpe entra', b.hp < h0 || b.state === 'blockstun');
}

/* ---------- 7. desenho: vidro transparente, aura, efeitos escuros ---------- */
{
  const g = mk('stack', { stage: 'treino-dojo' });
  const S = g.shadow;
  let crash = null;
  try { for (let k = 0; k < 30; k++) { g.tick(); g.render(1); } } catch (e) { crash = e.message + ' ' + String(e.stack).split('\n')[1]; }
  check('render da luta sombria sem erro (canvas real)', !crash, crash);
  /* vidro: compara o mesmo quadro com e sem o fragmento */
  S.next = 99999; S.frags = []; S.eyes = []; S.whisper = null; S.glitch = 0; S.flash = 0;
  g.reduced = true; /* sem granulado aleatorio */
  const me = g.activeOf(0), sh = g.activeOf(1);
  me.x = 160; sh.x = 820;
  const frozen = g.time;
  const draw = () => { g.time = frozen; g.sparks = []; g.render(1); return g.canvas.getContext('2d').getImageData(380, 60, 200, 200).data; };
  const a = draw();
  S.frags = [{ x: 480, y: 160 - GY, vy: 1, rot: 0, vr: 0, ph: 0, shape: 1, age: 50 }];
  const b = draw();
  let diff = 0, px = 0, maxd = 0;
  for (let i = 0; i < a.length; i += 4) { const d = (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2])) / 3; diff += d; px++; if (d > maxd) maxd = d; }
  const mean = diff / px;
  check('fragmento aparece (bordas de vidro mudam o quadro)', maxd > 60, 'max ' + maxd.toFixed(0));
  check('fragmento e transparente: o mapa continua visivel atras', mean < 40, 'diferenca media ' + mean.toFixed(1) + '/255');
  /* efeitos da sombra marcados como escuros */
  g._darkFx = true; g.spawnBurst('impact', 1, 100, -100, 1, 1); g._darkFx = false;
  g.spawnBurst('impact', 1, 100, -100, 1, 1);
  const L = g.bursts.length;
  check('burst da sombra sai escuro, o do jogador nao', g.bursts[L - 2].dark === true && !g.bursts[L - 1].dark);
  let filt = null; const fake = { save() {}, restore() {}, set filter(v) { filt = v; }, get filter() { return filt; } };
  g.darkDraw(fake, sh, () => {});
  check('projetil/golpe da sombra desenha com filtro sombrio', filt === SH.ATTACK_FILTER, filt);
  filt = null; g.darkDraw(fake, me, () => {});
  check('projetil do jogador sem filtro', filt === null);
}

let musicDone = Promise.resolve();
/* ---------- 7b. nota do torneio no toque (celular) ---------- */
{
  const R = vm.runInContext('torneioRank', ctx);
  check('teclado: regua antiga intacta (vida cheia, 60s, combo 8 no chefe = S)', R(1, 60, 8, true).letter === 'S' && R(1, 60, 8, true, false).pts === R(1, 60, 8, true).pts);
  check('teclado: chefe com 50% de vida, 160s, combo 4 = C', R(0.5, 160, 4, true).letter === 'C', R(0.5, 160, 4, true).pts);
  check('toque: o mesmo chefe (50%, 160s, combo 4) = A — abre a luta contra si mesmo', R(0.5, 160, 4, true, true).letter === 'A', R(0.5, 160, 4, true, true).pts);
  check('toque: S possivel (75% de vida, 120s, combo 5)', R(0.75, 120, 5, true, true).letter === 'S', R(0.75, 120, 5, true, true).pts);
  check('toque: perder quase toda a vida ainda nao da A (20%, 200s, combo 2)', R(0.2, 200, 2, true, true).letter !== 'A' && R(0.2, 200, 2, true, true).letter !== 'S', R(0.2, 200, 2, true, true).letter);
  check('nota do toque marcada no resultado', R(1, 60, 8, true, true).touch === true && R(1, 60, 8, true).touch === false);
  const inputSrc = fs.readFileSync(path.join(ROOT, 'js/engine/input.js'), 'utf8');
  const uiSrc = fs.readFileSync(path.join(ROOT, 'js/ui/ui.js'), 'utf8');
  check('botoes e direcional de toque marcam a luta como "no toque"', (inputSrc.match(/this\.touchUsed = true/g) || []).length >= 2);
  check('cada luta zera a marca e a nota do torneio usa ela', /Input\.touchUsed = false/.test(uiSrc) && uiSrc.split('\n').some((l) => l.includes('torneioRank(') && l.includes('Input.touchUsed')));
}

/* ---------- 8. musica: lista sombria exclusiva + Helena no menu ---------- */
{
  const pl = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/music/playlist.json'), 'utf8'));
  const dark = (pl.shadow || []).map((t) => t.file);
  check('lista "shadow" tem as 5 faixas sombrias do commit', dark.length === 5 && dark.some((f) => /Sweet Decadance/.test(f)) && dark.filter((f) => /Blade and Bath/.test(f)).length === 3 && dark.some((f) => /\/Shot\.mp3$/.test(f)), dark.length);
  check('faixas sombrias existem no disco', dark.every((f) => fs.existsSync(path.join(ROOT, f))));
  check('faixas sombrias tem volume medido (gain)', (pl.shadow || []).every((t) => t.gain > 0 && t.gain <= 1));
  const tracks = (pl.tracks || []).map((t) => t.file);
  check('faixas sombrias fora do sorteio normal', !dark.some((f) => tracks.includes(f)));
  check('Helena fora da luta normal', !tracks.some((f) => /Helena/.test(f)));
  const mt = (pl.menuTracks || []).map((t) => t.file);
  check('menu: Helena primeiro, depois o tema do jogo', /Misfits - Helena\.mp3$/.test(mt[0] || '') && mt[1] === pl.menu.file, mt.join(' | '));
  check('faixas do menu existem no disco', mt.every((f) => fs.existsSync(path.join(ROOT, f))));
  const bs = fs.readFileSync(path.join(ROOT, 'tools/build_site.cjs'), 'utf8');
  check('build do site publica "shadow" e "menuTracks"', /'shadow', 'menuTracks'/.test(bs));

  /* AudioSys real com Audio falso */
  const held = { open: false, list: [] };
  const mkAudio = (autoplay) => {
    const played = [];
    const c = { console: { log() {}, warn() {}, error() {} }, Math, Date, JSON, performance: { now: () => 0 },
      fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(pl) }),
      /* autoplay: true = toca; false = recusa (Chrome); 'held' = segura o pedido e solta depois do toque (Firefox no celular) */
      Audio: class {
        constructor(src) { this.src = src; this.paused = true; this.currentTime = 0; this.ev = {}; played.push(this); }
        addEventListener(k, f) { (this.ev[k] = this.ev[k] || []).push(f); }
        emit(k) { (this.ev[k] || []).forEach((f) => f()); }
        play() {
          if (autoplay === 'held' && !held.open) { held.list.push(this); return new Promise(() => {}); }
          if (!autoplay) return Promise.reject(new Error('NotAllowed'));
          this.paused = false; this.emit('play'); return Promise.resolve();
        }
        pause() { this.paused = true; }
        removeAttribute(k) { if (k === 'src') this.src = ''; }
        load() {}
      },
      Profile: { data: { settings: { music: 0.5, sfx: 0.8, voice: 0.9 } } },
      window: {}, document: { addEventListener() {} }, UI: { toast() {} } };
    c.globalThis = c; vm.createContext(c);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/engine/audio.js'), 'utf8'), c, { filename: 'audio.js' });
    return { A: vm.runInContext('AudioSys', c), played };
  };
  musicDone = (async () => {
    const { A } = mkAudio(true);
    await A._ready;
    const picks = new Set();
    for (let k = 0; k < 60; k++) picks.add(A.pickBattleTrack('shadow').file);
    check('modo sombrio sorteia SO faixas sombrias', [...picks].every((f) => dark.includes(f)) && picks.size >= 4, picks.size + ' faixas');
    const normal = new Set();
    for (let k = 0; k < 300; k++) normal.add(A.pickBattleTrack('battle').file);
    check('luta normal nunca toca faixa sombria nem Helena', ![...normal].some((f) => dark.includes(f) || /Helena/.test(f)), normal.size);
    const seq = [A.nextMenuTrack().file, A.nextMenuTrack().file, A.nextMenuTrack().file];
    check('menu alterna Helena -> tema -> Helena', /Helena/.test(seq[0]) && seq[1] === pl.menu.file && /Helena/.test(seq[2]));

    /* tela de START com autoplay liberado: Helena ja toca, START continua a mesma */
    const T = mkAudio(true);
    await T.A._ready;
    T.A.titleMusic();
    await new Promise((r) => setImmediate(r)); await new Promise((r) => setImmediate(r));
    const m0 = T.A.music;
    check('START: Helena toca depois dos assets', m0 && /Helena/.test(m0.src) && !m0.paused && T.A.musicKind === 'menu', m0 && m0.src);
    check('menu de Helena nao fica em loop (alterna com o tema)', m0 && m0.loop === false);
    T.A.unlocked = true; /* ensure() sem AudioContext */
    T.A.flushPending();
    T.A.playMusic('menu');
    check('apertar START continua a mesma faixa no menu', T.A.music === m0);
    m0.paused = true; m0.onended();
    check('Helena acabou: entra o tema do jogo', T.A.music && T.A.music.src === pl.menu.file, T.A.music && T.A.music.src);

    /* navegador bloqueia autoplay: fica pendente ate o 1o toque */
    const B = mkAudio(false);
    await B.A._ready;
    B.A.titleMusic();
    await new Promise((r) => setImmediate(r)); await new Promise((r) => setImmediate(r)); await new Promise((r) => setImmediate(r));
    check('sem autoplay: musica do menu fica pendente', B.A.pending === 'menu' && !B.A.music, B.A.pending);
    B.A.unlocked = true; B.A.flushPending();
    check('1o toque: comeca pela Helena', B.A.music && /Helena/.test(B.A.music.src), B.A.music && B.A.music.src);

    /* Firefox no celular: o pedido de tocar fica pendurado e o navegador solta
       depois do toque. Antes: pulava a Helena, criava o tema e a Helena voltava
       por tras (duas musicas). */
    const H = mkAudio('held');
    await H.A._ready;
    H.A.titleMusic();
    await new Promise((r) => setImmediate(r)); await new Promise((r) => setImmediate(r));
    const h0 = H.A.music;
    H.A.unlocked = true; held.open = true;
    H.A.flushPending();            /* 1o toque (ensure) */
    H.A.playMusic('menu');         /* START -> menu */
    held.list.forEach((a) => { a.paused = false; a.emit('play'); }); /* o navegador solta o pedido antigo */
    const tocando = H.played.filter((a) => !a.paused);
    check('Firefox: o toque retoma a MESMA Helena (nao pula pro tema)', H.A.music === h0 && /Helena/.test(h0.src), H.A.music && H.A.music.src);
    check('Firefox: so UMA musica tocando no menu', tocando.length === 1 && tocando[0] === H.A.music, tocando.map((a) => a.src).join(' + '));
    /* musica fantasma: elemento antigo que o navegador solta depois e calado */
    const ghost = H.played.length;
    H.A.playMusic('battle', true);
    const old = H.played.find((a) => a !== H.A.music && /Helena/.test(String(a._src || a.src || '')) ) || h0;
    old.paused = false; old.emit('play');
    check('musica antiga que volta a tocar sozinha e calada na hora', old.paused === true && H.played.filter((a) => !a.paused).length === 1, ghost + ' elementos');

    const S = mkAudio(true);
    await S.A._ready;
    S.A.unlocked = true;
    S.A.playMusic('shadow');
    const s0 = S.A.music;
    check('playMusic("shadow") toca faixa sombria', s0 && dark.includes(s0.src), s0 && s0.src);
    s0.paused = true; s0.onended();
    check('acabou a faixa sombria: vem outra sombria', S.A.music && S.A.music !== s0 && dark.includes(S.A.music.src));
  })();
}

musicDone.catch((e) => check('testes de musica sem excecao', false, e.message)).then(() => {
  console.log('\n' + (n - fails) + '/' + n + ' checks OK');
  process.exit(fails ? 1 : 0);
});
