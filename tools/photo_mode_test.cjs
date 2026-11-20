// MODO FOTO NA PAUSA: camera livre (pan/zoom) sobre a cena pausada, toggle de
// lutadores, salvar PNG, barra #photo-bar, HUD escondido.
// 1) wiring (index.html/ui.js/game.js/hud.js/css);
// 2) PIXEL REAL: render com camera de foto muda a imagem, photo=null volta ao
//    normal, hideF tira os lutadores (e o reflexo molhado), photoClamp limita;
// 3) UI real (objeto UI do ui.js com DOM stub): enterPhoto/exitPhoto/photoZoom/
//    togglePhotoFighters/photoKeys/savePhoto com teclado simulado.
const fs = require('fs'); const vm = require('vm');
function req(name) { return require(name); }
const { createCanvas, Image: CanvasImage, loadImage } = req('canvas');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };
fs.mkdirSync('.vibe', { recursive: true });

// ================= 1. WIRING =================
const html = fs.readFileSync('index.html', 'utf8');
const uiSrc = fs.readFileSync('js/ui/ui.js', 'utf8');
const gameSrc = fs.readFileSync('js/engine/game.js', 'utf8');
const hudSrc = fs.readFileSync('js/ui/hud.js', 'utf8');
const css = fs.readFileSync('css/style.css', 'utf8');

