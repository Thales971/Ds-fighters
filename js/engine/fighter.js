/* ============================================================
   DS FIGHTERS — Lutador.
   Física, guarda alta/baixa, combos com cancelamento, contra-ataque,
   agarrão, tontura, knockdown com invencibilidade ao levantar,
   5 habilidades por tecla (executor genérico), status e buffs,
   roubo de kit do IALES e mascotes.
   ============================================================ */
const GRAVITY_BASE = 0.64;
const WALK_SPEED = 3.25;

function boxesOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const STATUS_LABEL = {
  atk: { t: 'ATQ+', c: '#ff4b4b' }, def: { t: 'DEF+', c: '#4ba3ff' }, spd: { t: 'VEL+', c: '#ffd84b' },
  rage: { t: 'FÚRIA', c: '#ff6a1c' }, armor: { t: 'ARMADURA', c: '#ffd27d' }, reflect: { t: 'REFLEXO', c: '#7de0ff' },
  invuln: { t: 'INVULN.', c: '#ffffff' }, astra: { t: 'ASTRA', c: '#a78bff' }, aura: { t: 'AURA', c: '#c77dff' }, spot: { t: 'HOLOFOTE', c: '#fff36b' },
  burn: { t: 'QUEIMANDO', c: '#ff7b1c' }, poison: { t: 'VENENO', c: '#9dff4a' }, slow: { t: 'LENTO', c: '#7db8ff' },
  locked: { t: 'SEM PODERES', c: '#ff3b5c' }, blind: { t: 'CEGO', c: '#b9b9b9' }, shock: { t: 'ELETRIZADO', c: '#7df9ff' },
  meterSlow: { t: 'MEDIDOR LENTO', c: '#39ff6a' }, cloak: { t: 'FANTASMA', c: '#9dffb0' },
  chill: { t: 'CONGELANDO', c: '#a8e6ff' }, bleed: { t: 'SANGRANDO', c: '#ff2d55' }, vuln: { t: 'VULNERÁVEL', c: '#ff9f1c' }, overclock: { t: 'OVERCLOCK', c: '#00f0ff' }, dizzy: { t: 'TONTO', c: '#ffe14d' }, stolen: { t: 'KIT ROUBADO', c: '#c77dff' }, regen: { t: 'REGEN', c: '#7dff9a' },
};

class Fighter {
  constructor(def, x, dir, game, opts = {}) {
    this.def = def;
    this.game = game;
    this.team = opts.team || 0;
    this.slot = opts.slot == null ? this.team : opts.slot;
    this.x = x;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.dir = dir;
    this.maxHp = def.stats.hp || 100;
    this.hp = this.maxHp;
    this.redHp = this.maxHp;
    this.charge = [0, 0];
    this.ultimate = 0;
    this.kit = (typeof POWERS !== 'undefined' && POWERS[def.id]) || null;
    this.element = this.kit ? this.kit.element : 'arcano';
    this.cd = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.status = {};
    this.stolen = null;
    this.afo = 0;
    this.stunGauge = 0;
    this.state = 'idle';
    this.frame = 0;
    this.stateTime = 0;
    this.attack = null;
    this.hasHit = false;
    this.now = 0;
    this.flash = null;
    this.flashUntil = 0;
    this.wins = 0;
    this.blocking = false;
    this.crouching = false;
    this.airAction = false;
    this.hitstun = 0;
    this.blockstun = 0;
    this.walkPhase = 0;
    this.buf = { punch: 0, kick: 0 };
    for (let i = 0; i < 10; i++) this.buf['a' + i] = 0;
    this.chain = 0;
    this.airChain = 0;
    this.sig = (typeof SIGNATURES !== 'undefined' && SIGNATURES[def.id]) || {};
    this.prev = { left: false, right: false, down: false, up: false };
    this.lastLeft = -999;
    this.lastRight = -999;
    this.queue = [];
    this.cast = null;
    this.dashHit = null;
    this.rush = null;
    this.benched = false;
    this.lastInput = EMPTY_INPUT;
    this.stats = { dmg: 0, maxCombo: 0, hits: 0 };
    this.pet = opts.pet || PETS[0];
    this.applyPet();
  }

  /* ---------- utilidades ---------- */
  get alive() { return this.hp > 0; }
  get onGround() { return this.y >= -0.01 && this.vy >= 0; }
  has(s) { return (this.status[s] || 0) > this.now; }
  addStatus(s, frames) { this.status[s] = Math.max(this.status[s] || 0, this.now + frames); }
  left(s) { return Math.max(0, (this.status[s] || 0) - this.now); }
  weight() { return this.def.stats.weight || 1; }
  get pfx() { return (this.pet && this.pet.fx) || {}; }
  applyPet() {
    this.shield = this.pfx.shield || 0;
    this.revived = false;
  }
  enemy() { return this.game.enemyOf(this); }
  flashText(txt, color) {
    this.flash = txt;
    this.flashColor = color || null;
    this.flashUntil = this.now + 70;
  }
  heal(n) {
    if (!this.alive) return;
    this.hp = Math.min(this.maxHp, this.hp + n);
    this.redHp = Math.max(this.redHp, this.hp);
    this.game.spawnBurst('arcane', 2, this.x, this.y - 100, 1, 1.8);
    this.game.floatText(this.x, this.y - 210, '+' + Math.round(n), '#7dff9a');
  }
  chip(n, attacker) {
    if (!this.alive || this.has('invuln')) return;
    this.hp = Math.max(0, this.hp - n);
    if (attacker) attacker.stats.dmg += n;
    if (this.hp <= 0) this.defeat(attacker ? Math.sign(this.x - attacker.x) : -this.dir);
  }
  meterRate() {
    let m = (this.def.stats.meterRate || 1) * (1 + (this.pfx.meter || 0));
    if (this.has('meterSlow')) m *= 0.4;
    return m;
  }
  gain(dealt, amount = 1) {
    const r = this.meterRate() * amount;
    this.charge[0] = Math.min(100, this.charge[0] + (dealt ? 9 : 6) * r);
    this.charge[1] = Math.min(100, this.charge[1] + (dealt ? 7 : 8) * r);
    this.ultimate = Math.min(100, this.ultimate + (dealt ? 5.5 : 4.5) * r);
  }
  ownKit() { return (this.kit && this.kit.powers) || []; }
  currentKit() { return this.stolen ? this.stolen.powers : this.ownKit(); }
  kitOwnerId(p) { return (p && p._fid) || this.def.id; }
  elementOf(p) { const f = this.kitOwnerId(p); return (POWERS[f] && POWERS[f].element) || this.element; }
  autoAim() { return !!(this.kit && this.kit.autoAim); }

  /* ---------- multiplicadores ---------- */
  spriteKey() { return this.has('astra') && this.def.id === 'qwen' ? 'qwen-astra' : this.def.id; }
  dmgMult(p) {
    let m = this.def.stats.power || 1;
    if (this.has('atk')) m *= 1.35;
    if (this.has('rage')) m *= this.status.rageMult || 1.5;
    if (this.has('aura') && this.aura && this.aura.dmgMult) m *= this.aura.dmgMult;
    if (this.has('spot')) m *= 1.25;
    if (this.has('astra')) m *= 1.3;
    m *= 1 + (this.pfx.dmg || 0);
    m *= 1 + this.afo * 0.04;
    if (this.sig.lowHpRage && this.hp < this.maxHp * 0.35) m *= this.sig.lowHpRage;
    const w = this.game.weather ? this.game.weather.kind : 'clear';
    const el = p ? this.elementOf(p) : null;
    if (el) {
      if ((w === 'rain' || w === 'storm') && (el === 'agua' || el === 'ia' || el === 'neon')) m *= w === 'storm' ? 1.25 : 1.15;
      if ((w === 'rain' || w === 'storm') && el === 'magma') m *= 0.85;
      if (w === 'snow' && (el === 'tempo' || el === 'agua')) m *= 1.2;
    }
    return m;
  }
  defMult() {
    let m = 1 / Math.sqrt(this.weight());
    if (this.has('def')) m *= 0.65;
    if (this.has('vuln')) m *= 1.2;
    if (this.has('aura') && this.aura && this.aura.defMult) m *= this.aura.defMult;
    m *= 1 - (this.pfx.def || 0);
    return m;
  }
  speedMult() {
    if (this.has('astra')) return this._speedBase() * 1.15;
    return this._speedBase();
  }
  _speedBase() {
    let m = this.def.stats.speed || 1;
    if (this.has('spd')) m *= 1.4;
    if (this.has('aura') && this.aura && this.aura.speedMult) m *= this.aura.speedMult;
    if (this.has('slow')) m *= 0.55;
    if (this.has('chill')) m *= 0.68;
    if (this.has('overclock')) m *= 1.3;
    m *= 1 + (this.pfx.speed || 0);
    if (this.game.weather && this.game.weather.kind === 'snow') m *= 0.92;
    return m;
  }

