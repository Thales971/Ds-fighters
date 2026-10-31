/* ============================================================
   DS FIGHTERS — Renderização do estágio + obstáculos.
   ============================================================ */

class StageFX {
  constructor(stageDef, W, H) {
    this.def = stageDef;
    this.W = W;
    this.H = H;
    this.checked = new Set(); // lutadores já afetados por obstáculo neste round
  }

  draw(ctx, t) {
    this.def.draw(ctx, this.W, this.H, t);
    // obstáculos desenhados por cima do fundo
    for (const ob of this.def.obstacles) {
      const ox = ob.x * this.W;
      const ow = ob.w * this.W;
      const groundY = this.H - 60;
      ctx.save();
      if (ob.type === 'server-rack') {
        ctx.fillStyle = '#101828';
        ctx.fillRect(ox, groundY - 90, ow, 90);
        ctx.strokeStyle = '#1f2c47';
        ctx.strokeRect(ox, groundY - 90, ow, 90);
        for (let s = 0; s < 5; s++) {
          ctx.fillStyle = '#05080f';
          ctx.fillRect(ox + 4, groundY - 84 + s * 16, ow - 8, 11);
          ctx.fillStyle = (s + ((t * 2) | 0)) % 2 ? '#00ffaa' : '#ffb300';
          ctx.fillRect(ox + 7, groundY - 81 + s * 16, 5, 4);
        }
      } else if (ob.type === 'merge-conflict') {
        ctx.fillStyle = '#3a0d24';
        ctx.fillRect(ox, groundY - 70, ow, 70);
        ctx.strokeStyle = '#f0508c';
        ctx.lineWidth = 3;
        ctx.strokeRect(ox, groundY - 70, ow, 70);
        ctx.fillStyle = '#ff7db0';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('<<<<', ox + ow / 2, groundY - 42);
        ctx.fillText('>>>>', ox + ow / 2, groundY - 22);
        ctx.textAlign = 'left';
      } else if (ob.type === 'glitch') {
        const g = Math.sin(t * 13 + ox) > 0;
        ctx.fillStyle = g ? '#ff00e0' : '#00ffea';
        ctx.globalAlpha = 0.8;
        for (let i = 0; i < 6; i++) {
          ctx.fillRect(ox + ((i * 37 + ((t * 200) | 0)) % ow), groundY - 60 + i * 10, ow * 0.6, 4);
        }
        ctx.globalAlpha = 1;
      } else if (ob.type === 'coffee' || ob.type === 'energy-drink') {
        const ch = ob.type === 'coffee' ? 46 : 60;
        ctx.fillStyle = ob.type === 'coffee' ? '#c0392b' : '#27ae60';
        ctx.fillRect(ox + ow / 2 - 9, groundY - ch, 18, ch);
        ctx.fillStyle = '#fff';
        ctx.fillRect(ox + ow / 2 - 9, groundY - ch, 18, 5);
        for (let s = 0; s < 2; s++) {
          const sy = groundY - ch - 4 - ((t * 25 + s * 10) % 18);
          ctx.fillStyle = 'rgba(220,220,220,0.6)';
          ctx.fillRect(ox + ow / 2 - 4 + s * 4, sy, 3, 7);
        }
      } else if (ob.type === 'cloud-platform') {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(ox + ow / 2, groundY - 30, ow * 0.45, 0, Math.PI * 2);
        ctx.arc(ox + ow * 0.25, groundY - 42, ow * 0.3, 0, Math.PI * 2);
        ctx.arc(ox + ow * 0.75, groundY - 42, ow * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0d3a5c';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('S3', ox + ow / 2, groundY - 26);
        ctx.textAlign = 'left';
      } else if (ob.type === 'neon-sign') {
        ctx.fillStyle = '#0d0618';
        ctx.fillRect(ox, groundY - 80, ow, 80);
        const on = Math.sin(t * 6 + ox) > -0.3;
        ctx.strokeStyle = on ? '#00f0ff' : '#083a44';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = on ? 14 : 0;
        ctx.lineWidth = 3;
        ctx.strokeRect(ox + 4, groundY - 74, ow - 8, 68);
        ctx.fillStyle = on ? '#ff3cdc' : '#44102f';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ob.label.split(' ')[0], ox + ow / 2, groundY - 40);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
      }
      ctx.restore();
    }
  }

  check(f) {
    for (const ob of this.def.obstacles) {
      const ox = ob.x * this.W;
      const ow = ob.w * this.W;
      const key = f + '|' + ob.label;
      if (Math.abs(f.x - (ox + ow / 2)) < ow / 2 + 20 && f.onGround && !this.checked.has(key)) {
        this.checked.add(key);
        ob.onEnter(f);
        setTimeout(() => this.checked.delete(key), 2500);
      }
    }
  }
}
