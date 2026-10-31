/* ============================================================
   DS FIGHTERS — Lutador: física, guarda, combos, comandos e hitboxes.
   ============================================================ */

const GRAVITY_BASE = 0.64;
const WALK_SPEED = 3.25;

function boxesOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

class Fighter {
  constructor(def, x, dir, game) {
    this.def = def;
    this.game = game;
    this.x = x;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.dir = dir;
    this.hp = 100;
    this.maxHp = 100;
    this.super = 0;
    this.maxSuper = 100;
    this.state = 'idle';
    this.frame = 0;
    this.stateTime = 0;
    this.attack = null;
    this.attackHeight = 'mid';
    this.hasHit = false;
    this.now = 0;
    this.flash = null;
    this.flashUntil = 0;
    this.wins = 0;
    this.slowUntil = 0;
    this.burnUntil = 0;
    this.stunUntil = 0;
    this.invertControlsUntil = 0;
    this.bugUntil = 0;
    this.shockUntil = 0;
    this.rageUntil = 0;
    this.speedBoostUntil = 0;
    this.bounceUntil = 0;
    this.invincibleUntil = 0;
    this.dmgMultUntil = 0;
    this.dmgMult = 1;
    this.cycleIdx = 0;
    this.buffDmgMult = 1;
    this.buffInvUntil = 0;
    this.blocking = false;
    this.crouching = false;
    this.width = 40;
    this.height = 128;
    this.airAction = false;
    this.hitstun = 0;
    this.blockstun = 0;
    this.walkPhase = 0;
    this.motion = [];
    this.buf = { punch: 0, kick: 0, special: 0, super: 0 };
    this.prev = { left: false, right: false, down: false, up: false };
    this.lastLeft = -999;
    this.lastRight = -999;
    this.shotQueue = [];
    this.dashHit = null;
    this.superData = null;
    this.dashSign = 1;
  }

  get alive() { return this.hp > 0; }
  get onGround() { return this.y >= -0.01 && this.vy >= 0; }

  get busy() {
    return ['punch', 'kick', 'cpunch', 'ckick', 'jpunch', 'jkick', 'special', 'super', 'hit', 'ko', 'blockstun', 'dash', 'backdash', 'win'].includes(this.state);
  }

  flashText(txt) {
    this.flash = txt;
    this.flashUntil = this.now + 75;
  }

  gainSuper(n) {
    this.super = Math.min(this.maxSuper, this.super + n);
  }

  heal(n) {
    this.hp = Math.min(this.maxHp, this.hp + n);
    this.game.spawnSparks(this.x, this.y - 86, '#7dff5e', 10);
  }

  weight() { return this.def.stats.weight || 1; }

  attackSpec(kind) {
    const baseKind = kind === 'cpunch' || kind === 'jpunch' ? 'punch' : kind === 'ckick' || kind === 'jkick' ? 'kick' : kind;
    const base = this.def.moves[baseKind];
    const heavy = this.weight() > 1.12;
    const table = {
      punch: { height: 'mid', dmg: 1, range: 1, hitstun: 13, blockstun: 8, kx: 3.3, launch: 0, startup: 0, active: 0, recovery: 0 },
      kick: { height: 'mid', dmg: 1, range: 1, hitstun: 16, blockstun: 11, kx: 4.8, launch: 0, startup: 0, active: 1, recovery: 1 },
      cpunch: { height: 'mid', dmg: 0.82, range: 0.88, hitstun: 12, blockstun: 8, kx: 2.6, launch: 0, startup: 1, active: 0, recovery: 0 },
      ckick: { height: 'low', dmg: 1.08, range: 1.18, hitstun: 16, blockstun: 12, kx: 4.4, launch: 0, startup: 1, active: 1, recovery: 1 },
      jpunch: { height: 'high', dmg: 0.95, range: 0.95, hitstun: 14, blockstun: 10, kx: 3.4, launch: -3.4, startup: 1, active: 1, recovery: 2 },
      jkick: { height: 'high', dmg: 1.16, range: 1.12, hitstun: 17, blockstun: 12, kx: 5.1, launch: -5.4, startup: 2, active: 1, recovery: 3 },
    };
    const mod = table[kind] || table.punch;
    return {
      dmg: base.dmg * mod.dmg,
      range: base.range * mod.range,
      startup: Math.max(2, base.startup + mod.startup + (this.def.stats.speed > 1.25 ? -1 : 0)),
      active: base.active + mod.active,
      recovery: Math.max(6, base.recovery + mod.recovery),
      height: mod.height,
      hitstun: mod.hitstun + (heavy ? 3 : 0),
      blockstun: mod.blockstun + (heavy ? 2 : 0),
      kx: mod.kx * (heavy ? 1.15 : 1),
      launch: mod.launch,
    };
  }