  /* ---------- golpes básicos ---------- */
  attackSpec(kind) {
    const baseKind = kind === 'cpunch' || kind === 'jpunch' ? 'punch' : kind === 'ckick' || kind === 'jkick' ? 'kick' : kind;
    const base = this.def.moves[baseKind] || this.def.moves.punch;
    const heavy = this.weight() > 1.12;
    const table = {
      punch: { height: 'mid', dmg: 1, range: 1, hitstun: 14, blockstun: 8, kx: 3.3, launch: 0, startup: 0, active: 0, recovery: 0 },
      kick: { height: 'mid', dmg: 1, range: 1, hitstun: 17, blockstun: 11, kx: 4.8, launch: 0, startup: 1, active: 1, recovery: 1 },
      cpunch: { height: 'mid', dmg: 0.82, range: 0.88, hitstun: 13, blockstun: 8, kx: 2.6, launch: 0, startup: 0, active: 0, recovery: 0 },
      ckick: { height: 'low', dmg: 1.08, range: 1.18, hitstun: 16, blockstun: 12, kx: 4.4, launch: 0, startup: 1, active: 1, recovery: 2, sweep: true },
      jpunch: { height: 'high', dmg: 0.95, range: 0.95, hitstun: 15, blockstun: 10, kx: 3.4, launch: -3.4, startup: 1, active: 2, recovery: 2 },
      jkick: { height: 'high', dmg: 1.16, range: 1.12, hitstun: 18, blockstun: 12, kx: 5.1, launch: -5.4, startup: 2, active: 2, recovery: 3 },
    };
    const mod = table[kind] || table.punch;
    return {
      kind,
      dmg: base.dmg * mod.dmg,
      range: base.range * mod.range * (this.autoAim() ? 1.25 : 1),
      startup: Math.max(2, base.startup + mod.startup + ((this.def.stats.speed || 1) > 1.2 ? -1 : 0) + (this.has('chill') ? 2 : 0)),
      active: base.active + mod.active,
      recovery: Math.max(6, base.recovery + mod.recovery),
      height: mod.height,
      hitstun: mod.hitstun + (heavy ? 3 : 0),
      blockstun: mod.blockstun + (heavy ? 2 : 0),
      kx: mod.kx * (heavy ? 1.15 : 1),
      launch: mod.launch,
      sweep: !!mod.sweep,
    };
  }
  hurtbox() {
    if (this.benched) return { x: -9999, y: 0, w: 0, h: 0 };
    const low = this.crouching || this.state === 'crouchblock' || this.state === 'cpunch' || this.state === 'ckick';
    const down = (this.state === 'ko' || this.state === 'down') && this.onGround;
    const h = down ? 52 : low ? 92 : 172;
    const w = down ? 96 : 58;
    return { x: this.x - w / 2, y: this.y - h, w, h };
  }
  hitbox(mv) {
    const low = this.state === 'cpunch' || this.state === 'ckick';
    const air = this.state === 'jpunch' || this.state === 'jkick';
    const h = low ? 44 : 68;
    const top = this.y - (low ? 56 : air ? 124 : 136);
    const w = Math.max(34, mv.range * 0.8);
    const x = this.dir === 1 ? this.x + 4 : this.x - 4 - w;
    return { x, y: top, w, h };
  }

  /* ---------- receber dano ---------- */
  takeHit(dmg, o = {}) {
    if (!this.alive || this.benched) return false;
    const atk = o.attacker || null;
    const unblockable = o.height === 'unblockable';
    const game = this.game;
    if (this.has('invuln') && !unblockable) {
      if (this.def.id === 'merc' && (this.state === 'dash' || this.state === 'backdash') && atk && !this.perfectDone) {
        this.perfectDone = true;
        this.gain(true, 8);
        game.slowmo = Math.max(game.slowmo || 0, 16);
        game.floatText(this.x, this.y - 230, 'ESQUIVA LIMPA!', '#00f0ff');
        game.audio.play('whoosh');
        game.spawnImgFx('rastro', 'flash', this.x, this.y - 80, { scale: 1.6, life: 14, dir: this.dir });
      }
      return false;
    }
    if (this.state === 'down' && !o.hazard) return false;
    // esquiva sináptica (passiva do Cromo e de quem estiver em overclock): desvia de projéteis/golpes leves
    if (atk && !unblockable && !o.hazard && (this.sig.dodge || this.has('overclock')) && this.onGround && this.canAct() && this.state !== 'attack') {
      const chance = (this.sig.dodge || 0) + (this.has('overclock') ? 0.25 : 0);
      if (Math.random() < chance) {
        const sgn = Math.sign(this.x - atk.x) || 1;
        this.x = Math.max(50, Math.min(game.W - 50, this.x + sgn * 70));
        this.addStatus('invuln', 12);
        this.afterimage = 18;
        game.floatText(this.x, this.y - 230, 'ESQUIVA!', '#00f0ff');
        game.audio.play('whoosh');
        return false;
      }
    }
    let d = dmg * (atk ? atk.dmgMult(o.power) : 1) * this.defMult();
    let comboIndex = 0;
    if (atk && game.combo.owner === atk && game.combo.until > game.time) comboIndex = game.combo.count;
    if (!o.noScale) d *= Math.max(0.35, 1 - comboIndex * 0.075);
    const juggled = !this.onGround && comboIndex >= 9;
    const counter = atk && !o.hazard && this.state === 'attack' && this.attack && this.stateTime < this.attack.startup + this.attack.active;
    if (counter) d *= 1.2;
    const sign = o.dirSign || Math.sign(this.x - (atk ? atk.x : this.x - this.dir)) || -this.dir;
    const height = o.height || 'mid';
    const standBlock = this.blocking && !this.crouching;
    const lowBlock = this.blocking && this.crouching;
    const canBlock = this.onGround && !unblockable && ['idle', 'walk', 'block', 'crouchblock', 'blockstun'].includes(this.state);
    const blocked = canBlock && ((height === 'high' && standBlock) || (height === 'low' && lowBlock) || (height === 'mid' && (standBlock || lowBlock)));
    if (blocked) {
      const chip = d * (o.projectile || o.ability ? 0.16 : 0.05);
      this.hp = Math.max(o.ability ? 0 : 1, this.hp - chip);
      this.blockstun = o.blockstun || 11;
      this.state = 'blockstun';
      this.stateTime = 0;
      this.vx = sign * (o.kx || 3) * 0.45 / this.weight();
      game.audio.block();
      game.spawnBurst('impact', 2, this.x - sign * 14, this.y - 100, -sign, 1.3);
      game.registerHit(atk, this, chip, true, 3);
      this.gain(false, 0.4);
      if (atk) atk.gain(true, 0.3);
      if (this.hp <= 0) this.defeat(sign);
      return true;
    }
    // escudo do mascote
    if (this.shield > 0) {
      const absorb = Math.min(this.shield, d);
      this.shield -= absorb;
      d -= absorb;
      game.spawnBurst('water', 2, this.x, this.y - 100, 1, 1.5);
      if (d <= 0) { game.floatText(this.x, this.y - 200, 'ESCUDO', '#7de0ff'); return true; }
    }
    this.hp = Math.max(0, this.hp - d);
    if (atk) { atk.stats.dmg += d; atk.stats.hits++; }
    const armored = this.has('armor') && !o.heavy && d < 16 && this.hp > 0;
    if (counter) game.floatText(this.x, this.y - 230, 'CONTRA-ATAQUE!', '#ff4b4b');
    if (o.burn && !this.pfx.immune) this.addStatus('burn', o.burn);
    if (o.poison && !this.pfx.immune) this.addStatus('poison', o.poison);
    if (o.slow) this.addStatus('slow', o.slow);
    this.applyEffects(o, atk, d);
    if (atk && atk.cast && o.ability) atk.cast.hit = true;
    game.audio.hit(d >= 13);
    game.shake(Math.min(12, d >= 14 ? 8 : 4));
    game.registerHit(atk, this, d, false, o.hitstop || (d >= 14 ? 8 : 5), counter);
    if (atk) atk.gain(true);
    this.gain(false);
    // tontura
    this.stunGauge += d * 2.3 * (atk && atk.sig.stunMult ? atk.sig.stunMult : 1);
    if (this.hp <= 0) { this.defeat(sign); return true; }
    if (!this.revived && this.pfx.revive && this.hp < this.maxHp * 0.25) {
      this.revived = true;
      this.heal(this.pfx.revive);
      game.floatText(this.x, this.y - 240, 'COMMIT SALVO!', '#ff9a3b');
    }
    if (armored) {
      this.flashWhite = 6;
      return true;
    }
    this.vx = sign * (o.kx || 4.2) / this.weight();
    if (juggled) {
      // limite de juggle: o alvo cai em vez de ser relançado (evita loops infinitos)
      this.vy = Math.max(this.vy, 3);
      this.launched = true;
    } else if (o.launch && o.launch < 0) {
      this.vy = o.launch;
      this.y = Math.min(this.y, -1);
      this.launched = true;
    } else if (!this.onGround) {
      this.vy = Math.min(this.vy, -3);
      this.launched = true;
    }
    if (o.sweep) { this.vy = -4; this.y = -1; this.launched = true; }
    this.hitstun = juggled ? Math.min(o.stun || 14, 12) : (o.stun || 14);
    if (this.has('chill')) this.hitstun += 3;
    if (o.trap) { this.addStatus('trap', o.trap); this.hitstun = Math.max(this.hitstun, o.trap); }
    if (o.freeze) { this.addStatus('freeze', o.stun || 60); }
    this.blocking = false;
    this.attack = null;
    this.cast = null;
    this.rush = null;
    this.dashHit = null;
    this.queue = [];
    this.state = 'hit';
    this.stateTime = 0;
    this.flashWhite = 4;
    if (this.stunGauge >= 100 && this.hp > 0) {
      this.stunGauge = 0;
      this.addStatus('dizzy', 100);
      this.hitstun = Math.max(this.hitstun, 100);
      game.floatText(this.x, this.y - 240, 'TONTO!', '#ffe14d');
      game.audio.voice('combo');
    }
    return true;
  }
  /** Efeitos de status: assinatura do lutador + campo fx do poder. */
  applyEffects(o, atk, d) {
    if (!atk || this.pfx.immune || !this.alive) return;
    const p = o.power || null;
    const owner = p ? atk.kitOwnerId(p) : atk.def.id;
    const sig = (typeof SIGNATURES !== 'undefined' && SIGNATURES[owner]) || {};
    const fx = Object.assign({}, o.ability ? sig.ability : sig.basic, p && p.fx);
    if (!fx) return;
    const game = this.game;
    if (fx.blind) this.addStatus('blind', fx.blind);
    if (fx.shock) this.addStatus('shock', fx.shock);
    if (fx.chill) this.addStatus('chill', fx.chill);
    if (fx.bleed) this.addStatus('bleed', fx.bleed);
    if (fx.burn) this.addStatus('burn', fx.burn);
    if (fx.poison) this.addStatus('poison', fx.poison);
    if (fx.vuln) this.addStatus('vuln', fx.vuln);
    if (fx.slow) this.addStatus('slow', fx.slow);
    if (fx.lock) this.addStatus('locked', fx.lock);
    if (fx.stun) this.stunGauge += fx.stun;
    if (fx.drain) atk.heal(d * fx.drain);
    if (fx.meterBurn) { this.charge[0] = Math.max(0, this.charge[0] - fx.meterBurn); this.charge[1] = Math.max(0, this.charge[1] - fx.meterBurn); }
    if (fx.meterSlow) this.addStatus('meterSlow', fx.meterSlow);
    if (fx.explode && this.hp > 0) {
      this.chip(fx.explode, atk);
      game.spawnBurst('fire', 3, this.x, this.y - 90, 1, 2.6);
      game.shake(6);
      game.audio.play('explosion', { vol: 0.5 });
    }
  }
  defeat(sign) {
    this.state = 'ko';
    this.stateTime = 0;
    this.vy = -6;
    this.y = Math.min(this.y, -1);
    this.vx = (sign || -this.dir) * 3;
    this.hitstun = 0;
    this.cast = null;
    this.rush = null;
    this.game.audio.ko();
    this.game.onKO(this);
  }

