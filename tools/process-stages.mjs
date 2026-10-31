#!/usr/bin/env node
/**
 * Lê os GIFs do dono, procura silhuetas humanas, pinta um chão
 * em perspectiva e exporta spritesheets 960×540 (vizinho mais próximo).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG, encodePNG } from './slice-strip.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'assets/stages/source');
const outDir = join(root, 'assets/stages');
mkdirSync(outDir, { recursive: true });

const FW = 384;
const FH = 216;
const DW = 960;
const DH = 540;

const FLOORS = {
  '01-centro-de-dados': { y: 162, a: [8, 12, 28], b: [14, 20, 42], g: [36, 88, 140] },
  '02-chuva-de-codigo': { y: 178, a: [2, 10, 4], b: [6, 22, 10], g: [24, 90, 40] },
  '03-laboratorio-95': { y: 148, a: [148, 140, 126], b: [168, 158, 144], g: [110, 100, 88] },
  '04-neon-city-exe': { y: 156, a: [8, 6, 24], b: [16, 12, 36], g: [48, 36, 84] },
  '05-fight-exe': { y: 162, a: [2, 12, 4], b: [4, 22, 8], g: [16, 64, 24] },
  '06-fabrica-de-bugs': { y: 150, a: [26, 26, 34], b: [40, 40, 48], g: [18, 18, 24] },
  '07-placa-mae': { y: 172, a: [8, 36, 22], b: [14, 52, 30], g: [40, 110, 48] },
  '08-startup-3am': { y: 150, a: [42, 28, 18], b: [62, 40, 26], g: [28, 18, 12] },
  '09-deploy-nas-nuvens': { y: 154, a: [46, 124, 56], b: [70, 158, 78], g: [28, 88, 40] },
  '10-arena-git': { y: 160, a: [14, 8, 26], b: [26, 14, 42], g: [64, 36, 84] },
};

function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : v | 0; }

function components(pix, w, h, pred) {
  const seen = new Uint8Array(w * h);
  const found = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (seen[i] || !pred(x, y)) continue;
      const stack = [i];
      seen[i] = 1;
      let n = 0; let minx = x; let maxx = x; let miny = y; let maxy = y;
      const cells = [];
      while (stack.length) {
        const p = stack.pop();
        const px = p % w; const py = (p / w) | 0;
        cells.push(p); n++;
        if (px < minx) minx = px; if (px > maxx) maxx = px;
        if (py < miny) miny = py; if (py > maxy) maxy = py;
        for (const d of [1, -1, w, -w]) {
          const q = p + d;
          if (q < 0 || q >= w * h || seen[q]) continue;
          const qx = q % w; const qy = (q / w) | 0;
          if (Math.abs(qx - px) + Math.abs(qy - py) !== 1) continue;
          if (!pred(qx, qy)) continue;
          seen[q] = 1;
          stack.push(q);
        }
      }
      found.push({ n, minx, maxx, miny, maxy, w: maxx - minx + 1, h: maxy - miny + 1, cells });
    }
  }
  return found;
}

function removeFigures(pix, w, h) {
  let removed = 0;
  const pred = (x, y) => {
    if (y < 70 || y > h - 8) return false;
    const i = (y * w + x) * 4;
    const r = pix[i]; const g = pix[i + 1]; const b = pix[i + 2];
    const lum = r + g + b;
    // silhueta escura, quase preta, em cima de um chão mais claro
    if (lum > 48) return false;
    let lighter = 0;
    for (const dx of [-6, 6]) {
      const xx = x + dx;
      if (xx < 0 || xx >= w) continue;
      const j = (y * w + xx) * 4;
      if (pix[j] + pix[j + 1] + pix[j + 2] > lum + 36) lighter++;
    }
    return lighter > 0;
  };
  const blobs = components(pix, w, h, pred).filter((c) =>
    c.n >= 18 && c.h >= 14 && c.h <= 52 && c.w >= 6 && c.w <= 26 && c.h > c.w * 1.15
  );
  for (const blob of blobs) {
    for (const p of blob.cells) {
      const x = p % w;
      const y = (p / w) | 0;
      const srcX = x < w / 2 ? Math.min(w - 1, blob.maxx + 4) : Math.max(0, blob.minx - 4);
      const s = (y * w + srcX) * 4;
      const d = p * 4;
      pix[d] = pix[s]; pix[d + 1] = pix[s + 1]; pix[d + 2] = pix[s + 2];
    }
    removed++;
  }
  return removed;
}

function paintFloor(pix, w, h, spec) {
  const y0 = spec.y;
  const vx = (w - 1) / 2;
  for (let y = y0; y < h; y++) {
    const t = (y - y0) / Math.max(1, h - 1 - y0);
    const depth = Math.pow(t, 0.62);
    const shade = 0.62 + 0.5 * t;
    const half = 6 + depth * w * 0.62;
    const v = Math.floor(depth * 12);
    const rowEdge = Math.abs(depth * 12 - v) < 0.11;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const lum = pix[i] + pix[i + 1] + pix[i + 2];
      // preserva letreiro, LED e detalhe claro que invade o chão
      if (lum > 150) continue;
      const u = (x - vx) / half;
      const col = Math.floor(u + 64);
      const grout = rowEdge || Math.abs(u - Math.round(u)) < (0.045 + (1 - depth) * 0.02);
      const base = ((v + col) & 1) ? spec.a : spec.b;
      const c = grout ? spec.g : base;
      pix[i] = clamp(c[0] * shade);
      pix[i + 1] = clamp(c[1] * shade);
      pix[i + 2] = clamp(c[2] * shade);
      pix[i + 3] = 255;
    }
  }
  // faixa de contato onde os pés apoiam (mais escura)
  const stand = Math.round(y0 + (h - y0) * 0.72);
  for (let y = stand; y < Math.min(h, stand + 3); y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      pix[i] = clamp(pix[i] * 0.72);
      pix[i + 1] = clamp(pix[i + 1] * 0.72);
      pix[i + 2] = clamp(pix[i + 2] * 0.72);
    }
  }
}

function upscale(src, sw, sh) {
  const out = new Uint8ClampedArray(DW * DH * 4);
  for (let y = 0; y < DH; y++) {
    const sy = Math.min(sh - 1, (y * sh / DH) | 0);
    for (let x = 0; x < DW; x++) {
      const sx = Math.min(sw - 1, (x * sw / DW) | 0);
      const s = (sy * sw + sx) * 4;
      const d = (y * DW + x) * 4;
      out[d] = src[s]; out[d + 1] = src[s + 1]; out[d + 2] = src[s + 2]; out[d + 3] = 255;
    }
  }
  return out;
}

const gifs = readdirSync(src).filter((f) => f.endsWith('.gif')).sort();
const frameRoot = '/tmp/ds-stage-frames';
for (const gif of gifs) {
  const id = gif.replace(/\.gif$/, '');
  const frameDir = join(frameRoot, id);
  mkdirSync(frameDir, { recursive: true });
  execFileSync('ffmpeg', ['-y', '-i', join(src, gif), join(frameDir, '%02d.png')], { stdio: 'ignore' });
}
let totalFigures = 0;
for (const gif of gifs) {
  const id = gif.replace(/\.gif$/, '');
  const spec = FLOORS[id];
  if (!spec) throw new Error('sem piso para ' + id);
  const frameDir = join(frameRoot, id);
  const frames = readdirSync(frameDir).filter((f) => f.endsWith('.png')).sort();
  if (frames.length !== 24) throw new Error(id + ' frames ' + frames.length);
  const sheetW = DW * 6;
  const sheetH = DH * 4;
  const sheet = new Uint8ClampedArray(sheetW * sheetH * 4);
  let figures = 0;
  frames.forEach((file, k) => {
    const img = decodePNG(readFileSync(join(frameDir, file)));
    figures += removeFigures(img.pix, img.w, img.h);
    paintFloor(img.pix, img.w, img.h, spec);
    const big = upscale(img.pix, img.w, img.h);
    const col = k % 6;
    const row = (k / 6) | 0;
    for (let y = 0; y < DH; y++) {
      const destRow = row * DH + y;
      const destOff = (destRow * sheetW + col * DW) * 4;
      sheet.set(big.subarray(y * DW * 4, (y + 1) * DW * 4), destOff);
    }
  });
  const out = join(outDir, id + '.png');
  writeFileSync(out, encodePNG(sheetW, sheetH, sheet));
  totalFigures += figures;
  console.log(id, 'silhuetas', figures);
}
console.log('total silhuetas removidas', totalFigures);

const manifest = `/* Gerado por tools/process-stages.mjs */
const STAGE_SHEETS = ${JSON.stringify(gifs.map((g) => {
  const id = g.replace(/\.gif$/, '');
  const names = {
    '01-centro-de-dados': 'Centro de Dados',
    '02-chuva-de-codigo': 'Chuva de Código',
    '03-laboratorio-95': 'Laboratório 95',
    '04-neon-city-exe': 'Neon City.exe',
    '05-fight-exe': 'Fight.exe',
    '06-fabrica-de-bugs': 'Fábrica de Bugs',
    '07-placa-mae': 'Placa-Mãe',
    '08-startup-3am': 'Startup 3am',
    '09-deploy-nas-nuvens': 'Deploy nas Nuvens',
    '10-arena-git': 'Arena Git',
  };
  return {
    id,
    name: names[id],
    sheet: 'assets/stages/' + id + '.png',
    cols: 6,
    rows: 4,
    frames: 24,
    fps: 10,
    frameW: DW,
    frameH: DH,
  };
}), null, 2)};
`;
writeFileSync(join(outDir, 'sheets.js'), manifest);
