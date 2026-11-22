// ACESSORIOS UNIVERSAIS (gorro de natal etc.):
// 1) sprite do acessorio existe e e PNG valido com transparencia;
// 2) accessories.js: ACC_LIST/accOn/accAnyOn/ACC_IMAGES + persistencia em Profile;
// 3) SpriteGen.headAnchor calcula a cabeca do sprite real (canvas real) e tem fallback;
// 4) PIXEL REAL: luta com gorro ligado vs desligado -> diff grande na regiao da cabeca;
// 5) wiring: menu/tela ACESSORIOS, ui.js enter_acc/toggle, fighter.js desenha, css.
const fs = require('fs'); const vm = require('vm');
function req(name) { return require(name); }
const { createCanvas, Image: CanvasImage, loadImage } = req('canvas');
let fails = 0, n = 0;
const check = (name, c, x) => { n++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + name + (x ? ' — ' + x : '')); if (!c) fails++; };

// ===== 1. asset do gorro =====
const hatPath = 'assets/acc/gorro-natal.png';
check('assets/acc/gorro-natal.png existe', fs.existsSync(hatPath));
{
  const buf = fs.readFileSync(hatPath);
  const isPng = buf[0] === 0x89 && buf[1] === 0x50;
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  check('gorro e PNG valido com tamanho jsouavel (32..128)', isPng && w >= 32 && w <= 128 && h >= 32 && h <= 128, w + 'x' + h);
}

// ===== 2-5. vm com engine real =====
const ctx = { console, Math, Date, Image: CanvasImage, createCanvas, loadImage, fs,
  Profile: { SECRET_IDS: ['du', 'iales', 'felipinho', 'maximilian'], data: { settings: { reducedMotion: false, quality: 'medium' }, unlocked: [], stats: {}, achievements: [] }, isUnlocked: () => true, petFor: () => null, setting(k, v) { if (v === undefined) return this.data.settings[k]; this.data.settings[k] = v; return v; }, reducedMotion: () => false, record() {}, grantAchievement: () => true, hasAchievement: () => false, recordSurvivalBy() {}, recordWinBy() {}, skinFor: () => 0, unlockPitoco() {}, hasPitoco() { return false; } },
  EMPTY_INPUT: Object.freeze({ left: false, right: false, down: false, up: false, punch: false, kick: false }),
  Input: { init() {}, read: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }), pad: () => null, padCount: 0 },
  AudioSys: new Proxy({}, { get: () => () => {} }),
  UI: { show() {}, hide() {}, banner() {}, hud: new Proxy({}, { get: () => () => {} }), toast() {}, onMatchEnd() {}, cutIn() {}, say() {}, floatText() {}, announce() {} },
  Net: { room: null, score: null, takeRemote: () => ({ left: false, right: false, down: false, up: false, punch: false, kick: false }) },
  AI: { think() { return { left: false, right: false, down: false, up: false, punch: false, kick: false }; } },
  document: { getElementById: () => null, createElement: () => createCanvas(960, 540), querySelectorAll: () => [], addEventListener() {}, body: { classList: { toggle() {}, add() {}, remove() {} }, dataset: {} } },
  window: { addEventListener() {} }, setTimeout, clearTimeout, requestAnimationFrame: (cb) => setTimeout(cb, 16) };
ctx.globalThis = ctx; vm.createContext(ctx);
const files = ['assets/sprites/layout.js', 'js/engine/sprites.js', 'js/data/pets.js', 'js/data/balance.js', 'js/data/fighters.js', 'js/data/fighters-v10.js', 'js/data/fighters-v11.js', 'js/data/powers.js', 'js/data/powers-turbo.js', 'js/data/powers-v4.js', 'js/data/powers-v5.js', 'js/data/powers-v6.js', 'js/data/powers-balance-v6.js', 'js/data/powers-v7.js', 'js/data/powers-v8.js', 'js/data/powers-v9.js', 'js/data/powers-v10.js', 'js/data/powers-v11.js', 'js/data/powers-balance-v7.js', 'js/data/powers-balance-v8.js', 'js/data/powers-balance-v9.js', 'js/data/powers-balance-v10.js', 'js/data/powers-balance-v11.js', 'js/data/powers-balance-v12.js', 'js/data/powers-balance-v13.js', 'js/data/fighters-v12.js', 'js/data/fighters-v13.js', 'js/data/fighters-v14.js', 'js/data/fighters-v15.js', 'js/data/fighters-v16.js', 'js/data/fighters-v17.js', 'js/data/fighters-v18.js', 'js/data/fighters-v19.js', 'js/data/fighters-v20.js', 'js/data/fighters-pack.js', 'js/data/fighters-henrico.js', 'js/data/fighters-jess.js', 'js/data/fighters-dev-virado.js', 'js/data/fighters-milena.js', 'js/data/fighters-kira.js', 'js/data/fighters-cracker.js', 'js/data/fighters-rafael.js', 'js/data/fighters-cyber-v2.js', 'js/data/roster-portraits.js', 'js/data/stages.js', 'js/data/stages-v21.js', 'js/data/stages-brasil.js', 'js/data/stages-events.js', 'js/data/voice-book.js', 'js/data/achievements.js', 'js/data/accessories.js', 'js/engine/stage.js', 'js/engine/mechanics.js', 'js/engine/fx.js', 'js/engine/projectile.js', 'js/engine/vfx.js', 'js/engine/fighter.js', 'js/engine/weather.js', 'js/engine/game.js', 'js/engine/ai.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERRO CARGA', f, e.message.slice(0, 60)); } }