  /* ---------- habilidades ---------- */
  powerState(i) {
    const p = this.currentKit()[i];
    if (!p) return { ready: false, pct: 0 };
    if (this.has('locked')) return { ready: false, pct: 0, locked: true, p };
    if (p.slot === 'simple') {
      const total = p.cd || 50;
      return { ready: this.cd[i] <= 0, pct: 1 - this.cd[i] / total, p };
    }
    if (p.slot === 'charge') {
      const v = this.charge[p.meter == null ? (i === 2 ? 0 : 1) : p.meter];
      return { ready: v >= 100, pct: v / 100, p };
    }
    const needOk = !p.needAfo || this.afo >= p.needAfo;
    return { ready: this.ultimate >= 100 && needOk, pct: this.ultimate / 100, p, need: needOk ? 0 : `${this.afo}/${p.needAfo}` };
  }
  canAct() {
    return !['ko', 'hit', 'win', 'blockstun', 'cast', 'rush', 'throw', 'thrown', 'down', 'tagout'].includes(this.state) && !this.benched;
  }
  tryCast(i) {
    const kit = this.currentKit();
    const early = kit[i];
    if (early && early.overheat && this.aura && this.aura.id === early.id && this.has('aura')) {
      this.overclockCut = true;
      this.status.aura = this.now;
      this.aura = null;
      this.flashText('CORTEU NO SECO', '#7dff9a');
      this.game.audio.play('whoosh');
      return true;
    }
    const st = this.powerState(i);
    if (!st.p) return false;
    if (st.locked) { this.flashText('PODERES ROUBADOS!', '#ff3b5c'); return false; }
    if (!st.ready) {
      if (st.p.slot !== 'simple') this.flashText(st.p.slot === 'ultimate' ? 'ULTIMATE CARREGANDO' : 'CARREGANDO ' + Math.round(st.pct * 100) + '%');
      return false;
    }
    const cancelable = (this.state === 'attack' && this.hasHit) || (this.state === 'cast' && this.cast && this.cast.fired && (this.cast.hit || this.hasHit));
    if (!this.canAct() && !cancelable) return false;
    if (!this.onGround && st.p.kind !== 'shot' && st.p.kind !== 'aura') return false;
    this.startCast(i, st.p);
    return true;
  }
  startCast(i, p) {
    const game = this.game;
    if (p.slot === 'simple') this.cd[i] = p.cd || 50;
    else if (p.slot === 'charge') this.charge[p.meter == null ? (i === 2 ? 0 : 1) : p.meter] = 0;
    else this.ultimate = 0;
    this.cast = { p, i, t: 0, fired: false };
    this.state = 'cast';
    this.stateTime = 0;
    this.attack = null;
    this.hasHit = false;
    this.blocking = false;
    this.crouching = false;
    if (this.onGround) this.vx *= 0.3;
    this.castAfo = this.afo;
    if (p.transform) {
      this.addStatus(p.transform, p.time || 600);
      this.addStatus('armor', 90);
      this.flashText('QWEN ASTRA!', '#a78bff');
      for (let k = 0; k < 3; k++) game.spawnBurst('chaos', 3, this.x, -60 - k * 50, this.dir, 2 + k * 0.4);
    }
    if (this.def.id === 'iales' && p.kind !== 'afo2') this.afo = Math.min(10, this.afo + 1);
    const ult = p.slot === 'ultimate';
    this.flashText(p.name.toUpperCase(), this.def.colors.accent);
    game.audio.sfx(p.sfx || 'magic');
    const q = ult ? this.def.quotes.super : this.def.quotes.special;
    if (q && q.length && (ult || Math.random() < 0.4)) game.say(this, q[(Math.random() * q.length) | 0]);
    if (ult) {
      game.superFreeze(this, p);
      game.audio.voice('ultimate');
    }
    game.events.push({ t: 'cast', who: this.slot, name: p.name });
  }
  fire(p) {
    const game = this.game;
    const tgt = this.enemy();
    const tx = tgt ? tgt.x : this.x + this.dir * 260;
    const fid = this.kitOwnerId(p);
    const key = 'abil:' + fid;
    const el = this.elementOf(p);
    const scaleBig = p.big ? 1.9 : 1.45;
    const seek = p.seek || this.autoAim();
    switch (p.kind) {
      case 'shot': {
        const n = p.count || 1;
        for (let k = 0; k < n; k++) {
          const ang = n > 1 ? (k - (n - 1) / 2) * (p.spread || 0.25) : 0;
          this.queue.push({ at: k * 5, fn: () => game.projectiles.push(new Projectile(this, p, { angle: ang, seek, fid })) });
        }
        break;
      }
      case 'pillar': {
        let x = p.at === 'target' || seek ? tx : this.x + this.dir * 240;
        if (p.at === 'behind' && tgt) x = tgt.x - tgt.dir * 20;
        game.strikes.push(new Strike(this, {
          x, delay: p.delay || 18, w: p.at === 'behind' ? 200 : (p.big ? 150 : 110), h: 260, dmg: p.dmg, stun: p.stun || 20, launch: p.launch == null ? -7 : p.launch,
          burn: p.burn, poison: p.poison, slow: p.slow, element: el, follow: seek ? tgt : null, power: p,
          sheet: { key, row: p.row, frames: 4 }, scale: scaleBig, dir: this.dir, sound: p.sfx === 'fire' ? 'fire' : 'explosion', shake: 6,
          warnColor: (ELEMENT_FX[el] || {}).color,
        }));
        break;
      }
      case 'dash': {
        let sp = p.speed || 13;
        if (seek && tgt) this.dir = tgt.x >= this.x ? 1 : -1;
        this.vx = this.dir * sp;
        this.dashHit = { p, t: p.phase ? 18 : 16 };
        if (p.phase || p.cloak) {
          this.addStatus('invuln', p.iFrames || 12);
          if (p.cloak) this.addStatus('cloak', p.cloak);
          this.phaseDash = p.iFrames || 14;
        }
        break;
      }
      case 'aura': {
        const t = p.time || 300;
        this.aura = p;
        this.auraFid = fid;
        this.addStatus('aura', t);
        if (p.armor) this.addStatus('armor', t);
        if (p.reflect) this.addStatus('reflect', t);
        if (p.dmgMult && p.id === 'rage') { this.addStatus('rage', t); this.status.rageMult = p.dmgMult; }
        if (p.invuln) this.addStatus('invuln', p.invuln);
        if (p.grant) this.addStatus(p.grant, t);
        if (p.regen) this.addStatus('regen', t);
        if (p.heal) this.heal(p.heal);
        if (p.meterGain) { this.charge[0] = Math.min(100, this.charge[0] + p.meterGain); this.charge[1] = Math.min(100, this.charge[1] + p.meterGain); }
        if (p.cleanse) { ['burn', 'poison', 'slow', 'trap', 'freeze', 'locked', 'blind', 'shock', 'chill', 'bleed', 'vuln'].forEach((s) => { this.status[s] = 0; }); }
        if (p.overheat) { this.overclockHot = true; this.overclockCut = false; this.overclockUntil = this.now + (p.time || 280); }
        if (p.grant === 'cloak' || p.cloak) this.addStatus('cloak', p.time || 180);
        if (p.teleportBehind && tgt) {
          game.spawnImgFx('portal', 'aura', this.x, -8, { scale: 2.4, life: 16 });
          this.x = Math.max(60, Math.min(game.W - 60, tgt.x - tgt.dir * 80));
          this.dir = tgt.x >= this.x ? 1 : -1;
          game.spawnImgFx('portal', 'aura', this.x, -8, { scale: 2.4, life: 16 });
        }
        if (p.burstDmg && tgt && Math.abs(tgt.x - this.x) < 150) {
          tgt.takeHit(p.burstDmg, { attacker: this, kx: 9, dirSign: this.dir, launch: -6, stun: 20, ability: true, power: p });
        }
        game.spawnBurst('impact', 3, this.x, this.y - 100, 1, 2.6);
        break;
      }
      case 'beam': {
        const range = p.range || 220;
        game.beams.push({ owner: this, fid, row: p.row, x: this.x + this.dir * 40, dir: this.dir, len: range, age: 0, life: 20, y: -100 });
        if (tgt) {
          const dx = (tgt.x - this.x) * this.dir;
          if ((dx > -20 && dx < range + 40) || seek) {
            tgt.takeHit(p.dmg, { attacker: this, kx: 6, dirSign: this.dir, stun: p.stun || 18, launch: p.launch, poison: p.poison, burn: p.burn, slow: p.slow, ability: true, power: p, element: el });
            game.spawnAbilityImpact(this, p, tgt.x, tgt.y - 100);
          }
        }
        break;
      }
      case 'blast': {
        if (p.at === 'wave') {
          const pr = new Projectile(this, Object.assign({}, p, { ground: true, pierce: true, multiHit: 3, speed: 10 }), { fid, scale: 2.4 });
          pr.x = this.x - this.dir * 60;
          pr.y = -60;
          pr.life = 160;
          pr.hitsLeft = 3;
          pr.p = Object.assign({}, pr.p, { ground: false });
          pr.vy = 0;
          pr.lockY = -110;
          game.projectiles.push(pr);
          game.shake(10);
        } else if (p.at === 'self') {
          game.strikes.push(new Strike(this, { x: this.x, delay: 4, w: (p.radius || 240) * 2, h: 300, dmg: p.dmg, stun: 26, launch: -9, sheet: { key, row: p.row, frames: 4 }, scale: 3, element: el, power: p, sound: 'explosion', shake: 12 }));
        } else {
          game.strikes.push(new Strike(this, { x: tx, delay: 14, w: 200, h: 320, dmg: p.dmg, stun: 26, launch: -9, sheet: { key, row: p.row, frames: 4 }, scale: 2.6, follow: tgt, element: el, power: p, sound: 'explosion', shake: 12 }));
        }
        if (p.heal) this.heal(p.heal);
        if (p.kernel) {
          game.bsod = 80;
          game.glitch = 28;
          game.spawnImgFx('kernel', 'ultimate', game.W / 2, 180, { scale: 5, life: 36 });
          game.audio.play('hazard');
        }
        break;
      }
      case 'quake': {
        /* Soco que racha o ar: trava (lock) e depois arremessa para longe. */
        const range = p.range || 150;
        const foes = p.both ? game.opponentsOf(this) : (tgt ? [tgt] : []);
        if (p.pullFirst && tgt) {
          const dx0 = (tgt.x - this.x) * this.dir;
          if (dx0 > 0 && dx0 < range) { tgt.x = this.x + this.dir * 84; tgt.vx = 0; }
        }
        game.addCrack(this.x + this.dir * 62, -112, p.screen ? 2.4 : 1.2, this.dir);
        if (p.screen) {
          game.addCrack(this.x - this.dir * 230, -150, 1.8, -this.dir);
          game.addCrack(this.x + this.dir * 280, -80, 1.8, this.dir);
          game.flashScreen && game.flashScreen('#e8f6ff', 10);
        }
        game.spawnBurst(key, p.row, this.x + this.dir * 70, -110, this.dir, p.screen ? 2.4 : 1.4);
        game.shake(p.screen ? 18 : 10);
        for (const f of foes) {
          const dx = (f.x - this.x) * this.dir;
          const inRange = p.both ? (Math.abs(f.x - this.x) < range && f.onGround) : ((dx > -20 && dx < range + 30) || seek);
          if (!inRange) continue;
          const side = f.x >= this.x ? 1 : -1;
          const first = Math.round(p.dmg * 0.4);
          if (f.takeHit(first, { attacker: this, kx: 0, dirSign: side, stun: (p.lock || 26) + 12, ability: true, power: p, element: el, height: p.screen ? 'unblockable' : undefined })) {
            f.vx = 0;
            f.addStatus('freeze', p.lock || 26);
            f.quakeHold = { t: p.lock || 26, dmg: p.dmg - first, kx: p.kx || 22, launch: p.launch || -10, side, by: this, p, el };
          }
        }
        break;
      }
      case 'afo2': {
        /* All For One: Ação Final — cresce com cada poder acumulado. */
        const stacks = this.castAfo || 0;
        const dmg = p.dmg + stacks * (p.perAfo || 4);
        if (tgt) {
          this.dir = tgt.x >= this.x ? 1 : -1;
          for (let k = 0; k < 3; k++) game.spawnBurst(key, p.row, tgt.x + (k - 1) * 46, -120 - k * 30, this.dir, 1.6 + k * 0.5);
          game.spawnBurst('chaos', 3, tgt.x, -110, this.dir, 3.2);
          game.addCrack(tgt.x, -130, 2.2, this.dir);
          tgt.takeHit(dmg, { attacker: this, height: 'unblockable', kx: 20, dirSign: this.dir, launch: -13, stun: 52, ability: true, power: p, element: el, heavy: true });
          tgt.ultimate = Math.max(0, tgt.ultimate - 50);
          tgt.charge[0] = Math.max(0, tgt.charge[0] - 50);
          tgt.charge[1] = Math.max(0, tgt.charge[1] - 50);
          this.heal(6 + stacks * 3);
        }
        this.flashText(`ALL FOR ONE x${stacks}`, '#ff3b6b');
        game.shake(22);
        this.afo = 0;
        break;
      }
      case 'shadowport': {
        const above = Math.random() < 0.45;
        this.shadowPort = { phase: 'sink', t: 0, p, above, sinkX: this.x, follow: null };
        this.addStatus('invuln', 14);
        this.vx = 0;
        game.spawnImgFx('portal', 'projectile', this.x, -6, { scale: 2.2, life: 20 });
        game.audio.play('magic');
        break;
      }
      case 'rush': {
        if (tgt && (p.teleport || seek)) {
          game.spawnBurst('arcane', 3, this.x, this.y - 90, 1, 2);
          this.x = Math.max(50, Math.min(game.W - 50, tgt.x - (tgt.x >= this.x ? 1 : -1) * 70));
          this.dir = tgt.x >= this.x ? 1 : -1;
        }
        this.rush = { p, hits: p.hits || 5, t: 0, fid, key };
        this.state = 'rush';
        this.stateTime = 0;
        break;
      }
      case 'rain': {
        const n = p.count || 6;
        for (let k = 0; k < n; k++) {
          game.strikes.push(new Strike(this, {
            x: tx + (k - (n - 1) / 2) * 46 + (Math.random() - 0.5) * 20, delay: 18 + k * 7, w: 80, h: 400, dmg: p.dmg / n, stun: 14, launch: k === n - 1 ? -8 : -2,
            poison: p.poison, element: el, power: p, fromSky: true, follow: k === 0 ? tgt : null,
            sheet: { key, row: p.row, frames: 4 }, scale: 1.2, sound: 'explosion', shake: 4, warnColor: (ELEMENT_FX[el] || {}).color,
          }));
        }
        break;
      }
      case 'pull': {
        const range = p.range || 380;
        game.beams.push({ owner: this, fid, row: p.row, x: this.x + this.dir * 40, dir: this.dir, len: range, age: 0, life: 18, y: -100 });
        if (tgt) {
          const dx = (tgt.x - this.x) * this.dir;
          if ((dx > 0 && dx < range) || seek) {
            if (tgt.takeHit(p.dmg, { attacker: this, kx: 0, dirSign: -this.dir, stun: p.stun || 40, ability: true, power: p, element: el })) {
              tgt.x = this.x + this.dir * 78;
              tgt.vx = 0;
            }
          }
        }
        break;
      }
      case 'steal': {
        if (!tgt) break;
        game.strikes.push(new Strike(this, {
          x: tgt.x, delay: 10, w: 220, h: 400, dmg: p.dmg || 8, stun: 30, launch: 0, unblockable: true, follow: tgt,
          sheet: { key, row: p.row, frames: 4 }, scale: 1.8, power: p, sound: 'steal', shake: 8,
          onHit: (f) => this.stealFrom(f, p.time || 600),
        }));
        break;
      }
      case 'wall': {
        game.walls = game.walls.filter((w) => w.owner !== this);
        game.walls.push(new Wall(this, { x: this.x + this.dir * 96, time: p.time || 360, row: p.row, fid }));
        if (tgt && Math.abs(tgt.x - (this.x + this.dir * 96)) < 70) tgt.takeHit(p.dmg || 10, { attacker: this, kx: 8, dirSign: this.dir, launch: -7, ability: true, power: p });
        game.shake(6);
        break;
      }
      case 'zone': {
        game.zones.push(new Zone(this, { fid, row: p.row, x: tx, w: 200, time: p.time || 300, dmg: p.dmg || 0.12, slow: p.slow || 30 }));
        break;
      }
      case 'barrage': {
        const n = (p.count || 8) + (this.def.id === 'iales' ? this.afo : 0);
        const rows = this.def.id === 'iales' ? [0, 1, 3, 0, 3] : [p.row];
        const extraSheets = this.def.id === 'iales' ? [['fx2:fire', 0], ['fx2:water', 0], ['fx2:lightning', 0], ['fx2:chaos', 0]] : [];
        for (let k = 0; k < n; k++) {
          this.queue.push({
            at: 4 + k * 4,
            fn: () => {
              const useExtra = extraSheets.length && k % 2 === 1;
              const pr = new Projectile(this, Object.assign({}, p, { row: useExtra ? 0 : rows[k % rows.length], kind: 'shot', speed: 10, multiHit: 1, big: false }), {
                fid, seek: !!(p.seek || this.autoAim()), homing: p.homing, dmg: p.dmg, angle: -0.9 + Math.random() * 1.8, scale: useExtra ? 1.6 : 0.85,
              });
              if (useExtra) { pr.key = extraSheets[k % extraSheets.length][0]; }
              pr.y = -150 - Math.random() * 120;
              pr.x = this.x - this.dir * (30 + Math.random() * 70);
              game.projectiles.push(pr);
            },
          });
        }
        if (p.finisher) {
          const stacks = this.afo;
          this.queue.push({
            at: 8 + n * 4,
            fn: () => {
              const t2 = this.enemy();
              if (!t2) return;
              game.strikes.push(new Strike(this, { x: t2.x, delay: 12, w: 240, h: 400, dmg: p.finisher + stacks * 2.2, stun: 30, launch: -11, follow: t2, sheet: { key, row: p.row, frames: 4 }, scale: 2.8, power: p, sound: 'explosion', shake: 14 }));
              this.afo = 0;
            },
          });
        }
        break;
      }
      default: break;
    }
  }
  stealFrom(f, time) {
    const game = this.game;
    if (!f.kit) return;
    const powers = f.ownKit().map((p) => Object.assign({}, p, { _fid: f.def.id }));
    this.stolen = { powers, from: f.def.id, fromName: f.def.name, until: this.now + time, total: time };
    this.addStatus('stolen', time);
    f.addStatus('locked', time);
    f.cast = null;
    this.charge[0] = Math.min(100, this.charge[0] + 50);
    this.charge[1] = Math.min(100, this.charge[1] + 50);
    this.cd = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    game.audio.voice('stolen');
    game.announce('PODERES ROUBADOS!', '#c77dff', this.def.name + ' copiou o kit de ' + f.def.name);
    game.events.push({ t: 'steal', who: this.slot, from: f.slot });
  }

