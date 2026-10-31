/* ============================================================
   DS FIGHTERS — Projéteis e golpes de área (shape desenhado).
   ============================================================ */

class Projectile {
  constructor(owner, spec, delay = 0) {
    this.owner = owner;
    this.spec = spec;
    this.x = owner.x + owner.dir * 40;
    this.y = -70 + (spec.w ? -spec.h / 2 : 0);
    this.dir = owner.dir;
    this.speed = spec.speed * owner.dir;
    this.dmg = spec.dmg;
    this.w = spec.w || 20;
    this.h = spec.h || 20;
    this.delay = delay;
    this.age = -delay;
    this.dead = false;
    this.angle = spec.angle || 0;
    this.vy = spec.angle ? Math.sin(spec.angle) * spec.speed : 0;
    this.vx = spec.angle ? Math.cos(spec.angle) * spec.speed : this.speed;
    this.multiHitLeft = spec.multiHit || 1;
    this.hitSet = new Set();
    this.spin = 0;
  }

  update(game, target) {
    this.age++;
    if (this.age < 0) return;
    this.spin += 0.2;
    this.x += this.vx;
    this.y += this.vy;
    if (this.vy && this.y > -4) { this.vy = 0; }
    if (this.x < -60 || this.x > game.W + 60 || this.y < -260) this.dead = true;

    if (this.rehit > 0) this.rehit--;
    if (target && target.alive && this.rehit <= 0 && !this.hitSet.has(target)) {
      const hurt = target.hurtbox ? target.hurtbox() : { x: target.x - 20, y: target.y - 100, w: 40, h: 100 };
      const hit = this.x > hurt.x - this.w * 0.4 && this.x < hurt.x + hurt.w + this.w * 0.4
        && this.y > hurt.y - this.h * 0.4 && this.y < hurt.y + hurt.h + this.h * 0.3;
      if (hit) {
        this.multiHitLeft--;
        target.takeHit(this.dmg, {
          kx: this.spec.heavy ? 8 : 6.2,
          attacker: this.owner,
          stun: this.spec.stun || (this.spec.heavy ? 16 : 13),
          height: 'mid',
          hitstop: this.spec.heavy ? 7 : 5,
          poison: this.spec.poison || 0,
          slow: this.spec.slow || 0,
        });
        if (this.spec.sheet && game.spawnBurst) game.spawnBurst(this.spec.sheet, 'impact', this.x, this.y, this.dir);
        if (this.multiHitLeft <= 0) {
          this.hitSet.add(target);
          this.dead = true;
        } else {
          this.rehit = 8;
          game.spawnSparks(this.x, this.y, this.spec.color, 8);
        }
      }
    }
  }

