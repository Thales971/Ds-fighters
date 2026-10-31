/* ============================================================
   DS FIGHTERS — Obstáculos do cenário (efeito + desenho).
   ============================================================ */

class StageFX {
  constructor(stageDef, W, H) {
    this.def = stageDef;
    this.W = W;
    this.H = H;
    this.cd = new Map();
  }

  tick() {
    for (const [k, v] of this.cd) {
      if (v <= 1) this.cd.delete(k);
      else this.cd.set(k, v - 1);
    }
  }

  draw(ctx, t, cam = 0) {
    const floor = this.H - 60;
    for (const ob of this.def.obstacles) {
      const ox = ob.x * this.W - cam;
      const ow = ob.w * this.W;
      const pulse = 0.35 + Math.abs(Math.sin(t * 3 + ox)) * 0.4;
      ctx.save();
      ctx.fillStyle = `rgba(255, 220, 120, ${pulse})`;
      ctx.beginPath();
      ctx.ellipse(ox + ow / 2, floor - 2, ow * 0.55, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      if (ob.type === 'server-rack') {
        ctx.fillStyle = '#101828';
        ctx.fillRect(ox, floor - 96, ow, 96);
        ctx.strokeStyle = '#2a4068';
        ctx.strokeRect(ox, floor - 96, ow, 96);
        for (let s = 0; s < 5; s++) {
          ctx.fillStyle = '#05080f';
          ctx.fillRect(ox + 4, floor - 88 + s * 16, ow - 8, 11);
          ctx.fillStyle = (s + ((t * 3) | 0)) % 2 ? '#39ffb0' : '#ffb020';
          ctx.fillRect(ox + 8, floor - 84 + s * 16, 6, 4);
        }
      } else if (ob.type === 'merge-conflict') {
        ctx.fillStyle = '#3a1028';
        ctx.fillRect(ox, floor - 74, ow, 74);
        ctx.strokeStyle = '#ff4f8b';
        ctx.lineWidth = 3;
        ctx.strokeRect(ox, floor - 74, ow, 74);
        ctx.fillStyle = '#ffd0e4';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('<<<<', ox + ow / 2, floor - 44);
        ctx.fillText('>>>>', ox + ow / 2, floor - 24);
        ctx.textAlign = 'left';
      } else if (ob.type === 'glitch') {
        const hot = Math.sin(t * 14 + ox) > 0;
        ctx.fillStyle = hot ? '#ff37e6' : '#2dffe8';
        for (let i = 0; i < 7; i++) {
          const gw = ow * (0.4 + (i % 3) * 0.15);
          ctx.fillRect(ox + ((i * 19 + ((t * 90) | 0)) % Math.max(8, ow)), floor - 70 + i * 9, gw, 4);
        }
      } else if (ob.type === 'coffee' || ob.type === 'energy-drink') {
        const drink = ob.type === 'coffee';
        const ch = drink ? 40 : 54;
        ctx.fillStyle = drink ? '#c0392b' : '#1fa85a';
        ctx.fillRect(ox + ow / 2 - 10, floor - ch, 20, ch);
        ctx.fillStyle = '#fff';
        ctx.fillRect(ox + ow / 2 - 10, floor - ch, 20, 6);
        if (!drink) {
          ctx.fillStyle = '#ffe14a';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⚡', ox + ow / 2, floor - 22);
          ctx.textAlign = 'left';
        }
        for (let s = 0; s < 2; s++) {
          const sy = floor - ch - 6 - ((t * 26 + s * 12) % 18);
          ctx.fillStyle = 'rgba(230,230,230,0.55)';
          ctx.fillRect(ox + ow / 2 - 4 + s * 5, sy, 3, 8);
        }
      } else if (ob.type === 'cloud-platform') {
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.arc(ox + ow / 2, floor - 28, ow * 0.38, 0, Math.PI * 2);
        ctx.arc(ox + ow * 0.28, floor - 40, ow * 0.26, 0, Math.PI * 2);
        ctx.arc(ox + ow * 0.72, floor - 40, ow * 0.26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1d4e89';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NUVEM', ox + ow / 2, floor - 24);
        ctx.textAlign = 'left';
      } else if (ob.type === 'neon-sign') {
        const on = Math.sin(t * 6 + ox) > -0.25;
        ctx.fillStyle = '#120814';
        ctx.fillRect(ox, floor - 86, ow, 86);
        ctx.strokeStyle = on ? '#39fff2' : '#12383c';
        ctx.lineWidth = 3;
        ctx.strokeRect(ox + 3, floor - 80, ow - 6, 72);
        ctx.fillStyle = on ? '#ff4fd8' : '#3a1430';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ob.label, ox + ow / 2, floor - 40);
        ctx.textAlign = 'left';
      }
      ctx.restore();
    }
  }

  check(f) {
    for (const ob of this.def.obstacles) {
      const ox = ob.x * this.W;
      const ow = ob.w * this.W;
      const key = (f.def ? f.def.id : 'p') + '|' + ob.label;
      const left = this.cd.get(key) || 0;
      if (left > 0) continue;
      if (Math.abs(f.x - (ox + ow / 2)) < ow / 2 + 16 && f.onGround) {
        this.cd.set(key, 150);
        ob.onEnter(f);
      }
    }
  }
}