  /* ---------- entrada ---------- */
  /** Buffer de 12 quadros: apertos durante hitstop/recuperação saem no 1º quadro livre. */
  press(input) {
    ['punch', 'kick'].concat(Array.from({ length: 10 }, (_, i) => 'a' + i)).forEach((k) => { if (input[k]) this.buf[k] = 12; });
    this.held = input;
  }
  tryAbilities(except = -1) {
    for (let i = 9; i >= 0; i--) {
      if (i === except) continue;
      if (this.buf['a' + i] > 0) {
        if (this.tryCast(i)) { this.buf['a' + i] = 0; return true; }
      }
    }
    return false;
  }
  startAttack(kind) {
    const tgt0 = this.enemy();
    if (tgt0 && this.onGround) this.dir = tgt0.x >= this.x ? 1 : -1;
    this.state = 'attack';
    this.stateTime = 0;
    this.attack = this.attackSpec(kind);
    this.hasHit = false;
    this.blocking = false;
    this.crouching = kind === 'cpunch' || kind === 'ckick';
    // auto aim do IALES: avança até o alvo
    const t = this.enemy();
    if (this.autoAim() && t && this.onGround) {
      const dist = Math.abs(t.x - this.x);
      this.dir = t.x >= this.x ? 1 : -1;
      if (dist > 90 && dist < 320) this.vx = this.dir * Math.min(12, (dist - 70) / 4);
    }
    if (kind.includes('kick')) this.game.audio.kick();
    else this.game.audio.punch();
  }
  checkMelee(mv) {
    if (this.hasHit) return;
    for (const t of this.game.opponentsOf(this)) {
      if (!t.alive) continue;
      if (!boxesOverlap(this.hitbox(mv), t.hurtbox())) continue;
      this.hasHit = true;
      t.takeHit(mv.dmg, {
        attacker: this, kx: mv.kx, dirSign: this.dir, height: mv.height, launch: mv.launch, stun: mv.hitstun,
        blockstun: mv.blockstun, hitstop: mv.dmg >= 10 ? 7 : 5, sweep: mv.sweep, heavy: mv.heavy,
      });
      this.game.spawnBurst('impact', mv.dmg >= 9 ? 1 : 0, (this.x + t.x) / 2 + this.dir * 10, this.y - (mv.height === 'low' ? 40 : 110), this.dir, 1.6);
    }
  }
  tryThrow(input) {
    const t = this.enemy();
    if (!t || !t.alive || !this.onGround || !t.onGround) return false;
    const fwd = this.dir === 1 ? input.right : input.left;
    const back = this.dir === 1 ? input.left : input.right;
    if (!(fwd || back)) return false;
    if (Math.abs(t.x - this.x) > 84) return false;
    if (['hit', 'blockstun', 'down', 'ko', 'cast', 'rush', 'thrown'].includes(t.state) || t.has('invuln')) return false;
    this.state = 'throw';
    this.stateTime = 0;
    this.throwBack = !!back;
    t.state = 'thrown';
    t.stateTime = 0;
    t.vx = 0;
    this.game.audio.play('heavy');
    this.game.floatText(this.x, this.y - 220, 'AGARRÃO!', '#ffd27d');
    return true;
  }

