/* ============================================================
   DS FIGHTERS — Blit de efeitos. Nenhum golpe desenha forma:
   tudo sai do spritesheet declarado em assets/fx/layout.js.
   ============================================================ */

const Fx = {
  images: {},

  load() {
    const sheets = (typeof FX_LAYOUT !== 'undefined' && FX_LAYOUT.sheets) || {};
    Object.entries(sheets).forEach(([id, src]) => {
      const img = new Image();
      img.onload = () => { this.images[id] = img; };
      img.onerror = () => { this.images[id] = null; };
      img.src = src;
    });
  },

  blit(ctx, sheet, clip, frame, x, y, opts = {}) {
    const L = typeof FX_LAYOUT !== 'undefined' ? FX_LAYOUT : null;
    const img = this.images[sheet];
    const spec = L && L.clips[clip];
    if (!L || !img || !img.complete || !img.naturalWidth || !spec) return;
    const f = ((frame % spec.frames) + spec.frames) % spec.frames;
    const sc = opts.scale || 2;
    const dw = L.frameW * sc;
    const dh = L.frameH * sc;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = opts.alpha == null ? 1 : opts.alpha;
    ctx.translate(Math.round(x), Math.round(y));
    if (opts.dir < 0) ctx.scale(-1, 1);
    ctx.drawImage(img, f * L.frameW, spec.row * L.frameH, L.frameW, L.frameH, Math.round(-dw / 2), Math.round(-dh / 2), dw, dh);
    ctx.restore();
  },
};

Fx.load();
