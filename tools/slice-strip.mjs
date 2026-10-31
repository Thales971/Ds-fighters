#!/usr/bin/env node
/** Recorta uma faixa magenta em sprites alinhados pela sola. */
import { inflateSync, deflateSync } from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';

export function decodePNG(buf) {
  let o = 8;
  let w = 0;
  let h = 0;
  let color = 6;
  const idats = [];
  while (o < buf.length) {
    const len = buf.readUInt32BE(o); o += 4;
    const type = buf.toString('ascii', o, o + 4); o += 4;
    const chunk = buf.subarray(o, o + len); o += len; o += 4;
    if (type === 'IHDR') {
      w = chunk.readUInt32BE(0);
      h = chunk.readUInt32BE(4);
      color = chunk[9];
    }
    if (type === 'IDAT') idats.push(chunk);
    if (type === 'IEND') break;
  }
  const bpp = color === 6 ? 4 : color === 2 ? 3 : 0;
  if (!bpp) throw new Error('cor png ' + color);
  const raw = inflateSync(Buffer.concat(idats));
  const pix = new Uint8ClampedArray(w * h * 4);
  const stride = w * bpp + 1;
  let prev = new Uint8Array(w * bpp);
  const rowBuf = new Uint8Array(w * bpp);
  for (let y = 0; y < h; y++) {
    const filter = raw[y * stride];
    const row = raw.subarray(y * stride + 1, y * stride + 1 + w * bpp);
    if (filter === 0) rowBuf.set(row);
    else if (filter === 1) {
      for (let i = 0; i < row.length; i++) rowBuf[i] = (row[i] + (i >= bpp ? rowBuf[i - bpp] : 0)) & 255;
    } else if (filter === 2) {
      for (let i = 0; i < row.length; i++) rowBuf[i] = (row[i] + prev[i]) & 255;
    } else if (filter === 3) {
      for (let i = 0; i < row.length; i++) {
        const left = i >= bpp ? rowBuf[i - bpp] : 0;
        rowBuf[i] = (row[i] + ((left + prev[i]) >> 1)) & 255;
      }
    } else if (filter === 4) {
      for (let i = 0; i < row.length; i++) {
        const a = i >= bpp ? rowBuf[i - bpp] : 0;
        const b = prev[i];
        const c = i >= bpp ? prev[i - bpp] : 0;
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        rowBuf[i] = (row[i] + pr) & 255;
      }
    } else throw new Error('filtro png ' + filter);
    prev.set(rowBuf);
    for (let x = 0; x < w; x++) {
      const d = (y * w + x) * 4;
      const s = x * bpp;
      pix[d] = rowBuf[s];
      pix[d + 1] = rowBuf[s + 1];
      pix[d + 2] = rowBuf[s + 2];
      pix[d + 3] = bpp === 4 ? rowBuf[s + 3] : 255;
    }
  }
  return { w, h, pix };
}

export function isMagenta(r, g, b) {
  return r > 180 && b > 90 && g < 90 && r - g > 80 && b + 20 > g;
}

function bgColor(pix, w, h) {
  const spots = [[4, 4], [w - 5, 4], [4, h - 5], [w - 5, h - 5], [Math.floor(w / 2), 6]];
  let r = 0; let g = 0; let b = 0;
  for (const [x, y] of spots) {
    const i = (y * w + x) * 4;
    r += pix[i]; g += pix[i + 1]; b += pix[i + 2];
  }
  return [r / spots.length, g / spots.length, b / spots.length];
}

export function keyMagenta(src) {
  const { w, h, pix } = src;
  const out = new Uint8ClampedArray(pix);
  const [br, bg, bb] = bgColor(pix, w, h);
  const tol = 58 * 58;
  for (let i = 0; i < out.length; i += 4) {
    const dr = out[i] - br;
    const dg = out[i + 1] - bg;
    const db = out[i + 2] - bb;
    if (dr * dr + dg * dg + db * db < tol) out[i + 3] = 0;
  }
  // come a franja rosa de 1px
  const alpha = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) alpha[y * w + x] = out[(y * w + x) * 4 + 3] > 20 ? 1 : 0;
  }
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (!alpha[i]) continue;
      let magN = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const j = ((y + dy) * w + (x + dx)) * 4;
        if (out[j + 3] === 0) magN++;
      }
      const p = i * 4;
      const pink = out[p] > 160 && out[p + 2] > 140 && out[p + 1] < 160;
      if (pink && magN >= 2) out[p + 3] = 0;
    }
  }
  return { w, h, pix: out };
}