  /* ---------- física ---------- */
  physics() {
    const game = this.game;
    const grav = (GRAVITY_BASE + this.weight() * 0.12) * (game.gravityMul || 1);
    const wasAir = this.y < 0;
    if (this.landT > 0) this.landT--;
    if (this.y < 0 || this.vy !== 0) {
      this.lastVy = this.vy;
      this.vy += grav;
      this.y += this.vy;
      if (this.y >= 0) {
        this.y = 0;
        this.vy = 0;
        if (wasAir) {
          this.airAction = false;
          if (this.state === 'jump') { this.state = 'idle'; this.stateTime = 0; }
          if (this.launched && (this.state === 'hit' || this.state === 'thrown')) {
            this.state = 'down';
            this.stateTime = 0;
            this.hitstun = 0;
            game.shake(4);
            game.spawnBurst('impact', 2, this.x, -16, 1, 1.4);
          }
          this.landT = 9;
          this.landHard = Math.min(1, Math.abs(this.lastVy || 8) / 16);
          this.launched = false;
          game.audio.land();
          game.dust(this.x);
        }
      }
    }
    const w = game.weather;
    if (w && w.wind && this.alive && !this.benched) this.vx += w.wind * (this.y < 0 ? 0.055 : 0.03);
    if (game.pushX && this.onGround && this.alive) this.x += game.pushX;
    this.x += this.vx;
    const decay = game.groundDecay || 0.6;
    if (this.state === 'dash' || this.state === 'backdash') this.vx *= this.def.id === 'merc' ? 0.97 : Math.max(0.9, decay);
    else if (this.state === 'cast' || this.state === 'rush') this.vx *= 0.9;
    else if (this.state === 'walk') this.vx *= 1;
    else this.vx *= this.y < 0 ? 0.99 : decay;
  }

