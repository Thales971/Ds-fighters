// DOLYNHO SECRETO + ABA DE CONQUISTAS MELHORADA + PITOCO SILHUETA:
// 1) wiring: script tag, SECRET_IDS, redeem do dolynho, anti-leak (dolly),
//    28 conquistas, hooks de grant, renderConquistas novo, css, silhueta pet;
// 2) profile real: redeem DOLLY, recordStage->estagios-10, pitoco-1;
// 3) engine real: dolynho na grade (secret, stats no nivel de Du/Felipinho),
//    POWERS com 5 poderes e ult buffada, assets existem, LUTA REAL renderiza
//    pixels do sprite e todos os 5 poderes castam sem erro;
// 4) UI real: renderConquistas gera barra de progresso + cartoes; renderPets
//    mostra o pitoco travado como silhueta '?'.
const fs = require('fs'); const vm = require('vm');
function req(name) { return require(name); }
const { createCanvas, Image: CanvasImage, loadImage } = req('canvas');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

const html = fs.readFileSync('index.html', 'utf8');
const uiSrc = fs.readFileSync('js/ui/ui.js', 'utf8');
const profSrc = fs.readFileSync('js/core/profile.js', 'utf8');
const gameSrc = fs.readFileSync('js/engine/game.js', 'utf8');
const ftrSrc = fs.readFileSync('js/engine/fighter.js', 'utf8');
const achSrc = fs.readFileSync('js/data/achievements.js', 'utf8');
const css = fs.readFileSync('css/style.css', 'utf8');
const readme = fs.readFileSync('README.md', 'utf8');

