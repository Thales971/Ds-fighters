/* ============================================================
   DS FIGHTERS — Entidades de combate.
   Projectile: tiro com sprite de habilidade (teleguiado, bumerangue, chão...).
   Strike: golpe atrasado em um ponto (pilar, meteoro, raio, perigo do mapa).
   Zone: área persistente no chão (ácido, mel).
   Wall: muralha que bloqueia projéteis inimigos.
   Coordenadas: y=0 é o chão, negativo é para cima.
   ============================================================ */
let ENTITY_SEQ = 1;

class Projectile {
  constructor(owner, p, opts = {}) {
    this.id = ENTITY_SEQ++;
    this.type = 'proj';
    this.owner = owner;
    this.p = p;
    this.fid = opts.fid || owner.kitOwnerId(p);
    this.key = p.visualSheet ? 'fx2:' + p.visualSheet : null;
    this.row = Number.isInteger(p.visualRow) ? p.visualRow : p.row;
    this.dir = owner.dir;
    const speed = (p.speed || 8) * (opts.speedMul || 1);
    const ang = opts.angle || 0;
    this.x = owner.x + owner.dir * 46;
    this.y = p.ground ? -34 : (opts.y != null ? opts.y : -96);
    this.vx = Math.cos(ang) * speed * owner.dir;
    this.vy = Math.sin(ang) * speed;
    if (p.arc) { this.vy = -9; this.vx = owner.dir * speed; }
    this.speed = speed;
    this.dmg = opts.dmg != null ? opts.dmg : p.dmg;
    this.hitsLeft = p.multiHit || 1;
    this.rehit = 0;
    this.age = 0;
    this.life = p.boomerang ? 110 : 220;
    this.dead = false;
    this.scale = opts.scale || (p.big ? 1.15 : 0.82);
    this.r = 34 * this.scale;
    this.seek = !!(p.seek || opts.seek);
    this.homing = opts.homing != null ? opts.homing : (p.homing || 0);
    this.target = opts.target || null;
  }
  update(game) {
    this.age++;
    const tgt = this.target && this.target.alive ? this.target : game.enemyOf(this.owner);
    if (this.rehit > 0) this.rehit--;
    // auto aim: perseguição perfeita (seek) ou parcial (homing)
    if (tgt && (this.seek || this.homing) && !this.p.ground && !(this.p.boomerang && this.age > 40)) {
      const dx = tgt.x - this.x;
      const dy = (tgt.y - 90) - this.y;
      const d = Math.hypot(dx, dy) || 1;
      const sp = this.seek ? Math.max(this.speed, 7) * 1.15 : Math.hypot(this.vx, this.vy);
      const k = this.seek ? 0.35 : this.homing * 0.08;
      this.vx += ((dx / d) * sp - this.vx) * k;
      this.vy += ((dy / d) * sp - this.vy) * k;
    }
    if (this.p.boomerang && this.age > 40) {
      const dx = this.owner.x - this.x;
      const dy = (this.owner.y - 100) - this.y;
      const d = Math.hypot(dx, dy) || 1;
      this.vx += (dx / d) * 0.9;
      this.vy += (dy / d) * 0.9;
      if (d < 40 && this.age > 50) { this.dead = true; return; }
    }
    if (this.p.arc) {
      this.vy += 0.45;
      if (this.y >= -10) { this.explode(game); return; }
    }
    if (game.weather && game.weather.wind && !this.seek) this.vx += game.weather.wind * 0.02;
    this.x += this.vx;
    this.y += this.vy;
    if (this.p.ground) this.y = -34;
    if (this.y > -12 && !this.p.arc && !this.p.ground) this.y = -12;
    const bounce = game.stageDef && game.stageDef.mech === 'bounce';
    if (bounce && !this.bounced && (this.x < 10 || this.x > game.W - 10)) {
      this.vx = -this.vx;
      this.bounced = true;
      this.dmg *= 1.15;
      game.spawnBurst('arcane', 0, this.x, this.y);
    }
    if (this.age > this.life || this.x < -120 || this.x > game.W + 120 || this.y < -560) this.dead = true;
    if (!tgt || !tgt.alive || this.rehit > 0) return;
    for (const w of game.walls) {
      if (w.owner.team !== this.owner.team && Math.abs(this.x - w.x) < 40 && this.y > -w.h) {
        this.dead = true;
        game.spawnBurst('impact', 2, this.x, this.y);
        game.audio.block();
        return;
      }
    }
    const hb = tgt.hurtbox();
    const hit = this.x + this.r > hb.x && this.x - this.r < hb.x + hb.w && this.y + this.r > hb.y && this.y - this.r < hb.y + hb.h;
    if (!hit) return;
    if (tgt.has('reflect')) {
      this.owner = tgt;
      this.vx = -this.vx * 1.1;
      this.vy = -Math.abs(this.vy) * 0.3;
      this.dir = -this.dir;
      this.target = game.enemyOf(tgt);
      this.seek = false;
      this.homing = 0.4;
      this.age = Math.min(this.age, 40);
      game.spawnBurst('water', 2, this.x, this.y);
      game.audio.play('shield');
      game.floatText(tgt.x, tgt.y - 200, 'REFLETIDO!', '#7de0ff');
      return;
    }
    this.hitsLeft--;
    const p = this.p;
    const sign = Math.sign(this.vx || this.dir);
    tgt.takeHit(this.dmg / (p.multiHit || 1), {
      attacker: this.owner,
      kx: p.push || (p.heavy ? 7.5 : 5.5),
      dirSign: sign,
      stun: p.stun || (p.heavy ? 18 : 14),
      launch: this.hitsLeft <= 0 ? p.launch : 0,
      height: p.height || (p.ground ? 'low' : 'mid'),
      poison: p.poison, burn: p.burn, slow: p.slow, trap: p.trap, freeze: p.id === 'freeze',
      projectile: true, power: p,
      element: this.owner.elementOf(p),
      heavy: p.heavy,
    });
    if (p.heal) this.owner.heal(p.heal);
    game.spawnAbilityImpact(this.owner, p, this.x, this.y);
    if (this.hitsLeft <= 0) this.dead = true;
    else this.rehit = 9;
  }
  explode(game) {
    this.dead = true;
    game.zones.push(new Zone(this.owner, { fid: this.fid, key: this.key, row: this.row, x: this.x, w: 120, time: 150, dmg: 0.1, poison: this.p.poison, slow: 20 }));
    game.spawnAbilityImpact(this.owner, this.p, this.x, -20);
  }
  draw(ctx, game) {
    const frame = Math.floor(this.age / 4);
    const rot = this.p.boomerang ? this.age * 0.35 : 0;
    const dir = Math.sign(this.vx) || this.dir;
    const key = this.key || ('abil:' + this.fid);
    if (!game.reduced) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      Art.cell(ctx, key, this.row, frame, this.x - this.vx * 2.4, this.y - this.vy * 2.4, { scale: this.scale * 0.9, dir, rot, add: true });
      ctx.restore();
    }
    Art.cell(ctx, key, this.row, frame, this.x, this.y, { scale: this.scale, dir, rot });
  }
}