  /* ---------- loop ---------- */
  update(input, ctxFlags = {}) {
    const game = this.game;
    this.now = game.time;
    this.frame++;
    this.stateTime++;
    this.lastInput = input;
    if (this.flash && this.now > this.flashUntil) this.flash = null;
    if (this.flashWhite) this.flashWhite--;
    for (let i = 0; i < this.cd.length; i++) if (this.cd[i] > 0) this.cd[i]--;
    Object.keys(this.buf).forEach((k) => { if (this.buf[k]) this.buf[k]--; });
    if (this.quakeHold) {
      const q = this.quakeHold;
      this.vx = 0;
      if (--q.t <= 0 || this.state === 'ko') {
        this.quakeHold = null;
        if (this.state !== 'ko') {
          game.addCrack(this.x, this.y - 100, 1.4, q.side);
          this.takeHit(q.dmg, { attacker: q.by, height: 'unblockable', kx: q.kx, dirSign: q.side, launch: q.launch, stun: 34, ability: true, power: q.p, element: q.el, heavy: true });
          game.shake(12);
        }
      }
    }
    if (this.stolen && this.now >= this.stolen.until) {
      this.stolen = null;
      this.flashText('KIT DEVOLVIDO');
    }
    if (this.stunGauge > 0) this.stunGauge = Math.max(0, this.stunGauge - 0.18);
    // efeitos contínuos
    if (this.alive && !this.benched) {
      if (this.has('burn') && this.frame % 20 === 0) this.chip(0.9);
      if (this.has('poison') && this.frame % 24 === 0) this.chip(0.8);
      if (this.has('bleed') && this.frame % 16 === 0) { this.chip(0.7); if (this.frame % 32 === 0) this.game.spark(this.x, this.y - 110, '#ff2d55'); }
      if (this.has('shock') && this.frame % 9 === 0) this.game.spark(this.x + (Math.random() - 0.5) * 50, this.y - 60 - Math.random() * 100, '#7df9ff');
      if (this.has('chill') && this.frame % 12 === 0) this.game.spark(this.x + (Math.random() - 0.5) * 50, this.y - 40 - Math.random() * 120, '#d8f6ff');
      if (this.afterimage > 0) this.afterimage--;
      if (this.phaseDash > 0) this.phaseDash--;
      if (this.overclockHot && this.overclockUntil && this.now >= this.overclockUntil && !this.has('aura')) {
        this.overclockHot = false;
        if (!this.overclockCut) {
          this.addStatus('burn', 160);
          this.addStatus('slow', 140);
          this.chip(8);
          this.flashText('SUPERAQUECEU!', '#ff6a1c');
          this.game.spawnImgFx('lata', 'aura', this.x, this.y - 80, { scale: 2, life: 16 });
        }
      }
      if (this.has('regen') && this.aura && this.aura.regen) this.hp = Math.min(this.maxHp, this.hp + this.aura.regen);
      if (this.pfx.regen && this.frame % 2 === 0) this.hp = Math.min(this.maxHp, this.hp + this.pfx.regen * 2);
    }
    if (this.benched) {
      this.hp = Math.min(this.redHp, this.hp + 0.05);
      return;
    }
    if (this.has('shock')) input = this.shockInput(input);
    this.press(input);
    this.queue = this.queue.filter((q) => {
      q.at--;
      if (q.at <= 0) { if (this.alive) q.fn(); return false; }
      return true;
    });

    const opp = this.enemy();
    if (opp && ['idle', 'walk', 'block', 'crouchblock'].includes(this.state) && this.onGround) this.dir = opp.x >= this.x ? 1 : -1;

    if (this.state === 'win' || this.state === 'tagout') { this.vx *= 0.8; this.physics(); return this.endUpdate(input); }
    if (this.state === 'ko' || !this.alive) { this.state = 'ko'; this.physics(); return this.endUpdate(input); }

    if (this.has('freeze') || this.has('trap')) {
      this.state = 'hit';
      this.vx *= 0.5;
      this.physics();
      return this.endUpdate(input);
    }
    if (this.state === 'down') {
      this.physics();
      if (this.stateTime > 34) { this.state = 'idle'; this.stateTime = 0; this.addStatus('invuln', 10); }
      return this.endUpdate(input);
    }
    if (this.state === 'thrown') {
      const t = opp;
      if (t && t.state === 'throw') {
        this.x = t.x + t.dir * 50;
        this.y = Math.min(0, -Math.sin(Math.min(1, t.stateTime / 18) * Math.PI) * 90);
      }
      if (this.stateTime > 20) {
        this.state = 'hit';
        this.y = Math.min(this.y, -1);
        this.vy = -7;
        this.launched = true;
      }
      return this.endUpdate(input);
    }
    if (this.state === 'throw') {
      if (this.stateTime === 18 && opp && opp.state === 'thrown') {
        const side = this.throwBack ? -this.dir : this.dir;
        opp.state = 'hit';
        opp.hitstun = 30;
        opp.takeHit(12, { attacker: this, height: 'unblockable', kx: 9, dirSign: side, launch: -8, stun: 30, noScale: true, heavy: true });
        if (this.throwBack) this.dir = -this.dir;
      }
      if (this.stateTime > 28) { this.state = 'idle'; this.stateTime = 0; }
      this.physics();
      return this.endUpdate(input);
    }
    if (this.hitstun > 0) {
      this.hitstun--;
      this.state = 'hit';
      this.physics();
      if (this.hitstun <= 0 && this.onGround) { this.state = 'idle'; this.stateTime = 0; }
      else if (this.hitstun <= 0) { this.state = this.launched ? 'hit' : 'jump'; }
      return this.endUpdate(input);
    }
    if (this.blockstun > 0) {
      this.blockstun--;
      this.state = 'blockstun';
      this.physics();
      if (this.blockstun <= 0) { this.state = 'idle'; this.stateTime = 0; }
      return this.endUpdate(input);
    }
    if (this.shadowPort && this.alive) {
      this.stepShadowPort();
      this.physics();
      return this.endUpdate(input);
    }
    if (this.state === 'attack') this.stepAttack(input);
    else if (this.state === 'cast') this.stepCast();
    else if (this.state === 'rush') this.stepRush();
    else if (this.state === 'dash' || this.state === 'backdash') {
      const merc = this.def.id === 'merc';
      const travel = merc ? 14 : (this.state === 'dash' ? 10 : 9);
      const total = merc ? 24 : travel;
      if (merc && this.stateTime === travel) { this.vx = 0; this.status.invuln = 0; }
      if (merc && this.stateTime < travel && this.stateTime % 2 === 0) {
        game.spawnImgFx('rastro', 'aura', this.x - this.dir * 18, this.y - 90, { scale: 1.3, life: 10, dir: this.dir, alpha: 0.7 });
      }
      if (this.stateTime > total) { this.state = 'idle'; this.stateTime = 0; this.perfectDone = false; }
    } else this.tryActions(input);
    this.physics();
    return this.endUpdate(input);
  }
  endUpdate(input) {
    this.prev = { left: !!input.left, right: !!input.right, down: !!input.down, up: !!input.up };
    if (this.state === 'hit' && this.hitstun <= 0 && this.onGround && !this.has('trap') && !this.has('freeze')) { this.state = 'idle'; this.stateTime = 0; }
  }
  stepAttack(input) {
    const mv = this.attack;
    if (!mv) { this.state = 'idle'; return; }
    const total = mv.startup + mv.active + mv.recovery;
    if (this.stateTime >= mv.startup && this.stateTime < mv.startup + mv.active) this.checkMelee(mv);
    // janela de cancelamento: do 1º quadro ativo até o fim da recuperação, se conectou (hit ou defesa)
    if (this.hasHit && this.stateTime >= mv.startup) {
      if (this.tryAbilities()) { this.chain = 0; return; }
      // cancelamento em pulo (air combo) a partir de chute em pé ou soco agachado
      if (input.up && this.onGround && (mv.kind === 'kick' || mv.kind === 'cpunch') && this.chain < 4) {
        this.attack = null;
        this.state = 'idle';
        this.chain++;
        this.doJump(input, 1.05);
        this.game.floatText(this.x, this.y - 230, 'JUMP CANCEL', '#9adcff');
        return;
      }
      const next = this.nextChain(mv.kind, input);
      if (next) { this.chain++; this.startAttack(next); return; }
    }
    // kara-cancel: nos 2 primeiros quadros um golpe pode virar habilidade
    if (!this.hasHit && this.stateTime <= 2 && this.tryAbilities()) return;
    if (this.stateTime >= total) {
      this.state = this.onGround ? 'idle' : 'jump';
      this.stateTime = 0;
      this.attack = null;
      this.chain = 0;
    }
  }
  /** Cadeias (target combos): leve → leve → médio → pesado, também no ar. */
  nextChain(kind, input) {
    const P = this.buf.punch > 0;
    const K = this.buf.kick > 0;
    if (!P && !K) return null;
    const cap = 5 + (this.sig.chainBonus || 0);
    if (this.chain >= cap) return null;
    let n = null;
    if (!this.onGround) {
      if (this.airChain >= 3) return null;
      if (kind === 'jpunch' && K) n = 'jkick';
      else if (kind === 'jpunch' && P) n = 'jpunch';
      else if (kind === 'jkick' && P) n = 'jpunch';
      if (n) this.airChain++;
    } else {
      const order = { punch: 0, cpunch: 0, kick: 1, ckick: 2 };
      const low = !!input.down;
      const cand = P ? (low ? 'cpunch' : 'punch') : (low ? 'ckick' : 'kick');
      if (order[cand] > order[kind]) n = cand;
      else if (cand === kind && kind.includes('punch') && this.chain < 2) n = cand;
      else if (kind === 'kick' && P && this.chain < 3) n = low ? 'cpunch' : 'punch';
      else if (kind === 'ckick' && K && !low && this.chain < 4) n = 'kick';
    }
    if (n) { if (n.includes('punch')) this.buf.punch = 0; else this.buf.kick = 0; }
    return n;
  }
  doJump(input, mul = 1) {
    const spd = WALK_SPEED * this.speedMult();
    const jump = (12.4 + (1.1 - this.weight()) * 3) * (this.game.jumpMul || 1) * mul;
    this.vy = -jump;
    this.y = -0.1;
    let dx = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    this.vx = dx * spd * 1.15;
    this.state = 'jump';
    this.stateTime = 0;
    this.blocking = false;
    this.crouching = false;
    this.airAction = false;
    this.airChain = 0;
    this.game.audio.jump();
  }
  stepShadowPort() {
    const sp = this.shadowPort;
    const game = this.game;
    const tgt = this.enemy();
    sp.t++;
    if (sp.phase === 'sink') {
      this.vx = 0;
      this.state = 'crouch';
      game.spawnImgFx('portal', 'aura', sp.sinkX, -4, { scale: 1.8, life: 8, alpha: 0.8 });
      if (sp.t >= 12) {
        sp.phase = 'hidden';
        sp.t = 0;
        this.hidden = true;
        this.addStatus('invuln', 22);
        if (tgt) {
          if (sp.above) {
            this.x = tgt.x;
            this.y = -220;
            this.vy = 0;
          } else {
            const side = -tgt.dir;
            this.x = Math.max(70, Math.min(game.W - 70, tgt.x + side * 84));
            this.y = 0;
            this.dir = tgt.x >= this.x ? 1 : -1;
          }
        }
        game.audio.play('dash');
      }
    } else if (sp.phase === 'hidden') {
      this.vx = 0;
      if (sp.t >= 8) {
        sp.phase = 'emerge';
        sp.t = 0;
        this.hidden = false;
        game.spawnImgFx('portal', 'impact', this.x, sp.above ? this.y : -4, { scale: 2.4, life: 16 });
        if (sp.above) this.vy = 10;
        this.addStatus('invuln', 8);
      }
    } else if (sp.phase === 'emerge') {
      if (!sp.above && (this.buf.punch || this.buf.kick) && sp.t < 16) {
        const kick = this.buf.kick > this.buf.punch;
        this.buf.punch = 0;
        this.buf.kick = 0;
        this.shadowPort = null;
        this.hidden = false;
        this.status.invuln = 0;
        this.cast = null;
        this.startAttack(kick ? 'kick' : 'punch');
        return;
      }
      if (sp.above && this.onGround && sp.t > 3 && !sp.slammed) {
        sp.slammed = true;
        if (tgt && Math.abs(tgt.x - this.x) < 96) {
          tgt.takeHit(sp.p.burstDmg || 14, { attacker: this, kx: 8, dirSign: this.dir, launch: -9, stun: 22, ability: true, power: sp.p, heavy: true });
        }
        game.spawnImgFx('portal', 'impact', this.x, -6, { scale: 2.6, life: 12 });
        game.shake(8);
      }
      if (sp.t > (sp.above ? 28 : 16)) {
        sp.phase = 'recover';
        sp.t = 0;
        this.status.invuln = 0;
        this.hidden = false;
      }
    } else if (sp.t > 10) {
      this.shadowPort = null;
      this.hidden = false;
      this.cast = null;
      this.state = 'idle';
      this.stateTime = 0;
    }
  }
  stepCast() {
    const c = this.cast;
    if (!c) { this.state = 'idle'; return; }
    if (this.shadowPort) { this.stepShadowPort(); return; }
    c.t++;
    const fireAt = c.p.slot === 'ultimate' ? 4 : 6;
    if (!c.fired && c.t >= fireAt) { c.fired = true; this.fire(c.p); }
    // cancelamento de habilidade em habilidade: depois que a habilidade conectou
    if (c.fired && (c.hit || this.hasHit) && !c.chained && c.t > fireAt + 2 && c.p.slot !== 'ultimate') {
      const before = this.cast;
      if (this.tryAbilities(c.i)) { if (this.cast && this.cast !== before) this.cast.chained = true; this.game.floatText(this.x, this.y - 240, 'CANCEL!', '#7dff5e'); return; }
    }
    if (this.dashHit) {
      this.dashHit.t--;
      const p = this.dashHit.p;
      if (!this.hasHit) {
        for (const t of this.game.opponentsOf(this)) {
          const hb = { x: this.x - 50, y: this.y - 150, w: 100, h: 130 };
          if (t.alive && boxesOverlap(hb, t.hurtbox())) {
            this.hasHit = true;
            t.takeHit(p.dmg, { attacker: this, kx: 7, dirSign: this.dir, stun: 20, launch: -4, ability: true, power: p, element: this.elementOf(p) });
            this.game.spawnAbilityImpact(this, p, t.x, t.y - 100);
          }
        }
      }
      if (this.dashHit.t <= 0) this.dashHit = null;
    }
    const len = this.dashHit ? 18 : (c.p.slot === 'ultimate' ? 28 : 18);
    if (c.t > len && !this.queue.length) {
      this.cast = null;
      this.state = this.onGround ? 'idle' : 'jump';
      this.stateTime = 0;
    } else if (c.t > 70) {
      this.cast = null;
      this.state = 'idle';
    }
  }
  stepRush() {
    const r = this.rush;
    if (!r) { this.state = 'idle'; return; }
    r.t++;
    const t = this.enemy();
    if (t && Math.abs(t.x - this.x) > 80) this.vx = this.dir * 7;
    if (r.t % 7 === 0 && r.hits > 0 && t) {
      r.hits--;
      const last = r.hits === 0;
      if (Math.abs(t.x - this.x) < 140 && Math.abs(t.y - this.y) < 160) {
        t.takeHit(r.p.dmg / (r.p.hits || 5), { attacker: this, kx: last ? 12 : 1.5, dirSign: this.dir, stun: 22, launch: last ? -10 : 0, noScale: true, ability: true, power: r.p, element: this.elementOf(r.p), heavy: last });
        this.game.beams.push({ owner: this, fid: r.fid, row: r.p.row, x: t.x, dir: this.dir, len: 0, age: 0, life: 14, y: t.y - 110, single: true, scale: last ? 2.4 : 1.4 });
      }
      if (last && r.p.finisherPillars && t) {
        const kitDu = POWERS[r.fid] && POWERS[r.fid].powers[1];
        for (let k = 0; k < r.p.finisherPillars; k++) {
          this.game.strikes.push(new Strike(this, { x: t.x + (k - 1) * 110, delay: 10 + k * 6, w: 110, h: 260, dmg: 6, launch: -7, sheet: { key: 'abil:' + r.fid, row: kitDu ? kitDu.row : 1, frames: 4 }, scale: 1.6, sound: 'fire', shake: 6 }));
        }
      }
    }
    if (r.hits <= 0 && r.t > (r.p.hits || 5) * 7 + 10) {
      this.rush = null;
      this.state = 'idle';
      this.stateTime = 0;
    }
  }
  tryActions(input) {
    const game = this.game;
    let spd = WALK_SPEED * this.speedMult();
    const rightEdge = input.right && !this.prev.right;
    const leftEdge = input.left && !this.prev.left;
    if (this.tryAbilities()) return;
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
      this.vx += (drift * spd * 0.9 - this.vx) * 0.12;
      this.state = 'jump';
      return;
    }
    if (this.buf.punch && this.buf.kick && this.tryThrow(input)) { this.buf.punch = 0; this.buf.kick = 0; return; }
    if (this.buf.punch && !input.down && this.tryThrow(input) ) { this.buf.punch = 0; return; }
    if (this.buf.punch) { this.buf.punch = 0; this.startAttack(input.down ? 'cpunch' : 'punch'); return; }
    if (this.buf.kick) { this.buf.kick = 0; this.startAttack(input.down ? 'ckick' : 'kick'); return; }
    if (rightEdge && this.now - this.lastRight < 15) { this.lastRight = -999; this.startDash(1); return; }
    if (leftEdge && this.now - this.lastLeft < 15) { this.lastLeft = -999; this.startDash(-1); return; }
    if (rightEdge) this.lastRight = this.now;
    if (leftEdge) this.lastLeft = this.now;
    if (input.up) { this.doJump(input); return; }
    const back = (this.dir === 1 && input.left) || (this.dir === -1 && input.right);
    if (input.down) {
      this.crouching = true;
      this.blocking = back || this.autoBlock();
      this.state = 'crouchblock';
      this.vx *= 0.5;
      return;
    }
    if (back) {
      this.crouching = false;
      this.blocking = true;
      this.state = 'block';
      this.vx = -this.dir * spd * 0.55;
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
      this.walkPhase += spd * 0.13;
    } else {
      this.state = 'idle';
    }
  }
  autoBlock() { return false; }
  /** Eletrizado: os controles "mexem sozinhos" (direções invertidas em pulsos e apertos fantasmas). */
  shockInput(input) {
    const i = Object.assign({}, input);
    const ph = Math.floor(this.now / 7) % 4;
    if (ph === 1) { const l = i.left; i.left = i.right; i.right = l; }
    if (ph === 3 && !i.left && !i.right) { if ((this.now >> 3) & 1) i.left = true; else i.right = true; }
    if (this.now % 29 === 0) i.punch = true;
    if (this.now % 47 === 0) i.up = true;
    if (this.now % 37 === 0) i.down = true;
    return i;
  }
  startDash(sign) {
    this.state = sign === this.dir ? 'dash' : 'backdash';
    this.stateTime = 0;
    this.blocking = false;
    this.crouching = false;
    const fast = this.speedMult() > 1.15;
    const merc = this.def.id === 'merc';
    if (merc) {
      this.vx = sign * (this.state === 'dash' ? 14.5 : 12);
      this.addStatus('invuln', this.state === 'dash' ? 9 : 8);
      this.perfectDone = false;
    } else {
      this.vx = sign * (this.state === 'dash' ? (fast ? 11 : 8.6) : (fast ? 8 : 6.6));
      if (this.state === 'backdash') this.addStatus('invuln', 6);
    }
    this.game.audio.dash();
    this.game.dust(this.x);
  }

  /* ---------- desenho ---------- */
  animPose() {
    switch (this.state) {
      case 'dash': return 'walk';
      case 'backdash': return 'block';
      case 'crouchblock': return 'crouch';
      case 'blockstun': return this.crouching ? 'crouch' : 'block';
      case 'attack': return this.attack ? this.attack.kind : 'punch';
      case 'cast': return 'special';
      case 'rush': return (Math.floor(this.stateTime / 7) % 2) ? 'kick' : 'punch';
      case 'throw': return this.stateTime < 10 ? 'punch' : 'special';
      case 'thrown': return 'hit';
      case 'down': return 'ko';
      case 'tagout': return 'jump';
      case 'jump': case 'idle': case 'walk': case 'hit': case 'block': case 'ko': case 'win': return this.state;
      default: return 'idle';
    }
  }
  animFrame(pose) {
    const n = SpriteGen.count(pose);
    switch (pose) {
      case 'idle': return Math.floor(this.frame / 8) % n;
      case 'walk': return Math.floor(Math.abs(this.walkPhase)) % n;
      case 'jump': return this.vy < -2 ? 0 : n - 1;
      case 'crouch': return Math.min(n - 1, Math.floor(this.stateTime / 3));
      case 'block': return Math.floor(this.frame / 7) % n;
      case 'hit': return Math.min(n - 1, Math.floor(this.stateTime / 3));
      case 'ko': return this.y < -6 ? 0 : n - 1;
      case 'win': return Math.floor(this.frame / 9) % n;
      case 'special': return Math.min(n - 1, Math.floor(this.stateTime / 5));
      default: {
        const mv = this.attack;
        const total = mv ? mv.startup + mv.active + mv.recovery : 14;
        return Math.min(n - 1, Math.floor((this.stateTime / Math.max(1, total)) * n));
      }
    }
  }
  drawBack(ctx) {
    if (this.benched) return;
    const t = this.frame;
    // IAs atrás do IALES: sempre algumas; durante conjuração, um enxame
    if (this.def.id === 'iales' && this.alive) {
      const casting = this.state === 'cast' || this.state === 'rush';
      const n = casting ? 9 : 3 + Math.min(5, Math.floor(this.afo / 2));
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI + Math.PI / 2 + Math.sin(t * 0.03 + k) * 0.15;
        const rad = casting ? 120 : 92;
        const x = this.x - this.dir * (30 + Math.cos(a - Math.PI / 2) * 0) + Math.cos(a) * rad * -this.dir * 0.8;
        const y = this.y - 120 - Math.sin(a) * rad * 0.8 + Math.sin(t * 0.08 + k) * 4;
        const idx = (k * 5 + Math.floor(this.afo)) % 16;
        ctx.save();
        ctx.globalAlpha = casting ? 0.95 : 0.55;
        Art.fx2(ctx, 'ai-symbols', Math.floor(idx / 4), idx % 4, x, y, { scale: casting ? 0.9 : 0.62 });
        ctx.restore();
      }
    }
    // aura
    if (this.has('aura') && this.aura) {
      const fid = this.auraFid || this.def.id;
      ctx.save();
      ctx.globalAlpha = 0.85;
      Art.ability(ctx, fid, this.aura.row, Math.floor(t / 5), this.x, this.y - 92, { scale: 1.75, add: true });
      ctx.restore();
    }
  }
  /* Camada de movimento procedural: respiração, inclinação ao andar, estica no pulo,
     achata no pouso, avanço no golpe e recuo ao apanhar. Deixa animações de poucos
     quadros bem mais fluidas. Desligada em "movimento reduzido". */
  motionXf(pose) {
    if (this.game.reduced) return null;
    const t = this.frame;
    let sx = 1, sy = 1, rot = 0, dx = 0, dy = 0;
    const ease = (k) => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
    switch (pose) {
      case 'idle': case 'win': {
        const b = Math.sin(t * 0.075);
        sy = 1 + b * 0.014; sx = 1 - b * 0.008;
        break;
      }
      case 'walk': {
        const ph = this.walkPhase * Math.PI;
        dy = -Math.abs(Math.sin(ph)) * 3;
        rot = 0.035 * Math.sign(this.vx * this.dir || 1);
        break;
      }
      case 'jump': {
        const v = Math.max(-1, Math.min(1, this.vy / 14));
        sy = 1 + Math.abs(v) * 0.07; sx = 1 - Math.abs(v) * 0.05;
        rot = -v * 0.05;
        break;
      }
      case 'crouch': sy = 0.985; break;
      case 'hit': {
        const k = Math.max(0, 1 - this.stateTime / 14);
        rot = -0.10 * k; dx = -6 * k;
        dx += (t % 2 ? 1.5 : -1.5) * k;
        break;
      }
      case 'block': dx = -2 * Math.max(0, 1 - this.stateTime / 8); break;
      case 'special': {
        const k = ease(this.stateTime / 10);
        sx = 1 + 0.04 * k; sy = 1 - 0.02 * k; dx = 6 * k;
        break;
      }
      default: {
        // golpes: antecipação curta e avanço no quadro ativo
        const mv = this.attack;
        if (mv) {
          const st = this.stateTime;
          if (st < mv.startup) { const k = st / Math.max(1, mv.startup); dx = -3 * k; rot = -0.03 * k; }
          else if (st < mv.startup + mv.active + 2) { dx = 9; rot = 0.045; sx = 1.03; }
          else { const k = 1 - (st - mv.startup - mv.active) / Math.max(1, mv.recovery); dx = 9 * Math.max(0, k); rot = 0.045 * Math.max(0, k); }
        }
      }
    }
    if (this.landT > 0 && this.onGround) {
      const k = (this.landT / 9) * (0.5 + 0.5 * (this.landHard || 0.5));
      sy *= 1 - 0.10 * k; sx *= 1 + 0.08 * k;
    }
    return { sx, sy, rot, dx, dy };
  }
  draw(ctx) {
    if (this.benched || this.hidden) return;
    const pose = this.animPose();
    const frame = this.animFrame(pose);
    const game = this.game;
    const xf = this.motionXf(pose);
    // sombra
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    const sh = 34 * (1 - Math.min(Math.abs(this.y) / 260, 0.6));
    ctx.beginPath();
    ctx.ellipse(this.x, 2, Math.max(10, sh), 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // mascote
    if (this.pet && this.pet.row >= 0 && this.alive) {
      const px = this.x - this.dir * 78;
      const py = this.y - 168 + Math.sin(this.frame * 0.07) * 6;
      Art.cell(ctx, 'pets', this.pet.row, Math.floor(this.frame / 10), px, py, { scale: 0.62, dir: this.dir });
    }
    const ghost = this.state === 'dash' || (this.state === 'cast' && this.dashHit) || this.state === 'rush' || this.afterimage > 0 || this.has('overclock');
    if (ghost && !game.reduced) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      SpriteGen.blit(ctx, this.spriteKey(), pose, frame, this.dir, this.x - this.dir * 22, this.y, false, null, xf);
      ctx.globalAlpha = 0.12;
      SpriteGen.blit(ctx, this.spriteKey(), pose, frame, this.dir, this.x - this.dir * 44, this.y, false, null, xf);
      ctx.restore();
      if (this.dashHit) Art.ability(ctx, this.kitOwnerId(this.dashHit.p), this.dashHit.p.row, Math.floor(this.frame / 3), this.x, this.y - 100, { scale: 1.2, dir: this.dir });
    }
    ctx.save();
    if (this.has('cloak')) ctx.globalAlpha = 0.28;
    else if (this.has('invuln') && this.frame % 6 < 3) ctx.globalAlpha = 0.45;
    if (this.has('rage') || this.has('armor')) {
      ctx.shadowColor = this.has('rage') ? '#ff4b1c' : '#ffd27d';
      ctx.shadowBlur = 18;
    }
    if (this.has('chill')) ctx.filter = 'saturate(0.6) hue-rotate(160deg) brightness(1.15)';
    else if (this.has('shock') && this.frame % 6 < 2) ctx.filter = 'brightness(1.8) saturate(0.4)';
    else if (this.has('overclock')) { ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 16; }
    SpriteGen.blit(ctx, this.spriteKey(), pose, frame, this.dir, this.x, this.y, this.flashWhite > 0 && this.frame % 2 === 0, null, xf);
    ctx.filter = 'none';
    ctx.restore();
    if (this.has('shock') && this.frame % 5 === 0) Art.fx2(ctx, 'lightning', 2, Math.floor(this.frame / 3), this.x, this.y - 100, { scale: 1.1, alpha: 0.7 });
    if (this.has('blind')) Art.fx2(ctx, 'chaos', 1, Math.floor(this.frame / 6), this.x, this.y - 170, { scale: 0.7, alpha: 0.6 });
    // status visuais
    if (this.has('trap')) Art.ability(ctx, 'felipinho', 0, 3, this.x, this.y - 96, { scale: 1.9, alpha: 0.75 });
    if (this.has('freeze')) Art.fx2(ctx, 'arcane', 0, Math.floor(this.frame / 6), this.x, this.y - 96, { scale: 3, alpha: 0.75 });
    if (this.has('burn') && this.frame % 3 === 0) game.spark(this.x + (Math.random() - 0.5) * 40, this.y - 40 - Math.random() * 120, '#ff7b1c');
    if (this.has('poison') && this.frame % 4 === 0) game.spark(this.x + (Math.random() - 0.5) * 40, this.y - 40 - Math.random() * 120, '#9dff4a');
    if (this.has('locked') && this.frame % 20 < 10) Art.fx2(ctx, 'chaos', 2, 1, this.x, this.y - 200, { scale: 0.8, alpha: 0.8 });
    if (this.has('dizzy')) {
      for (let k = 0; k < 3; k++) {
        const a = this.frame * 0.12 + k * 2.1;
        Art.fx2(ctx, 'lightning', 2, Math.floor(this.frame / 4), this.x + Math.cos(a) * 34, this.y - 190 + Math.sin(a) * 8, { scale: 0.35 });
      }
    }
    if (this.has('spot')) {
      ctx.save();
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = '#fff6a8';
      ctx.beginPath();
      ctx.moveTo(this.x - 20, -560);
      ctx.lineTo(this.x + 20, -560);
      ctx.lineTo(this.x + 90, 0);
      ctx.lineTo(this.x - 90, 0);
      ctx.fill();
      ctx.restore();
    }
    if (this.flash) {
      ctx.save();
      ctx.font = 'bold 15px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#000';
      ctx.strokeText(this.flash, this.x, this.y - 196);
      ctx.fillStyle = this.flashColor || this.def.colors.accent;
      ctx.fillText(this.flash, this.x, this.y - 196);
      ctx.restore();
    }
  }
  /* estado serializável (online) */
  snap() {
    return [Math.round(this.x), Math.round(this.y), this.dir, this.state, this.stateTime, Math.round(this.hp * 10) / 10, Math.round(this.charge[0]), Math.round(this.charge[1]), Math.round(this.ultimate), this.frame, this.walkPhase, this.attack ? this.attack.kind : 0, this.status, this.stolen ? { from: this.stolen.from, until: this.stolen.until, total: this.stolen.total } : 0, this.cd, this.afo, this.aura ? this.aura.id : 0, this.flash || 0, this.benched ? 1 : 0, this.flashWhite || 0, this.redHp, this.shield, Math.round(this.stunGauge)];
  }
  applySnap(s) {
    [this.x, this.y, this.dir, this.state, this.stateTime, this.hp, this.charge[0], this.charge[1], this.ultimate, this.frame, this.walkPhase] = s;
    this.attack = s[11] ? { kind: s[11], startup: 3, active: 3, recovery: 8 } : null;
    this.status = s[12] || {};
    if (s[13]) {
      const f = POWERS[s[13].from];
      this.stolen = { powers: f ? f.powers.map((p) => Object.assign({}, p, { _fid: s[13].from })) : [], from: s[13].from, until: s[13].until, total: s[13].total, fromName: (FIGHTERS.find((x) => x.id === s[13].from) || {}).name };
    } else this.stolen = null;
    this.cd = s[14] || this.cd;
    this.afo = s[15] || 0;
    this.aura = s[16] ? this.currentKit().concat(this.ownKit()).find((p) => p.id === s[16]) || null : null;
    this.auraFid = this.aura ? this.kitOwnerId(this.aura) : null;
    this.flash = s[17] || null;
    this.benched = !!s[18];
    this.flashWhite = s[19] || 0;
    this.redHp = s[20];
    this.shield = s[21];
    this.stunGauge = s[22];
  }
}