(async () => {
  // injeta imagens reais (sprites dos lutadores + gorro)
  await vm.runInContext(`
  (async () => {
    SpriteGen.images.du = await loadImage('assets/sprites/du.png');
    SpriteGen.images.stack = await loadImage('assets/sprites/stack.png');
    ACC_IMAGES['gorro-natal'] = await loadImage('assets/acc/gorro-natal.png');
  })()`, ctx);

  // ===== 2. accessories.js =====
  const acc = vm.runInContext(`JSON.stringify({ list: ACC_LIST.map(a=>a.id), anyDefault: accAnyOn(), gorroDefault: accOn('gorro-natal'), unknownDefault: accOn('nao-existe'), hasImg: !!ACC_IMAGES['gorro-natal'] })`, ctx);
  const A = JSON.parse(acc);
  check('ACC_LIST tem o gorro-natal + ACC_IMAGES carregou', A.list.includes('gorro-natal') && A.hasImg, acc);
  check('accOn: nenhum acessório ligado por padrão', A.gorroDefault === false && A.unknownDefault === false && A.anyDefault === false);
  const persist = vm.runInContext(`(function(){ Profile.setting('acc', { 'gorro-natal': false }); const off = accOn('gorro-natal'); Profile.setting('acc', { 'gorro-natal': true }); return JSON.stringify([off, accOn('gorro-natal'), accAnyOn()]); })()`, ctx);
  { const pv = JSON.parse(persist); check('toggle persiste em Profile.setting(acc): desliga(false) e religa(true)', pv[0] === false && pv[1] === true && pv[2] === true, persist); }

  // ===== 3. headAnchor com sprite real =====
  const anchor = vm.runInContext(`JSON.stringify(SpriteGen.headAnchor('du', 'idle'))`, ctx);
  const an = JSON.parse(anchor);
  check('headAnchor(du, idle) dentro da celula e perto do topo-centro', an.x > 80 && an.x < 240 && an.y >= 0 && an.y < 90, anchor);
  const fb = vm.runInContext(`JSON.stringify(SpriteGen.headAnchor('lutador-sem-imagem', 'idle'))`, ctx);
  check('headAnchor sem imagem usa fallback centro-topo (160,34)', fb === '{"x":160,"y":34}', fb);
  const anchor2 = vm.runInContext(`JSON.stringify(SpriteGen.headAnchor('stack', 'punch'))`, ctx);
  const an2 = JSON.parse(anchor2);
  check('headAnchor funciona em outra pose (stack punch) e cacheia', an2.x > 60 && an2.x < 260 && an2.y >= 0 && an2.y < 120, anchor2);

  // ===== 4. pixel real: luta com gorro vs sem gorro =====
  const pix = await vm.runInContext(`
  (async () => {
    const canvas = createCanvas(960, 540);
    const cx2d = canvas.getContext('2d');
    const g = new Game({ width: 960, height: 540, getContext: () => cx2d, toBuffer: () => canvas.toBuffer('image/png'), classList: { remove() {}, add() {}, toggle() {} } });
    g.start({ mode: 'versus', teams: [['du'], ['stack']], stage: '06-sakura-dojo', cpu: [false, false], roundsToWin: 1, timer: 99 });
    for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
    for (let t = 0; t < 30; t++) g.tick();
    const f0 = g.activeOf(0), f1 = g.activeOf(1);
    f0.x = 380; f0.y = 0; f0.state = 'idle'; f0.frame = 0;
    f1.x = 580; f1.y = 0; f1.state = 'idle'; f1.frame = 0;
    const region = () => cx2d.getImageData(300, 180, 160, 140).data.slice(); // caixa da cabeca do P1
    Profile.setting('acc', { 'gorro-natal': true });
    g.render(1);
    const withHat = region();
    fs.writeFileSync('.vibe/acc-com-gorro.png', canvas.toBuffer('image/png'));
    Profile.setting('acc', { 'gorro-natal': false });
    g.render(1);
    const noHat = region();
    fs.writeFileSync('.vibe/acc-sem-gorro.png', canvas.toBuffer('image/png'));
    g.render(1);
    const noHat2 = region();
    const diff = (a, b) => { let c = 0; for (let i = 0; i < a.length; i += 4) { if (Math.abs(a[i]-b[i]) + Math.abs(a[i+1]-b[i+1]) + Math.abs(a[i+2]-b[i+2]) > 30) c++; } return c; };
    return JSON.stringify({ hatVsNo: diff(withHat, noHat), noiseOff: diff(noHat, noHat2) });
  })()`, ctx);
  const P = JSON.parse(pix);
  check('gorro muda pixels na regiao da cabeca (com vs sem = ' + P.hatVsNo + ' px)', P.hatVsNo > 250, pix);
  check('sem gorro o frame e estavel (ruido ~0 = ' + P.noiseOff + ' px)', P.noiseOff < 40, pix);

  // ===== 5. wiring =====
  const html = fs.readFileSync('index.html', 'utf8');
  const ui = fs.readFileSync('js/ui/ui.js', 'utf8');
  const ftr = fs.readFileSync('js/engine/fighter.js', 'utf8');
  const spr = fs.readFileSync('js/engine/sprites.js', 'utf8');
  const css = fs.readFileSync('css/style.css', 'utf8');
  check('index.html: botao data-go="acc" no menu + tela #scr-acc + script accessories.js', /data-go="acc"/.test(html) && /id="scr-acc" data-screen="acc"/.test(html) && /js\/data\/accessories\.js/.test(html) && /id="acc-list"/.test(html));
  check('ui.js: enter_acc/setAcc/toggleAcc + botoes ligar/desligar todos', ui.indexOf('enter_acc()') >= 0 && ui.indexOf('setAcc(') >= 0 && ui.indexOf('toggleAcc(') >= 0 && ui.indexOf('acc-all-on') >= 0);
  check('fighter.js: bloco de acessorio universal apos o blit principal, usando a cabeca medida (headBox + accPlacement)', ftr.indexOf('ACESSÓRIO universal ligado') >= 0 && ftr.indexOf('SpriteGen.headBox(this.spriteKey(), pose)') >= 0 && ftr.indexOf('accPlacement(') >= 0);
  check('sprites.js: headAnchor com scan de alpha + cache + fallback', spr.indexOf('headAnchor(id, pose)') >= 0 && spr.indexOf('_headCache') >= 0 && spr.indexOf('getImageData') >= 0);
  check('css: .acc-list/.acc-row/.acc-img/.acc-toggle', /\.acc-list\s*\{/.test(css) && /\.acc-row\s*\{/.test(css) && /\.acc-img\s*\{/.test(css) && /\.acc-toggle\s*\{/.test(css));

  // ===== 6. navegacao: VOLTAR (data-back/Esc) funciona na tela de acessorios =====
  check('ui.js: back() inclui a tela acc na lista que volta pro menu + binding [data-back] + Esc chama back()', /\['acc', 'custom'[^\]]*\]\.includes\(this\.screen\)/.test(ui) && ui.indexOf("[data-back]').forEach") >= 0 && /m\.back \|\| Input\.hit\(\['Escape', 'Backspace'\]\)/.test(ui));
  {
    const ctx3 = {
      console, Math, Date, JSON, fs,
      localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      location: { hash: '' }, window: {},
      Input: { init() {}, read: () => ({}), hit: () => false, menu: () => ({}), releaseAll() {} },
      AudioSys: new Proxy({}, { get: () => () => {} }),
      HUD: { hide() {}, show() {} }, Net: { room: null },
      Profile: { data: { settings: {}, unlocked: [], achievements: [] }, setting(k, v) { if (v === undefined) return this.data.settings[k]; this.data.settings[k] = v; return v; }, reducedMotion: () => false },
      document: { getElementById: () => null, createElement: () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} } }), querySelectorAll: () => [], querySelector: () => null, addEventListener() {}, body: { classList: { add() {}, remove() {}, toggle() {} }, dataset: {} }, activeElement: null },
      setTimeout, clearTimeout,
    };
    ctx3.globalThis = ctx3; vm.createContext(ctx3);
    vm.runInContext(ui, ctx3, { filename: 'js/ui/ui.js' });
    const nav = vm.runInContext(`(() => {
      const ui = Object.create(UI);
      const calls = [];
      ui.stack = []; ui.flow = null;
      ui.screen = 'acc';
      ui.show = (n) => { calls.push('show:' + n); ui.screen = n; };
      ui.toMenu = () => { calls.push('toMenu'); };
      ui.back();
      const accBack = calls.join(',');
      calls.length = 0; ui.screen = 'options'; ui.stack = ['menu'];
      ui.back();
      const stackBack = calls.join(',');
      calls.length = 0; ui.screen = 'conquistas'; ui.stack = [];
      ui.back();
      const cqBack = calls.join(',');
      return JSON.stringify({ accBack, stackBack, cqBack });
    })()`, ctx3);
    const NV = JSON.parse(nav);
    check('back() na tela ACESSORIOS volta pro menu (VOLTAR/Esc funcionam)', NV.accBack === 'toMenu', nav);
    check('back() com pilha continua desempilhando (show:menu) e conquistas segue toMenu', NV.stackBack === 'show:menu' && NV.cqBack === 'toMenu', nav);
  }

  console.log('---');
  console.log(fails === 0 ? 'ACESSORIOS: TUDO OK (' + n + ' checks)' : 'ACESSORIOS: ' + fails + ' FALHAS de ' + n);
  process.exit(fails ? 1 : 0);
})();
