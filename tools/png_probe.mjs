#!/usr/bin/env node
/* ============================================================
   DS FIGHTERS — sonda de PNG (sem dependência externa).

   Decodifica PNG 8-bit (RGBA/RGB, não entrelaçado) usando só o
   zlib do Node, e mede o conteúdo de cada célula da folha de
   sprite: caixa do desenho (bbox), altura, largura, pé (ymax) e
   se o desenho está encostando/estourando a borda da célula.

   Uso:
     node tools/png_probe.mjs                 # relatório de todas as folhas
     node tools/png_probe.mjs grika winx-exe  # só alguns ids
     node tools/png_probe.mjs --json          # saída crua p/ outros scripts
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPR = path.join(ROOT, 'assets/sprites');

export const CW = 320;
export const CH = 260;
export const BASE = 246;
export const POSES = ['idle', 'walk', 'jump', 'crouch', 'punch', 'kick', 'cpunch',
  'ckick', 'jpunch', 'jkick', 'special', 'hit', 'block', 'ko', 'win'];

/* ---------- decodificador PNG mínimo (8-bit, sem interlace) ---------- */
export function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('não é PNG');
  let off = 8;
  let w = 0, h = 0, depth = 0, ctype = 0, interlace = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      depth = data[8];
      ctype = data[9];
      interlace = data[12];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (depth !== 8) throw new Error(`bitDepth ${depth} não suportado`);
  if (interlace) throw new Error('PNG entrelaçado não suportado');
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[ctype];
  if (!channels) throw new Error(`colorType ${ctype} não suportado`);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * channels;
  const out = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = Buffer.from(line);
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? cur[i - channels] : 0;
      const b = prev[i];
      const c = i >= channels ? prev[i - channels] : 0;
      let v = cur[i];
      if (ft === 1) v += a;
      else if (ft === 2) v += b;
      else if (ft === 3) v += (a + b) >> 1;
      else if (ft === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      }
      cur[i] = v & 255;
    }
    for (let x = 0; x < w; x++) {
      const s = x * channels;
      const d = (y * w + x) * 4;
      if (channels === 4) { out[d] = cur[s]; out[d + 1] = cur[s + 1]; out[d + 2] = cur[s + 2]; out[d + 3] = cur[s + 3]; }
      else if (channels === 3) { out[d] = cur[s]; out[d + 1] = cur[s + 1]; out[d + 2] = cur[s + 2]; out[d + 3] = 255; }
      else if (channels === 1) { out[d] = out[d + 1] = out[d + 2] = cur[s]; out[d + 3] = 255; }
      else { out[d] = out[d + 1] = out[d + 2] = cur[s]; out[d + 3] = cur[s + 1]; }
    }
    prev = cur;
  }
  return { width: w, height: h, data: out };
}

/* ---------- medição de uma célula ---------- */
export function cellBox(img, col, row, alphaMin = 8) {
  const { width, data } = img;
  const x0 = col * CW, y0 = row * CH;
  let minX = CW, minY = CH, maxX = -1, maxY = -1, count = 0;
  for (let y = 0; y < CH; y++) {
    const rowOff = ((y0 + y) * width + x0) * 4;
    for (let x = 0; x < CW; x++) {
      if (data[rowOff + x * 4 + 3] > alphaMin) {
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { empty: true, count: 0 };
  return {
    empty: false, count,
    x0: minX, x1: maxX, y0: minY, y1: maxY,
    w: maxX - minX + 1, h: maxY - minY + 1,
    cx: (minX + maxX) / 2,
    touchL: minX <= 0, touchR: maxX >= CW - 1, touchT: minY <= 0, touchB: maxY >= CH - 1,
  };
}

export function layoutIds() {
  const lay = fs.readFileSync(path.join(SPR, 'layout.js'), 'utf8');
  return [...lay.matchAll(/"([a-z0-9-]+)":\s*"assets\/sprites\//g)].map((m) => m[1]);
}

/* ---------- CLI ---------- */
if (process.argv[1] && process.argv[1].endsWith('png_probe.mjs')) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const ids = args.length ? args : layoutIds();
  const report = {};
  for (const id of ids) {
    const file = path.join(SPR, `${id}.png`);
    if (!fs.existsSync(file)) { report[id] = { error: 'arquivo ausente' }; continue; }
    const img = decodePNG(fs.readFileSync(file));
    const poses = {};
    for (let r = 0; r < POSES.length; r++) {
      const cells = [];
      for (let c = 0; c < 4; c++) cells.push(cellBox(img, c, r));
      const used = cells.filter((b) => !b.empty);
      poses[POSES[r]] = {
        cells: cells.map((b) => (b.empty ? null : {
          w: b.w, h: b.h, y1: b.y1, cx: Math.round(b.cx),
          touch: [b.touchL && 'L', b.touchR && 'R', b.touchT && 'T', b.touchB && 'B'].filter(Boolean).join(''),
        })),
        h: used.length ? Math.round(used.reduce((s, b) => s + b.h, 0) / used.length) : 0,
        y1: used.length ? Math.max(...used.map((b) => b.y1)) : 0,
        w: used.length ? Math.round(used.reduce((s, b) => s + b.w, 0) / used.length) : 0,
        empty: 4 - used.length,
      };
    }
    report[id] = { size: [img.width, img.height], poses };
  }
  if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 1));
  else {
    console.log(`${'id'.padEnd(15)} ${'tamanho'.padEnd(11)} ${'idleH'.padStart(5)} ${'idleW'.padStart(5)} ${'pe'.padStart(4)} ${'vazias'.padStart(6)} ${'fora-base'.padStart(9)} ${'maiorH'.padStart(6)}  observacoes`);
    for (const [id, r] of Object.entries(report)) {
      if (r.error) { console.log(`${id.padEnd(15)} ${r.error}`); continue; }
      const p = r.poses;
      const empties = Object.values(p).reduce((s, v) => s + v.empty, 0);
      const fora = POSES.filter((k) => p[k].h && p[k].y1 > BASE);
      const touches = POSES.filter((k) => (p[k].cells || []).some((c) => c && c.touch));
      const maxH = Math.max(...POSES.map((k) => p[k].h));
      const obs = [empties ? `${empties} celula(s) vazia(s)` : '', fora.length ? `pe fora: ${fora.join(',')}` : '',
        touches.length ? `borda: ${touches.join(',')}` : '', maxH / (p.idle.h || 1) > 1.5 ? `posa maior ${(maxH / (p.idle.h || 1)).toFixed(2)}x idle` : ''].filter(Boolean).join(' | ');
      console.log(`${id.padEnd(15)} ${r.size.join('x').padEnd(11)} ${String(p.idle.h).padStart(5)} ${String(p.idle.w).padStart(5)} ${String(p.idle.y1).padStart(4)} ${String(empties).padStart(6)} ${String(fora.length).padStart(9)} ${String(maxH).padStart(6)}  ${obs}`);
    }
  }
}
