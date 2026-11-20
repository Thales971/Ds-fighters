// TORNEIO ATE O CHEFE (arcade melhorado) + musica AMV do chefe + tela inicial animada + responsividade.
// - playlist.json tem lista "boss" so com as faixas mais AMV e todos os arquivos existem
// - AudioSys.pickBattleTrack('boss') sorteia so da lista boss; playMusic('boss') toca e nao reinicia
// - game.start usa cfg.music (chefe entra com 'boss')
// - escada do torneio: 6 mais fortes/insuportaveis (sem secretos), ordem crescente, chefe IALES no fim
// - UI: botao do torneio, rounds rapidos (1 round, 99s) e chefe com 2 rounds/180s/musica boss
// - tela inicial: title-fx no HTML, animacoes logoFloat/stars/scan no CSS com guarda reduced
// - viewport: fullscreenchange + ResizeObserver + overscroll none
const fs = require('fs'); const vm = require('vm');
function req(name) { return require(name); }
const { createCanvas } = req('canvas');

let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

// ===== 1. playlist boss =====
const pl = JSON.parse(fs.readFileSync('assets/music/playlist.json', 'utf8'));
check('playlist.json tem lista "boss" com >=10 faixas AMV', Array.isArray(pl.boss) && pl.boss.length >= 10, (pl.boss || []).length + ' faixas');
const trackFiles = new Set((pl.tracks || []).map((t) => t.file));
check('toda faixa boss existe em tracks e o arquivo existe no disco', (pl.boss || []).every((t) => trackFiles.has(t.file) && fs.existsSync(t.file)), '');
check('boss inclui Skillet Monster (a pedida)', (pl.boss || []).some((t) => /Skillet — Monster/.test(t.title)), '');