const pauseScr = html.split('id="scr-pause"')[1] || '';
check('index.html: botao #btn-photo no painel de pausa', /id="btn-photo"/.test(pauseScr));
check('index.html: #photo-bar hidden com salvar/zoom+/zoom-/lutadores/sair + label + dica', /id="photo-bar"[^>]*hidden/.test(html) && /id="btn-photo-save"/.test(html) && /id="btn-photo-zin"/.test(html) && /id="btn-photo-zout"/.test(html) && /id="photo-zoom-lbl"/.test(html) && /id="btn-photo-fighters"/.test(html) && /id="btn-photo-exit"/.test(html) && /class="photo-hint"/.test(html));
check('ui.js: bindings dos 6 botoes + rodinha (wheel passive:false) no canvas', uiSrc.indexOf("$('btn-photo').addEventListener('click', () => this.enterPhoto())") >= 0 && uiSrc.indexOf("$('btn-photo-save').addEventListener") >= 0 && uiSrc.indexOf("$('btn-photo-exit').addEventListener") >= 0 && uiSrc.indexOf("$('btn-photo-fighters').addEventListener") >= 0 && uiSrc.indexOf("$('btn-photo-zin').addEventListener") >= 0 && uiSrc.indexOf("$('btn-photo-zout').addEventListener") >= 0 && /addEventListener\('wheel'[\s\S]{0,300}?passive: false/.test(uiSrc) && /if \(!this\.photoMode\) return;/.test(uiSrc));
check('ui.js: tick() desvia pro photoKeys no modo foto; show() sai do modo foto ao trocar de tela', uiSrc.indexOf('if (this.photoMode) { this.photoKeys(m); return; }') >= 0 && uiSrc.indexOf("if (name !== 'fight' && this.photoMode) this.exitPhoto(false);") >= 0);
check('ui.js: metodos enterPhoto/exitPhoto/savePhoto/photoZoom/togglePhotoFighters/syncPhotoBar/photoKeys', ['enterPhoto() {', 'exitPhoto(toPause = true) {', 'savePhoto() {', 'photoZoom(d) {', 'togglePhotoFighters() {', 'syncPhotoBar() {', 'photoKeys(m) {'].every((s) => uiSrc.indexOf(s) >= 0));
check('ui.js: savePhoto usa canvas.toDataURL(image/png) + <a download="ds-fighters-foto-...">', uiSrc.indexOf("toDataURL('image/png')") >= 0 && /a\.download = 'ds-fighters-foto-' \+ Date\.now\(\) \+ '\.png'/.test(uiSrc) && uiSrc.indexOf('a.click()') >= 0);
check('ui.js: photoKeys: WASD/setas movem, =/- zoom, 0 reseta, F lutadores, Enter salva, Esc sai', uiSrc.indexOf('const sp = 7 / p.z;') >= 0 && uiSrc.indexOf("Input.hit(['Equal', 'NumpadAdd'])") >= 0 && uiSrc.indexOf("Input.hit(['Minus', 'NumpadSubtract'])") >= 0 && uiSrc.indexOf("Input.hit(['Digit0'])") >= 0 && uiSrc.indexOf("Input.hit(['KeyF'])) this.togglePhotoFighters()") >= 0 && uiSrc.indexOf("Input.hit(['Enter', 'Space'])) this.savePhoto()") >= 0 && uiSrc.indexOf("Input.hit(['Escape', 'KeyP'])) this.exitPhoto()") >= 0 && uiSrc.indexOf('g.photoClamp();') >= 0);
check('game.js: this.photo no construtor + camera no render (translate/scale/restore) + photoClamp', gameSrc.indexOf('this.photo = null;') >= 0 && gameSrc.indexOf('const pc = this.photo;') >= 0 && gameSrc.indexOf('ctx.scale(pc.z, pc.z);') >= 0 && gameSrc.indexOf('if (pc) ctx.restore();') >= 0 && /photoClamp\(\) \{/.test(gameSrc));
check('game.js: guard hideF no desenho dos lutadores E no reflexo molhado (2 guards)', (gameSrc.match(/this\.photo && this\.photo\.hideF/g) || []).length >= 2);
check('hud.js: show() restaurado (remove hidden) alem do hide()', /hide\(\) \{ this\.\$\('hud'\)\.classList\.add\('hidden'\); \}/.test(hudSrc) && /show\(\) \{ this\.\$\('hud'\)\.classList\.remove\('hidden'\); \}/.test(hudSrc));
check('css: .photo-bar fixo embaixo + [hidden] + label + dica + body.photo esconde touch/banner/cutin', /\.photo-bar\s*\{/.test(css) && /\.photo-bar\[hidden\]/.test(css) && /#photo-zoom-lbl/.test(css) && /\.photo-hint/.test(css) && /body\.photo #touch-controls/.test(css) && /body\.photo #banner/.test(css));

// ================= 2. GAME REAL (canvas real) =================
const ctx = { console, Math, Date, Image: CanvasImage, createCanvas, loadImage, fs,
  __pressed: new Set(), __menu: { left: false, right: false, up: false, down: false, confirm: false, start: false, back: false },
  __anchors: [], __hudCalls: [], __bodyClass: new Set(),
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho', 'maximilian'], data: { settings: { reducedMotion: false, quality: 'medium' }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting(k, v) { if (v === undefined) return this.data.settings[k]; this.data.settings[k] = v; return v; }, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0, releaseAll() {} },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: { room: null, score: null, takeRemote: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }) },
  AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.Input.hit = (ks) => ks.some((k) => ctx.__pressed.has(k));
ctx.Input.menu = () => ctx.__menu;
ctx.HUD = { hide() { ctx.__hudCalls.push('hide'); }, show() { ctx.__hudCalls.push('show'); } };
const mkCls = () => ({ add: (c) => ctx.__bodyClass.add(c), remove: (c) => ctx.__bodyClass.delete(c), toggle: (c, f) => { if (f === undefined) { ctx.__bodyClass.has(c) ? ctx.__bodyClass.delete(c) : ctx.__bodyClass.add(c); } else if (f) ctx.__bodyClass.add(c); else ctx.__bodyClass.delete(c); } });
ctx.document = {
  getElementById: () => null,
  createElement: (tag) => { if (tag === 'a') { const a = { href: '', download: '', click() { a.__clicked = true; }, remove() {} }; ctx.__anchors.push(a); return a; } return createCanvas(960, 540); },
  querySelectorAll: () => [], querySelector: () => null, addEventListener() {},
  body: { classList: mkCls(), dataset: {}, appendChild() {} }, activeElement: null,
};
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/balance.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/fighters-dev-virado.js', 'js/data/fighters-milena.js', 'js/data/fighters-kira.js', 'js/data/fighters-cracker.js', 'js/data/fighters-rafael.js', 'js/data/roster-portraits.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/data/accessories.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 80)); } }
// ui.js em contexto proprio (so o objeto UI + stubs leves)
const ctx2 = { console, Math, Date, JSON, fs,
  __pressed: ctx.__pressed, __menu: ctx.__menu, __anchors: ctx.__anchors, __hudCalls: ctx.__hudCalls, __bodyClass: ctx.__bodyClass,
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  location: { hash: '' },
  Profile: ctx.Profile,
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), hit: (ks) => ks.some((k) => ctx.__pressed.has(k)), menu: () => ctx.__menu, releaseAll() {}, pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  HUD: { hide() { ctx.__hudCalls.push('hide'); }, show() { ctx.__hudCalls.push('show'); } },
  Net: { room: null },
  window: { addEventListener() {} }, setTimeout, clearTimeout,
};
ctx2.document = {
  getElementById: () => null,
  createElement: (tag) => { if (tag === 'a') { const a = { href: '', download: '', click() { a.__clicked = true; }, remove() {} }; ctx.__anchors.push(a); return a; } return { style: {}, getContext: () => null, classList: mkCls() }; },
  querySelectorAll: () => [], querySelector: () => null, addEventListener() {},
  body: { classList: mkCls(), dataset: {}, appendChild() {} }, activeElement: null,
};
ctx2.globalThis = ctx2; vm.createContext(ctx2);
try { vm.runInContext(uiSrc, ctx2, { filename: 'js/ui/ui.js' }); } catch (e) { console.log('ERRO CARGA ui.js', e.message.slice(0, 120)); }

