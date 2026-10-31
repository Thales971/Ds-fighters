#!/usr/bin/env node
/**
 * Gera spritesheets de efeito (projétil, impacto, aura, ultimate, flash).
 * O jogo só blita esses PNG. Trocar o arquivo mantém o mesmo layout.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodePNG } from './slice-strip.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'assets/fx');
mkdirSync(outDir, { recursive: true });

const FW = 96;
const FH = 96;
const COLS = 8;
const ROWS = 5;

const ELEMENTS = {
  fogo: { shape: 'flame', core: [255, 244, 190], mid: [255, 110, 24], edge: [150, 28, 8], dark: [40, 6, 4] },
  gelo: { shape: 'shard', core: [240, 252, 255], mid: [150, 220, 255], edge: [40, 110, 200], dark: [8, 20, 48] },
  raio: { shape: 'bolt', core: [255, 255, 230], mid: [255, 220, 48], edge: [70, 130, 255], dark: [12, 12, 36] },
  vento: { shape: 'crescent', core: [236, 255, 244], mid: [110, 220, 160], edge: [30, 120, 90], dark: [6, 24, 16] },
  sombra: { shape: 'orb', core: [230, 200, 255], mid: [110, 40, 160], edge: [28, 8, 48], dark: [4, 0, 10] },
  veneno: { shape: 'drip', core: [220, 255, 140], mid: [70, 190, 36], edge: [16, 70, 12], dark: [4, 16, 4] },
  neon: { shape: 'panel', core: [255, 245, 255], mid: [255, 70, 190], edge: [40, 220, 255], dark: [10, 4, 24] },
  terra: { shape: 'rock', core: [236, 200, 130], mid: [168, 104, 48], edge: [84, 48, 24], dark: [24, 12, 8] },
  metal: { shape: 'gear', core: [245, 250, 255], mid: [176, 196, 214], edge: [70, 88, 108], dark: [16, 20, 28] },
  acido: { shape: 'bubble', core: [236, 255, 90], mid: [150, 210, 20], edge: [36, 90, 8], dark: [10, 22, 4] },
  tempo: { shape: 'clock', core: [255, 236, 180], mid: [80, 200, 255], edge: [36, 56, 140], dark: [8, 8, 24] },
  arcano: { shape: 'star', core: [255, 230, 255], mid: [176, 70, 255], edge: [255, 70, 140], dark: [18, 4, 28] },
  espirito: { shape: 'spirit', core: [255, 250, 220], mid: [255, 196, 70], edge: [170, 70, 30], dark: [32, 10, 4] },
};

function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : v | 0; }
function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function put(pix, w, x, y, col, a = 255) {
  x = x | 0; y = y | 0;
  if (x < 0 || y < 0 || x >= w || y >= FH) return;
  const i = (y * w + x) * 4;
  const sa = a / 255;
  const da = pix[i + 3] / 255;
  const outA = sa + da * (1 - sa);
  if (outA <= 0) return;
  pix[i] = clamp((col[0] * sa + pix[i] * da * (1 - sa)) / outA);
  pix[i + 1] = clamp((col[1] * sa + pix[i + 1] * da * (1 - sa)) / outA);
  pix[i + 2] = clamp((col[2] * sa + pix[i + 2] * da * (1 - sa)) / outA);
  pix[i + 3] = clamp(outA * 255);
}

function disc(pix, w, cx, cy, r, col, a = 255) {
  const rr = r * r;
  for (let y = -r - 1; y <= r + 1; y++) {
    for (let x = -r - 1; x <= r + 1; x++) {
      const d = x * x + y * y;
      if (d <= rr) put(pix, w, cx + x, cy + y, col, a);
    }
  }
}

function ring(pix, w, cx, cy, r, col, thick = 1.2) {
  for (let y = -r - 2; y <= r + 2; y++) {
    for (let x = -r - 2; x <= r + 2; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (Math.abs(d - r) <= thick) put(pix, w, cx + x, cy + y, col, 230);
    }
  }
}

function outline(pix, w) {
  const src = pix.slice();
  for (let y = 1; y < FH - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      if (src[i + 3] > 20) continue;
      let near = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const j = ((y + dy) * w + (x + dx)) * 4;
        if (src[j + 3] > 80) near = true;
      }
      if (near) put(pix, w, x, y, [8, 6, 12], 230);
    }
  }
}

function paintShape(pix, w, pal, shape, frame, cx, cy, scale, spin) {
  const s = scale;
  const ph = frame / 8 * Math.PI * 2 + spin;
  if (shape === 'flame') {
    disc(pix, w, cx, cy + 4 * s, 16 * s, pal.edge);
    disc(pix, w, cx, cy, 12 * s, pal.mid);
    disc(pix, w, cx, cy - 6 * s, 7 * s, pal.core);
    for (let i = 0; i < 5; i++) {
      const a = ph + i * 1.2;
      disc(pix, w, cx + Math.cos(a) * 14 * s, cy + Math.sin(a) * 10 * s - 8, 3 * s, i % 2 ? pal.core : pal.mid);
    }
  } else if (shape === 'shard') {
    for (let i = 0; i < 6; i++) {
      const a = ph + i * (Math.PI / 3);
      const len = (10 + (i % 3) * 4) * s;
      for (let t = 0; t < len; t++) {
        put(pix, w, cx + Math.cos(a) * t, cy + Math.sin(a) * t * 0.7, t < 4 ? pal.core : pal.mid);
      }
    }
    disc(pix, w, cx, cy, 5 * s, pal.core);
  } else if (shape === 'bolt') {
    let x = cx - 8 * s; let y = cy - 16 * s;
    const pts = [[0, 0], [6, 8], [2, 8], [10, 22], [4, 14], [8, 14], [-2, 0]];
    for (const [px, py] of pts) {
      for (let t = 0; t < 8; t++) put(pix, w, x + px * s + (t % 3) - 1, y + py * s, t < 2 ? pal.core : pal.mid);
    }
    disc(pix, w, cx, cy, 4 * s, pal.core);
    disc(pix, w, cx + Math.cos(ph) * 12, cy + 8, 2, pal.edge);
  } else if (shape === 'crescent') {
    ring(pix, w, cx, cy, 12 * s, pal.mid, 2);
    disc(pix, w, cx + 4, cy, 8 * s, pal.dark, 255);
    disc(pix, w, cx - 6 * s, cy, 3 * s, pal.core);
    for (let i = 0; i < 4; i++) {
      const a = ph + i;
      disc(pix, w, cx + Math.cos(a) * 16 * s, cy + Math.sin(a) * 8 * s, 2, pal.edge);
    }
  } else if (shape === 'drip') {
    disc(pix, w, cx, cy - 2, 11 * s, pal.mid);
    disc(pix, w, cx, cy - 6, 6 * s, pal.core);
    disc(pix, w, cx, cy + 12 * s + (frame % 4) * 2, 4 * s, pal.edge);
    disc(pix, w, cx - 7, cy + 4, 3 * s, pal.edge);
  } else if (shape === 'panel') {
    for (let y = -10 * s; y <= 10 * s; y++) {
      for (let x = -14 * s; x <= 14 * s; x++) {
        const border = Math.abs(x) > 12 * s || Math.abs(y) > 8 * s;
        put(pix, w, cx + x, cy + y, border ? pal.edge : (y < -2 ? pal.core : pal.mid), border ? 255 : 180);
      }
    }
  } else if (shape === 'rock') {
    disc(pix, w, cx, cy, 13 * s, pal.edge);
    disc(pix, w, cx - 3, cy - 3, 8 * s, pal.mid);
    disc(pix, w, cx - 5, cy - 5, 3 * s, pal.core);
    disc(pix, w, cx + 6, cy + 4, 4 * s, pal.dark);
  } else if (shape === 'gear') {
    ring(pix, w, cx, cy, 12 * s, pal.mid, 3);
    disc(pix, w, cx, cy, 5 * s, pal.dark);
    for (let i = 0; i < 8; i++) {
      const a = ph + i * (Math.PI / 4);
      disc(pix, w, cx + Math.cos(a) * 14 * s, cy + Math.sin(a) * 14 * s, 3 * s, pal.core);
    }
  } else if (shape === 'bubble') {
    ring(pix, w, cx, cy, 12 * s, pal.mid, 1.6);
    disc(pix, w, cx - 4, cy - 4, 3, pal.core);
    disc(pix, w, cx + 6, cy + 2, 4 * s, pal.edge, 160);
  } else if (shape === 'clock') {
    ring(pix, w, cx, cy, 13 * s, pal.edge, 1.6);
    disc(pix, w, cx, cy, 3, pal.core);
    const a = ph;
    for (let t = 0; t < 11 * s; t++) put(pix, w, cx + Math.cos(a) * t, cy + Math.sin(a) * t, pal.mid);
    for (let t = 0; t < 7 * s; t++) put(pix, w, cx + Math.cos(a * 0.3) * t, cy + Math.sin(a * 0.3) * t, pal.core);
  } else if (shape === 'star') {
    for (let i = 0; i < 8; i++) {
      const a = ph * 0.5 + i * (Math.PI / 4);
      const len = (i % 2 ? 16 : 8) * s;
      for (let t = 0; t < len; t++) put(pix, w, cx + Math.cos(a) * t, cy + Math.sin(a) * t, t < 3 ? pal.core : pal.mid);
    }
    disc(pix, w, cx, cy, 4 * s, pal.core);
  } else if (shape === 'spirit') {
    disc(pix, w, cx, cy + 2, 12 * s, pal.edge, 140);
    disc(pix, w, cx, cy - 2, 8 * s, pal.mid, 200);
    disc(pix, w, cx, cy - 6, 4 * s, pal.core);
    ring(pix, w, cx, cy, 16 * s, pal.mid, 1);
  } else {
    disc(pix, w, cx, cy, 12 * s, pal.edge);
    disc(pix, w, cx, cy, 8 * s, pal.mid);
    disc(pix, w, cx - 3, cy - 3, 3 * s, pal.core);
    for (let i = 0; i < 4; i++) {
      const a = ph + i * 1.6;
      disc(pix, w, cx + Math.cos(a) * 14 * s, cy + Math.sin(a) * 14 * s, 2, pal.core);
    }
  }
}

function blank(w) {
  return new Uint8ClampedArray(w * FH * 4);
}

function cell(pal, shape, clip, frame) {
  const pix = blank(FW);
  const cx = FW / 2;
  const cy = FH / 2;
  if (clip === 'projectile') {
    paintShape(pix, FW, pal, shape, frame, cx, cy, 1, 0);
  } else if (clip === 'impact') {
    const grow = 6 + frame * 4;
    ring(pix, FW, cx, cy, grow, frame < 2 ? pal.core : pal.mid, 2);
    disc(pix, FW, cx, cy, Math.max(2, 10 - frame * 2), pal.core, 200 - frame * 30);
    for (let i = 0; i < 8; i++) {
      const a = i * 0.8 + frame * 0.2;
      disc(pix, FW, cx + Math.cos(a) * grow, cy + Math.sin(a) * grow, 2, pal.edge);
    }
  } else if (clip === 'aura') {
    ring(pix, FW, cx, cy, 22 + Math.sin(frame) * 2, pal.mid, 2);
    ring(pix, FW, cx, cy, 30, pal.edge, 1);
    for (let i = 0; i < 6; i++) {
      const a = frame * 0.4 + i;
      disc(pix, FW, cx + Math.cos(a) * 26, cy + Math.sin(a) * 26, 2.4, pal.core);
    }
  } else if (clip === 'ultimate') {
    disc(pix, FW, cx, cy, 18 + frame, pal.mid, 180);
    disc(pix, FW, cx, cy, 8, pal.core);
    for (let i = 0; i < 12; i++) {
      const a = frame * 0.3 + i * 0.52;
      const len = 20 + (i % 3) * 8 + frame;
      for (let t = 8; t < len; t++) put(pix, FW, cx + Math.cos(a) * t, cy + Math.sin(a) * t, t < 14 ? pal.core : pal.edge);
    }
    paintShape(pix, FW, pal, shape, frame, cx, cy, 0.7, 1);
  } else {
    const a = 220 - frame * 40;
    disc(pix, FW, cx, cy, 40 - frame * 4, pal.core, a);
    disc(pix, FW, cx, cy, 18, pal.mid, a);
  }
  outline(pix, FW);
  return pix;
}

const clips = [
  ['projectile', 8],
  ['impact', 6],
  ['aura', 8],
  ['ultimate', 8],
  ['flash', 4],
];

const sheetW = FW * COLS;
const sheetH = FH * ROWS;
const names = Object.keys(ELEMENTS);

for (const name of names) {
  const pal = ELEMENTS[name];
  const sheet = new Uint8ClampedArray(sheetW * sheetH * 4);
  clips.forEach(([clip, count], row) => {
    for (let f = 0; f < COLS; f++) {
      if (f >= count) continue;
      const pix = cell(pal, pal.shape, clip, f);
      for (let y = 0; y < FH; y++) {
        const dest = ((row * FH + y) * sheetW + f * FW) * 4;
        sheet.set(pix.subarray(y * FW * 4, (y + 1) * FW * 4), dest);
      }
    }
  });
  writeFileSync(join(outDir, name + '.png'), encodePNG(sheetW, sheetH, sheet));
  console.log(name);
}

const layout = `/* Gerado por tools/gen-fx.mjs — troque o PNG, mantenha este recorte.
   Cada sheet tem ${COLS} colunas e ${ROWS} linhas de frames ${FW}×${FH}.
   Fundo transparente. O jogo lê o clipe pelo nome, não pela cor. */
const FX_LAYOUT = {
  frameW: ${FW},
  frameH: ${FH},
  cols: ${COLS},
  clips: {
    projectile: { row: 0, frames: 8 },
    impact: { row: 1, frames: 6 },
    aura: { row: 2, frames: 8 },
    ultimate: { row: 3, frames: 8 },
    flash: { row: 4, frames: 4 },
  },
  sheets: {
${names.map((n) => `    ${n}: 'assets/fx/${n}.png',`).join('\n')}
  },
};
`;
writeFileSync(join(outDir, 'layout.js'), layout);
