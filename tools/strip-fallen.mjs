#!/usr/bin/env node
/**
 * Tira corpos caídos que vieram desenhados dentro do quadro do golpe.
 * Mantém o lutador em pé e apaga o segundo boneco, baixo e deitado.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { decodePNG, encodePNG } from './slice-strip.mjs';

const FW = 320;
const FH = 260;

function partsOf(img, col, row) {
  const seen = new Uint8Array(FW * FH);
  const found = [];
  const x0 = col * FW;
  const y0 = row * FH;
  for (let y = 0; y < FH; y++) {
    for (let x = 0; x < FW; x++) {
      const li = y * FW + x;
      if (seen[li]) continue;
      const si = ((y0 + y) * img.w + (x0 + x)) * 4;
      if (img.pix[si + 3] < 20) { seen[li] = 1; continue; }
      const stack = [li];
      seen[li] = 1;
      const cells = [];
      let n = 0; let minx = x; let maxx = x; let miny = y; let maxy = y;
      while (stack.length) {
        const p = stack.pop();
        const px = p % FW; const py = (p / FW) | 0;
        cells.push(p); n++;
        if (px < minx) minx = px; if (px > maxx) maxx = px;
        if (py < miny) miny = py; if (py > maxy) maxy = py;
        for (const d of [1, -1, FW, -FW]) {
          const q = p + d;
          if (q < 0 || q >= FW * FH || seen[q]) continue;
          const qx = q % FW; const qy = (q / FW) | 0;
          if (Math.abs(qx - px) + Math.abs(qy - py) !== 1) continue;
          const sj = ((y0 + qy) * img.w + (x0 + qx)) * 4;
          if (img.pix[sj + 3] < 20) { seen[q] = 1; continue; }
          seen[q] = 1;
          stack.push(q);
        }
      }
      if (n > 30) found.push({ n, minx, maxx, miny, maxy, w: maxx - minx + 1, h: maxy - miny + 1, cells });
    }
  }
  return found;
}

const files = readdirSync('assets/sprites').filter((f) => f.endsWith('.png') && f !== 'elenco.png');
for (const file of files) {
  const img = decodePNG(readFileSync('assets/sprites/' + file));
  const rows = (img.h / FH) | 0;
  const cols = (img.w / FW) | 0;
  let removed = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const parts = partsOf(img, c, r).sort((a, b) => b.n - a.n);
      if (parts.length < 2) continue;
      const main = parts[0];
      for (const p of parts.slice(1)) {
        const low = p.miny > FH * 0.45;
        const flat = p.h < p.w * 0.85 && p.h < 120;
        if (low && flat && p.n < main.n * 0.85 && main.h > 100) {
          for (const cell of p.cells) {
            const x = cell % FW;
            const y = (cell / FW) | 0;
            img.pix[((r * FH + y) * img.w + (c * FW + x)) * 4 + 3] = 0;
          }
          removed++;
        }
      }
    }
  }
  if (removed) {
    writeFileSync('assets/sprites/' + file, encodePNG(img.w, img.h, img.pix));
    console.log(file, 'deitados', removed);
  }
}

for (const file of files) {
  const img = decodePNG(readFileSync('assets/sprites/' + file));
  const rows = (img.h / FH) | 0;
  const cols = (img.w / FW) | 0;
  let removed = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tall = partsOf(img, c, r).filter((p) => p.h > 130 && p.n > 800).sort((a, b) => b.n - a.n);
      if (tall.length < 2) continue;
      for (const extra of tall.slice(1)) {
        for (const cell of extra.cells) {
          const x = cell % FW;
          const y = (cell / FW) | 0;
          img.pix[((r * FH + y) * img.w + (c * FW + x)) * 4 + 3] = 0;
        }
        removed++;
      }
    }
  }
  if (removed) {
    writeFileSync('assets/sprites/' + file, encodePNG(img.w, img.h, img.pix));
    console.log(file, 'extras em pé', removed);
  }
}
