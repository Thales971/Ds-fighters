// DS FIGHTERS — renderiza as 15 poses de um lutador com o SpriteGen.blit REAL
// (mesma matemática do jogo: célula 320x260, baseline 246, chão em y=458 do
// canvas 960x540). Gera .vibe/render/<id>.png para conferir pé-no-chão,
// tamanho e duplicação sem abrir navegador.
//
// Uso: node tools/render_poses.cjs grika mis ... (sem args = 10 suspeitos)
const fs = require('fs');
const path = require('path');
function req(name) { try { return require(name); } catch (e) { return require('/tmp/node_modules/' + name); } }
const { createCanvas, loadImage } = req('canvas');

const ROOT = '/workspace/github__Thales971__Ds-fighters';
const vm = require('vm');
const ctxGlobal = {
  window: {}, console,
  document: {
    createElement: () => { const c = createCanvas(320, 260); return c; },
    getElementById: () => null,
  },
  Image: class { constructor() { this._img = null; } set src(v) { this._src = v; } get src() { return this._src; } },
  setTimeout, clearTimeout,
};
ctxGlobal.global = ctxGlobal;
const sandbox = vm.createContext(ctxGlobal);

function load(file) {
  const code = fs.readFileSync(path.join(ROOT, file), 'utf8');
  vm.runInContext(code, sandbox, { filename: file });
}

load('assets/sprites/layout.js');
load('js/engine/sprites.js');

const SG = vm.runInContext('SpriteGen', sandbox);
const L = vm.runInContext('SPRITE_LAYOUT', sandbox);

// carrega imagens reais via node-canvas e injeta no SpriteGen
async function injectImages(ids) {
  for (const id of ids) {
    const img = await loadImage(path.join(ROOT, 'assets/sprites', id + '.png'));
    // reconcile espera naturalWidth/Height
    img.naturalWidth = img.width; img.naturalHeight = img.height;
    SG.images[id] = img;
    SG.reconcile(img, id);
  }
}

const GROUND_Y = 458;
const W = 960, H = 540;
const POSES = SG.POSES;

async function main() {
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['mis', 'meta', 'dandara-query', 'nina-vector', 'gemini', 'winx-exe', 'urbano'];
  await injectImages(ids);
  fs.mkdirSync(path.join(ROOT, '.vibe', 'render'), { recursive: true });
  for (const id of ids) {
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#203050'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#3a5a3a'; ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, GROUND_Y, W, 2);
    ctx.font = '16px sans-serif'; ctx.fillStyle = '#fff';
    ctx.fillText(id + '  fixes=' + JSON.stringify(SG.fixes), 10, 20);
    ctx.translate(0, GROUND_Y);
    let x = 90;
    for (const pose of POSES) {
      const n = SG.count(pose, id);
      const frame = 0;
      SG.blit(ctx, id, pose, frame, 1, x, 0, false, null, null);
      ctx.fillStyle = '#ff0'; ctx.fillRect(x - 1, -2, 2, 4);
      x += Math.min(90, 900 / POSES.length * 1.5);
      if (x > W - 60) break;
    }
    fs.writeFileSync(path.join(ROOT, '.vibe', 'render', id + '.png'), canvas.toBuffer('image/png'));
    console.log('render', id, 'layout', L.frameW, L.frameH, L.baseline, L.drawScale);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