class Strike {
  /* opts: x, delay, w, h, dmg, sheet {key,row,frames}, stun, launch, burn, poison, slow,
     label, warnColor, fromSky, scale, onHit, sound, shake, follow, unblockable */
  constructor(owner, opts) {
    this.id = ENTITY_SEQ++;
    this.type = 'strike';
    this.owner = owner;
    Object.assign(this, { delay: 20, w: 90, h: 200, dmg: 10, scale: 1.4, active: 8, duration: 22 }, opts);
    this.age = 0;
    this.dead = false;
    this.hit = new Set();
  }
  update(game) {
    this.age++;
    if (this.follow && this.age < this.delay && this.follow.alive) this.x += (this.follow.x - this.x) * 0.3;
    if (this.age === this.delay) {
      if (this.sound) game.audio.play(this.sound);
      if (this.shake) game.shake(this.shake);
    }
    const a = this.age - this.delay;
    if (a >= 0 && a < this.active) {
      for (const f of game.fighters()) {
        if (!f.alive || this.hit.has(f)) continue;
        if (this.owner && f.team === this.owner.team) continue;
        if (this.maxOwnerRange && this.owner && Math.abs(f.x - this.owner.x) > this.maxOwnerRange) continue;
        const hb = f.hurtbox();
        if (hb.x < this.x + this.w / 2 && hb.x + hb.w > this.x - this.w / 2 && hb.y < 0 && hb.y + hb.h > -this.h) {
          this.hit.add(f);
          const landed = f.takeHit(this.dmg, {
            attacker: this.owner, kx: this.kx || 3, dirSign: Math.sign(f.x - this.x) || 1,
            stun: this.stun || 18, launch: this.launch == null ? -6 : this.launch, height: this.unblockable ? 'unblockable' : 'mid',
            burn: this.burn, poison: this.poison, slow: this.slow, trap: this.trap, freeze: this.freeze, element: this.element, heavy: true,
            hazard: !this.owner, noScale: !this.owner, power: this.power, ability: !!this.owner,
          });
          if (landed && this.onHit) this.onHit(f, game);
        }
      }
    }
    if (a > this.duration) this.dead = true;
  }
  draw(ctx, game) {
    if (this.age < this.delay) {
      const k = this.age / this.delay;
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.3 * Math.sin(this.age * 0.6);
      ctx.fillStyle = this.warnColor || '#ff3b30';
      ctx.beginPath();
      ctx.ellipse(this.x, -2, (this.w / 2) * (0.5 + k * 0.5), 9, 0, 0, Math.PI * 2);
      ctx.fill();
      if (this.fromSky) {
        ctx.globalAlpha = 0.16;
        ctx.fillRect(this.x - 2, -560, 4, 560);
      }
      ctx.restore();
      if (this.label) game.drawWarnLabel(ctx, this.x, this.label);
      return;
    }
    const a = this.age - this.delay;
    const s = this.sheet;
    if (!s) return;
    const n = s.frames || 4;
    const f = Math.min(n - 1, Math.floor(a / (this.duration / n)));
    const size = (ART_SHEETS[s.key] || { size: 64 }).size * this.scale;
    let y = -size / 2 + (s.dy || 0);
    if (this.fromSky) y -= Math.max(0, 240 - a * 40);
    Art.cell(ctx, s.key, s.row, f, this.x, y, { scale: this.scale, dir: this.dir || 1, sy: s.sy });
  }
}