  hurtbox() {
    const low = this.crouching || this.state === 'crouchblock' || this.state === 'cpunch' || this.state === 'ckick';
    const ko = this.state === 'ko' && this.onGround;
    const h = ko ? 40 : low ? 64 : 100;
    const w = ko ? 70 : 36;
    return { x: this.x - w / 2, y: this.y - h, w, h };
  }

  hitbox(mv) {
    const reach = mv.range;
    const low = this.state === 'cpunch' || this.state === 'ckick';
    const air = this.state === 'jpunch' || this.state === 'jkick';
    const h = low ? 32 : 50;
    const top = this.y - (low ? 42 : air ? 82 : 90);
    const w = Math.max(30, reach * 0.75);
    const x = this.dir === 1 ? this.x + 6 : this.x - 6 - w;
    return { x, y: top, w, h };
  }

  takeHit(dmg, opts = {}) {
    if (!this.alive) return;
    if (this.now < this.invincibleUntil || this.now < this.buffInvUntil) return;
    const atk = opts.attacker || null;
    let d = dmg * (atk ? atk.def.stats.power : 1);
    if (atk && atk.now < atk.rageUntil) d *= 2;
    if (atk && atk.buffDmgMult) d *= atk.buffDmgMult;
    if (this.now < this.bugUntil) d *= 2;
    d /= Math.sqrt(this.weight());
    let comboIndex = 0;
    if (atk && this.game.combo.owner === atk && this.game.time < this.game.combo.until) comboIndex = this.game.combo.count;
    if (!opts.noScale) d *= Math.max(0.42, 1 - comboIndex * 0.11);

    const height = opts.height || 'mid';
    const standBlock = this.blocking && !this.crouching;
    const lowBlock = this.blocking && this.crouching;
    const blocked = this.onGround && (
      (height === 'high' && standBlock) ||
      (height === 'low' && lowBlock) ||
      (height === 'mid' && (standBlock || lowBlock))
    );
    const sign = Math.sign(this.x - (atk ? atk.x : this.x - this.dir)) || -this.dir;

    if (blocked) {
      const chip = d * (opts.superChip ? 0.2 : 0.07);
      this.hp = opts.superChip ? Math.max(0, this.hp - chip) : Math.max(1, this.hp - chip);
      this.blockstun = opts.blockstun || 10;
      this.state = 'blockstun';
      this.stateTime = 0;
      this.vx = sign * (opts.kx || 3) * 0.42 / this.weight();
      this.game.audio.block();
      this.game.spawnSparks(this.x - sign * 8, this.y - 68, '#9adcff', 8);
      this.game.spawnSlash(this.x - sign * 6, this.y - 66, -sign, '#e7f7ff');
      this.gainSuper(3);
      if (atk) atk.gainSuper(2);
      this.game.registerHit(atk, this, chip, true, 3);
      if (this.hp <= 0) this.defeat(sign);
      return;
    }

    this.hp = Math.max(0, this.hp - d);
    this.vx = sign * (opts.kx || 4.2) / this.weight();
    if (opts.launch) {
      this.vy = opts.launch;
      this.y = Math.min(this.y, -1);
    }
    this.hitstun = opts.stun || 14;
    this.blocking = false;
    this.attack = null;
    this.hasHit = false;
    this.dashHit = null;
    this.state = 'hit';
    this.stateTime = 0;
    this.game.audio.hit();
    this.game.spawnSparks(this.x + sign * 6, this.y - 70, '#ffe14d', 14);
    this.game.spawnSlash(this.x, this.y - 72, -sign, d >= 12 ? '#ff7b1c' : '#fff4c8');
    this.game.shake(Math.min(12, d >= 14 ? 8 : 5));
    this.game.registerHit(atk, this, d, false, opts.hitstop || (d >= 14 ? 7 : 5));
    if (atk) atk.gainSuper(7);
    this.gainSuper(4);
    if (this.hp <= 0) this.defeat(sign);
  }

