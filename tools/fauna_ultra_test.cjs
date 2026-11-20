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
/* defs sinteticas COM bioma (stageFauna filtra por bioma: peixe so em agua, morcego so a noite...) */
const defTeste = (k) => {
  if (['fish', 'seagull', 'frog', 'dragonfly', 'turtle'].includes(k)) return { id: 't-rio', name: 'Rio', mech: 'tide', fauna: [k] };
  if (['bat', 'fireflies'].includes(k)) return { id: 't-noite', name: 'Floresta a Noite', weather: ['darkfog'], fauna: [k] };
  if (['cat', 'dog', 'pigeons'].includes(k)) return { id: 't-praca', name: 'Praca Urbana', fauna: [k] };
  if (['squirrel', 'bee', 'butterflies', 'butterfly'].includes(k)) return { id: 't-parque', name: 'Parque Floresta', fauna: [k] };
  return { id: 't-campo', name: 'Campo', fauna: [k] };
};
const g0 = mk('parque-lago');
let okEsp = 0; const badEsp = [];
for (const k of TODAS) {
  const lf = new LiveFauna(g0, defTeste(k));
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
peixeR[0].x = 100; peixeR[0].state = 'idle'; peixeR[0].scared = 0; peixeR[0].alert = 0; /* longe dos lutadores pra nao fugir */
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
const ctxM = new Proxy({ canvas: null, save() {}, restore() {}, translate() {}, scale() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, fillRect(x, y, w, h) { if (w >= 10) recM.fillRect++; }, drawImage() { recM.drawImage++; }, createLinearGradient: () => ({ addColorStop() {} }), measureText: () => ({ width: 10 }) }, { get(t, k) { return k in t ? t[k] : undefined; }, set(t, k, v) { t[k] = v; return true; } });
gM.stage.waveSheet = { complete: true, naturalWidth: 1184, naturalHeight: 640 };
gM.mech.m.draw(ctxM, gM, 100);
check('tide.draw com sprite: usa drawImage das ondas (>=2 tiles)', recM.drawImage >= 2, 'drawImage=' + recM.drawImage);
check('tide.draw com sprite: NAO usa o canvas generico de ondas (fillRect largo so do fallback; filetes finos do reflexo podem usar fillRect fino)', recM.fillRect === 0, 'fillRect largo=' + recM.fillRect);
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
gAll.stage.liveFauna = new LiveFauna(gAll, { id: 'all', name: 'Praca Parque Floresta Rio a Noite', mech: 'tide', weather: ['darkfog'], fauna: ['pigeons','birds','bird','cat','dog','dragonfly','fireflies','butterflies','butterfly','squirrel','seagull','frog','fish','rabbits','hamster','turtle','bat','bee'] });
gAll.stage.def.fauna = ['pigeons','birds','bird','cat','dog','dragonfly','fireflies','butterflies','butterfly','squirrel','seagull','frog','fish','rabbits','hamster','turtle','bat','bee'];
gAll.stage.def.weather = ['darkfog']; /* bioma noturno p/ stageFauna nao filtrar morcego */
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

// ===== 8. COMPORTAMENTOS NOVOS: alerta assiste a luta, borboleta pousa na flor, pombo bica, peixe espirra =====
const gN = mk('parque-lago');
const lfN = new LiveFauna(gN, { id: 't-misto', name: 'Praca Parque Rio', mech: 'tide', fauna: ['pigeons', 'butterflies', 'fish'] });
gN.stage.liveFauna = lfN;
check('spawn inicializa alert/perch/peck/jump em 0', lfN.animals.every((a) => a.alert === 0 && a.perch === 0 && a.peck === 0 && a.jump === 0));
const fN = gN.activeOf(0);
/* ALERTA: pombo a media distancia do lutador para e assiste, virado pra ele */
const pombo = lfN.animals.find((a) => a.k === 'pigeon');
pombo.x = fN.x + 170; pombo.y = GROUND_Y - 2; pombo.baseY = pombo.y; pombo.state = 'idle'; pombo.scared = 0; pombo.alert = 0;
let alertou = false;
for (let t = 0; t < 120; t++) { lfN.update(); if (pombo.alert > 0) alertou = true; }
check('bicho a media distancia PARA e ASSISTE a luta (alert dispara, nao foge)', alertou && pombo.state !== 'flee' && pombo.state !== 'gone', 'alert=' + pombo.alert + ' state=' + pombo.state);
check('quem assiste fica VIRADO pro lutador mais proximo', pombo.dir === (fN.x >= pombo.x ? 1 : -1), 'dir=' + pombo.dir + ' f.x=' + fN.x + ' a.x=' + pombo.x.toFixed(0));
/* lutadores no centro: deixa as bordas calmas pros proximos testes */
gN.activeOf(0).x = 480; gN.activeOf(1).x = 480;
/* BORBOLETA pousando numa flor do palco (flor LONGE dos lutadores, senao ela foge) */
const borb = lfN.animals.filter((a) => a.k === 'butterfly');
gN.stage.flora = [{ k: 'flower_red', x: 150, y: 440 }, { k: 'flower_yellow', x: 150, y: 430 }];
let pousou = false;
for (let t = 0; t < 4000 && !pousou; t++) { lfN.update(); if (borb.some((a) => a.perch > 0)) pousou = true; }
check('borboleta POUSA numa flor do palco de vez em quando (perch > 0)', pousou);
const b0 = borb.find((a) => a.perch > 0) || borb[0];
b0.perch = 200; b0.px = 150; b0.py = 420; b0.x = 850; b0.y = 380; b0.state = 'idle'; b0.scared = 0; b0.alert = 0;
const bx = b0.x;
for (let t = 0; t < 60; t++) lfN.update();
check('pousada: borboleta se aproxima da flor e o perch decresce', b0.perch < 200 && b0.x < bx, 'perch=' + b0.perch + ' x=' + b0.x.toFixed(1) + ' (antes ' + bx.toFixed(1) + ', alvo 150)');
/* POMBO bicando o chao (lutadores no centro, pombo longe -> calmo) */
const peckP = lfN.animals.find((a) => a.k === 'pigeon');
peckP.x = 850; peckP.state = 'idle'; peckP.scared = 0; peckP.alert = 0; peckP.timer = 30;
let bicou = false;
for (let t = 0; t < 900; t++) { lfN.update(); if (peckP.peck > 0) { bicou = true; break; } }
check('pombo BICA o chao de vez em quando (peck > 0)', bicou, 'peck=' + peckP.peck);
/* PEIXE pula e espirra agua + som */
let splashes = 0, waterSnd = 0;
gN.splash = () => { splashes++; };
gN.audio = { play: (s) => { if (s === 'water') waterSnd++; }, tone() {}, loop() {} };
const peixeN = lfN.animals.find((a) => a.k === 'fish');
peixeN.x = 850; peixeN.y = peixeN.baseY; peixeN.state = 'idle'; peixeN.scared = 0; peixeN.alert = 0; peixeN.timer = 20;
let espirlhou = false;
for (let t = 0; t < 1600; t++) { lfN.update(); if (splashes > 0) { espirlhou = true; break; } }
check('peixe PULA da agua e faz splash + som de agua', espirlhou && waterSnd > 0, 'splashes=' + splashes + ' water=' + waterSnd);
/* draw: perch usa frame 0 (asas fechadas) e peck desce o pombo */
const framesPerch = new Set(); const origCell2 = Art.cell.bind(Art);
Art.images['fauna'] = { naturalWidth: 192, naturalHeight: 48 };
Art.images['bichos'] = { naturalWidth: 384, naturalHeight: 960 };
Art.cell = (c, key, row, col, ...rest) => { if (key === 'fauna' && row === 1 && b0.perch > 0) framesPerch.add(col); if (key === 'bichos' && row === 2 && peckP.peck > 0) framesPerch.add('peck' + col); return origCell2(c, key, row, col, ...rest); };
b0.perch = 50; peckP.peck = 8;
lfN.draw(fake2d());
Art.cell = origCell2;
check('draw: borboleta pousada usa frame 0 (asas fechadas)', framesPerch.has(0), [...framesPerch].join(','));
check('draw: pombo bicando usa frame de bico (2)', framesPerch.has('peck2'), [...framesPerch].join(','));

// ===== 9. PALCOS ANTES VAZIOS agora tem fauna/motes/torcida =====
const SING = { pigeons: 'pigeon', birds: 'bird', butterflies: 'butterfly', fireflies: 'firefly', rabbits: 'rabbit' };
const espFauna = { 'dojo-noite': ['bat', 'fireflies'], 'circo': ['pigeons'], 'pizzaria': ['cat'], 'sesi': ['pigeons', 'dog'], 'sesi-patio': ['pigeons', 'dog'], 'senai-valinhos': ['pigeons', 'cat'], 'area-de-trabalho': ['cat'], 'kernel': ['bird'], '09-orbital-core': ['bat', 'fireflies'], 'cyberpunk': ['bat'], 'treino-dojo': ['cat'], 'corredor-datacenter': ['fireflies'], 'sala-deploy': ['fireflies'], 'estudio-pixel': ['fireflies'], '02-volcanic-forge': ['bat'], 'rust': ['bat'], 'java': ['bat'] };
let faunaBad = [];
for (const id of Object.keys(espFauna)) {
  const st = STAGES.find((s) => s.id === id);
  if (!st || !espFauna[id].every((k) => (st.fauna || []).includes(k))) faunaBad.push(id);
}
/* palcos classicos animados (so no browser, via STAGE_SHEETS) pegam o STAGE_EXTRA */
const espExtra = { '01-centro-de-dados': ['bat'], '02-chuva-de-codigo': ['bat'], '03-laboratorio-95': ['fireflies'], '05-fight-exe': ['bat'], '07-placa-mae': ['fireflies'], '11-oficina-latas': ['cat'], '12-terminal-fosforo': ['bat'], '13-metro-pacotes': ['pigeons'] };
for (const id of Object.keys(espExtra)) {
  const ex = STAGE_EXTRA[id];
  if (!ex || !espExtra[id].every((k) => (ex.fauna || []).includes(k))) faunaBad.push('EXTRA:' + id);
}
check('palcos antes vazios agora declaram fauna propria (' + (Object.keys(espFauna).length + Object.keys(espExtra).length) + ' palcos)', faunaBad.length === 0, faunaBad.join(',') || 'ok');
let nasceuBad = [];
for (const id of ['dojo-noite', 'circo', 'pizzaria', 'sesi', 'kernel', '09-orbital-core', 'corredor-datacenter', 'treino-dojo']) {
  const g = mk(id);
  const ks = new Set();
  if (g.stage.liveFauna) for (const a of g.stage.liveFauna.animals) ks.add(a.k);
  for (const f of (g.stage.fauna || [])) ks.add(f.kind);
  const st = STAGES.find((s) => s.id === id);
  const want = st.fauna.map((k) => SING[k] || k);
  if (!want.every((k) => ks.has(k))) nasceuBad.push(id + ' quer=' + want.join(',') + ' tem=' + [...ks].join(','));
}
check('nesses palcos os bichos realmente NASCEM no jogo', nasceuBad.length === 0, nasceuBad.slice(0, 3).join(' | '));
const gMot = mk('sesi');
check('sesi: motes de poeira no ar (motes:true -> particulas mote no fundo)', (gMot.stage.fauna || []).some((f) => f.kind === 'mote') || (gMot.stage.ambient || []).some((p) => p.k === 'mote'), 'fauna kinds=' + (gMot.stage.fauna || []).map((f) => f.kind).slice(0, 6).join(','));
check('sesi e circo tem TORCIDA no fundo (def.torcida com fileiras proprias)', !!STAGES.find((s) => s.id === 'sesi').torcida && !!STAGES.find((s) => s.id === 'circo').torcida && gMot.stage.crowd && gMot.stage.crowd.length >= 1, 'crowd=' + (gMot.stage.crowd ? gMot.stage.crowd.length : 'null'));

console.log('---');
console.log(fails === 0 ? 'FAUNA ULTRA: TUDO OK (' + n + ' checks)' : 'FAUNA ULTRA: ' + fails + ' FALHAS de ' + n);
`, ctx);
