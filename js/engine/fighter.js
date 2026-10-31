/* ============================================================
   DS FIGHTERS — Classe Fighter: física, estados, hitboxes,
   dano, barras de vida/super, modificadores de estágio.
   ============================================================ */

const GRAVITY = 0.9;
const WALK_SPEED = 3.2;
const JUMP_VEL = -15;

class Fighter {
  constructor(def, x, dir, game) {
    this.def = def;
    this.game = game;
    this.x = x;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.dir = dir;              // 1 = olhando direita, -1 = esquerda
    this.hp = 100;
    this.maxHp = 100;
    this.super = 0;
    this.maxSuper = 100;
    this.state = 'idle';         // idle|walk|jump|crouch|punch|kick|special|super|hit|block|ko|win
    this.frame = 0;
    this.stateTime = 0;
    this.attack = null;          // dados do golpe atual
    this.hasHit = false;
    this.now = 0;
    this.flash = null;           // texto flutuante
    this.flashUntil = 0;
    this.wins = 0;
    // modificadores de estágio / buffs
    this.slowUntil = 0; this.burnUntil = 0; this.stunUntil = 0;
    this.invertControlsUntil = 0; this.bugUntil = 0; this.shockUntil = 0;
    this.rageUntil = 0; this.speedBoostUntil = 0; this.bounceUntil = 0;
    this.invincibleUntil = 0; this.dmgMultUntil = 0; this.dmgMult = 1;
    this.cycleIdx = 0;           // Iales: alterna poderes
    this.buffDmgMult = 1; this.buffInvUntil = 0;
    this.blocking = false;
    this.width = 44; this.height = 110;
  }

  get facing() { return this.dir; }
  get alive() { return this.hp > 0; }
  get busy() { return ['punch', 'kick', 'special', 'super', 'hit', 'ko'].includes(this.state); }
  get onGround() { return this.y >= 0; }

  flashText(txt) {
    this.flash = txt;
    this.flashUntil = this.now + 1400;
  }

  gainSuper(n) {
    this.super = Math.min(this.maxSuper, this.super + n);
  }

  takeHit(dmg, opts = {}) {
    if (!this.alive) return;
    if (this.now < this.invincibleUntil || this.now < this.buffInvUntil) return;
    let d = dmg * this.def.stats.power;
    if (this.now < this.bugUntil) d *= 2;
    if (opts.fromAttacker && opts.fromAttacker.now < opts.fromAttacker.rageUntil) d *= 2;
    d *= opts.attacker ? opts.attacker.buffDmgMult : 1;
    if (opts.attacker && opts.attacker.now < opts.attacker.dmgMultUntil) d *= opts.attacker.dmgMult;
    const wasBlocked = this.blocking && this.onGround;
    if (wasBlocked) {
      d *= 0.25;
      this.vx = opts.kx || 0;
      this.game.audio.block();
      this.game.spawnSparks(this.x + this.dir * 30, -70, '#9adcff', 6);
      this.gainSuper(4);
      if (opts.attacker) opts.attacker.gainSuper(3);
      this.game.registerHit(opts.attacker || null, this, d, true);
      return;
    }
    this.hp = Math.max(0, this.hp - d);
    this.vx = (opts.kx || 6) * this.dir * -1 * (this.def.stats.weight || 1) * -1;
    this.vx = (opts.kx || 6) * (this.x < (opts.attacker ? opts.attacker.x : this.x) ? 1 : -1) / (this.def.stats.weight || 1);
    this.state = 'hit';
    this.stateTime = 0;
    this.frame = 0;
    this.hasHit = false;
    if (opts.stun) this.stunUntil = this.now + opts.stun;
    this.game.audio.hit();
    this.game.spawnSparks(this.x + this.dir * 20, -70, '#ffd27d', 14);
    this.game.spawnHitStar(this.x + this.dir * 24, -72, d >= 12 ? '#ff7b1c' : '#ffe14d');
    this.game.shake(d >= 12 ? 9 : 6);
    this.game.registerHit(opts.attacker || null, this, d, false);
    if (this.hp <= 0) {
      this.state = 'ko';
      this.stateTime = 0;
      this.frame = 0;
      this.game.audio.ko();
      this.game.onKO(this);
    } else {
      if (opts.attacker) opts.attacker.gainSuper(8);
      this.gainSuper(5);
    }
  }

  startAttack(kind) {
    const mv = this.def.moves[kind];
    this.state = kind;
    this.stateTime = 0;
    this.frame = 0;
    this.attack = mv;
    this.hasHit = false;
    if (kind === 'punch') this.game.audio.punch();
    else this.game.audio.kick();
  }