  defeat(sign) {
    this.state = 'ko';
    this.stateTime = 0;
    this.frame = 0;
    this.vy = -5.2;
    this.y = Math.min(this.y, -1);
    this.vx = (sign || -this.dir) * 2.2;
    this.hitstun = 0;
    this.game.audio.ko();
    this.game.onKO(this);
  }

  startAttack(kind) {
    this.state = kind;
    this.stateTime = 0;
    this.attack = this.attackSpec(kind);
    this.attackHeight = this.attack.height;
    this.hasHit = false;
    this.blocking = false;
    this.crouching = kind === 'cpunch' || kind === 'ckick';
    if (kind.includes('kick')) this.game.audio.kick();
    else this.game.audio.punch();
  }

  startSpecial() {
    const sp = this.def.special;
    if (!sp || this.super < sp.cost) return false;
    if (['ko', 'hit', 'win', 'blockstun'].includes(this.state)) return false;
    if (!this.onGround && !['jpunch', 'jkick', 'punch', 'kick'].includes(this.state)) return false;
    this.super -= sp.cost;
    this.state = 'special';
    this.stateTime = 0;
    this.hasHit = false;
    this.blocking = false;
    this.attack = null;
    this.game.audio.special();
    const q = this.def.quotes.special;
    this.game.say(this, q[(Math.random() * q.length) | 0]);
    this.flashText(sp.name + '!');
    if (sp.type === 'projectile' || sp.type === 'cycle-projectile') {
      const p = sp.type === 'cycle-projectile' ? sp.cycle[this.cycleIdx++ % sp.cycle.length] : sp.proj;
      if (p.label) this.flashText(p.label);
      const count = p.multi || 1;
      for (let i = 0; i < count; i++) this.shotQueue.push({ spec: p, delay: 7 + i * 5, stun: sp.stun || 0 });
      if (sp.heal) this.heal(sp.heal);
    } else if (sp.type === 'dash-strike' || sp.type === 'heal-strike') {
      this.vx = this.dir * (sp.type === 'dash-strike' ? 13.5 : 8.4);
      this.dashHit = { dmg: sp.dmg, range: sp.range || 108 };
      if (sp.heal) this.heal(sp.heal);
    }
    return true;
  }

  startSuper() {
    if (this.super < 100) return false;
    if (['ko', 'hit', 'win', 'blockstun'].includes(this.state)) return false;
    if (!this.onGround && !['jpunch', 'jkick', 'punch', 'kick', 'cpunch', 'ckick'].includes(this.state)) return false;
    this.super = 0;
    this.state = 'super';
    this.stateTime = 0;
    this.hasHit = false;
    this.blocking = false;
    this.game.audio.super_();
    this.game.flashScreen(this.def.colors.accent);
    this.game.shake(11);
    const q = this.def.quotes.super;
    this.game.say(this, q[(Math.random() * q.length) | 0]);
    const sp = this.def.super;
    this.superData = sp;
    this.flashText(sp.name + '!');
    this.game.showMessage(sp.name.toUpperCase(), 700, this.def.colors.accent);
    if (sp.type === 'melee-rush' || sp.type === 'buff-rush') {
      this.vx = this.dir * 7;
      if (sp.buff) {
        this.buffInvUntil = this.now + (sp.buff.invincible || 150);
        this.buffDmgMult = sp.buff.dmgMult || 2;
      }
    } else if (sp.type === 'multi-projectile') {
      const colors = ['#ff5030', '#ffe14d', '#7dff5e', '#00e0ff', '#b26bff', '#ff7de0', '#ffffff', '#ffd27d'];
      for (let i = 0; i < sp.count; i++) {
        this.shotQueue.push({
          spec: {
            speed: 7 + (i % 4), dmg: sp.dmg, w: 18, h: 18,
            color: colors[i % colors.length], shape: 'orb',
            angle: (i / sp.count) * Math.PI * 2 - Math.PI / 2,
          },
          delay: 6 + i * 4,
          stun: 0,
        });
      }
    } else if (sp.type === 'aoe') {
      this.game.aoeBlast(this, sp.radius, sp.dmg, sp.heal || 0);
    }
    return true;
  }