  draw(ctx) {
    if (this.age < 0) return;
    const s = this.spec;
    if (s.sheet && typeof Fx !== 'undefined') {
      const bob = Math.sin(this.age * 0.4) * 2;
      Fx.blit(ctx, s.sheet, s.clip || 'projectile', Math.floor(this.age / 3), this.x, this.y + bob, {
        dir: this.dir,
        scale: s.heavy ? 2.3 : 1.8,
      });
      return;
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    if (s.rotate) ctx.rotate(this.spin);
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 14;
    ctx.fillStyle = s.color;
    switch (s.shape) {
      case 'axe':
        ctx.fillRect(-s.w / 2, -4, s.w, 8);
        ctx.beginPath(); ctx.arc(s.w / 2 - 4, 0, 10, -1.2, 1.2); ctx.fill();
        break;
      case 'car':
        ctx.fillRect(-s.w / 2, -s.h / 2 + 6, s.w, s.h - 10);
        ctx.fillRect(-s.w / 2 + 8, -s.h / 2 - 2, s.w - 22, 10);
        ctx.fillStyle = '#bff3ff';
        ctx.fillRect(-s.w / 2 + 12, -s.h / 2, 12, 8);
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(-s.w / 2 + 12, s.h / 2 - 2, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(s.w / 2 - 12, s.h / 2 - 2, 5, 0, Math.PI * 2); ctx.fill();
        break;
      case 'bolt':
        ctx.beginPath();
        ctx.moveTo(0, -s.h / 2); ctx.lineTo(6, -4); ctx.lineTo(0, -2); ctx.lineTo(8, s.h / 2);
        ctx.lineTo(-6, 4); ctx.lineTo(0, 6); ctx.lineTo(-8, -s.h / 2);
        ctx.closePath(); ctx.fill();
        break;
      case 'fire':
        ctx.beginPath();
        ctx.moveTo(0, -s.h / 2);
        ctx.quadraticCurveTo(s.w / 2, -4, 0, s.h / 2);
        ctx.quadraticCurveTo(-s.w / 2, -4, 0, -s.h / 2);
        ctx.fill();
        break;
      case 'check':
        ctx.fillStyle = '#0a5c22';
        ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
        ctx.strokeStyle = '#7dffb0';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(-s.w / 4, 0); ctx.lineTo(-2, s.h / 4); ctx.lineTo(s.w / 2, -s.h / 4); ctx.stroke();
        break;
      case 'server':
        ctx.fillStyle = '#222';
        ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
        ctx.fillStyle = s.color;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('500', 0, 4);
        ctx.textAlign = 'left';
        break;
      case 'book':
        ctx.fillStyle = '#a3702d';
        ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
        ctx.fillStyle = '#f5e6c8';
        ctx.fillRect(-s.w / 2 + 4, -s.h / 2 + 3, s.w - 8, s.h - 6);
        ctx.strokeStyle = '#8a5a1d';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -s.h / 2 + 3); ctx.lineTo(0, s.h / 2 - 3); ctx.stroke();
        break;
      case 'box':
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 4;
        ctx.strokeRect(-s.w / 2, -s.h / 2, s.w, s.h);
        ctx.beginPath(); ctx.moveTo(-s.w / 2, 0); ctx.lineTo(s.w / 2, 0); ctx.stroke();
        break;
      case 'gear':
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + this.spin;
          ctx.lineTo(Math.cos(a) * s.w / 2, Math.sin(a) * s.w / 2);
        }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#0e7a5f';
        ctx.beginPath(); ctx.arc(0, 0, s.w / 5, 0, Math.PI * 2); ctx.fill();
        break;
      case 'bug':
        ctx.beginPath(); ctx.arc(0, 0, s.w / 2 - 2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath(); ctx.moveTo(i * 6, -s.h / 2); ctx.lineTo(i * 9, s.h / 2); ctx.stroke();
        }
        break;
      case 'clipboard':
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-s.w / 2 + 3, -s.h / 2 + 5, s.w - 6, s.h - 10);
        ctx.fillStyle = '#e53935';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FAIL', 0, 4);
        ctx.textAlign = 'left';
        break;
      case 'layers':
        for (let i = 0; i < 3; i++) {
          ctx.globalAlpha = 0.4 + i * 0.3;
          ctx.beginPath();
          ctx.moveTo(0, -s.h / 2 + i * 7);
          ctx.lineTo(s.w / 2, 0 + i * 7);
          ctx.lineTo(0, s.h / 2 + i * 7);
          ctx.lineTo(-s.w / 2, 0 + i * 7);
          ctx.closePath(); ctx.fill();
        }
        ctx.globalAlpha = 1;
        break;
      case 'void':
        ctx.fillStyle = '#1a0026';
        ctx.beginPath(); ctx.arc(0, 0, s.w / 2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, s.w / 2 - 3, this.spin, this.spin + 4); ctx.stroke();
        break;
      default: // orb
        ctx.beginPath(); ctx.arc(0, 0, s.w / 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath(); ctx.arc(-s.w / 6, -s.h / 6, s.w / 6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}
