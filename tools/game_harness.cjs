// DS FIGHTERS — harness headless do jogo completo (jsdom + node-canvas).
// Roda o index.html real (todos os scripts), inicia lutas via DSGame.start(),
// avança ticks e salva PNGs do canvas de combate em .vibe/game/.
// Reproduz offline exatamente o que o navegador desenha: sprites, habilidades,
// dash/rastro, hit, ko, ult. Serve para "jogar sem browser" e caçar bugs visuais.
//
// Uso:
//   npm i canvas jsdom   (ou aponte req() para o caminho onde estão instalados)
//   node tools/game_harness.cjs [lutador] [oponente]
// Sem argumentos: roda os 10 suspeitos (grika, mis, meta, dandara, kimi,
// deepseek, nina, gemini, winx, urbano) em 8 cenários cada (H1-H4, ult, dash,
// hit, ko).
const fs = require('fs');
const path = require('path');
const vm = require('vm');
function req(name) {
  try { return require(name); } catch (e) { return require('/tmp/node_modules/' + name); }
}
const { JSDOM } = req('jsdom');
const { createCanvas, loadImage } = req('canvas');

const ROOT = '/workspace/github__Thales971__Ds-fighters';
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// canvas do jogo
const gameCanvas = createCanvas(960, 540);
gameCanvas.style = {};
gameCanvas.addEventListener = () => {};
gameCanvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 960, height: 540, right: 960, bottom: 540 });
gameCanvas.naturalWidth = 960; gameCanvas.naturalHeight = 540;

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
    w.HTMLCanvasElement.prototype.toBuffer = () => gameCanvas.toBuffer('image/png');
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
    w.realTimeouts = [];
    w.requestAnimationFrame = (cb) => setTimeout(cb, 16);
    w.AudioContext = undefined;
    w.Audio = class { play() { return Promise.resolve(); } pause() {} addEventListener() {} };
  },
});

const w = dom.window;
if (!w.Image) w.Image = RealImage;
if (!w.DSGame) {
  // scripts externos não rodam via file:// — executa manualmente na ordem do index.html
  const vm = require('vm');
  w.Image = RealImage;
  const scriptTags = html.match(/<script[^>]*src="([^"]+)"[^>]*>[\s\S]*?<\/script>/g) || [];
  const ctxGlobal = w;
  w.fetch = () => Promise.resolve({ ok: false, json: async () => ({}) });
  for (const t of scriptTags) {
    const src = t.match(/src="([^"]+)"/)[1].split('?')[0];
    const p = path.join(ROOT, src);
    if (!fs.existsSync(p)) { console.error('missing', src); continue; }
    try {
      vm.runInContext(fs.readFileSync(p, 'utf8'), dom.getInternalVMContext(), { filename: src });
    } catch (e) { console.error('erro em', src, String(e).slice(0, 150)); }
  }
  const inlines = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
  for (const code of inlines) {
    try { vm.runInContext(code.replace(/<\/?script>/g, ''), dom.getInternalVMContext()); } catch (e) { console.error('erro inline', String(e).slice(0, 150)); }
  }
}


// espera scripts inline+src executarem
setTimeout(() => {
  const vmc = dom.getInternalVMContext();
  const g = w.DSGame || vm.runInContext('DSGame', vmc);
  const UI = vm.runInContext('typeof UI === "undefined" ? null : UI', vmc);
  if (!g || !UI) { console.error('DSGame/UI ausentes', !!g, !!UI); process.exit(1); }
  const outDir = path.join(ROOT, '.vibe', 'game2');
  fs.mkdirSync(outDir, { recursive: true });
  const pairs = process.argv.length > 3
    ? [[process.argv[2], process.argv[3]]]
    : process.argv.length > 2
      ? [[process.argv[2], process.argv[2]]]
      : [
        ['mis', 'mis'], ['meta', 'meta'], ['dandara-query', 'dandara-query'],
        ['nina-vector', 'nina-vector'], ['gemini', 'gemini'], ['winx-exe', 'winx-exe'],
        ['urbano', 'urbano'], ['dev-veterano', 'dev-veterano'],
      ];
  let i = 0;
  const step = () => {
    if (i >= pairs.length) { console.log('pronto'); return; }
    const [a, b] = pairs[i++];
    try {
      UI.show('fight');
      const wrap = w.document.getElementById('stage-wrap');
      if (wrap) wrap.classList.add('on');
      g.start({ mode: 'versus', teams: [[a], [b]], stage: '06-sakura-dojo', cpu: [false, false], roundsToWin: 2, timer: 99, weather: 'clear' });
      for (let k = 0; k < 700 && g.roundState !== 'fight'; k++) g.tick();
      const shots = [
        ['idle', 60, null], ['h1', 26, 0], ['h2', 26, 1], ['h3', 26, 2],
        ['h4', 30, 3], ['ult', 60, 4],
      ];
      let j = 0;
      const sub = () => {
        if (j >= shots.length) { step(); return; }
        const [name, ticks, move] = shots[j++];
        try {
          const pair = g.activePair();
          const f = pair[0], o = pair[1];
          f.x = 380; o.x = 620; f.y = 0; o.y = 0;
          f.charge = [100, 100]; f.ultimate = 100;
          f.cd = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; f.afo = 6;
          if (move === 'block') { f.state = 'block'; f.stateTime = 20; f.blocking = true; }
          else if (move === 'walkback') { f.state = 'walk'; f.stateTime = 30; f.dir = 1; f.x = 480; }
          else if (move === 'crouch') { f.state = 'crouch'; f.stateTime = 20; }
          else if (move !== null) f.tryCast(move);
          for (let k = 0; k < ticks; k++) g.tick();
          g.render && g.render();
        } catch (e) { console.error('tick', a, b, name, String(e).slice(0, 200)); }
        fs.writeFileSync(path.join(outDir, `${a}-${b}-${name}.png`), gameCanvas.toBuffer('image/png'));
        console.log('shot', a, b, name);
        setTimeout(sub, 50);
      };
      sub();
    } catch (e) { console.error('pair', a, b, String(e).slice(0, 300)); step(); }
  };
  step();
}, 3000);