  checkMeleeHit(opponent, mv) {
    if (this.hasHit || !opponent.alive) return;
    if (!boxesOverlap(this.hitbox(mv), opponent.hurtbox())) return;
    this.hasHit = true;
    opponent.takeHit(mv.dmg, {
      kx: mv.kx,
      attacker: this,
      height: mv.height,
      launch: mv.launch,
      stun: mv.hitstun,
      blockstun: mv.blockstun,
      hitstop: mv.dmg >= 12 ? 7 : 5,
    });
  }

  notation(input) {
    const forward = this.dir === 1 ? input.right : input.left;
    const back = this.dir === 1 ? input.left : input.right;
    if (input.down && forward) return '3';
    if (input.down && back) return '1';
    if (input.down) return '2';
    if (input.up) return '8';
    if (forward) return '6';
    if (back) return '4';
    return '5';
  }

  noteMotion(input) {
    const dir = this.notation(input);
    const last = this.motion[this.motion.length - 1];
    if (!last || last.dir !== dir) this.motion.push({ dir, t: this.now });
    if (this.motion.length > 16) this.motion.shift();
  }

  hasMove(code) {
    const s = this.motion.filter((m) => this.now - m.t <= 22 && m.dir !== '5').map((m) => m.dir).join('');
    if (code === '236') return s.includes('236') || s.includes('26');
    if (code === '214') return s.includes('214') || s.includes('24');
    return false;
  }

  press(input) {
    if (input.punch) this.buf.punch = 8;
    if (input.kick) this.buf.kick = 8;
    if (input.special) this.buf.special = 8;
    if (input.super) this.buf.super = 10;
  }

  tickShots() {
    this.shotQueue = this.shotQueue.filter((s) => {
      s.delay--;
      if (s.delay <= 0) {
        if (this.alive) {
          const spec = s.stun ? { ...s.spec, stun: s.stun } : s.spec;
          this.game.spawnProjectile(this, spec, 0);
        }
        return false;
      }
      return true;
    });
  }

  physics() {
    const grav = GRAVITY_BASE + this.weight() * 0.12;
    const wasAir = this.y < 0;
    if (this.y < 0 || this.vy !== 0) {
      this.vy += grav;
      this.y += this.vy;
      if (this.y >= 0) {
        this.y = 0;
        this.vy = 0;
        if (wasAir) {
          this.airAction = false;
          if (this.state === 'jump' && this.alive && this.hitstun <= 0 && this.blockstun <= 0) {
            this.state = 'idle';
            this.stateTime = 0;
          }
          this.game.spawnSparks(this.x, -2, 'rgba(220,210,190,0.8)', 6);
          this.game.audio.land();
        }
      }
    }
    this.x += this.vx;
    if (this.state === 'dash' || this.state === 'backdash') this.vx *= 0.9;
    else if (this.state === 'special' || this.state === 'super') this.vx *= 0.93;
    else this.vx *= this.y < 0 ? 0.99 : 0.6;
  }

  stepAttack(opponent, input) {
    const mv = this.attack;
    if (!mv) { this.state = 'idle'; return; }
    const total = mv.startup + mv.active + mv.recovery;
    if (this.stateTime >= mv.startup && this.stateTime < mv.startup + mv.active) this.checkMeleeHit(opponent, mv);
    const cancel = this.hasHit && this.stateTime >= mv.startup && this.stateTime <= mv.startup + mv.active + Math.ceil(mv.recovery * 0.6);
    if (cancel) {
      if (this.buf.super && this.startSuper()) { this.buf.super = 0; return; }
      if ((this.buf.special || (this.buf.punch && this.hasMove('236'))) && this.startSpecial()) {
        this.buf.special = 0;
        this.buf.punch = 0;
        return;
      }
      if ((this.state === 'punch' || this.state === 'cpunch') && this.buf.kick) {
        this.buf.kick = 0;
        this.startAttack(this.onGround ? (this.state === 'cpunch' ? 'ckick' : 'kick') : 'jkick');
        return;
      }
    }
    if (this.stateTime >= total) {
      this.state = this.onGround ? 'idle' : 'jump';
      this.stateTime = 0;
      this.attack = null;
    }
  }