export function columnCounts(img) {
  const { w, h, pix } = img;
  const col = new Uint16Array(w);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) if (pix[(y * w + x) * 4 + 3] > 40) col[x]++;
  }
  return col;
}

export function slicesOf(img, expect) {
  const col = columnCounts(img);
  const w = col.length;
  const minSep = Math.floor(w / expect * 0.45);
  const candidates = [];
  for (let x = 8; x < w - 8; x++) {
    let empty = 0;
    for (let k = -2; k <= 2; k++) empty += col[x + k];
    candidates.push({ x, empty });
  }
  candidates.sort((a, b) => a.empty - b.empty);
  const chosen = [];
  for (const v of candidates) {
    if (chosen.every((c) => Math.abs(c.x - v.x) > minSep)) chosen.push(v);
    if (chosen.length === expect - 1) break;
  }
  chosen.sort((a, b) => a.x - b.x);
  const cuts = [0, ...chosen.map((c) => c.x), w];
  const slices = [];
  for (let i = 0; i < cuts.length - 1; i++) slices.push([cuts[i], cuts[i + 1]]);
  return slices;
}

export function cropSprite(img, x0, x1, targetH) {
  const { w, h, pix } = img;
  let minY = h;
  let maxY = 0;
  let minX = x1;
  let maxX = x0;
  for (let y = 0; y < h; y++) {
    for (let x = x0; x < x1; x++) {
      if (pix[(y * w + x) * 4 + 3] > 30) {
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
  const scale = targetH / sh;
  const dw = Math.max(1, Math.round(sw * scale));
  const dh = targetH;
  const out = new Uint8ClampedArray(dw * dh * 4);
  for (let y = 0; y < dh; y++) {
    const sy = minY + Math.min(sh - 1, Math.floor(y / scale));
    for (let x = 0; x < dw; x++) {
      const sx = minX + Math.min(sw - 1, Math.floor(x / scale));
      const s = (sy * w + sx) * 4;
      const d = (y * dw + x) * 4;
      out[d] = pix[s];
      out[d + 1] = pix[s + 1];
      out[d + 2] = pix[s + 2];
      out[d + 3] = pix[s + 3];
    }
  }
  return { w: dw, h: dh, pix: out };
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

export function encodePNG(w, h, pix) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    Buffer.from(pix.buffer, pix.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crc]);
  };
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const srcPath = process.argv[2];
  const expect = parseInt(process.argv[3] || '6', 10);
  const targetH = parseInt(process.argv[4] || '190', 10);
  const keyed = keyMagenta(decodePNG(readFileSync(srcPath)));
  const slices = slicesOf(keyed, expect);
  console.log('slices', slices);
  const sprites = slices.map(([a, b]) => cropSprite(keyed, a, b, targetH)).filter(Boolean);
  const gap = 8;
  const tw = sprites.reduce((s, sp) => s + sp.w + gap, gap);
  const th = targetH + 16;
  const sheet = new Uint8ClampedArray(tw * th * 4);
  for (let i = 0; i < sheet.length; i += 4) {
    sheet[i] = 18; sheet[i + 1] = 16; sheet[i + 2] = 28; sheet[i + 3] = 255;
  }
  let x = gap;
  for (const sp of sprites) {
    for (let y = 0; y < sp.h; y++) {
      for (let xx = 0; xx < sp.w; xx++) {
        const s = (y * sp.w + xx) * 4;
        if (sp.pix[s + 3] < 10) continue;
        const d = ((y + 8) * tw + (x + xx)) * 4;
        sheet[d] = sp.pix[s];
        sheet[d + 1] = sp.pix[s + 1];
        sheet[d + 2] = sp.pix[s + 2];
        sheet[d + 3] = 255;
      }
    }
    x += sp.w + gap;
  }
  writeFileSync('/tmp/art/du-sliced.png', encodePNG(tw, th, sheet));
  console.log('sprites', sprites.map((s) => s.w + 'x' + s.h).join(', '));
}
