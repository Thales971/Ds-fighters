#!/usr/bin/env node
/**
 * DS FIGHTERS — gerador de sprite sheets em pixel art.
 * Arte original (sem sprites de terceiros). Rode com:
 *   node tools/generate-sprites.mjs
 *
 * Cada PNG é uma grade: 8 colunas × N linhas de poses.
 * O layout sai em assets/sprites/layout.js e o jogo lê isso.
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'assets', 'sprites');

const FW = 96;
const FH = 128;
const COLS = 8;
const FOOT = 122;

const POSE_LIST = [
  ['idle', 6],
  ['walk', 8],
  ['jump', 5],
  ['crouch', 4],
  ['punch', 5],
  ['kick', 6],
  ['cpunch', 4],
  ['ckick', 5],
  ['jpunch', 4],
  ['jkick', 5],
  ['special', 6],
  ['hit', 4],
  ['block', 4],
  ['ko', 6],
  ['win', 6],
];

const POSES = POSE_LIST.map(([id]) => id);
const FRAMES = Object.fromEntries(POSE_LIST);

function clampByte(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

function hex(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mul(c, f) {
  return [clampByte(c[0] * f), clampByte(c[1] * f), clampByte(c[2] * f)];
}

function mix(a, b, t) {
  return [
    clampByte(a[0] + (b[0] - a[0]) * t),
    clampByte(a[1] + (b[1] - a[1]) * t),
    clampByte(a[2] + (b[2] - a[2]) * t),
  ];
}

function tone(base, light) {
  if (light > 0.42) return mul(base, 1.3);
  if (light < -0.18) return mul(base, 0.62);
  return base;
}

class Pix {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.d = new Uint8ClampedArray(w * h * 4);
    this.alpha = 255;
  }

  set(x, y, col) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !col) return;
    const a = this.alpha;
    const i = (y * this.w + x) * 4;
    if (a >= 250 || this.d[i + 3] === 0) {
      this.d[i] = col[0];
      this.d[i + 1] = col[1];
      this.d[i + 2] = col[2];
      this.d[i + 3] = a >= 250 ? 255 : a;
      return;
    }
    const t = a / 255;
    const s = 1 - t;
    this.d[i] = clampByte(col[0] * t + this.d[i] * s);
    this.d[i + 1] = clampByte(col[1] * t + this.d[i + 1] * s);
    this.d[i + 2] = clampByte(col[2] * t + this.d[i + 2] * s);
    this.d[i + 3] = Math.min(255, this.d[i + 3] + a * 0.65);
  }

  alphaAt(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[(y * this.w + x) * 4 + 3];
  }

  blit(src, dx, dy) {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const si = (y * src.w + x) * 4;
        if (src.d[si + 3] < 8) continue;
        const tx = dx + x;
        const ty = dy + y;
        if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) continue;
        const di = (ty * this.w + tx) * 4;
        this.d[di] = src.d[si];
        this.d[di + 1] = src.d[si + 1];
        this.d[di + 2] = src.d[si + 2];
        this.d[di + 3] = src.d[si + 3];
      }
    }
  }
}

function capsule(pix, x1, y1, x2, y2, r, base, shadeMul = 1) {
  if (!base) return;
  const minX = Math.floor(Math.min(x1, x2) - r - 1);
  const maxX = Math.ceil(Math.max(x1, x2) + r + 1);
  const minY = Math.floor(Math.min(y1, y2) - r - 1);
  const maxY = Math.ceil(Math.max(y1, y2) + r + 1);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  const rr = r * r;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let t = ((px - x1) * dx + (py - y1) * dy) / len2;
      if (t < 0) t = 0;
      else if (t > 1) t = 1;
      const cx = x1 + dx * t;
      const cy = y1 + dy * t;
      const ddx = px - cx;
      const ddy = py - cy;
      const d2 = ddx * ddx + ddy * ddy;
      if (d2 > rr) continue;
      const d = Math.sqrt(d2) || 1;
      const light = ((ddx * -0.55 + ddy * -0.82) / d) * shadeMul;
      pix.set(x, y, tone(base, light));
    }
  }
}

function ellipse(pix, cx, cy, rx, ry, base, shadeMul = 1) {
  if (!base || rx <= 0 || ry <= 0) return;
  const minX = Math.floor(cx - rx - 1);
  const maxX = Math.ceil(cx + rx + 1);
  const minY = Math.floor(cy - ry - 1);
  const maxY = Math.ceil(cy + ry + 1);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      if (nx * nx + ny * ny > 1) continue;
      const light = (nx * -0.7 + ny * -0.7) * shadeMul;
      pix.set(x, y, tone(base, light));
    }
  }
}

function fillQuad(pix, pts, base) {
  if (!base) return;
  let minY = Infinity;
  let maxY = -Infinity;
  let minX = Infinity;
  let maxX = -Infinity;
  for (const p of pts) {
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
  }
  if (!Number.isFinite(minY)) return;
  const edges = [
    [pts[0], pts[1]],
    [pts[1], pts[2]],
    [pts[2], pts[3]],
    [pts[3], pts[0]],
  ];
  const y0 = Math.floor(minY);
  const y1 = Math.ceil(maxY);
  for (let y = y0; y <= y1; y++) {
    const xs = [];
    for (const [a, b] of edges) {
      const cross = (a.y <= y && b.y > y) || (b.y <= y && a.y > y);
      if (!cross || a.y === b.y) continue;
      const t = (y + 0.5 - a.y) / (b.y - a.y);
      xs.push(a.x + (b.x - a.x) * t);
    }
    if (xs.length < 2) continue;
    xs.sort((a, b) => a - b);
    const xa = Math.ceil(xs[0]);
    const xb = Math.floor(xs[xs.length - 1]);
    for (let x = xa; x <= xb; x++) {
      const tx = (x - minX) / Math.max(1, maxX - minX);
      const ty = (y - minY) / Math.max(1, maxY - minY);
      const light = (1 - tx) * 0.55 + (1 - ty) * 0.9 - 0.55;
      pix.set(x, y, tone(base, light));
    }
  }
}

function line(pix, x1, y1, x2, y2, col) {
  const n = Math.max(1, Math.round(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1))));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pix.set(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, col);
  }
}

function rect(pix, x, y, w, h, col) {
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) pix.set(x + xx, y + yy, col);
  }
}

function ring(pix, cx, cy, r, col) {
  const minX = Math.floor(cx - r - 1);
  const maxX = Math.ceil(cx + r + 1);
  const minY = Math.floor(cy - r - 1);
  const maxY = Math.ceil(cy + r + 1);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d >= r - 0.85 && d <= r + 0.45) pix.set(x, y, col);
    }
  }
}

function addOutline(pix, color) {
  const w = pix.w;
  const h = pix.h;
  const src = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) src[i] = pix.d[i * 4 + 3] > 24 ? 1 : 0;
  const prev = pix.alpha;
  pix.alpha = 255;
  const dirs = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
  ];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (src[y * w + x]) continue;
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (src[ny * w + nx]) {
          pix.set(x, y, color);
          break;
        }
      }
    }
  }
  pix.alpha = prev;
}

function polar(p, deg, len) {
  const a = (deg * Math.PI) / 180;
  return { x: p.x + Math.cos(a) * len, y: p.y + Math.sin(a) * len };
}

function solveLeg(hip, target, l1, l2, bend) {
  let dx = target.x - hip.x;
  let dy = target.y - hip.y;
  let dist = Math.hypot(dx, dy) || 0.001;
  const max = l1 + l2 - 0.01;
  const min = Math.abs(l1 - l2) + 0.01;
  if (dist > max) {
    dx *= max / dist;
    dy *= max / dist;
    dist = max;
  } else if (dist < min) {
    dx *= min / dist;
    dy *= min / dist;
    dist = min;
  }
  const foot = { x: hip.x + dx, y: hip.y + dy };
  const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = dx / dist;
  const uy = dy / dist;
  const knee = {
    x: hip.x + ux * a + -uy * h * bend,
    y: hip.y + uy * a + ux * h * bend,
  };
  return { knee, foot };
}

const POINT_KEYS = [
  'hip', 'shoulderC', 'sR', 'sL', 'hR', 'hL', 'footR', 'footL',
  'kneeR', 'kneeL', 'eR', 'eL', 'handR', 'handL', 'head',
];

function buildStand(ch, pose) {
  const sc = ch.scale;
  const thigh = 17 * sc;
  const shin = 16 * sc;
  const shoeR = 4.3;
  const torsoLen = 28 * sc;
  const ua = 14 * sc;
  const la = 12.5 * sc;
  const hr = ch.headR * (0.9 + 0.1 * sc);
  const tdeg = pose.torso || 0;
  const upRad = ((-90 + tdeg) * Math.PI) / 180;
  const rightRad = (tdeg * Math.PI) / 180;
  const footBase = 117;
  const hip = {
    x: 48 + (pose.shiftX || 0),
    y: footBase - (thigh + shin) * 0.92 + (pose.hipDrop || 0),
  };
  const shoulderC = {
    x: hip.x + Math.cos(upRad) * torsoLen,
    y: hip.y + Math.sin(upRad) * torsoLen - (pose.breathe || 0),
  };
  const shW = ch.shoulder * sc * 0.5;
  const hipWv = ch.hipW * sc * 0.5;
  const sR = {
    x: shoulderC.x + Math.cos(rightRad) * shW,
    y: shoulderC.y + Math.sin(rightRad) * shW,
  };
  const sL = {
    x: shoulderC.x - Math.cos(rightRad) * shW,
    y: shoulderC.y - Math.sin(rightRad) * shW,
  };
  const hR = {
    x: hip.x + Math.cos(rightRad) * hipWv,
    y: hip.y + Math.sin(rightRad) * hipWv,
  };
  const hL = {
    x: hip.x - Math.cos(rightRad) * hipWv,
    y: hip.y - Math.sin(rightRad) * hipWv,
  };
  const legR = solveLeg(
    hR,
    { x: hR.x + (pose.footRX || 0), y: footBase + (pose.footRY || 0) },
    thigh,
    shin,
    -1,
  );
  const legL = solveLeg(
    hL,
    { x: hL.x + (pose.footLX || 0), y: footBase + (pose.footLY || 0) },
    thigh,
    shin,
    -1,
  );
  const eR = polar(sR, pose.uArmR, ua);
  const handR = polar(eR, pose.lArmR, la);
  const eL = polar(sL, pose.uArmL, ua);
  const handL = polar(eL, pose.lArmL, la);
  const head = polar(shoulderC, -90 + tdeg + (pose.head || 0), 4 * sc + hr * 0.92);
  return {
    hip, shoulderC, sR, sL, hR, hL,
    footR: legR.foot, footL: legL.foot,
    kneeR: legR.knee, kneeL: legL.knee,
    eR, eL, handR, handL, head,
    tdeg, sc, shoeR, hr, hipWv, shW,
  };
}

function buildFallen(ch) {
  const y = 112;
  const hr = ch.headR;
  return {
    hip: { x: 60, y: y - 6 },
    shoulderC: { x: 42, y: y - 12 },
    sR: { x: 48, y: y - 16 },
    sL: { x: 36, y: y - 8 },
    hR: { x: 66, y: y - 5 },
    hL: { x: 54, y: y - 3 },
    kneeR: { x: 78, y: y - 12 },
    footR: { x: 90, y: y - 3 },
    kneeL: { x: 74, y: y - 2 },
    footL: { x: 86, y: y - 1 },
    eR: { x: 56, y: y - 8 },
    handR: { x: 66, y: y - 2 },
    eL: { x: 32, y: y - 6 },
    handL: { x: 24, y: y - 1 },
    head: { x: 28, y: y - 18 - hr * 0.15 },
    tdeg: 64,
    sc: ch.scale,
    shoeR: 4.5 * ch.scale,
    hr,
    hipWv: ch.hipW * 0.5,
    shW: ch.shoulder * 0.5,
  };
}

function blendSkel(a, b, t) {
  const arc = Math.sin(t * Math.PI) * -8;
  const o = {
    tdeg: a.tdeg + (b.tdeg - a.tdeg) * t,
    sc: a.sc,
    shoeR: a.shoeR,
    hr: a.hr,
    hipWv: a.hipWv,
    shW: a.shW,
  };
  for (const k of POINT_KEYS) {
    o[k] = {
      x: a[k].x + (b[k].x - a[k].x) * t,
      y: a[k].y + (b[k].y - a[k].y) * t + arc,
    };
  }
  return o;
}

function buildSkeleton(ch, pose) {
  const stand = buildStand(ch, pose);
  if (!pose.fallen) return stand;
  return blendSkel(stand, buildFallen(ch), pose.fallen);
}

function basePose(over) {
  return {
    torso: 0,
    head: 0,
    hipDrop: 0,
    breathe: 0,
    shiftX: 0,
    footRX: 0,
    footRY: 0,
    footLX: 0,
    footLY: 0,
    uArmR: 66,
    lArmR: 98,
    uArmL: 116,
    lArmL: 142,
    expr: 'idle',
    blink: false,
    frame: 0,
    fallen: 0,
    fx: 0,
    ghost: 0,
    ...over,
  };
}

function idlePose(ch, frame) {
  const b = Math.sin((frame / 6) * Math.PI * 2);
  return basePose({
    breathe: b * 1.35,
    head: b * 1.1,
    uArmR: 66 + b * 3,
    uArmL: 116 - b * 3,
    blink: frame === 3,
    frame,
    expr: ch.face || 'idle',
  });
}

function walkPose(frame) {
  const phase = (frame / 8) * Math.PI * 2;
  const s = Math.sin(phase);
  const c = Math.cos(phase);
  const lift = (v) => -Math.max(0, v) * 10;
  return basePose({
    torso: s * 6,
    head: -s * 2,
    footRX: s * 13,
    footRY: lift(c),
    footLX: -s * 13,
    footLY: lift(-c),
    uArmR: 70 + s * 38,
    lArmR: 102 + s * 16,
    uArmL: 112 - s * 38,
    lArmL: 142 - s * 14,
    hipDrop: Math.abs(s) * 1.4,
    frame,
    expr: 'focus',
  });
}

function jumpPose(frame) {
  return basePose({
    frame,
    expr: 'focus',
    ...[
      { hipDrop: 7, footRX: 3, footRY: -1, footLX: -3, uArmR: 130, lArmR: 160, uArmL: 150, lArmL: 176, torso: 8 },
      { footRX: 4, footRY: -15, footLX: -2, footLY: -13, uArmR: -70, lArmR: -40, uArmL: -120, lArmL: -100, torso: -4 },
      { footRX: 7, footRY: -23, footLX: -3, footLY: -21, uArmR: -50, lArmR: -20, uArmL: -140, lArmL: -120, torso: 0 },
      { footRX: 9, footRY: -8, footLX: -5, footLY: -6, uArmR: -20, lArmR: 20, uArmL: -100, lArmL: -60, torso: 10 },
      { hipDrop: 15, footRX: 7, footRY: 0, footLX: -7, uArmR: 48, lArmR: 86, uArmL: 128, lArmL: 156, torso: 12, expr: 'grit' },
    ][frame],
  });
}

function crouchPose(frame) {
  const drop = [8, 16, 22, 22][frame];
  return basePose({
    frame,
    hipDrop: drop,
    footRX: 7,
    footLX: -7,
    torso: 6,
    uArmR: 78,
    lArmR: 112,
    uArmL: 108,
    lArmL: 136,
    expr: 'grit',
  });
}

function fromKeys(keys, frame, extra = {}) {
  return basePose({ frame, ...keys[frame], ...extra });
}

const PUNCH_KEYS = [
  { uArmR: 168, lArmR: 78, uArmL: 140, lArmL: 100, torso: -7, expr: 'grit' },
  { uArmR: 46, lArmR: 18, torso: 6, shiftX: 2, expr: 'grit' },
  { uArmR: -10, lArmR: -8, uArmL: 150, lArmL: 170, torso: 15, shiftX: 4, expr: 'yell' },
  { uArmR: -4, lArmR: 2, torso: 11, shiftX: 3, expr: 'yell' },
  { uArmR: 66, lArmR: 98, torso: 0, expr: 'idle' },
];

const KICK_KEYS = [
  { footRX: 4, footRY: -10, torso: -5, uArmR: 36, lArmR: 16, uArmL: 150, expr: 'grit' },
  { footRX: 8, footRY: -22, torso: -8, uArmL: 164, lArmL: 150, uArmR: 24, lArmR: 10, expr: 'grit' },
  { footRX: 33, footRY: -15, footLX: -2, torso: 13, shiftX: -3, uArmR: 18, lArmR: 48, uArmL: 168, lArmL: 150, expr: 'yell' },
  { footRX: 35, footRY: -13, torso: 14, shiftX: -3, expr: 'yell', uArmL: 160 },
  { footRX: 14, footRY: -6, torso: 4, expr: 'grit' },
  { expr: 'idle' },
];

const CPUNCH_KEYS = [
  { hipDrop: 18, footRX: 6, footLX: -6, uArmR: 154, lArmR: 84, torso: 5, expr: 'grit' },
  { hipDrop: 18, footRX: 6, footLX: -6, uArmR: 16, lArmR: 6, torso: 12, shiftX: 2, expr: 'yell' },
  { hipDrop: 18, footRX: 6, footLX: -6, uArmR: -8, lArmR: -4, torso: 13, shiftX: 3, expr: 'yell' },
  { hipDrop: 18, footRX: 6, footLX: -6, uArmR: 84, lArmR: 110, torso: 5, expr: 'grit' },
];

const CKICK_KEYS = [
  { hipDrop: 16, footRX: 6, footRY: -6, footLX: -6, torso: 5, expr: 'grit' },
  { hipDrop: 14, footRX: 16, footRY: -3, footLX: -8, torso: 8, uArmR: 28, lArmR: 16, expr: 'grit' },
  { hipDrop: 12, footRX: 34, footRY: -1, footLX: -10, torso: 13, shiftX: -2, expr: 'yell' },
  { hipDrop: 12, footRX: 32, footRY: 0, footLX: -8, torso: 10, expr: 'yell' },
  { hipDrop: 16, footRX: 8, footLX: -5, torso: 4, expr: 'grit' },
];

const JPUNCH_KEYS = [
  { footRX: 5, footRY: -16, footLX: -1, footLY: -14, uArmR: 150, lArmR: 74, uArmL: -80, lArmL: -50, torso: -4, expr: 'grit' },
  { footRX: 6, footRY: -20, footLY: -18, uArmR: 8, lArmR: -2, torso: 9, shiftX: 2, expr: 'yell' },
  { footRX: 6, footRY: -18, footLY: -16, uArmR: -14, lArmR: -10, torso: 11, expr: 'yell' },
  { footRX: 4, footRY: -13, footLY: -12, uArmR: 42, lArmR: 28, torso: 3, expr: 'grit' },
];

const JKICK_KEYS = [
  { footRX: 2, footRY: -18, footLX: -3, footLY: -15, torso: -6, expr: 'grit' },
  { footRX: 12, footRY: -22, footLY: -16, torso: 0, uArmR: 20, lArmR: 8, expr: 'grit' },
  { footRX: 32, footRY: -11, footLX: 2, footLY: -20, torso: 9, shiftX: -2, expr: 'yell' },
  { footRX: 30, footRY: -9, footLY: -16, torso: 7, expr: 'yell' },
  { footRX: 8, footRY: -15, footLY: -13, torso: 0, expr: 'grit' },
];

function specialPose(ch, frame) {
  const fx = frame === 0 || frame === 5 ? 0.3 : 1;
  if (ch.id === 'gitmaster') {
    return basePose({
      frame, fx: 1, expr: 'focus', ghost: 13, torso: 24, shiftX: 5, hipDrop: 2,
      footRX: 12, footLX: -14, footRY: -1,
      uArmR: -36, lArmR: -12, uArmL: 172, lArmL: 188,
    });
  }
  if (ch.id === 'scrum') {
    return basePose({
      frame, fx, expr: 'smile', torso: -10,
      uArmR: -78, lArmR: -74, uArmL: -104, lArmL: -96,
    });
  }
  if (ch.id === 'du') {
    return fromKeys([
      { uArmR: -150, lArmR: -120, torso: -12, fx: 0.3, expr: 'yell' },
      { uArmR: -120, lArmR: -90, torso: -8, fx: 0.7, expr: 'yell' },
      { uArmR: -16, lArmR: 8, torso: 16, shiftX: 4, fx: 1, expr: 'yell' },
      { uArmR: 8, lArmR: 24, torso: 12, fx: 1, expr: 'yell' },
      { uArmR: 40, lArmR: 70, torso: 2, fx: 0.4, expr: 'grit' },
      { fx: 0.15, expr: 'grit' },
    ], frame);
  }
  return fromKeys([
    { uArmR: 162, lArmR: 74, torso: -8, fx: 0.25, expr: 'yell' },
    { uArmR: 124, lArmR: 42, torso: -10, fx: 0.65, expr: 'yell' },
    { uArmR: -16, lArmR: -6, torso: 16, shiftX: 3, fx: 1, expr: 'yell' },
    { uArmR: -6, lArmR: 6, torso: 12, fx: 1, expr: 'yell' },
    { uArmR: 32, lArmR: 54, torso: 3, fx: 0.45, expr: 'grit' },
    { fx: 0.12, expr: 'idle' },
  ], frame);
}

function hitPose(frame) {
  return fromKeys([
    { torso: -18, head: 8, shiftX: -4, uArmR: 142, lArmR: 46, uArmL: 156, lArmL: 60, expr: 'hurt' },
    { torso: -26, head: 12, shiftX: -6, hipDrop: 3, uArmR: 164, lArmR: 30, uArmL: 176, expr: 'hurt' },
    { torso: -14, head: 5, shiftX: -3, expr: 'hurt', uArmR: 120, lArmR: 70 },
    { torso: -5, head: 1, expr: 'grit' },
  ], frame);
}

function blockPose(frame) {
  const b = frame === 3 ? 0.8 : 0;
  return basePose({
    frame,
    breathe: b,
    torso: -12,
    hipDrop: 2,
    expr: 'grit',
    uArmR: -34,
    lArmR: 52,
    uArmL: -18,
    lArmL: 74,
    footRX: 3,
    footLX: -4,
  });
}

function koPose(frame) {
  return basePose({
    frame,
    fallen: [0, 0.3, 0.62, 0.9, 1, 1][frame],
    expr: 'hurt',
    blink: frame >= 4,
    torso: -18,
    shiftX: -3,
    head: 8,
    uArmR: 150,
    lArmR: 40,
    uArmL: 164,
    lArmL: 48,
    hipDrop: 3,
  });
}

function winPose(frame) {
  return fromKeys([
    { uArmR: -30, lArmR: -10, torso: -4, expr: 'smile' },
    { uArmR: -82, lArmR: -78, torso: -10, expr: 'smile', breathe: 1 },
    { uArmR: -90, lArmR: -88, uArmL: 40, lArmL: 70, torso: -13, expr: 'yell' },
    { uArmR: -86, lArmR: -84, torso: -8, expr: 'smile', hipDrop: 2 },
    { uArmR: -92, lArmR: -90, torso: -12, expr: 'smile', breathe: 1.3 },
    { uArmR: -84, lArmR: -80, torso: -9, expr: 'smile' },
  ], frame);
}

function poseFor(ch, name, frame) {
  switch (name) {
    case 'idle': return idlePose(ch, frame);
    case 'walk': return walkPose(frame);
    case 'jump': return jumpPose(frame);
    case 'crouch': return crouchPose(frame);
    case 'punch': return fromKeys(PUNCH_KEYS, frame, { expr: PUNCH_KEYS[frame].expr || ch.face || 'grit' });
    case 'kick': return fromKeys(KICK_KEYS, frame);
    case 'cpunch': return fromKeys(CPUNCH_KEYS, frame);
    case 'ckick': return fromKeys(CKICK_KEYS, frame);
    case 'jpunch': return fromKeys(JPUNCH_KEYS, frame);
    case 'jkick': return fromKeys(JKICK_KEYS, frame);
    case 'special': return specialPose(ch, frame);
    case 'hit': return hitPose(frame);
    case 'block': return blockPose(frame);
    case 'ko': return koPose(frame);
    case 'win': return winPose(frame);
    default: {
      const unknown = name;
      throw new Error('pose desconhecida: ' + unknown);
    }
  }
}

function drawLeg(pix, hip, knee, foot, r, pants, shoe, sole, shadeMul) {
  const thighR = Math.min(r, 6.2);
  const shinR = Math.min(r * 0.82, 4.6);
  capsule(pix, hip.x, hip.y, knee.x, knee.y, thighR, pants, shadeMul);
  capsule(pix, knee.x, knee.y, foot.x, foot.y - 3, shinR, pants, shadeMul);
  const srx = 5.6;
  const sry = 3.5;
  ellipse(pix, foot.x, foot.y + 1.6, srx, sry * 0.72, sole, shadeMul);
  ellipse(pix, foot.x, foot.y - 0.3, srx * 0.9, sry, shoe, shadeMul);
}

function drawArm(pix, shoulder, elbow, hand, r, sleeve, skin, shadeMul, band) {
  capsule(pix, shoulder.x, shoulder.y, elbow.x, elbow.y, r, sleeve || skin, shadeMul);
  capsule(pix, elbow.x, elbow.y, hand.x, hand.y, r * 0.82, sleeve || skin, shadeMul);
  ellipse(pix, hand.x, hand.y, r * 0.78, r * 0.72, skin, shadeMul);
  if (band) {
    const wx = elbow.x * 0.35 + hand.x * 0.65;
    const wy = elbow.y * 0.35 + hand.y * 0.65;
    ellipse(pix, wx, wy, r * 0.95, r * 0.7, band, 1);
  }
}

function drawTorso(pix, sk, ch) {
  const extra = 3.5 * sk.sc;
  const upX = sk.shoulderC.x - sk.hip.x;
  const upY = sk.shoulderC.y - sk.hip.y;
  const ul = Math.hypot(upX, upY) || 1;
  const ux = upX / ul;
  const uy = upY / ul;
  const rx = -uy;
  const ry = ux;
  const topW = sk.shW + extra;
  const botW = sk.hipWv + extra * 0.65;
  const sL = { x: sk.shoulderC.x - rx * topW, y: sk.shoulderC.y - ry * topW };
  const sR = { x: sk.shoulderC.x + rx * topW, y: sk.shoulderC.y + ry * topW };
  const hR = { x: sk.hip.x + rx * botW + ux * 5, y: sk.hip.y + ry * botW + uy * 5 };
  const hL = { x: sk.hip.x - rx * botW + ux * 5, y: sk.hip.y - ry * botW + uy * 5 };
  if (ch.outfit === 'tank') {
    fillQuad(pix, [sL, sR, hR, hL], ch.skinC);
    const cut = 0.42;
    const mL = { x: sL.x + (hL.x - sL.x) * cut, y: sL.y + (hL.y - sL.y) * cut };
    const mR = { x: sR.x + (hR.x - sR.x) * cut, y: sR.y + (hR.y - sR.y) * cut };
    fillQuad(pix, [mL, mR, hR, hL], ch.shirtC);
  } else {
    fillQuad(pix, [sL, sR, hR, hL], ch.shirtC);
  }
  if (ch.outfit === 'suit' || ch.outfit === 'cardigan') {
    const chest = ch.outfit === 'cardigan' ? ch.shirt2C : hex('#f4f1ea');
    const top = { x: sk.shoulderC.x, y: sk.shoulderC.y + 7 * sk.sc };
    const midL = { x: sk.shoulderC.x - 5 * sk.sc, y: sk.hip.y - 6 };
    const midR = { x: sk.shoulderC.x + 5 * sk.sc, y: sk.hip.y - 6 };
    fillQuad(pix, [top, { x: top.x + 1, y: top.y }, midR, midL], chest);
    capsule(pix, top.x, top.y + 2, sk.hip.x + 1, sk.hip.y - 4, 2.1 * sk.sc, ch.accentC, 1);
  }
  if (ch.outfit === 'armor') {
    ellipse(pix, sk.sR.x + 1, sk.sR.y + 2, 6 * sk.sc, 4.2 * sk.sc, ch.accentC, 1);
    ellipse(pix, sk.sL.x - 1, sk.sL.y + 2, 5 * sk.sc, 3.6 * sk.sc, mul(ch.accentC, 0.8), 0.8);
    capsule(pix, sk.shoulderC.x, sk.shoulderC.y + 10, sk.hip.x, sk.hip.y - 2, 1.6, mul(ch.shirtC, 0.55), 1);
  }
  if (ch.outfit === 'hoodie') {
    capsule(
      pix,
      sk.hip.x - 7,
      sk.hip.y - 8,
      sk.hip.x + 8,
      sk.hip.y - 8,
      1.5,
      mul(ch.shirtC, 0.55),
      1,
    );
    capsule(pix, sk.shoulderC.x, sk.shoulderC.y + 6, sk.hip.x, sk.hip.y - 8, 1.3, ch.accentC, 1);
  }
  if (ch.outfit === 'robe') {
    capsule(pix, sk.shoulderC.x + 4, sk.shoulderC.y + 8, sk.hip.x + 5, sk.hip.y, 1.7, ch.accentC, 1);
  }
  if (ch.outfit === 'vest') {
    ellipse(pix, sk.hip.x, sk.hip.y - 4, 3.2, 2.4, hex('#22262c'), 1);
    ellipse(pix, sk.hip.x + 6, sk.shoulderC.y + 14, 2, 2, ch.accentC, 1);
  }
  if (ch.buckle !== false && ch.outfit !== 'suit') {
    capsule(pix, sk.hip.x - sk.hipWv - 2, sk.hip.y - 1, sk.hip.x + sk.hipWv + 2, sk.hip.y - 1, 2, mul(ch.pantsC, 0.45), 1);
    ellipse(pix, sk.hip.x + 2, sk.hip.y - 1, 2.3, 2.1, ch.accentC, 1);
  }
  if (ch.logo === 'check') {
    const x = sk.shoulderC.x + 2;
    const y = sk.shoulderC.y + 14;
    line(pix, x - 3, y, x - 1, y + 3, hex('#14300a'));
    line(pix, x - 1, y + 3, x + 5, y - 3, hex('#14300a'));
    line(pix, x - 3, y - 1, x - 1, y + 2, ch.accentC);
    line(pix, x - 1, y + 2, x + 5, y - 4, ch.accentC);
  }
  if (ch.chain) {
    const y = sk.shoulderC.y + 11;
    for (let i = -4; i <= 4; i++) {
      pix.set(sk.shoulderC.x + i * 2, y + (i % 2), ch.accentC);
    }
  }
}

function drawHair(pix, sk, ch) {
  const { x, y } = sk.head;
  const hr = sk.hr;
  const hair = ch.hairColC;
  const sway = Math.sin(sk._frame * 0.7) * 3;
  if (ch.hair === 'bald') {
    ellipse(pix, x - 2, y - hr * 0.35, hr * 0.55, hr * 0.28, mul(ch.skinC, 1.28), 1);
    return;
  }
  if (ch.hair === 'slick') {
    ellipse(pix, x - 1, y - hr * 0.72, hr * 0.95, hr * 0.48, hair, 1);
    ellipse(pix, x + hr * 0.15, y - hr * 0.15, hr * 0.42, hr * 0.7, hair, 1);
    return;
  }
  if (ch.hair === 'short') {
    ellipse(pix, x - 1, y - hr * 0.62, hr * 0.92, hr * 0.5, hair, 1);
    ellipse(pix, x - hr * 0.7, y - hr * 0.1, hr * 0.28, hr * 0.42, hair, 0.9);
    return;
  }
  if (ch.hair === 'long') {
    ellipse(pix, x - 1, y - hr * 0.62, hr, hr * 0.52, hair, 1);
    capsule(pix, x - hr * 0.55, y - 2, x - hr * 0.9 + sway, y + hr * 1.7, 4.2, hair, 1);
    capsule(pix, x + hr * 0.1, y - hr * 0.2, x + 2, y + hr * 0.8, 3.2, hair, 1);
    return;
  }
  if (ch.hair === 'ponytail') {
    ellipse(pix, x - 1, y - hr * 0.58, hr * 0.9, hr * 0.5, hair, 1);
    capsule(pix, x - hr * 0.65, y - 4, x - hr * 1.15 + sway, y + hr * 1.35, 3.6, hair, 1);
    ellipse(pix, x - hr * 0.2, y - hr * 0.95, 3.2, 3.2, hair, 1);
    return;
  }
  if (ch.hair === 'bun') {
    ellipse(pix, x, y - hr * 0.55, hr * 0.78, hr * 0.42, hair, 1);
    ellipse(pix, x - 2, y - hr * 1.05, 5.5, 5.2, hair, 1);
    return;
  }
  if (ch.hair === 'recede') {
    ellipse(pix, x - 3, y - hr * 0.72, hr * 0.62, hr * 0.32, hair, 1);
    ellipse(pix, x - hr * 0.72, y - hr * 0.05, hr * 0.22, hr * 0.38, hair, 1);
    return;
  }
  if (ch.hair === 'hood') {
    ellipse(pix, x - 1, y - 1, hr + 5.5, hr + 6.5, ch.hoodC || hair, 1);
    ellipse(pix, x + 2, y + 2, hr - 2.4, hr - 1.5, ch.skinC, 1);
    return;
  }
  if (ch.hair === 'cap') {
    ellipse(pix, x, y - hr * 0.28, hr * 0.98, hr * 0.72, ch.capC, 1);
    capsule(pix, x - hr * 0.2, y - hr * 0.05, x - hr * 1.35, y + 3, 2.6, ch.capC, 1);
    ellipse(pix, x + 1, y + hr * 0.05, hr * 0.72, hr * 0.48, ch.skinC, 1);
    return;
  }
  if (ch.hair === 'helmet') {
    ellipse(pix, x - 1, y - hr * 0.42, hr + 2.4, hr * 0.78, ch.capC, 1);
    capsule(pix, x - hr - 1, y - 1, x + hr + 3, y - 1, 2.3, mul(ch.capC, 0.85), 1);
    ellipse(pix, x - 4, y - hr * 0.55, 3, 2, mul(ch.capC, 1.35), 1);
    return;
  }
}

function drawFace(pix, sk, ch, pose) {
  const x = sk.head.x;
  const y = sk.head.y;
  const hr = sk.hr;
  const skinShadow = mul(ch.skinC, 0.72);
  const ink = hex('#1a1210');
  if (ch.hair === 'hood' || ch.hair === 'cap' || ch.hair === 'helmet') {
    // o rosto já foi reaberto em drawHair; olhos vêm em seguida
  }
  if (ch.beard === 'full') {
    ellipse(pix, x + 1, y + hr * 0.28, hr * 0.92, hr * 0.62, ch.hairColC, 1);
    ellipse(pix, x - hr * 0.55, y + 1, hr * 0.28, hr * 0.4, ch.hairColC, 0.9);
  } else if (ch.beard === 'short') {
    ellipse(pix, x + 2, y + hr * 0.42, hr * 0.48, hr * 0.28, ch.hairColC, 1);
  }

  if (ch.mask) {
    rect(pix, x - hr * 0.2, y - 1, hr * 1.3, hr * 0.95, hex('#14161c'));
    rect(pix, x + 1, y - 3, hr * 0.95, 3, hex('#f2f4f8'));
    rect(pix, x + hr * 0.55, y - 3, 3, 3, hex('#c9a227'));
    return;
  }

  if (ch.visor) {
    rect(pix, x - 2, y - 5, hr + 6, 6, ch.accentC);
    rect(pix, x, y - 4, 7, 2, hex('#fff6d0'));
    rect(pix, x + 8, y - 3, 3, 3, hex('#3a2a08'));
    return;
  }

  const blink = pose.blink;
  const ex1 = x - 1;
  const ex2 = x + 6;
  const ey = y - 3;
  if (blink) {
    line(pix, ex1, ey + 1, ex1 + 4, ey + 1, ink);
    line(pix, ex2, ey + 1, ex2 + 4, ey + 1, ink);
  } else if (pose.expr === 'hurt') {
    line(pix, ex1, ey, ex1 + 4, ey + 3, ink);
    line(pix, ex1, ey + 3, ex1 + 4, ey, ink);
    line(pix, ex2, ey, ex2 + 4, ey + 3, ink);
    line(pix, ex2, ey + 3, ex2 + 4, ey, ink);
  } else {
    rect(pix, ex1, ey, 4, 4, hex('#f7f7fb'));
    rect(pix, ex2, ey, 4, 4, hex('#f7f7fb'));
    const look = pose.expr === 'hurt' ? 0 : 2;
    rect(pix, ex1 + look, ey + 1, 2, 2, ink);
    rect(pix, ex2 + look, ey + 1, 2, 2, ink);
    if (ch.lashes) {
      line(pix, ex1, ey - 1, ex1 + 4, ey - 1, ink);
      line(pix, ex2, ey - 1, ex2 + 4, ey - 1, ink);
    }
  }

  const brow = pose.expr === 'hurt' ? -2 : pose.expr === 'smile' || pose.expr === 'smug' ? 1 : 0;
  const angry = pose.expr === 'grit' || pose.expr === 'yell' || pose.expr === 'focus';
  if (angry) {
    line(pix, ex1, ey - 2, ex1 + 4, ey - 1 + brow, ink);
    line(pix, ex2, ey - 1 + brow, ex2 + 4, ey - 2, ink);
  } else {
    line(pix, ex1, ey - 2 + brow, ex1 + 4, ey - 2 + brow, ink);
    line(pix, ex2, ey - 2 + brow, ex2 + 4, ey - 2 + brow, ink);
  }

  const my = y + 5;
  if (ch.beard !== 'full') {
    if (pose.expr === 'yell' || pose.expr === 'hurt') {
      rect(pix, x + 2, my, 5, 3, hex('#4a2030'));
      rect(pix, x + 3, my, 3, 1, hex('#f0f0f0'));
    } else if (pose.expr === 'smile' || pose.expr === 'smug') {
      line(pix, x + 1, my, x + 3, my + 1, ink);
      line(pix, x + 3, my + 1, x + 7, my - 1, ink);
    } else {
      line(pix, x + 2, my, x + 6, my, skinShadow);
    }
  }

  if (ch.glasses === 'square') {
    line(pix, ex1 - 1, ey - 1, ex1 + 5, ey - 1, ink);
    line(pix, ex1 - 1, ey + 4, ex1 + 5, ey + 4, ink);
    line(pix, ex1 - 1, ey - 1, ex1 - 1, ey + 4, ink);
    line(pix, ex1 + 5, ey - 1, ex1 + 5, ey + 4, ink);
    line(pix, ex2 - 1, ey - 1, ex2 + 5, ey - 1, ink);
    line(pix, ex2 - 1, ey + 4, ex2 + 5, ey + 4, ink);
    line(pix, ex2 - 1, ey - 1, ex2 - 1, ey + 4, ink);
    line(pix, ex2 + 5, ey - 1, ex2 + 5, ey + 4, ink);
    line(pix, ex1 + 5, ey + 1, ex2 - 1, ey + 1, ink);
  } else if (ch.glasses === 'round') {
    ring(pix, ex1 + 2, ey + 2, 3.1, ink);
    ring(pix, ex2 + 2, ey + 2, 3.1, ink);
    line(pix, ex1 + 5, ey + 2, ex2 - 1, ey + 2, ink);
  }

  if (ch.scar) {
    line(pix, x - 1, y - 6, x + 3, y + 1, hex('#c24b55'));
  }
  if (ch.extraEyes) {
    ellipse(pix, x - 2, y - hr * 0.55, 2.4, 2.1, hex('#f4f7c8'), 1);
    ellipse(pix, x + 5, y - hr * 0.62, 2.2, 1.9, hex('#f4f7c8'), 1);
    pix.set(x - 1, y - hr * 0.55, hex('#243000'));
    pix.set(x + 6, y - hr * 0.62, hex('#243000'));
    ellipse(pix, x + hr * 0.15, y - hr * 0.95, 1.8, 1.6, hex('#e7f59a'), 1);
  }
  if (ch.blush) {
    ellipse(pix, x + 8, y + 2, 2.2, 1.3, hex('#ff8eae'), 1);
  }
  if (ch.old) {
    line(pix, x - 3, y - 6, x + 3, y - 7, mul(ch.skinC, 0.62));
  }
}

function drawProp(pix, sk, ch, pose) {
  const hand = sk.handR;
  const ang = (Math.atan2(hand.y - sk.eR.y, hand.x - sk.eR.x) * 180) / Math.PI;
  if (ch.prop === 'axe' && pose.fx > 0.2) {
    const tip = polar(hand, ang, 16);
    capsule(pix, hand.x, hand.y, tip.x, tip.y, 1.8, hex('#6a4324'), 1);
    ellipse(pix, tip.x, tip.y, 6.5, 4.6, hex('#d5dbe3'), 1);
    ellipse(pix, tip.x + 1, tip.y - 1, 2.4, 1.6, hex('#ffffff'), 1);
  } else if (ch.prop === 'axe') {
    const grip = { x: sk.hip.x - 16, y: sk.hip.y - 2 };
    const tip = { x: grip.x - 3, y: grip.y - 24 };
    capsule(pix, grip.x, grip.y, tip.x, tip.y, 1.7, hex('#6b4423'), 1);
    ellipse(pix, tip.x - 6, tip.y + 1, 8, 5.2, hex('#dfe5ee'), 1);
    ellipse(pix, tip.x - 7, tip.y + 2, 3.2, 2, hex('#8b95a3'), 1);
  }
  if (ch.prop === 'clipboard') {
    const hx = sk.handL.x;
    const hy = sk.handL.y;
    rect(pix, hx - 5, hy - 8, 10, 14, hex('#8d6e63'));
    rect(pix, hx - 4, hy - 6, 8, 11, hex('#f7f4ee'));
    line(pix, hx - 3, hy - 3, hx + 3, hy - 3, hex('#c0392b'));
    line(pix, hx - 3, hy, hx + 2, hy, hex('#90a4ae'));
  }
  if (ch.prop === 'book') {
    const hx = sk.handL.x;
    const hy = sk.handL.y;
    rect(pix, hx - 6, hy - 5, 12, 10, hex('#f0c14a'));
    rect(pix, hx - 5, hy - 4, 10, 8, hex('#f8f1dc'));
    line(pix, hx, hy - 4, hx, hy + 4, hex('#a37b32'));
  }
  if (ch.tubes) {
    const s = sk.sL;
    capsule(pix, s.x, s.y, s.x - 8, s.y - 18, 3, ch.accentC, 0.85);
    capsule(pix, s.x - 8, s.y - 18, s.x - 2, s.y - 30, 2.4, mul(ch.accentC, 1.15), 1);
    ellipse(pix, s.x - 2, s.y - 30, 3.2, 3.2, hex('#f1e8ff'), 1);
    capsule(pix, s.x + 2, s.y + 2, s.x - 6, s.y - 12, 2.2, mul(ch.accentC, 0.75), 0.8);
  }
}

function drawFX(pix, sk, ch, pose) {
  if (!pose.fx || pose.fx < 0.15) return;
  const hand = sk.handR;
  const col = ch.accentC;
  const n = 7;
  const rad = 8 + pose.fx * 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + pose.frame * 0.7;
    const x = hand.x + Math.cos(a) * rad;
    const y = hand.y + Math.sin(a) * rad * 0.8;
    ellipse(pix, x, y, 1.7, 1.7, i % 2 ? hex('#ffffff') : col, 1);
  }
  if (ch.fx === 'fire') {
    for (let i = 0; i < 5; i++) {
      ellipse(
        pix,
        hand.x + 8 + i * 3,
        hand.y - 4 - (i % 2) * 3,
        2.4,
        3.2,
        i % 2 ? hex('#ffd27a') : hex('#ff5a32'),
        1,
      );
    }
  }
  if (ch.fx === 'gear') {
    const g = 7;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + pose.frame;
      rect(pix, hand.x + Math.cos(a) * g - 1, hand.y + Math.sin(a) * g - 1, 3, 3, col);
    }
    ellipse(pix, hand.x, hand.y, 4, 4, col, 1);
    ellipse(pix, hand.x, hand.y, 2, 2, hex('#14382c'), 1);
  }
  if (ch.fx === 'box') {
    const s = 8;
    line(pix, hand.x - s, hand.y - s, hand.x + s, hand.y - s, col);
    line(pix, hand.x + s, hand.y - s, hand.x + s, hand.y + s, col);
    line(pix, hand.x + s, hand.y + s, hand.x - s, hand.y + s, col);
    line(pix, hand.x - s, hand.y + s, hand.x - s, hand.y - s, col);
  }
  if (ch.fx === 'bug') {
    ellipse(pix, hand.x + 8, hand.y, 5, 4, col, 1);
    line(pix, hand.x + 4, hand.y - 3, hand.x + 1, hand.y - 7, inkSafe());
    line(pix, hand.x + 8, hand.y - 4, hand.x + 8, hand.y - 8, inkSafe());
    line(pix, hand.x + 12, hand.y - 3, hand.x + 15, hand.y - 7, inkSafe());
  }
  if (ch.fx === 'car') {
    rect(pix, hand.x + 2, hand.y - 3, 16, 7, ch.shirtC);
    rect(pix, hand.x + 6, hand.y - 7, 8, 4, hex('#d9f6ff'));
    ellipse(pix, hand.x + 5, hand.y + 4, 2, 2, hex('#222'), 1);
    ellipse(pix, hand.x + 14, hand.y + 4, 2, 2, hex('#222'), 1);
  }
}

function inkSafe() {
  return hex('#1a1210');
}

function renderFigure(pix, ch, pose) {
  const sk = buildSkeleton(ch, pose);
  sk._frame = pose.frame;
  const armR = ch.armR * sk.sc;
  const legR = ch.legR * sk.sc;
  const sleeve = ch.sleeveC;
  const band = ch.band ? ch.accentC : null;

  if (ch.tubes) drawProp(pix, sk, { ...ch, prop: null, tubes: true }, pose);

  drawLeg(pix, sk.hL, sk.kneeL, sk.footL, legR, mul(ch.pantsC, 0.78), mul(ch.shoeC, 0.86), hex('#1a1a1a'), 0.75);
  drawArm(pix, sk.sL, sk.eL, sk.handL, armR * 0.92, sleeve ? mul(sleeve, 0.8) : mul(ch.skinC, 0.86), mul(ch.skinC, 0.9), 0.75, null);

  drawTorso(pix, sk, ch);
  capsule(pix, sk.shoulderC.x, sk.shoulderC.y, sk.head.x, sk.head.y + sk.hr * 0.2, 3.3 * sk.sc, ch.skinC, 1);

  drawLeg(pix, sk.hR, sk.kneeR, sk.footR, legR, ch.pantsC, ch.shoeC, hex('#241c16'), 1);
  ellipse(pix, sk.head.x, sk.head.y, sk.hr, sk.hr * 1.05, ch.skinC, 1);
  ellipse(pix, sk.head.x - sk.hr * 0.82, sk.head.y + 1, 2.4, 3.1, mul(ch.skinC, 0.92), 1);
  drawHair(pix, sk, ch);
  drawFace(pix, sk, ch, pose);
  drawArm(pix, sk.sR, sk.eR, sk.handR, armR, sleeve, ch.skinC, 1, band);
  if (ch.prop === 'clipboard' || ch.prop === 'book' || ch.prop === 'axe') drawProp(pix, sk, ch, pose);
  return sk;
}

function renderFrame(ch, name, frame) {
  const pix = new Pix(FW, FH);
  const pose = poseFor(ch, name, frame);
  if (pose.ghost) {
    const ghostPix = new Pix(FW, FH);
    ghostPix.alpha = 110;
    renderFigure(ghostPix, ch, { ...pose, fx: 0 });
    pix.blitShift(ghostPix, -pose.ghost, 1);
  }
  const sk = renderFigure(pix, ch, pose);
  addOutline(pix, ch.outline);
  const fxLayer = new Pix(FW, FH);
  drawFX(fxLayer, sk, ch, pose);
  pix.blit(fxLayer, 0, 0);
  return pix;
}

Pix.prototype.blitShift = function blitShift(src, dx, dy) {
  const prev = this.alpha;
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const si = (y * src.w + x) * 4;
      if (src.d[si + 3] < 8) continue;
      this.alpha = Math.min(prev, src.d[si + 3]);
      this.set(x + dx, y + dy, [src.d[si], src.d[si + 1], src.d[si + 2]]);
    }
  }
  this.alpha = prev;
};

function paintChar(raw) {
  const ch = { ...raw };
  const keys = ['skin', 'hairCol', 'shirt', 'pants', 'shoe', 'sleeve', 'accent', 'hood', 'cap', 'shirt2'];
  for (const k of keys) {
    if (ch[k]) ch[k + 'C'] = hex(ch[k]);
  }
  ch.outline = mix(hex('#07060d'), ch.shirtC, 0.2);
  if (!ch.sleeve) ch.sleeveC = null;
  return ch;
}

const CHARS = [
  {
    id: 'du', name: 'DU', scale: 1.05, shoulder: 18, hipW: 13, headR: 11, armR: 5.5, legR: 6.3,
    skin: '#e0a56e', hairCol: '#3a2618', shirt: '#9c2428', pants: '#3c2b1e', shoe: '#1c140e',
    sleeve: '#9c2428', accent: '#f0c14b', hair: 'bald', beard: 'full', glasses: 'square',
    scar: true, outfit: 'shirt', prop: 'axe', fx: 'fire', band: true, face: 'grit',
  },
  {
    id: 'iales', name: 'IALES', scale: 1.06, shoulder: 13, hipW: 9, headR: 10, armR: 3.7, legR: 4.3,
    skin: '#f0d2b6', hairCol: '#121218', shirt: '#1a1a24', pants: '#101018', shoe: '#0a0a0e',
    sleeve: '#1a1a24', accent: '#c084fc', hair: 'slick', beard: null, glasses: null,
    extraEyes: true, tubes: true, outfit: 'suit', buckle: false, face: 'smug', fx: 'orb',
  },
  {
    id: 'felipinho', name: 'FELIPE', scale: 0.86, shoulder: 14, hipW: 11, headR: 11.5, armR: 4.1, legR: 4.8,
    skin: '#c68642', hairCol: '#24160e', shirt: '#3fae5a', pants: '#2d62a8', shoe: '#f4f4f4',
    sleeve: '#3fae5a', accent: '#ffd76a', hair: 'cap', cap: '#2f7a40', beard: null,
    glasses: 'round', chain: true, outfit: 'shirt', face: 'smug', fx: 'car',
  },
  {
    id: 'stack', name: 'STACK', scale: 1, shoulder: 16, hipW: 13, headR: 11, armR: 4.8, legR: 5.6,
    skin: '#e6b888', hairCol: '#6a4424', shirt: '#e8872c', pants: '#3a3a3a', shoe: '#2a2a2a',
    sleeve: '#d07220', accent: '#58cc02', hair: 'short', beard: 'short', glasses: 'square',
    outfit: 'robe', logo: 'check', face: 'focus', fx: 'orb',
  },
  {
    id: 'gitmaster', name: 'GIT', scale: 1, shoulder: 13, hipW: 9, headR: 10, armR: 3.8, legR: 4.4,
    skin: '#d7a06a', hairCol: '#1c2128', shirt: '#23272e', pants: '#16181d', shoe: '#f85149',
    sleeve: '#23272e', accent: '#f85149', hair: 'hood', hood: '#1c2128', mask: true,
    outfit: 'shirt', face: 'focus', fx: 'orb',
  },
  {
    id: 'bughunter', name: 'BUG', scale: 1, shoulder: 14, hipW: 11, headR: 10, armR: 4.1, legR: 4.9,
    skin: '#f0c4a4', hairCol: '#ff6a1a', shirt: '#2a62d0', pants: '#17325c', shoe: '#141820',
    sleeve: '#2458b8', accent: '#ffd24a', hair: 'ponytail', visor: true, lashes: true,
    outfit: 'armor', face: 'focus', fx: 'bug', band: true,
  },
  {
    id: 'frontend', name: 'FRONT', scale: 0.97, shoulder: 12, hipW: 10, headR: 10.2, armR: 3.5, legR: 4.2,
    skin: '#f6d0b4', hairCol: '#ff4f9a', shirt: '#6d4aff', pants: '#2a2a38', shoe: '#f7f7fb',
    sleeve: '#6d4aff', accent: '#00e5ff', hair: 'long', glasses: 'round', lashes: true,
    blush: true, outfit: 'shirt', face: 'smile', fx: 'box',
  },
  {
    id: 'backend', name: 'BACK', scale: 1.08, shoulder: 20, hipW: 14, headR: 10.5, armR: 6.6, legR: 7,
    skin: '#b87440', hairCol: '#161616', shirt: '#242830', pants: '#14161c', shoe: '#0c0c0e',
    sleeve: null, accent: '#ff3b30', hair: 'short', beard: 'full', outfit: 'tank',
    face: 'grit', fx: 'orb', band: true,
  },
  {
    id: 'devops', name: 'DEVOPS', scale: 1, shoulder: 15, hipW: 12, headR: 10, armR: 4.6, legR: 5.3,
    skin: '#e0b090', hairCol: '#4a3a2a', shirt: '#12866a', pants: '#2a3844', shoe: '#3a3120',
    sleeve: '#0e6e58', accent: '#f0c040', hair: 'helmet', cap: '#f0c040', outfit: 'vest',
    face: 'focus', fx: 'gear', band: true,
  },
  {
    id: 'qa', name: 'QA', scale: 0.98, shoulder: 13, hipW: 11, headR: 10, armR: 3.8, legR: 4.6,
    skin: '#f0c8a4', hairCol: '#6a3a1c', shirt: '#eceff1', pants: '#455a64', shoe: '#263238',
    sleeve: '#cfd8dc', accent: '#e53935', hair: 'bun', lashes: true, outfit: 'vest',
    prop: 'clipboard', face: 'focus', fx: 'box', shirt2: '#eceff1',
  },
  {
    id: 'scrum', name: 'SCRUM', scale: 1, shoulder: 14, hipW: 11, headR: 10, armR: 4.2, legR: 5,
    skin: '#e0b184', hairCol: '#2a2a2a', shirt: '#3d4db8', pants: '#2c3344', shoe: '#1c2030',
    sleeve: '#3d4db8', accent: '#8fbf6a', hair: 'short', beard: 'short', glasses: 'square',
    outfit: 'suit', buckle: false, face: 'smile', fx: 'orb',
  },
  {
    id: 'fullstack', name: 'FULL', scale: 1, shoulder: 15, hipW: 12, headR: 10.2, armR: 4.5, legR: 5.2,
    skin: '#e8c0a0', hairCol: '#3a2a18', shirt: '#6d28d9', pants: '#1f2937', shoe: '#e5e7eb',
    sleeve: '#5b21b6', accent: '#22d3ee', hair: 'short', beard: 'short', glasses: 'square',
    outfit: 'hoodie', face: 'focus', fx: 'orb', band: true,
  },
  {
    id: 'senpai', name: 'SENPAI', scale: 1.02, shoulder: 15, hipW: 12, headR: 10.4, armR: 4.4, legR: 5.1,
    skin: '#d8a878', hairCol: '#8d8d8d', shirt: '#1d4ed8', pants: '#334155', shoe: '#1f2937',
    sleeve: '#1e40af', accent: '#facc15', hair: 'recede', beard: 'short', glasses: 'square',
    outfit: 'cardigan', buckle: false, prop: 'book', face: 'focus', fx: 'orb', old: true,
    shirt2: '#f8fafc',
  },
].map(paintChar);

function pngCRC(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(pngCRC(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(pix) {
  const { w, h, d } = pix;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    const row = y * (w * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < w * 4; x++) raw[row + 1 + x] = d[y * w * 4 + x];
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function measureBottom(pix) {
  for (let y = pix.h - 1; y >= 0; y--) {
    for (let x = 0; x < pix.w; x++) {
      if (pix.alphaAt(x, y) > 20) return y;
    }
  }
  return pix.h - 1;
}

const FONT = {
  A: [2, 5, 7, 5, 5], B: [6, 5, 6, 5, 6], C: [3, 4, 4, 4, 3], D: [6, 5, 5, 5, 6],
  E: [7, 4, 6, 4, 7], F: [7, 4, 6, 4, 4], G: [3, 4, 5, 5, 3], H: [5, 5, 7, 5, 5],
  I: [7, 2, 2, 2, 7], K: [5, 5, 6, 5, 5], L: [4, 4, 4, 4, 7], M: [5, 7, 5, 5, 5],
  N: [5, 7, 7, 5, 5], O: [2, 5, 5, 5, 2], P: [6, 5, 6, 4, 4], Q: [2, 5, 5, 3, 1],
  R: [6, 5, 6, 5, 5], S: [3, 4, 2, 1, 6], T: [7, 2, 2, 2, 2], U: [5, 5, 5, 5, 7],
  V: [5, 5, 5, 5, 2], Y: [5, 5, 2, 2, 2],
};

function drawText(pix, text, x, y, col) {
  let cx = x;
  for (const ch of text) {
    const g = FONT[ch];
    if (!g) { cx += 4; continue; }
    for (let row = 0; row < 5; row++) {
      for (let bit = 0; bit < 3; bit++) {
        if (g[row] & (1 << (2 - bit))) {
          pix.set(cx + bit, y + row, col);
          pix.set(cx + bit, y + row, col);
        }
      }
    }
    cx += 4;
  }
}

function buildSheet(ch) {
  const sheet = new Pix(COLS * FW, POSES.length * FH);
  let opaque = 0;
  let idleBottom = 0;
  for (let row = 0; row < POSES.length; row++) {
    const name = POSES[row];
    const count = FRAMES[name];
    for (let col = 0; col < count; col++) {
      const frame = renderFrame(ch, name, col);
      if (name === 'idle' && col === 0) {
        idleBottom = measureBottom(frame);
        for (let i = 3; i < frame.d.length; i += 4) if (frame.d[i] > 20) opaque++;
      }
      sheet.blit(frame, col * FW, row * FH);
    }
  }
  if (opaque < 250) throw new Error(ch.id + ' saiu quase vazio (' + opaque + ' px)');
  return { sheet, idleBottom };
}

function buildLineup(items) {
  const scale = 2;
  const cell = 150;
  const pix = new Pix(cell * items.length, FH * scale + 28);
  for (let i = 0; i < pix.d.length; i += 4) {
    pix.d[i] = 10;
    pix.d[i + 1] = 12;
    pix.d[i + 2] = 20;
    pix.d[i + 3] = 255;
  }
  items.forEach((item, i) => {
    const frame = renderFrame(item.ch, 'idle', 1);
    for (let y = 0; y < FH; y++) {
      for (let x = 0; x < FW; x++) {
        const a = frame.alphaAt(x, y);
        if (a < 16) continue;
        const si = (y * FW + x) * 4;
        const col = [frame.d[si], frame.d[si + 1], frame.d[si + 2]];
        for (let oy = 0; oy < scale; oy++) {
          for (let ox = 0; ox < scale; ox++) {
            pix.alpha = 255;
            pix.set(i * cell + 20 + x * scale + ox, 8 + y * scale + oy, col);
          }
        }
      }
    }
    drawText(pix, item.ch.name, i * cell + 36, FH * scale + 10, hex('#d7ffe8'));
  });
  pix.alpha = 255;
  return pix;
}

mkdirSync(OUT, { recursive: true });
const files = {};
let baseline = 0;
const t0 = Date.now();
for (const ch of CHARS) {
  const { sheet, idleBottom } = buildSheet(ch);
  baseline = Math.max(baseline, idleBottom);
  const file = `${ch.id}.png`;
  writeFileSync(join(OUT, file), encodePNG(sheet));
  files[ch.id] = `assets/sprites/${file}`;
  process.stdout.write(`  ${ch.id}.png  idle-base ${idleBottom}\n`);
}
const lineup = buildLineup(CHARS.map((ch) => ({ ch })));
writeFileSync(join(OUT, 'elenco.png'), encodePNG(lineup));

const layout = `/* Gerado por tools/generate-sprites.mjs — não edite à mão. */
const SPRITE_LAYOUT = ${JSON.stringify({
  frameW: FW,
  frameH: FH,
  cols: COLS,
  baseline,
  drawScale: 2,
  poses: POSES,
  frames: FRAMES,
  files,
}, null, 2)};
`;
writeFileSync(join(OUT, 'layout.js'), layout);
writeFileSync(join(OUT, 'README.txt'), `Sprite sheets geradas por tools/generate-sprites.mjs.
Arte original do DS Fighters. Para regerar: node tools/generate-sprites.mjs
`);
process.stdout.write(`ok ${CHARS.length} lutadores, baseline ${baseline}, ${Date.now() - t0} ms\n`);
