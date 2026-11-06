// Teste do caminho real de input das habilidades 6-10 do IALES (teclas Digit6-0).
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
  const Input = vm.runInContext('Input', vmc);
  if (!g || !UI || !Input) { console.error('DSGame/UI/Input ausentes'); process.exit(1); }

  UI.show('fight');
  const wrap = w.document.getElementById('stage-wrap');
  if (wrap) wrap.classList.add('on');
  g.start({ mode: 'training', teams: [['iales'], ['boneco-treino']], stage: 'treino-dojo', cpu: [false, false], dummy: 'stand', roundsToWin: 2, timer: Infinity, weather: 'clear' });
  for (let k = 0; k < 700 && g.roundState !== 'fight'; k++) g.tick();

  const pair = g.activePair();
  const f = pair[0];
  console.log('f.def.id=', f.def.id, 'roundState=', g.roundState, 'pair ids:', pair.map(x=>x.def.id).join(','));
  const kit = f.currentKit();
  console.log('kit size:', kit.length);
  kit.forEach((p, i) => console.log(' ', i, p.id, 'slot=' + p.slot, 'row=' + p.row));

  // HUD: quantos botões de skill foram criados?
  const sk = w.document.getElementById('skills-0');
  console.log('hud skill buttons:', sk ? sk.querySelectorAll('.skill').length : 'n/a');

  // Touch: botões data-power visíveis?
  try { UI.updateTouchPowers && UI.updateTouchPowers(); } catch (e) { console.log('updateTouchPowers err', String(e)); }
  const tbtns = w.document.querySelectorAll('#touch-controls [data-power]');
  const vis = [...tbtns].map((b) => (+b.dataset.power) + (b.hidden ? '(hidden)' : '(vis)'));
  console.log('touch power buttons:', vis.join(' '));

  // Caminho real de input: tecla pressionada por 1 frame
  const codes = ['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0'];
  const results = [];
  let idx = 0;
  const runKey = () => {
    if (idx >= codes.length) { console.log('RESULT:', JSON.stringify(results, null, 1)); process.exit(0); }
    const code = codes[idx]; const i = idx++;
    f.alive = true; f.hp = 280; f.state = 'idle'; f.stateTime = 0;
    f.blocking = false; f.crouching = false; f.vx = 0; f.vy = 0; f.y = 0; f.onGround = true;
    f.charge = [100, 100]; f.ultimate = 100; f.afo = 6; f.stolen = null;
    f.cd = [0,0,0,0,0,0,0,0,0,0]; f.cast = null; f.rush = null; f.status = {}; f.buf = {};
    const ps = f.powerState(i);
    Input.keys.add(code); Input.pressed.add(code);
    g.tick();
    const buf1 = f.buf['a'+i], st1 = f.state, c1 = f.cast && f.cast.p.id;
    Input.keys.delete(code); Input.pressed.delete(code);
    for (let k = 0; k < 45; k++) g.tick();
    results.push({ key: code, i, power: kit[i] && kit[i].id, psReady: ps.ready, bufAfter1: buf1, stateAfter1: st1, castAfter1: c1,
      finalState: f.state, finalCast: f.cast && f.cast.p.id, cdAfter: f.cd.slice(0,10) });
    runKey();
  };
  runKey();
}, 3000);
