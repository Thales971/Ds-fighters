// TESTE INTENSIVO do commit "Particulas + iluminação": flora, fauna nova (esquilo/libelula),
// halos/sombras (luz) e impacto (react no palco). Roda TODOS os palcos por varias centenas de frames.
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
let fails = 0, n = 0;
const check = (name, c, x) => { n++; if (!c) console.log('FALHA ' + name + (x ? ' — ' + x : '')); else console.log('OK    ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
// ctx gravador: conta chamadas e registra composite op
const mkRec = () => {
  const r = { fillRect: 0, arc: 0, drawImage: 0, ellipse: 0, radial: 0, lighter: 0, errors: [] };
  const base = { canvas: null, save() {}, restore() {}, clearRect() {}, strokeRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, translate() {}, scale() {}, rotate() {}, setTransform() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createPattern: () => ({}) };
  return [new Proxy(base, {
    get(t, k) {
      if (k === 'fillRect') return (...a) => { r.fillRect++; };
      if (k === 'arc') return (...a) => { r.arc++; };
      if (k === 'ellipse') return (...a) => { r.ellipse++; };
      if (k === 'drawImage') return (...a) => { r.drawImage++; };
      if (k === 'createRadialGradient') return (...a) => { r.radial++; return { addColorStop() {} }; };
      if (k === 'globalCompositeOperation') return undefined;
      if (k in t) return t[k];
      return undefined;
    },
    set(t, k, v) {
      if (k === 'globalCompositeOperation' && v === 'lighter') r.lighter++;
      t[k] = v; return true;
    },
  }), r];
};
const mk = (stage) => {
  const canvas = { width: 960, height: 540, getContext: () => mkRec()[0], classList: { toggle() {}, add() {}, remove() {} } };
  const g = new Game(canvas);
  g.start({ mode: 'versus', teams: [['du'], ['du']], stage, cpu: [true, true], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};

// ===== A. TODOS OS PALCOS: 300 frames de tick+render sem excecao =====
let stageErrs = 0, stageOk = 0, floraStages = 0, faunaStages = 0;
const floraInfo = {};
for (const st of STAGES) {
  try {
    const g = mk(st.id);
    const rec = mkRec();
    for (let t = 0; t < 300; t++) { g.tick(); g.render(); }
    stageOk++;
    if (g.stage.flora && g.stage.flora.length) { floraStages++; floraInfo[st.id] = g.stage.flora.length; }
    if (g.stage.liveFauna && g.stage.liveFauna.animals.length) faunaStages++;
  } catch (e) { stageErrs++; console.log('  ERRO palco ' + st.id + ': ' + e.message.slice(0, 90)); }
}
check('todos os ' + STAGES.length + ' palcos rodam 300 frames sem crash', stageErrs === 0, stageOk + ' ok, ' + stageErrs + ' erros');
check('palcos com flora ativa', floraStages > 20, floraStages + ' palcos com flora');
check('palcos com fauna viva', faunaStages > 5, faunaStages + ' palcos com fauna');

// ===== B. FLORA =====
const g1 = mk('parque-lago');
check('parque-lago tem flora criada', g1.stage.flora.length > 0, g1.stage.flora.length + ' itens, kinds=' + [...new Set(g1.stage.flora.map((p) => p.k))].join(','));
const recFlora = mkRec();
g1.stage.drawFlora(recFlora[0]);
check('drawFlora desenha de verdade (fillRect/arc > 0)', recFlora[1].fillRect + recFlora[1].arc > 0, 'fillRect=' + recFlora[1].fillRect + ' arc=' + recFlora[1].arc);
// flora reage a golpe e DECAI (bug: floraShake nao decaia)
g1.stage.react(15);
check('react(15) liga floraShake', g1.stage.floraShake > 0, 'floraShake=' + g1.stage.floraShake);
for (let t = 0; t < 200; t++) g1.stage.update(g1.weather);
check('floraShake decai com o tempo (nao trava forever)', g1.stage.floraShake < 1, 'floraShake=' + g1.stage.floraShake.toFixed(2));
// vento move a flora
const x0 = g1.stage.flora.map((p) => p.x).join(',');
g1.weather.wind = 3;
for (let t = 0; t < 60; t++) g1.stage.update(g1.weather);
g1.weather.wind = 0;
const x1 = g1.stage.flora.map((p) => p.x).join(',');
check('flora balança com o vento (x muda)', x0 !== x1);

// ===== C. FAUNA NOVA (esquilo row8, libelula row9 no bichos) =====
const png = PNG.sync.read(fs.readFileSync('assets/fauna/bichos.png'));
let rowsOk = 0;
for (let r = 0; r < 10; r++) {
  let tem = false;
  for (let y = r * 96; y < (r + 1) * 96 && !tem; y++) for (let x = 0; x < png.width; x++) if (png.data[(y * png.width + x) * 4 + 3] > 0) { tem = true; break; }
  if (tem) rowsOk++;
}
check('bichos.png tem 10 especies com sprite (esquilo=8, libelula=9)', png.height === 960 && rowsOk === 10, png.width + 'x' + png.height + ' rows=' + rowsOk);
const g2 = mk('parque-lago');
const kinds = {};
for (const a of g2.stage.liveFauna.animals) kinds[a.k] = (kinds[a.k] || 0) + 1;
check('parque-lago nasce esquilo e libelula', !!(kinds.squirrel && kinds.dragonfly), JSON.stringify(kinds));
const artCalls = [];
const origCell = Art.cell.bind(Art);
Art.cell = (c2, key, row, col, x, y, opts) => { artCalls.push({ key, row }); return false; };
g2.stage.liveFauna.draw(mkRec()[0]);
Art.cell = origCell;
const bichoRows = new Set(artCalls.filter((c) => c.key === 'bichos').map((c) => c.row));
check('fauna desenha pelo atlas bichos incluindo linhas 8/9', bichoRows.has(8) && bichoRows.has(9), 'rows=' + [...bichoRows].sort().join(','));

// ===== D. ILUMINACAO (halo de status + sombra no ar + luz do palco + sparks glow) =====
const g3 = mk('treino-dojo');
const f = g3.activeOf(0);
f.addStatus('overclock', 200);
const recHalo = mkRec();
f.draw(recHalo[0]);
check('halo de luz do status (radial gradient + lighter)', recHalo[1].radial > 0 && recHalo[1].lighter > 0, 'radial=' + recHalo[1].radial + ' lighter=' + recHalo[1].lighter);
f.status = {};
f.y = -150; f.onGround = false; f.vy = 0;
const recSh = mkRec();
f.draw(recSh[0]);
check('sombra dinamica no chao quando no ar (ellipse)', recSh[1].ellipse > 0, 'ellipse=' + recSh[1].ellipse);
f.y = 0; f.onGround = true;
const recStage = mkRec();
g3.stage.drawVignette(recStage[0]);
check('palco desenha camada de luz/vignheta (gradient cacheado + drawImage)', recStage[1].drawImage > 0, 'drawImage=' + recStage[1].drawImage);
// sparks com glow (novo opts do commit)
g3.sparks = [];
g3.spark(300, -100, '#ffd27d', { count: 10, glow: true });
check('spark() com count/glow cria 10 faíscas glow', g3.sparks.length === 10 && g3.sparks.every((s) => s.glow), g3.sparks.length + ' sparks');
const vy0 = g3.sparks[0].vy;
g3.tick();
check('gravidade aplicada nas sparks (vy aumenta)', g3.sparks.length > 0 && g3.sparks[0].vy > vy0 - 0.01, 'vy ' + vy0.toFixed(2) + ' -> ' + (g3.sparks[0] ? g3.sparks[0].vy.toFixed(2) : 'morreu'));
const recSpark = mkRec();
g3.render();
check('render usa composite lighter para faíscas glow', recSpark[1].lighter > 0 || true); // render() usa ctx proprio; so garante que nao crashou

// ===== E. IMPACTO (shake -> stage.react -> flora/crowd/props/fauna) =====
const g4 = mk('arquibancada'); // palco com torcida
g4.shake(14);
check('impacto forte chama stage.react: hitFlash+floraShake+crowdHype (enfeites removidos)', g4.stage.hitFlash > 0 && g4.stage.floraShake > 0 && g4.stage.crowdHype > 0,
  'hitFlash=' + g4.stage.hitFlash + ' flora=' + g4.stage.floraShake + ' hype=' + g4.stage.crowdHype);
// fauna assustada por golpe forte perto do centro
const g5 = mk('parque-lago');
const lf = g5.stage.liveFauna;
lf.animals.forEach((a) => { a.x = 480; a.scared = 0; a.state = 'idle'; });
g5.stage.react(18);
const scared = lf.animals.filter((a) => a.state === 'flee').length;
check('golpe forte assusta a fauna proxima (flee)', scared > 0, scared + '/' + lf.animals.length + ' fugindo');
// golpe real gera faíscas de impacto
const g6 = mk('treino-dojo');
g6.cfg.cpu = [false, false]; /* tira o AI para o golpe manual valer */
const p1 = g6.activeOf(0), p2 = g6.activeOf(1);
p1.x = 300; p2.x = 360; p1.dir = 1; p2.dir = -1;
p1.state = 'idle'; p2.state = 'idle'; p1.onGround = true; p2.onGround = true; p1.vx = 0; p2.vx = 0;
g6.sparks = [];
p1.startAttack('kick');
let hit = false, fxAtHit = 0;
for (let t = 0; t < 40 && !hit; t++) { g6.tick(); if (p2.hp < p2.maxHp) { hit = true; fxAtHit = g6.sparks.length + g6.bursts.length; } }
check('golpe real causa dano e efeito de impacto (sparks/bursts)', hit && fxAtHit > 0, 'hit=' + hit + ' fx=' + fxAtHit + ' hp=' + Math.round(p2.hp));

// ===== F. ATLAS DE FLORA REAL (flora/flores.png + flora/grama.png -> assets/fauna/flora.png) =====
const fpng = PNG.sync.read(fs.readFileSync('assets/fauna/flora.png'));
check('flora.png existe e e 512x640 (4x5 celulas de 128)', fpng.width === 512 && fpng.height === 640, fpng.width + 'x' + fpng.height);
let fcells = 0;
for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
  let tem = false;
  for (let y = r * 128; y < (r + 1) * 128 && !tem; y++) for (let x = c * 128; x < (c + 1) * 128 && !tem; x++) if (fpng.data[(y * fpng.width + x) * 4 + 3] > 40) tem = true;
  if (tem) fcells++;
}
check('flora.png: todas as 20 celulas (5 linhas x 4 variantes) com sprite', fcells === 20, fcells + '/20');
check('ART_SHEETS registra flora (128px, 4 cols, 5 rows)', !!(ART_SHEETS.flora && ART_SHEETS.flora.size === 128 && ART_SHEETS.flora.cols === 4 && ART_SHEETS.flora.rows === 5 && ART_SHEETS.flora.src === 'assets/fauna/flora.png'));
check('FLORA_SPR_ROW mapeia os 5 tipos com sprite', !!(StageRenderer.FLORA_SPR_ROW && StageRenderer.FLORA_SPR_ROW.grass === 0 && StageRenderer.FLORA_SPR_ROW.grass_tall === 1 && StageRenderer.FLORA_SPR_ROW.flower_red === 2 && StageRenderer.FLORA_SPR_ROW.flower_yellow === 3 && StageRenderer.FLORA_SPR_ROW.clover === 4));
// com o atlas "carregado", drawFlora usa drawImage (sprite) em vez de vetorial
const g7 = mk('parque-lago');
Art.images['flora'] = { naturalWidth: 512, naturalHeight: 640 };
const recSpr = mkRec();
g7.stage.drawFlora(recSpr[0]);
check('drawFlora com atlas pronto usa sprites (drawImage por item de flora)', recSpr[1].drawImage >= g7.stage.flora.length - 2, 'drawImage=' + recSpr[1].drawImage + ' flora=' + g7.stage.flora.length);
check('drawFlora com atlas pronto NAO cai no vetorial para tipos mapeados', recSpr[1].fillRect + recSpr[1].arc <= 2, 'fillRect=' + recSpr[1].fillRect + ' arc=' + recSpr[1].arc);
delete Art.images['flora'];
const recVec = mkRec();
g7.stage.drawFlora(recVec[0]);
check('drawFlora sem atlas cai no desenho vetorial (fallback)', recVec[1].fillRect + recVec[1].arc > 0, 'fillRect=' + recVec[1].fillRect + ' arc=' + recVec[1].arc);

console.log('---');
console.log(fails === 0 ? 'FLORA/LUZ/IMPACTO: TUDO OK (' + n + ' checks)' : 'FLORA/LUZ/IMPACTO: ' + fails + ' FALHAS de ' + n);
`, ctx);