  stepSpecial(opponent) {
    if (this.dashHit && !this.hasHit) {
      this.checkMeleeHit(opponent, {
        dmg: this.dashHit.dmg,
        range: this.dashHit.range,
        height: 'mid',
        kx: 6.2,
        hitstun: 16,
        blockstun: 11,
        launch: -2.2,
      });
    }
    if (this.stateTime > 30) {
      this.state = this.onGround ? 'idle' : 'jump';
      this.stateTime = 0;
      this.dashHit = null;
    }
  }

  stepSuper(opponent) {
    const sp = this.superData;
    if (sp && (sp.type === 'melee-rush' || sp.type === 'buff-rush')) {
      if (this.stateTime % 8 === 0) {
        this.hasHit = false;
        this.checkMeleeHit(opponent, {
          dmg: sp.dmg / (sp.hits || 3),
          range: 72,
          height: 'mid',
          kx: 3.4,
          hitstun: 14,
          blockstun: 8,
          launch: this.stateTime > 28 ? -4.5 : 0,
        });
      }
      this.vx = this.dir * 5.5;
    }
    if (this.stateTime > 50) {
      this.state = 'idle';
      this.stateTime = 0;
      this.buffDmgMult = 1;
    }
  }

  tryActions(input, opponent) {
    let spd = WALK_SPEED * (this.def.stats.speed || 1);
    if (this.now < this.slowUntil) spd *= 0.48;
    if (this.now < this.speedBoostUntil) spd *= 1.55;

    const rightEdge = input.right && !this.prev.right;
    const leftEdge = input.left && !this.prev.left;

    const wantSuper = this.buf.super || (this.buf.kick && this.hasMove('214'));
    const wantSpecial = this.buf.special || (this.buf.punch && this.hasMove('236'));
    if (wantSuper && this.startSuper()) { this.buf.super = 0; this.buf.kick = 0; return; }
    if (wantSpecial && this.startSpecial()) { this.buf.special = 0; this.buf.punch = 0; return; }

    if (!this.onGround) {
      if (!this.airAction && (this.buf.punch || this.buf.kick)) {
        this.airAction = true;
        const kind = this.buf.kick ? 'jkick' : 'jpunch';
        this.buf.punch = 0;
        this.buf.kick = 0;
        this.startAttack(kind);
        return;
      }
      let drift = 0;
      if (input.left) drift -= 1;
      if (input.right) drift += 1;
      this.vx = drift * spd * 0.78;
      if (this.state !== 'jpunch' && this.state !== 'jkick') this.state = 'jump';
      return;
    }

    if (this.buf.punch) {
      this.buf.punch = 0;
      this.startAttack(input.down ? 'cpunch' : 'punch');
      return;
    }
    if (this.buf.kick) {
      this.buf.kick = 0;
      this.startAttack(input.down ? 'ckick' : 'kick');
      return;
    }

    if (this.onGround && rightEdge && this.now - this.lastRight < 15) {
      this.lastRight = this.now;
      this.startDash(1);
      return;
    }
    if (this.onGround && leftEdge && this.now - this.lastLeft < 15) {
      this.lastLeft = this.now;
      this.startDash(-1);
      return;
    }
    if (rightEdge) this.lastRight = this.now;
    if (leftEdge) this.lastLeft = this.now;

    if (input.up) {
      const w = this.weight();
      this.vy = -12.2 - (1.15 - w) * 3;
      this.y = -0.1;
      this.state = 'jump';
      this.stateTime = 0;
      this.blocking = false;
      this.crouching = false;
      this.airAction = false;
      this.game.audio.jump();
      return;
    }

    const back = (this.dir === 1 && input.left) || (this.dir === -1 && input.right);
    if (input.down) {
      this.crouching = true;
      this.blocking = true;
      this.state = 'crouchblock';
      this.vx = 0;
      return;
    }
    if (back) {
      this.crouching = false;
      this.blocking = true;
      this.state = 'block';
      this.vx = 0;
      return;
    }

    this.blocking = false;
    this.crouching = false;
    let move = 0;
    if (input.left) move -= 1;
    if (input.right) move += 1;
    if (move !== 0) {
      this.state = 'walk';
      this.vx = move * spd;
      this.walkPhase += Math.abs(move) * spd * 0.38;
      if (this.frame % 10 === 0) this.game.spawnSparks(this.x - this.vx * 2, -1, 'rgba(210,200,180,0.45)', 2);
    } else {
      this.state = 'idle';
      this.vx *= 0.5;
    }
  }

