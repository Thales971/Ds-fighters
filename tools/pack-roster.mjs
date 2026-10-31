#!/usr/bin/env node
/** Monta as sprite sheets a partir das faixas magenta. */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG, keyMagenta, columnCounts, cropSprite, encodePNG } from './slice-strip.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = '/opt/cursor/artifacts/assets';
const tmp = '/tmp/art/roster';
mkdirSync(tmp, { recursive: true });
mkdirSync(join(root, 'assets/sprites'), { recursive: true });
mkdirSync(join(root, 'assets/ui'), { recursive: true });
mkdirSync(join(root, 'assets/fx'), { recursive: true });

const FILE = {
  du: 'du', iales: 'iales', felipinho: 'felipinho', stack: 'stack', gitmaster: 'git',
  bughunter: 'bug', frontend: 'front', backend: 'back', devops: 'devops', qa: 'qa',
  scrum: 'scrum', fullstack: 'full', senpai: 'senpai',
};

const POSES = ['idle', 'walk', 'jump', 'crouch', 'punch', 'kick', 'cpunch', 'ckick', 'jpunch', 'jkick', 'special', 'hit', 'block', 'ko', 'win'];

function regions(img) {
  const col = columnCounts(img);
  const regions = [];
  let s = null;
  for (let x = 0; x < col.length; x++) {
    if (col[x] >= 3 && s == null) s = x;
    if (col[x] < 3 && s != null) {
      if (x - s > 18) regions.push([s, x]);
      s = null;
    }
  }
  if (s != null && col.length - s > 18) regions.push([s, col.length]);
  const merged = [];
  for (const r of regions) {
    const p = merged[merged.length - 1];
    if (p && r[0] - p[1] < 14) p[1] = r[1];
    else merged.push([r[0], r[1]]);
  }
  return merged;
}

function loadStrip(jpgName) {
  const jpg = join(srcDir, jpgName);
  const png = join(tmp, jpgName.replace(/\.jpe?g$/, '.png'));
  if (!existsSync(png)) execFileSync('ffmpeg', ['-y', '-i', jpg, png], { stdio: 'ignore' });
  const keyed = keyMagenta(decodePNG(readFileSync(png)));
  const regs = regions(keyed);
  const sprites = regs.map(([a, b]) => cropSprite(keyed, a, b, 1)).filter(Boolean);
  // cropSprite com targetH 1 não serve. Recortar sem escala.
  return { keyed, regs };
}

function rawCrop(img, x0, x1) {
  const { w, h, pix } = img;
  let minY = h; let maxY = 0; let minX = x1; let maxX = x0;
  for (let y = 0; y < h; y++) {
    for (let x = x0; x < x1; x++) {
      if (pix[(y * w + x) * 4 + 3] > 40) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  if (maxY <= minY) return null;
  const sw = maxX - minX + 1;
  const sh = maxY - minY + 1;
  const out = new Uint8ClampedArray(sw * sh * 4);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const s = ((minY + y) * w + (minX + x)) * 4;
      const d = (y * sw + x) * 4;
      out[d] = pix[s]; out[d + 1] = pix[s + 1]; out[d + 2] = pix[s + 2]; out[d + 3] = pix[s + 3];
    }
  }
  return { w: sw, h: sh, pix: out };
}

function scaleSprite(sp, scale) {
  const dw = Math.max(1, Math.round(sp.w * scale));
  const dh = Math.max(1, Math.round(sp.h * scale));
  const out = new Uint8ClampedArray(dw * dh * 4);
  for (let y = 0; y < dh; y++) {
    const sy = Math.min(sp.h - 1, Math.floor(y / scale));
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(sp.w - 1, Math.floor(x / scale));
      const s = (sy * sp.w + sx) * 4;
      const d = (y * dw + x) * 4;
      out[d] = sp.pix[s]; out[d + 1] = sp.pix[s + 1]; out[d + 2] = sp.pix[s + 2]; out[d + 3] = sp.pix[s + 3];
    }
  }
  return { w: dw, h: dh, pix: out };
}

function take(img, n) {
  const regs = regions(img);
  console.log('  regioes', regs.length, regs.map((r) => r[1] - r[0]).join(','));
  let crops = regs.map(([a, b]) => rawCrop(img, a, b)).filter(Boolean);
  while (crops.length > n) {
    let si = 0;
    for (let i = 1; i < crops.length; i++) if (crops[i].w * crops[i].h < crops[si].w * crops[si].h) si = i;
    crops.splice(si, 1);
  }
  while (crops.length < n) crops.push(crops[crops.length - 1] || { w: 8, h: 8, pix: new Uint8ClampedArray(8 * 8 * 4) });
  return crops;
}