  startSpecial() {
    if (this.super < this.def.special.cost) return false;
    this.super -= this.def.special.cost;
    this.state = 'special';
    this.stateTime = 0;
    this.frame = 0;
    this.game.audio.special();
    const sp = this.def.special;
    this.flashText(sp.name + '!');
    const q = this.def.quotes.special;
    this.game.say(this, q[(Math.random() * q.length) | 0]);
    if (sp.type === 'projectile' || sp.type === 'cycle-projectile') {
      const p = sp.type === 'cycle-projectile'
        ? sp.cycle[this.cycleIdx++ % sp.cycle.length]
        : sp.proj;
      const count = p.multi || 1;
      for (let i = 0; i < count; i++) {
        this.game.spawnProjectile(this, p, i * 120);
      }
      if (sp.heal) this.heal(sp.heal);
    } else if (sp.type === 'dash-strike') {
      this.vx = this.dir * 14;
      this.dashHit = { dmg: sp.dmg, range: sp.range };
    } else if (sp.type === 'heal-strike') {
      this.heal(sp.heal);
      this.dashHit = { dmg: sp.dmg, range: sp.range };
      this.vx = this.dir * 9;
    }
    return true;
  }

  startSuper() {
    if (this.super < 100) return false;
    this.super = 0;
    this.state = 'super';
    this.stateTime = 0;
    this.frame = 0;
    this.game.audio.super_();
    this.game.flashScreen(this.def.colors.accent);
    this.game.shake(14);
    const q = this.def.quotes.super;
    this.game.say(this, q[(Math.random() * q.length) | 0]);
    const sp = this.def.super;
    this.flashText(sp.name + '!');
    this.superData = sp;
    this.superHitsDone = 0;
    if (sp.type === 'melee-rush') {
      this.vx = this.dir * 10;
    } else if (sp.type === 'multi-projectile') {
      const colors = ['#ff5030', '#ffe14d', '#7dff5e', '#00e0ff', '#b26bff', '#ff7de0', '#ffffff', '#ffd27d'];
      for (let i = 0; i < sp.count; i++) {
        this.game.spawnProjectile(this, {
          speed: 7 + (i % 4), dmg: sp.dmg, w: 18, h: 18,
          color: colors[i % colors.length], shape: 'orb',
          angle: (i / sp.count) * Math.PI * 2 - Math.PI / 2,
        }, i * 90);
      }
    } else if (sp.type === 'aoe') {
      this.game.aoeBlast(this, sp.radius, sp.dmg, sp.heal || 0);
    } else if (sp.type === 'buff-rush') {
      this.buffInvUntil = this.now + sp.buff.invincible;
      this.buffDmgMult = sp.buff.dmgMult;
      this.vx = this.dir * 11;
    }
    return true;
  }

  heal(n) {
    this.hp = Math.min(this.maxHp, this.hp + n);
    this.game.spawnSparks(this.x, -80, '#7dff5e', 12);
  }