  startDash(sign) {
    this.dashSign = sign;
    this.state = sign === this.dir ? 'dash' : 'backdash';
    this.stateTime = 0;
    this.blocking = false;
    this.crouching = false;
    const fast = (this.def.stats.speed || 1) > 1.2;
    this.vx = sign * (this.state === 'dash' ? (fast ? 10.2 : 8) : (fast ? 7.4 : 6.2));
    this.game.audio.dash();
    this.game.spawnSparks(this.x, -4, 'rgba(255,255,255,0.35)', 5);
  }

  update(input, opponent) {
    this.now = this.game.time;
    this.frame++;
    this.stateTime++;
    if (this.flash && this.now > this.flashUntil) this.flash = null;
    if (this.buf.punch) this.buf.punch--;
    if (this.buf.kick) this.buf.kick--;
    if (this.buf.special) this.buf.special--;
    if (this.buf.super) this.buf.super--;

    let dirInput = input;
    if (this.now < this.invertControlsUntil) {
      dirInput = { ...input, left: input.right, right: input.left };
    }

    this.noteMotion(dirInput);
    this.press(dirInput);
    this.tickShots();

    if (this.now < this.burnUntil && this.frame % 28 === 0 && this.alive) {
      this.hp = Math.max(1, this.hp - 1);
      this.game.spawnSparks(this.x, this.y - 80, '#ff7b1c', 4);
    }

    if ((this.state === 'idle' || this.state === 'walk') && !dirInput.down && opponent) {
      this.dir = opponent.x >= this.x ? 1 : -1;
    }

    if (this.state === 'win') {
      this.vx *= 0.8;
      this.prev = { left: !!dirInput.left, right: !!dirInput.right, down: !!dirInput.down, up: !!dirInput.up };
      return;
    }

    if (this.state === 'ko' || !this.alive) {
      this.state = 'ko';
      this.physics();
      this.prev = { left: !!dirInput.left, right: !!dirInput.right, down: !!dirInput.down, up: !!dirInput.up };
      return;
    }

    const shocked = this.now < this.stunUntil || this.now < this.shockUntil;
    if (shocked) {
      this.state = 'hit';
      this.blocking = false;
      this.physics();
      this.prev = { left: !!dirInput.left, right: !!dirInput.right, down: !!dirInput.down, up: !!dirInput.up };
      return;
    }

    if (this.hitstun > 0) {
      this.hitstun--;
      this.state = 'hit';
      this.physics();
      if (this.hitstun <= 0) {
        this.state = this.onGround ? 'idle' : 'jump';
        this.stateTime = 0;
      }
      this.prev = { left: !!dirInput.left, right: !!dirInput.right, down: !!dirInput.down, up: !!dirInput.up };
      return;
    }

    if (this.blockstun > 0) {
      this.blockstun--;
      this.state = 'blockstun';
      this.physics();
      if (this.blockstun <= 0) {
        this.state = 'idle';
        this.stateTime = 0;
      }
      this.prev = { left: !!dirInput.left, right: !!dirInput.right, down: !!dirInput.down, up: !!dirInput.up };
      return;
    }

    if (['punch', 'kick', 'cpunch', 'ckick', 'jpunch', 'jkick'].includes(this.state)) {
      this.stepAttack(opponent, dirInput);
      this.physics();
    } else if (this.state === 'special') {
      this.stepSpecial(opponent);
      this.physics();
    } else if (this.state === 'super') {
      this.stepSuper(opponent);
      this.physics();
    } else if (this.state === 'dash' || this.state === 'backdash') {
      if (this.stateTime > (this.state === 'dash' ? 9 : 8)) {
        this.state = 'idle';
        this.stateTime = 0;
      }
      this.physics();
    } else {
      this.tryActions(dirInput, opponent);
      this.physics();
    }

    this.prev = { left: !!dirInput.left, right: !!dirInput.right, down: !!dirInput.down, up: !!dirInput.up };
  }