function footX(sp) {
  const y0 = Math.floor(sp.h * 0.78);
  let min = sp.w; let max = 0; let n = 0;
  for (let y = y0; y < sp.h; y++) {
    for (let x = 0; x < sp.w; x++) {
      if (sp.pix[(y * sp.w + x) * 4 + 3] > 40) {
        if (x < min) min = x;
        if (x > max) max = x;
        n++;
      }
    }
  }
  if (!n) return sp.w / 2;
  return (min + max) / 2;
}

const FW = 320;
const FH = 260;
const BASE = 246;

function blank() { return new Uint8ClampedArray(FW * FH * 4); }

function stamp(cell, sp) {
  const ax = footX(sp);
  const dx = Math.round(FW / 2 - ax);
  const dy = BASE - sp.h;
  for (let y = 0; y < sp.h; y++) {
    const ty = y + dy;
    if (ty < 0 || ty >= FH) continue;
    for (let x = 0; x < sp.w; x++) {
      const tx = x + dx;
      if (tx < 0 || tx >= FW) continue;
      const s = (y * sp.w + x) * 4;
      if (sp.pix[s + 3] < 16) continue;
      const d = (ty * FW + tx) * 4;
      cell[d] = sp.pix[s]; cell[d + 1] = sp.pix[s + 1]; cell[d + 2] = sp.pix[s + 2]; cell[d + 3] = 255;
    }
  }
}

function loadKeyed(name) {
  const png = join(tmp, name.replace(/\.jpe?g$/, '.png'));
  if (!existsSync(png)) execFileSync('ffmpeg', ['-y', '-i', join(srcDir, name), png], { stdio: 'ignore' });
  return keyMagenta(decodePNG(readFileSync(png)));
}

const files = {};
const frameCounts = {};
for (const pose of POSES) frameCounts[pose] = 0;

for (const id of Object.keys(FILE)) {
  const key = FILE[id];
  console.log(id);
  const moveImg = loadKeyed(`strip-${key}-move.jpg`);
  const atkImg = loadKeyed(`strip-${key}-atk.jpg`);
  const reactImg = loadKeyed(`strip-${key}-react.jpg`);
  const move = take(moveImg, 6);
  const atk = take(atkImg, 6);
  const react = take(reactImg, 6);
  const idleH = move[0].h || 200;
  const scale = 200 / idleH;
  const sc = (sp) => scaleSprite(sp, scale);
  const M = move.map(sc);
  const A = atk.map(sc);
  const R = react.map(sc);
  const seq = {
    idle: [M[0], M[1], M[0], M[1]],
    walk: [M[2], M[3], M[4], M[3]],
    jump: [M[5], M[5]],
    crouch: [A[3], A[3]],
    punch: [A[0], A[1], A[1], A[1]],
    kick: [A[2], A[5], A[5], A[5]],
    cpunch: [A[4], A[4]],
    ckick: [A[3], A[5], A[5]],
    jpunch: [A[0], A[1], A[1]],
    jkick: [A[2], A[5], A[5]],
    special: [R[4], R[4]],
    hit: [R[1], R[1]],
    block: [R[0], R[2]],
    ko: [R[5], R[5]],
    win: [R[3], R[3]],
  };
  const cols = Math.max(...POSES.map((p) => seq[p].length));
  const sheet = new Uint8ClampedArray(cols * FW * POSES.length * FH * 4);
  POSES.forEach((pose, row) => {
    frameCounts[pose] = Math.max(frameCounts[pose], seq[pose].length);
    seq[pose].forEach((sp, col) => {
      const cell = blank();
      stamp(cell, sp);
      for (let y = 0; y < FH; y++) {
        for (let x = 0; x < FW; x++) {
          const s = (y * FW + x) * 4;
          if (cell[s + 3] < 10) continue;
          const d = ((row * FH + y) * (cols * FW) + (col * FW + x)) * 4;
          sheet[d] = cell[s]; sheet[d + 1] = cell[s + 1]; sheet[d + 2] = cell[s + 2]; sheet[d + 3] = 255;
        }
      }
    });
  });
  const outName = `${id}.png`;
  writeFileSync(join(root, 'assets/sprites', outName), encodePNG(cols * FW, POSES.length * FH, sheet));
  files[id] = `assets/sprites/${outName}`;
  // retrato: topo do idle
  const idle = M[0];
  const ph = Math.round(idle.h * 0.48);
  const pw = idle.w;
  const port = new Uint8ClampedArray(pw * ph * 4);
  for (let i = 0; i < pw * ph * 4; i++) port[i] = idle.pix[i];
  writeFileSync(join(root, 'assets/ui', `portrait-${id}.png`), encodePNG(pw, ph, port));
  console.log('  ok escala', scale.toFixed(2), 'idle', M[0].w + 'x' + M[0].h);
}

