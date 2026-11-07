// Testa a transformação do Emilio: ult ativa status 'trans', spriteKey troca,
// buffs de dano/velocidade aplicam e expiram.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
function req(name) {
  try { return require(name); } catch (e) { return require('/tmp/node_modules/' + name); }
}
const { JSDOM } = req('jsdom');
const { createCanvas } = req('canvas');

const ROOT = '/workspace/github__Thales971__Ds-fighters';
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const gameCanvas = createCanvas(960, 540);
gameCanvas.style = {};
gameCanvas.addEventListener = () => {};
gameCanvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 960, height: 540, right: 960, bottom: 540 });

const CanvasImage = req('canvas').Image;
class RealImage extends CanvasImage {
  set src(v) {
    const file = String(v).split('?')[0];
    const p = path.isAbsolute(file) ? file : path.join(ROOT, file);
    try { super.src = p; if (this.onload) this.onload(); }
    catch (e) { if (this.onerror) this.onerror(e); }
  }
  get src() { return this._src || ''; }
}

const dom = new JSDOM(html, {
  url: 'file://' + ROOT + '/index.html',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  beforeParse(window) {
    const w = window;
    w.HTMLCanvasElement.prototype.getContext = function () { return gameCanvas.getContext('2d'); };
    w.HTMLCanvasElement.prototype.__defineGetter__('width', () => gameCanvas.width);
    w.HTMLCanvasElement.prototype.__defineGetter__('height', () => gameCanvas.height);
    const origCreate = w.document.createElement.bind(w.document);
    w.document.createElement = (tag) => {
      if (tag === 'canvas') {
        const c = createCanvas(320, 260);
        c.style = {}; c.addEventListener = () => {};
        c.getBoundingClientRect = () => ({ left: 0, top: 0, width: c.width, height: c.height });
        return c;
      }
      return origCreate(tag);
    };
    w.devicePixelRatio = 1;
    w.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {} });
    w.Image = RealImage;
    w.requestAnimationFrame = (cb) => setTimeout(cb, 16);
    w.AudioContext = undefined;
    w.Audio = class { play() { return Promise.resolve(); } pause() {} addEventListener() {} };
  },
});

const w = dom.window;
w.Image = RealImage;
w.fetch = () => Promise.resolve({ ok: false, json: async () => ({}) });
if (!w.DSGame) {
  const scriptTags = html.match(/<script[^>]*src="([^"]+)"[^>]*>[\s\S]*?<\/script>/g) || [];
  for (const t of scriptTags) {
    const src = t.match(/src="([^"]+)"/)[1].split('?')[0];
    const p = path.join(ROOT, src);
    if (!fs.existsSync(p)) { console.error('missing', src); continue; }
    try { vm.runInContext(fs.readFileSync(p, 'utf8'), dom.getInternalVMContext(), { filename: src }); }
    catch (e) { console.error('erro em', src, String(e).slice(0, 200)); }
  }
  const inlines = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
  for (const code of inlines) {
    try { vm.runInContext(code.replace(/<\/?script>/g, ''), dom.getInternalVMContext()); } catch (e) { console.error('erro inline', String(e).slice(0, 200)); }
  }
}

setTimeout(() => {
  const vmc = dom.getInternalVMContext();
  const g = w.DSGame || vm.runInContext('DSGame', vmc);
  const UI = vm.runInContext('UI', vmc);
  const outDir = path.join(ROOT, '.vibe', 'emilio');
  fs.mkdirSync(outDir, { recursive: true });

  UI.show('fight');
  const wrap = w.document.getElementById('stage-wrap');
  if (wrap) wrap.classList.add('on');
  g.start({ mode: 'training', teams: [['emilio'], ['boneco-treino']], stage: 'treino-dojo', cpu: [false, false], dummy: 'stand', roundsToWin: 2, timer: Infinity, weather: 'clear' });
  for (let k = 0; k < 700 && g.roundState !== 'fight'; k++) g.tick();

  const [f, o] = g.activePair();
  f.x = 340; o.x = 620; f.ultimate = 100; f.charge = [100, 100];
  const baseDmg = f.dmgMult(null);
  const baseSpd = f.speedMult();

  const ok = f.tryCast(4);
  console.log('cast ult:', ok, 'state:', f.state);
  for (let k = 0; k < 30; k++) g.tick(); // cast termina, transformacao ativa
  console.log('has trans:', f.has('trans'), '| spriteKey:', f.spriteKey());
  console.log('dmgMult:', (f.dmgMult(null) / baseDmg).toFixed(2) + 'x base | speedMult:', (f.speedMult() / baseSpd).toFixed(2) + 'x base');
  console.log('armor:', f.has('armor'), '| hp curado:', Math.round(f.hp));
  g.render && g.render();
  fs.writeFileSync(path.join(outDir, 'transformado.png'), gameCanvas.toBuffer('image/png'));

  // espera expirar (620 frames)
  for (let k = 0; k < 900; k++) g.tick();
  console.log('apos expirar -> has trans:', f.has('trans'), '| spriteKey:', f.spriteKey(), !f.has('trans') ? '(OK)' : '(FALHOU: nao expirou)');

  // habilidades transformadas usam o atlas emilio-trans
  f.ultimate = 100; f.state = 'idle'; f.cast = null; f.stolen = null;
  f.tryCast(4);
  for (let k = 0; k < 40; k++) g.tick();
  f.cd = [0,0,0,0,0,0,0,0,0,0]; f.charge = [100,100]; f.ultimate = 100;
  f.state = 'idle'; f.cast = null;
  f.tryCast(0);
  console.log('H1 transformado -> visualSheet:', f.cast && f.cast.p.visualSheet, f.cast && f.cast.p.visualSheet === 'emilio-trans' ? '(OK: arte da raposa)' : '(FALHOU)');
  for (let k = 0; k < 900; k++) g.tick();
  f.has('trans') && console.log('aviso: trans ainda ativa apos 900 ticks');

  // H1-H4 tambem castam
  f.stolen = null; f.cd = [0,0,0,0,0,0,0,0,0,0]; f.charge = [100,100]; f.ultimate = 100;
  [0,1,2,3].forEach((i) => {
    f.state = 'idle'; f.stateTime = 0; f.cast = null;
    const c = f.tryCast(i);
    for (let k = 0; k < 60; k++) g.tick();
    console.log('H' + (i + 1), f.currentKit()[i].name, '-> cast:', c, 'dmg no boneco:', Math.round(o.maxHp - o.hp));
    o.hp = o.maxHp; o.status = {}; f.cd = [0,0,0,0,0,0,0,0,0,0]; f.charge = [100,100]; f.ultimate = 100;
  });
  process.exit(0);
}, 3000);
