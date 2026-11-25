/* ============================================================
   DS FIGHTERS — Lutador.
   Física, guarda alta/baixa, combos com cancelamento, contra-ataque,
   agarrão, tontura, knockdown com invencibilidade ao levantar,
   5 habilidades por tecla (executor genérico), status e buffs,
   roubo de kit do IALES e mascotes.
   ============================================================ */
const GRAVITY_BASE = 0.64;
const WALK_SPEED = 3.25;
// Vida-base é definida no catálogo e recebe esta escala uma única vez aqui.
// Assim overrides já feitos (IALES/1155) não são multiplicados novamente.
const HEALTH_MULTIPLIER = 3.00;
const HP_LIMIT = 500; /* limite de HP do jogo = 500 (pedido do dono) */
/* Anti-spam: todas as habilidades recarregam o DOBRO em qualquer modo
   (o 1.4x ainda deixava spam — pedido do dono). */
const ABILITY_CD_MULT = 2.0;
const QUAKE_HOLD_MAX = 28;
const STATUS_WINDOW_CAPS = Object.freeze({ paralyze: 72, vertigo: 120, nanomachines: 240 });
/* IALES OMEGA, o campeao indiscutivel: as IAs nao sao afetadas por status
   negativos — veneno, gelo, cegueira, trava de poderes, nada cola nele. */
const IALES_IMMUNE = Object.freeze(new Set(['burn', 'poison', 'freeze', 'chill', 'bleed', 'vuln', 'slow', 'trap', 'blind', 'shock', 'vertigo', 'glitch', 'paralyze', 'dizzy', 'meterSlow', 'locked', 'stolen', 'weaken']));
const STATUS_WINDOW_GAPS = Object.freeze({ paralyze: 30, vertigo: 24 });

function boxesOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const STATUS_LABEL = {
  atk: { t: 'ATQ+', c: '#ff4b4b' }, def: { t: 'DEF+', c: '#4ba3ff' }, spd: { t: 'VEL+', c: '#ffd84b' },
  rage: { t: 'FÚRIA', c: '#ff6a1c' }, armor: { t: 'ARMADURA', c: '#ffd27d' }, reflect: { t: 'REFLEXO', c: '#7de0ff' },
  invuln: { t: 'INVULN.', c: '#ffffff' }, astra: { t: 'ASTRA', c: '#a78bff' }, trans: { t: 'TRANSFORMADO', c: '#7dff5e' }, phoenix: { t: 'FÊNIX', c: '#FF7A1A' }, aura: { t: 'AURA', c: '#c77dff' }, spot: { t: 'HOLOFOTE', c: '#fff36b' },
  burn: { t: 'QUEIMANDO', c: '#ff7b1c' }, poison: { t: 'VENENO', c: '#9dff4a' }, slow: { t: 'LENTO', c: '#7db8ff' },
  locked: { t: 'SEM PODERES', c: '#ff3b5c' }, blind: { t: 'CEGO', c: '#b9b9b9' }, shock: { t: 'ELETRIZADO', c: '#7df9ff' }, glitch: { t: 'TRAVAMENTO', c: '#48dfff' },
  meterSlow: { t: 'MEDIDOR LENTO', c: '#39ff6a' }, cloak: { t: 'FANTASMA', c: '#9dffb0' },
  chill: { t: 'CONGELANDO', c: '#a8e6ff' }, bleed: { t: 'SANGRANDO', c: '#ff2d55' }, vuln: { t: 'VULNERÁVEL', c: '#ff9f1c' }, overclock: { t: 'OVERCLOCK', c: '#00f0ff' }, dizzy: { t: 'TONTO', c: '#ffe14d' }, stolen: { t: 'KIT ROUBADO', c: '#c77dff' }, regen: { t: 'REGEN', c: '#7dff9a' },
  resonance: { t: 'RESSONÂNCIA', c: '#88eaff' }, veil: { t: 'VÉU', c: '#f49bdf' },
  vertigo: { t: 'VERTIGEM', c: '#ff9a36' }, paralyze: { t: 'PARALISADO', c: '#bd80ff' }, nanomachines: { t: 'NANOMÁQUINAS', c: '#ffad4d' },
  daltonic: { t: 'DALTONIC', c: '#c9c9c9' },
  shuffled: { t: 'EMBARALHADO', c: '#ff4fd8' },
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
    this.maxHp = Math.min(HP_LIMIT, Math.max(1, Math.round((def.stats.hp || 100) * HEALTH_MULTIPLIER)));
    /* Balanceamento geral: lutadores fracos ganham buff em TODOS os modos
       (classificacao em Balance.buffFor); HP segue limitado a HP_LIMIT. */
    this.balanceBuff = null;
    if (typeof Balance !== 'undefined' && Balance.buffFor) {
      const b = Balance.buffFor(def);
      if (b) {
        this.balanceBuff = b;
        this.maxHp = Math.min(HP_LIMIT, Math.max(1, Math.round(this.maxHp * b.hp)));
      }
    }
    this.hp = this.maxHp;
    this.redHp = this.maxHp;
    this.charge = [0, 0];
    this.ultimate = 0;
    this.skinHue = (opts && opts.skinHue) || 0;
    this.kit = (typeof POWERS !== 'undefined' && POWERS[def.id]) || null;
    this.element = this.kit ? this.kit.element : 'arcano';
    this.cd = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.castLock = 0;
    this.spamShared = 0; /* anti-spam GLOBAL entre habilidades simples/extras */
    this.status = {};
    this.statusCapWindows = {};
    this.statusSource = {};
    this.stolen = null;
    this.afo = 0;
    this.stunGauge = 0;
    this.hardControl = { last: -Infinity, chain: 0, dizzyLast: -Infinity, dizzyCount: 0 };
    this.statusPulse = {};
    this._controlRound = game && game.round != null ? game.round : 0;
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
    this.stats = { dmg: 0, maxCombo: 0, hits: 0, ults: 0 };
    this.pet = opts.pet || PETS[0];
    this.dust = [];
    this.applyPet();
  }

  /* ---------- utilidades ---------- */
  get alive() { return this.hp > 0; }
  get onGround() { return this.y >= -0.01 && this.vy >= 0; }
  has(s) { return (this.status[s] || 0) > this.now; }
  roundKey() { return this.game && this.game.round != null ? this.game.round : 0; }
  resetControlMemory(round = this.roundKey()) {
    this._controlRound = round;
    this.hardControl = { last: -Infinity, chain: 0, dizzyLast: -Infinity, dizzyCount: 0 };
    this.statusPulse = {};
  }
  syncControlMemory() {
    const round = this.roundKey();
    if (this._controlRound !== round) this.resetControlMemory(round);
  }
  controlScaleFor(o = {}) {
    const p = o.power || null;
    const pfx = p && p.fx || {};
    const owner = p && this.kitOwnerId(p);
    const sig = owner && typeof SIGNATURES !== 'undefined' ? SIGNATURES[owner] : null;
    const hard = !!(o.hardControl || o.freeze || o.trap || o.stun >= 20 || pfx.stun || (sig && sig.ability && sig.ability.stun));
    if (!hard) return 1;
    this.syncControlMemory();
    const memory = this.hardControl;
    if (this.now - memory.last > 90) memory.chain = 0;
    const scale = [1, 0.72, 0.5, 0.36][Math.min(3, memory.chain)];
    memory.chain = Math.min(3, memory.chain + 1);
    memory.last = this.now;
    return scale;
  }
  dizzyScale() {
    this.syncControlMemory();
    const memory = this.hardControl;
    if (this.now - memory.dizzyLast > 240) memory.dizzyCount = 0;
    const scale = [1, 0.72, 0.5, 0.36][Math.min(3, memory.dizzyCount)];
    memory.dizzyCount = Math.min(3, memory.dizzyCount + 1);
    memory.dizzyLast = this.now;
    return scale;
  }
  addStatus(s, frames, source = null) {
    if (this.def && this.def.id === 'iales' && IALES_IMMUNE.has(s)) return;
    /* RESISTENCIA (chefe KERNOR): debuffs duram menos (def.statusResist 0..1) */
    if (this.def && this.def.statusResist && IALES_IMMUNE.has(s) && frames > 0) frames = Math.max(1, Math.round(frames * (1 - this.def.statusResist)));
    this.syncControlMemory();
    if (s === 'resonance' || s === 'veil') {
      let window = this.statusCapWindows[s];
      if (!this.has(s) || !window || this.now >= window.until) {
        window = { start: this.now, until: this.now + 150 };
        this.statusCapWindows[s] = window;
      }
      frames = Math.min(frames, Math.max(0, window.until - this.now));
    }
    const absoluteCap = STATUS_WINDOW_CAPS[s];
    if (frames > 0 && absoluteCap) {
      let window = this.statusCapWindows[s];
      const recoveryGap = STATUS_WINDOW_GAPS[s] || 0;
      if (!window || this.now >= window.until + recoveryGap) {
        window = { start: this.now, until: this.now + absoluteCap };
        this.statusCapWindows[s] = window;
      }
      frames = Math.min(frames, Math.max(0, window.until - this.now));
    }
    let expiry = this.now + frames;
    /* Cegueira/choque/travamento podem ser renovados por vários projéteis. Uma sequência
       curta ganha extensão decrescente, mas tem teto absoluto para não virar
       um loop visual/controlável permanente. */
    if (frames > 0 && (s === 'blind' || s === 'shock' || s === 'glitch')) {
      const current = this.statusPulse[s];
      if (!current || this.now - current.last > 75 || !this.has(s)) {
        this.statusPulse[s] = {
          start: this.now,
          last: this.now,
          count: 0,
          cap: this.now + Math.min(220, Math.max(120, Math.round(frames * 1.35))),
        };
        expiry = Math.min(expiry, this.statusPulse[s].cap);
      } else {
        current.count = Math.min(4, (current.count || 0) + 1);
        current.last = this.now;
        const scale = [0.7, 0.48, 0.3, 0.2][Math.min(3, current.count - 1)];
        expiry = Math.min(this.now + Math.max(18, Math.round(frames * scale)), current.cap);
      }
    }
    if (['burn', 'poison', 'bleed'].includes(s) && expiry >= (this.status[s] || 0)) this.statusSource[s] = source;
    this.status[s] = Math.max(this.status[s] || 0, expiry);
  }
  left(s) { return Math.max(0, (this.status[s] || 0) - this.now); }
  weight() { return this.def.stats.weight || 1; }
  get pfx() {
    let pet = (this.pet && this.pet.fx) || {};
    /* pacote do Unicornio npm ativo: bonus temporario soma por cima */
    const tmp = this.petTempFx ? this.petTempFx() : null;
    if (tmp) { pet = Object.assign({}, pet); for (const k of Object.keys(tmp)) pet[k] = (pet[k] || 0) + tmp[k]; }
    if (this.def.id === 'iales') return Object.assign({ immune: true }, pet);
    return pet;
  }
  applyPet() {
    this.shield = this.pfx.shield || 0;
    this.revived = false;
    if (this.petResetRound) this.petResetRound();
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
    this.hp = this.game.cfg && this.game.cfg.infiniteLife ? this.maxHp : Math.max(0, this.hp - n);
    if (attacker) attacker.stats.dmg += n;
    if (this.hp <= 0) this.defeat(attacker ? Math.sign(this.x - attacker.x) : -this.dir);
  }
  meterRate() {
    let m = (this.def.stats.meterRate || 1) * (1 + (this.pfx.meter || 0)) * (this.tourneyMeter || 1);
    if (this.has('meterSlow')) m *= 0.4;
    if (this.game.weather && this.game.weather.kind === 'aurora') m *= 1.08;
    if (this.game.weather && this.game.weather.kind === 'fireflies') m *= 1.06; /* vagalumes: medidor +6% */
    if (this.game.weather && this.game.weather.kind === 'eclipse') m *= 1.10; /* eclipse: medidor +10% */
    if (this.game.weather && this.game.weather.kind === 'diaenoite' && this.x < this.game.W / 2) m *= 1.10; /* lado do DIA: medidor +10% */
    return m;
  }
  gain(dealt, amount = 1) {
    const r = this.meterRate() * amount;
    this.charge[0] = Math.min(100, this.charge[0] + (dealt ? 9 : 6) * r);
    this.charge[1] = Math.min(100, this.charge[1] + (dealt ? 7 : 8) * r);
    this.ultimate = Math.min(100, this.ultimate + (dealt ? 5.5 : 4.5) * r * 0.7);
  }
  ownKit() { return (this.kit && this.kit.powers) || []; }
  currentKit() { return this.stolen ? this.stolen.powers : this.ownKit(); }
  kitOwnerId(p) { return (p && p._fid) || this.def.id; }
  /* EMILIO: nome e atlas de habilidade da forma RAPOSA quando transformado. */
  powerLabel(p) {
    if (this.def.id === 'emilio' && this.has('trans') && p.transName) return p.transName;
    return p.name;
  }
  powerSheetId(p) {
    if (this.def.id === 'emilio' && this.has('trans')) return 'emilio-trans';
    return this.kitOwnerId(p);
  }
  elementOf(p) { const f = this.kitOwnerId(p); return (POWERS[f] && POWERS[f].element) || this.element; }
  autoAim() { return !!(this.kit && this.kit.autoAim); }

  /* ---------- multiplicadores ---------- */
  spriteKey() {
    if (this.def.id === 'qwen' && this.has('astra')) return 'qwen-astra';
    if (this.def.id === 'dev-senior' && this.has('nanomachines')) return 'dev-senior-nano';
    if (this.def.id === 'emilio' && this.has('trans')) return 'emilio-trans';
    return this.def.id;
  }
  nanoElectricPulse() {
    if (this.def.id !== 'dev-senior' || !this.has('nanomachines') || this.frame % 36 !== 0) return false;
    const target = this.game.enemyOf(this);
    if (!target || !target.alive || target.benched || Math.abs(target.x - this.x) > 150 || Math.abs(target.y - this.y) > 180) return false;
    const power = POWERS['dev-senior'] && POWERS['dev-senior'].powers[4];
    if (!power) return false;
    const dir = Math.sign(target.x - this.x) || this.dir;
    if (!target.takeHit(4, { attacker: this, kx: 3.5, dirSign: dir, stun: 6, ability: true, power, element: 'dev-senior' })) return false;
    target.addStatus('shock', 8, this);
    const x = (this.x + target.x) / 2;
    const y = Math.min(this.y, target.y) - 82;
    this.game.spawnBurst('fx2:dev-senior-electric', 0, x, y, dir, 1.35);
    for (let i = 0; i < (this.game.reduced ? 2 : 5); i++) this.game.spark(x + (i - 2) * 8, y + (i % 2 ? -12 : 12), '#ff2948');
    return true;
  }
  weatherDmgMult(p, weatherKind = null) {
    const w = weatherKind || (this.game.weather ? this.game.weather.kind : 'clear');
    const el = p ? this.elementOf(p) : null;
    if (!el) return 1;
    let m = 1;
    if ((w === 'rain' || w === 'storm') && ['agua', 'ia', 'neon', 'electric'].includes(el)) m *= w === 'storm' ? 1.25 : 1.15;
    if ((w === 'rain' || w === 'storm') && el === 'magma') m *= 0.85;
    if (w === 'snow' && ['tempo', 'agua'].includes(el)) m *= 1.2;
    if (w === 'heatwave' && (el === 'magma' || el === 'fire')) m *= 1.08;
    if (w === 'heatwave' && ['agua', 'water', 'gelo', 'ice'].includes(el)) m *= 0.95;
    return m;
  }
  /* ultimate ja depende da barra cheia: fica fora do anti-spam */
  spamDmgMult(p) { if (p && p.slot === 'ultimate') return 1; return (this.spamHeat || 0) >= 2 ? Math.max(0.3, 1 - 0.25 * (this.spamHeat - 1)) : 1; }
  dmgMult(p) {
    /* spam: habilidade com calor perde ate 70%; o golpe basico de quem esta spamando perde metade disso */
    let m = p ? this.spamDmgMult(p) : (1 + this.spamDmgMult()) / 2;
    m *= (this.def.stats.power || 1) * (this.balanceBuff ? this.balanceBuff.power : 1) * (this.tourneyDmg || 1);
    if (this.has('atk')) m *= 1.35;
    if (this.has('rage')) m *= this.status.rageMult || 1.5;
    if (this.has('aura') && this.aura && this.aura.dmgMult) m *= this.aura.dmgMult;
    if (this.has('spot')) m *= 1.25;
    if (this.has('astra')) m *= 1.35;
    if (this.has('trans')) m *= 1.5;
    if (this.has('phoenix')) m *= 1.1; /* NUNES: Renascer das Cinzas */
    m *= 1 + (this.pfx.dmg || 0);
    m *= 1 + this.afo * 0.04;
    if (this.sig.lowHpRage && this.hp < this.maxHp * 0.35) m *= this.sig.lowHpRage;
    m *= this.weatherDmgMult(p);
    if (this.bossDmg) m *= this.bossDmg;
    if (this.enrage) m *= this.enrage;
    if (this.game && this.game.inferno && this.game.inferno.active) m *= 1.05;
    return m;
  }
  defMult() {
    let m = (1 / Math.sqrt(this.weight())) * (this.tourneyDef || 1) * (this.bossTaken || 1);
    if (this.has('def')) m *= 0.65;
    if (this.has('veil')) m *= 0.9;
    if (this.has('vuln')) m *= 1.2;
    if (this.has('aura') && this.aura && this.aura.defMult) m *= this.aura.defMult;
    m *= 1 - (this.pfx.def || 0);
    return m;
  }
  speedMult() {
    if (this.has('astra')) return this._speedBase() * 1.18;
    if (this.has('trans')) return this._speedBase() * 1.25;
    return this._speedBase();
  }
  _speedBase() {
    let m = (this.def.stats.speed || 1) * (this.tourneySpd || 1);
    if (this.has('spd')) m *= 1.4;
    if (this.has('aura') && this.aura && this.aura.speedMult) m *= this.aura.speedMult;
    if (this.has('slow')) m *= 0.55;
    if (this.has('chill')) m *= 0.68;
    if (this.has('glitch')) m *= 0.88;
    if (this.has('overclock')) m *= 1.3;
    m *= 1 + (this.pfx.speed || 0);
    /* passiva "Última Caneca" (Dev Virado): abaixo de 25% de vida, +15% de velocidade */
    if (this.sig.lowHpSpeed && this.hp < this.maxHp * 0.25) m *= this.sig.lowHpSpeed;
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
    /* Hitboxes mais generosas em toda a arena: mais alcance à frente,
       janela vertical maior e largura mínima maior — socos e chutes
       conectam de verdade em todos os lutadores. */
    const low = this.state === 'cpunch' || this.state === 'ckick';
    const air = this.state === 'jpunch' || this.state === 'jkick';
    const h = low ? 54 : 80;
    const top = this.y - (low ? 62 : air ? 132 : 144);
    const w = Math.max(42, mv.range * 0.92);
    const x = this.dir === 1 ? this.x + 10 : this.x - 10 - w;
    return { x, y: top, w, h };
  }

  /* ---------- receber dano ---------- */
  /* Escala de dano em combo: 100% -> 85% -> 72% -> 62% -> 55% (piso).
     Recompensa o "opening" em vez de punir 40% de vida por um erro. */
  comboScale() {
    const c = (this.comboCount || 0);
    return c <= 0 ? 1 : c === 1 ? 0.85 : c === 2 ? 0.72 : c === 3 ? 0.62 : 0.55;
  }
  takeHit(dmg, o = {}) {
    /* PITOCO (pet secreto): cara de coitado — 50% dos golpes erram sozinhos */
    const meuPet = this.pet && this.pet.id === 'pitoco';
    if (meuPet && !o.unblockable && !o.height) {
      if ((this.game.rnd ? this.game.rnd() : Math.random()) < 0.5) {
        this.game.floatText(this.x, this.y - 230, 'ERROU!', '#FFD27D');
        return false; /* passa raspando — o atacante nao ganha barra */
      }
    }

    if (typeof VFX !== 'undefined' && dmg >= 14) VFX.impact(this.x, this.y - 110, dmg >= 22, dmg >= 22 ? '#ffd27d' : '#fff', this.game.reduced);
    /* POSTURA DEFENSIVA: guarda alta ao andar pra tras absorve 15% */
    if (this.guardUp && !o.unblockable && !o.height) dmg *= 0.85;
    /* LIFESTEAL (Daltonic da Jess): o atacante converte 25% do dano em vida */
    if (o.attacker && o.attacker.has && o.attacker.has('lifesteal')) {
      o.attacker.hp = Math.min(o.attacker.maxHp, o.attacker.hp + dmg * 0.25);
    }
    /* escala: dano cai se a vitima ja leva sequencia do MESMO agressor */
    const aggr = o.attacker || null;
    if (aggr && this.hitstun > 0 && this.lastHitBy === aggr) {
      this.comboCount = Math.min(6, (this.comboCount || 0) + 1);
      dmg = dmg * this.comboScale();
    } else if (this.hitstun <= 0) {
      this.comboCount = 0;
    }
    if (aggr) this.lastHitBy = aggr;
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
    const auraDodge = this.has('aura') && this.aura && this.aura.dodge ? this.aura.dodge : 0;
    if (atk && !unblockable && !o.hazard && (this.sig.dodge || auraDodge || this.has('overclock')) && this.onGround && this.canAct() && this.state !== 'attack') {
      const chance = (this.sig.dodge || 0) + auraDodge + (this.has('overclock') ? 0.25 : 0);
      if ((this.game.rnd ? this.game.rnd() : Math.random()) < chance) {
        const sgn = Math.sign(this.x - atk.x) || 1;
        this.x = Math.max(50, Math.min(game.W - 50, this.x + sgn * 70));
        this.addStatus('invuln', 12);
        this.afterimage = 18;
        game.floatText(this.x, this.y - 230, 'ESQUIVA!', '#00f0ff');
        game.audio.play('whoosh');
        /* SANDEVISTAN (Rafael): na esquiva o tempo desacelera pra ele — slowmo curto
           (letterbox do VFX) + flash ciano + rastro fantasma + texto. */
        if (this.sig.sandevistan) {
          game.slowmo = Math.max(game.slowmo || 0, 26);
          this.afterimage = 30;
          if (typeof VFX !== 'undefined') VFX.impact(this.x, this.y - 100, true, '#00f0ff', game.reduced);
          game.spawnBurst('fx2:lightning', 2, this.x, this.y - 100, 1, 1.6);
          game.floatText(this.x, this.y - 266, 'SANDEVISTAN!', '#7df9ff');
          for (let k = 0; k < 3; k++) game.spawnImgFx('rastro', 'flash', this.x - sgn * (24 + k * 26), this.y - 96 - k * 14, { scale: 1.5 + k * 0.35, life: 16, alpha: 0.8, dir: -sgn });
        }
        return false;
      }
    }
    /* anti-spam: habilidade "quente" tambem atordoa menos */
    if (atk && o.power && o.stun && atk.spamDmgMult(o.power) < 1) o = Object.assign({}, o, { stun: Math.max(4, Math.round(o.stun * atk.spamDmgMult(o.power))) });
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
    /* PARRY (nov/2026): defender nos 8 primeiros quadros da guarda anula o dano
       (nem chip), nao sofre blockstun e, se o golpe for de perto, o atacante
       fica aberto. A CPU so consegue as vezes (mais no dificil). */
    if (blocked && atk && atk !== this && !o.hazard && this.now - (this._blockStart == null ? -999 : this._blockStart) <= 8) {
      const isCpu = game.cfg && game.cfg.cpu && game.cfg.cpu[this.team];
      const lvl = this.aiLevel == null ? 1 : this.aiLevel;
      if (!isCpu || Math.random() < [0.05, 0.12, 0.25, 0.4][Math.max(0, Math.min(3, lvl))]) {
        this._blockStart = -999; /* um parry por apertada */
        this.blockstun = 0;
        this.state = this.crouching ? 'crouchblock' : 'block';
        this.stateTime = 0;
        if (!(game.audio.play && game.audio.play('metal', { vol: 0.8 }))) game.audio.block();
        game.spawnBurst('impact', 2, this.x - sign * 14, this.y - 100, -sign, 2.2);
        if (game.floatText) game.floatText(this.x, this.y - 210, 'PARRY!', '#7df9ff');
        if (game.shake) game.shake(5);
        this.gain(true, 0.8);
        if (!o.projectile && atk.onGround && Math.abs(atk.x - this.x) < 220) {
          atk.state = 'hit'; atk.stateTime = 0; atk.hitstun = Math.max(atk.hitstun || 0, 26);
          atk.attack = null; atk.vx = -atk.dir * 3;
        }
        this._parries = (this._parries || 0) + 1;
        return true;
      }
    }
    if (blocked) {
      this._blocked = (this._blocked || 0) + 1;
      if (this._blocked >= 25) Profile.grantAchievement('bloqueio-25');
      const chip = d * (o.projectile || o.ability ? 0.16 : 0.05);
      this.hp = game.cfg && game.cfg.infiniteLife ? this.maxHp : Math.max(o.ability ? 0 : 1, this.hp - chip);
      if (atk) atk.stats.dmg += chip;
      this.blockstun = o.blockstun || 11;
      this.state = 'blockstun';
      this.stateTime = 0;
      this.vx = sign * (o.kx || 3) * 0.45 / this.weight();
      game.audio.block();
      game.spawnBurst('impact', 2, this.x - sign * 14, this.y - 100, -sign, 1.3);
      game.dust(this.x - sign * 12, 'rgba(150,200,255,0.75)', 3); /* poeira no bloqueio */
      game.registerHit(atk, this, chip, true, 3);
      this.gain(false, 0.4);
      if (atk) atk.gain(true, 0.3);
      if (this.hp <= 0) this.defeat(sign);
      return true;
    }
    if (this.has('resonance')) {
      d *= 1.15;
      this.status.resonance = 0;
    }
    const controlScale = this.controlScaleFor(o);
    // escudo do mascote
    if (this.shield > 0) {
      const absorb = Math.min(this.shield, d);
      this.shield -= absorb;
      d -= absorb;
      game.spawnBurst('water', 2, this.x, this.y - 100, 1, 1.5);
      if (d <= 0) { game.floatText(this.x, this.y - 200, 'ESCUDO', '#7de0ff'); return true; }
    }
    /* TETO DA ULTIMATE (nov/2026): cada ultimate tira no maximo 30% da vida
       maxima do alvo, somando todos os acertos dela. Luta nao se decide num botao. */
    if (atk && o.power && o.power.slot === 'ultimate') {
      if (this._ultFrom !== atk || this._ultSeqSeen !== atk._ultSeq) { this._ultFrom = atk; this._ultSeqSeen = atk._ultSeq; this._ultTaken = 0; }
      d = Math.max(0, Math.min(d, this.maxHp * 0.3 - this._ultTaken));
      this._ultTaken += d;
    }
    /* PETS DEV: coruja (resposta aceita) e elefante (rollback) mexem no dano */
    if (this.petBeforeDamage && this.pet && this.pet.fx) d = this.petBeforeDamage(d, o, atk);
    this.hp = game.cfg && game.cfg.infiniteLife ? this.maxHp : Math.max(0, this.hp - d);
    if (atk) { atk.stats.dmg += d; atk.stats.hits++; }
    if (atk && atk.petOnHit && atk.pet && atk.pet.fx && atk.pet.fx.goroutines) atk.petOnHit(this, d, o);
    /* NUNES — vampirismo da Fênix: cura 25% do dano causado. */
    if (atk && atk.has && atk.has('phoenix') && atk.alive) atk.heal(d * 0.25);
    const armored = this.has('armor') && !o.heavy && d < 16 && this.hp > 0;
    if (counter) game.floatText(this.x, this.y - 230, 'CONTRA-ATAQUE!', '#ff4b4b');
    if (o.burn && !this.pfx.immune) this.addStatus('burn', o.burn, atk);
    if (o.poison && !this.pfx.immune) this.addStatus('poison', o.poison, atk);
    if (o.slow) this.addStatus('slow', o.slow);
    this.applyEffects(o, atk, d, controlScale);
    if (atk && atk.cast && o.ability) atk.cast.hit = true;
    // Pet Gato Mistral: a cada 3 acertos de habilidade, choque no alvo
    if (atk && o.ability && (atk.pfx.shockOnHit || atk.pfx.burnOnHit || atk.pfx.explodeOnHit)) {
      atk.petHitCounter = ((atk.petHitCounter || 0) + 1);
      if (atk.pfx.shockOnHit && atk.petHitCounter % 3 === 0) this.addStatus('shock', atk.pfx.shockOnHit, atk);
      if (atk.pfx.burnOnHit && atk.petHitCounter % 4 === 0) this.addStatus('burn', atk.pfx.burnOnHit, atk);
      if (atk.pfx.explodeOnHit && atk.petHitCounter % 5 === 0) { this.chip(atk.pfx.explodeOnHit, atk); this.game.spawnBurst('fire', 3, this.x, this.y - 90, 1, 2.2); }
    }
    const ultHit = !!(o.power && o.power.slot === 'ultimate');
    const heavyHit = !!(ultHit || o.heavy || (o.ability && d >= 12) || d >= 16);
    const kindHit = (atk && atk.attack && String(atk.attack.kind || '').includes('kick')) ? 'kick' : 'punch';
    game.audio.impact(kindHit, heavyHit, ultHit);
    const stop = ultHit ? 20 : heavyHit ? 13 : (o.hitstop || 6);
    game.shake(ultHit ? 16 : heavyHit ? 11 : 5);
    if (heavyHit) game.spawnBurst(ultHit ? 'fire' : 'impact', ultHit ? 3 : 2, this.x, this.y - 100, sign || this.dir || 1, ultHit ? 2.6 : 1.9);
    game.registerHit(atk, this, d, false, stop, counter);
    if (atk) atk.gain(true);
    this.gain(false);
    // tontura
    this.stunGauge += d * 2.3 * (atk && atk.sig.stunMult ? atk.sig.stunMult : 1) * controlScale;
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
    const hardStun = Math.max(1, Math.round((o.stun || 14) * controlScale));
    this.hitstun = juggled ? Math.min(hardStun, 12) : hardStun;
    if (this.has('chill')) this.hitstun += 3;
    if (o.trap) {
      const trap = Math.max(1, Math.round(o.trap * controlScale));
      this.addStatus('trap', trap);
      this.hitstun = Math.max(this.hitstun, trap);
    }
    /* Congelamento grande (>100f) e TIME-STOP intencional (Parar o Relógio):
       duração cheia, sem cap. Pequeno = gelo normal (usa o stun). */
    if (o.freeze) this.addStatus('freeze', o.freeze > 100 ? o.freeze : Math.max(1, Math.round((o.stun || 60) * controlScale)));
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
      const dizzy = Math.max(28, Math.round(100 * this.dizzyScale()));
      this.addStatus('dizzy', dizzy);
      this.hitstun = Math.max(this.hitstun, dizzy);
      game.floatText(this.x, this.y - 240, 'TONTO!', '#ffe14d');
      game.audio.voice('combo');
    }
    return true;
  }
  /** Efeitos de status: assinatura do lutador + campo fx do poder. */
  applyEffects(o, atk, d, controlScale = 1) {
    if (!atk || this.pfx.immune || !this.alive) return;
    const p = o.power || null;
    const owner = p ? atk.kitOwnerId(p) : atk.def.id;
    const sig = (typeof SIGNATURES !== 'undefined' && SIGNATURES[owner]) || {};
    const fx = Object.assign({}, o.ability ? sig.ability : sig.basic, p && p.fx);
    if (!fx) return;
    /* anti-spam: efeitos (queimar, lento, sem poderes...) duram menos quando a habilidade sai no spam */
    const spamM = p && atk.spamDmgMult ? atk.spamDmgMult(p) : 1;
    if (spamM < 1) for (const k in fx) if (typeof fx[k] === 'number' && k !== 'drain') fx[k] = Math.round(fx[k] * spamM);
    const game = this.game;
    const thermalPrepared = this.has('chill') || this.has('burn');
    if (fx.blind) this.addStatus('blind', fx.blind);
    if (fx.vertigo) this.addStatus('vertigo', fx.vertigo, atk);
    if (fx.paralyze) this.addStatus('paralyze', fx.paralyze, atk);
    /* PONTEIRO: fx.freeze grande (>100f) = TIME-STOP com duração cheia. */
    if (fx.freeze) this.addStatus('freeze', fx.freeze > 100 ? fx.freeze : Math.max(1, Math.round(fx.freeze * 0.6)), atk);
    if (fx.shock) this.addStatus('shock', fx.shock);
    if (fx.glitch) this.addStatus('glitch', fx.glitch, atk);
    if (fx.chill) this.addStatus('chill', fx.chill);
    if (fx.bleed) this.addStatus('bleed', fx.bleed, atk);
    if (fx.burn) this.addStatus('burn', fx.burn, atk);
    if (fx.poison) this.addStatus('poison', fx.poison, atk);
    if (fx.vuln) this.addStatus('vuln', fx.vuln);
    if (fx.resonance) this.addStatus('resonance', fx.resonance, atk);
    if (fx.slow) this.addStatus('slow', fx.slow);
    if (fx.lock) this.addStatus('locked', fx.lock);
    if (fx.dizzy) this.addStatus('dizzy', fx.dizzy, atk);
    if (fx.shuffle) this.addStatus('shuffled', fx.shuffle, atk); /* botoes embaralhados (Winx.exe; antes so o Jester tinha) */ /* Jester/Domador: estavam no kit e ninguem aplicava */
    if (fx.stun) this.stunGauge += fx.stun * controlScale;
    if (fx.drain) atk.heal(d * fx.drain);
    if (fx.meterBurn) { this.charge[0] = Math.max(0, this.charge[0] - fx.meterBurn); this.charge[1] = Math.max(0, this.charge[1] - fx.meterBurn); }
    if (fx.meterSlow) this.addStatus('meterSlow', fx.meterSlow);
    // Xeon combina os dois elementos sem transformar todo acerto em stun:
    // o bônus só existe quando gelo ou fogo já preparou o alvo.
    if (fx.thermal && thermalPrepared && this.hp > 0) {
      this.chip(fx.thermal, atk);
      game.floatText(this.x, this.y - 210, 'CHOQUE TÉRMICO!', '#7fd4ff');
    }
    if (fx.explode && this.hp > 0) {
      this.chip(fx.explode, atk);
      game.spawnBurst('fire', 3, this.x, this.y - 90, 1, 2.6);
      game.shake(6);
      game.audio.play('explosion', { vol: 0.5 });
    }
  }
  defeat(sign) {
    /* NUNES — Renascer das Cinzas: se morrer com a FÊNIX ativa, revive no
       clone de fogo com 40% de vida em vez de cair. */
    if (this.def.id === 'nunes' && this.has('phoenix') && this.phoenixClone) {
      this.hp = Math.max(1, Math.round(this.maxHp * 0.4));
      /* alive é um getter (hp > 0 + estado sadio) — basta vida e estado. */
      this.x = Math.max(60, Math.min(this.game.W - 60, this.phoenixClone.x));
      this.y = 0; this.vx = 0; this.vy = 0;
      this.state = 'idle'; this.stateTime = 0;
      this.hitstun = 0; this.stunGauge = 0;
      this.cast = null; this.rush = null; this.attack = null;
      this.status = {};
      this.phoenixClone = null;
      this.addStatus('invuln', 70);
      /* ANIMAÇÃO DE RENASCIMENTO: a Fênix desce do céu através de uma coluna
         de fogo — flash laranja, chamas em vários andares, asas de explosão
         e anel de aura, tudo com a arte de fogo do jogo. */
      this.y = -110; this.vy = 2; /* desce pelo pilar de chamas */
      const gx = this.x;
      if (this.game.flashScreen) this.game.flashScreen('#FF7A1A', 14);
      for (let k = 0; k < 5; k++) {
        this.game.spawnImgFx('fogo', 'projectile', gx + (k % 2 ? 14 : -14), -20 - k * 95, { scale: 2.6 + k * 0.35, life: 26 });
      }
      this.game.spawnImgFx('fogo', 'ultimate', gx, -170, { scale: 5.5, life: 22 });
      this.game.spawnImgFx('fogo', 'aura', gx, -95, { scale: 3.4, life: 30 });
      this.game.spawnBurst('fire', 3, gx, -100, 1, 3.2);
      this.game.spawnBurst('fire', 1, gx, -180, 1, 2.6);
      this.game.spawnBurst('fire', 2, gx, -40, 1, 2.2);
      this.game.announce('RENASCEU DAS CINZAS!', '#FF7A1A', 'A Fênix de Nexo City não cai!');
      this.game.audio.play('explosion', { vol: 0.6 });
      this.game.shake(14);
      /* EXPLOSÃO INCENDIÁRIA no renascimento: quem estiver perto do clone
         toma dano explosivo de fogo + queimadura + lentidão. */
      const foe = this.enemy();
      if (foe && foe.alive && Math.abs(foe.x - this.x) < 230) {
        foe.takeHit(30, { attacker: this, height: 'unblockable', kx: 13, dirSign: Math.sign(foe.x - this.x) || 1, launch: -11, stun: 34, ability: true, heavy: true, fx: { burn: 220, slow: 110 } });
        this.game.spawnBurst('abil:nunes', 4, this.x, this.y - 110, 1, 2.6);
        this.game.spawnBurst('fire', 2, foe.x, foe.y - 90, 1, 2.2);
        this.game.shake(12);
      }
      return;
    }
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
    if (p.slot === 'simple' || p.slot === 'extra') {
      const prof = this.spamProfile();
      const total = Math.max(prof.floor, (p.cd || 50) * ABILITY_CD_MULT, prof.shared);
      const left = Math.max(this.cd[i] || 0, this.spamShared || 0, this.castLock || 0);
      return { ready: left <= 0, pct: 1 - left / Math.max(1, total), left, p };
    }
    if (p.slot === 'charge') {
      const v = this.charge[p.meter == null ? (i === 2 ? 0 : 1) : p.meter];
      const cap = Math.max(90, p.cd || 45);
      const cdLeft = this.cd[i] || 0;
      const cdPct = 1 - cdLeft / cap;
      return { ready: v >= 100 && cdLeft <= 0, pct: Math.min(v / 100, cdPct), left: cdLeft, p };
    }
    const needOk = !p.needAfo || this.afo >= p.needAfo;
    const ultLeft = this.cd[i] || 0;
    const ultPct = this.ultimate / 100;
    return { ready: this.ultimate >= 100 && needOk && ultLeft <= 0, pct: Math.min(ultPct, 1 - ultLeft / 150), left: ultLeft, p, need: needOk ? 0 : `${this.afo}/${p.needAfo}` };
  }
  canAct() {
    return !['ko', 'hit', 'win', 'blockstun', 'cast', 'rush', 'throw', 'thrown', 'down', 'tagout'].includes(this.state) && !this.benched && !this.has('paralyze');
  }
  /* Perfil de anti-spam: lutadores de CADEIA (combo-link, tipo o BHM)
     precisam encadear habilidades no acerto — pisos menores. Zoners de
     pressao (projeteis spam) mantem o piso cheio. */
  spamProfile() {
    if (this._spam == null) {
      const prof = (POWERS[this.def.id] && POWERS[this.def.id].spamProfile) || 'standard';
      /* chain ainda encadeia no acerto, mas 34 quadros era golpe atrás de
         golpe. O piso vale em todo modo: arcade, versus, torneio, survival. */
      this._spam = prof === 'chain'
        ? { castLock: 48, floor: 120, shared: 80 }
        : prof === 'heavy'
          ? { castLock: 60, floor: 155, shared: 155 }
          : { castLock: 50, floor: 130, shared: 130 };
    }
    return this._spam;
  }
  tryCast(i) {
    if (this.castLock > 0) return false;
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
      if ((this.frame || 0) - (this._cdMsgFrame || -99) > 24) {
        this._cdMsgFrame = this.frame || 0;
        const msg = st.p.slot === 'ultimate' && this.ultimate < 100 ? 'ULTIMATE CARREGANDO' : 'RECARREGANDO';
        this.flashText(msg);
      }
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
    /* EMILIO TRANSFORMADO: usa o atlas de habilidades da RAPOSA ESPIRITUAL
       (assets/abilities/emilio-trans.png) em todas as habilidades — inclusive
       na própria ultimate, que já ativa a forma antes de disparar. */
    if (this.def.id === 'emilio' && (this.has('trans') || p.transform === 'trans') && p.visualSheet === 'emilio') {
      p = Object.assign({}, p, { visualSheet: 'emilio-trans' });
    }
    /* Anti-spam em 3 camadas: multiplicador global x2 + PISO de 110 frames
       (~1.8s) nas simples/extras + trava GLOBAL de 45 frames depois de
       QUALQUER habilidade (sem chain H1->H2->H3 instantaneo). */
    const prof = this.spamProfile();
    this.castLock = prof.castLock;
    if (p.slot === 'simple' || p.slot === 'extra') {
      /* passiva "Última Caneca" (Dev Virado): abaixo de 25% de vida, dashes custam 5f a menos */
      const caneca = this.sig.lowHpDash && this.hp < this.maxHp * 0.25 && p.kind === 'dash' ? 5 : 0;
      this.cd[i] = Math.max(prof.floor, (p.cd || 50) * ABILITY_CD_MULT * (this.has('phoenix') ? 0.9 : 1) - caneca);
      /* anti-spam reforcado: o PISO vale entre TODAS as simples/extras (qualquer modo),
         nao so por habilidade — sem mais rotacao H1->H2->H3 a cada 50f */
      this.spamShared = Math.max(this.spamShared || 0, prof.shared);
    }
    /* BUG FIX (anti-spam furado em certos modos): habilidades de CARGA e
       ULTIMATE dependiam só do medidor — no treino (medidores infinitos) e
       em qualquer modo com recarga acelerada elas saiam a cada 50 frames.
       Agora TODA habilidade tem um piso de recarga por habilidade:
       carga >= 90f, ultimate >= 150f — em TODOS os modos. */
    else if (p.slot === 'charge') {
      this.charge[p.meter == null ? (i === 2 ? 0 : 1) : p.meter] = 0;
      this.cd[i] = Math.max(90, (p.cd || 45));
      /* Medidor infinito (treino) não pode soltar a carga de novo no quadro seguinte. */
      this.spamShared = Math.max(this.spamShared || 0, Math.min(80, prof.shared));
    }
    else {
      this.ultimate = 0;
      this._ultSeq = (this._ultSeq || 0) + 1; /* cada ult conta o teto de 30% do zero */
      this.cd[i] = 150;
      this.spamShared = Math.max(this.spamShared || 0, 70);
    }
    /* ANTI-SPAM (todos os modos, so jogador humano): habilidade atras de
       habilidade sem respiro esquenta. A partir do 3o seguido o dano das
       habilidades cai (ate -70%). Segurar ~3s entre habilidades esfria. */
    if (p.slot !== 'ultimate' && this.game && this.game.cfg && this.game.cfg.cpu && !this.game.cfg.cpu[this.team]) {
      const now = this.frame || 0;
      const gap = now - (this._lastCastF == null ? -9999 : this._lastCastF);
      this.spamHeat = gap < 200 ? (this.spamHeat || 0) + 1 : Math.max(0, (this.spamHeat || 0) - Math.floor(gap / 200));
      this._lastCastF = now;
      if (this.spamHeat >= 2) this.flashText('SPAM! DANO -' + Math.round((1 - this.spamDmgMult()) * 100) + '%', '#ff7a3a');
    }
    this.cast = { p, i, t: 0, fired: false };
    this.state = 'cast';
    this.stateTime = 0;
    this.attack = null;
    this.hasHit = false;
    if (p.slot === 'ultimate') {
      this._ultsMatch = (this._ultsMatch || 0) + 1;
      if (this._ultsMatch >= 1) Profile.grantAchievement('ultimate-1');
      if (this._ultsMatch >= 5) Profile.grantAchievement('ultimate-5');
    }
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
    this.flashText(this.powerLabel(p).toUpperCase(), this.def.colors.accent);
    game.audio.sfx(p.sfx || 'magic');
    if (ult && typeof game.voicedLine === 'function') game.voicedLine(this, 'ultimate');
    else if (ult) {
      const q = this.def.quotes.super;
      if (q && q.length) game.say(this, q[0]);
    } else {
      const q = this.def.quotes.special;
      if (q && q.length && (this.game.rnd ? this.game.rnd() : Math.random()) < 0.4) game.say(this, q[((this.game.rnd ? this.game.rnd() : Math.random()) * q.length) | 0]);
    }
    if (ult) {
      this.stats.ults = (this.stats.ults || 0) + 1;
      game.superFreeze(this, p);
      if (p.sfx !== 'ultimate') game.audio.super_();
      game.audio.voice('ultimate');
    }
    game.events.push({ t: 'cast', who: this.slot, name: this.powerLabel(p) });
  }
  fire(p) {
    const game = this.game;
    const tgt = this.enemy();
    const tx = tgt ? tgt.x : this.x + this.dir * 260;
    const fid = this.kitOwnerId(p);
    const key = p.visualSheet ? 'fx2:' + p.visualSheet : 'abil:' + fid;
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
          burn: p.burn, poison: p.poison, slow: p.slow, trap: p.trap, element: el, follow: seek ? tgt : null, power: p,
          sheet: { key, row: p.row, frames: 4 }, scale: scaleBig, dir: this.dir, sound: p.sfx === 'fire' ? 'fire' : 'explosion', shake: 6,
          warnColor: (ELEMENT_FX[el] || {}).color,
        }));
        break;
      }
      case 'daltonic': {
        /* DALTONIC MODE: 6s — o rival ve tudo em cinza e turvo (gás rosa), fica
           lento e com os controles invertidos; Jess rouba 25% do dano em vida */
        const rival = game.enemyOf(this);
        if (rival) {
          rival.addStatus('daltonic', 360, this);
          rival.addStatus('slow', 360, this);
          this.addStatus('lifesteal', 360);
          game.floatText(rival.x, rival.y - 250, 'DALTONIC MODE', '#F0C24B');
          game.shake(6);
        }
        game.spawnBurst('abil:jess', 4, this.x, this.y - 100, this.dir, 2.2);
        break;
      }
      case 'kspikes': {
        /* CAMPO DE ESPINHOS (KERNOR, estilo chefe final): espinhos brotam do
           chao em fileira, de uma ponta a outra, deixando BURACOS seguros
           alternados — da pra escapar pulando ou parando no buraco. */
        const fromLeft = (game.rnd ? game.rnd() : Math.random()) < 0.5;
        const gapOff = (game.rnd ? game.rnd() : Math.random()) < 0.5 ? 0 : 1;
        for (let k = 0; k < 10; k++) {
          if ((k + gapOff) % 3 === 2) continue; /* buraco seguro */
          const x = fromLeft ? 50 + k * 96 : game.W - 50 - k * 96;
          game.strikes.push(new Strike(this, {
            x, delay: 20 + k * 6, w: 90, h: 180, dmg: p.dmg || 6, stun: 18, launch: -7,
            sheet: { key, row: p.row, frames: 4 }, scale: 1.3, power: p, sound: k === 0 ? 'heavy' : null, shake: 4, warnColor: '#ff3a5a',
          }));
        }
        break;
      }
      case 'kradial': {
        /* LEVE DE LAMINAS (KERNOR): 8 laminas num meio-circulo pra cima.
           O angulo entra no construtor — escrever vx depois era reescrito
           no primeiro quadro e o leque virava um tiro so. */
        for (let k = 0; k < 8; k++) {
          const ang = -Math.PI + (k / 7) * Math.PI;
          this.queue.push({ at: 10, fn: () => {
            game.projectiles.push(new Projectile(this, Object.assign({}, p, { kind: 'shot', speed: 7, homing: 0, seek: false }), { fid, dmg: p.dmg || 7, angle: ang, scale: 1.3, y: -140 }));
          } });
        }
        game.shake(6);
        break;
      }
      case 'kblackhole': {
        /* BURACO NEGRO (2a ult do KERNOR): abre no meio, PUXA o rival por ~3s,
           da dano continuo, deixa SEM PODERES e termina numa explosao */
        const rival = game.enemyOf(this);
        const bx = rival ? Math.max(120, Math.min(game.W - 120, (this.x + rival.x) / 2)) : game.W / 2;
        game.zones.push(new Zone(this, { fid, key: 'fx2:kernor-extra', row: 0, x: bx, w: 280, time: 190, dmg: 0.12, slow: 60, fx: { lock: 30 }, power: Object.assign({}, p, { zoneTall: 1.35 }) }));
        /* o vortice do atlas fica na tela o tempo do puxao (a zona sozinha achatava no chao) */
        game.strikes.push(new Strike(this, { x: bx, delay: 4, w: 20, h: 20, dmg: 0, active: 0, duration: 170, sheet: { key: 'fx2:kernor-extra', row: 0, frames: 4 }, scale: 2.5, power: p }));
        this.kHole = { x: bx, t: 190 };
        game.floatText(bx, -320, 'BURACO NEGRO!', '#c06bff');
        game.strikes.push(new Strike(this, { x: bx, delay: 186, w: 260, h: 380, dmg: p.dmg || 22, stun: 34, launch: -12, sheet: { key, row: p.row, frames: 4 }, scale: 2.6, power: p, sound: 'explosion', shake: 14, warnColor: '#c06bff', unblockable: true }));
        break;
      }
      case 'hotreload': {
        /* HOT RELOAD (ult exclusiva da STELLA): circulo estelar explode no
           rival e a Stella RECARREGA TUDO — poderes simples sem recarga e as
           duas barras de carga cheias na hora. */
        const rival = game.enemyOf(this);
        if (rival) game.strikes.push(new Strike(this, {
          x: rival.x, delay: 14, w: 230, h: 360, dmg: p.dmg || 24, stun: 32, launch: -10, follow: rival,
          sheet: { key, row: p.row, frames: 4 }, scale: 2.6, power: p, sound: 'explosion', shake: 12, warnColor: '#ffd23a',
        }));
        for (let i = 0; i < this.cd.length; i++) if (i < 4) this.cd[i] = 0;
        this.charge = [100, 100];
        game.floatText(this.x, this.y - 250, 'HOT RELOAD! TUDO RECARREGADO', '#FFD23A');
        game.spawnBurst('fx2:stella-extra', 1, this.x, this.y - 110, this.dir, 2.2);
        break;
      }
      case 'kunoult': {
        /* DRAGAO DAS MIL LAMINAS (ult exclusiva da KUNO): ela some (fantasma +
           invulneravel) e o dragao de laminas acerta o rival varias vezes; o
           primeiro acerto ROUBA a ultimate do rival (ate 40%) pra ela. */
        const rival = game.enemyOf(this);
        if (!rival) break;
        this.addStatus('cloak', 90);
        this.addStatus('invuln', 60);
        let stolen = false;
        const n = p.hits || 5;
        for (let k = 0; k < n; k++) {
          game.strikes.push(new Strike(this, {
            x: rival.x, delay: 12 + k * 10, w: 170, h: 380, dmg: p.dmg || 6, stun: 22, launch: k === n - 1 ? -10 : 0, follow: rival,
            sheet: { key, row: p.row, frames: 4 }, scale: 2.2, power: p, sound: k === 0 ? 'ultimate' : 'whoosh', shake: 6, warnColor: '#c77dff', unblockable: k === n - 1,
            onHit: (f) => {
              if (stolen || !f.alive) return;
              stolen = true;
              const take = Math.min(f.ultimate || 0, p.steal || 40);
              f.ultimate = (f.ultimate || 0) - take;
              this.ultimate = Math.min(100, (this.ultimate || 0) + take);
              game.floatText(f.x, f.y - 260, take > 0 ? 'ULTIMATE ROUBADA −' + Math.round(take) + '%' : 'MIL LÂMINAS!', '#C77DFF');
            },
          }));
        }
        break;
      }
      case 'kitsune': {
        /* KITSUNE DE NOVE CAUDAS (ult exclusiva da MIKO): a raposa sagrada
           ataca o rival e PURIFICA — tira todos os buffs dele (aura, armadura,
           reflexo, overclock, regen...) e limpa os debuffs da propria Miko. */
        const rival = game.enemyOf(this);
        if (!rival) break;
        const BUFFS = ['atk', 'def', 'spd', 'rage', 'armor', 'reflect', 'aura', 'regen', 'overclock', 'cloak', 'astra', 'trans', 'phoenix', 'lifesteal', 'nanomachines', 'veil', 'resonance'];
        game.strikes.push(new Strike(this, {
          x: rival.x, delay: 16, w: 220, h: 380, dmg: p.dmg || 28, stun: 34, launch: -10, follow: rival,
          sheet: { key, row: p.row, frames: 4 }, scale: 2.6, power: p, sound: 'magic', shake: 10, warnColor: '#fff2c4',
          onHit: (f) => {
            let n = 0;
            for (const b of BUFFS) if (f.status[b] > 0) { f.status[b] = 0; n++; }
            if (f.aura) { f.aura = null; n++; }
            ['burn', 'poison', 'slow', 'bleed', 'vuln', 'locked', 'blind', 'shock', 'glitch', 'daltonic', 'shuffled', 'vertigo'].forEach((st) => { this.status[st] = 0; });
            this.heal(p.heal || 12);
            game.floatText(f.x, f.y - 260, n ? 'PURIFICADO! −' + n + ' BUFF' + (n > 1 ? 'S' : '') : 'PURIFICADO!', '#FFF2C4');
            game.spawnBurst('fx2:miko-extra', 1, f.x, f.y - 110, this.dir, 2.4);
          },
        }));
        game.floatText(this.x, this.y - 250, 'KITSUNE!', '#FFD27D');
        break;
      }
      case 'jesterfinale': {
        /* GRANDE FINAL (ult exclusiva do JESTER): marretada com estrela, ✗
           explodindo e chuva de confete; quem leva fica com os BOTOES DE PODER
           EMBARALHADOS (1-5 sorteados) e com TRAVAMENTO nos controles. */
        const rival = game.enemyOf(this);
        if (!rival) break;
        game.strikes.push(new Strike(this, {
          x: rival.x, delay: 14, w: 210, h: 360, dmg: p.dmg || 26, stun: 34, launch: -10, follow: rival,
          sheet: { key, row: p.row, frames: 4 }, scale: 2.4, power: p, sound: 'explosion', shake: 12, warnColor: '#ff4fd8',
          onHit: (f) => {
            if (!f.alive) return;
            const n = Math.max(2, Math.min(5, (f.currentKit() || []).length || 5));
            const rnd = () => (game.rnd ? game.rnd() : Math.random());
            let perm;
            do {
              perm = Array.from({ length: n }, (_, k) => k);
              for (let k = n - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); const t = perm[k]; perm[k] = perm[j]; perm[j] = t; }
            } while (perm.every((v, k) => v === k));
            f._shuf = perm;
            f.addStatus('shuffled', p.shuffle || 480, this);
            f.addStatus('glitch', 120, this);
            game.floatText(f.x, f.y - 260, 'BOTÕES EMBARALHADOS!', '#FF4FD8');
            game.spawnBurst('fx2:jester-extra', 1, f.x, f.y - 110, this.dir, 2.6);
          },
        }));
        game.floatText(this.x, this.y - 250, 'GRANDE FINAL!', '#FFD23A');
        game.shake(6);
        break;
      }
      case 'stackoverflow': {
        /* STACK OVERFLOW (ult exclusiva da LYRA): circulo de runas prende o
           rival, 3 raios caem nele e, no 1o acerto, a pilha estoura — os
           poderes simples dele entram em recarga (4s) e as 2 barras de carga
           caem pela metade. Texto do erro do JS em cima do alvo. */
        const rival = game.enemyOf(this);
        if (!rival) break;
        const rx = rival.x;
        game.zones.push(new Zone(this, { fid, key: 'fx2:lyra-extra', row: 0, x: rx, w: 230, time: 150, dmg: 0.04, slow: 40, power: p }));
        rival.addStatus('paralyze', 40, this);
        game.floatText(rx, rival.y - 250, 'STACK OVERFLOW', '#7DE0FF');
        game.shake(8);
        let blown = false;
        const n = p.hits || 3;
        for (let k = 0; k < n; k++) {
          game.strikes.push(new Strike(this, {
            x: rx, delay: 16 + k * 14, w: 130, h: 420, dmg: p.dmg || 9, stun: 26, launch: k === n - 1 ? -9 : 0,
            follow: rival, fromSky: true, sheet: { key, row: p.row, frames: 4 }, scale: 1.7, power: p,
            sound: 'thunder_cast', shake: 7, warnColor: '#7DE0FF', unblockable: k === n - 1,
            onHit: (f) => {
              if (blown || !f.alive) return;
              blown = true;
              for (let i = 0; i < 2; i++) f.cd[i] = Math.max(f.cd[i] || 0, 240);
              f.charge = (f.charge || [0, 0]).map((c) => c * 0.5);
              game.floatText(f.x, f.y - 280, 'RangeError: Maximum call stack size exceeded', '#FF5A5A');
              game.spawnBurst('fx2:lyra-extra', 1, f.x, f.y - 110, this.dir, 2.6);
            },
          }));
        }
        break;
      }
      case 'rewind': {
        /* REBOBINAR: volta 3 segundos no tempo — vida e posicao restauradas. */
        const hist = this._rewindHist || [];
        const snap = hist.length ? hist[0] : null;
        if (snap) {
          const heal = Math.max(0, snap.hp - this.hp);
          this.hp = Math.min(this.maxHp, snap.hp);
          this.x = snap.x; this.y = snap.y; this.vy = 0;
          this.status = {}; this.hitstun = 0; this.state = 'idle'; this.stateTime = 0;
          game.floatText(this.x, this.y - 250, '⌛ REBOBINADO!', '#ffd27d');
          if (heal > 0) game.floatText(this.x, this.y - 210, '+' + Math.round(heal) + ' VIDA', '#7dff9a');
          game.spawnBurst('abil:maximilian', 4, this.x, this.y - 100, this.dir, 2.4);
          game.shake(8);
        } else {
          game.floatText(this.x, this.y - 250, 'NADA PRA REBOBINAR', '#9adcff');
        }
        break;
      }
      case 'dash': {
        let sp = p.speed || 13;
        if (seek && tgt) this.dir = tgt.x >= this.x ? 1 : -1;
        this.vx = this.dir * sp;
        /* FIX: a janela de hit do dash cobre pelo menos 260px — antes, dashes
           lentos expiravam ANTES de alcançar o alvo (dano zero). */
        const dashNeed = Math.ceil(260 / Math.max(4, sp));
        this.dashHit = { p, t: Math.max(p.phase ? 18 : 16, dashNeed) };
        /* Dash com arte própria (PONTEIRO — Fenda Temporal): rastro com a
           arte da habilidade + afterimages ciano ao longo do blink. */
        if (p.visualSheet) {
          const dkey = 'fx2:' + p.visualSheet;
          const drow = Number.isInteger(p.visualRow) ? p.visualRow : p.row;
          for (let k = 0; k < 3; k++) {
            game.spawnImgFx('arcano', 'projectile', this.x + this.dir * (30 + k * 46), this.y - 100 - k * 10, { scale: 1.6 + k * 0.4, life: 14 });
          }
          game.spawnBurst(dkey.replace('fx2:', 'abil:').replace('-fx', ''), drow, this.x, this.y - 100, this.dir, 2.2);
          if (p.id === 'fenda-temporal') game.floatText(this.x, this.y - 230, 'FENDA TEMPORAL', '#00FFFF');
        }
        /* NUNES — Avanço Flamejante: o rastro de chamas fica no chão. */
        if (p.fireTrail) {
          game.zones.push(new Zone(this, { fid, key, row: Number.isInteger(p.visualRow) ? p.visualRow : p.row, x: this.x, w: 150, time: p.fireTrail, dmg: 0.1, burn: 140, slow: 50, power: p }));
          game.zones.push(new Zone(this, { fid, key, row: Number.isInteger(p.visualRow) ? p.visualRow : p.row, x: this.x + this.dir * 120, w: 150, time: p.fireTrail, dmg: 0.1, burn: 140, slow: 50, power: p }));
        }
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
        if (p.heal) this.heal(p.heal);
        // Golpe de ativação: só alcança a área local; não persegue um alvo
        // que esteja do outro lado da arena durante a telemetria.
        const hitRadius = p.hitRadius || 260;
        const targetDistance = tgt ? Math.abs(tgt.x - this.x) : Infinity;
        if (p.hitDmg && tgt && tgt.alive && targetDistance <= hitRadius) {
          game.strikes.push(new Strike(this, {
            x: this.x + this.dir * hitRadius / 2, delay: 2, w: hitRadius, h: 320, dmg: p.hitDmg,
            stun: p.hitStun || 40, launch: p.hitLaunch == null ? -10 : p.hitLaunch,
            sheet: { key, row: p.row, frames: 4 }, scale: 3, element: el, power: p,
            sound: 'ultimate', shake: 14,
          }));
          game.shake(14);
        }
        if (p.armor) this.addStatus('armor', t);
        if (p.reflect) this.addStatus('reflect', t);
        if (p.dmgMult && p.id === 'rage') { this.addStatus('rage', t); this.status.rageMult = p.dmgMult; }
        if (p.invuln) this.addStatus('invuln', p.invuln);
        if (p.grant) this.addStatus(p.grant, t);
        /* NUNES — Renascer das Cinzas: guarda a posição do clone de fogo. */
        if (p.grant === 'phoenix') this.phoenixClone = { x: this.x };
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
        if (p.visualSheet && game.spawnAbilityImpact) game.spawnAbilityImpact(this, p, this.x, this.y - 100);
        else game.spawnBurst('impact', 3, this.x, this.y - 100, 1, 2.6);
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
          game.strikes.push(new Strike(this, { x: this.x, delay: 4, w: (p.radius || 240) * 2, h: 300, dmg: p.dmg, stun: p.stun == null ? 26 : p.stun, launch: p.launch == null ? -9 : p.launch, sheet: { key, row: p.row, frames: 4 }, scale: 3, element: el, power: p, sound: 'explosion', shake: 12 }));
        } else {
          game.strikes.push(new Strike(this, { x: tx, delay: 14, w: 200, h: 320, dmg: p.dmg, stun: p.stun == null ? 26 : p.stun, launch: p.launch == null ? -9 : p.launch, sheet: { key, row: p.row, frames: 4 }, scale: 2.6, follow: tgt, element: el, power: p, sound: 'explosion', shake: 12 }));
          /* zoneAfter (LARPER — Nuvem da Morte): a explosao deixa uma nuvem no chao */
          if (p.zoneAfter) game.zones.push(new Zone(this, Object.assign({ fid, key, row: p.row, x: tx, w: 220, time: 240, dmg: 0.08, power: p }, p.zoneAfter)));
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
          const wasGuarding = !p.screen && f.onGround && f.blocking && ['idle', 'walk', 'block', 'crouchblock', 'blockstun'].includes(f.state);
          if (f.takeHit(first, { attacker: this, kx: 0, dirSign: side, stun: Math.min(12, p.lock || 24), ability: true, power: p, element: el, height: p.screen ? 'unblockable' : undefined })) {
            // Um bloqueio absorve o primeiro tremor; não vira um segundo golpe
            // unblockable nem um stunlock involuntário.
            if (wasGuarding || !f.alive) continue;
            const hold = Math.max(10, Math.min(QUAKE_HOLD_MAX, p.lock || 24));
            f.vx = 0;
            f.addStatus('freeze', hold + 1);
            f.quakeHold = { t: hold, dmg: Math.max(0, p.dmg - first), kx: p.kx || 22, launch: p.launch || -10, side, by: this, p, el };
          }
        }
        break;
      }
      case 'afo2': {
        /* All For One: Ação Final — TODAS as ultimates do jogo de uma vez.
           Cada lutador do roster dispara sua ultimate no alvo em sequência
           rápida, mostrando o sprite de cada uma; o total fecha em ~250. */
        const stacks = this.castAfo || 0;
        const allIds = (typeof FIGHTERS !== 'undefined' ? FIGHTERS.map((x) => x.id) : Object.keys(POWERS)).filter((id) => id !== 'boneco-treino');
        const ults = allIds.map((id) => {
          const kit = POWERS[id];
          const ult = kit && kit.powers.find((x) => x.slot === 'ultimate');
          return ult ? { fid: id, row: ult.row == null ? 4 : ult.row } : null;
        }).filter(Boolean);
        const n = Math.max(1, ults.length);
        const per = Math.max(2, Math.round(200 / n / (this.dmgMult(p) || 1)));
        if (tgt && tgt.alive) {
          this.dir = tgt.x >= this.x ? 1 : -1;
          game.spawnBurst('chaos', 2, this.x, this.y - 120, this.dir, 3.2);
          game.flashScreen && game.flashScreen('#c77dff', 12);
          let landedAny = false;
          ults.forEach((u, k) => {
            game.strikes.push(new Strike(this, {
              x: tgt.x, delay: 6 + k * 4, w: 220, h: 320, dmg: per, stun: 12, launch: k === ults.length - 1 ? -12 : 0, kx: 0,
              unblockable: true,
              sheet: { key: 'abil:' + u.fid, row: u.row, frames: 4 }, scale: 2, dir: this.dir,
              sound: k % 4 === 0 ? 'explosion' : null, shake: k % 4 === 0 ? 5 : 2, follow: tgt,
              power: p, element: (POWERS[u.fid] || {}).element || 'arcano',
            }));
            if (k % 4 === 0) game.spawnBurst('abil:' + u.fid, u.row, tgt.x, tgt.y - 110, this.dir, 1.6);
          });
          const landed = tgt.takeHit(Math.round(50 + stacks * 5), { attacker: this, height: 'unblockable', kx: 26, dirSign: this.dir, launch: -15, stun: 60 + stacks * 4, ability: true, power: p, element: el, heavy: true, fx: { vuln: 200, lock: 120, blind: 140, shock: 160, slow: 120 } });
          if (landed) {
            tgt.ultimate = Math.max(0, tgt.ultimate - 70);
            tgt.charge[0] = Math.max(0, tgt.charge[0] - 70);
            tgt.charge[1] = Math.max(0, tgt.charge[1] - 70);
            this.heal(8 + stacks * 4);
            this.afo = 0;
          }
        }
        this.flashText(`ALL FOR ONE: AÇÃO FINAL x${stacks} — ${ults.length} ULTS!`, '#ff3b6b');
        game.shake(30);
        break;
      }
      case 'shadowport': {
        const above = (this.game.rnd ? this.game.rnd() : Math.random()) < 0.45;
        this.shadowPort = { phase: 'sink', t: 0, p, above, sinkX: this.x, follow: null };
        this.addStatus('invuln', 14);
        this.vx = 0;
        game.spawnImgFx('portal', 'projectile', this.x, -6, { scale: 2.2, life: 20 });
        /* Teleporte com arte propria (CRACKER — Blink): silhueta -> vortice -> glitch */
        if (p.visualSheet) game.spawnBurst('fx2:' + p.visualSheet, Number.isInteger(p.visualRow) ? p.visualRow : p.row, this.x, this.y - 96, this.dir, 1.6);
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
            x: tx + (k - (n - 1) / 2) * 46 + ((this.game.rnd ? this.game.rnd() : Math.random()) - 0.5) * 20, delay: 18 + k * 7, w: 80, h: 400, dmg: p.dmg / n, stun: 14, launch: k === n - 1 ? -8 : -2,
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
        if (p.range && Math.abs(tgt.x - this.x) > p.range) break;
        game.strikes.push(new Strike(this, {
          x: tgt.x, delay: p.delay || 10, w: p.range ? 130 : 220, h: 400, dmg: p.dmg || 8, stun: 30, launch: 0, unblockable: !p.blockable, follow: tgt,
          maxOwnerRange: p.range || 0, label: p.range ? 'CÓPIA!' : '', warnColor: '#b58bff',
          sheet: { key, row: p.row, frames: 4 }, scale: p.range ? 1.2 : 1.8, power: p, sound: 'steal', shake: p.range ? 4 : 8,
          onHit: (f) => { if (f.state !== 'blockstun') this.stealFrom(f, p.time || 600); },
        }));
        break;
      }
      case 'grabsteal': {
        /* Dash que agarra: avança rápido; se encostar no rival, segura ele
           (estado grabbed) e rouba o kit inteiro na hora. */
        if (tgt) this.dir = tgt.x >= this.x ? 1 : -1;
        this.vx = this.dir * (p.speed || 20);
        this.rush = { p, t: 0, fid, key, hits: 0, grabbed: false };
        this.addStatus('invuln', 10);
        this.state = 'rush';
        this.stateTime = 0;
        break;
      }
      case 'wall': {
        game.walls = game.walls.filter((w) => w.owner !== this);
        game.walls.push(new Wall(this, { x: this.x + this.dir * 96, time: p.time || 360, row: p.row, fid, burn: p.burn || 0, slow: p.slow || 0 }));
        if (tgt && Math.abs(tgt.x - (this.x + this.dir * 96)) < 70) tgt.takeHit(p.dmg || 10, { attacker: this, kx: 8, dirSign: this.dir, launch: -7, ability: true, power: p });
        game.shake(6);
        break;
      }
      case 'zone': {
        game.zones.push(new Zone(this, { fid, key, row: Number.isInteger(p.visualRow) ? p.visualRow : p.row, x: tx, w: 200, time: p.time || 300, dmg: p.dmg || 0.12, slow: p.slow || 0, burn: p.burn || 0, poison: p.poison || 0, fx: p.fx, power: p }));
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
                fid, seek: !!(p.seek || this.autoAim()), homing: p.homing, dmg: p.dmg, angle: -0.9 + (this.game.rnd ? this.game.rnd() : Math.random()) * 1.8, scale: useExtra ? 1.6 : 0.85,
              });
              if (useExtra) { pr.key = extraSheets[k % extraSheets.length][0]; }
              pr.y = -150 - (this.game.rnd ? this.game.rnd() : Math.random()) * 120;
              pr.x = this.x - this.dir * (30 + (this.game.rnd ? this.game.rnd() : Math.random()) * 70);
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
    const powers = f.ownKit().slice(0, 5).map((p) => Object.assign({}, p, { _fid: f.def.id }));
    /* IALES mantém as próprias habilidades 6 a 10 mesmo com kit roubado. */
    if (this.def.id === 'iales') powers.push(...this.ownKit().slice(5).map((p) => Object.assign({}, p)));
    this.stolen = { powers, from: f.def.id, fromName: f.def.name, until: this.now + time, total: time };
    this.addStatus('stolen', time);
    f.addStatus('locked', time);
    f.cast = null;
    this.charge[0] = Math.min(100, this.charge[0] + 50);
    this.charge[1] = Math.min(100, this.charge[1] + 50);
    /* Roubo zera a recarga das 5 habilidades ROUBADAS (slots 0-4) para elas
       saírem prontas — mas as próprias extras do IALES (6-10) continuam no CD
       anti-spam: sem isso o Agarrão Ctrl+C resetava a si mesmo em loop. */
    this.cd = (this.cd || []).map((c, k) => (k < 5 ? 0 : c));
    game.audio.voice('stolen');
    game.announce('PODERES ROUBADOS!', '#c77dff', this.def.name + ' copiou o kit de ' + f.def.name);
    game.events.push({ t: 'steal', who: this.slot, from: f.slot });
  }

  /* ---------- entrada ---------- */
  /** Buffer de 12 quadros: apertos durante hitstop/recuperação saem no 1º quadro livre. */
  press(input) {
    /* Buffer de 16 quadros (era 12): apertos durante hitstop/recuperacao saem
   no 1o quadro livre — combos mais fluidos e inputs perdidos viram golpes. */
    ['punch', 'kick'].concat(Array.from({ length: 10 }, (_, i) => 'a' + i)).forEach((k) => { if (input[k]) this.buf[k] = 16; });
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
    this.game.audio.whiff(kind.includes('kick') ? 'kick' : 'punch');
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
  /* regen do pet (o pitoco cura 15 HP/s — apelao de proposito) */
  _petRegen() {
    if (!this.pet || !this.pet.fx || !this.pet.fx.regen) return;
    if (this.alive && this.hp < this.maxHp && this.game.time % 60 === 0) {
      this.hp = Math.min(this.maxHp, this.hp + this.pet.fx.regen * 60);
    }
  }
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
          this._doubleJumped = false; /* POUSOU: o pulo extra volta */
          if (this.state === 'jump') { this.state = 'idle'; this.stateTime = 0; }
          if (this.launched && (this.state === 'hit' || this.state === 'thrown')) {
            this.state = 'down';
            this.stateTime = 0;
            this.hitstun = 0;
            game.shake(4);
            game.spawnBurst('impact', 2, this.x, -16, 1, 1.4);
          }
          this.landT = 6; /* aterrissagem fluida: menos lag de pouso */
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
    /* poeira leve ao correr no chao (mais frequente quando rapido) */
    if (this.alive && this.onGround && this.state === 'walk' && Math.abs(this.vx) > 3.2) {
      const fast = Math.abs(this.vx) > 6;
      if ((game.rnd ? game.rnd() : Math.random()) < (fast ? 0.16 : 0.07)) game.dust(this.x - this.dir * 12, 'rgba(215,205,180,0.55)', 1);
    }
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
    /* MAXIMILIAN — REBOBINAR: guarda a propria historia a cada 30 ticks.
       A ultimate 'rewind' restaura vida e posicao de 3 segundos atras. */
    if (this.def.id === 'maximilian' && this.alive && game.time % 30 === 0) {
      if (!this._rewindHist) this._rewindHist = [];
      this._rewindHist.push({ hp: this.hp, x: this.x, y: this.y, t: game.time });
      if (this._rewindHist.length > 7) this._rewindHist.shift();
    }
    /* PONTEIRO — Passiva Campo Lento: oponentes perto dele sofrem 15% de
       lentidão SEMPRE (o tempo obedece ao Relojoeiro). */
    if (this.def.id === 'ponteiro' && this.alive && game.time % 8 === 0) {
      for (const foe of game.opponentsOf(this)) {
        if (foe.alive && Math.abs(foe.x - this.x) < 190) foe.addStatus('slow', 14);
      }
    }
    /* NUNES — Passiva Fagulha Viva: dentro do próprio fogo ele regenera vida
       (desativada no modo MORTE SÚBITA, onde a arena já é um incêndio). */
    if (this.def.id === 'nunes' && this.alive && this.onGround && this.hp > 0
        && !(game.inferno && game.inferno.active) && this.now % 10 === 0
        && game.zones && game.zones.some((z) => z.owner === this && Math.abs(this.x - z.x) < z.w / 2)) {
      this.hp = Math.min(this.maxHp, this.hp + 0.7); /* era 1.4 (8,4 HP/s): curava rapido demais */
    }
    this.syncControlMemory();
    this.frame++;
    this.stateTime++;
    this.lastInput = input;
    if (this.flash && this.now > this.flashUntil) this.flash = null;
    if (this.flashWhite) this.flashWhite--;
    if (this.castLock > 0) this.castLock--;
    if (this.spamShared > 0) this.spamShared--;
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
      if (this.has('nanomachines')) this.nanoElectricPulse();
      if (this.redHp > this.hp + 0.3) {
        this._ghostWait = (this._ghostWait == null ? 16 : this._ghostWait) - 1;
        if (this._ghostWait <= 0) this.redHp = Math.max(this.hp, this.redHp - Math.max(0.55, (this.redHp - this.hp) * 0.045));
      } else {
        this.redHp = this.hp;
        this._ghostWait = 16;
      }
      if (this.has('burn') && this.frame % 20 === 0) this.chip(0.9, this.statusSource.burn);
      if (this.has('poison') && this.frame % 24 === 0) this.chip(0.8, this.statusSource.poison);
      if (this.has('bleed') && this.frame % 16 === 0) { this.chip(0.7, this.statusSource.bleed); if (this.frame % 32 === 0) this.game.spark(this.x, this.y - 110, '#ff2d55'); }
      if (this.has('shock') && this.frame % 9 === 0) this.game.spark(this.x + ((this.game.rnd ? this.game.rnd() : Math.random()) - 0.5) * 50, this.y - 60 - (this.game.rnd ? this.game.rnd() : Math.random()) * 100, '#7df9ff');
      if (this.has('chill') && this.frame % 12 === 0) this.game.spark(this.x + ((this.game.rnd ? this.game.rnd() : Math.random()) - 0.5) * 50, this.y - 40 - (this.game.rnd ? this.game.rnd() : Math.random()) * 120, '#d8f6ff');
      /* BURACO NEGRO do KERNOR: puxa o rival pro centro enquanto dura */
      /* FASE 2 do chefe: abaixo de metade da vida, fúria + super armadura */
      if (this.bossPhase && this.alive && this.hp > 0 && this.hp <= this.maxHp * 0.5) {
        if (!this.enrage) {
          this.enrage = 1.3;
          this.game.announce('FASE 2', '#ff2a4a', 'NÚCLEO EM FÚRIA');
          this.game.shake(16);
          this.game._bossDim = 40;
        }
        if (!this.has('armor')) this.addStatus('armor', 150);
      }
      if (this.kHole && this.kHole.t > 0) {
        this.kHole.t--;
        const rv = this.game.enemyOf(this);
        if (rv && rv.alive && !rv.has('invuln')) { const dx = this.kHole.x - rv.x; if (Math.abs(dx) > 8) rv.x += Math.sign(dx) * Math.min(3.2, Math.abs(dx) * 0.05 + 1); }
        if (this.kHole.t <= 0) this.kHole = null;
      }
      /* DALTONIC (ult da Jess): lentidao constante + gas rosa subindo do vitima */
      if (this.has('daltonic')) {
        this.addStatus('slow', 30);
        if (this.frame % 5 === 0) this.game.spark(this.x + ((this.game.rnd ? this.game.rnd() : Math.random()) - 0.5) * 170, this.y - 20 - (this.game.rnd ? this.game.rnd() : Math.random()) * 170, '#ff7ad9', { count: 2, speed: 1.1 });
      }
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
    /* VERTIGEM (ult da Mis): pro humano a tela vira de cabeca pra baixo (game.js).
       CPU (ou humano com movimento reduzido) nao ve tela nenhuma: os controles invertem. */
    if (this.has('vertigo') && input && this.game && this.game.cfg && ((this.game.cfg.cpu && this.game.cfg.cpu[this.team]) || this.game.reduced)) {
      input = Object.assign({}, input, { left: input.right, right: input.left, up: input.down, down: input.up });
    }
    if (this.has('glitch')) input = this.glitchInput(input);
    if (this.has('daltonic')) input = this.daltonicInput(input);
    if (this.has('shuffled')) input = this.shuffledInput(input);
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

    if (this.has('freeze') || this.has('trap') || this.has('paralyze')) {
      this.state = 'hit';
      this.vx *= 0.5;
      this.physics();
      return this.endUpdate(input);
    }
    if (this.state === 'down') {
      /* WAKE-UP ATTACK: no fim da queda, soco/chute levanta ATACANDO
         com invencibilidade — o canto deixa de ser sentença. */
      if (this.stateTime > 18 && this.stateTime <= 35 && (this.buf.punch || this.buf.kick)) {
        const getup = this.buf.kick ? 'kick' : 'punch';
        this.buf.punch = 0; this.buf.kick = 0;
        this.state = 'idle'; this.stateTime = 0;
        this.startAttack(getup);
        this.addStatus('invuln', 14); /* i-frames DEPOIS do attack (o startAttack limpa status) */
        if (this.game.floatText) this.game.floatText(this.x, this.y - 220, 'WAKE-UP!', '#9adcff');
        Profile.grantAchievement('wake-up');
        return this.endUpdate(input);
      }
      this.physics();
      if (this.stateTime > 35) { this.state = 'idle'; this.stateTime = 0; this.addStatus('invuln', 10); }
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
      /* rastro de poeira no dash */
      if (!game.reduced && this.stateTime % 3 === 0) game.dust(this.x - this.dir * 14, 'rgba(200,215,255,0.4)', 1);
      if (this.stateTime > total) { this.state = 'idle'; this.stateTime = 0; this.perfectDone = false; }
    } else this.tryActions(input);
    this._petRegen();
    if (this.petTick) this.petTick(); /* pets dev: npm, sonar, debug, goroutines */
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
      if (input.up && this.onGround && (mv.kind === 'kick' || mv.kind === 'cpunch' || mv.kind === 'punch') && this.chain < 5) {
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
    const cap = 6 + (this.sig.chainBonus || 0); /* +1 de fluidez: combos-alvo mais longos */
    if (this.chain >= cap) return null;
    let n = null;
    if (!this.onGround) {
      if (this.airChain >= 4) return null; /* air combo fluido: ate 4 golpes no ar */
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
        if (sp.p.visualSheet) game.spawnBurst('fx2:' + sp.p.visualSheet, Number.isInteger(sp.p.visualRow) ? sp.p.visualRow : sp.p.row, this.x, this.y - 96, this.dir, 1.6);
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
      /* BHM: ao sair do portal, solta uma SEQUENCIA AUTOMATICA de socos e
         chutes no rival — combo de 5 golpes se ele estiver perto. */
      if (this.def.id === 'bhm') {
        const t = this.enemy();
        if (t && t.alive && Math.abs(t.x - this.x) < 260) {
          this.autoCombo = ['punch', 'kick', 'punch', 'ckick', 'kick'];
          this.flashText('COMBO DAS SOMBRAS!', '#4da3ff');
        }
      }
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
      /* FIX: velocidade CONSTANTE durante a janela do dash — antes o atrito
         matava o vx em ~113px e dashes nunca alcançavam o alvo. */
      this.vx = this.dir * (p.speed || 13);
      if (!this.hasHit) {
        for (const t of this.game.opponentsOf(this)) {
          const hb = { x: this.x - 50, y: this.y - 150, w: 100, h: 130 };
          if (t.alive && boxesOverlap(hb, t.hurtbox())) {
            this.hasHit = true;
            t.takeHit(p.dmg, { attacker: this, kx: p.kx || 7, dirSign: this.dir, stun: p.stun || 20, launch: p.launch != null ? p.launch : -4, burn: p.burn, poison: p.poison, slow: p.slow, trap: p.trap, freeze: p.freeze, ability: true, power: p, element: this.elementOf(p) });
            this.game.spawnAbilityImpact(this, p, t.x, t.y - 100);
            /* o golpe pode ser REVIDADO (espinhos/reflexo/contra-ataque): o
               atacante leva o hit, takeHit zera cast/dashHit — a habilidade acabou */
            if (this.cast !== c || !this.dashHit) return;
          }
        }
      }
      if (this.dashHit && this.dashHit.t <= 0) this.dashHit = null;
    }
    const len = this.dashHit ? 18 : (c.p.slot === 'ultimate' ? 28 : 18);
    if (c.t > len && !this.queue.length) {
      /* DASH ERRADO (whiff): recovery extra de punicao (ficha do Dev Virado:
         "errou o dash, apanhou" — hitstun extra enquanto a janela passou vazia) */
      const whiffed = !this.hasHit && c.p.kind === 'dash' && c.p.slot !== 'ultimate' && c.p.whiffRecovery;
      this.cast = null;
      this.dashHit = null;
      if (whiffed) this.hitstun = Math.max(this.hitstun, c.p.whiffRecovery);
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
    if (r.p.kind === 'grabsteal') {
      const finish = () => { this.rush = null; this.cast = null; this.vx = 0; this.state = 'idle'; this.stateTime = 0; };
      if (r.t > 28 || !t || !t.alive) { finish(); return; }
      this.vx = this.dir * (r.p.speed || 20);
      if (Math.abs(t.x - this.x) < 90 && Math.abs(t.y - this.y) < 120 && !t.has('invuln')) {
        const landed = t.takeHit(r.p.dmg || 12, { attacker: this, height: 'high', kx: 0, dirSign: this.dir, stun: 28, ability: true, power: r.p });
        if (landed && t.state !== 'blockstun') {
          this.stealFrom(t, r.p.time || 600);
          this.game.spawnBurst('abil:' + r.fid, r.p.row, t.x, t.y - 110, this.dir, 1.4);
          this.game.shake(8);
        }
        finish();
      }
      return;
    }
    if (t && Math.abs(t.x - this.x) > 80) this.vx = this.dir * 7;
    if (r.t % 7 === 0 && r.hits > 0 && t) {
      r.hits--;
      const last = r.hits === 0;
      if (Math.abs(t.x - this.x) < 140 && Math.abs(t.y - this.y) < 160) {
        const landed = t.takeHit(r.p.dmg / (r.p.hits || 5), { attacker: this, kx: last ? 12 : 1.5, dirSign: this.dir, stun: 22, launch: last ? -10 : 0, noScale: true, ability: true, power: r.p, element: this.elementOf(r.p), heavy: last });
        if (landed) r.landed = true;
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
      /* rush que nao acertou nenhum hit: mesma punicao de dash errado */
      if (r.p.whiffRecovery && !r.landed) this.hitstun = Math.max(this.hitstun, r.p.whiffRecovery);
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
    /* Combo automatico (BHM pos-teleporte): encadeia socos e chutes sem
       entrada do jogador; entre um golpe e outro da um PASSO SOMBRO pra
       perto do rival, estilo Noob Saibot. */
    if (this.autoCombo && this.autoCombo.length && this.state === 'idle' && this.canAct() && this.onGround) {
      const t = this.enemy();
      if (t && t.alive && Math.abs(t.x - this.x) < 260) {
        this.dir = t.x >= this.x ? 1 : -1;
        if (Math.abs(t.x - this.x) > 96) {
          this.x = t.x - this.dir * 88;
          game.spawnImgFx('portal', 'projectile', this.x, -6, { scale: 1.4, life: 10 });
        }
        this.startAttack(this.autoCombo.shift());
        return;
      }
      this.autoCombo = null;
    }
    if (this.tryAbilities()) return;
    if (!this.onGround) {
      /* DOUBLE JUMP pra todos: um pulo extra no ar (renova o airAction) */
      if (input.up && !this._doubleJumped && !this.cast && !this.attack) {
        this._doubleJumped = true;
        this.airAction = false;
        this.airChain = 0;
        const spd2 = WALK_SPEED * this.speedMult();
        const jump2 = (12.4 + (1.1 - this.weight()) * 3) * (this.game.jumpMul || 1) * 0.92;
        this.vy = -jump2;
        let dx2 = 0;
        if (input.left) dx2 -= 1;
        if (input.right) dx2 += 1;
        this.vx = dx2 * spd2 * 1.15;
        this.state = 'jump';
        this.stateTime = 0;
        this.game.audio.jump();
        this.game.floatText(this.x, this.y - 200, 'DOUBLE JUMP', '#ffd27d');
        this._djCount = (this._djCount || 0) + 1;
        if (this._djCount === 50) Profile.grantAchievement('double-jump-50');
        return;
      }
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
    /* PARRY: lembra o quadro em que a guarda comecou (segurou pra tras agora) */
    if (back && !this._backHeld) this._blockStart = this.now;
    this._backHeld = !!back;
    /* POSTURA DEFENSIVA: andar pra tras deixa a guarda alta — absorve 15% */
    this.guardUp = !!(back && !input.down && this.canAct() && this.state !== 'attack' && !this.cast);
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
  /** Travamento: três frames de atraso espaçados; o relógio e a simulação continuam. */
  glitchInput(input) {
    const i = Object.assign({}, input);
    const phase = this.now % 36;
    if (phase >= 31 && phase < 34) {
      ['left', 'right', 'down', 'up', 'punch', 'kick'].forEach((key) => { i[key] = false; });
      for (let k = 0; k < 10; k++) i['a' + k] = false;
    }
    return i;
  }
  /** Embaralhado (ult do JESTER): os botoes de poder 1-5 viram outros poderes,
      numa ordem sorteada quando a marreta acerta (this._shuf). */
  shuffledInput(input) {
    const perm = this._shuf;
    if (!perm) return input;
    const i = Object.assign({}, input);
    for (let k = 0; k < perm.length; k++) i['a' + k] = input['a' + perm[k]];
    return i;
  }
  /* nuvem de gas rosa em volta da vitima do Daltonic Mode (6 baforadas que
     giram devagar + nevoa no chao); 'lighter' pra brilhar em qualquer arena */
  _drawDaltonicCloud(ctx) {
    const t = this.frame;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 6; k++) {
      const a = t * 0.03 + k * 1.047;
      const gx = this.x + Math.cos(a) * 62;
      const gy = this.y - 105 + Math.sin(a * 1.3) * 70;
      const r = 70 + 14 * Math.sin(t * 0.07 + k);
      const g = ctx.createRadialGradient(gx, gy, 4, gx, gy, r);
      g.addColorStop(0, 'rgba(255,122,217,0.30)');
      g.addColorStop(0.6, 'rgba(240,90,200,0.12)');
      g.addColorStop(1, 'rgba(230,60,190,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(gx, gy, r, 0, 6.3); ctx.fill();
    }
    const fl = ctx.createRadialGradient(this.x, this.y - 6, 6, this.x, this.y - 6, 150);
    fl.addColorStop(0, 'rgba(255,120,215,0.28)');
    fl.addColorStop(1, 'rgba(255,120,215,0)');
    ctx.fillStyle = fl;
    ctx.beginPath(); ctx.ellipse(this.x, this.y - 6, 150, 34, 0, 0, 6.3); ctx.fill();
    ctx.restore();
  }
  /** Daltônico (ult da Jess): direções invertidas e botões de poder espelhados.
      As teclas 1-5 (a0..a4 do kit) são espelhadas dentro do kit do lutador:
      1<->5, 2<->4, 3 fica. */
  daltonicInput(input) {
    const i = Object.assign({}, input);
    const l = i.left; i.left = i.right; i.right = l;
    const u = i.up; i.up = i.down; i.down = u;
    const n = Math.max(1, Math.min(10, (this.currentKit() || []).length || 5));
    for (let k = 0; k < n / 2; k++) { const t = i['a' + k]; i['a' + k] = i['a' + (n - 1 - k)]; i['a' + (n - 1 - k)] = t; }
    return i;
  }
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
      let dv = this.state === 'dash' ? (fast ? 11 : 8.6) : (fast ? 8 : 6.6);
      if (this.game.weather && this.game.weather.kind === 'leaves') dv *= 1.10; /* folhas: dash 10% mais longo */
      this.vx = sign * dv;
      if (this.state === 'backdash') this.addStatus('invuln', 6);
    }
    this.game.audio.dash();
    this.game.dust(this.x, 'rgba(205,220,255,0.8)', 4); /* poeira no comeco do dash */
    this.game.dust(this.x);
    if (typeof VFX !== 'undefined') VFX.dashLines(this.x, this.y, sign, this.game.reduced);
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
    const n = SpriteGen.count(pose, this.spriteKey());
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
      /* auraScale/auraDy (opcional, por poder): aura que precisa ENVOLVER o
         corpo (CYBER — Ciberneurose: chama em volta do robo) */
      Art.ability(ctx, fid, this.aura.row, Math.floor(t / 5), this.x, this.y - 92 + (this.aura.auraDy || 0), { scale: this.aura.auraScale || 1.75, add: true });
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
        /* respirar: peito sobe/desce + leve balanco de peso de um pe pro outro */
        const b = Math.sin(t * 0.075);
        sy = 1 + b * 0.018; sx = 1 - b * 0.01;
        rot = Math.sin(t * 0.031) * 0.012;
        dx = Math.sin(t * 0.031) * 1.2;
        if (pose === 'win') dy = -Math.abs(Math.sin(t * 0.09)) * 3;
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
        sy = 1 + Math.abs(v) * 0.04; sx = 1 - Math.abs(v) * 0.03;
        rot = -v * 0.03;
        break;
      }
      case 'crouch': sy = 0.985; break;
      case 'hit': {
        const k = Math.max(0, 1 - this.stateTime / 14);
        rot = -0.07 * k; dx = -4 * k;
        dx += (t % 2 ? 1 : -1) * k;
        break;
      }
      case 'block': dx = -2 * Math.max(0, 1 - this.stateTime / 8); break;
      case 'special': {
        const k = ease(this.stateTime / 10);
        sx = 1 + 0.025 * k; sy = 1 - 0.012 * k; dx = 4 * k;
        break;
      }
      default: {
        // golpes: antecipação curta e avanço no quadro ativo
        const mv = this.attack;
        if (mv) {
          const st = this.stateTime;
          if (st < mv.startup) { const k = st / Math.max(1, mv.startup); dx = -3 * k; rot = -0.03 * k; }
          else if (st < mv.startup + mv.active + 2) { dx = 9; rot = 0.04; sx = 1.06; sy = 0.98; } /* esticada no golpe */
          else { const k = 1 - (st - mv.startup - mv.active) / Math.max(1, mv.recovery); dx = 6 * Math.max(0, k); rot = 0.03 * Math.max(0, k); }
        }
      }
    }
    if (this.landT > 0 && this.onGround) {
      const k = (this.landT / 9) * (0.5 + 0.5 * (this.landHard || 0.5));
      sy *= 1 - 0.06 * k; sx *= 1 + 0.05 * k;
    }
    /* SUAVIZACAO: a transformacao persegue o alvo (lerp) em vez de pular de
       pose em pose — troca de golpe/andar/parado sai sem "estalo". Golpe ativo
       e dano entram mais rapido (impacto), o resto acomoda devagar. */
    const S = this._xfS || (this._xfS = { sx: 1, sy: 1, rot: 0, dx: 0, dy: 0 });
    const fast = this.state === 'hit' || (this.attack && this.stateTime >= this.attack.startup && this.stateTime < this.attack.startup + this.attack.active + 2);
    const a = fast ? 0.65 : 0.3;
    S.sx += (sx - S.sx) * a; S.sy += (sy - S.sy) * a; S.rot += (rot - S.rot) * a; S.dx += (dx - S.dx) * a; S.dy += (dy - S.dy) * a;
    return { sx: S.sx, sy: S.sy, rot: S.rot, dx: S.dx, dy: S.dy };
  }
  draw(ctx) {
    if (this.benched || this.hidden || this._netHide > 0) return;
    const pose = this.animPose();
    const frame = this.animFrame(pose);
    const game = this.game;
    const xf = this.motionXf(pose);
    /* sombra suave: gradiente radial que some no pulo */
    const sh = 40 * (1 - Math.min(Math.abs(this.y) / 260, 0.6));
    const shA = 0.45 * (1 - Math.min(Math.abs(this.y) / 300, 0.7));
    if (shA > 0.02) {
      const sg = ctx.createRadialGradient(this.x, 2, 2, this.x, 2, Math.max(14, sh));
      sg.addColorStop(0, `rgba(0,0,0,${shA})`);
      sg.addColorStop(0.7, `rgba(0,0,0,${shA * 0.5})`);
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg;
      ctx.save();
      ctx.translate(this.x, 2);
      ctx.scale(1, 0.32);
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(14, sh), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // mascote
    if (this.pet && this.alive) {
      const px = this.x - this.dir * 78;
      const py = this.y - 168 + Math.sin(this.frame * 0.07) * 6;
      if (this.pet.row >= 0) {
        Art.cell(ctx, 'pets', this.pet.row, Math.floor(this.frame / 10), px, py, { scale: 0.62, dir: this.dir });
      } else if (this.pet.id === 'pitoco') {
        /* A folha do Pitoco desenha o cachorro olhando para a ESQUERDA (dir=1 sem flip),
           diferente da folha 'pets' — por isso ele precisa de dir invertido para
           acompanhar o dono e olhar pro lado da luta. */
        Art.cell(ctx, 'pitoco', 0, Math.floor(this.frame / 10), px, py, { scale: 0.62, dir: -this.dir });
      } else if (this.pet.sheet) {
        /* pets dev tem 3 linhas: parado, susto (dono apanhou) e comemora */
        const prow = this.pet.sheet.startsWith('pet-') && this.petRow ? this.petRow() : 0;
        Art.cell(ctx, this.pet.sheet, prow, Math.floor(this.frame / (prow === 1 ? 7 : 10)), px, py - (prow === 2 ? Math.abs(Math.sin(this.frame * 0.25)) * 8 : 0), { scale: 0.62, dir: this.dir });
      }
    }
    if (this.drawPetFx && this._pfxl && this._pfxl.length && !game._reflecting) {
      try { this.drawPetFx(ctx); } catch (e) { /* efeito do pet nunca quebra o quadro */ }
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
    /* SOMBRA DINAMICA no chao: maior e mais opaca perto do chão, some no ar */
    if (!game.reduced && this.onGround === false && this.y < 0) {
      const gy = game.stage && game.stage.groundY ? game.stage.groundY : 458;
      const airDist = Math.min(1, Math.abs(this.y) / 120);
      const sAlpha = 0.35 * (1 - airDist);
      const sSize = 34 * (1 - airDist * 0.5);
      ctx.save();
      ctx.globalAlpha = sAlpha;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(this.x, gy, sSize, sSize * 0.35, 0, 0, 6.3);
      ctx.fill();
      ctx.restore();
    }
    /* SOMBRA PROJETADA pela luz do mapa (sol, lampada ou luz de cima): copia
       achatada do proprio sprite, preta, inclinada pro lado oposto da luz.
       Some no pulo. So onde ctx.filter funciona (testado 1x). */
    if (!game.reduced && !game._reflecting && game.qFxOn !== false && Fighter.silhouetteOk() && !this.has('cloak')) {
      const st = game.stage;
      const lx = st && st._sun ? st._sun.x : st && st.lights && st.lights.length ? st.lights[0].x : (game.W || 960) / 2;
      const ly = st && st._sun ? st._sun.y : st && st.lights && st.lights.length ? st.lights[0].y : -200;
      const skew = Math.max(-1.3, Math.min(1.3, (this.x - lx) / Math.max(160, 520 - Math.max(0, ly))));
      const fade = Math.max(0, 1 - Math.abs(this.y) / 140);
      if (fade > 0.05) {
        ctx.save();
        ctx.globalAlpha *= 0.42 * fade;
        ctx.filter = 'brightness(0) blur(1px)';
        ctx.translate(this.x, 0);
        ctx.transform(1, 0, -skew * 0.9, -0.34, 0, 0); /* deitada no chao, na frente do pe */
        ctx.translate(-this.x, 0);
        SpriteGen.blit(ctx, this.spriteKey(), pose, frame, this.dir, this.x, 0, false, null, null, 0);
        ctx.restore();
      }
    }
    if (this.has('rage') || this.has('armor')) {
      ctx.shadowColor = this.has('rage') ? '#ff4b1c' : '#ffd27d';
      ctx.shadowBlur = 18;
    }
    /* HALO DE LUZ por status ativo — brilho ao redor do lutador */
    if (!game.reduced) {
      const halo = this.has('overclock') ? { c: '#00f0ff', a: 0.5, r: 46 }
        : this.has('astra') ? { c: '#a78bff', a: 0.55, r: 52 }
        : this.has('trans') ? { c: '#7dff5e', a: 0.5, r: 50 }
        : this.has('phoenix') ? { c: '#FF7A1A', a: 0.45, r: 48 }
        : this.has('aura') && this.aura ? { c: this.aura.color || '#c77dff', a: 0.4, r: 44 }
        : null;
      if (halo) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = halo.a * (0.7 + 0.3 * Math.sin(this.frame * 0.15));
        const g = ctx.createRadialGradient(this.x, this.y - 90, 0, this.x, this.y - 90, halo.r);
        g.addColorStop(0, halo.c);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(this.x, this.y - 90, halo.r, 0, 6.3); ctx.fill();
        ctx.restore();
      }
    }
    if (this.has('chill')) ctx.filter = 'saturate(0.6) hue-rotate(160deg) brightness(1.15)';
    else if (this.has('shock') && this.frame % 6 < 2) ctx.filter = 'brightness(1.8) saturate(0.4)';
    else if (this.has('overclock')) { ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 16; }
    const skinHue = (this.skinHue || 0);
    /* RIM LIGHT: aura na cor do time atras do sprite (radial 'lighter') + 4 copias
       do sprite deslocadas 1px com 'lighter' = contorno claro ao redor. Funciona
       em qualquer canvas (nao depende de shadow/filter). */
    const qRim = game.qRim == null ? 1 : game.qRim; /* qualidade baixa desliga o rim; alta reforça */
    if (!game.reduced && qRim > 0 && !this.has('rage') && !this.has('armor') && !this.has('overclock')) {
      const tc = this.team === 0 ? '63,208,255' : '255,75,107';
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const rg = ctx.createRadialGradient(this.x, this.y - 90, 6, this.x, this.y - 90, 56);
      rg.addColorStop(0, 'rgba(' + tc + ',' + Math.min(0.5, 0.30 * qRim).toFixed(3) + ')');
      rg.addColorStop(0.7, 'rgba(' + tc + ',' + Math.min(0.22, 0.12 * qRim).toFixed(3) + ')');
      rg.addColorStop(1, 'rgba(' + tc + ',0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(this.x, this.y - 90, 56, 0, 6.3); ctx.fill();
      ctx.globalAlpha = Math.min(0.45, 0.28 * qRim);
      for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        SpriteGen.blit(ctx, this.spriteKey(), pose, frame, this.dir, this.x + ox, this.y + oy, false, null, null, 0);
      }
      ctx.restore();
    }
    /* DALTONIC (ult da Jess) visto de FORA: quando a tela inteira nao fica
       cinza (vitima e a CPU, ou 2 jogadores no mesmo PC), a propria vitima
       aparece descolorida e turva dentro de uma nuvem de gas rosa — antes
       nesses casos a ult parecia nao fazer nada. */
    const daltonicHere = this.has('daltonic') && !this.game._daltonicOn;
    if (daltonicHere) {
      this._drawDaltonicCloud(ctx);
      ctx.filter = 'grayscale(1) blur(1.2px) brightness(0.9)';
    }
    /* TRANSICAO ENTRE POSES: nos 5 quadros depois de trocar de pose, a pose
       anterior ainda aparece por baixo, sumindo (crossfade) — 4 quadros por
       pose deixam de "pular". */
    if (!game.reduced && !game._reflecting && game.qFxOn !== false) {
      const key = pose + ':' + frame;
      if (this._poseKey !== key) {
        if (this._poseKey && this._lastPose !== pose) this._blend = { pose: this._lastPose, frame: this._lastFrame, t: 5 };
        this._poseKey = key; this._lastPose = pose; this._lastFrame = frame;
      }
      if (this._blend && this._blend.t > 0) {
        const ga = ctx.globalAlpha;
        ctx.globalAlpha = ga * (this._blend.t / 5) * 0.55;
        SpriteGen.blit(ctx, this.spriteKey(), this._blend.pose, this._blend.frame, this.dir, this.x, this.y, false, null, xf, skinHue);
        ctx.globalAlpha = ga;
        this._blend.t--;
      }
    }
    SpriteGen.blit(ctx, this.spriteKey(), pose, frame, this.dir, this.x, this.y, this.flashWhite > 0 && this.frame % 2 === 0, null, xf, skinHue);
    ctx.filter = 'none';
    ctx.restore();
    /* ACESSÓRIO universal ligado (ex.: gorro de natal) — pendurado na cabeça
       pela âncora automática do sprite (1ª linha opaca da célula da pose),
       com flip na direção e um balançozinho. Funciona em qualquer lutador. */
    const accHide = SPRITE_LAYOUT.perFighter && SPRITE_LAYOUT.perFighter[this.spriteKey()] && SPRITE_LAYOUT.perFighter[this.spriteKey()].accHide;
    /* accHide: poses em que a cabeca nao da pra achar (de ponta-cabeca, deitado,
       cajado/elefante colado em cima da cabeca) — melhor sem chapeu que flutuando */
    if (typeof ACC_LIST !== 'undefined' && typeof accAnyOn === 'function' && accAnyOn() && !(accHide && accHide.includes(pose))) {
      const L = SPRITE_LAYOUT;
      const ownL = L.perFighter && L.perFighter[this.spriteKey()];
      const sc = (ownL && ownL.poseScale && ownL.poseScale[pose]) || L.drawScale || 1;
      /* cabeça MEDIDA no sprite (SpriteGen.headBox): cada acessório encaixa no
         lugar dele (chapéu sentado, óculos nos olhos...) e no tamanho da cabeça */
      const box = SpriteGen.headBox(this.spriteKey(), pose);
      const cellLeft = this.x - (L.frameW / 2) * sc * this.dir;
      const cellTop = this.y - L.baseline * sc;
      const bob = Math.sin(this.frame * 0.12) * 1.2;
      const order = (typeof ACC_DRAW_ORDER !== 'undefined') ? ACC_DRAW_ORDER : ['top'];
      const list = ACC_LIST.slice().sort((p, q) => order.indexOf(p.fit) - order.indexOf(q.fit));
      for (const acc of list) {
        if (typeof accOn === 'function' && !accOn(acc.id)) continue;
        const img = (typeof ACC_IMAGES !== 'undefined') && ACC_IMAGES[acc.id];
        if (!img || !(img.complete && (img.naturalWidth || img.width))) continue;
        const pl = accPlacement(acc, box, sc, img.naturalWidth || img.width, img.naturalHeight || img.height);
        const w = Math.round(pl.w), h = Math.round(pl.h);
        const ax = cellLeft + (pl.x + pl.w / 2) * this.dir; /* centro do acessório na tela */
        const ay = cellTop + pl.y + (acc.fit === 'top' ? bob : bob * 0.5);
        ctx.save();
        ctx.translate(Math.round(ax), Math.round(ay));
        if (this.dir < 0) ctx.scale(-1, 1);
        if (acc.fit === 'top') ctx.rotate(Math.sin(this.frame * 0.09) * 0.04);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, -Math.round(w / 2), 0, w, h);
        ctx.restore();
      }
    }
    if (this.has('glitch') && !game.reduced && this.frame % 24 < 5) {
      const jitter = (this.frame % 4) - 1.5;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.62;
      ctx.fillStyle = '#48dfff';
      ctx.fillRect(this.x - 30 + jitter, this.y - 138, 60, 3);
      ctx.fillStyle = '#f06bff';
      ctx.fillRect(this.x - 24 - jitter, this.y - 77, 48, 2);
      ctx.restore();
    }
    if (this.has('shock') && this.frame % 5 === 0) Art.fx2(ctx, 'lightning', 2, Math.floor(this.frame / 3), this.x, this.y - 100, { scale: 1.1, alpha: 0.7 });
    if (this.has('blind')) Art.fx2(ctx, 'chaos', 1, Math.floor(this.frame / 6), this.x, this.y - 170, { scale: 0.7, alpha: 0.6 });
    // status visuais
    if (this.has('trap')) Art.ability(ctx, 'felipinho', 0, 3, this.x, this.y - 96, { scale: 1.9, alpha: 0.75 });
    if (this.has('freeze')) Art.fx2(ctx, 'arcane', 0, Math.floor(this.frame / 6), this.x, this.y - 96, { scale: 3, alpha: 0.75 });
    if (this.has('burn') && this.frame % 3 === 0) game.spark(this.x + ((this.game.rnd ? this.game.rnd() : Math.random()) - 0.5) * 40, this.y - 40 - (this.game.rnd ? this.game.rnd() : Math.random()) * 120, '#ff7b1c');
    if (this.has('poison') && this.frame % 4 === 0) game.spark(this.x + ((this.game.rnd ? this.game.rnd() : Math.random()) - 0.5) * 40, this.y - 40 - (this.game.rnd ? this.game.rnd() : Math.random()) * 120, '#9dff4a');
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
    return [Math.round(this.x), Math.round(this.y), this.dir, this.state, this.stateTime, Math.round(this.hp * 10) / 10, Math.round(this.charge[0]), Math.round(this.charge[1]), Math.round(this.ultimate), this.frame, this.walkPhase, this.attack ? this.attack.kind : 0, this.status, this.stolen ? { from: this.stolen.from, until: this.stolen.until, total: this.stolen.total } : 0, this.cd, this.afo, this.aura ? this.aura.id : 0, this.flash || 0, this.benched ? 1 : 0, this.flashWhite || 0, this.redHp, this.shield, Math.round(this.stunGauge), this.statusPulse, this.hardControl, this._controlRound, this.spamShared || 0, this.castLock || 0];
  }
  applySnap(s) {
    /* NETCODE VISUAL: se o salto do snapshot for grande (lag), esconde o
       lutador por 3 ticks em vez de teleportar na cara do jogador. */
    if (this._netHide > 0) this._netHide--;
    const saltoX = Math.abs((s[0] || 0) - this.x);
    const saltoY = Math.abs((s[1] || 0) - this.y);
    if (saltoX > 130 || saltoY > 130) this._netHide = 3;
    [this.x, this.y, this.dir, this.state, this.stateTime, this.hp, this.charge[0], this.charge[1], this.ultimate, this.frame, this.walkPhase] = s;
    this.attack = s[11] ? { kind: s[11], startup: 3, active: 3, recovery: 8 } : null;
    this.status = s[12] || {};
    if (s[13]) {
      const f = POWERS[s[13].from];
      const stolenPowers = f ? f.powers.map((p) => Object.assign({}, p, { _fid: s[13].from })) : [];
      if (this.def.id === 'iales') stolenPowers.push(...this.ownKit().slice(5).map((p) => Object.assign({}, p)));
      this.stolen = { powers: stolenPowers, from: s[13].from, until: s[13].until, total: s[13].total, fromName: (FIGHTERS.find((x) => x.id === s[13].from) || {}).name };
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
    this.statusPulse = s[23] || {};
    this.hardControl = Object.assign({ last: -Infinity, chain: 0, dizzyLast: -Infinity, dizzyCount: 0 }, s[24] || {});
    if (s[25] != null) this._controlRound = s[25];
    if (s[26] != null) this.spamShared = s[26];
    if (s[27] != null) this.castLock = s[27];
  }
}

/* ctx.filter brightness(0) funciona neste navegador? (Safari antigo ignora
   filter e a "sombra" sairia colorida). Testado 1x num canvas 2x2. */
Fighter.silhouetteOk = function () {
  if (Fighter._silOk !== undefined) return Fighter._silOk;
  Fighter._silOk = false;
  try {
    if (typeof document === 'undefined') return false;
    const c = document.createElement('canvas'); c.width = c.height = 2;
    const x = c.getContext('2d');
    if (!x || !('filter' in x)) return false;
    x.filter = 'brightness(0)';
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, 2, 2);
    const d = x.getImageData(0, 0, 1, 1).data;
    Fighter._silOk = d[0] < 30 && d[3] > 200;
  } catch (e) { Fighter._silOk = false; }
  return Fighter._silOk;
};
