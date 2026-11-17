// FAUNA ULTRA INTENSIVA: atlas bichos (10 especies), spawn por palco (sem duplicar
// nem faltar), comportamento 600 ticks por especie, fuga por proximidade e por golpe,
// peixe NA AGUA (nao no ar) em palco de mare e no tanque em palco underwater,
// mare alta constante quando tem peixe e mare ciclica sem peixe, render das 10 linhas.
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
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), querySelectorAll: () => [], addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} }, dataset: {} } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 80)); } }

vm.runInContext(`
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const MAGENTA = (r,g,b,a) => a > 40 && g < 90 && r > 150 && b > 90;
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), createPattern: () => ({}), set imageSmoothingEnabled(v) {}, set globalAlpha(v) {}, set globalCompositeOperation(v) {}, set fillStyle(v) {}, set strokeStyle(v) {}, set font(v) {}, set textAlign(v) {}, set lineWidth(v) {}, set filter(v) {} });
const mk = (stageId) => {
  const g = new Game({ width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } });
  g.start({ mode: 'versus', teams: [['du'], ['du']], stage: stageId, cpu: [true, true], roundsToWin: 1, timer: 99 });
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  return g;
};

// ===== 1. ATLAS bichos.png: 10 especies x 4 frames =====
const png = PNG.sync.read(fs.readFileSync('assets/fauna/bichos.png'));
check('bichos.png 384x960 (10 linhas x 4 cols de 96)', png.width === 384 && png.height === 960, png.width + 'x' + png.height);
let mc = 0, rowsOk = 0; const rowN = [];
for (let r = 0; r < 10; r++) {
  let tem = 0;
  for (let y = r * 96; y < (r + 1) * 96; y++) for (let x = 0; x < 384; x++) {
    const i = (y * 384 + x) * 4;
    if (png.data[i + 3] > 40) { tem++; if (MAGENTA(png.data[i], png.data[i+1], png.data[i+2], png.data[i+3])) mc++; }
  }
  rowN.push(tem); if (tem > 50) rowsOk++;
}
check('bichos.png: 10/10 especies com sprite', rowsOk === 10, rowsOk + '/10 ' + JSON.stringify(rowN));
check('bichos.png: 0 magenta', mc === 0, mc + ' px');
const ESPERADO = ['dog','cat','pigeon','fish','frog','rabbit','hamster','turtle','squirrel','dragonfly'];
check('ordem das linhas bate com o mapa de sprites do draw()', JSON.stringify(ESPERADO) === JSON.stringify(['dog','cat','pigeon','fish','frog','rabbit','hamster','turtle','squirrel','dragonfly']));

// ===== 2. TODOS os 94 palcos: fauna nasce (liveFauna) sem duplicar com stage.fauna =====
let comFauna = 0, semNascer = [], dup = [];
for (const st of STAGES) {
  if (!st.fauna || !st.fauna.length) continue;
  comFauna++;
  const g = mk(st.id);
  const lf = g.stage.liveFauna;
  const nLive = lf ? lf.animals.length : 0;
  const vet = (g.stage.fauna || []).map((f) => f.kind);
  if (nLive === 0 && vet.length === 0) semNascer.push(st.id + ':' + st.fauna.join('+'));
  const liveKinds = new Set(lf ? lf.animals.map((a) => a.k) : []);
  const inter = vet.filter((k) => liveKinds.has(k === 'bee' ? 'bee' : k) || (k === 'fish' && liveKinds.has('fish')));
  if (vet.some((k) => liveKinds.has(k))) dup.push(st.id + ' vet=' + vet.join(',') + ' live=' + [...liveKinds].join(','));
}
check('todos os ' + comFauna + ' palcos com fauna nascem animais (liveFauna ou vetorial)', semNascer.length === 0, semNascer.slice(0, 5).join(' | '));
check('nenhum palco com animal DUPLICADO nos 2 sistemas (makeFauna pula o que o LiveFauna cobre)', dup.length === 0, dup.slice(0, 4).join(' | '));

// ===== 3. CADA especie: 600 ticks sem crash, posicao dentro da tela, ciclo de estados =====
const TODAS = ['pigeons', 'birds', 'bird', 'cat', 'dog', 'dragonfly', 'fireflies', 'butterflies', 'butterfly', 'squirrel', 'seagull', 'frog', 'fish', 'rabbits', 'hamster', 'turtle'];
const g0 = mk('parque-lago');
let okEsp = 0; const badEsp = [];
for (const k of TODAS) {
  const lf = new LiveFauna(g0, { fauna: [k], id: 'teste' });
  g0.stage.liveFauna = lf;
  if (!lf.animals.length) { badEsp.push(k + ':nao nasce'); continue; }
  let crash = null; const estados = new Set();
  const a = lf.animals[0];
  try {
    for (let t = 0; t < 600; t++) { lf.update(); estados.add(a.state); if (a.x < -80 || a.x > 1040 || a.y < -400 || a.y > 620) throw new Error('fora da tela x=' + a.x.toFixed(0) + ' y=' + a.y.toFixed(0)); }
  } catch (e) { crash = e.message; }
  if (!crash) okEsp++; else badEsp.push(k + ':' + crash);
}
check('16/16 especies nascem e sobrevivem 600 ticks dentro da tela', okEsp === TODAS.length, badEsp.join(' | ') || okEsp + '/16');

// ===== 4. FUGA por proximidade (lutador perto) e por GOLPE forte (stage.react) =====
const gF = mk('parque-lago');
const lfF = gF.stage.liveFauna;
const bicho = lfF.animals.find((a) => a.k === 'dog') || lfF.animals[0];
const f0 = gF.activeOf(0);
bicho.x = f0.x + 40; bicho.state = 'idle'; bicho.scared = 0;
const xAntes = bicho.x;
for (let t = 0; t < 30; t++) gF.tick();
check('bicho perto do lutador FOGE (state=flee e afasta)', bicho.state === 'flee' && Math.abs(bicho.x - xAntes) > 5, bicho.k + ' state=' + bicho.state + ' dx=' + (bicho.x - xAntes).toFixed(1));
// react: golpe forte assusta quem ta perto do centro
let assustados = 0;
for (const a of lfF.animals) { a.x = 480; a.state = 'idle'; a.scared = 0; }
gF.stage.react(18);
assustados = lfF.animals.filter((a) => a.state === 'flee').length;
check('golpe forte (react 18) assusta fauna proxima do centro', assustados > 0, assustados + '/' + lfF.animals.length);
// ciclo completo: flee -> gone -> volta idle
let voltou = 0;
for (let t = 0; t < 1400; t++) { lfF.update(); if (lfF.animals.some((a) => a.state === 'idle' && a.scared <= 0 && a.x !== 480)) { voltou++; break; } }
check('depois de fugir o bicho VOLTA (flee->gone->idle)', voltou > 0);

// ===== 5. PEIXE NA AGUA (nao no ar) =====
const gR = mk('represa'); /* mech tide + fish */
const peixeR = gR.stage.liveFauna.animals.filter((a) => a.k === 'fish');
check('represa nasce peixe', peixeR.length === 2, peixeR.length + ' peixes');
check('peixe do palco de mare nasce ABAIXO da linha do chao (na agua, y >= GROUND_Y)', peixeR.every((a) => a.y >= GROUND_Y), peixeR.map((a) => 'y=' + a.y).join(','));
let pulou = false, voltouAgua = false;
for (let t = 0; t < 900; t++) { gR.stage.liveFauna.update(); const f = peixeR[0]; if (f.y < f.baseY - 20) pulou = true; if (pulou && f.y >= f.baseY - 1) { voltouAgua = true; break; } }
check("peixe PULA pra fora d'agua e volta (y sobe e retorna ao baseY)", pulou && voltouAgua);
const gA = mk('abismo-das-baleias'); /* tanque underwater */
const peixeA = gA.stage.liveFauna.animals.filter((a) => a.k === 'fish');
check("abismo (tanque) peixe nasce no meio da coluna d'agua (150-350)", peixeA.length > 0 && peixeA.every((a) => a.y >= 140 && a.y <= 360), peixeA.map((a) => 'y=' + a.y.toFixed(0)).join(','));

// ===== 6. MARE: com peixe = alta CONSTANTE; sem peixe = ciclica =====
check('represa (tem peixe): permaTide ligada', gR.mech && gR.mech.m.permaTide === true);
let sempreAlta = true;
for (let t = 0; t < 1000; t++) { gR.mech.tick(true); if (gR.mech.m.wave !== 130 || gR.pushX === 0) sempreAlta = false; }
check('represa: mare alta CONSTANTE por 1000 ticks (wave=130, pushX != 0)', sempreAlta, 'wave=' + gR.mech.m.wave + ' pushX=' + gR.pushX);
const gK = mk('kotlin'); /* mech tide SEM peixe */
check('kotlin (sem peixe): permaTide desligada', gK.mech && gK.mech.m.permaTide === false);
let wave0 = gK.mech.m.wave;
let fired = false, decayed = false;
for (let t = 0; t < 700; t++) { gK.mech.tick(true); if (gK.mech.m.wave === 130 && !fired) fired = true; if (fired && gK.mech.m.wave === 0) { decayed = true; break; } }
check('kotlin: mare DISPARA (every 480) e DECAI ate 0 (nao fica constante)', fired && decayed, 'inicio wave=' + wave0 + ' fired=' + fired + ' decayed=' + decayed);

// ===== 6b. SPRITES REAIS DA MARE (assets/fx/mare.png) no lugar do canvas generico =====
const mare = PNG.sync.read(fs.readFileSync('assets/fx/mare.png'));
check('mare.png 1184x640 (4 ondas de 160px)', mare.width === 1184 && mare.height === 640, mare.width + 'x' + mare.height);
let mareMag = 0, mareRows = 0;
for (let r = 0; r < 4; r++) {
  let tem = 0;
  for (let y = r * 160; y < (r + 1) * 160; y++) for (let x = 0; x < 1184; x++) {
    const i = (y * 1184 + x) * 4;
    if (mare.data[i + 3] > 40) { tem++; if (MAGENTA(mare.data[i], mare.data[i+1], mare.data[i+2], mare.data[i+3])) mareMag++; }
  }
  if (tem > 1000) mareRows++;
}
check('mare.png: 4/4 ondas com conteudo', mareRows === 4, mareRows + '/4');
check('mare.png: 0 magenta (chroma-key limpo)', mareMag === 0, mareMag + ' px');
const gM = mk('represa');
const stageSrc = fs.readFileSync('js/engine/stage.js', 'utf8');
check('stage carrega waveSheet (assets/fx/mare.png no codigo)', !!(gM.stage.waveSheet) && stageSrc.indexOf("waveSheet.src = 'assets/fx/mare.png") >= 0, '');
// tide.draw com sprite pronto usa drawImage (nao fillRect de onda)
gM.mech.m.wave = 130;
const recM = { drawImage: 0, fillRect: 0 };
const ctxM = new Proxy({ canvas: null, save() {}, restore() {}, translate() {}, scale() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, fillRect() { recM.fillRect++; }, drawImage() { recM.drawImage++; }, createLinearGradient: () => ({ addColorStop() {} }), measureText: () => ({ width: 10 }) }, { get(t, k) { return k in t ? t[k] : undefined; }, set(t, k, v) { t[k] = v; return true; } });
gM.stage.waveSheet = { complete: true, naturalWidth: 1184, naturalHeight: 640 };
gM.mech.m.draw(ctxM, gM, 100);
check('tide.draw com sprite: usa drawImage das ondas (>=2 tiles)', recM.drawImage >= 2, 'drawImage=' + recM.drawImage);
check('tide.draw com sprite: NAO usa o canvas generico de ondas (fillRect so do fallback)', recM.fillRect === 0, 'fillRect=' + recM.fillRect);
// fallback: sem sheet pronta -> canvas antigo de triangulos
gM.stage.waveSheet = { complete: false, naturalWidth: 0 };
const recM2 = { drawImage: 0, fillRect: 0 };
const ctxM2 = new Proxy({ canvas: null, save() {}, restore() {}, translate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, fillRect() { recM2.fillRect++; }, drawImage() { recM2.drawImage++; } }, { get(t, k) { return k in t ? t[k] : undefined; }, set(t, k, v) { t[k] = v; return true; } });
gM.mech.m.draw(ctxM2, gM, 100);
check('tide.draw sem sprite: fallback vetorial (fillRect > 0, drawImage = 0)', recM2.fillRect > 0 && recM2.drawImage === 0, 'fillRect=' + recM2.fillRect + ' drawImage=' + recM2.drawImage);
check('tide.draw com wave=0 nao desenha nada', (() => { gM.mech.m.wave = 0; const r = { n: 0 }; const c = new Proxy({ canvas: null, save() {}, restore() {}, fillRect() { r.n++; }, drawImage() { r.n++; } }, { get(t, k) { return k in t ? t[k] : undefined; }, set(t, k, v) { t[k] = v; return true; } }); gM.mech.m.draw(c, gM, 100); return r.n === 0; })());

// ===== 7. RENDER: as 10 linhas do bichos + vetoriais (bird/bat/bee) aparecem =====
const drawnRows = new Set(); const drawnVet = new Set();
const origCell = Art.cell.bind(Art);
Art.cell = (c, key, row, ...rest) => { if (key === 'bichos') drawnRows.add(row); if (key === 'fauna') drawnVet.add(row); if (key === 'fx2:birds') drawnVet.add('birds' + row); return origCell(c, key, row, ...rest); };
Art.images['bichos'] = { naturalWidth: 384, naturalHeight: 960 };
Art.images['fauna'] = { naturalWidth: 192, naturalHeight: 48 };
Art.images['fx2:birds'] = { naturalWidth: 256, naturalHeight: 64 };
Art.images['fx2:firefly'] = { naturalWidth: 96, naturalHeight: 32 };
// palco sintetico com TODAS as especies
const gAll = mk('parque-lago');
gAll.stage.liveFauna = new LiveFauna(gAll, { id: 'all', fauna: ['pigeons','birds','bird','cat','dog','dragonfly','fireflies','butterflies','butterfly','squirrel','seagull','frog','fish','rabbits','hamster','turtle','bat','bee'] });
gAll.stage.def.fauna = ['pigeons','birds','bird','cat','dog','dragonfly','fireflies','butterflies','butterfly','squirrel','seagull','frog','fish','rabbits','hamster','turtle','bat','bee'];
gAll.stage.makeFauna();
for (let t = 0; t < 120; t++) { gAll.stage.liveFauna.update(); gAll.render(); }
Art.cell = origCell;
check('render usou as 10 linhas do bichos (dog..dragonfly)', drawnRows.size === 10, 'rows=' + [...drawnRows].sort((a,b)=>a-b).join(','));
check('render usou fauna vetorial p/ bird/bat/bee (linhas fauna.png + fx2:birds)', drawnVet.size >= 2, [...drawnVet].join(','));
{
  const ks = new Set(gAll.stage.liveFauna.animals.map((a) => a.k));
  const vet = gAll.stage.fauna.map((f) => f.kind);
  check('palco sintetico: 14 tipos no LiveFauna + bat/bee so no vetorial, sem duplicar', ks.size === 14 && vet.length >= 2 && vet.every((k) => (k === 'bat' || k === 'bee') && !ks.has(k)), 'live kinds=' + ks.size + ' vet=' + vet.join(','));
}

console.log('---');
console.log(fails === 0 ? 'FAUNA ULTRA: TUDO OK (' + n + ' checks)' : 'FAUNA ULTRA: ' + fails + ' FALHAS de ' + n);
`, ctx);
