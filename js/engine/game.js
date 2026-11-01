/* ============================================================
   DS FIGHTERS — Partida.
   Modos: arcade | versus | training | tag (2x2) | online | demo
   Fluxo do round: intro → fight → ko/timeup → próximo round/fim.
   2x2: cada time tem dois lutadores; R (P1) / 8 (P2) troca.
   O reserva recupera a vida vermelha. Perde quem tiver os dois K.O.
   Online: o anfitrião simula tudo e envia snapshots; o convidado
   só desenha (netRole 'guest') e manda suas entradas.
   ============================================================ */
const W = 960;
const H = 540;
const GROUND_Y = 458;

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.W = W;
    this.H = H;
    this.running = false;
    this.paused = false;
    this.time = 0;
    this.netFx = [];
    this.netRole = null;
    const self = this;
    // Proxy de áudio: no anfitrião online, registra os sons para o convidado.
    this.audio = new Proxy(AudioSys, {
      get(target, prop) {
        const v = target[prop];
        if (typeof v !== 'function') return v;
        return (...args) => {
          if (self.mode === 'demo' && !['stopLoops', 'stopMusic', 'ensure'].includes(prop)) return false;
          if (self.netRole === 'host' && !['loop', 'stopLoops', 'playMusic', 'stopMusic', 'ensure'].includes(prop)) self.netFx.push(['a', prop, args]);
          return v.apply(target, args);
        };
      },
    });
    this.resetWorld();
  }
  resetWorld() {
    this.imgFx = [];
    this.cracks = [];
    this.projectiles = [];
    this.strikes = [];
    this.zones = [];
    this.walls = [];
    this.beams = [];
    this.pickups = [];
    this.bursts = [];
    this.sparks = [];
    this.texts = [];
    this.events = [];
    this.hitstop = 0;
    this.freeze = 0;
    this.freezeOwner = null;
    this.shakeMag = 0;
    this.slowmo = 0;
    this.bsod = 0;
    this.glitch = 0;
    this.combo = { owner: null, count: 0, until: 0 };
    this.lastVictim = null;
    this.firstHit = false;
  }

  /* ---------- configuração ---------- */
  start(cfg) {
    this.cfg = Object.assign({ mode: 'versus', difficulty: 1, cpu: [false, true], roundsToWin: 2, timer: 180 }, cfg);
    this.mode = this.cfg.mode;
    this.netRole = this.cfg.netRole || null;
    this.reduced = Profile.reducedMotion();
    this.stageDef = this.pickStage(this.cfg.stage);
    this.cfg.stage = this.stageDef.id;
    this.stage = new StageRenderer(this.stageDef, W, H, GROUND_Y);
    this.stage.reducedFlag = this.reduced;
    this.round = 1;
    this.teamWins = [0, 0];
    this.matchOver = false;
    this.teams = [0, 1].map((ti) => {
      const ids = this.cfg.teams[ti];
      const pet = (this.cfg.pets && this.cfg.pets[ti]) || PETS[0];
      return {
        members: ids.map((id, k) => {
          const def = FIGHTERS.find((f) => f.id === id) || FIGHTERS[3];
          const f = new Fighter(def, ti === 0 ? 260 : 700, ti === 0 ? 1 : -1, this, { team: ti, slot: ti, pet: k === 0 ? pet : PETS[0] });
          if (k > 0) f.benched = true;
          return f;
        }),
        active: 0,
        tagCd: 0,
      };
    });
    this.running = true;
    this.paused = false;
    this.beginRound();
    if (this.mode !== 'demo') AudioSys.playMusic('battle'); else AudioSys.stopLoops && AudioSys.stopLoops();
  }
  pickStage(id) {
    if (!id || id === 'random') return STAGE_LIST[(Math.random() * STAGE_LIST.length) | 0];
    return STAGE_LIST.find((s) => s.id === id) || STAGE_LIST[0];
  }
  beginRound() {
    this.resetWorld();
    this.gravityMul = this.stageDef.gravity || 1;
    this.jumpMul = this.stageDef.mech === 'highjump' ? 1.14 : (this.stageDef.gravity ? 0.92 : 1);
    if (this.weather) this.weather.stop();
    if (this.mech) this.mech.stop();
    this.weather = new Weather(this, this.stageDef);
    if (this.netRole !== 'guest') this.weather.roll(this.cfg.weather && this.cfg.weather !== 'random' ? this.cfg.weather : null);
    this.mech = new StageMechanic(this, this.stageDef);
    this.teams.forEach((t, ti) => {
      t.active = 0;
      t.tagCd = 0;
      t.members.forEach((f, k) => {
        f.hp = f.maxHp;
        f.roundDamageStart = f.stats.dmg;
        f.redHp = f.maxHp;
        f.x = ti === 0 ? 260 : 700;
        f.y = 0;
        f.vx = 0;
        f.vy = 0;
        f.dir = ti === 0 ? 1 : -1;
        f.state = 'idle';
        f.stateTime = 0;
        f.hitstun = 0;
        f.blockstun = 0;
        f.status = {};
        f.statusSource = {};
        if (typeof f.resetControlMemory === 'function') f.resetControlMemory(this.round);
        f.stolen = null;
        f.attack = null;
        f.cast = null;
        f.dashHit = null;
        f.rush = null;
        f.quakeHold = null;
        f.shadowPort = null;
        f.hidden = false;
        f.launched = false;
        f.phaseDash = 0;
        f.afterimage = 0;
        f.aura = null;
        f.auraFid = null;
        f.overclockHot = false;
        f.overclockCut = false;
        f.overclockUntil = 0;
        f.queue = [];
        f.cd = [0, 0, 0, 0, 0];
        f.afo = 0;
        f.stunGauge = 0;
        f.benched = k !== 0;
        f.applyPet();
        if (this.round === 1) { f.charge = [0, 0]; f.ultimate = 0; }
        if (this.mode === 'training') { f.charge = [100, 100]; f.ultimate = 100; }
      });
    });
    this.roundTimer = this.mode === 'training' ? Infinity : this.cfg.timer * 60;
    this.roundState = 'intro';
    this.roundStateTime = 0;
    UI.hud.reset(this);
    UI.hud.setStageInfo(this.stageDef, WEATHER_INFO[this.weather.kind]);
  }
  onWeather(kind) { if (this.stageDef) UI.hud.setStageInfo(this.stageDef, WEATHER_INFO[kind]); }
  team(ti) { return this.teams[ti]; }
  activeOf(ti) { const t = this.teams && this.teams[ti]; return t ? t.members[t.active] : null; }
  activePair() { return [this.activeOf(0), this.activeOf(1)]; }
  fighters() { return this.activePair().filter(Boolean); }
  allFighters() { return this.teams.flatMap((t) => t.members); }
  enemyOf(f) { return f ? this.activeOf(1 - f.team) : null; }
  opponentsOf(f) { const e = this.enemyOf(f); return e ? [e] : []; }

  /* ---------- efeitos ---------- */
  spawnImgFx(sheet, clip, x, y, opts = {}) {
    if (!this.imgFx) this.imgFx = [];
    if (this.imgFx.length > 48) this.imgFx.shift();
    this.imgFx.push({ sheet, clip, frame: 0, x, y, scale: opts.scale || 2, alpha: opts.alpha == null ? 1 : opts.alpha, life: opts.life || 16, max: opts.life || 16, dir: opts.dir || 1 });
  }
  /* Rachadura no ar (Urbano / All For One). Coordenadas do mundo. */
  addCrack(x, y, scale = 1, dir = 1, replay) {
    if (!this.cracks) this.cracks = [];
    const seed = replay ? replay : Math.floor(Math.random() * 1e6);
    let r = seed;
    const rnd = () => { r = (r * 16807) % 2147483647; return (r % 10000) / 10000; };
    const rays = [];
    const n = 9;
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI * 2 + rnd() * 0.5;
      const pts = [[0, 0]];
      let len = 0;
      const total = (60 + rnd() * 70) * scale;
      let a = a0;
      while (len < total) { len += 14 + rnd() * 16; a += (rnd() - 0.5) * 0.7; pts.push([Math.cos(a) * len, Math.sin(a) * len * 0.8]); }
      rays.push(pts);
    }
    this.cracks.push({ x, y, rays, life: 54, max: 54, scale });
    if (this.cracks.length > 8) this.cracks.shift();
    if (this.netRole === 'host') this.netFx.push(['k', Math.round(x), Math.round(y), scale, dir, seed]);
  }
  drawCracks(ctx) {
    if (!this.cracks || !this.cracks.length) return;
    ctx.save();
    for (const c of this.cracks) {
      const a = Math.min(1, c.life / 20);
      ctx.translate(c.x, c.y);
      ctx.globalAlpha = a * 0.35;
      ctx.fillStyle = '#e8f6ff';
      ctx.beginPath(); ctx.arc(0, 0, 26 * c.scale * (1.2 - c.life / c.max), 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = a;
      for (const [w, col] of [[5, 'rgba(0,0,0,0.75)'], [2, '#ffffff']]) {
        ctx.lineWidth = w; ctx.strokeStyle = col;
        for (const ray of c.rays) {
          ctx.beginPath(); ctx.moveTo(ray[0][0], ray[0][1]);
          for (const pt of ray) ctx.lineTo(pt[0], pt[1]);
          ctx.stroke();
        }
      }
      ctx.translate(-c.x, -c.y);
    }
    ctx.restore();
  }
  spawnBurst(sheet, row, x, y, dir = 1, scale = 2) {
    if (this.bursts.length > 60) this.bursts.shift();
    const key = sheet.includes(':') ? sheet : 'fx2:' + sheet;
    this.bursts.push({ key, row, x, y, dir, scale, age: 0, dur: 16 });
    if (this.netRole === 'host') this.netFx.push(['b', key, row, Math.round(x), Math.round(y), dir, scale]);
  }
  spawnAbilityImpact(owner, p, x, y) {
    const fid = owner.kitOwnerId(p);
    const el = owner.elementOf(p);
    const fx = ELEMENT_FX[el] || { sheet: 'impact', color: '#fff' };
    this.spawnBurst('abil:' + fid, p.row, x, y, owner.dir, p.big ? 1.3 : 0.9);
    const sheets = p.impactSheets || (p.impactSheet ? [p.impactSheet] : [fx.sheet]);
    sheets.forEach((sheet) => this.spawnBurst(sheet, 3, x, y, owner.dir, 2.2));
    for (let k = 0; k < (this.reduced ? 4 : 10); k++) this.spark(x, y, p.impactColor || fx.color);
  }
  spark(x, y, color) {
    if (this.sparks.length > 220) return;
    this.sparks.push({ x, y, vx: (Math.random() - 0.5) * 7, vy: -Math.random() * 6 - 1, life: 22 + Math.random() * 14, color });
  }
  dust(x) {
    for (let k = 0; k < (this.reduced ? 2 : 6); k++) this.sparks.push({ x: x + (Math.random() - 0.5) * 30, y: -4, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 1.6, life: 18, color: 'rgba(220,210,190,0.7)', dust: true });
  }
  splash(x) { if (this.sparks.length < 200) this.sparks.push({ x, y: -2, vx: (Math.random() - 0.5) * 2, vy: -1.5 - Math.random() * 1.5, life: 10, color: 'rgba(190,220,255,0.7)', dust: true }); }
  floatText(x, y, text, color) {
    this.texts.push({ x, y, text, color: color || '#fff', life: 54, vy: -1.1 });
    if (this.texts.length > 18) this.texts.shift();
    if (this.netRole === 'host') this.netFx.push(['t', Math.round(x), Math.round(y), text, color || '#fff']);
  }
  shake(n) { if (Profile.data.settings.shake !== false && !this.reduced) this.shakeMag = Math.max(this.shakeMag, n); }
  say(f, text) { UI.hud.say(f.team, text); if (this.netRole === 'host') this.netFx.push(['s', f.team, text]); }
  announce(text, color, sub) { UI.banner(text, color, sub); if (this.netRole === 'host') this.netFx.push(['n', text, color, sub || '']); }
  drawWarnLabel(ctx, x, label) {
    ctx.save();
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = (this.time % 16) < 8 ? '#ff3b30' : '#ffe14d';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText('⚠ ' + label, x, -36);
    ctx.fillText('⚠ ' + label, x, -36);
    ctx.restore();
  }
  randX() { return 90 + Math.random() * (W - 180); }
  hazard(o) {
    const sheet = { key: o.sheet[0], row: o.sheet[1], frames: 4 };
    this.strikes.push(new Strike(null, Object.assign({ delay: 56, w: 110, h: 260, scale: 2, stun: 18, launch: -6, shake: 6 }, o, { sheet })));
  }
  spawnPickup(kind) { if (this.pickups.length < 3) this.pickups.push(new Pickup(this, kind)); }
  superFreeze(f, p) {
    this.freeze = this.reduced ? 26 : 46;
    this.freezeOwner = f;
    UI.cutIn(f, p);
    if (this.netRole === 'host') this.netFx.push(['c', f.team, f.def.id, p.name]);
  }
  registerHit(atk, victim, d, blocked, hitstop, counter) {
    this.hitstop = Math.max(this.hitstop, this.reduced ? Math.min(3, hitstop) : hitstop);
    if (!blocked) {
      victim.redHp = Math.max(victim.hp, Math.min(victim.redHp, victim.hp + d * 0.5));
      this.lastVictim = victim;
      if (atk) {
        if (this.combo.owner === atk && this.time < this.combo.until) this.combo.count++;
        else this.combo = { owner: atk, count: 1, until: 0 };
        this.combo.until = this.time + 48;
        if (this.combo.count > atk.stats.maxCombo) atk.stats.maxCombo = this.combo.count;
        if (this.combo.count >= 2) { UI.hud.combo(atk.team, this.combo.count); if (this.netRole === 'host') this.netFx.push(['h', atk.team, this.combo.count]); }
        if (this.combo.count === 6) this.audio.voice('combo');
        if (!this.firstHit) { this.firstHit = true; this.floatText(victim.x, victim.y - 250, 'PRIMEIRO GOLPE!', '#ffe14d'); }
      }
    }
    this.texts.push({ x: victim.x + (Math.random() - 0.5) * 24, y: victim.y - 150, text: String(Math.max(1, Math.round(d))), color: blocked ? '#9adcff' : d >= 14 ? '#ff5a3c' : '#ffe14d', life: 36, vy: -1.4, small: true });
  }

  /* ---------- K.O. ---------- */
  onKO(loser) {
    if (this.roundState !== 'fight' || this.netRole === 'guest') return;
    const team = this.teams[loser.team];
    const partnerIdx = team.members.findIndex((m, k) => k !== team.active && m.alive);
    if (this.mode === 'tag' && partnerIdx >= 0) {
      this.announce('K.O.!', '#ff3b30', loser.def.name + ' caiu — entra o parceiro!');
      this.slowmo = 30;
      this.pendingTag = { ti: loser.team, idx: partnerIdx, at: 50 };
      return;
    }
    this.roundState = 'ko';
    this.roundStateTime = 0;
    this.slowmo = this.reduced ? 20 : 70;
    const wt = 1 - loser.team;
    this.teamWins[wt]++;
    const winner = this.activeOf(wt);
    if (winner) {
      winner.state = 'win';
      const q = winner.def.quotes.win;
      if (q) this.say(winner, q[(Math.random() * q.length) | 0]);
    }
    const perfect = winner && winner.hp >= winner.maxHp - 0.5;
    this.announce('K.O.!', '#ff3b30', perfect ? 'PERFEITO!' : (winner ? winner.def.name + ' venceu o round' : ''));
    this.audio.voice(perfect ? 'perfect' : 'ko');
    this.audio.play('crowd', { vol: 0.6 });
    this.shake(14);
  }
  tagIn(ti, idx, forced) {
    const t = this.teams[ti];
    const out = t.members[t.active];
    const inn = t.members[idx];
    if (!inn || !inn.alive) return;
    out.benched = true;
    out.state = forced ? 'ko' : 'idle';
    inn.benched = false;
    inn.x = Math.max(60, Math.min(W - 60, out.x));
    inn.y = -260;
    inn.vy = 2;
    inn.vx = 0;
    inn.state = 'jump';
    inn.hitstun = 0;
    const opp = this.activeOf(1 - ti);
    inn.dir = opp && opp.x > inn.x ? 1 : -1;
    inn.now = this.time;
    inn.addStatus('invuln', 40);
    inn.charge = out.charge.slice();
    inn.ultimate = out.ultimate;
    t.active = idx;
    t.tagCd = 360;
    this.floatText(inn.x, -300, 'TROCA! ' + inn.def.name, inn.def.colors.accent);
    this.audio.play('whoosh');
    this.spawnBurst('impact', 3, inn.x, -120, 1, 3);
    UI.hud.reset(this);
  }
  tryTag(ti) {
    if (this.mode !== 'tag' && !(this.mode === 'online' && this.cfg.tag)) return;
    const t = this.teams[ti];
    if (t.tagCd > 0) return;
    const cur = t.members[t.active];
    if (!cur.canAct() || !cur.onGround) return;
    const idx = t.members.findIndex((m, k) => k !== t.active && m.alive);
    if (idx < 0) return;
    this.tagIn(ti, idx, false);
  }

  /** 2x2 com 4 jogadores: entrada de quem está na reserva (pede TROCA ou ASSIST). */
  benchInput(ti) {
    if (this.mode !== 'online' || !this.cfg.fourP) return null;
    const slot = ti * 2 + (1 - this.teams[ti].active);
    return slot === this.cfg.mySlot ? Input.read(0) : Net.takeRemote(slot);
  }
  /** ASSIST: o parceiro entra, solta a habilidade H1 e volta para a reserva. */
  tryAssist(ti) {
    if (this.mode !== 'tag' && !(this.mode === 'online' && this.cfg.tag)) return;
    const t = this.teams[ti];
    if ((t.assistCd || 0) > 0) return;
    const cur = t.members[t.active];
    const idx = t.members.findIndex((m, k) => k !== t.active && m.alive);
    if (idx < 0 || !cur.alive) return;
    const m = t.members[idx];
    const st = m.powerState(0);
    if (!st.p) return;
    t.assistCd = 540;
    m.benched = false;
    m.assistT = 80;
    m.x = Math.max(60, Math.min(this.W - 60, cur.x - cur.dir * 90));
    m.y = 0; m.vx = 0; m.vy = 0;
    m.dir = cur.dir;
    m.state = 'idle';
    m.stateTime = 0;
    m.startCast(0, st.p);
    m.cd[0] = 0;
    this.spawnBurst('arcane', 3, m.x, -90, 1, 2.2);
    if (this.mode !== 'demo') UI.toast(m.def.name + ': ASSIST!', 1100);
  }
  /* ---------- entradas ---------- */
  inputFor(ti) {
    if (this.bsod > 0) return EMPTY_INPUT;
    const f = this.activeOf(ti);
    const opp = this.activeOf(1 - ti);
    if (this.mode === 'online') {
      const slot = this.cfg.fourP ? ti * 2 + this.teams[ti].active : ti * 2;
      return slot === this.cfg.mySlot ? Input.read(0) : Net.takeRemote(slot);
    }
    if (this.mode === 'demo') return AI.think(f, opp, 1.2);
    if (this.mode === 'training' && ti === 1) {
      const dm = this.cfg.dummy || 'stand';
      if (dm === 'cpu') return AI.think(f, opp, this.cfg.difficulty);
      if (dm === 'block') { const i = Object.assign({}, EMPTY_INPUT); if (opp.x > f.x) i.left = true; else i.right = true; i.down = this.time % 120 > 60; return i; }
      if (dm === 'jump') return Object.assign({}, EMPTY_INPUT, { up: this.time % 70 === 0 });
      return EMPTY_INPUT;
    }
    if (this.cfg.cpu[ti]) return AI.think(f, opp, this.cfg.difficulty);
    return Input.read(this.cfg.cpu[0] ? 0 : ti);
  }

  /* ---------- loop ---------- */
  tick() {
    if (!this.running || this.paused) return;
    this.time++;
    if (this.netRole === 'guest') { this.guestTick(); return; }
    if (this.freeze > 0) {
      this.freeze--;
      if (this.freeze === 0) this.freezeOwner = null;
      this.bufferDuringPause();
      this.tickFxOnly();
      return;
    }
    if (this.hitstop > 0) { this.hitstop--; this.bufferDuringPause(); this.tickFxOnly(); return; }
    if (this.slowmo > 0) { this.slowmo--; if (this.slowmo % 3 !== 0) { this.tickFxOnly(); return; } }
    this.step();
  }
  /** Durante hitstop/super-freeze as entradas continuam indo para o buffer (combos fluidos). */
  bufferDuringPause() {
    if (this.roundState !== 'fight') return;
    for (const ti of [0, 1]) {
      const f = this.activeOf(ti);
      if (f && f.alive) f.press(this.inputFor(ti));
    }
  }
  /** Times controlados por humanos nesta tela (para efeitos de tela como cegueira). */
  localTeams() {
    if (!this.cfg || this.mode === 'demo') return [];
    if (this.mode === 'online') return [this.cfg.localTeam];
    if (this.mode === 'training') return [0];
    return [0, 1].filter((ti) => !this.cfg.cpu[ti]);
  }
  /** Guarda posições antes de cada passo para interpolar em telas de 120/144/240 Hz. */
  capturePrev() {
    if (!this.teams) return;
    for (const f of this.allFighters()) { f._px = f.x; f._py = f.y; }
    for (const p of this.projectiles) { p._px = p.x; p._py = p.y; }
  }
  step() {
    this.roundStateTime++;
    const fighting = this.roundState === 'fight';
    this.stage.update(this.weather);
    this.weather.update(fighting);
    this.mech.tick(fighting);
    if (this.bsod > 0) this.bsod--;
    if (this.glitch > 0) this.glitch--;
    if (this.pendingTag && --this.pendingTag.at <= 0) { const p = this.pendingTag; this.pendingTag = null; this.tagIn(p.ti, p.idx, true); }
    if (this.roundState === 'intro') {
      if (this.roundStateTime === 1) {
        const wi = WEATHER_INFO[this.weather.kind];
        this.announce('ROUND ' + this.round, '#ffd27d', this.stageDef.name + ' · ' + wi.icon + ' ' + wi.name);
        this.audio.voice('round' + Math.min(3, this.round));
        if (this.round === 1) this.fighters().forEach((f) => { const q = f.def.quotes.intro; if (q) this.say(f, q[(Math.random() * q.length) | 0]); });
      }
      if (this.roundStateTime === 70) { this.announce('LUTA!', '#7dff5e'); this.audio.voice('fight'); }
      if (this.roundStateTime > 100) { this.roundState = 'fight'; this.roundStateTime = 0; }
      this.fighters().forEach((f) => f.update(EMPTY_INPUT));
      this.tickEntities();
      return;
    }
    if (fighting) {
      if (this.roundTimer !== Infinity) this.roundTimer--;
      for (const ti of [0, 1]) {
        const t = this.teams[ti];
        if (t.tagCd > 0) t.tagCd--;
        if (t.assistCd > 0) t.assistCd--;
        const inp = this.inputFor(ti);
        // TROCA = tecla de troca; ASSIST = baixo + tecla de troca
        if (inp.tag) { if (inp.down) this.tryAssist(ti); else this.tryTag(ti); }
        const bin = this.benchInput(ti);
        if (bin) { if (bin.tag) this.tryTag(ti); else if (bin.punch || bin.a0) this.tryAssist(ti); }
        const f = this.activeOf(ti);
        f.update(inp);
        t.members.forEach((m) => {
          if (m === f) return;
          if (m.assistT > 0) {
            m.assistT--;
            m.update(EMPTY_INPUT);
            if (m.assistT === 0 || (m.state !== 'cast' && m.assistT < 50)) {
              m.assistT = 0; m.benched = true; m.state = 'idle';
              this.spawnBurst('arcane', 3, m.x, -90, 1, 2);
            }
          } else m.update(EMPTY_INPUT);
        });
      }
      this.separate();
      this.tickEntities();
      if (this.mode === 'training') this.trainingRefill();
      else if (this.cfg.infiniteMeter) this.allFighters().forEach((f) => { f.charge = [100, 100]; f.ultimate = 100; });
      if (this.roundTimer <= 0 && this.roundState === 'fight') this.timeUp();
      return;
    }
    this.fighters().forEach((f) => f.update(EMPTY_INPUT));
    this.tickEntities();
    if (this.roundStateTime > 150) this.endRound();
  }
  separate() {
    const [a, b] = this.activePair();
    for (const f of [a, b]) if (f) f.x = Math.max(44, Math.min(W - 44, f.x));
    if (a && b && a.alive && b.alive) {
      const minDist = 54;
      const phase = (f) => f.hidden || f.phaseDash > 0 || (f.def.id === 'merc' && (f.state === 'dash' || f.state === 'backdash') && f.stateTime < 14);
      if (!phase(a) && !phase(b) && Math.abs(a.x - b.x) < minDist && Math.abs(a.y - b.y) < 80 && a.state !== 'thrown' && b.state !== 'thrown') {
        const push = (minDist - Math.abs(a.x - b.x)) / 2;
        if (a.x === b.x) a.x -= 1;
        if (a.x < b.x) { a.x -= push; b.x += push; } else { a.x += push; b.x -= push; }
        a.x = Math.max(44, Math.min(W - 44, a.x));
        b.x = Math.max(44, Math.min(W - 44, b.x));
      }
    }
  }
  tickEntities() {
    for (const p of this.projectiles) p.update(this);
    this.clashProjectiles();
    for (const s of this.strikes) s.update(this);
    for (const z of this.zones) z.update(this);
    for (const w of this.walls) w.update(this);
    for (const p of this.pickups) p.update(this);
    for (const b of this.beams) b.age++;
    this.projectiles = this.projectiles.filter((p) => !p.dead);
    this.strikes = this.strikes.filter((p) => !p.dead);
    this.zones = this.zones.filter((p) => !p.dead);
    this.walls = this.walls.filter((p) => !p.dead);
    this.pickups = this.pickups.filter((p) => !p.dead);
    this.beams = this.beams.filter((b) => b.age < b.life);
    this.tickFxOnly();
  }
  clashProjectiles() {
    const ps = this.projectiles;
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i];
        const b = ps[j];
        if (a.dead || b.dead || a.owner.team === b.owner.team) continue;
        if (Math.abs(a.x - b.x) > a.r + b.r || Math.abs(a.y - b.y) > a.r + b.r) continue;
        const ap = a.p.heavy || a.p.big;
        const bp = b.p.heavy || b.p.big;
        if (a.seek && !b.seek) b.dead = true;
        else if (b.seek && !a.seek) a.dead = true;
        else if (ap && !bp) b.dead = true;
        else if (bp && !ap) a.dead = true;
        else { a.dead = true; b.dead = true; }
        this.spawnBurst('impact', 3, (a.x + b.x) / 2, (a.y + b.y) / 2, 1, 2);
        this.audio.play('explosion', { vol: 0.6 });
      }
    }
  }
  tickFxOnly() {
    if (this.shakeMag > 0) this.shakeMag *= 0.85;
    if (this.shakeMag < 0.3) this.shakeMag = 0;
    if (this.cracks) this.cracks = this.cracks.filter((c) => --c.life > 0);
    for (const b of this.bursts) b.age++;
    if (this.imgFx) {
      for (const fx of this.imgFx) fx.frame++;
      this.imgFx = this.imgFx.filter((fx) => --fx.life > 0);
    }
    this.bursts = this.bursts.filter((b) => b.age < b.dur);
    for (const s of this.sparks) { s.x += s.vx; s.y += s.vy; s.vy += s.dust ? 0.04 : 0.28; s.life--; }
    this.sparks = this.sparks.filter((s) => s.life > 0);
    for (const t of this.texts) { t.y += t.vy; t.life--; }
    this.texts = this.texts.filter((t) => t.life > 0);
  }
  trainingRefill() {
    for (const f of this.allFighters()) {
      if (f.state === 'idle' && f.stateTime > 60 && f.hp < f.maxHp) f.hp = Math.min(f.maxHp, f.hp + 1.5);
      if (this.cfg.infiniteMeter) { f.charge = [100, 100]; f.ultimate = 100; }
      if (!f.alive || f.state === 'ko') { f.hp = f.maxHp; f.state = 'idle'; f.y = 0; }
    }
  }
  timeUp() {
    this.roundState = 'end';
    this.roundStateTime = 0;
    const hpOf = (ti) => this.teams[ti].members.reduce((s, m) => s + Math.max(0, m.hp) / m.maxHp, 0);
    const damageOf = (ti) => this.teams[ti].members.reduce((s, m) => s + Math.max(0, m.stats.dmg - (m.roundDamageStart || 0)), 0);
    const a = this.cfg.infiniteLife ? damageOf(0) : hpOf(0);
    const b = this.cfg.infiniteLife ? damageOf(1) : hpOf(1);
    this.audio.voice('timeup');
    if (Math.abs(a - b) < 0.001) {
      this.announce('EMPATE!', '#9adcff', 'Ninguém pontua');
      return;
    }
    const wt = a > b ? 0 : 1;
    this.teamWins[wt]++;
    const w = this.activeOf(wt);
    if (w) w.state = 'win';
    this.announce('TEMPO!', '#ffd27d', (w ? w.def.name : 'Time') + (this.cfg.infiniteLife ? ' vence pelo dano causado' : ' vence pela vida'));
  }
  endRound() {
    const need = this.cfg.roundsToWin;
    const maxRounds = Math.max(5, need * 2 - 1);
    if (this.teamWins[0] >= need || this.teamWins[1] >= need || this.round >= maxRounds) { this.finishMatch(); return; }
    this.round++;
    this.beginRound();
  }
  finishMatch() {
    if (this.matchOver) return;
    this.matchOver = true;
    this.running = false;
    this.weather.stop();
    this.mech.stop();
    AudioSys.stopLoops();
    const winner = this.teamWins[0] === this.teamWins[1] ? -1 : this.teamWins[0] > this.teamWins[1] ? 0 : 1;
    const humanTeam = this.mode === 'online' ? this.cfg.localTeam : 0;
    if (this.mode !== 'demo') {
      Profile.record('fights');
      if (winner === humanTeam) Profile.record('wins');
      Profile.record('maxCombo', Math.max(...this.teams[humanTeam].members.map((m) => m.stats.maxCombo)));
      const vsHuman = this.mode === 'versus' && !this.cfg.cpu[1];
      this.audio.voice(winner < 0 ? 'draw' : (vsHuman || winner === humanTeam) ? 'youwin' : 'youlose');
    }
    const result = {
      winner,
      wins: this.teamWins.slice(),
      teams: this.teams.map((t) => t.members.map((m) => ({ id: m.def.id, name: m.def.name, dmg: Math.round(m.stats.dmg), combo: m.stats.maxCombo, hits: m.stats.hits }))),
      mode: this.mode,
    };
    if (this.netRole === 'host' && this.onNetEnd) this.onNetEnd(result);
    UI.onMatchEnd(result, this);
  }
  stop() {
    this.running = false;
    this.canvas.classList.remove('blinded');
    document.body.classList.remove('shocked');
    this._blurOn = false; this._shockOn = false;
    if (this.weather) this.weather.stop();
    if (this.mech) this.mech.stop();
    AudioSys.stopLoops();
  }

  /* ---------- rede (anfitrião → convidado) ---------- */
  ent(e) {
    if (e.type === 'proj') return ['p', Math.round(e.x), Math.round(e.y), e.key || ('abil:' + e.fid), e.row, e.age, Math.round(e.vx * 10) / 10, Math.round(e.vy * 10) / 10, e.scale, e.p.boomerang ? 1 : 0];
    if (e.type === 'strike') return ['s', Math.round(e.x), e.age, e.delay, e.duration, e.sheet ? e.sheet.key : 0, e.sheet ? e.sheet.row : 0, e.scale, e.w, e.fromSky ? 1 : 0, e.label || 0, e.warnColor || 0, e.dir || 1];
    if (e.type === 'zone') return ['z', Math.round(e.x), e.age, e.time, e.w, e.key || (e.fid ? 'abil:' + e.fid : 0), e.row, e.honey ? 1 : 0];
    if (e.type === 'wall') return ['w', Math.round(e.x), e.age, e.time, e.fid, e.row, e.owner.dir];
    return null;
  }
  snapshot() {
    const fx = this.netFx;
    this.netFx = [];
    return {
      t: this.time,
      rs: this.roundState, rst: this.roundStateTime, rnd: this.round, tw: this.teamWins, tm: this.roundTimer === Infinity ? 99 : Math.max(0, Math.ceil(this.roundTimer / 60)),
      wk: this.weather.kind, wind: Math.round(this.weather.wind * 100) / 100, wf: this.weather.flash,
      fr: this.freeze, bs: this.bsod, gl: this.glitch, sh: Math.round(this.shakeMag),
      teams: this.teams.map((t) => ({ a: t.active, cd: t.tagCd, ac: t.assistCd || 0, m: t.members.map((m) => m.snap()) })),
      e: [...this.projectiles, ...this.strikes, ...this.zones, ...this.walls].map((e) => this.ent(e)).filter(Boolean),
      pk: this.pickups.map((p) => [p.id, Math.round(p.x), Math.round(p.y), p.def.id, p.age]),
      bm: this.beams.map((b) => [b.fid, b.row, Math.round(b.x), b.dir, b.len, b.age, b.life, Math.round(b.y), b.single ? 1 : 0, b.scale || 0]),
      co: this.combo.owner ? [this.combo.owner.team, this.combo.count, this.combo.until - this.time] : 0,
      fx,
    };
  }
  applySnapshot(s) {
    this.roundState = s.rs;
    this.roundStateTime = s.rst;
    this.round = s.rnd;
    this.teamWins = s.tw;
    this.roundTimer = s.tm * 60;
    if (this.weather.kind !== s.wk) this.weather.set(s.wk);
    this.weather.wind = s.wind;
    this.weather.flash = s.wf;
    this.freeze = s.fr;
    this.bsod = s.bs;
    this.glitch = s.gl;
    if (s.sh) this.shake(s.sh);
    s.teams.forEach((ts, ti) => {
      const t = this.teams[ti];
      if (!t) return;
      if (t.active !== ts.a) { t.active = ts.a; UI.hud.reset(this); }
      t.tagCd = ts.cd;
      t.assistCd = ts.ac || 0;
      ts.m.forEach((ms, k) => { if (t.members[k]) t.members[k].applySnap(ms); });
    });
    this.hostTime = s.t;
    this.allFighters().forEach((f) => { f.now = s.t; });
    this.netEnts = s.e;
    this.netPickups = s.pk;
    this.beams = s.bm.map((b) => ({ fid: b[0], row: b[1], x: b[2], dir: b[3], len: b[4], age: b[5], life: b[6], y: b[7], single: !!b[8], scale: b[9] }));
    this.combo = s.co ? { owner: this.activeOf(s.co[0]), count: s.co[1], until: this.time + s.co[2] } : { owner: null, count: 0, until: 0 };
    for (const f of s.fx || []) this.replayFx(f);
  }
  replayFx(f) {
    switch (f[0]) {
      case 'a': { const fn = AudioSys[f[1]]; if (typeof fn === 'function') fn.apply(AudioSys, f[2]); break; }
      case 'b': this.bursts.push({ key: f[1], row: f[2], x: f[3], y: f[4], dir: f[5], scale: f[6], age: 0, dur: 16 }); break;
      case 't': this.texts.push({ x: f[1], y: f[2], text: f[3], color: f[4], life: 54, vy: -1.1 }); break;
      case 's': UI.hud.say(f[1], f[2]); break;
      case 'n': UI.banner(f[1], f[2], f[3]); break;
      case 'c': { const fi = this.activeOf(f[1]); if (fi) UI.cutIn(fi, { name: f[3] }); break; }
      case 'h': UI.hud.combo(f[1], f[2]); break;
      case 'k': this.addCrack(f[1], f[2], f[3], f[4], f[5]); break;
      default: break;
    }
  }
  guestTick() {
    this.stage.update(this.weather);
    this.weather.updateParticles();
    if (this.weather.flash > 0) this.weather.flash--;
    this.allFighters().forEach((f) => { f.now = this.hostTime || 0; });
    this.tickFxOnly();
  }

  /* ---------- desenho ---------- */
  render(alpha = 1) {
    const ctx = this.ctx;
    if (!this.stage) return;
    // interpolação entre o passo anterior e o atual (renderização acima de 60 fps)
    const lerped = [];
    if (alpha < 0.999 && this.netRole !== 'guest' && this.teams && Profile.data.settings.smooth !== false) {
      for (const e of [...this.allFighters(), ...this.projectiles]) {
        if (e._px === undefined) continue;
        const dx = e.x - e._px;
        const dy = e.y - e._py;
        if (Math.abs(dx) > 120 || Math.abs(dy) > 120) continue;
        lerped.push([e, e.x, e.y]);
        e.x = e._px + dx * alpha;
        e.y = e._py + dy * alpha;
      }
    }
    try { this.renderScene(ctx); } finally { for (const [e, x, y] of lerped) { e.x = x; e.y = y; } }
    // cegueira: embaça a tela de quem está cego
    const lt = this.localTeams();
    // com 2 humanos na mesma tela não dá para embaçar só um: o efeito fica no lutador (status CEGO)
    const blind = lt.length === 1 && lt.some((ti) => { const f = this.activeOf(ti); return f && f.has('blind'); });
    if (blind !== this._blurOn) { this._blurOn = blind; this.canvas.classList.toggle('blinded', blind); }
    const shocked = lt.length === 1 && lt.some((ti) => { const f = this.activeOf(ti); return f && f.has('shock'); });
    if (shocked !== this._shockOn) { this._shockOn = shocked; document.body.classList.toggle('shocked', shocked); }
  }
  renderScene(ctx) {
    const [a, b] = this.activePair();
    const mid = a && b ? (a.x + b.x) / 2 : W / 2;
    const camX = (mid - W / 2) / (W / 2);
    let zoom = 1;
    if (this.freeze > 0 && !this.reduced) zoom = 1.06;
    else if (this.roundState === 'ko' && this.slowmo > 0 && !this.reduced) zoom = 1.04;
    const sx = this.shakeMag ? (Math.random() - 0.5) * this.shakeMag : 0;
    const sy = this.shakeMag ? (Math.random() - 0.5) * this.shakeMag : 0;
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    if (zoom !== 1) {
      const fx = this.freezeOwner ? this.freezeOwner.x : mid;
      ctx.translate(fx, GROUND_Y - 120);
      ctx.scale(zoom, zoom);
      ctx.translate(-fx, -(GROUND_Y - 120));
    }
    ctx.translate(sx, sy);
    this.stage.drawBack(ctx, camX * 0.5, this.freeze > 0 ? 1 : 0);
    if (this.freeze > 0) {
      ctx.fillStyle = 'rgba(0,0,10,0.62)';
      ctx.fillRect(-20, -20, W + 40, H + 40);
    }
    ctx.save();
    ctx.translate(0, GROUND_Y);
    this.mech.draw(ctx);
    const guest = this.netRole === 'guest';
    if (guest) this.drawNetEntities(ctx, ['z', 'w']);
    else { this.zones.forEach((z) => z.draw(ctx, this)); this.walls.forEach((w) => w.draw(ctx, this)); }
    if (guest) this.drawNetPickups(ctx); else this.pickups.forEach((p) => p.draw(ctx));
    const busy = (f) => (f.state === 'attack' || f.state === 'cast' || f.state === 'rush' ? 1 : 0);
    const fs = this.fighters().concat(this.allFighters().filter((m) => m.assistT > 0)).sort((p, q) => busy(p) - busy(q));
    fs.forEach((f) => f.drawBack(ctx));
    fs.forEach((f) => f.draw(ctx));
    if (guest) this.drawNetEntities(ctx, ['s', 'p']);
    else { this.strikes.forEach((s) => s.draw(ctx, this)); this.projectiles.forEach((p) => p.draw(ctx, this)); }
    this.drawBeams(ctx);
    for (const fx of this.imgFx || []) {
      Fx.blit(ctx, fx.sheet, fx.clip, fx.frame, fx.x, fx.y, { scale: fx.scale, dir: fx.dir, alpha: fx.alpha * Math.max(0.15, fx.life / fx.max) });
    }
    for (const bu of this.bursts) {
      Art.cell(ctx, bu.key, bu.row, Math.min(3, Math.floor((bu.age / bu.dur) * 4)), bu.x, bu.y, { scale: bu.scale, dir: bu.dir, add: bu.key.startsWith('fx2') });
    }
    for (const s of this.sparks) {
      ctx.globalAlpha = Math.min(1, s.life / 12);
      ctx.fillStyle = s.color;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), s.dust ? 4 : 3, s.dust ? 4 : 3);
    }
    ctx.globalAlpha = 1;
    this.mech.drawFront(ctx);
    this.drawCracks(ctx);
    this.weather.draw(ctx);
    ctx.restore();
    this.stage.drawAmbient(ctx);
    this.weather.drawOverlay(ctx, W, H);
    if (this.bsod > 0) {
      ctx.fillStyle = `rgba(20,60,200,${Math.min(0.55, this.bsod / 60)})`;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(':( SEU PC ENCONTROU UM PROBLEMA', W / 2, 200);
    }
    if (this.glitch > 0 && !this.reduced) {
      for (let k = 0; k < 6; k++) {
        const y = Math.random() * H;
        const h = 6 + Math.random() * 18;
        ctx.drawImage(this.canvas, 0, y, W, h, (Math.random() - 0.5) * 30, y, W, h);
      }
    }
    this.stage.drawVignette(ctx);
    ctx.save();
    ctx.translate(0, GROUND_Y);
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      ctx.globalAlpha = Math.min(1, t.life / 14);
      ctx.font = (t.small ? '12px' : '13px') + ' "Press Start 2P", monospace';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#000';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
    ctx.restore();
    UI.hud.update(this);
  }
  drawBeams(ctx) {
    for (const b of this.beams) {
      const f = Math.min(3, Math.floor((b.age / b.life) * 4));
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, (b.life - b.age) / 6));
      if (b.single || !b.len) Art.ability(ctx, b.fid, b.row, f, b.x, b.y, { scale: b.scale || 1.4, dir: b.dir });
      else {
        const step = 80;
        for (let d = 0; d < b.len; d += step) Art.ability(ctx, b.fid, b.row, f + ((d / step) | 0), b.x + b.dir * (d + step / 2), b.y, { scale: 0.95, dir: b.dir });
      }
      ctx.restore();
    }
  }
  drawNetEntities(ctx, types) {
    for (const e of this.netEnts || []) {
      if (!types.includes(e[0])) continue;
      if (e[0] === 'p') {
        Art.cell(ctx, e[3], e[4], Math.floor(e[5] / 4), e[1], e[2], { scale: e[8], dir: Math.sign(e[6]) || 1, rot: e[9] ? e[5] * 0.35 : 0 });
      } else if (e[0] === 's') {
        const [, x, age, delay, dur, key, row, scale, w, sky, label, warn, dir] = e;
        if (age < delay) {
          ctx.save();
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = warn || '#ff3b30';
          ctx.beginPath();
          ctx.ellipse(x, -2, w / 2, 9, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          if (label) this.drawWarnLabel(ctx, x, label);
        } else if (key) {
          const a = age - delay;
          const fr = Math.min(3, Math.floor(a / (dur / 4)));
          const size = (ART_SHEETS[key] || { size: 64 }).size * scale;
          let y = -size / 2;
          if (sky) y -= Math.max(0, 240 - a * 40);
          Art.cell(ctx, key, row, fr, x, y, { scale, dir });
        }
      } else if (e[0] === 'z') {
        const z = new Zone(null, { x: e[1], time: e[3], w: e[4], key: e[5] || null, row: e[6], honey: !!e[7] });
        z.age = e[2];
        z.draw(ctx);
      } else if (e[0] === 'w') {
        Art.ability(ctx, e[4], e[5], e[2] < 12 ? Math.floor(e[2] / 4) : 3, e[1], -80, { scale: 1.4, dir: e[6] });
      }
    }
  }
  drawNetPickups(ctx) {
    for (const p of this.netPickups || []) {
      const def = PICKUPS.find((d) => d.id === p[3]);
      if (def) Art.cell(ctx, 'pickups', def.row, Math.floor(p[4] / 7), p[1], p[2] + Math.sin(p[4] * 0.08) * 5, { scale: 0.9 });
    }
  }
}
