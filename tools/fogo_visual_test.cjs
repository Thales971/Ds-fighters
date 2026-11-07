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
  g.start({ mode: 'morte-subita', teams: [['emilio'], ['du']], stage: '06-sakura-dojo', cpu: [false, true], roundsToWin: 2, timer: 99, weather: 'clear' });
  for (let k = 0; k < 700 && g.roundState !== 'fight'; k++) g.tick();

  const [f, o] = g.activePair();
  console.log('Fx.images keys:', Object.keys(vm.runInContext('typeof Fx !== "undefined" ? Fx.images : {}', vmc)).join(','));
  let drawCalls = 0;
  const origDraw = g.drawInferno.bind(g);
  g.drawInferno = (c) => { drawCalls++; origDraw(c); };
  const snap = (name) => { g.render && g.render(); fs.writeFileSync(path.join(outDir, 'fogo-' + name + '.png'), gameCanvas.toBuffer('image/png')); console.log('snap', name, 'inferno:', JSON.stringify(g.inferno)); };
  for (let t = 0; t < 700 && g.roundState !== 'fight'; t++) g.tick();
  for (let t = 0; t < 380; t++) g.tick(); snap('aviso');
  for (let t = 0; t < 340; t++) g.tick(); snap('inicio-fogo');
  for (let t = 0; t < 600; t++) g.tick(); snap('fechando'); console.log('drawInferno calls:', drawCalls);
  for (let t = 0; t < 1200; t++) g.tick(); snap('quase-fechou');
  console.log('hp final:', Math.round(f.hp), Math.round(o.hp), '| inferno:', JSON.stringify(g.inferno));
  process.exit(0);
}, 3000);