const frames = {};
for (const pose of POSES) {
  const counts = { idle: 4, walk: 4, jump: 2, crouch: 2, punch: 4, kick: 4, cpunch: 2, ckick: 3, jpunch: 3, jkick: 3, special: 2, hit: 2, block: 2, ko: 2, win: 2 };
  frames[pose] = counts[pose];
}
const cols = Math.max(...Object.values(frames));
const layout = `/* Gerado por tools/pack-roster.mjs — não edite à mão. */
const SPRITE_LAYOUT = ${JSON.stringify({
  frameW: FW,
  frameH: FH,
  cols,
  baseline: BASE,
  drawScale: 1,
  poses: POSES,
  frames,
  files,
}, null, 2)};
`;
writeFileSync(join(root, 'assets/sprites/layout.js'), layout);

function paintBar(w, h, colors) {
  const pix = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1);
    const c = colors[Math.min(colors.length - 1, Math.floor(t * colors.length))];
    for (let x = 0; x < w; x++) {
      const d = (y * w + x) * 4;
      pix[d] = c[0]; pix[d + 1] = c[1]; pix[d + 2] = c[2]; pix[d + 3] = 255;
    }
  }
  return encodePNG(w, h, pix);
}
writeFileSync(join(root, 'assets/ui/life-fill.png'), paintBar(8, 24, [[210, 255, 190], [70, 220, 70], [30, 140, 40]]));
writeFileSync(join(root, 'assets/ui/life-ghost.png'), paintBar(8, 24, [[255, 230, 140], [240, 180, 40], [180, 120, 20]]));
writeFileSync(join(root, 'assets/ui/super-fill.png'), paintBar(8, 16, [[255, 210, 255], [200, 80, 255], [120, 40, 180]]));
writeFileSync(join(root, 'assets/ui/life-low.png'), paintBar(8, 24, [[255, 180, 160], [240, 50, 40], [160, 20, 20]]));

// moldura da barra
{
  const w = 48; const h = 32;
  const pix = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const edge = x < 4 || y < 4 || x >= w - 4 || y >= h - 4;
    const d = (y * w + x) * 4;
    if (!edge) { pix[d + 3] = 0; continue; }
    const gold = (x + y) % 6 < 3;
    pix[d] = gold ? 255 : 40; pix[d + 1] = gold ? 210 : 30; pix[d + 2] = gold ? 80 : 24; pix[d + 3] = 255;
  }
  writeFileSync(join(root, 'assets/ui/bar-frame.png'), encodePNG(w, h, pix));
}

// sombra
{
  const w = 80; const h = 24;
  const pix = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const nx = (x - w / 2) / (w / 2);
    const ny = (y - h / 2) / (h / 2);
    const e = nx * nx + ny * ny;
    const d = (y * w + x) * 4;
    pix[d + 3] = e < 1 ? Math.round(90 * (1 - e)) : 0;
  }
  writeFileSync(join(root, 'assets/fx/shadow.png'), encodePNG(w, h, pix));
}

// chuva em 4 quadros
{
  const fw = 180; const fh = 220; const frames = 4;
  const pix = new Uint8ClampedArray(fw * frames * fh * 4);
  for (let f = 0; f < frames; f++) {
    for (let i = 0; i < 40; i++) {
      const x = (i * 37 + f * 20) % fw;
      const y = (i * 53 + f * 48) % fh;
      for (let k = 0; k < 12; k++) {
        const xx = x - Math.floor(k * 0.4);
        const yy = y + k;
        if (xx < 0 || yy >= fh || xx >= fw) continue;
        const d = (yy * fw * frames + f * fw + xx) * 4;
        pix[d] = 200; pix[d + 1] = 230; pix[d + 2] = 255; pix[d + 3] = 150 - k * 8;
      }
    }
  }
  writeFileSync(join(root, 'assets/fx/rain.png'), encodePNG(fw * frames, fh, pix));
}

// logo
{
  const logoPng = join(tmp, 'logo.png');
  execFileSync('ffmpeg', ['-y', '-i', join(srcDir, 'logo-ds.jpg'), logoPng], { stdio: 'ignore' });
  const keyed = keyMagenta(decodePNG(readFileSync(logoPng)));
  writeFileSync(join(root, 'assets/ui/logo.png'), encodePNG(keyed.w, keyed.h, keyed.pix));
}

console.log('roster ok', FW, FH, BASE);