  update(input, opponent) {
    this.now = this.game.time;
    this.frame++;
    this.stateTime++;

    if (this.flash && this.now > this.flashUntil) this.flash = null;

    // virar para o oponente
    if (!this.busy && this.alive) {
      this.dir = opponent.x >= this.x ? 1 : -1;
    }

    // stun / choque / slow
    const stunned = this.now < this.stunUntil || this.now < this.shockUntil;
    const slowed = this.now < this.slowUntil;
    const speedBoost = this.now < this.speedBoostUntil;
    const burning = this.now < this.burnUntil;

    if (burning && this.frame % 20 === 0) {
      this.hp = Math.max(1, this.hp - 1);
      this.game.spawnSparks(this.x, -90, '#ff7b1c', 3);
    }

    if (this.state === 'ko') {
      this.vy += GRAVITY;
      this.y = Math.min(0, this.y + this.vy);
      this.x += this.vx;
      this.vx *= 0.9;
      return;
    }

    if (stunned) {
      if (this.state !== 'hit') { this.state = 'hit'; this.stateTime = 0; this.frame = 0; }
      this.vy += GRAVITY;
      this.y = Math.min(0, this.y + this.vy);
      this.x += this.vx;
      this.vx *= 0.85;
      return;
    }

    // estados de ataque com janelas de tempo
    if (this.state === 'punch' || this.state === 'kick') {
      const mv = this.attack;
      const total = mv.startup + mv.active + mv.recovery;
      if (this.stateTime === mv.startup && !this.hasHit) {
        this.checkMeleeHit(opponent, mv, this.state === 'kick' ? 8 : 4);
      }
      if (this.stateTime >= total) { this.state = 'idle'; this.stateTime = 0; }
      this.vy += GRAVITY; this.y = Math.min(0, this.y + this.vy);
      return;
    }

    if (this.state === 'special') {
      if (this.stateTime > 24) { this.state = 'idle'; this.stateTime = 0; }
      this.vy += GRAVITY; this.y = Math.min(0, this.y + this.vy);
      return;
    }

    if (this.state === 'super') {
      const sp = this.superData;
      if (sp.type === 'melee-rush' || sp.type === 'buff-rush') {
        if (this.stateTime % 12 === 0) {
          this.checkMeleeHit(opponent, { dmg: sp.dmg / sp.hits, range: 60 }, 8);
        }
        this.vx *= 0.92;
      }
      if (this.stateTime > 55) { this.state = 'idle'; this.stateTime = 0; this.buffDmgMult = 1; }
      this.vy += GRAVITY; this.y = Math.min(0, this.y + this.vy);
      return;
    }

    if (this.state === 'hit') {
      if (this.stateTime > 18) { this.state = 'idle'; this.stateTime = 0; }
      this.vy += GRAVITY; this.y = Math.min(0, this.y + this.vy);
      this.x += this.vx; this.vx *= 0.85;
      return;
    }

    if (this.state === 'win') return;

    // movimento livre
    let inv = this.now < this.invertControlsUntil ? -1 : 1;
    let spd = WALK_SPEED * (slowed ? 0.45 : 1) * (speedBoost ? 1.6 : 1) * this.def.stats.speed;
    let move = 0;
    if (input.left) move -= inv;
    if (input.right) move += inv;

    this.blocking = !!(input.down && this.onGround);

    if (input.punch && this.onGround && !this.blocking) { this.startAttack('punch'); return; }
    if (input.kick && this.onGround && !this.blocking) { this.startAttack('kick'); return; }
    if (input.special && this.onGround && !this.blocking) { if (this.startSpecial()) return; }
    if (input.super && this.onGround && !this.blocking) { if (this.startSuper()) return; }

    if (input.up && this.onGround) {
      this.vy = JUMP_VEL;
      this.y = -0.1;
      this.state = 'jump';
      this.game.audio.jump();
      return;
    }

    this.vx = move * spd;
    this.x += this.vx;

    if (this.state === 'jump') {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y >= 0) { this.y = 0; this.vy = 0; this.state = this.blocking ? 'crouch' : 'idle'; this.game.spawnSparks(this.x, -3, 'rgba(205,195,175,0.8)', 7); }
    } else if (this.blocking) {
      this.state = 'crouch';
    } else if (move !== 0) {
      this.state = 'walk';
      if (this.frame % 14 === 0) this.game.spawnSparks(this.x - this.vx * 2, -2, 'rgba(205,195,175,0.5)', 2);
    } else {
      this.state = 'idle';
    }

    // dash-strike (Git Master / Scrum)
    if (this.dashHit) {
      this.checkMeleeHit(opponent, { dmg: this.dashHit.dmg, range: this.dashHit.range }, 10);
      if (this.hasHit || this.stateTime % 10 === 0) this.dashHit = null;
    }
  }

  checkMeleeHit(opponent, mv, kx) {
    if (this.hasHit || !opponent.alive) return;
    const reach = mv.range * (opponent === this.game.p2 ? 1 : 1);
    const ax = this.x + this.dir * reach;
    const inRange = Math.abs(opponent.x - ax) < 34 && Math.abs(opponent.y - this.y) < 80 && opponent.onGround !== false;
    if (inRange) {
      this.hasHit = true;
      opponent.takeHit(mv.dmg, { kx, attacker: this });
    }
  }

  draw(ctx) {
    const pose = this.state === 'walk' ? 'walk' : this.state;
    const frame = this.frame;
    const flashing = this.state === 'hit' && this.frame % 4 < 2;
    const spr = flashing ? SpriteGen.getFlash(this.def, pose, frame, this.dir) : SpriteGen.get(this.def, pose, frame, this.dir);
    const w = this.width * 1.9, h = this.height * 1.58;
    // sombra
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    const shW = 44 * (1 - Math.min(Math.abs(this.y) / 200, 0.5));
    ctx.beginPath();
    ctx.ellipse(this.x, 4, shW, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // piscar quando invencível
    if ((this.now < this.invincibleUntil || this.now < this.buffInvUntil) && this.frame % 6 < 3) ctx.globalAlpha = 0.4;
    // contorno escuro + brilho de dano
    ctx.shadowColor = flashing ? '#ffffff' : 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = flashing ? 16 : 5;
    ctx.drawImage(spr, this.x - w / 2, this.y - h + 6, w, h);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // nome + fala flutuante
    if (this.flash) {
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000';
      ctx.fillText(this.flash, this.x + 1, this.y - this.height - 34 + 1);
      ctx.fillStyle = this.def.colors.accent;
      ctx.fillText(this.flash, this.x, this.y - this.height - 34);
      ctx.textAlign = 'left';
    }
  }
}