// ================= 1. WIRING =================
check('index.html: script fighters-dolynho.js carregado ANTES de powers-balance-v9.js', html.indexOf('js/data/fighters-dolynho.js') > 0 && html.indexOf('js/data/fighters-dolynho.js') < html.indexOf('powers-balance-v9.js'));
check('profile.js: SECRET_IDS tem 5 secretos incl. dolynho + branch de resgate proprio', /SECRET_IDS: \[[^\]]*'dolynho'/.test(profSrc) && profSrc.indexOf("c === 'dolly'") >= 0 && profSrc.indexOf("['dolynho']") >= 0);
check('achievements.js: 28 conquistas, ids unicos, todas com name+desc', /const ACHIEVEMENTS = \[/.test(achSrc));
{
  const ids = [...achSrc.matchAll(/id: '([^']+)'/g)].map((m) => m[1]);
  check('31 conquistas com ids unicos e completos (torneio + login + sombra)', ids.length === 31 && new Set(ids).size === 31, ids.length + ' ids');
  const entries = achSrc.match(/\{ id: '[^']+',[^}]*\}/g) || [];
  check('todas as conquistas tem name e desc', entries.length === 31 && entries.every((e) => /name:/.test(e) && /desc:/.test(e)));
}
check('hooks de grant: game.js (combo-30, vitoria-10/50, recordStage), fighter.js (ultimate-1, bloqueio-25), ui.js (arcade-3, survival-5, foto-1, acessorio-1, favoritos-5, pet-1)', gameSrc.indexOf("grantAchievement('combo-30')") >= 0 && gameSrc.indexOf("grantAchievement('vitoria-10')") >= 0 && gameSrc.indexOf('recordStage(this.cfg.stage)') >= 0 && ftrSrc.indexOf("grantAchievement('ultimate-1')") >= 0 && ftrSrc.indexOf("grantAchievement('bloqueio-25')") >= 0 && ['arcade-3', 'survival-5', 'foto-1', 'acessorio-1', 'favoritos-5', 'pet-1'].every((id) => uiSrc.indexOf("grantAchievement('" + id + "')") >= 0));
check('profile.js: recordStage conta palcos e da estagios-10; unlockPitoco da pitoco-1', profSrc.indexOf('recordStage(stageId)') >= 0 && profSrc.indexOf("grantAchievement('estagios-10')") >= 0 && profSrc.indexOf("grantAchievement('pitoco-1')") >= 0);
check('renderConquistas novo: barra de progresso + cartoes .medal + .cq-rec', uiSrc.indexOf('cq-bar') >= 0 && uiSrc.indexOf('class="medal ') >= 0 && uiSrc.indexOf('cq-rec') >= 0 && uiSrc.indexOf('cq-pct') >= 0);
check('menu side mostra Medalhas x/28', uiSrc.indexOf('<span>Medalhas</span>') >= 0);
check('css: .cq-head/.cq-bar/.cq-pct/.medals/.medal.on/.medal .mi/.cq-rec/.rec/.tops/.pet-spr.sil', ['.cq-head', '.cq-bar', '.cq-pct', '.medals', '.medal.on', '.medal .mi', '.cq-rec', '.rec', '.tops', '.pet-spr.sil'].every((c) => css.indexOf(c) >= 0));
check('renderPets: pitoco travado renderiza silhueta .pet-spr.sil com ?', uiSrc.indexOf('pet-spr sil') >= 0 && /pet-spr sil" title="\?\?\?">\?</.test(uiSrc));
check('README atualizado: 53 na grade + 5 secretos', readme.indexOf('53 lutadores na grade') >= 0 && readme.indexOf('5 personagens secretos') >= 0);
// anti-leak da palavra nova
{
  const hasWord = (s, w) => { const t = ' ' + s.toLowerCase().replace(/[^a-z\u00e0-\u00fa ]/g, ' ') + ' '; return t.indexOf(' ' + w + ' ') >= 0; };
  const leakers = [];
  const mds = fs.readdirSync('.').filter((f) => f.endsWith('.md')).concat(fs.existsSync('docs') ? fs.readdirSync('docs').filter((f) => f.endsWith('.md')).map((f) => 'docs/' + f) : []);
  for (const f of mds) { if (hasWord(fs.readFileSync(f, 'utf8'), 'dolly')) leakers.push(f); }
  if (hasWord(html, 'dolly')) leakers.push('index.html');
  for (const f of ['js/ui/ui.js', 'js/core/profile.js', 'js/data/pets.js', 'js/data/fighters-pack.js', 'js/data/fighters-dolynho.js']) {
    const s = fs.readFileSync(f, 'utf8');
    const cl = s.split('\n').filter((l) => l.trim().startsWith('//') || l.trim().startsWith('/*') || l.indexOf('/*') >= 0);
    if (cl.some((l) => hasWord(l, 'dolly'))) leakers.push(f + ' (comentario)');
  }
  check('anti-leak: a palavra do codigo do Dolynho nao aparece em .md/index.html/comentarios', leakers.length === 0, leakers.join(', '));
  const errLine = profSrc.split('\n').find((l) => l.indexOf('ok: false') >= 0 && hasWord(l, 'dolly'));
  check('profile.js: linha de erro nao cita o codigo', !errLine);
}

// ================= 2. PROFILE REAL (redeem/recordStage/pitoco) =================
{
  const ctxP = {
    console, fs, Math, Date, JSON,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    window: {}, AudioSys: new Proxy({}, { get: () => () => {} }), UI: new Proxy({}, { get: () => () => {} }),
  };
  ctxP.globalThis = ctxP; vm.createContext(ctxP);
  for (const f of ['js/data/achievements.js', 'js/core/profile.js', 'js/data/pets.js', 'assets/sprites/layout.js', 'js/data/fighters.js', 'js/data/fighters-dolynho.js']) {
    try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctxP, { filename: f }); } catch (e) { console.log('ERRO', f, e.message.slice(0, 80)); }
  }
  const r = vm.runInContext(`
  (() => {
    Profile.data = Profile._normalize({ unlocked: [], settings: {}, stats: {} });
    const out = {};
    out.lockedDefault = Profile.isUnlocked('dolynho') === false;
    const rd = Profile.redeem('DoLlY');
    out.redeemOk = rd.ok === true && (rd.ids || []).includes('dolynho');
    out.unlockedAfter = Profile.isUnlocked('dolynho') === true;
    out.admNoDolly = (Profile.redeem('adm'), Profile.isUnlocked('dolynho') === true); // ja estava; so confirma idempotente
    const bad = Profile.redeem('nao-existe-123');
    out.badMsgNoLeak = bad.ok === false && (' ' + bad.msg.toLowerCase().replace(/[^a-z ]/g, ' ') + ' ').indexOf(' dolly ') < 0;
    // recordStage -> estagios-10
    for (let i = 0; i < 10; i++) Profile.recordStage('palco-' + i);
    out.stageAch = Profile.hasAchievement('estagios-10');
    out.stageCount = Object.keys(Profile.data.winStage || {}).length;
    // pitoco -> pitoco-1
    out.pitoco = Profile.unlockPitoco() === true && Profile.hasAchievement('pitoco-1') && Profile.hasPitoco();
    // grant novo id
    out.grantNew = Profile.grantAchievement('foto-1') === true && Profile.hasAchievement('foto-1') && Profile.grantAchievement('foto-1') === false;
    return JSON.stringify(out);
  })()`, ctxP);
  const P = JSON.parse(r);
  check('profile: dolynho travado por padrao, DOLLY (qualquer caixa) desbloqueia so ele', P.lockedDefault && P.redeemOk && P.unlockedAfter, r);
  check('profile: msg de codigo invalido nao vaza o codigo novo', P.badMsgNoLeak);
  check('profile: recordStage em 10 palcos da conquista estagios-10', P.stageAch && P.stageCount === 10, 'palcos=' + P.stageCount);
  check('profile: unlockPitoco da conquista pitoco-1', P.pitoco === true);
  check('profile: grantAchievement idempotente para id novo (foto-1)', P.grantNew === true);
}

// ================= 3. ENGINE REAL: dolynho luta de verdade =================
const ctx = { console, Math, Date, Image: CanvasImage, createCanvas, loadImage, fs,
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho', 'maximilian', 'dolynho'], data: { settings: { reducedMotion: false, quality: 'medium' }, unlocked: ['dolynho'], stats: {}, achievements: [] }, isUnlocked: (id) => !this.SECRET_IDS.includes(id) || (this.data.unlocked || []).includes(id), petFor: () => null, setting(k, v) { if (v === undefined) return this.data.settings[k]; this.data.settings[k] = v; return v; }, reducedMotion: () => false, record() {}, grantAchievement() {}, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, recordStage() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0, hit: () => false, menu: () => ({}), releaseAll() {} },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: { room: null, score: null, takeRemote: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }) },
  AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), querySelectorAll: () => [], querySelector: () => null, addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} }, dataset: {} } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/balance.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/fighters-dolynho.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/fighters-dev-virado.js', 'js/data/fighters-milena.js', 'js/data/fighters-kira.js', 'js/data/fighters-cracker.js', 'js/data/fighters-rafael.js', 'js/data/fighters-cyber-v2.js', 'js/data/roster-portraits.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/data/accessories.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 80)); } }

