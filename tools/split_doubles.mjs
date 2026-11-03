#!/usr/bin/env node
/* ============================================================
   DS FIGHTERS — detector de "sprite duplo" nas folhas.

   O bug do sprite duplicado é arte: algumas células têm DUAS
   figuras (ex.: nina-vector traz a Nina e um mecha lado a lado),
   então um único blit mostra dois personagens.

   Aqui cada célula é separada em componentes conexos e o script
   acusa quando existe um "segundo corpo" grande o bastante para
   parecer outro boneco. Com --fix mantém só o maior componente
   (o personagem) e reancora o pé/centro.

   Uso:
     node tools/split_doubles.mjs            # só relatório
     node tools/split_doubles.mjs --fix      # conserta as folhas
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG, layoutIds, CW, CH, POSES } from './png_probe.mjs';
import { encodePNG } from './png_util.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPR = path.join(ROOT, 'assets/sprites');
const FIX = process.argv.includes('--fix');
const MIN_AREA = 0.14;   // 14% da maior figura já parece "outro boneco"
const FEET = 245;

/* componentes conexos (4-vizinhos) dentro de uma célula */
function components(img, col, row) {
  const x0 = col * CW, y0 = row * CH;
  const seen = new Uint8Array(CW * CH);
  const out = [];
  const alpha = (x, y) => img.data[((y0 + y) * img.width + (x0 + x)) * 4 + 3] > 8;
  for (let y = 0; y < CH; y++) {
    for (let x = 0; x < CW; x++) {
      const idx = y * CW + x;
      if (seen[idx] || !alpha(x, y)) continue;
      const stack = [[x, y]];
      seen[idx] = 1;
      let area = 0, minX = x, maxX = x, minY = y, maxY = y;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        area++;
        if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
        const nb = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
        for (const [nx, ny] of nb) {
          if (nx < 0 || ny < 0 || nx >= CW || ny >= CH) continue;
          const ni = ny * CW + nx;
          if (seen[ni] || !alpha(nx, ny)) continue;
          seen[ni] = 1;
          stack.push([nx, ny]);
        }
      }
      out.push({ area, minX, maxX, minY, maxY });
    }
  }
  return out.sort((a, b) => b.area - a.area);
}

let flagged = 0, fixed = 0;
for (const id of layoutIds()) {
  const file = path.join(SPR, `${id}.png`);
  if (!fs.existsSync(file)) continue;
  const img = decodePNG(fs.readFileSync(file));
  const sheet = Buffer.from(img.data);
  let changed = 0;
  for (let r = 0; r < POSES.length; r++) {
    for (let c = 0; c < 4; c++) {
      const comps = components(img, c, r).filter((k) => k.area > 40);
      if (comps.length < 2) continue;
      const biggest = comps[0];
      const extras = comps.slice(1).filter((k) => k.area >= biggest.area * MIN_AREA);
      if (!extras.length) continue;
      flagged++;
      console.log(`${id}.${POSES[r]}#${c}: ${comps.length} corpos (maior ${biggest.area}px, extras ${extras.map((e) => e.area).join('/')})`);
      if (!FIX) continue;
      // apaga os corpos extras (mantém o maior = o personagem)
      for (const e of extras) {
        for (let y = e.minY; y <= e.maxY; y++) {
          for (let x = e.minX; x <= e.maxX; x++) {
            const pi = ((r * CH + y) * img.width + (c * CW + x)) * 4;
            sheet[pi + 3] = 0;
          }
        }
      }
      changed++;
      fixed++;
    }
  }
  if (FIX && changed) {
    fs.writeFileSync(file, encodePNG({ width: img.width, height: img.height, data: sheet }));
  }
}
console.log(`\n${flagged} celula(s) com sprite duplo${FIX ? `, ${fixed} corrigida(s)` : ' (use --fix)'}`);
