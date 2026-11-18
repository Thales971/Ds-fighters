// Teste intensivo do PITOCO: sprite, desbloqueio por codigo (redeem 'pitoco'),
// sequencia de teclado P-I-T-O-C-O, silhueta na selecao de pets, guardas de
// setPet/petFor e efeito em combate (50% erra, regen 15 HP/s, sprite desenhado).
const fs = require('fs'); const vm = require('vm');
function req(name){ try { return require(name); } catch(e){ return require('/tmp/node_modules/'+name); } }
const { createCanvas } = req('canvas');
const { PNG } = req('pngjs');

// localStorage em memoria para o Profile real
const store = {};
const localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};

const ctx = { console, Math, Date, Image: class { set src(v) {} }, createCanvas, fs, PNG, localStorage, store,
  HUD: new Proxy({}, { get: () => () => {} }),
  AppViewport: { fullscreen() {} },
  Profile: undefined,
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), releaseAll() {}, hit: () => false, pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: undefined,
  Net: {}, AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), querySelectorAll: () => [], addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} }, dataset: {} }, activeElement: null },
  window: { addEventListener() {}, matchMedia: () => ({ matches: false }) }, location: { hash: '' }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/core/profile.js', 'js/ui/ui.js',
  'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 90)); } }

vm.runInContext(`
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
const MAGENTA = (r,g,b,a) => a > 40 && g < 90 && r > 150 && b > 90;

// ===== 1. SPRITE pitoco.png =====
const png = PNG.sync.read(fs.readFileSync('assets/pets/pitoco.png'));
check('pitoco.png 384x96 (4 quadros de 96)', png.width === 384 && png.height === 96, png.width + 'x' + png.height);
let mc = 0, frames = 0;
for (let f = 0; f < 4; f++) {
  let tem = false;
  for (let y = 0; y < 96; y++) for (let x = f * 96; x < (f + 1) * 96; x++) {
    const i = (y * png.width + x) * 4;
    if (png.data[i + 3] > 40) { tem = true; if (MAGENTA(png.data[i], png.data[i+1], png.data[i+2], png.data[i+3])) mc++; }
  }
  if (tem) frames++;
}
check('pitoco.png: 0 magenta', mc === 0, mc + ' px');
check('pitoco.png: 4/4 quadros com conteudo', frames === 4, frames + '/4');
check('ART_SHEETS registra pitoco (96px, 4 cols)', !!(ART_SHEETS.pitoco && ART_SHEETS.pitoco.size === 96 && ART_SHEETS.pitoco.cols === 4 && ART_SHEETS.pitoco.src === 'assets/pets/pitoco.png'));

// ===== 2. Profile real: desbloqueio =====
Profile.load();
check('perfil novo: hasPitoco() === false', Profile.hasPitoco() === false);
check('perfil novo: petFor(0) e pet padrao (tux), nao pitoco', Profile.petFor(0).id === 'tux');

// 2a. codigo 'pitoco' no resgate
const r1 = Profile.redeem('pitoco');
check("redeem('pitoco') ok", r1.ok === true && r1.pet === true, JSON.stringify(r1));
check('apos redeem: hasPitoco() === true', Profile.hasPitoco() === true);
check('unlock persistiu no storage', store[Profile.KEY] && JSON.parse(store[Profile.KEY]).pitocoUnlocked === true);
const r1b = Profile.redeem('PITOCO'); /* case-insensitive */
check("redeem('PITOCO') maiusculo tambem (already)", r1b.ok === true && r1b.already === true, JSON.stringify(r1b));
const r1c = Profile.redeem('pitoco ');
check("redeem('pitoco ') com espaco (trim)", r1c.ok === true && r1c.already === true);

// 2b. codigo invalido recusado e a msg NAO vaza nenhum codigo (anti-leak, pedido do dono)
const rBad = Profile.redeem('naoexiste');
const pad = ' ' + String(rBad.msg || '').toLowerCase() + ' ';
const vaza = [' pitoco ', ' adm ', ' batata ', ' relogio '].some((w) => pad.indexOf(w) >= 0);
check('codigo invalido recusado e msg NAO lista codigos (anti-vazamento)', rBad.ok === false && !vaza, rBad.msg);

// 2c. codigos de lutadores continuam funcionando (sem regressao)
const rAdm = Profile.redeem('adm');
check("redeem('adm') continua liberando lutadores secretos", rAdm.ok === true && Array.isArray(rAdm.ids) && rAdm.ids.length > 0, JSON.stringify(rAdm.ids));

// 2d. unlockPitoco direto: true na 1a, false na 2a
check('unlockPitoco() retorna false quando ja desbloqueado', Profile.unlockPitoco() === false);

// ===== 3. guardas: so desbloqueado equipa =====
Profile.data.pitocoUnlocked = false; Profile.data.pets = ['none', 'none']; /* simula travado */
check('travado: setPet(0, pitoco) NAO equipa', (Profile.setPet(0, 'pitoco'), Profile.petFor(0).id) === 'none', Profile.petFor(0).id);
Profile.data.pets[0] = 'pitoco'; /* storage adulterado */
check('travado: petFor com storage adulterado devolve none', Profile.petFor(0).id === 'none');
Profile.unlockPitoco();
Profile.setPet(0, 'pitoco');
check('desbloqueado: setPet(0, pitoco) equipa', Profile.petFor(0).id === 'pitoco', Profile.petFor(0).id);
Profile.setPet(0, 'tux');
check('setPet(0, tux) continua funcionando', Profile.petFor(0).id === 'tux');

// ===== 4. sequencia de teclado P-I-T-O-C-O na tela de pets =====
const mkEl = () => ({ textContent: '', className: '', innerHTML: '', value: '', offsetWidth: 0, style: { setProperty() {} }, classList: { toggle() {}, add() {}, remove() {}, contains: () => false }, addEventListener() {}, focus() {}, querySelectorAll: () => [], querySelector: () => mkEl() });
const grid = { innerHTML: '', querySelectorAll: () => [], querySelector: () => null };
const orig$ = UI.$;
UI.$ = (id) => (id === 'pet-grid' ? grid : mkEl());
Profile.data.pitocoUnlocked = false;
UI.screen = 'custom';
UI.pitocoSeq = [];
for (const k of ['KeyP','KeyI','KeyT','KeyO','KeyC']) UI.pitocoKey(k);
check('sequencia parcial (PITOC) nao desbloqueia', Profile.hasPitoco() === false);
UI.pitocoKey('KeyO');
check('sequencia completa P-I-T-O-C-O na tela custom desbloqueia', Profile.hasPitoco() === true);
Profile.data.pitocoUnlocked = false; UI.pitocoSeq = [];
for (const k of ['KeyX','KeyP','KeyI','KeyT','KeyO','KeyC','KeyX']) UI.pitocoKey(k); /* termina errado */
check('sequencia com final errado nao desbloqueia (janela deslizante de 6)', Profile.hasPitoco() === false);
UI.pitocoSeq = [];
for (const k of ['KeyX','KeyP','KeyI','KeyT','KeyO','KeyC','KeyO']) UI.pitocoKey(k); /* ultimos 6 = PITOCO */
check('janela deslizante: 7 teclas terminando em PITOCO desbloqueiam', Profile.hasPitoco() === true);
for (const k of ['KeyP','KeyI','KeyT','KeyO','KeyC','KeyO']) UI.pitocoKey(k);
check('depois de errar, PITOCO valido desbloqueia', Profile.hasPitoco() === true);
const srcInput = fs.readFileSync('js/engine/input.js', 'utf8');
check("input.js: pitocoKey so escuta na tela 'custom'", /UI\\.screen === 'custom'/.test(srcInput) && srcInput.includes('UI.pitocoKey(e.code)'));

// ===== 5. selecao de pets: silhueta aparece quando travado =====
Profile.data.pitocoUnlocked = false;
Profile.data.pets = ['tux', 'none'];
UI.petSlot = 0;
UI.renderPets();
const htmlLocked = grid.innerHTML;
check('travado: grid TEM entrada do pitoco (nao some)', htmlLocked.includes('data-id="pitoco"'));
check('travado: entrada do pitoco e SILHUETA (pet-spr none + ???)', /data-id="pitoco"[\\s\\S]*?pet-spr none/.test(htmlLocked) || /pet-spr none[\\s\\S]*?data-id="pitoco"/.test(htmlLocked), '');
check('travado: botao do pitoco marcado .locked', /class="nav pet locked[^"]*" data-id="pitoco"/.test(htmlLocked));
check('travado: nome vira ??? e NAO vaza o sprite real', htmlLocked.includes('???') && !htmlLocked.includes('pitoco.png'));
check('travado: pets normais continuam aparecendo', htmlLocked.includes('data-id="tux"') && htmlLocked.includes('Pinguim'));
Profile.unlockPitoco();
UI.renderPets();
const htmlOpen = grid.innerHTML;
check('desbloqueado: pitoco aparece com sprite real e sem .locked', htmlOpen.includes('pitoco.png') && !/class="nav pet locked[^"]*" data-id="pitoco"/.test(htmlOpen));
check('desbloqueado: nome Pitoco visivel', htmlOpen.includes('>Pitoco<'));
// click no travado: so mostra toast, nao equipa (codigo-fonte + comportamento do guard ja testado)
const srcUi = fs.readFileSync('js/ui/ui.js', 'utf8');
check('ui.js: clique em pet locked mostra toast e nao equipa', /classList\\.contains\\('locked'\\)[\\s\\S]*?return;/.test(srcUi) && srcUi.includes("Profile.setPet(slot, b.dataset.id)"));

// ===== 6. em combate: pet pitoco equipado, dodge 50%, regen, sprite =====
const fake2d = () => ({ canvas: null, save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, drawImage() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, ellipse() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), createPattern: () => ({}), set imageSmoothingEnabled(v) {}, set globalAlpha(v) {}, set globalCompositeOperation(v) {}, set fillStyle(v) {}, set strokeStyle(v) {}, set font(v) {}, set textAlign(v) {}, set lineWidth(v) {}, set filter(v) {} });
const canvas = { width: 960, height: 540, getContext: () => fake2d(), classList: { toggle() {}, add() {}, remove() {} } };
const g = new Game(canvas);
const pitocoPet = PETS.find((p) => p.id === 'pitoco');
g.start({ mode: 'versus', teams: [['du'], ['du']], stage: 'treino-dojo', cpu: [true, true], roundsToWin: 1, timer: 99, pets: [pitocoPet, PETS[0]] });
for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
const f0 = g.activeOf(0);
check('luta inicia com pet pitoco equipado no P1', f0.pet && f0.pet.id === 'pitoco');
check('pfx do pitoco: regen 15/60 e dodge 0.5', Math.abs(f0.pfx.regen - 15 / 60) < 1e-9 && f0.pfx.dodge === 0.5);

// regen: hp sobe com o tempo (15 HP/s = 0.25/frame) — f0 invulneravel pra IA nao atrapalhar
f0.addStatus('invuln', 100000);
f0.hp = 100; f0.maxHp = 500;
for (let t = 0; t < 60; t++) g.tick();
check('regen do pitoco cura ~15 HP em 60 frames', f0.hp > 100 + 8, 'hp ' + f0.hp.toFixed(1));

// dodge: 400 golpes -> ~50% ERROU (PRNG mulberry32, hp alto pra ninguem morrer)
let rndState = 987654321;
const mulberry = () => { rndState |= 0; rndState = (rndState + 0x6D2B79F5) | 0; let t = Math.imul(rndState ^ (rndState >>> 15), 1 | rndState); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
g.rnd = mulberry;
f0.status = {}; /* limpa invuln do teste de regen */
f0.hp = 5000; f0.maxHp = 5000; f0.state = 'idle';
let missed = 0; const hpBefore = f0.hp;
for (let i = 0; i < 400; i++) { if (f0.takeHit(10, { attacker: g.activeOf(1) }) === false) missed++; }
const landed = 400 - missed;
check('dodge do pitoco: ~50% dos golpes erram (170-230 de 400)', missed >= 170 && missed <= 230, missed + '/400 erraram');
check('golpes que acertaram causaram dano (hp caiu)', f0.hp < hpBefore, 'hp ' + hpBefore + ' -> ' + f0.hp.toFixed(1) + ' (' + landed + ' acertaram)');
// golpe isolado que erra: hp intacto
const hpIso = f0.hp;
let isoMissed = false;
for (let i = 0; i < 50 && !isoMissed; i++) { if (f0.takeHit(10, { attacker: g.activeOf(1) }) === false) isoMissed = true; }
check('takeHit retornando false (ERROU) nao altera hp', isoMissed && f0.hp === hpIso, 'hp ' + hpIso);

// sprite desenhado: registra chamadas Art.cell com key 'pitoco'
const drawn = [];
const origCell = Art.cell.bind(Art);
Art.cell = (c, key, ...rest) => { if (key === 'pitoco') drawn.push(rest); return origCell(c, key, ...rest); };
Art.images['pitoco'] = { naturalWidth: 384, naturalHeight: 96 };
f0.hp = 5000; f0.maxHp = 5000; f0.alive = true;
for (let t = 0; t < 30; t++) { g.tick(); g.render(); }
check('render desenha o sprite do pitoco (Art.cell key=pitoco) a cada frame', drawn.length >= 25, drawn.length + ' draws em 30 frames');
// confere o ultimo draw contra a posicao do dono no mesmo instante
g.tick();
const esperadoX = f0.x - f0.dir * 78;
g.render();
const last = drawn[drawn.length - 1];
check('pitoco acompanha o dono (px = x - dir*78)', last && Math.abs(last[2] - esperadoX) < 2, last ? 'px=' + last[2].toFixed(1) + ' esperado=' + esperadoX.toFixed(1) : 'sem draw');
Art.cell = origCell;
UI.$ = orig$;

console.log('---');
console.log(fails === 0 ? 'PITOCO INTENSIVO: TUDO OK (' + n + ' checks)' : 'PITOCO INTENSIVO: ' + fails + ' FALHAS de ' + n);
`, ctx);
