/* ============================================================
   DS FIGHTERS — Renderização de cenários.
   Fundo animado (spritesheet 6x4) ou ilustrado (jpg) com:
   parallax pela câmera, respiração de zoom, gradação de cor e luz,
   partículas de ambiente (brasas, pétalas, bolhas, vaga-lumes),
   fauna (pássaros, abelhas, borboletas, morcegos, peixes) e vinheta.
   ============================================================ */
const FAUNA_ROW = { bee: 0, butterfly: 1, bat: 2, fish: 3 };

class StageRenderer {
  constructor(def, W, H, groundY) {
    this.def = def;
    this.W = W;
    this.H = H;
    this.groundY = groundY;
    this.t = 0;
    this.reducedFlag = false;
    this.img = new Image();
    this.ready = false;
    this.usingSheet = !!def.sheet;
    this.img.onload = () => { this.ready = true; };
    this.img.onerror = () => {
      if (this.usingSheet && def.image) {
        this.usingSheet = false;
        this.img.src = def.image;
      }
    };
    this.img.src = def.sheet || def.image;
    this.ambient = [];
    this.fauna = [];
    this.makeFauna();
    this.vignette = null;
  }
  makeFauna() {
    const list = this.def.fauna || [];
    list.forEach((kind, i) => {
      const n = kind === 'bee' ? 3 : 2;
      for (let k = 0; k < n; k++) {
        this.fauna.push({
          kind,
          x: Math.random() * this.W,
          y: kind === 'fish' ? 120 + Math.random() * 260 : kind === 'bird' ? 40 + Math.random() * 140 : 120 + Math.random() * 240,
          vx: (Math.random() < 0.5 ? -1 : 1) * (kind === 'bird' ? 1.3 + Math.random() : 0.5 + Math.random() * 0.8),
          ph: Math.random() * 10,
          row: kind === 'bird' ? ((i + k) % 3) : FAUNA_ROW[kind] || 0,
          s: 0.7 + Math.random() * 0.5,
        });
      }
    });
  }
  frameRect() {
    const d = this.def;
    if (!this.usingSheet) return [0, 0, this.img.naturalWidth || this.W, this.img.naturalHeight || this.H];
    const f = this.reducedFlag ? 0 : Math.floor(this.t / (60 / (d.fps || 10))) % d.frames;
    return [(f % d.cols) * d.frameW, Math.floor(f / d.cols) * d.frameH, d.frameW, d.frameH];
  }
  update(weather) {
    this.t++;
    const d = this.def;
    const want = this.reducedFlag ? 10 : 34;
    const kinds = [];
    if (d.embers) kinds.push('ember');
    if (d.petals) kinds.push('petal');
    if (d.bubbles) kinds.push('bubble');
    if (d.fireflies) kinds.push('firefly');
    if (kinds.length && this.ambient.length < want && this.t % 4 === 0) {
      const k = kinds[(Math.random() * kinds.length) | 0];
      this.ambient.push({ k, x: Math.random() * this.W, y: k === 'ember' || k === 'bubble' ? this.H + 10 : k === 'petal' ? -10 : 120 + Math.random() * 300, life: 0, ph: Math.random() * 6, s: Math.random() });
    }
    const wind = weather ? weather.wind : 0;
    this.ambient = this.ambient.filter((p) => {
      p.life++;
      if (p.k === 'ember') { p.y -= 1 + p.s; p.x += Math.sin(p.life * 0.05 + p.ph) * 0.6 + wind; }
      else if (p.k === 'bubble') { p.y -= 0.8 + p.s; p.x += Math.sin(p.life * 0.07 + p.ph) * 0.5; }
      else if (p.k === 'petal') { p.y += 0.8 + p.s * 0.6; p.x += Math.sin(p.life * 0.04 + p.ph) * 1.1 + wind * 1.4; }
      else { p.x += Math.sin(p.life * 0.02 + p.ph) * 0.5; p.y += Math.cos(p.life * 0.03 + p.ph) * 0.4; }
      return p.life < 600 && p.y > -20 && p.y < this.H + 20;
    });
    for (const f of this.fauna) {
      f.x += f.vx + wind * (f.kind === 'bird' ? 0.6 : 0.3);
      f.ph += 0.05;
      if (f.kind === 'bee' || f.kind === 'butterfly') { f.y += Math.sin(f.ph * 2) * 0.8; if (Math.random() < 0.01) f.vx = -f.vx; }
      if (f.kind === 'bat') f.y += Math.sin(f.ph * 3) * 1.2;
      if (f.x < -60) f.x = this.W + 50;
      if (f.x > this.W + 60) f.x = -50;
    }
  }
  /* camX: deslocamento da câmera (−1..1) para parallax */
  drawBack(ctx, camX, zoomPulse) {
    const W = this.W;
    const H = this.H;
    ctx.save();
    // Os masters são ilustrados, não pixel art: interpolação evita serrilha
    // ao exibir folhas de 768x432 no canvas de combate.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';
    if (this.ready) {
      const [sx, sy, sw, sh] = this.frameRect();
      // Antes havia zoom-base de 1.06, que cortava as bordas dos masters.
      // Mantemos apenas uma respiração quase imperceptível e o zoom de impacto.
      const breathe = this.reducedFlag ? 0 : Math.sin(this.t * 0.004) * 0.002;
      const z = 1 + breathe + (zoomPulse || 0) * 0.01;
      const dw = W * z;
      const dh = H * z;
      const ox = (W - dw) / 2 - camX * (dw - W) * 0.5;
      const oy = (H - dh) * 0.85;
      ctx.drawImage(this.img, sx, sy, sw, sh, ox, oy, dw, dh);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#120a24');
      g.addColorStop(1, '#2a1640');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    for (const f of this.fauna) {
      const dir = f.vx > 0 ? 1 : -1;
      if (f.kind === 'bird') Art.fx2(ctx, 'birds', f.row, Math.floor(this.t / 6 + f.ph), f.x, f.y, { scale: 0.7 * f.s, dir });
      else Art.cell(ctx, 'fauna', f.row, Math.floor(this.t / 4 + f.ph), f.x, f.y, { scale: 0.75 * f.s, dir: -dir });
    }
    if (!this.reducedFlag) {
      // Tint leve, source-over e limitado à área acima do piso: custa menos
      // que uma blendagem avançada em toda a tela e deixa os masters legíveis.
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.035 + Math.sin(this.t * 0.008) * 0.006;
      ctx.fillStyle = this.def.tint || '#ffffff';
      ctx.fillRect(0, 0, W, Math.min(H, this.groundY + 8));
      ctx.globalAlpha = 1;
    }
    const gy = this.groundY;
    // Escurecimento curto e moderado, só no piso de combate; a versão antiga
    // cobria 30 px acima dele e chegava a 55% de opacidade.
    const fg = ctx.createLinearGradient(0, gy, 0, H);
    fg.addColorStop(0, 'rgba(0,0,0,0)');
    fg.addColorStop(0.45, 'rgba(0,0,0,0.08)');
    fg.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, gy, W, H - gy);
    ctx.restore();
  }
  drawAmbient(ctx) {
    ctx.save();
    for (const p of this.ambient) {
      const a = Math.min(1, p.life / 30) * Math.min(1, (600 - p.life) / 60);
      if (p.k === 'ember') { ctx.fillStyle = `rgba(255,${120 + ((p.s * 100) | 0)},40,${0.85 * a})`; ctx.fillRect(p.x, p.y, 3, 3); }
      else if (p.k === 'bubble') { ctx.strokeStyle = `rgba(190,240,255,${0.7 * a})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, 3 + p.s * 4, 0, 6.28); ctx.stroke(); }
      else if (p.k === 'petal') { ctx.fillStyle = `rgba(255,180,210,${0.9 * a})`; ctx.fillRect(p.x, p.y, 4, 3); }
      else { const gl = 0.5 + Math.sin(p.life * 0.1 + p.ph) * 0.5; ctx.fillStyle = `rgba(210,255,120,${gl * a})`; ctx.fillRect(p.x, p.y, 3, 3); }
    }
    ctx.restore();
  }
  drawVignette(ctx) {
    if (!this.vignette) {
      const c = document.createElement('canvas');
      c.width = this.W;
      c.height = this.H;
      const x = c.getContext('2d');
      const g = x.createRadialGradient(this.W / 2, this.H * 0.55, this.H * 0.35, this.W / 2, this.H * 0.55, this.W * 0.7);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.22)');
      x.fillStyle = g;
      x.fillRect(0, 0, this.W, this.H);
      this.vignette = c;
    }
    ctx.drawImage(this.vignette, 0, 0);
  }
}
