/* ============================================================
   DS FIGHTERS — utilidades PNG (decodifica, recorta, amplia, salva).
   Usado para inspecionar folhas de sprite e prints de bug sem
   depender de Pillow/npm.

   Uso:
     node tools/png_util.mjs crop entrada.png saida.png x y w h [zoom]
     node tools/png_util.mjs cell grika.png saida.png col row [zoom]
     node tools/png_util.mjs info entrada.png
   ============================================================ */
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { decodePNG, CW, CH } from './png_probe.mjs';

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

export function encodePNG(img) {
  const { width, height, data } = img;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filtro none
    data.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const chunk = (type, payload) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(payload.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), payload]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function blank(w, h, bg = null) {
  const data = Buffer.alloc(w * h * 4);
  if (bg) for (let i = 0; i < w * h; i++) {
    data[i * 4] = bg[0]; data[i * 4 + 1] = bg[1]; data[i * 4 + 2] = bg[2]; data[i * 4 + 3] = 255;
  }
  return { width: w, height: h, data };
}

export function cropZoom(src, x, y, w, h, zoom = 1) {
  const out = blank(Math.round(w * zoom), Math.round(h * zoom));
  for (let yy = 0; yy < h * zoom; yy++) {
    const sy = y + Math.floor(yy / zoom);
    if (sy < 0 || sy >= src.height) continue;
    for (let xx = 0; xx < w * zoom; xx++) {
      const sx = x + Math.floor(xx / zoom);
      if (sx < 0 || sx >= src.width) continue;
      const s = (sy * src.width + sx) * 4, d = (yy * out.width + xx) * 4;
      out.data[d] = src.data[s]; out.data[d + 1] = src.data[s + 1];
      out.data[d + 2] = src.data[s + 2]; out.data[d + 3] = 255;
    }
  }
  return out;
}

if (process.argv[1] && process.argv[1].endsWith('png_util.mjs')) {
  const [mode, ...rest] = process.argv.slice(2);
  const read = (p) => decodePNG(fs.readFileSync(p));
  if (mode === 'info') {
    for (const p of rest) {
      const i = read(p);
      console.log(`${p}: ${i.width}x${i.height}`);
    }
  } else if (mode === 'crop') {
    const [inp, out, x, y, w, h, z] = rest;
    const img = cropZoom(read(inp), +x, +y, +w, +h, +(z || 1));
    fs.writeFileSync(out, encodePNG(img));
    console.log(out, `${img.width}x${img.height}`);
  } else if (mode === 'cell') {
    const [inp, out, col, row, z] = rest;
    const img = cropZoom(read(inp), +col * CW, +row * CH, CW, CH, +(z || 1));
    fs.writeFileSync(out, encodePNG(img));
    console.log(out, `${img.width}x${img.height}`);
  } else {
    console.log('modos: info | crop | cell');
  }
}