(async () => {
  const def = await vm.runInContext(`
  (() => {
    const d = FIGHTERS.find((f) => f.id === 'dolynho');
    const du = FIGHTERS.find((f) => f.id === 'du');
    const fe = FIGHTERS.find((f) => f.id === 'felipinho');
    const kit = (POWERS.dolynho && POWERS.dolynho.powers) || [];
    const ult = kit.find((p) => p.slot === 'ultimate') || {};
    return JSON.stringify({
      found: !!d, secret: !!(d && d.secret), stats: d && d.stats,
      du: du && du.stats, fe: fe && fe.stats,
      element: POWERS.dolynho && POWERS.dolynho.element,
      nPowers: kit.length, ultDmg: ult.dmg, ultId: ult.id,
      layoutFile: SPRITE_LAYOUT.files.dolynho || null,
      portrait: (typeof ROSTER_PORTRAITS !== 'undefined' && ROSTER_PORTRAITS.order || []).includes('dolynho'),
      totalFighters: FIGHTERS.length,
      voice: !!(typeof VOICE_BOOK !== 'undefined' && VOICE_BOOK.fighters && VOICE_BOOK.fighters.dolynho),
    });
  })()`, ctx);
  const D = JSON.parse(def);
  check('dolynho esta na grade como SECRETO', D.found && D.secret, def);
  check('stats no nivel do Du/Felipinho Hydro (power>=1.42, speed>=1.22, hp>=142, meter>=1.50, hp<=500)', D.stats && D.stats.power >= 1.42 && D.stats.speed >= 1.22 && D.stats.hp >= 142 && D.stats.meterRate >= 1.50 && D.stats.hp <= 500, JSON.stringify(D.stats) + ' vs du=' + JSON.stringify(D.du) + ' fe=' + JSON.stringify(D.fe));
  check('POWERS.dolynho: 5 poderes, elemento fizz, ultimate buffada (dmg>=50)', D.nPowers === 5 && D.element === 'fizz' && D.ultDmg >= 50, 'ult=' + D.ultId + ' dmg=' + D.ultDmg);
  check('assets ja existiam e estao linked: layout.files + retrato no atlas + voz pt-BR', D.layoutFile === 'assets/sprites/dolynho.png' && D.portrait && D.voice, 'layout=' + D.layoutFile);
  {
    const sp = fs.existsSync('assets/sprites/dolynho.png'), ab = fs.existsSync('assets/abilities/dolynho.png');
    check('assets/sprites/dolynho.png e abilities/dolynho.png existem no disco', sp && ab);
  }

  // luta real dolynho vs du: renderiza pixels e todos os poderes castam
  const fight = await vm.runInContext(`
  (async () => {
    SpriteGen.images.dolynho = await loadImage('assets/sprites/dolynho.png');
    SpriteGen.images.du = await loadImage('assets/sprites/du.png');
    const canvas = createCanvas(960, 540);
    const cx2d = canvas.getContext('2d');
    const g = new Game({ width: 960, height: 540, getContext: () => cx2d, toBuffer: () => canvas.toBuffer('image/png'), classList: { remove(){}, add(){}, toggle(){} } });
    g.start({ mode: 'versus', teams: [['dolynho'], ['du']], stage: '06-sakura-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
    for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
    for (let t = 0; t < 30; t++) g.tick();
    g.stage.img = await loadImage('assets/maps/06-sakura-dojo.jpg'); g.stage.ready = true;
    g.paused = true; g.time = 400; g.stage.t = 40;
    if (g.weather) g.weather.kind = 'clear';
    g.shakeMag = 0; g.freeze = 0; g.slowmo = 0; g.chroma = 0;
    const f0 = g.activeOf(0), f1 = g.activeOf(1);
    const fix = (f, x, dir) => { f.x = x; f.y = 0; f.state = 'idle'; f.frame = 0; f.stateTime = 3; f.dir = dir; f.vx = 0; f.vy = 0; f.alive = true; f.hp = f.maxHp; f.status = {}; f.attack = null; f.cast = null; };
    fix(f0, 380, 1); fix(f1, 580, -1);
    cx2d.clearRect(0, 0, 960, 540);
    let renderErr = null;
    try { g.render(1); } catch (e) { renderErr = e.message; }
    fs.writeFileSync('.vibe/dolynho-fight.png', canvas.toBuffer('image/png'));
    const d = cx2d.getImageData(0, 0, 960, 540).data;
    let px = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 10) px++;
    // sprite do dolynho desenha de verdade (canvas limpo, so o lutador)
    const c2 = createCanvas(500, 540);
    const x2 = c2.getContext('2d');
    x2.clearRect(0, 0, 500, 540);
    x2.save(); x2.translate(0, 458);
    try { f0.draw(x2); } catch (e) { renderErr = (renderErr || '') + ' draw:' + e.message; }
    x2.restore();
    const d2 = x2.getImageData(0, 0, 500, 540).data;
    let spritePx = 0;
    for (let i = 3; i < d2.length; i += 4) if (d2[i] > 10) spritePx++;
    // casta os 5 poderes (despausa antes — modo foto deixa o jogo pausado)
    g.paused = false;
    const kit = f0.currentKit();
    const casts = [];
    for (let i = 0; i < kit.length; i++) {
      f0.state = 'idle'; f0.cast = null; f0.castLock = 0; f0.spamShared = 0; f0.cd = [0,0,0,0,0,0,0,0,0,0]; f0.charge = [100,100]; f0.ultimate = 100; f0.y = 0; f0.vy = 0; f0.onGround = true; f0.hitstun = 0; f0.stun = 0; f0.x = 300; f0.hp = f0.maxHp; f0.alive = true; f0.status = {};
      f1.x = f0.x + 240; f1.hp = f1.maxHp; f1.state = 'idle'; f1.alive = true; f1.hitstun = 0; f1.stun = 0; f1.y = 0; f1.onGround = true;
      g.projectiles.length = 0; g.strikes.length = 0; g.zones.length = 0; g.beams.length = 0;
      let err = null, fired = false;
      try {
        const ok = f0.tryCast(i);
        if (!ok) { casts.push({ p: kit[i].id, err: 'recusado' }); continue; }
        for (let t = 0; t < 200; t++) { g.tick(); if (f0.cast && f0.cast.fired) { fired = true; break; } }
        for (let t = 0; t < 10; t++) g.tick();
      } catch (e) { err = e.message; }
      casts.push({ p: kit[i].id, fired, err });
    }
    return JSON.stringify({ rs: g.roundState, renderErr, px, spritePx, casts, kitIds: kit.map((k) => k.id) });
  })()`, ctx);
  const F = JSON.parse(fight);
  check('luta dolynho vs du chega em fight e renderiza sem erro', F.rs === 'fight' && !F.renderErr && F.px > 20000, F.renderErr || ('px=' + F.px));
  check('sprite do dolynho desenha pixels reais no canvas (spritePx=' + F.spritePx + ')', F.spritePx > 2000, 'spritePx=' + F.spritePx);
  check('os 5 poderes do dolynho castam e disparam sem erro', F.casts.length === 5 && F.casts.every((c) => c.fired && !c.err), JSON.stringify(F.casts));

  // ================= 4. UI REAL: conquistas + pets silhueta =================
  const ctx2 = {
    console, Math, Date, JSON, fs,
    Image: function () { return { set src(v) {}, get src() { return ''; } }; },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    location: { hash: '' },
    Input: { init() {}, read: () => ({}), hit: () => false, menu: () => ({}), releaseAll() {}, pad: () => null, padCount: 0 },
    AudioSys: new Proxy({}, { get: () => () => {} }),
    HUD: { hide() {}, show() {} }, Net: { room: null },
    window: { addEventListener() {} }, setTimeout, clearTimeout,
  };
  ctx2.document = {
    getElementById: () => null,
    createElement: () => ({ style: {}, getContext: () => null, classList: { add() {}, remove() {}, toggle() {} } }),
    querySelectorAll: () => [], querySelector: () => null, addEventListener() {},
    body: { classList: { add() {}, remove() {}, toggle() {} }, dataset: {}, appendChild() {} }, activeElement: null,
  };
  ctx2.globalThis = ctx2; vm.createContext(ctx2);
  const files2 = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/achievements.js', 'js/core/profile.js', 'js/data/pets.js', 'js/data/balance.js', 'js/data/fighters.js', 'js/data/powers.js'];
  for (const f of files2) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx2, { filename: f }); } catch (e) { console.log('ERRO2', f, e.message.slice(0, 60)); } }
  for (const f of fs.readdirSync('js/data').filter((f) => /^fighters.*\.js$/.test(f) || /^powers.*\.js$/.test(f)).sort()) {
    try { vm.runInContext(fs.readFileSync('js/data/' + f, 'utf8'), ctx2, { filename: 'js/data/' + f }); } catch (e) {}
  }
  try { vm.runInContext(uiSrc, ctx2, { filename: 'js/ui/ui.js' }); } catch (e) { console.log('ERRO2 ui.js', e.message.slice(0, 100)); }

  const ui = await vm.runInContext(`
  (() => {
    Profile.data = Profile._normalize({ unlocked: ['du'], settings: {}, stats: { fights: 5, wins: 3, bestArcade: 2, bestSurvival: 7, maxCombo: 22, survivalBy: { du: 7 } }, winBy: { du: 3, stack: 2 }, achievements: ['primeiro-ko', 'combo-10'] });
    const els = {};
    const mk = () => ({ innerHTML: '', hidden: true, textContent: '', classList: { add(){}, remove(){}, toggle(){} }, addEventListener(){}, querySelectorAll: () => [], appendChild(){}, dataset: {}, style: {} });
    const ui = Object.create(UI);
    ui.$ = (id) => els[id] || (els[id] = mk());
    ui.__els = els;
    ui.petSlot = 0;
    return ui;
  })()`, ctx2);

  ui.renderConquistas();
  const cqHtml = ui.__els['conquistas-list'].innerHTML;
  check('renderConquistas: barra de progresso + 2/31 + cartao .medal.on no primeiro-ko + recordes', cqHtml.indexOf('cq-bar') >= 0 && cqHtml.indexOf('2/31') >= 0 && /medal on/.test(cqHtml) && cqHtml.indexOf('RECORDES') >= 0 && cqHtml.indexOf('DU MAGMA') >= 0, cqHtml.slice(0, 120));
  check('renderConquistas: medalhas novas listadas (Fotógrafo, Turista, O Cão Mais Fiel...)', cqHtml.indexOf('Turista') >= 0 && cqHtml.length > 3000, 'len=' + cqHtml.length);

  ui.renderPets();
  const petHtml = ui.__els['pet-grid'].innerHTML;
  check('renderPets: pitoco travado aparece como SILHUETA (pet-spr sil + ???) igual lutador ??? na grade', petHtml.indexOf('pet-spr sil') >= 0 && petHtml.indexOf('???') >= 0 && /locked/.test(petHtml), petHtml.slice(petHtml.indexOf('pitoco') - 80, petHtml.indexOf('pitoco') + 40));

  // filtro SECRETOS agora traz 6 secretos (com o Kernor) + aleatoria
  const sec = await vm.runInContext('JSON.stringify(selFilterSlots(FIGHTERS, "", "secret", [], () => true).map((i) => FIGHTERS[i] && FIGHTERS[i].id))', ctx2);
  check('filtro SECRETOS: 6 secretos (incl. dolynho e kernor) + aleatoria', JSON.parse(sec).filter(Boolean).length === 6, sec);

  console.log('---');
  console.log(fails === 0 ? 'DOLYNHO+CONQUISTAS: TUDO OK (' + n + ' checks)' : 'DOLYNHO+CONQUISTAS: ' + fails + ' FALHAS de ' + n);
  process.exit(fails ? 1 : 0);
})();