  animPose() {
    switch (this.state) {
      case 'dash': return 'walk';
      case 'backdash': return 'block';
      case 'crouchblock': return 'crouch';
      case 'blockstun': return this.crouching ? 'crouch' : 'block';
      case 'super':
        if (this.superData && (this.superData.type === 'melee-rush' || this.superData.type === 'buff-rush')) return 'punch';
        return 'special';
      case 'jump': return 'jump';
      case 'punch':
      case 'kick':
      case 'cpunch':
      case 'ckick':
      case 'jpunch':
      case 'jkick':
      case 'idle':
      case 'walk':
      case 'crouch':
      case 'special':
      case 'hit':
      case 'block':
      case 'ko':
      case 'win':
        return this.state;
      default: return 'idle';
    }
  }

  animFrame(pose) {
    const n = SpriteGen.count(pose);
    switch (pose) {
      case 'idle': return Math.floor(this.frame / 8) % n;
      case 'walk': return Math.floor(Math.abs(this.walkPhase)) % n;
      case 'jump':
        if (this.vy < -6) return 0;
        if (this.vy < -0.4) return 1;
        if (this.vy < 3.2) return 2 % n;
        if (this.y < -12) return Math.min(3, n - 1);
        return n - 1;
      case 'crouch': return Math.min(n - 1, Math.floor(this.stateTime / 3));
      case 'block': return Math.floor(this.frame / 7) % n;
      case 'hit': return Math.min(n - 1, Math.floor(this.stateTime / 3));
      case 'ko':
        if (this.y < -6) return Math.min(2, Math.floor(this.stateTime / 3));
        return Math.min(n - 1, Math.max(3, Math.floor(this.stateTime / 4)));
      case 'win': return Math.floor(this.frame / 7) % n;
      default: {
        const mv = this.attack;
        const total = mv ? mv.startup + mv.active + mv.recovery : 24;
        return Math.min(n - 1, Math.floor((this.stateTime / Math.max(1, total)) * n));
      }
    }
  }

  draw(ctx) {
    const pose = this.animPose();
    const frame = this.animFrame(pose);
    const flashing = this.state === 'hit' && this.frame % 4 < 2;
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    const sh = 26 * (1 - Math.min(Math.abs(this.y) / 240, 0.6));
    ctx.beginPath();
    ctx.ellipse(this.x, 3, Math.max(8, sh), 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const ghost = this.state === 'dash' || (this.state === 'special' && this.def.special && this.def.special.type === 'dash-strike');
    if (ghost) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      SpriteGen.blit(ctx, this.def.id, pose, frame, this.dir, this.x - this.dir * 18, this.y, false);
      ctx.restore();
    }

    ctx.save();
    if ((this.now < this.invincibleUntil || this.now < this.buffInvUntil) && this.frame % 6 < 3) ctx.globalAlpha = 0.4;
    if (this.now < this.rageUntil) ctx.shadowColor = '#ff5a3c';
    SpriteGen.blit(ctx, this.def.id, pose, frame, this.dir, this.x, this.y, flashing);
    ctx.restore();

    if (this.flash) {
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000';
      ctx.fillText(this.flash, this.x + 1, this.y - 132);
      ctx.fillStyle = this.def.colors.accent;
      ctx.fillText(this.flash, this.x, this.y - 133);
      ctx.textAlign = 'left';
    }
  }
}
