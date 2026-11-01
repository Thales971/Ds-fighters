/* ============================================================
   DS FIGHTERS — Sprites em pixel art (sheets geradas + fallback).
   O layout vem de assets/sprites/layout.js.
   ============================================================ */

const SpriteGen = {
  images: {},
  _flash: null,

  load() {
    const files = SPRITE_LAYOUT.files || {};
    Object.entries(files).forEach(([id, src]) => {
      const img = new Image();
      img.onload = () => { this.images[id] = img; };
      img.onerror = () => { this.images[id] = null; };
      img.src = src;
    });
  },

  count(pose) {
    return SPRITE_LAYOUT.frames[pose] || SPRITE_LAYOUT.frames.idle || 1;
  },

  rowOf(pose) {
    const i = SPRITE_LAYOUT.poses.indexOf(pose);
    return i < 0 ? 0 : i;
  },

  blit(ctx, id, pose, frame, dir, centerX, feetY, white = false, scale = null, xf = null) {
    const L = SPRITE_LAYOUT;
    const sc = scale || L.drawScale;
    const fw = L.frameW;
    const fh = L.frameH;
    const n = this.count(pose);
    const col = ((frame % n) + n) % n;
    const row = this.rowOf(pose);
    const dw = fw * sc;
    const dh = fh * sc;
    const top = Math.round(feetY - L.baseline * sc);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(centerX + (xf ? xf.dx * dir : 0)), top + (xf ? xf.dy : 0));
    if (xf && (xf.sx !== 1 || xf.sy !== 1 || xf.rot)) {
      // pivô no pé: o boneco estica/achata/inclina sem sair do chão
      const py = L.baseline * sc;
      ctx.translate(0, py);
      if (xf.rot) ctx.rotate(xf.rot * dir);
      ctx.scale(xf.sx, xf.sy);
      ctx.translate(0, -py);
    }
    if (dir < 0) ctx.scale(-1, 1);

    const img = this.images[id];
    if (img) {
      if (white) {
        const c = this._flash || (this._flash = document.createElement('canvas'));
        if (c.width !== fw) { c.width = fw; c.height = fh; }
        const fx = c.getContext('2d');
        fx.clearRect(0, 0, fw, fh);
        fx.drawImage(img, col * fw, row * fh, fw, fh, 0, 0, fw, fh);
        fx.globalCompositeOperation = 'source-in';
        fx.fillStyle = '#ffffff';
        fx.fillRect(0, 0, fw, fh);
        fx.globalCompositeOperation = 'source-over';
        ctx.drawImage(c, Math.round(-dw / 2), 0, dw, dh);
      } else {
        ctx.drawImage(img, col * fw, row * fh, fw, fh, Math.round(-dw / 2), 0, dw, dh);
      }
    } else {
      this.drawFallback(ctx, id, pose, frame, dw, dh);
    }
    ctx.restore();
  },

  drawFallback(ctx, id, pose, frame, dw, dh) {
    const def = (typeof FIGHTERS !== 'undefined' && FIGHTERS.find((f) => f.id === id)) || null;
    const C = (def && def.colors) || {};
    const bob = (pose === 'idle' || pose === 'walk') ? Math.sin(frame) * 2 : 0;
    const kick = pose === 'kick' || pose === 'jkick' || pose === 'ckick';
    const punch = pose === 'punch' || pose === 'jpunch' || pose === 'cpunch' || pose === 'special';
    ctx.save();
    ctx.translate(0, bob);
    const s = dw / 96;
    const skin = C.skin || '#e0a56e';
    const shirt = C.shirt || '#335';
    const pants = C.pants || '#333';
    const shoe = C.shoes || '#111';
    const hair = C.hair || '#222';
    ctx.fillStyle = pants;
    ctx.fillRect(-8 * s, dh - 58 * s, 7 * s, 28 * s);
    ctx.fillRect(2 * s, dh - 58 * s, 7 * s, 28 * s);
    if (kick) ctx.fillRect(8 * s, dh - 70 * s, 26 * s, 6 * s);
    ctx.fillStyle = shoe;
    ctx.fillRect(-9 * s, dh - 32 * s, 8 * s, 6 * s);
    ctx.fillRect(2 * s, dh - 32 * s, 8 * s, 6 * s);
    ctx.fillStyle = shirt;
    ctx.fillRect(-12 * s, dh - 92 * s, 24 * s, 36 * s);
    ctx.fillStyle = skin;
    ctx.fillRect(-10 * s, dh - 118 * s, 20 * s, 22 * s);
    ctx.fillStyle = hair;
    ctx.fillRect(-10 * s, dh - 122 * s, 20 * s, 6 * s);
    ctx.fillStyle = skin;
    if (punch) ctx.fillRect(10 * s, dh - 84 * s, 22 * s, 6 * s);
    else ctx.fillRect(-20 * s, dh - 80 * s, 8 * s, 18 * s);
    ctx.fillRect(12 * s, dh - 80 * s, 8 * s, 18 * s);
    ctx.restore();
  },
};

SpriteGen.load();
