/* ============================================================
   DS FIGHTERS — VFX: polimento cinematografico do canvas.
   Tudo vetorial (sem asset novo), respeita o modo reduzido:
   - faiscas com glow aditivo (antes eram quadradinhos opacos)
   - onda de choque + flash radial em golpe pesado
   - speed lines de anime no dash
   - anel de poeira ao pousar
   - numeros de dano com pop e rotacao
   - cinema no slow-mo de K.O.: letterbox + vinheta
   ============================================================ */
const VFX = {
  waves: [],      /* ondas de choque */
  flashes: [],    /* flashes radiais */
  lines: [],      /* speed lines do dash */

  reset() { this.waves.length = 0; this.flashes.length = 0; this.lines.length = 0; this.motes = null; },

  /* MOTES: particulas de poeira/polen flutuando (ambiente vivo) */
  initMotes(W, H) {
    if (this.motes) return;
    this.motes = [];
    for (let k = 0; k < 22; k++) {
      this.motes.push({ x: Math.random() * W, y: 40 + Math.random() * (H - 120), s: 0.6 + Math.random() * 1.4, ph: Math.random() * 6, v: 0.08 + Math.random() * 0.18 });
    }
  },

  updateMotes(W, H) {
    if (!this.motes) this.initMotes(W, H);
    for (const m of this.motes) {
      m.ph += 0.012;
      m.y -= m.v;
      m.x += Math.sin(m.ph * 2) * 0.3;
      if (m.y < 30) { m.y = H - 80; m.x = Math.random() * W; }
    }
  },

  drawMotes(ctx, W, H) {
    if (!this.motes) return;
    ctx.save();
    for (const m of this.motes) {
      const a = 0.10 + Math.sin(m.ph * 3) * 0.06;
      ctx.globalAlpha = Math.max(0.03, a);
      ctx.fillStyle = '#fff8e0';
      ctx.beginPath(); ctx.arc(m.x, m.y, m.s, 0, 6.3); ctx.fill();
    }
    ctx.restore();
  },

  /* AURA DE ULTIMATE: brilho nas bordas na cor do time enquanto casta */
  drawUltAura(ctx, W, H, casters) {
    if (!casters || !casters.length) return;
    for (const c of casters) {
      const col = c.team === 0 ? '80,180,255' : '255,120,90';
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
      g.addColorStop(0, 'rgba(' + col + ',0)');
      g.addColorStop(1, 'rgba(' + col + ',0.22)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  },

  /* golpe pesado: flash + onda de choque */
  impact(x, y, heavy, color, reduced) {
    if (reduced) return;
    this.flashes.push({ x, y, life: 9, max: 9, color: color || '#fff', r: heavy ? 90 : 52 });
    if (heavy) this.waves.push({ x, y, life: 16, max: 16, r0: 14, r1: heavy ? 120 : 78 });
  },

  /* dash: linhas de velocidade atras do lutador */
  dashLines(x, y, dir, reduced) {
    if (reduced) return;
    for (let k = 0; k < 4; k++) {
      this.lines.push({ x, y: y - 30 - Math.random() * 110, dir, len: 40 + Math.random() * 70, life: 9, max: 9 });
    }
  },

  update(W, H) {
    if (W && H) this.updateMotes(W, H);
    for (const w of this.waves) w.life--;
    for (const f of this.flashes) f.life--;
    for (const l of this.lines) { l.life--; l.x -= l.dir * 6; }
    this.waves = this.waves.filter((w) => w.life > 0);
    this.flashes = this.flashes.filter((f) => f.life > 0);
    this.lines = this.lines.filter((l) => l.life > 0);
  },

  draw(ctx, W, H, slowmo, reduced) {
    if (!reduced) this.drawMotes(ctx, W, H);
    /* SPEED LINES (dash) */
    if (this.lines.length) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const l of this.lines) {
        const a = (l.life / l.max) * 0.35;
        const g = ctx.createLinearGradient(l.x, 0, l.x + l.dir * l.len, 0);
        g.addColorStop(0, `rgba(255,255,255,0)`);
        g.addColorStop(0.5, `rgba(220,235,255,${a})`);
        g.addColorStop(1, `rgba(255,255,255,0)`);
        ctx.fillStyle = g;
        ctx.fillRect(Math.min(l.x, l.x + l.dir * l.len), l.y, l.len, 2);
      }
      ctx.restore();
    }
    /* FLASH radial do impacto */
    if (this.flashes.length) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const f of this.flashes) {
        const p = 1 - f.life / f.max;
        const r = f.r * (0.4 + p * 0.9);
        const a = (1 - p) * 0.55;
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
        g.addColorStop(0, f.color);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = a;
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, 6.3); ctx.fill();
      }
      ctx.restore();
    }
    /* ONDA DE CHOQUE (anel que expande) */
    if (this.waves.length) {
      ctx.save();
      for (const w of this.waves) {
        const p = 1 - w.life / w.max;
        const r = w.r0 + (w.r1 - w.r0) * p;
        ctx.globalAlpha = (1 - p) * 0.5;
        ctx.strokeStyle = 'rgba(255,240,210,0.9)';
        ctx.lineWidth = 3 * (1 - p) + 1;
        ctx.beginPath(); ctx.arc(w.x, w.y, r, 0, 6.3); ctx.stroke();
      }
      ctx.restore();
    }
    /* CINEMA no slow-mo de K.O.: letterbox + vinheta dramatica */
    if (slowmo > 0) {
      const p = Math.min(1, slowmo / 30);
      const bar = H * 0.09 * p;
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(0, 0, W, bar);
      ctx.fillRect(0, H - bar, W, bar);
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(0,0,0,${0.35 * p})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  },

  /* numero de dano com pop: substitui o texto chapado */
  drawDamageText(ctx, t) {
    const lifeP = Math.min(1, t.life / 14);
    /* pop: cresce no primeiro quarto da vida */
    const pop = t.life > 44 ? 1 + (t.life - 44) * 0.09 : 1;
    ctx.save();
    ctx.globalAlpha = lifeP;
    ctx.translate(t.x, t.y);
    ctx.rotate((t.x % 2 ? 1 : -1) * 0.06);
    ctx.scale(pop, pop);
    ctx.font = (t.small ? '12px' : '14px') + ' "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(t.text, 0, 0);
    /* borda colorida no dano alto */
    if (t.color === '#ff5a3c') { ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,150,60,0.6)'; ctx.strokeText(t.text, 0, 0); }
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, 0, 0);
    ctx.restore();
  },
};
