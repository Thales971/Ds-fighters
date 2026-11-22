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
    this.rnd = null;
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
    /* Round 3 de qualquer luta (não é modo): o chão pega fogo. */
    const sudden = this.round === 3 && this.mode !== 'training' && this.mode !== 'demo';
    this.inferno = sudden ? { t: 0, active: false } : null;
    this.suddenLeft = sudden ? 50 * 60 : 0;
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
    this.chroma = 0; /* aberracao cromatica (RGB split) no golpe pesado/KO */
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
    /* Cada luta pode abrir o Kernor de novo. O flag antigo pulava a intro
       na segunda vez que a página entrava no chefe. */
    this._bossIntro = false;
    this._bossDim = 0;
    this.cfg = Object.assign({ mode: 'versus', difficulty: 1, cpu: [false, true], roundsToWin: 2, timer: 180 }, cfg);
    this.mode = this.cfg.mode;
    this.time = 0;
    this.fightFrames = 0;
    this.netRole = this.cfg.netRole || null;
    this.reduced = Profile.reducedMotion();
    this.applyQuality(); /* qualidade dos graficos: low / medium / high */
    this.stageDef = this.pickStage(this.cfg.stage);
    this.cfg.stage = this.stageDef.id;
    this.stage = new StageRenderer(this.stageDef, W, H, GROUND_Y);
    this.stage.game = this; /* stage.react acessa game.audio (cheer da torcida) e game.W */
    this.stage.liveFauna = (typeof LiveFauna !== 'undefined' && this.stageDef && this.stageDef.fauna && this.stageDef.fauna.length) ? new LiveFauna(this, this.stageDef) : null;
    this.stage.reducedFlag = this.reduced;
    this.round = 1;
    this.teamWins = [0, 0];
    this.matchOver = false;
    this.teams = [0, 1].map((ti) => {
      const ids = this.cfg.teams[ti];
      const pet = (this.cfg.pets && this.cfg.pets[ti]) || PETS[0];
      return {
        members: ids.map((id, k) => {
          let def = FIGHTERS.find((f) => f.id === id) || FIGHTERS[3];
          /* bossScale antigo (testes) ainda pode reduzir o chefe. A luta do
             torneio usa bossFight e aumenta a vida DEPOIS do teto de 500. */
          const bs = this.cfg.bossScale;
          if (bs && bs.team === ti && def.boss && !this.cfg.bossFight) def = Object.assign({}, def, { stats: Object.assign({}, def.stats, { power: def.stats.power * (bs.power || 1), hp: Math.round(def.stats.hp * (bs.hp || 1)) }) });
          const f = new Fighter(def, ti === 0 ? 260 : 700, ti === 0 ? 1 : -1, this, { team: ti, slot: ti, pet: k === 0 ? pet : PETS[0], skinHue: (typeof Profile !== 'undefined' && Profile.skinFor) ? Profile.skinFor(def.id) : 0 });
          if (k > 0) f.benched = true;
          return f;
        }),
        active: 0,
        tagCd: 0,
      };
    });
    this.running = true;
    this.paused = false;
    this.applyTourneyBuffs();
    this.applyBossFight();
    /* Autoteste de folha: se o navegador carregar uma folha antiga (ex.: 4x8 de
       2080px em cache), avisa na tela em vez de parecer bug do jogo.
       A geometria vem de SpriteGen.expectedHeight() — já corrigida a partir da
       imagem real, então layout.js velho não gera falso alarme nem boneco torto. */
    this.spriteWarnings = [];
    this._sheetsPending = true;
    this.refreshSpriteSheets();
    this.beginRound();
    this.applyCpuLevel();
    if (this.mode !== 'demo') AudioSys.playMusic((this.cfg && this.cfg.music) || 'battle'); else AudioSys.stopLoops && AudioSys.stopLoops();
  }
  /* Só avisa folha que falhou de verdade. Imagem ainda baixando não é erro. */
  refreshSpriteSheets() {
    const expectH = SpriteGen.expectedHeight();
    const next = [];
    let pending = false;
    for (const f of this.allFighters()) {
      const id = f.spriteKey();
      const img = SpriteGen.images[id];
      const failed = !!(SpriteGen.failed && SpriteGen.failed[id]);
      if (!img && !failed) { pending = true; continue; }
      if (img && !img.complete && !failed) { pending = true; continue; }
      if (failed || (img && img.complete && !img.naturalWidth)) next.push(f.def.id + ': folha nao carregou');
      else if (img && img.naturalHeight && img.naturalHeight !== expectH) next.push(f.def.id + ': folha ' + img.naturalHeight + 'px (esperado ' + expectH + 'px) — cache antigo, recarregue');
    }
    if (SpriteGen.fixes && SpriteGen.fixes.length) next.push(SpriteGen.fixes[0] + ' — recarregue com Ctrl+F5');
    this.spriteWarnings = next;
    this._sheetsPending = pending;
  }
  pickStage(id) {
    if (!id || id === 'random') return STAGE_LIST[((this.rnd ? this.rnd() : Math.random()) * STAGE_LIST.length) | 0];
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
        f.statusCapWindows = {};
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
        f.cd = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        f.castLock = 0; f.spamShared = 0;
        f.afo = 0;
        f.enrage = 0;
        f.stunGauge = 0;
        f.benched = k !== 0;
        f.applyPet();
        if (this.round === 1) {
          f.charge = [0, 0]; f.ultimate = 0;
          if (ti === 0 && (this.cfg.tourneyBuffs || []).indexOf('ult') >= 0) f.ultimate = 45;
        }
        if (this.mode === 'training') { f.charge = [100, 100]; f.ultimate = 100; }
    if (this.mode === 'training' && this.cfg.autoHeal && f.alive && f.hp < f.maxHp) {
      f.hp = Math.min(f.maxHp, f.hp + 0.25);
      if (f.hpBar > f.hp) f.hpBar = f.hp;
    }
      });
    });
    this.roundTimer = this.mode === 'training' ? Infinity : this.cfg.timer * 60;
    this.roundState = 'intro';
    this.roundStateTime = 0;
    UI.hud.reset(this);
    UI.hud.setStageInfo(this.stageDef, WEATHER_INFO[this.weather.kind]);
    this.startAmbience();
  }
  /* Nível da CPU do torneio, gravado no lutador. O menu (Fácil = 0) não derruba isso. */
  applyCpuLevel() {
    if (!this.cfg || this.cfg.cpuDifficulty == null || !this.teams || !this.teams[1]) return;
    const level = (typeof AI !== 'undefined' && AI.level) ? AI.level(this.cfg.cpuDifficulty) : this.cfg.cpuDifficulty;
    const tune = this.mode === 'arcade' && AI.tourneyTune ? AI.tourneyTune(level) : null;
    const body = this.mode === 'arcade' && AI.tourneyBody ? AI.tourneyBody(level) : null;
    for (const f of this.teams[1].members) {
      f.aiLevel = level;
      if (tune) f.aiTune = tune;
      /* O chefe usa bossDmg/bossTaken. Os outros degraus escalam aqui. */
      if (body && !f.bossDmg) {
        f.tourneyDmg = body.dmg;
        f.tourneyDef = body.taken;
      }
    }
  }
  applyTourneyBuffs() {
    const ids = this.cfg.tourneyBuffs || [];
    if (!ids.length) return;
    const p = this.teams[0] && this.teams[0].members[0];
    if (!p) return;
    if (ids.indexOf('dano') >= 0) p.tourneyDmg = (p.tourneyDmg || 1) * 1.12;
    if (ids.indexOf('vida') >= 0) {
      const cap = typeof HP_LIMIT === 'number' ? HP_LIMIT : 500;
      p.maxHp = Math.min(cap, Math.round(p.maxHp * 1.18));
      p.hp = p.maxHp;
      p.redHp = p.maxHp;
    }
    if (ids.indexOf('ult') >= 0) p.ultimate = Math.max(p.ultimate, 45);
    if (ids.indexOf('velo') >= 0) p.tourneySpd = (p.tourneySpd || 1) * 1.08;
    if (ids.indexOf('medidor') >= 0) p.tourneyMeter = (p.tourneyMeter || 1) * 1.15;
    if (ids.indexOf('escudo') >= 0) p.tourneyDef = (p.tourneyDef || 1) * 0.9;
  }
  /* Chefe do torneio: vida acima do teto de 500, IA extrema, fase 2 na metade. */
  applyBossFight() {
    if (!this.cfg.bossFight) return;
    const p = this.teams[1] && this.teams[1].members[0];
    if (!p || !p.def.boss) return;
    p.maxHp = 2000;
    p.hp = 2000;
    p.redHp = 2000;
    p.bossPhase = true;
    /* A barra do chefe é 2000. O dano da luta final fica abaixo do Kernor
       jogável (500) para a IA extrema ainda deixar abertura. Fase 2 devolve parte. */
    /* 2000 de vida. O golpe sai mais baixo que o Kernor jogável para a luta
       ainda fechar em torno de 15–30% contra CPU difícil/extrema. */
    /* 0.22 de dano e 1.35 de dano recebido deixava um botão-mash vencer:
       o chefe quase não batia e virava saco. Agora ele bate de verdade e
       não toma dano extra. A fase 2 ainda aumenta o golpe. */
    p.bossDmg = 0.6; /* era 0.34: com 2000 de vida o chefe virava saco de pancada (o Nimbo dava mais trabalho) */
    p.bossTaken = 1;
    p.enrage = 0;
  }
  startAmbience() {
    const name = typeof stageAmbient === 'function' ? stageAmbient(this.stageDef) : null;
    if (this._ambient && this._ambient !== name) AudioSys.loop(this._ambient, false);
    this._ambient = name;
    if (name) AudioSys.loop(name, true, 0.22);
    AudioSys.setTension(false);
    AudioSys._hitMarks = [];
    AudioSys._ultUntil = 0;
    this._hitPulse = false;
    this._ultPulse = false;
    this._drama = false;
    this._lb = 0; /* letterbox (barras de cinema) no drama — 0..1 */
    this.photo = null; /* MODO FOTO: {x, y, z, hideF} ou null — camera livre sobre a cena pausada */
    this.perfLevel = 0; this._perfToast = -1; /* modo performance automatico (watchdog de fps) */
    this.applyQuality(); /* qualidade dos graficos vem do perfil (low/medium/high) */
  }
  /* QUALIDADE DOS GRAFICOS (opcoes): medium = como sempre foi; low tira os
     efeitos pesados (rim light, chroma, letterbox, foreground, halos pulsando,
     menos particulas/clima/ambiente); high estica tudo pra embelezar. */
  applyQuality() {
    const q = (typeof Profile !== 'undefined' && Profile.setting('quality')) || 'medium';
    this.quality = q === 'low' || q === 'high' ? q : 'medium';
    const low = this.quality === 'low', high = this.quality === 'high';
    this.qFx = low ? 0.45 : high ? 1.6 : 1;       /* particulas: sparks, poeira, faíscas */
    this.qWeather = low ? 0.45 : high ? 1.45 : 1;  /* gotas de clima + aneis de chuva */
    this.qAmb = low ? 0.4 : high ? 1.5 : 1;        /* motes/ambiente do palco */
    this.qRim = low ? 0 : high ? 1.5 : 1;          /* rim light (0 = desligado) */
    this.qFxOn = !low;                             /* chroma, letterbox, foreground, pulso das luzes */
  }
  updateMusicIntensity() {
    if (typeof AudioSys === 'undefined' || !AudioSys.driveIntensity) return;
    let low = 0;
    for (const f of this.fighters()) {
      if (!f || !f.maxHp) continue;
      const ratio = Math.max(0, f.hp) / f.maxHp;
      if (ratio <= 0.3) low = Math.max(low, (0.3 - ratio) / 0.3);
    }
    const live = this.roundState && this.roundState !== 'intro';
    const comboLive = this.combo && this.combo.owner && this.time < this.combo.until ? this.combo.count : 0;
    AudioSys.driveIntensity({
      finalRound: !!(live && this.round >= ((this.cfg && this.cfg.roundsToWin) || 2)),
      low: live ? low : 0,
      combo: live ? comboLive : 0,
      ult: !!this._ultPulse,
      hit: !!this._hitPulse,
    });
    this._hitPulse = false;
    this._ultPulse = false;
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
  addCrack(x, y, scale = 1, dir = 1, crackSeed) {
    if (!this.cracks) this.cracks = [];
    const seed = crackSeed ? crackSeed : Math.floor((this.rnd ? this.rnd() : Math.random()) * 1e6);
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
    const key = p.visualSheet ? 'fx2:' + p.visualSheet : 'abil:' + fid;
    const row = Number.isInteger(p.visualRow) ? p.visualRow : p.row;
    this.spawnBurst(key, row, x, y, owner.dir, p.big ? 1.3 : 0.9);
    /* camada de som do ELEMENTO no acerto (fogo crepita, gelo tilinta, veneno
       borbulha, choque estala, agua espirra, metal bate) — baixinha, por cima do soco */
    if (this.audio && this.audio.play) {
      const f = p.fx || {};
      const e = String(el || '');
      const snd = (f.burn || /fogo|fire|magma|termic|brasa/.test(e)) ? 'fire'
        : (f.chill || f.freeze || /gelo|ice|frio/.test(e)) ? 'ice'
          : (f.poison || /veneno|acido|poison|toxi/.test(e)) ? 'poison'
            : (f.shock || /neon|raio|trovao|eletric|electric/.test(e)) ? 'zap'
              : /agua|water|chuva|database/.test(e) ? 'water'
                : /metal|cromo|chrome|mecha|lata|veterano/.test(e) ? 'metal' : null;
      if (snd) this.audio.play(snd, { vol: 0.32, gap: 90 });
    }
    const sheets = p.impactSheets || (p.impactSheet ? [p.impactSheet] : (p.visualSheet ? [] : [fx.sheet]));
    sheets.forEach((sheet) => this.spawnBurst(sheet, 3, x, y, owner.dir, 2.2));
    for (let k = 0; k < Math.max(1, Math.round((this.reduced ? 4 : 10) * (this.qFx || 1))); k++) this.spark(x, y, p.impactColor || fx.color);
  }
  spark(x, y, color, opts = {}) {
    if (this.sparks.length > 220) return;
    const count = opts.count || 1;
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const spd = (this.rnd ? this.rnd() : Math.random()) * (opts.speed || 5) + 1;
      this.sparks.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - (opts.up ? 0 : 2),
        life: 18 + (this.rnd ? this.rnd() : Math.random()) * 16,
        color: color || '#fff',
        size: 1.4 + (this.rnd ? this.rnd() : Math.random()) * 1.6,
        dust: !!opts.dust,
        glow: !!opts.glow,
        gravity: opts.gravity !== false ? 0.28 : 0,
        fade: opts.fade !== false,
      });
    }
  }
  dust(x, color = 'rgba(220,210,190,0.7)', count = null) {
    const n = Math.max(1, Math.round((count || (this.reduced ? 3 : 8)) * (this.qFx || 1)));
    for (let k = 0; k < n; k++) {
      const ang = (Math.random() * Math.PI * 2);
      const spd = (this.rnd ? this.rnd() : Math.random()) * 2.5 + 0.5;
      this.sparks.push({
        x: x + ((this.rnd ? this.rnd() : Math.random()) - 0.5) * 24,
        y: -4,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 1.2,
        life: 16 + (this.rnd ? this.rnd() : Math.random()) * 10,
        color,
        size: 1.8 + (this.rnd ? this.rnd() : Math.random()) * 1.4,
        dust: true,
        glow: true,
        gravity: 0.06,
        fade: true,
      });
    }
  }
  splash(x) { if (this.sparks.length < 200) this.sparks.push({ x, y: -2, vx: ((this.rnd ? this.rnd() : Math.random()) - 0.5) * 2, vy: -1.5 - (this.rnd ? this.rnd() : Math.random()) * 1.5, life: 10, color: 'rgba(190,220,255,0.7)', dust: true, size: 2, glow: true, gravity: 0.1, fade: true }); }
  floatText(x, y, text, color) {
    this.texts.push({ x, y, text, color: color || '#fff', life: 54, vy: -1.1 });
    if (this.texts.length > 18) this.texts.shift();
    if (this.netRole === 'host') this.netFx.push(['t', Math.round(x), Math.round(y), text, color || '#fff']);
  }
  shake(n) {
    if (Profile.data.settings.shake !== false && !this.reduced) this.shakeMag = Math.max(this.shakeMag, n);
    if (n >= 8 && this.stage && this.stage.react) this.stage.react(n);
  }
  say(f, text, file) {
    UI.hud.say(f.team, text);
    if (file && this.audio && this.audio.playVoiceFile) this.audio.playVoiceFile(file);
    if (this.netRole === 'host') this.netFx.push(['s', f.team, text]);
  }
  voiceEntry(id, kind) {
    const book = typeof VOICE_BOOK !== 'undefined' ? VOICE_BOOK : null;
    const row = book && book.fighters && book.fighters[id];
    return row && row[kind] ? row[kind] : null;
  }
  rivalry(a, b) {
    const book = typeof VOICE_BOOK !== 'undefined' ? VOICE_BOOK : null;
    const list = book && book.rivalries;
    if (!a || !b || !list) return null;
    return list.find((row) => (row.a === a && row.b === b) || (row.a === b && row.b === a)) || null;
  }
  voicedLine(f, kind) {
    if (!f) return;
    const line = this.voiceEntry(f.def.id, kind);
    if (line && line.text) { this.say(f, line.text, line.file); return; }
    const key = kind === 'ultimate' ? 'super' : kind;
    const q = f.def.quotes && f.def.quotes[key];
    if (q && q.length) this.say(f, q[0]);
  }
  openingLines() {
    const [a, b] = this.fighters();
    const rival = a && b ? this.rivalry(a.def.id, b.def.id) : null;
    if (rival) { this.say(a, rival.text, rival.file); return; }
    this.voicedLine(a, 'intro');
    if (b) {
      const line = this.voiceEntry(b.def.id, 'intro');
      const text = line && line.text ? line.text : ((b.def.quotes && b.def.quotes.intro && b.def.quotes.intro[0]) || '');
      if (text) this.say(b, text);
    }
  }
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
  randX() { return 90 + (this.rnd ? this.rnd() : Math.random()) * (W - 180); }
  hazard(o) {
    const sheet = { key: o.sheet[0], row: o.sheet[1], frames: 4 };
    this.strikes.push(new Strike(null, Object.assign({ delay: 56, w: 110, h: 260, scale: 2, stun: 18, launch: -6, shake: 6 }, o, { sheet })));
  }
  spawnPickup(kind) { if (this.pickups.length < 3) this.pickups.push(new Pickup(this, kind)); }
  superFreeze(f, p) {
    this._ultPulse = true;
    this.freeze = this.reduced ? 26 : 46;
    this.freezeOwner = f;
    UI.cutIn(f, p);
    if (this.netRole === 'host') this.netFx.push(['c', f.team, f.def.id, p.name]);
  }
  registerHit(atk, victim, d, blocked, hitstop, counter) {
    this.hitstop = Math.max(this.hitstop, this.reduced ? Math.min(3, hitstop) : hitstop);
    /* golpe pesado: hit-stop maior + aberracao cromatica na tela
       (qualidade baixa desliga; alta liga ate em golpe medio e mais forte) */
    if (!blocked && this.qFxOn !== false) {
      const thr = this.quality === 'high' ? 16 : 20;
      if (d >= thr) {
        const base = this.reduced ? 4 : (d >= 26 ? 9 : 6);
        this.chroma = Math.max(this.chroma, this.quality === 'high' ? Math.min(12, base + 2) : base);
        if (d >= 26 && !this.reduced) this.hitstop = Math.max(this.hitstop, 7);
      }
    }
    if (!blocked) {
      if (victim.redHp < victim.hp) victim.redHp = victim.hp;
      this._hitPulse = true;
      this.lastVictim = victim;
      if (atk) {
        if (this.combo.owner === atk && this.time < this.combo.until) this.combo.count++;
        else this.combo = { owner: atk, count: 1, dmg: 0, until: 0 };
        this.combo.until = this.time + 48;
        this.combo.dmg = (this.combo.dmg || 0) + Math.max(1, Math.round(d));
        if (this.combo.count > atk.stats.maxCombo) atk.stats.maxCombo = this.combo.count;
        if (this.combo.count >= 2) { UI.hud.combo(atk.team, this.combo.count, this.combo.dmg); if (this.netRole === 'host') this.netFx.push(['h', atk.team, this.combo.count, this.combo.dmg]); }
        if (this.combo.count === 6) this.audio.voice('combo');
        if (this.combo.count >= 10) Profile.grantAchievement('combo-10');
        if (this.combo.count >= 20) Profile.grantAchievement('combo-20');
        if (this.combo.count >= 30) Profile.grantAchievement('combo-30');
        if (!this.firstHit) { this.firstHit = true; this.floatText(victim.x, victim.y - 250, 'PRIMEIRO GOLPE!', '#ffe14d'); }
      }
    }
    this.texts.push({ x: victim.x + ((this.rnd ? this.rnd() : Math.random()) - 0.5) * 24, y: victim.y - 150, text: String(Math.max(1, Math.round(d))), color: blocked ? '#9adcff' : d >= 14 ? '#ff5a3c' : '#ffe14d', life: 36, vy: -1.4, small: true });
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
    this.slowmo = this.reduced ? 20 : 108;
    const wt = 1 - loser.team;
    this.teamWins[wt]++;
    const winner = this.activeOf(wt);
    if (winner) {
      winner.state = 'win';
      const q = winner.def.quotes.win;
      this.voicedLine(winner, 'win');
    }
    const perfect = winner && winner.hp >= winner.maxHp - 0.5;
    this.announce('K.O.!', '#ff3b30', perfect ? 'PERFEITO!' : (winner ? winner.def.name + ' venceu o round' : ''));
    this.audio.voice(perfect ? 'perfect' : 'ko');
    this.audio.play('crowd', { vol: 0.6 });
    this.shake(14);
    if (!this.reduced && this.qFxOn !== false) this.chroma = 12; /* K.O.: RGB split forte por alguns frames */
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
    if (idx < 0 || !cur.alive || !cur.canAct()) return;
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
    m.startCast(0, st.p); /* cd[0] fica no piso do anti-spam — assist tambem respeita */
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
      if (f.def && f.def.id === 'boneco-treino') return EMPTY_INPUT;
      if (dm === 'cpu') return AI.think(f, opp, this.cfg.difficulty);
      if (dm === 'block') { const i = Object.assign({}, EMPTY_INPUT); if (opp.x > f.x) i.left = true; else i.right = true; i.down = this.time % 120 > 60; return i; }
      if (dm === 'jump') return Object.assign({}, EMPTY_INPUT, { up: this.time % 70 === 0 });
      if (dm === 'walk') { const i = Object.assign({}, EMPTY_INPUT); i[this.time % 240 < 120 ? 'left' : 'right'] = true; return i; }
      if (dm === 'crouchd') return Object.assign({}, EMPTY_INPUT, { down: true });
      if (dm === 'mix') {
        const t = this.time % 400;
        if (t < 90) return Object.assign({}, EMPTY_INPUT, { down: true });
        if (t < 180) return Object.assign({}, EMPTY_INPUT, { up: this.time % 70 === 0 });
        if (t < 270) { const i = Object.assign({}, EMPTY_INPUT); i[t % 40 < 20 ? 'left' : 'right'] = true; return i; }
        return EMPTY_INPUT;
      }
      return EMPTY_INPUT;
    }
    if (this.cfg.cpu[ti]) {
      const by = this.cfg.difficultyByTeam;
      const diff = f.aiLevel != null ? f.aiLevel : (by && by[ti] != null ? by[ti] : this.cfg.difficulty);
      return AI.think(f, opp, diff);
    }
    return Input.read(this.cfg.cpu[0] ? 0 : ti);
  }

  /* ---------- loop ---------- */
  tick() {
    if (!this.running) return;
    if (this.paused) {
      if (this.shakeMag > 0) this.shakeMag *= 0.85;
      if (this.shakeMag < 0.3) this.shakeMag = 0;
      return;
    }
    this.time++;
    if (this._bossDim > 0) this._bossDim--;
    this.fightFrames = (this.fightFrames || 0) + 1;
    try {
      if (this.netRole === 'guest') { this.guestTick(); return; }
      if (this.freeze > 0) {
        this.freeze--;
        if (this.freeze === 0) this.freezeOwner = null;
        this.bufferDuringPause();
        this.tickFxOnly();
        return;
      }
      if (this.chroma > 0) this.chroma--; /* decai sempre (e visual: nao espera o hitstop acabar) */
      if (this.hitstop > 0) { this.hitstop--; this.bufferDuringPause(); this.tickFxOnly(); return; }
      if (this.slowmo > 0) { this.slowmo--; if (this.slowmo % 3 !== 0) { this.tickFxOnly(); return; } }
      this.step();
    } finally {
      this.updateMusicIntensity();
    }
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
    if (this.mode === 'online') {
      if (this.cfg.fourP && Number.isInteger(this.cfg.mySlot)) {
        const slot = this.cfg.mySlot;
        const ti = Math.floor(slot / 2);
        if (ti < 0 || ti > 1 || !this.teams[ti] || this.teams[ti].active !== slot % 2) return [];
        return [ti];
      }
      return [this.cfg.localTeam];
    }
    if (this.mode === 'training') return [0];
    return [0, 1].filter((ti) => !this.cfg.cpu[ti]);
  }
  /** Guarda posições antes de cada passo para interpolar em telas de 120/144/240 Hz. */
  capturePrev() {
    if (!this.teams) return;
    for (const f of this.allFighters()) { f._px = f.x; f._py = f.y; }
    for (const p of this.projectiles) { p._px = p.x; p._py = p.y; }
    /* fluidez em alta taxa: strikes, zonas, pickups e fauna tambem interpolam */
    for (const s of this.strikes) { s._px = s.x; s._py = s.y; }
    for (const z of this.zones) { z._px = z.x; z._py = z.y; }
    for (const p of this.pickups) { p._px = p.x; p._py = p.y; }
    const lf = this.stage && this.stage.liveFauna;
    if (lf) for (const a of lf.animals) { a._px = a.x; a._py = a.y; }
  }
  step() {
    this.roundStateTime++;
    const fighting = this.roundState === 'fight';
    this.stage.update(this.weather);
    this.weather.update(fighting);
    if (this.stage && this.stage.liveFauna && this.roundState === 'fight' && this.perfLevel < 2) this.stage.liveFauna.update();
    if (typeof VFX !== 'undefined') VFX.update(W, H);
    this.mech.tick(fighting);
    if (this.bsod > 0) this.bsod--;
    if (this.glitch > 0) this.glitch--;
    if (this.pendingTag && --this.pendingTag.at <= 0) { const p = this.pendingTag; this.pendingTag = null; this.tagIn(p.ti, p.idx, true); }
    if (this.roundState === 'intro') {
      if (this.roundStateTime === 1) {
        const wi = WEATHER_INFO[this.weather.kind];
        let sub = this.stageDef.name + ' · ' + wi.icon + ' ' + wi.name;
        if (this.round === 3 && this.inferno) sub += ' · MORTE SÚBITA';
        this.announce('ROUND ' + this.round, '#ffd27d', sub);
        const finalRound = this.round >= (this.cfg.roundsToWin || 2);
        this.audio.voice(finalRound ? 'final' : ('round' + Math.min(3, this.round)));
        if (this.round === 1) this.openingLines();
      }
      const bossF = this.teams[1] && this.teams[1].members[0];
      if (this.roundStateTime === 8 && this.round === 1 && this.cfg.bossFight && bossF && bossF.def.id === 'kernor' && !this._bossIntro) {
        this._bossIntro = true;
        this._bossDim = 78;
        this.shake(18);
        this.announce('KERNOR', '#ff2a4a', 'O Colosso do Núcleo');
      }
      if (this.roundStateTime === 70) { this.announce('LUTA!', '#7dff5e'); this.audio.voice('fight'); }
      if (this.roundStateTime > 100) { this.roundState = 'fight'; this.roundStateTime = 0; }
      this.fighters().forEach((f) => f.update(EMPTY_INPUT));
      this.tickEntities();
      return;
    }
    if (fighting) {
      if (this.roundTimer !== Infinity) this.roundTimer--;
      this.tickInferno();
      this.tickSudden();
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
    for (const s of this.sparks) { s.x += s.vx; s.y += s.vy; s.vy += (s.gravity || 0.28); s.life--; }
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
    this.canvas.classList.remove('vertigo', 'daltonic');
    this._vertigoOn = false;
    this._daltonicOn = false;
    this.weather.stop();
    this.mech.stop();
    AudioSys.setTension(false);
    this._ambient = null;
    AudioSys.stopLoops();
    const winner = this.teamWins[0] === this.teamWins[1] ? -1 : this.teamWins[0] > this.teamWins[1] ? 0 : 1;
    const humanTeam = this.mode === 'online' ? this.cfg.localTeam : 0;
    if (this.mode !== 'demo') {
      Profile.record('fights');
      if (winner === humanTeam) {
        Profile.record('wins');
        { const wT = (Profile.data.stats && Profile.data.stats.wins) || 0;
          if (wT >= 10) Profile.grantAchievement('vitoria-10');
          if (wT >= 50) Profile.grantAchievement('vitoria-50'); }
        if (this.cfg && this.cfg.stage && Profile.recordStage) Profile.recordStage(this.cfg.stage);
        Profile.grantAchievement('primeiro-ko');
        /* PERFEITO: round sem tomar dano */
        const vencedores = this.teams[humanTeam].members;
        const perfeito = vencedores.some((m) => m.tookDamage === 0 || m.stats.dmgTaken === 0 || (m.maxHp - m.hp) < 1);
        if (perfeito) Profile.grantAchievement('perfeito');
        /* vitorias por lutador + elemento */
        for (const m of vencedores) {
          if (m.def && m.def.id) {
            Profile.recordWinBy(m.def.id, POWERS[m.def.id] && POWERS[m.def.id].element);
          }
        }
        if (this.mode === 'online') Profile.grantAchievement('online-1');
        /* contadores de variedade */
        const winBy = (Profile.data && Profile.data.winBy) || {};
        const nLut = Object.keys(winBy).length;
        if (nLut >= 10) Profile.grantAchievement('lutadores-10');
        if (nLut >= 25) Profile.grantAchievement('lutadores-25');
        const winEl = (Profile.data && Profile.data.winElement) || {};
        if (Object.keys(winEl).length >= 6) Profile.grantAchievement('elementos-6');
        /* secretos todos desbloqueados */
        const secretos = (typeof Profile.SECRET_IDS !== 'undefined' ? Profile.SECRET_IDS : []);
        const unlocked = (Profile.data && Profile.data.unlocked) || [];
        if (secretos.length && secretos.every((id2) => unlocked.includes(id2))) Profile.grantAchievement('codigos-3');
      }
      Profile.record('maxCombo', Math.max(...this.teams[humanTeam].members.map((m) => m.stats.maxCombo)));
      const vsHuman = this.mode === 'versus' && !this.cfg.cpu[1];
      this.audio.voice(winner < 0 ? 'draw' : (vsHuman || winner === humanTeam) ? 'youwin' : 'youlose');
    }
    const result = {
      winner,
      wins: this.teamWins.slice(),
      seconds: Math.round((this.fightFrames || 0) / 60),
      teams: this.teams.map((t) => t.members.map((m) => ({ id: m.def.id, name: m.def.name, dmg: Math.round(m.stats.dmg), combo: m.stats.maxCombo, hits: m.stats.hits, ults: m.stats.ults || 0 }))),
      mode: this.mode,
    };
    if (this.netRole === 'host' && this.onNetEnd) this.onNetEnd(result);
    UI.onMatchEnd(result, this);
  }
  stop() {
    this.running = false;
    this.canvas.classList.remove('blinded', 'vertigo', 'daltonic');
    document.body.classList.remove('shocked');
    this._blurOn = false; this._vertigoOn = false; this._shockOn = false; this._daltonicOn = false;
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
      rs: this.roundState, rst: this.roundStateTime, rnd: this.round, inf: this.inferno ? this.inferno.t : -1, sl: this.suddenLeft, tw: this.teamWins, tm: this.roundTimer === Infinity ? 99 : Math.max(0, Math.ceil(this.roundTimer / 60)),
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
    /* MORTE SUBITA no convidado do online: o host manda o tempo do fogo */
    if (s.inf != null) {
      if (s.inf >= 0) { this.inferno = this.inferno || { t: 0, active: false }; this.inferno.t = s.inf; this.inferno.active = s.inf > 0; this.suddenLeft = s.sl || 0; } else this.inferno = null;
    }
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
    for (const f of s.fx || []) this.applyNetworkFx(f);
  }
  applyNetworkFx(f) {
    switch (f[0]) {
      case 'a': { const fn = AudioSys[f[1]]; if (typeof fn === 'function') fn.apply(AudioSys, f[2]); break; }
      case 'b': this.bursts.push({ key: f[1], row: f[2], x: f[3], y: f[4], dir: f[5], scale: f[6], age: 0, dur: 16 }); break;
      case 't': this.texts.push({ x: f[1], y: f[2], text: f[3], color: f[4], life: 54, vy: -1.1 }); break;
      case 's': UI.hud.say(f[1], f[2]); break;
      case 'n': UI.banner(f[1], f[2], f[3]); break;
      case 'c': { const fi = this.activeOf(f[1]); if (fi) UI.cutIn(fi, { name: f[3] }); break; }
      case 'h': UI.hud.combo(f[1], f[2], f[3]); break;
      case 'k': this.addCrack(f[1], f[2], f[3], f[4], f[5]); break;
      default: break;
    }
  }
  guestTick() {
    /* ROLLBACK-LITE (predicao client-side): o convidado SIMULA a partida
       localmente — os inputs dele respondem NA HORA, sem esperar o ping do
       anfitriao. Quando chega o snapshot autoritativo (onHostSnapshot), ele
       compara com o estado local: se a previsao acertou, nada muda (zero
       jitter); se divergiu, rola BACK para o estado do anfitriao e a
       simulacao continua de la. */
    if (!this._rbReady) { this._rbReady = true; this.rollbackLog = { confirmed: 0, corrected: 0 }; }
    this.stage.update(this.weather);
    this.weather.updateParticles();
    if (this.weather.flash > 0) this.weather.flash--;
    this.step();
  }
  /** Snapshot autoritativo do anfitriao: confirma a previsao ou corrige. */
  onHostSnapshot(s) {
    if (!this.running || !s || !Array.isArray(s.teams)) return;
    this.hostTime = s.t;
    // estado de round/transicao sempre obedece ao anfitriao
    const roundDiverged = s.rs !== this.roundState || s.rnd !== this.round || s.tw[0] !== this.teamWins[0] || s.tw[1] !== this.teamWins[1];
    // divergencia de lutadores: posicao e vida
    let diverged = roundDiverged;
    if (!diverged) {
      s.teams.forEach((ts, ti) => {
        const t = this.teams[ti];
        if (!t || diverged) return;
        ts.m.forEach((ms, k) => {
          const m = t.members[k];
          if (!m) return;
          const sx = ms[0], shp = ms[5];
          if (Math.abs((m.x - sx)) > 48 || Math.abs(m.hp - shp) > 4) diverged = true;
        });
      });
    }
    if (!diverged) {
      // previsao confirmada: so sincroniza o que a previsao nao sabe (timer, fx)
      this.rollbackLog.confirmed++;
      this.roundTimer = s.tm * 60;
      if (s.fx && s.fx.length) { for (const fx of s.fx) this.replayNetFx(fx); }
      return;
    }
    // BACK para o estado autoritativo e segue simulando dali
    this.rollbackLog.corrected++;
    this.applySnapshot(s);
  }
  replayNetFx(fx) {
    if (!Array.isArray(fx) || !fx.length) return;
    const [kind, a, b, c] = fx;
    if (kind === 'n') this.announce(a, b, c || '');
  }

  /* ---------- desenho ---------- */
  /* FRAME DATA: tabela dos golpes basicos — F9 no treino */
  _drawFrameDataTable(ctx) {
    const f = this.activeOf(0);
    if (!f || !f.def.moves) return;
    const mv = f.def.moves;
    const linhas = [
      ['SOCO', mv.punch], ['CHUTE', mv.kick], ['SOCO AGACHADO', mv.cpunch], ['CHUTE AGACHADO', mv.ckick],
      ['SOCO NO AR', mv.jpunch], ['CHUTE NO AR', mv.jkick],
    ].filter((l) => l[1]);
    ctx.save();
    ctx.font = '11px monospace';
    const x0 = 14, y0 = 64;
    ctx.fillStyle = 'rgba(8,10,20,0.82)';
    ctx.fillRect(x0 - 6, y0 - 16, 330, 22 + linhas.length * 16);
    ctx.strokeStyle = 'rgba(120,180,255,0.5)';
    ctx.strokeRect(x0 - 6, y0 - 16, 330, 22 + linhas.length * 16);
    ctx.fillStyle = '#9adcff';
    ctx.fillText('FRAME DATA — ' + f.def.name, x0, y0 - 2);
    ctx.fillStyle = '#8899aa';
    ctx.fillText('golpe          ini/ati/rec  dano  alcance', x0, y0 + 12);
    linhas.forEach((l, i) => {
      const m = l[1];
      const y = y0 + 28 + i * 16;
      ctx.fillStyle = '#fff';
      ctx.fillText(l[0].padEnd(15, ' '), x0, y);
      ctx.fillStyle = '#ffd27d';
      ctx.fillText(String(m.startup) + '/' + String(m.active) + '/' + String(m.recovery) + 'f', x0 + 118, y);
      ctx.fillStyle = '#ff9a8a';
      ctx.fillText(String(m.dmg), x0 + 196, y);
      ctx.fillStyle = '#9adcff';
      ctx.fillText(String(m.range) + 'px', x0 + 240, y);
    });
    ctx.fillStyle = '#667788';
    ctx.fillText('startup/ativo/recuperacao — bloqueado = punivel no recovery', x0, y0 + 34 + linhas.length * 16);
    ctx.restore();
  }
  /* caixas de debug: hurtbox (azul) e hitbox do golpe ativo (vermelho) */
  _drawHitboxDebug(ctx) {
    if (this.cfg && this.cfg.mode === 'training') this._drawFrameDataTable(ctx);
    ctx.save();
    ctx.lineWidth = 2;
    for (const f of this.allFighters()) {
      /* hurtbox */
      ctx.strokeStyle = 'rgba(80,160,255,0.9)';
      ctx.strokeRect(f.x - 34, f.y - 170, 68, 170);
      ctx.fillStyle = 'rgba(80,160,255,0.08)';
      ctx.fillRect(f.x - 34, f.y - 170, 68, 170);
      /* hitbox do golpe ativo */
      if (f.attack && f.attack.active) {
        const mv = f.attack;
        const rx = f.x + f.dir * (mv.range * 0.6);
        ctx.strokeStyle = 'rgba(255,80,80,0.95)';
        ctx.strokeRect(rx - mv.range * 0.5, f.y - 150, mv.range, 110);
        ctx.fillStyle = 'rgba(255,80,80,0.12)';
        ctx.fillRect(rx - mv.range * 0.5, f.y - 150, mv.range, 110);
        /* frame data: startup/active/recovery */
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.fillText(`${mv.kind}: ${mv.startup}/${mv.active}/${mv.recovery}f dano ${mv.dmg}`, f.x - 60, f.y - 186);
      }
    }
    ctx.restore();
  }
  render(alpha = 1) {
    const ctx = this.ctx;
    if (!this.stage) return;
    if (this._sheetsPending || (this.spriteWarnings && this.spriteWarnings.length)) this.refreshSpriteSheets();
    /* DEBUG DE HITBOX (treino): F9 liga/desliga — hitbox vermelho, hurtbox azul */
    if (this.cfg && this.cfg.mode === 'training' && Input.hit && Input.hit(['F9'])) {
      this.hitboxDebug = !this.hitboxDebug;
      if (UI && UI.toast) UI.toast(this.hitboxDebug ? '👁 Hitboxes LIGADAS' : 'Hitboxes desligadas', 1400);
    }
    // interpolação entre o passo anterior e o atual (renderização acima de 60 fps)
    const lerped = [];
    if (alpha < 0.999 && this.netRole !== 'guest' && this.teams && Profile.data.settings.smooth !== false) {
      const lf = this.stage && this.stage.liveFauna;
      const ents = [...this.allFighters(), ...this.projectiles, ...this.strikes, ...this.zones, ...this.pickups];
      if (lf) ents.push(...lf.animals);
      for (const e of ents) {
        if (e._px === undefined) continue;
        const dx = e.x - e._px;
        const dy = e.y - e._py;
        if (Math.abs(dx) > 120 || Math.abs(dy) > 120) continue;
        lerped.push([e, e.x, e.y]);
        e.x = e._px + dx * alpha;
        e.y = e._py + dy * alpha;
      }
    }
    /* Limpa em espaço de tela. Se limpar depois do zoom, as bordas ficam com o quadro anterior. */
    if (ctx.setTransform) ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    /* MODO FOTO: camera livre (pan/zoom/filtro) sobre a cena — o jogo continua pausado */
    const pc = this.photo;
    if (pc) {
      ctx.save();
      if (pc.filter) ctx.filter = pc.filter;
      ctx.translate(this.W / 2, this.H / 2);
      ctx.scale(pc.z, pc.z);
      ctx.translate(-(this.W / 2 + pc.x), -(this.H / 2 + pc.y));
    }
    try { this.renderScene(ctx); } finally { for (const [e, x, y] of lerped) { e.x = x; e.y = y; } }
    if (pc) ctx.restore();
    // cegueira: embaça a tela de quem está cego
    const lt = this.localTeams();
    // com 2 humanos na mesma tela não dá para embaçar só um: o efeito fica no lutador (status CEGO)
    const blind = lt.length === 1 && lt.some((ti) => { const f = this.activeOf(ti); return f && f.has('blind'); });
    if (blind !== this._blurOn) { this._blurOn = blind; this.canvas.classList.toggle('blinded', blind); }
    /* NEBLINA: a tela fica meio embaçada para os dois (clima .fogged). */
    const foggy = this.weather && this.weather.kind === 'fog' && this.roundState === 'fight';
    if (foggy !== this._fogOn) { this._fogOn = foggy; this.canvas.classList.toggle('fogged', !!foggy); }
    // A vertigem altera só a viewport do jogador local atingido; HUD e controles ficam normais.
    const vertigo = !this.reduced && lt.length === 1 && lt.some((ti) => { const f = this.activeOf(ti); return f && f.has('vertigo'); });
    if (vertigo !== this._vertigoOn) { this._vertigoOn = vertigo; this.canvas.classList.toggle('vertigo', vertigo); }
    /* DALTONIC (ult da Jess): a tela do jogador local atingido fica cinza e turva. */
    const daltonic = lt.length === 1 && lt.some((ti) => { const f = this.activeOf(ti); return f && f.has('daltonic'); });
    if (daltonic !== this._daltonicOn) { this._daltonicOn = daltonic; this.canvas.classList.toggle('daltonic', daltonic); }
    const shocked = lt.length === 1 && lt.some((ti) => { const f = this.activeOf(ti); return f && f.has('shock'); });
    if (shocked !== this._shockOn) { this._shockOn = shocked; document.body.classList.toggle('shocked', shocked); }
    if (this.spriteWarnings && this.spriteWarnings.length) {
      ctx.save();
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000';
      ctx.fillText(this.spriteWarnings.join(' | '), W / 2 + 1, 17);
      ctx.fillStyle = '#ff4b4b';
      ctx.fillText(this.spriteWarnings.join(' | '), W / 2, 16);
      ctx.restore();
    }
  }
  /* Gás rosa tipo neblina do Daltonic Mode: blobs radiais em cache varrendo a tela. */
  /* Aberracao cromatica: desloca os canais R e B horizontalmente por alguns
     frames apos golpe pesado/KO. So roda enquanto chroma > 0 (poucos frames),
     entao o getImageData caro nao acontece todo frame. */
  applyChroma(ctx, W, H) {
    if (this.chroma <= 0 || this.reduced) return;
    if (typeof ctx.getImageData !== 'function' || typeof ctx.putImageData !== 'function') return;
    /* readback em MEIA RESOLUCAO: getImageData/putImageData em tela cheia e o
       gargalo no celular (leitura GPU->CPU por frame); 480x270 = 4x menos
       pixels e a volta e so um drawImage com smoothing (fica na GPU). */
    const w2 = Math.max(2, (W * 0.5) | 0), h2 = Math.max(2, (H * 0.5) | 0);
    if (!this._chromaCv || !this._chromaOx) {
      this._chromaCv = document.createElement('canvas');
      this._chromaOx = this._chromaCv.getContext('2d');
    }
    const cv = this._chromaCv, ox = this._chromaOx;
    if (cv.width !== w2 || cv.height !== h2) { cv.width = w2; cv.height = h2; }
    ox.clearRect(0, 0, w2, h2);
    ox.drawImage(ctx.canvas || this.canvas, 0, 0, w2, h2); /* o canvas do PROPRIO ctx (no navegador e o mesmo; no jsdom e o real) */
    const img = ox.getImageData(0, 0, w2, h2);
    const s = img.data;
    const src = new Uint8ClampedArray(s);
    const d = this.chroma >= 10 ? 2 : 1; /* 2px na meia-res = ~4px na tela cheia so no K.O. */
    for (let y = 0; y < h2; y++) {
      const row = y * w2 * 4;
      for (let x = 0; x < w2; x++) {
        const i = row + x * 4;
        s[i] = src[x > d ? i - d * 4 : row];                 /* canal R deslocado */
        s[i + 2] = src[x < w2 - 1 - d ? i + d * 4 + 2 : row + 2]; /* canal B deslocado */
      }
    }
    ox.putImageData(img, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(cv, 0, 0, W, H);
    ctx.restore();
  }
  drawDaltonicGas(ctx, W, H) {
    if (!this._gasBlob) {
      const c = document.createElement('canvas');
      c.width = 260; c.height = 160;
      const x = c.getContext('2d');
      const g = x.createRadialGradient(130, 80, 10, 130, 80, 128);
      g.addColorStop(0, 'rgba(255,122,217,0.30)');
      g.addColorStop(0.6, 'rgba(240,90,200,0.14)');
      g.addColorStop(1, 'rgba(230,60,190,0)');
      x.fillStyle = g;
      x.fillRect(0, 0, 260, 160);
      this._gasBlob = c;
    }
    const t = this.time;
    const n = this.reduced ? 5 : 9;
    for (let k = 0; k < n; k++) {
      const ph = k * 2.39;
      const gx = (Math.sin(t * 0.011 + ph) * 0.5 + 0.5) * (W + 300) - 150 + (k % 3) * 120;
      const gy = (Math.cos(t * 0.008 + ph * 1.7) * 0.5 + 0.5) * (H + 200) - 100 - (k % 4) * 40;
      const sc = 2.4 + (k % 3) * 0.9;
      ctx.globalAlpha = this.reduced ? 0.5 : 0.42 + 0.12 * Math.sin(t * 0.05 + ph);
      ctx.drawImage(this._gasBlob, gx - 130 * sc / 2, gy - 80 * sc / 2, 260 * sc / 2, 160 * sc / 2);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,110,210,0.07)';
    ctx.fillRect(0, 0, W, H);
  }
  /* MODO PERFORMANCE AUTOMATICO: o loop principal (main.js) mede o fps e chama
     isso quando o aparelho esta sofrendo. Nivel 1 = sem chroma/reflexo/molhado/
     foreground/letterbox + clima com 45% das particulas + CSS leve (perf-low).
     Nivel 2 = alem disso clima e vinheta desligados, fauna viva parada (perf-xlow).
     Nivel 0 restaura conforme a qualidade escolhida nas opcoes. */
  applyPerf(level) {
    level = Math.max(0, Math.min(2, level | 0));
    this.perfLevel = level;
    this.qFxOn = !(this.quality === 'low' || level >= 1);
    if (this.weather) { this.weather.perfScale = level >= 1 ? 0.45 : 1; this.weather.perfOff = level >= 2; }
    if (this.stage) this.stage.perfVignetteOff = level >= 2;
    const body = (typeof document !== 'undefined' && document.body) || null;
    if (body && body.classList) {
      body.classList.toggle('perf-low', level >= 1);
      body.classList.toggle('perf-xlow', level >= 2);
    }
    const quietStart = typeof window !== 'undefined' && window.__perf && window.__perf.quiet && level === 1;
    if (level >= 1 && !quietStart && this._perfToast !== level && typeof UI !== 'undefined' && UI.toast) {
      this._perfToast = level;
      try { UI.toast('\u26a1 Modo performance ligado (fps baixo detectado)', 2600); } catch (e) {}
    }
    if (level === 0) this._perfToast = -1;
  }

  /* MODO FOTO: limita pan/zoom pra camera nao ir pro vazio */
  photoClamp() {
    const p = this.photo;
    if (!p) return;
    p.z = Math.max(0.6, Math.min(3.2, p.z));
    p.x = Math.max(-260, Math.min(260, p.x));
    p.y = Math.max(-150, Math.min(90, p.y));
  }

  renderScene(ctx) {
    const [a, b] = this.activePair();
    const mid = a && b ? (a.x + b.x) / 2 : W / 2;
    const camX = (mid - W / 2) / (W / 2);
    let zoom = 1;
    if (this.freeze > 0 && !this.reduced) zoom = 1.06;
    else if (this.roundState === 'ko' && this.slowmo > 0 && !this.reduced) {
      const age = Math.max(0, 108 - this.slowmo);
      zoom = 1.18 - Math.min(0.12, age / 220);
    }
    const low = this.fighters().some((f) => f.alive && f.hp > 0 && f.hp / f.maxHp <= 0.3);
    const finalRound = this.round >= (this.cfg.roundsToWin || 2);
    const drama = !!(low || finalRound) && this.roundState !== 'intro';
    if (this.stage) this.stage.drama = drama ? 1 : 0;
    if (this._drama !== drama) {
      this._drama = drama;
      AudioSys.setTension(drama);
    }
    const sx = this.shakeMag ? ((this.rnd ? this.rnd() : Math.random()) - 0.5) * this.shakeMag : 0;
    const sy = this.shakeMag ? ((this.rnd ? this.rnd() : Math.random()) - 0.5) * this.shakeMag : 0;
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
    if (this.stage.drawRays && !this.photo) this.stage.drawRays(ctx);
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
    if (!(this.photo && this.photo.hideF)) {
      fs.forEach((f) => f.drawBack(ctx));
      fs.forEach((f) => f.draw(ctx));
    }
    /* REFLEXO MOLHADO no chao: chuva/tempestade ou palco de mare/agua — os
       lutadores espelham achatados abaixo da linha do chao e o reflexo some com
       um gradiente de profundidade + filete de brilho na linha d'agua.
       Desligado na qualidade baixa e com movimento reduzido. */
    const wet = (this._wetOverride != null) ? this._wetOverride
      : !!(this.weather && (this.weather.kind === 'rain' || this.weather.kind === 'storm')) || !!(this.stageDef && (this.stageDef.mech === 'tide' || this.stageDef.swim));
    this.wetFloor = wet;
    if (wet && this.qFxOn !== false && !this.reduced) {
      ctx.save();
      ctx.scale(1, -0.36);
      ctx.globalAlpha = 0.17;
      if (!(this.photo && this.photo.hideF)) {
        for (const f of fs) {
          if (f.alive === false) continue;
          try { f.draw(ctx); } catch (e) { /* reflexo nunca quebra o frame */ }
        }
      }
      ctx.restore();
      const fade = ctx.createLinearGradient(0, 0, 0, 100);
      fade.addColorStop(0, 'rgba(8,10,22,0)');
      fade.addColorStop(0.65, 'rgba(8,10,22,0.38)');
      fade.addColorStop(1, 'rgba(8,10,22,0.62)');
      ctx.fillStyle = fade;
      ctx.fillRect(-20, 0, W + 40, 100);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const shine = ctx.createLinearGradient(0, -2, 0, 10);
      shine.addColorStop(0, 'rgba(190,220,255,0.15)');
      shine.addColorStop(1, 'rgba(190,220,255,0)');
      ctx.fillStyle = shine;
      ctx.fillRect(-20, -2, W + 40, 12);
      ctx.restore();
    }
    if (guest) this.drawNetEntities(ctx, ['s', 'p']);
    else { this.strikes.forEach((s) => s.draw(ctx, this)); this.projectiles.forEach((p) => p.draw(ctx, this)); }
    this.drawBeams(ctx);
    this.drawInferno(ctx);
    for (const fx of this.imgFx || []) {
      Fx.blit(ctx, fx.sheet, fx.clip, fx.frame, fx.x, fx.y, { scale: fx.scale, dir: fx.dir, alpha: fx.alpha * Math.max(0.15, fx.life / fx.max) });
    }
    for (const bu of this.bursts) {
      Art.cell(ctx, bu.key, bu.row, Math.min(3, Math.floor((bu.age / bu.dur) * 4)), bu.x, bu.y, { scale: bu.scale, dir: bu.dir, add: bu.key.startsWith('fx2') });
    }
    /* FAISCAS COM GLOW: pontos aditivos com halo (antes eram quadradinhos) */
    if (!this.reduced && this.sparks.length) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const s of this.sparks) {
        const lifeP = s.fade ? Math.min(1, s.life / 12) : 1;
        const sz = s.size || 2.4;
        const gAlpha = s.glow ? (lifeP * 0.45) : (lifeP * 0.28);
        ctx.globalAlpha = gAlpha;
        ctx.fillStyle = s.color;
        ctx.beginPath(); ctx.arc(s.x + 1.5, s.y + 1.5, sz * 2.4, 0, 6.3); ctx.fill();
        ctx.globalAlpha = lifeP;
        ctx.beginPath(); ctx.arc(s.x + 1.5, s.y + 1.5, sz, 0, 6.3); ctx.fill();
      }
      ctx.restore();
    } else {
      for (const s of this.sparks) {
        const lifeP = s.fade ? Math.min(1, s.life / 12) : 1;
        const sz = s.size || 2.4;
        ctx.globalAlpha = lifeP;
        ctx.fillStyle = s.color;
        ctx.fillRect(Math.round(s.x), Math.round(s.y), sz * 2.2, sz * 2.2);
      }
      ctx.globalAlpha = 1;
    }
    this.mech.drawFront(ctx);
    this.drawCracks(ctx);
    /* foreground do palco (grama alta na frente dos lutadores) fica sobre os
       lutadores mas abaixo da chuva/clima */
    if (this.stage.drawForeground && this.qFxOn !== false) this.stage.drawForeground(ctx, camX); /* foreground desligado na qualidade baixa */
    this.weather.draw(ctx);
    ctx.restore();
    this.stage.drawAmbient(ctx);
    /* MORTE SÚBITA: a tela fica avermelada enquanto o fogo avança. */
    if (this._bossDim > 0) {
      ctx.fillStyle = 'rgba(0,0,0,' + Math.min(0.62, this._bossDim / 100).toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (this.inferno && this.inferno.active) {
      const seconds = this.inferno.t / 60;
      const heat = Math.min(1, seconds / 40);
      const pulse = this.reduced ? 1 : 0.9 + 0.1 * Math.sin(this.time * 0.07);
      const wash = Math.min(0.18, (0.13 + heat * 0.05) * pulse);
      const edge = Math.min(0.58, (0.36 + heat * 0.18) * pulse);
      ctx.fillStyle = 'rgba(176,18,8,' + wash.toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.22, W / 2, H * 0.48, Math.hypot(W, H) * 0.52);
      g.addColorStop(0, 'rgba(160,10,0,0)');
      g.addColorStop(0.62, 'rgba(140,8,0,' + (edge * 0.28).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(110,0,0,' + edge.toFixed(3) + ')');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    this.weather.drawOverlay(ctx, W, H);
    /* GÁS ROSA do Daltonic Mode: neblina rosa cobre a tela do jogador atingido. */
    const gasF = this.localTeams().map((ti) => this.activeOf(ti)).find((f) => f && f.has('daltonic'));
    if (gasF) this.drawDaltonicGas(ctx, W, H);
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
        const y = (this.rnd ? this.rnd() : Math.random()) * H;
        const h = 6 + (this.rnd ? this.rnd() : Math.random()) * 18;
        ctx.drawImage(this.canvas, 0, y, W, h, ((this.rnd ? this.rnd() : Math.random()) - 0.5) * 30, y, W, h);
      }
    }
    /* aura de ultimate: quem ta castando ult acende as bordas */
    const casters = this.fighters().filter((f2) => f2.cast && f2.cast.p && f2.cast.p.slot === 'ultimate');
    if (typeof VFX !== 'undefined') VFX.drawUltAura(ctx, W, H, !this.reduced ? casters : []);
    if (typeof VFX !== 'undefined') VFX.draw(ctx, W, H, this.slowmo, this.reduced);
    if (this.hitboxDebug) this._drawHitboxDebug(ctx);
    this.stage.drawVignette(ctx);
    this.applyChroma(ctx, W, H); /* aberracao cromatica no topo da cena (HUD fica nitido) */
    /* LETTERBOX de cinema: 2 barras pretas entram deslizando quando o drama liga
       (HP baixo, ou round final de partida com mais de 1 round) — junto com a
       vinheta escura vira cena de final. Em melhor-de-1 so entra com HP baixo. */
    const lbT = this.qFxOn === false ? 0 : (this._drama && (low || (this.cfg.roundsToWin || 2) > 1) ? 1 : 0); /* letterbox off na qualidade baixa */
    this._lb += (lbT - this._lb) * (this.reduced ? 1 : 0.08);
    if (this._lb > 0.01) {
      const bh = Math.round(H * 0.085 * this._lb);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, bh);
      ctx.fillRect(0, H - bh, W, bh);
    }
    ctx.save();
    ctx.translate(0, GROUND_Y);
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      if (typeof VFX !== 'undefined' && !t.small) VFX.drawDamageText(ctx, t);
      else {
        ctx.globalAlpha = Math.min(1, t.life / 14);
        ctx.font = (t.small ? '12px' : '13px') + ' "Press Start 2P", monospace';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#000';
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
      }
    }
    ctx.restore();
    ctx.restore();
    UI.hud.update(this);
  }
  /* Contagem só no 3º round. No zero, quem tem menos vida cai.
     Vida igual: perde quem causou menos dano neste round.
     Dano também igual: o time 2 cai, para a luta não ficar parada. */
  tickSudden() {
    if (!this.inferno || !this.inferno.active || this.roundState !== 'fight') return;
    if (this.suddenLeft > 0) this.suddenLeft--;
    if (this.suddenLeft > 0) return;
    const hpOf = (ti) => this.teams[ti].members.reduce((s, m) => s + Math.max(0, m.hp), 0);
    const dmgOf = (ti) => this.teams[ti].members.reduce((s, m) => s + Math.max(0, m.stats.dmg - (m.roundDamageStart || 0)), 0);
    const ha = hpOf(0);
    const hb = hpOf(1);
    let loserTeam;
    let why;
    if (Math.abs(ha - hb) > 0.5) {
      loserTeam = ha < hb ? 0 : 1;
      why = 'Quem tinha menos vida cai';
    } else {
      const da = dmgOf(0);
      const db = dmgOf(1);
      if (Math.abs(da - db) > 0.5) {
        loserTeam = da >= db ? 1 : 0;
        why = 'Vida igual — vence quem causou mais dano';
      } else {
        loserTeam = 1;
        why = 'Vida e dano iguais — o time 2 cai';
      }
    }
    const loser = this.activeOf(loserTeam);
    this.announce('TEMPO!', '#ff3b30', why);
    if (loser && loser.alive) {
      loser.hp = 0;
      loser.defeat(loser.dir);
    }
  }
  tickInferno() {
    const inf = this.inferno;
    if (!inf || this.roundState !== 'fight') return;
    inf.t++;
    if (!inf.active) {
      inf.active = true;
      this.announce('MORTE SÚBITA!', '#ff3b30', 'O chão pega fogo. O dano sobe com o tempo. +5% de dano.');
      this.audio.play('fire', { vol: 0.4 });
      this.events.push({ t: 'sudden', at: this.time });
    }
    if (inf.t % 40 !== 0) return;
    const seconds = inf.t / 60;
    const dmg = Math.min(2.4, 0.35 + seconds * 0.045);
    /* parede de fogo: quem encosta nela leva o dobro */
    const wall = 30 + this.infernoHeat() * 200;
    for (const f of this.fighters()) {
      if (!f.alive || f.benched) continue;
      const inWall = f.x < wall + 20 || f.x > W - wall - 20;
      f.chip(inWall ? dmg * 2 : dmg, null);
      if (inWall && inf.t % 120 === 0) this.floatText(f.x, f.y - 220, 'QUEIMANDO!', '#ff6a1c');
    }
  }
  /* MORTE SUBITA — chamas que CRESCEM durante o round 3 (pedido do dono):
     estagio 1 (0-15s) chama baixa nas bordas e algumas no chao; estagio 2
     (15-30s) as paredes de fogo avancam e o chao enche; estagio 3 (30s+)
     chamas altas fechando a arena, brasas subindo. heat 0..1 guia tudo
     (altura, quantidade, quanto as paredes fecham e o brilho no chao). */
  infernoHeat() {
    const inf = this.inferno;
    return inf && inf.active ? Math.min(1, inf.t / (45 * 60)) : 0;
  }
  drawInferno(ctx) {
    const inf = this.inferno;
    if (!inf || !inf.active) return;
    const heat = this.infernoHeat();
    const t = this.time;
    const rnd = (k) => { const v = Math.sin(k * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
    /* brilho do chao (fica mais forte com o calor) */
    const glow = ctx.createLinearGradient(0, -90, 0, 6);
    glow.addColorStop(0, 'rgba(255,90,20,0)');
    glow.addColorStop(1, 'rgba(255,110,30,' + (0.10 + heat * 0.30).toFixed(3) + ')');
    ctx.fillStyle = glow;
    ctx.fillRect(0, -90, W, 96);
    /* frames 0-2 da coluna de fogo (fx2:fire linha 1) = chama nascendo ->
       alta; cada chama tem fase propria pra nao piscar tudo junto */
    const flame = (x, sc, k) => {
      const f = Math.floor(t / 5 + k * 1.7) % 3;
      Art.cell(ctx, 'fx2:fire', 1, f, x, -24 * sc, { scale: sc });
    };
    /* PAREDES: avancam das bordas pro meio (ate ~230px de cada lado) */
    const wall = 30 + heat * 200;
    const rows = 1 + Math.floor(heat * 3);
    for (let side = 0; side < 2; side++) {
      for (let x = 0; x < wall; x += 46) {
        for (let r = 0; r < rows; r++) {
          const k = side * 100 + x + r * 13;
          const sc = 1.15 + heat * 1.1 + rnd(k) * 0.35 - r * 0.25;
          const xx = side ? W - 18 - x : 18 + x;
          flame(xx + (rnd(k + 5) - 0.5) * 18, Math.max(0.7, sc), k);
        }
      }
    }
    /* CHAO: chamas soltas que aparecem conforme o calor sobe */
    const n = Math.round(4 + heat * 14);
    for (let i = 0; i < n; i++) {
      const x = wall + 40 + rnd(i + 9) * Math.max(40, W - 2 * wall - 80);
      const life = (t * 0.6 + rnd(i) * 400) % 400; /* cada uma nasce e some */
      const grow = Math.min(1, life / 60) * Math.min(1, (400 - life) / 60);
      if (grow <= 0.05) continue;
      flame(x, (0.6 + heat * 0.9) * grow, i + 50);
    }
    /* BRASAS subindo (mais no estagio 3) */
    if (!this.reduced) {
      const e = Math.round(10 + heat * 40);
      for (let i = 0; i < e; i++) {
        const sp = 0.6 + rnd(i + 3) * 1.4;
        const y = -((t * sp + rnd(i) * 520) % 520);
        const x = rnd(i + 21) * W + Math.sin(t * 0.03 + i) * 12;
        ctx.globalAlpha = Math.max(0, 1 + y / 520) * (0.5 + heat * 0.5);
        ctx.fillStyle = i % 3 ? '#ffb347' : '#ff5a1f';
        ctx.fillRect(Math.round(x), Math.round(y), 3, 3);
      }
      ctx.globalAlpha = 1;
    }
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