// ===== 2. AudioSys real: pickBattleTrack('boss') e playMusic('boss') =====
const ctx = { console, Math, Date, setTimeout, clearTimeout,
  fetch: (url) => Promise.resolve({ json: () => Promise.resolve(JSON.parse(fs.readFileSync(url.replace(/^\//, ''), 'utf8'))), arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }),
  Audio: class { constructor(src) { this.src = src; this.paused = true; this.volume = 1; this.loop = false; } play() { this.paused = false; return { catch() {} }; } pause() { this.paused = true; } removeAttribute() {} addEventListener() {} },
  window: {}, document: { createElement: () => createCanvas(8, 8), addEventListener() {} }, navigator: {},
  Profile: { data: { settings: { music: 0.35, sfx: 0.8, voice: 0.9, mute: false } } },
};
ctx.globalThis = ctx; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('js/engine/audio.js', 'utf8'), ctx, { filename: 'js/engine/audio.js' });
vm.runInContext(`
AudioSys.unlocked = true;
AudioSys.playlist = JSON.parse(require('fs').readFileSync('assets/music/playlist.json', 'utf8'));
`, Object.assign(ctx, { require }));
const r = vm.runInContext(`
const bossFiles = new Set(AudioSys.playlist.boss.map((t) => t.file));
const picks = new Set();
for (let i = 0; i < 60; i++) { const t = AudioSys.pickBattleTrack('boss'); picks.add(t.file); }
const normal = new Set();
for (let i = 0; i < 60; i++) { const t = AudioSys.pickBattleTrack(); normal.add(t.file); }
const inBoss = [...picks].every((f) => bossFiles.has(f));
AudioSys.playMusic('boss');
const kind1 = AudioSys.musicKind, src1 = AudioSys.music && AudioSys.music.src;
const m1 = AudioSys.music;
AudioSys.playMusic('boss'); /* mesma kind tocando: NAO reinicia */
const sameEl = AudioSys.music === m1;
AudioSys.playMusic('battle');
const kindB = AudioSys.musicKind;
JSON.stringify({ inBoss, bossN: picks.size, normalN: normal.size, kind1, src1, inBossSrc: bossFiles.has(src1), sameEl, kindB });
`, ctx);
const bossRes = JSON.parse(r);
check('pickBattleTrack(\'boss\') sorteia SOMENTE da lista boss', bossRes.inBoss && bossRes.bossN >= 3, bossRes.bossN + ' Nafas distintas de ' + bossFilesSize());
check('pickBattleTrack() normal continua das 57 faixas', bossRes.normalN >= 3, bossRes.normalN + ' distintas');
check("playMusic('boss') liga musicKind='boss' com faixa da lista boss", bossRes.kind1 === 'boss' && bossRes.inBossSrc, bossRes.kind1 + ' ' + bossRes.src1);
check("playMusic('boss') de novo NAO reinicia a faixa (nao troca de musica no meio)", bossRes.sameEl === true);
check("playMusic('battle') volta pro pool normal", bossRes.kindB === 'battle');
function bossFilesSize() { return (pl.boss || []).length; }

// ===== 3. game.start usa cfg.music =====
const ctx2 = { console, Math, Date, Image: class { set src(v) {} }, createCanvas, fs,
  Profile: { SECRET_IDS: [], data: { settings: { reducedMotion: false }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting: () => null, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({ _calls: [], playMusic(k) { this._calls.push(k); }, stopMusic() {}, stopLoops() {} }, { get(t, k) { return k in t ? t[k] : () => {}; } }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {}, pitocoSeq: [], pitocoKey() {} },
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), querySelectorAll: () => [], addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} }, dataset: {} } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx2.globalThis = ctx2; vm.createContext(ctx2);
const files2 = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files2) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx2, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }
const r2 = vm.runInContext(`
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), set imageSmoothingEnabled(v) {}, set globalAlpha(v) {}, set globalCompositeOperation(v) {}, set fillStyle(v) {}, set strokeStyle(v) {}, set font(v) {}, set textAlign(v) {}, set lineWidth(v) {}, set filter(v) {} });
const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } });
g.start({ mode: 'arcade', teams: [['du'], ['stack']], stage: 'treino-dojo', cpu: [false, true], roundsToWin: 1, timer: 99, music: 'boss' });
JSON.stringify(AudioSys._calls);
`, ctx2);
check("game.start com cfg.music='boss' chama AudioSys.playMusic('boss')", JSON.parse(r2).includes('boss'), r2);
const r2b = vm.runInContext(`
AudioSys._calls.length = 0;
const g2 = new Game({ width: 960, height: 540, getContext: () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }), classList: { toggle() {}, add() {}, remove() {} } });
g2.start({ mode: 'versus', teams: [['du'], ['stack']], stage: 'treino-dojo', cpu: [true, true], roundsToWin: 1, timer: 99 });
JSON.stringify(AudioSys._calls);
`, ctx2);
check("sem cfg.music cai no padrao 'battle'", JSON.parse(r2b).includes('battle') && !JSON.parse(r2b).includes('boss'), r2b);

// ===== 4. escada do torneio: 6 mais fortes/insuportaveis, ordem crescente, chefe IALES =====
const r3 = vm.runInContext(`
const me = 'du';
const score = (d) => {
  const s = d.stats || {};
  let sc = (s.power || 1) * 2 + (s.speed || 1) + (s.meterRate || 1) + (s.hp || 100) / 200;
  const sp = (d.special && d.special.type) || '';
  if (/projectile|cycle|multi|beam|summon|aoe/i.test(sp)) sc += 1.1;
  if (/rush|buff|transform/i.test(sp)) sc += 0.5;
  const kick = (d.moves && d.moves.kick) || {};
  if ((kick.range || 0) >= 70) sc += 0.4;
  return sc;
};
const rivais = FIGHTERS.filter((d) => d.id !== me && !d.secret).map((d) => ({ id: d.id, sc: score(d) })).sort((a, b) => b.sc - a.sc).slice(0, 6).map((r) => r.id).reverse();
const boss = Profile.isUnlocked('iales') ? 'iales' : 'fullstack';
const ladder = [...rivais.filter((id) => id !== boss), boss];
const scores = ladder.map((id) => score(FIGHTERS.find((d) => d.id === id)));
JSON.stringify({ ladder, scores, noSecret: ladder.slice(0, 6).every((id) => !FIGHTERS.find((d) => d.id === id).secret), uniq: new Set(ladder).size === ladder.length, cresc: scores.every((v, i) => i === 0 || v >= scores[i - 1]) });
`, ctx2);
const arc = JSON.parse(r3);
check('escada tem 7 luttas: 6 rivais + chefe IALES no fim', arc.ladder.length === 7 && arc.ladder[6] === 'iales', arc.ladder.join(','));
check('6 rivais sem lutadores secretos (o chefe IALES pode ser secreto) e sem duplicar', arc.noSecret && arc.uniq);
check('dificuldade CRESCENTE (scores nao decrescem ate o chefe)', arc.cresc, arc.scores.map((s) => s.toFixed(1)).join('<= '));

// ===== 5. codigo do modo: rounds rapidos e chefe com musica boss =====
const uiSrc = fs.readFileSync('js/ui/ui.js', 'utf8');
check("ui.js: torneio rapido (1 round/99s) e chefe (2 rounds/180s, difficulty 3)", /roundsToWin: isBoss \? 2 : 1/.test(uiSrc) && /timer: isBoss \? 180 : 99/.test(uiSrc) && /difficulty: isBoss \? 3/.test(uiSrc));
check("ui.js: chefe entra com music 'boss'", /music: isBoss \? 'boss' : 'battle'/.test(uiSrc));
check('ui.js: escada pega os 6 mais fortes por score (slice(0, 6))', /slice\(0, 6\)/.test(uiSrc) && /projectile\|cycle\|multi/.test(uiSrc));
const html = fs.readFileSync('index.html', 'utf8');
check('menu tem botao TORNEIO ATÉ O CHEFE', /TORNEIO ATÉ O CHEFE/.test(html));

// ===== 6. tela inicial animada + responsividade =====
check('tela inicial tem camada title-fx (estrelas/scan)', /class="title-fx"/.test(html));
const css = fs.readFileSync('css/style.css', 'utf8');
check('logo flutua e brilha (logoFloat + logoGlow)', /@keyframes logoFloat/.test(css) && /@keyframes logoGlow/.test(css) && /logoFloat 3\.4s/.test(css));
check('ceu com estrelas piscando e faixa de luz (stars + scan)', /@keyframes stars/.test(css) && /@keyframes scan/.test(css));
{ /* reduzir animacoes: tira o MOVIMENTO (logo pulando/zoom, grade andando, faixa varrendo) e mantem so brilho/opacidade */
  const m = css.match(/body\.reduced #scr-title \.logo \{ animation: ([^;]+); \}/);
  check('animacoes da tela inicial respeitam reduced motion (sem movimento, so brilho)', !!m && !/logoFloat|logoIn/.test(m[1]) && /body\.reduced \.title-fx::before \{ animation: none/.test(css) && /body\.reduced \.title-bg::before \{ animation: none/.test(css), m ? m[1] : 'sem regra');
}
const vp = fs.readFileSync('js/ui/viewport.js', 'utf8');
check('viewport: fullscreenchange + ResizeObserver + visualViewport', /fullscreenchange/.test(vp) && /ResizeObserver/.test(vp) && /visualViewport/.test(vp));
check('css: sem pull-to-refresh (overscroll-behavior none)', /overscroll-behavior: none/.test(css));

console.log('---');
console.log(fails === 0 ? 'BOSS MODE/TELA/RESPONSIVIDADE: TUDO OK (' + n + ' checks)' : 'BOSS MODE: ' + fails + ' FALHAS de ' + n);
process.exit(fails ? 1 : 0);