class Zone {
  constructor(owner, opts) {
    this.id = ENTITY_SEQ++;
    this.type = 'zone';
    this.owner = owner;
    Object.assign(this, { x: 0, w: 160, time: 300, dmg: 0.1, slow: 0, burn: 0, poison: 0, fx: null, power: null, row: 0, fid: null, key: null }, opts);
    this.age = 0;
    this.dead = false;
  }
  update(game) {
    this.age++;
    if (this.age > this.time) { this.dead = true; return; }
    for (const f of game.fighters()) {
      if (!f.alive || (this.owner && f.team === this.owner.team)) continue;
      if (Math.abs(f.x - this.x) < this.w / 2 && f.y > -20) {
        if (this.dmg && this.age % 6 === 0) f.chip(this.dmg * 6, this.owner);
        if (this.slow) f.addStatus('slow', this.slow);
        if (this.burn && this.age % 20 === 0) f.addStatus('burn', this.burn, this.owner);
        if (this.poison && this.age % 30 === 0) f.addStatus('poison', this.poison, this.owner);
        if (this.fx) {
          if (this.fx.chill) f.addStatus('chill', this.fx.chill);
          if (this.fx.bleed) f.addStatus('bleed', this.fx.bleed, this.owner);
          if (this.fx.vuln) f.addStatus('vuln', this.fx.vuln);
          if (this.fx.lock) f.addStatus('locked', this.fx.lock);
          if (this.fx.meterSlow) f.addStatus('meterSlow', this.fx.meterSlow);
          if (this.fx.glitch && this.age % 18 === 0) f.addStatus('glitch', this.fx.glitch);
        }
      }
    }
  }
  draw(ctx) {
    const fade = Math.min(1, (this.time - this.age) / 30);
    if (this.honey) {
      ctx.save();
      ctx.globalAlpha = 0.8 * fade;
      ctx.fillStyle = '#c98a10';
      ctx.beginPath();
      ctx.ellipse(this.x, -2, this.w / 2, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd24d';
      ctx.beginPath();
      ctx.ellipse(this.x - 10, -5, this.w / 3, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    const key = this.key || ('abil:' + this.fid);
    const size = (ART_SHEETS[key] || { size: 128 }).size;
    const sc = this.w / size;
    const f = 1 + (Math.floor(this.age / 8) % 3);
    ctx.save();
    ctx.globalAlpha = 0.9 * fade;
    Art.cell(ctx, key, this.row, f, this.x, -size * sc * 0.25, { scale: sc, sy: 0.6 });
    ctx.restore();
  }
}

class Wall {
  constructor(owner, opts) {
    this.id = ENTITY_SEQ++;
    this.type = 'wall';
    this.owner = owner;
    Object.assign(this, { x: 0, h: 170, time: 360, row: 2, fid: owner.def.id }, opts);
    this.age = 0;
    this.dead = false;
  }
  update() {
    this.age++;
    if (this.age > this.time) this.dead = true;
  }
  draw(ctx) {
    const f = this.age < 12 ? Math.floor(this.age / 4) : 3;
    ctx.save();
    if (this.time - this.age < 30) ctx.globalAlpha = (this.time - this.age) / 30;
    Art.ability(ctx, this.fid, this.row, f, this.x, -80, { scale: 1.4, dir: this.owner.dir });
    ctx.restore();
  }
}
