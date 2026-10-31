/* ============================================================
   DS FIGHTERS — Cenário: só blit do spritesheet animado.
   ============================================================ */

class StageFX {
  constructor(stageDef, W, H) {
    this.def = stageDef;
    this.W = W;
    this.H = H;
    this.cd = new Map();
    this.img = new Image();
    this.img.src = stageDef.sheet;
  }

  tick() {
    for (const [k, v] of this.cd) {
      if (v <= 1) this.cd.delete(k);
      else this.cd.set(k, v - 1);
    }
  }

  draw(ctx, t, cam = 0) {
    const img = this.img;
    const def = this.def;
    ctx.imageSmoothingEnabled = false;
    if (!img.complete || !img.naturalWidth) {
      ctx.fillStyle = '#070910';
      ctx.fillRect(0, 0, this.W, this.H);
      return;
    }
    const k = Math.floor(t * def.fps) % def.frames;
    const col = k % def.cols;
    const row = (k / def.cols) | 0;
    const pad = 36;
    const dx = Math.round(-pad / 2 - cam * 0.25);
    ctx.drawImage(
      img,
      col * def.frameW, row * def.frameH, def.frameW, def.frameH,
      dx, 0, this.W + pad, this.H
    );
  }

  check() {}
}