(async () => {
  // ===== 2. pixel real com camera de foto =====
  const pix = await vm.runInContext([
    '(async () => {',
    '  const canvas = createCanvas(960, 540);',
    '  const cx2d = canvas.getContext("2d");',
    '  const g = new Game({ width: 960, height: 540, getContext: () => cx2d, toDataURL: () => "data:image/png;base64,AAAA", toBuffer: () => canvas.toBuffer("image/png"), classList: { remove(){}, add(){}, toggle(){} } });',
    '  g.start({ mode: "versus", teams: [["du"], ["stack"]], stage: "06-sakura-dojo", cpu: [false, false], roundsToWin: 1, timer: 99 });',
    '  for (let t = 0; t < 700 && g.roundState !== "fight"; t++) g.tick();',
    '  for (let t = 0; t < 30; t++) g.tick();',
    '  SpriteGen.images.du = await loadImage("assets/sprites/du.png");',
    '  SpriteGen.images.stack = await loadImage("assets/sprites/stack.png");',
    '  g.stage.img = await loadImage("assets/maps/06-sakura-dojo.jpg");',
    '  g.stage.ready = true;',
    '  g.paused = true;',
    '  g.time = 400; if (g.stage) g.stage.t = 40;',
    '  if (g.weather) g.weather.kind = "clear";',
    '  g.shakeMag = 0; g.freeze = 0; g.slowmo = 0; g.chroma = 0;',
    '  const f0 = g.activeOf(0), f1 = g.activeOf(1);',
    '  const fix = (f, x, dir) => { f.x = x; f.y = 0; f.state = "idle"; f.frame = 0; f.stateTime = 3; f.dir = dir; f.vx = 0; f.vy = 0; f.alive = true; f.hp = f.maxHp; f.status = {}; f.attack = null; f.cast = null; };',
    '  fix(f0, 380, 1); fix(f1, 580, -1);',
    '  const diff = (a, b) => { let c = 0; for (let i = 0; i < a.length; i += 4) { if (Math.abs(a[i]-b[i]) + Math.abs(a[i+1]-b[i+1]) + Math.abs(a[i+2]-b[i+2]) > 30) c++; } return c; };',
    '  const rdiff = (a, b, x0, y0, w, h) => { let c = 0; for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const i = (y * 960 + x) * 4; if (Math.abs(a[i]-b[i]) + Math.abs(a[i+1]-b[i+1]) + Math.abs(a[i+2]-b[i+2]) > 30) c++; } return c; };',
    '  const grab = () => { cx2d.clearRect(0, 0, 960, 540); g.render(1); return cx2d.getImageData(0, 0, 960, 540).data.slice(); };',
    '  g.photo = null; const A = grab(); fs.writeFileSync(".vibe/photo-normal.png", canvas.toBuffer("image/png"));',
    '  const A2 = grab();',
    '  g.photo = { x: 90, y: -50, z: 1.8 }; g.photoClamp(); const B = grab(); fs.writeFileSync(".vibe/photo-zoom.png", canvas.toBuffer("image/png"));',
    '  g.photo = null; const C = grab();',
    '  g.photo = { x: 0, y: 0, z: 1, hideF: true }; g.photoClamp(); const D = grab(); fs.writeFileSync(".vibe/photo-sem-lutadores.png", canvas.toBuffer("image/png"));',
    '  g._wetOverride = true; g.photo = { x: 0, y: 0, z: 1, hideF: true }; g.photoClamp(); const E = grab();',
    '  g.photo = { x: 0, y: 0, z: 1, hideF: false }; g.photoClamp(); const F = grab(); g._wetOverride = null;',
    '  let crashMax = null; try { g.photo = { x: 260, y: 90, z: 3.2 }; g.photoClamp(); grab(); } catch (e) { crashMax = e.message; }',
    '  g.photo = { x: 9999, y: -9999, z: 99 }; g.photoClamp(); const cl1 = [g.photo.x, g.photo.y, g.photo.z];',
    '  g.photo = { x: -9999, y: 9999, z: 0.01 }; g.photoClamp(); const cl2 = [g.photo.x, g.photo.y, g.photo.z];',
    '  g.photo = null;',
    '  __g = g;',
    '  return JSON.stringify({ rs: g.roundState, dAA2: diff(A, A2), dAB: diff(A, B), dAC: diff(A, C), dAD: diff(A, D), dADr: rdiff(A, D, 200, 190, 560, 280), dEF: diff(E, F), cl1: cl1, cl2: cl2, crashMax: crashMax });',
    '})()',
  ].join('\n'), ctx);
  const P = JSON.parse(pix);
  check('luta chegou em fight e render estavel (2 renders sem foto: diff=' + P.dAA2 + ')', P.rs === 'fight' && P.dAA2 < 500, pix);
  check('camera de foto muda a imagem (pan+zoom: diff=' + P.dAB + ' px)', P.dAB > 2000);
  check('photo=null renderiza exatamente como o jogo normal (diff=' + P.dAC + ')', P.dAC < 500);
  check('hideF tira os lutadores (diff total=' + P.dAD + ', regiao dos lutadores=' + P.dADr + ')', P.dAD > 1000 && P.dADr > 1000);
  check('hideF tambem tira o reflexo molhado (diff com/sem=' + P.dEF + ')', P.dEF > 300);
  check('render no zoom maximo (z=3.2, pan max) nao quebra' + (P.crashMax ? ' — ERRO: ' + P.crashMax : ''), !P.crashMax);
  check('photoClamp: max -> x=260 y=-150 z=3.2', JSON.stringify(P.cl1) === '[260,-150,3.2]', JSON.stringify(P.cl1));
  check('photoClamp: min -> x=-260 y=90 z=0.6', JSON.stringify(P.cl2) === '[-260,90,0.6]', JSON.stringify(P.cl2));

  // ===== 3. UI real (objeto UI + game real) =====
  ctx2.__g = vm.runInContext('__g', ctx); // mesmo objeto Game do teste de pixel
  const ui = await vm.runInContext([
    '(() => {',
    '  const els = {};',
    '  const mk = (id) => ({ id: id, hidden: true, textContent: "", classList: { add(){}, remove(){}, toggle(){} }, addEventListener(){}, click(){}, remove(){}, focus(){}, scrollIntoView(){}, appendChild(){}, dataset: {}, style: {} });',
    '  const ui = Object.create(UI);',
    '  ui.__els = els; ui.__toasts = [];',
    '  ui.$ = (id) => els[id] || (els[id] = mk(id));',
    '  ui.toast = (m) => { ui.__toasts.push(String(m)); };',
    '  ui.show = (name) => { ui.screen = name; };',
    '  ui.screen = "pause";',
    '  ui.game = __g;',
    '  return ui;',
    '})()',
  ].join('\n'), ctx2);

  ui.enterPhoto();
  check('enterPhoto: photoMode=true, g.photo={0,0,1,hideF:false}, HUD.hide, body.photo, barra visivel, tela fight', ui.photoMode === true && ui.game.photo && ui.game.photo.x === 0 && ui.game.photo.y === 0 && ui.game.photo.z === 1 && ui.game.photo.hideF === false && ctx.__hudCalls.includes('hide') && ctx.__bodyClass.has('photo') && ui.__els['photo-bar'].hidden === false && ui.screen === 'fight');
  check('syncPhotoBar: label 100% + botao LUTADORES: ON', ui.__els['photo-zoom-lbl'].textContent === '100%' && /ON/.test(ui.__els['btn-photo-fighters'].textContent), ui.__els['photo-zoom-lbl'].textContent + ' / ' + ui.__els['btn-photo-fighters'].textContent);

  ui.photoZoom(0.15);
  check('photoZoom(+0.15): z=1.15 e label 115%', Math.abs(ui.game.photo.z - 1.15) < 1e-9 && ui.__els['photo-zoom-lbl'].textContent === '115%', ui.game.photo.z + ' / ' + ui.__els['photo-zoom-lbl'].textContent);
  ui.game.photo.z = 99; ui.photoZoom(0.15);
  check('photoZoom respeita clamp (z=99 -> 3.2)', ui.game.photo.z === 3.2);
  ui.game.photo.z = 1;

  ui.togglePhotoFighters();
  check('togglePhotoFighters: hideF=true e botao vira OFF', ui.game.photo.hideF === true && /OFF/.test(ui.__els['btn-photo-fighters'].textContent));
  ui.togglePhotoFighters();

  ctx.__menu.right = true;
  const x0 = ui.game.photo.x;
  ui.photoKeys(ctx.__menu);
  check('photoKeys: seta direita anda a camera (x ' + x0 + ' -> ' + ui.game.photo.x + ')', ui.game.photo.x > x0);
  ctx.__menu.right = false; ctx.__menu.down = true;
  const y0 = ui.game.photo.y;
  ui.photoKeys(ctx.__menu);
  check('photoKeys: seta baixo desce a camera (y ' + y0 + ' -> ' + ui.game.photo.y + ')', ui.game.photo.y > y0);
  ctx.__menu.down = false;

  ctx.__pressed.add('Equal');
  const z0 = ui.game.photo.z;
  ui.photoKeys(ctx.__menu);
  ctx.__pressed.delete('Equal');
  check('photoKeys: tecla = da zoom (z ' + z0.toFixed(2) + ' -> ' + ui.game.photo.z.toFixed(2) + ')', ui.game.photo.z > z0);

  ctx.__pressed.add('Digit0');
  ui.photoKeys(ctx.__menu);
  ctx.__pressed.delete('Digit0');
  check('photoKeys: tecla 0 reseta camera (0,0,z=1)', ui.game.photo.x === 0 && ui.game.photo.y === 0 && ui.game.photo.z === 1);

  ctx.__pressed.add('KeyF');
  ui.photoKeys(ctx.__menu);
  ctx.__pressed.delete('KeyF');
  check('photoKeys: tecla F esconde os lutadores', ui.game.photo.hideF === true);

  const anchorsBefore = ctx.__anchors.length;
  ctx.__pressed.add('Enter');
  ui.photoKeys(ctx.__menu);
  ctx.__pressed.delete('Enter');
  const a = ctx.__anchors[ctx.__anchors.length - 1];
  check('photoKeys: Enter salva PNG (toDataURL + download ds-fighters-foto-<ts>.png + click)', ctx.__anchors.length === anchorsBefore + 1 && a && /^data:image\/png/.test(a.href) && /^ds-fighters-foto-\d+\.png$/.test(a.download) && a.__clicked === true, a ? a.download : 'sem anchor');

  ctx.__pressed.add('Escape');
  ui.photoKeys(ctx.__menu);
  ctx.__pressed.delete('Escape');
  check('photoKeys: Esc sai do modo foto (photoMode=false, g.photo=null, HUD.show, volta pra pausa)', ui.photoMode === false && ui.game.photo === null && ctx.__hudCalls.includes('show') && !ctx.__bodyClass.has('photo') && ui.__els['photo-bar'].hidden === true && ui.screen === 'pause');

  // savePhoto direto com erro no toDataURL nao quebra
  ui.enterPhoto();
  const oldTD = ui.game.canvas.toDataURL;
  ui.game.canvas.toDataURL = () => { throw new Error('falhou'); };
  let toastErr = null;
  try { ui.savePhoto(); } catch (e) { toastErr = e.message; }
  ui.game.canvas.toDataURL = oldTD;
  check('savePhoto com falha no toDataURL mostra toast de erro e nao quebra', !toastErr && ui.__toasts.some((t) => /Nao consegui salvar/.test(t)), JSON.stringify(ui.__toasts));
  ui.exitPhoto();

  console.log('---');
  console.log(fails === 0 ? 'MODO FOTO: TUDO OK (' + n + ' checks)' : 'MODO FOTO: ' + fails + ' FALHAS de ' + n);
  process.exit(fails ? 1 : 0);
})();
