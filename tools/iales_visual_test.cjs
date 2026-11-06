// Auditoria das 10 habilidades do IALES: cast real + screenshots em 3 momentos.
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
  const outDir = path.join(ROOT, '.vibe', 'iales-abils');
  fs.mkdirSync(outDir, { recursive: true });

  UI.show('fight');
  const wrap = w.document.getElementById('stage-wrap');
  if (wrap) wrap.classList.add('on');
  g.start({ mode: 'training', teams: [['iales'], ['boneco-treino']], stage: 'treino-dojo', cpu: [false, false], dummy: 'stand', roundsToWin: 2, timer: Infinity, weather: 'clear' });
  for (let k = 0; k < 700 && g.roundState !== 'fight'; k++) g.tick();

  const pair = g.activePair();
  const f = pair[0], o = pair[1];
  const kit = f.currentKit();
  console.log('kit size:', kit.length);

  const results = [];
  let i = 0;
  const step = () => {
    if (i >= kit.length) {
      console.log('SUMMARY:', JSON.stringify(results, null, 1));
      process.exit(0);
    }
    const idx = i++;
    const p = kit[idx];
    try {
      f.x = 320; o.x = 620; f.y = 0; o.y = 0;
      f.alive = true; f.hp = 280; f.state = 'idle'; f.stateTime = 0;
      f.blocking = false; f.crouching = false; f.vx = 0; f.vy = 0; f.onGround = true;
      f.charge = [100, 100]; f.ultimate = 100; f.afo = 6; f.stolen = null;
      f.cd = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; f.cast = null; f.rush = null; f.status = {};
      o.hp = o.maxHp; o.alive = true; o.state = 'idle'; o.status = {}; o.stolen = null;
      const castOk = f.tryCast(idx);
      const shots = [];
      const snap = (tag) => {
        g.render && g.render();
        shots.push(path.join(outDir, `ab${idx}-${p.id}-${tag}.png`));
        fs.writeFileSync(shots[shots.length - 1], gameCanvas.toBuffer('image/png'));
      };
      for (let t = 0; t < 90; t++) {
        g.tick();
        if (t === 4) snap('start');
        if (t === 30) snap('mid');
        if (t === 60) snap('impact');
      }
      const fxCounts = {
        projectiles: g.projectiles ? g.projectiles.length : 'n/a',
        strikes: g.strikes ? g.strikes.length : 'n/a',
        beams: g.beams ? g.beams.length : 'n/a',
      };
      const oStatus = Object.keys(o.status || {}).filter((k) => (o.status[k] || 0) > 0);
      results.push({ i: idx, id: p.id, name: p.name, castOk, dmgDealt: Math.round(o.maxHp - o.hp), statusesOnDummy: oStatus, fx: fxCounts, shots: shots.length, stateF: f.state });
      console.log(`[${idx}] ${p.name}: cast=${castOk} dmg=${Math.round(o.maxHp - o.hp)} status=[${oStatus.join(',')}]`);
    } catch (e) { console.error('erro abil', idx, String(e).slice(0, 200)); }
    setTimeout(step, 30);
  };
  step();
}, 3000);
