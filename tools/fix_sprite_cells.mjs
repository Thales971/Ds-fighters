#!/usr/bin/env node
/* ============================================================
   DS FIGHTERS — conserta células defeituosas das folhas de sprite.

   Para cada pose (linha) de cada folha:
     1. mede a caixa do desenho em cada frame (320x260)
     2. se um frame está muito maior/menor que a mediana da pose
        (o clássico "o boneco fica gigante no frame 3"), reescala
        esse conteúdo para a mediana — sem gerar arte nova
     3. se o desenho estoura a célula (membro cortado na borda),
        encolhe até caber com 2px de margem
     4. reancora: pé em y=245 (nunca dentro da terra) e centro x=160

   Célula que já está boa não é tocada (fica byte a byte igual).

   Uso: node tools/fix_sprite_cells.mjs [--dry] [id ...]
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG, cellBox, layoutIds, CW, CH, POSES } from './png_probe.mjs';
import { encodePNG } from './png_util.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPR = path.join(ROOT, 'assets/sprites');
const FEET = 245;          // 1px acima da baseline 246
const MARGIN = 2;
const POP = 0.15;          // 15% de diferença entre frames já é pop visível

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const ids = args.filter((a) => !a.startsWith('--'));
if (!ids.length) ids.push(...layoutIds());

const CELL = CW * CH;

/* escala nearest-neighbour do conteúdo de uma célula para um destino */
function placeCell(src, img, box, col, row) {
  const out = Buffer.alloc(CELL * 4);
  if (!box) return out;
  const ox = col * CW, oy = row * CH;
  const { x0, y0, x1, y1 } = box;
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = ((oy + y0 + y) * img.width + (ox + x0 + x)) * 4;
      const d = (y * CW + x) * 4;
      out[d] = src[s]; out[d + 1] = src[s + 1]; out[d + 2] = src[s + 2]; out[d + 3] = src[s + 3];
    }
  }
  return out;
}

function blitScaled(dst, src, sw, sh, dw, dh, ox, oy) {
  for (let y = 0; y < dh; y++) {
    const ty = oy + y;
    if (ty < 0 || ty >= CH) continue;
    const sy = Math.min(sh - 1, Math.floor(y * sh / dh));
    for (let x = 0; x < dw; x++) {
      const tx = ox + x;
      if (tx < 0 || tx >= CW) continue;
      const sx = Math.min(sw - 1, Math.floor(x * sw / dw));
      // src é um buffer de célula inteira (stride CW), não sw
      const s = (sy * CW + sx) * 4;
      if (src[s + 3] < 8) continue;
      const d = (ty * CW + tx) * 4;
      dst[d] = src[s]; dst[d + 1] = src[s + 1]; dst[d + 2] = src[s + 2]; dst[d + 3] = src[s + 3];
    }
  }
}

let touchedCells = 0, touchedSheets = 0;
for (const id of ids) {
  const file = path.join(SPR, `${id}.png`);
  if (!fs.existsSync(file)) { console.log(`${id}: arquivo ausente`); continue; }
  const img = decodePNG(fs.readFileSync(file));
  const sheet = Buffer.from(img.data);
  let changed = 0;

  for (let r = 0; r < POSES.length; r++) {
    const boxes = [0, 1, 2, 3].map((c) => cellBox(img, c, r));
    const used = boxes.filter((b) => !b.empty);
    if (!used.length) continue;
    const heights = used.map((b) => b.h).sort((a, b) => a - b);
    const med = heights[(heights.length - 1) >> 1];

    for (let c = 0; c < 4; c++) {
      const b = boxes[c];
      if (!b) continue;
      const ratio = med / b.h;
      const pop = ratio > 1 + POP || ratio < 1 - POP;
      const clipped = b.touchL || b.touchR || b.touchT || b.touchB;
      const sunk = b.y1 > 246;               // pé dentro da terra
      if (!pop && !clipped && !sunk) continue;   // célula sadia: não toca
      let s = pop ? ratio : 1;
      let nw = b.w * s, nh = b.h * s;
      const maxW = CW - MARGIN * 2, maxH = CH - MARGIN * 2;
      if (nw > maxW || nh > maxH) {
        const k = Math.min(maxW / nw, maxH / nh);
        s *= k; nw *= k; nh *= k;
      }
      nw = Math.max(1, Math.round(nw)); nh = Math.max(1, Math.round(nh));
      const ox = Math.round(160 - nw / 2);
      const oy = FEET - nh;
      const already = Math.abs(s - 1) < 1e-6
        && Math.abs(b.x0 - ox) <= 1 && Math.abs(b.y1 - oy - nh) <= 1;
      if (already) continue;

      const cell = placeCell(img.data, img, b, c, r);
      const fixed = Buffer.alloc(CELL * 4);
      blitScaled(fixed, cell, b.w, b.h, nw, nh, ox, oy);
      const base = r * CH * img.width * 4 + c * CW * 4;
      for (let y = 0; y < CH; y++) {
        fixed.copy(sheet, base + y * img.width * 4, y * CW * 4, y * CW * 4 + CW * 4);
      }
      changed++;
    }
  }

  if (!changed) continue;
  touchedSheets++; touchedCells += changed;
  if (DRY) { console.log(`${id}: ${changed} celula(s) seriam corrigidas`); continue; }
  fs.writeFileSync(file, encodePNG({ width: img.width, height: img.height, data: sheet }));
  console.log(`${id}: ${changed} celula(s) corrigidas`);
}
console.log(`\n${touchedCells} celulas em ${touchedSheets} folhas${DRY ? ' (simulacao)' : ''}`);
