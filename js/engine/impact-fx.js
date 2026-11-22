/* ============================================================
   DS FIGHTERS — IMPACTO DOS GOLPES + ULT CINEMATOGRAFICA (nov/2026).
   So visual. Coordenadas no espaco do chao (y = 0 no piso, igual as faiscas).

   impactHit(victim, d): golpe forte (d >= 12) solta onda de choque circular
     no ponto do impacto + poeira no pe da vitima; muito forte (d >= 22) faz
     uma segunda onda e uma pausa a mais (hitstop ja existe no registerHit).
   impactKO(loser): K.O. explode em pedacos (cacos coloridos girando com
     gravidade e quique no chao) + onda de choque grande + poeira.
   drawUltFx: durante o freeze da ult, linhas de velocidade saindo do
     lutador, explosao de luz atras dele e faixas de cinema.
   Some no movimento reduzido; qualidade baixa corta a quantidade.
   ============================================================ */
(() => {
  if (typeof Game === 'undefined') return;
  const P = Game.prototype;
  const rnd = (g) => (g.rnd ? g.rnd() : Math.random());

  P._ifx = function () {
    if (!this._impact) this._impact = { rings: [], debris: [] };
    return this._impact;
  };

  P.impactHit = function (victim, d, color) {
    if (this.reduced || !victim) return;
    const I = this._ifx();
    const y = (victim.y || 0) - 95;
    const col = color || '255,240,200';
    I.rings.push({ x: victim.x, y, r: 8, vr: 5 + d * 0.12, life: 16, max: 16, col, w: 4 });
    if (d >= 22) I.rings.push({ x: victim.x, y, r: 4, vr: 9 + d * 0.1, life: 20, max: 20, col: '255,255,255', w: 2 });
    if (this.dust && victim.y > -20) this.dust(victim.x, 'rgba(210,200,180,0.7)', this.qFxOn === false ? 3 : 6 + Math.min(8, d >> 2));
    if (I.rings.length > 24) I.rings.splice(0, I.rings.length - 24);
  };

  P.impactKO = function (loser) {
    if (this.reduced || !loser) return;
    const I = this._ifx();
    const n = this.qFxOn === false ? 10 : this.quality === 'high' ? 34 : 22;
    const cols = [loser.def && loser.def.colors ? loser.def.colors.accent : '#ffd27d', '#ffffff', '#ffd27d', '#ff8a4a'];
    for (let k = 0; k < n; k++) {
      const a = -Math.PI / 2 + (rnd(this) - 0.5) * 2.6;
      const v = 4 + rnd(this) * 9;
      I.debris.push({ x: loser.x + (rnd(this) - 0.5) * 30, y: (loser.y || 0) - 80 - rnd(this) * 50, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: rnd(this) * 6, vr: (rnd(this) - 0.5) * 0.5, s: 4 + rnd(this) * 9, col: cols[k % cols.length], life: 70 + rnd(this) * 40, bounce: 0 });
    }
    I.rings.push({ x: loser.x, y: (loser.y || 0) - 90, r: 10, vr: 14, life: 26, max: 26, col: '255,255,255', w: 6 });
    I.rings.push({ x: loser.x, y: -2, r: 10, vr: 11, life: 22, max: 22, col: '255,220,160', w: 3, flat: true });
    if (this.dust) this.dust(loser.x, 'rgba(210,200,180,0.75)', 14);
  };

  P.updateImpact = function () {
    const I = this._impact;
    if (!I) return;
    for (const r of I.rings) { r.r += r.vr; r.vr *= 0.9; r.life--; }
    I.rings = I.rings.filter((r) => r.life > 0);
    for (const p of I.debris) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.38; p.vx *= 0.99; p.rot += p.vr; p.life--;
      if (p.y > 0) { p.y = 0; if (p.bounce < 2) { p.vy *= -0.45; p.vx *= 0.7; p.bounce++; } else { p.vy = 0; p.vx *= 0.8; p.vr *= 0.8; } }
    }
    I.debris = I.debris.filter((p) => p.life > 0);
  };

  P.drawImpact = function (ctx) {
    const I = this._impact;
    if (!I || (!I.rings.length && !I.debris.length)) return;
    ctx.save();
    if (ctx.arc && ctx.stroke) {
      ctx.globalCompositeOperation = 'lighter';
      for (const r of I.rings) {
        const k = r.life / r.max;
        ctx.globalAlpha = k * 0.85;
        ctx.strokeStyle = 'rgba(' + r.col + ',1)';
        ctx.lineWidth = Math.max(1, r.w * k);
        ctx.beginPath();
        if (r.flat && ctx.ellipse) ctx.ellipse(r.x, r.y, r.r * 1.6, r.r * 0.32, 0, 0, Math.PI * 2);
        else ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    for (const p of I.debris) {
      ctx.globalAlpha = Math.min(1, p.life / 25);
      ctx.fillStyle = p.col;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66);
      ctx.restore();
    }
    ctx.restore();
  };

  /* ULT: linhas de velocidade + luz atras do lutador + faixas de cinema.
     Desenhado logo depois do escurecimento do freeze (atras dos lutadores). */
  P.drawUltFx = function (ctx, W, H, groundY) {
    if (this.reduced || !(this.freeze > 0) || !this.freezeOwner) return;
    const f = this.freezeOwner;
    const total = 46;
    const k = Math.max(0, Math.min(1, this.freeze / total));
    const t = 1 - k; /* 0 -> 1 ao longo do freeze */
    const cx = f.x, cy = groundY + (f.y || 0) - 100;
    const acc = (f.def && f.def.colors && f.def.colors.accent) || '#ffd27d';
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (ctx.createRadialGradient) {
      const R = 120 + t * 220;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, 'rgba(255,255,255,0.55)');
      g.addColorStop(0.25, acc);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.45 * Math.sin(Math.PI * Math.min(1, t * 1.4));
      ctx.fillStyle = g;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    }
    if (ctx.beginPath && ctx.closePath) {
      const n = this.qFxOn === false ? 18 : 36;
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (i % 3) * 0.05 + this.time * 0.002;
        const r0 = 90 + ((i * 37) % 60) + t * 40;
        const r1 = r0 + 260 + ((i * 53) % 180);
        const wdt = 0.012 + ((i * 7) % 5) * 0.003;
        ctx.globalAlpha = 0.18 + ((i * 13) % 10) / 40;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a - wdt) * r0, cy + Math.sin(a - wdt) * r0);
        ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.lineTo(cx + Math.cos(a + wdt) * r0, cy + Math.sin(a + wdt) * r0);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
    /* faixas de cinema entrando */
    const bh = Math.round(H * 0.09 * Math.min(1, t * 4) * Math.min(1, k * 6));
    if (bh > 0) {
      ctx.save();
      ctx.fillStyle = '#000';
      ctx.fillRect(-40, -40, W + 80, bh + 40);
      ctx.fillRect(-40, H - bh, W + 80, bh + 40);
      ctx.restore();
    }
  };
})();
