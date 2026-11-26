/* ============================================================
   DS FIGHTERS — "O SEU MAIOR INIMIGO: VOCÊ MESMO" (nov/2026).
   Luta secreta no fim do torneio: tirar nota A ou S (o "A+") no chefe
   final abre mais uma luta, contra uma versao sombria do proprio lutador.

   REGRAS
   - A sombra tem a barra de MEMORIA (1000) no lugar da vida. Fora do
     atordoamento ela LE e ANULA todo golpe (soco, chute, habilidade,
     projetil, golpe de pet) e pune em seguida.
   - FRAGMENTOS DE MEMORIA (vidro transparente, da pra ver o mapa atras)
     caem do ceu de tempos em tempos:
       pegar o fragmento  -> a sombra perde memoria (dano direto)
       fragmento cai no chao -> estilhaça e a sombra fica 10 s ATORDOADA,
                                imovel; nesse tempo os golpes entram.
     (paralisada ela sente metade do golpe: os fragmentos sao o caminho)
   - O jogador tem 3 VIDAS de 500. A luta dura 10 MINUTOS: zerar a memoria
     OU sobreviver ate o fim = vitoria. Perder as 3 vidas = derrota.
   - Visual: sprite e ataques da sombra em cores sombrias, aura escura,
     mapa aleatorio descolorido com clima de creepypasta (olhos no escuro,
     texto subliminar, estatica, glitch). Musica: so a lista "shadow".
   Tudo ligado por cfg.shadowFight (UI.launchArcade).
   ============================================================ */
(() => {
  if (typeof Game === 'undefined' || typeof Fighter === 'undefined') return;
  const G = Game.prototype;
  const F = Fighter.prototype;
  const SHADOW_HP = 1000;
  const PLAYER_HP = 500;
  const LIVES = 3;
  const STUN = 600;          /* 10 s a 60 fps */
  const FRAG_EVERY = 720;    /* um fragmento a cada ~12-15 s */
  const STUN_TAKEN = 0.5;    /* paralisada ela sente metade do golpe: os fragmentos seguem sendo o caminho */
  const SHADOW_DMG = 0.75;   /* golpe da sombra: le tudo e pune sempre, mas 10 min com 3 vidas tem que ser possivel */
  const FRAG_DMG = 55;
  const SHADOW_FILTER = 'grayscale(0.55) brightness(0.42) contrast(1.35) sepia(0.35) hue-rotate(225deg) saturate(2.2)';
  const ATTACK_FILTER = 'hue-rotate(205deg) saturate(1.8) brightness(0.62) contrast(1.4)';
  const WHISPERS = ['VOCÊ NÃO PODE FUGIR DE SI MESMO', 'EU LEMBRO DE TUDO', 'VOCÊ ESQUECEU', 'OLHE PARA TRÁS', 'NÓS SOMOS UM', 'POR QUE VOCÊ LUTA?', 'ISSO É SÓ UMA MEMÓRIA'];
  const rnd = (g) => (g.rnd ? g.rnd() : Math.random());

  Game.SHADOW = { SHADOW_HP, PLAYER_HP, LIVES, STUN, FRAG_EVERY, FRAG_DMG, STUN_TAKEN, SHADOW_DMG, SHADOW_FILTER, ATTACK_FILTER };

  /* ---------- montagem (chamada no start, antes do beginRound) ---------- */
  G.applyShadowFight = function () {
    if (!this.cfg || !this.cfg.shadowFight) return;
    const me = this.teams[0] && this.teams[0].members[0];
    const sh = this.teams[1] && this.teams[1].members[0];
    if (!me || !sh) return;
    sh.shadowSelf = true;
    sh.def = Object.assign({}, sh.def, { name: 'SOMBRA DE ' + String(me.def.name || '').toUpperCase(), title: 'O seu maior inimigo', boss: false });
    sh.maxHp = SHADOW_HP; sh.hp = SHADOW_HP; sh.redHp = SHADOW_HP;
    sh.pet = PETS[0];
    sh.bossDmg = SHADOW_DMG; /* bossDmg: o applyCpuLevel nao poe o multiplicador do torneio por cima */
    sh.skinHue = SHADOW_FILTER; /* SpriteGen.blit aceita filtro pronto em string */
    me.maxHp = PLAYER_HP; me.hp = PLAYER_HP; me.redHp = PLAYER_HP;
    me.shadowLives = LIVES;
    this.shadow = { mem: SHADOW_HP, frags: [], next: 240, whisper: null, whisperT: 600, eyes: [], flash: 0, glitch: 0, lastStunAt: -9999, collected: 0, fallen: 0, punishes: 0 };
  };
  /* o clima nasce no beginRound: depois dele, névoa escura fixa */
  const oBegin = G.beginRound;
  G.beginRound = function () {
    oBegin.call(this);
    if (this.cfg && this.cfg.shadowFight && this.weather) {
      this.weather.pool = ['darkfog'];
      if (this.netRole !== 'guest') { try { this.weather.set('darkfog'); } catch (e) { /* clima opcional */ } }
    }
  };

  /* ---------- a sombra anula tudo fora do atordoamento ---------- */
  /* o atordoamento de 10 s nao passa pelo addStatus: 'paralyze' tem teto de
     72 frames por janela. Escreve direto no status e renova a cada frame. */
  F.shadowStunned = function () { return this._shadowStun > 0; };
  F._shadowNullify = function (o) {
    const g = this.game;
    if (g.floatText && (!this._lastNull || this.now - this._lastNull > 10)) g.floatText(this.x, this.y - 230, 'LIDO.', '#b98cff');
    this._lastNull = this.now;
    if (g.spawnBurst) g.spawnBurst('impact', 2, this.x - (this.dir || 1) * 20, this.y - 100, this.dir || 1, 1.3);
    if (g.audio && g.audio.block) g.audio.block();
    if (this.state !== 'attack' && this.state !== 'cast') { this.state = 'block'; this.stateTime = 0; }
    this._punishT = 26; /* pune logo em seguida */
    if (g.shadow) g.shadow.punishes++;
    const atk = o && o.attacker;
    if (atk && atk.vx !== undefined && Math.abs(atk.x - this.x) < 140) atk.vx = Math.sign(atk.x - this.x) * 3.2; /* empurra o golpe de volta */
    return false; /* golpe nao entrou (projeteis/onHit tratam como esquiva) */
  };
  const oTake = F.takeHit;
  F.takeHit = function (d, o) {
    if (this.shadowSelf && this.game.cfg && this.game.cfg.shadowFight) {
      if (!this.shadowStunned()) return this._shadowNullify(o || {});
      return oTake.call(this, d * STUN_TAKEN, o || {});
    }
    return oTake.call(this, d, o || {});
  };
  const oChip = F.chip;
  F.chip = function (n, attacker) {
    if (this.shadowSelf && this.game.cfg && this.game.cfg.shadowFight) { if (!this.shadowStunned()) return; n *= STUN_TAKEN; }
    return oChip.call(this, n, attacker);
  };
  /* 3 vidas de 500: cair com vida sobrando volta de pe */
  const oDefeat = F.defeat;
  F.defeat = function (sign) {
    const g = this.game;
    /* a sombra nao cai fora do atordoamento (qualquer caminho de dano) */
    if (this.shadowSelf && g.cfg && g.cfg.shadowFight && g.shadow && g.shadow.mem > 0 && !this.shadowStunned()) { this.hp = g.shadow.mem; return; }
    if (g.cfg && g.cfg.shadowFight && this.team === 0 && (this.shadowLives || 0) > 1) {
      this.shadowLives--;
      this.hp = this.maxHp; this.redHp = this.maxHp;
      this.state = 'idle'; this.stateTime = 0; this.hitstun = 0; this.stunGauge = 0;
      this.vx = 0; this.vy = 0; this.y = 0;
      this.cast = null; this.rush = null; this.attack = null;
      this.status = {};
      this.addStatus('invuln', 150);
      if (g.announce) g.announce('VIDA PERDIDA', '#b98cff', 'Restam ' + this.shadowLives + ' de ' + LIVES);
      if (g.shadow) g.shadow.flash = 24;
      if (g.shake) g.shake(16);
      return;
    }
    return oDefeat.call(this, sign);
  };

  /* ---------- IA: leitura perfeita + punicao ---------- */
  const oInput = G.inputFor;
  G.inputFor = function (ti) {
    const f = this.activeOf(ti);
    if (!(this.cfg && this.cfg.shadowFight && f && f.shadowSelf)) return oInput.call(this, ti);
    if (f.shadowStunned()) return EMPTY_INPUT;
    const opp = this.activeOf(1 - ti);
    const base = (typeof AI !== 'undefined') ? AI.think(f, opp, 3) : Object.assign({}, EMPTY_INPUT);
    return shadowBrain(this, f, opp, Object.assign({}, base));
  };
  function shadowBrain(g, me, opp, inp) {
    if (!opp || !opp.alive) return inp;
    const dx = opp.x - me.x;
    const dist = Math.abs(dx);
    const toward = dx > 0 ? 'right' : 'left';
    const away = dx > 0 ? 'left' : 'right';
    const oppAtk = opp.attack && opp.state === 'attack';
    const oppStartup = oppAtk && opp.stateTime < (opp.attack.startup || 6) + (opp.attack.active || 3);
    const oppRecovery = (oppAtk && !oppStartup) || (opp.state === 'cast' && opp.stateTime > 12) || opp.landT > 0 || opp.state === 'blockstun';
    /* 1) golpe vindo: segura a guarda (a leitura anula de qualquer jeito) */
    if (oppStartup && dist < 170 && !me._punishT) { inp[away] = true; inp[toward] = false; inp.punch = false; inp.kick = false; return inp; }
    /* 2) janela de punicao: depois de anular, ou rival em recuperacao/whiff */
    if ((me._punishT > 0 || oppRecovery) && dist < 150) {
      inp[toward] = dist > 70; inp[away] = false;
      const t = g.time % 18;
      inp.punch = t < 6; inp.kick = t >= 9 && t < 14;
      if (me._punishT > 0 && me._punishT < 10) { for (let i = 0; i < 4; i++) inp['a' + i] = false; inp['a' + ((g.time >> 3) % 4)] = true; }
      return inp;
    }
    /* 3) sempre colado: pressao constante */
    if (dist > 110) { inp[toward] = true; inp[away] = false; }
    return inp;
  }

  /* ---------- tick: fragmentos, atordoamento, HUD ---------- */
  const oTick = G.tickEntities;
  G.tickEntities = function () {
    oTick.call(this);
    if (this.cfg && this.cfg.shadowFight && this.shadow) this.shadowTick();
  };
  G.shadowPlayer = function () { return this.activeOf(0); };
  G.shadowEnemy = function () { return this.activeOf(1); };
  G.shadowTick = function () {
    const S = this.shadow;
    const me = this.shadowPlayer(), sh = this.shadowEnemy();
    if (!me || !sh) return;
    if (sh._punishT > 0) sh._punishT--;
    if (sh._shadowStun > 0) {
      sh._shadowStun--;
      sh.vx = 0; sh.cast = null; sh.rush = null;
      if (sh.state === 'attack' || sh.state === 'cast') { sh.state = 'hit'; sh.stateTime = 0; sh.attack = null; }
      sh.status.paralyze = sh.now + sh._shadowStun + 1; /* selo PARALISADO conta os 10 s */
      if (sh.alive) { S.mem = Math.min(S.mem, sh.hp); sh.hp = S.mem; } /* atordoada: o dano vale e a memoria so desce (sem regen da barra vermelha) */
      if (sh._shadowStun <= 0) { sh.status.paralyze = 0; if (this.floatText) this.floatText(sh.x, sh.y - 230, 'ACORDOU', '#ff4b6b'); }
    } else if (sh.alive) {
      /* memoria autoritativa: nada fora do atordoamento tira (nem cura) a sombra */
      sh.hp = S.mem;
      if (sh.has && sh.has('paralyze')) sh.status.paralyze = 0;
    }
    if (this.roundState !== 'fight' || this.netRole === 'guest') { this.shadowHud(); return; }
    /* nasce fragmento */
    S.next--;
    if (S.next <= 0 && S.frags.length < 3) {
      S.next = FRAG_EVERY + Math.floor(rnd(this) * 160);
      const W = this.W || 960;
      S.frags.push({ x: 120 + rnd(this) * (W - 240), y: -440, vy: 0.85 + rnd(this) * 0.25, rot: rnd(this) * 6, vr: (rnd(this) - 0.5) * 0.03, ph: rnd(this) * 6, shape: Math.floor(rnd(this) * 3), age: 0 });
    }
    for (const fr of S.frags) {
      fr.age++;
      fr.y += fr.vy;
      fr.x += Math.sin(fr.ph + fr.age * 0.03) * 0.6;
      fr.rot += fr.vr;
      /* pegou: o jogador encosta no vidro */
      if (!fr.done && me.alive && Math.abs(me.x - fr.x) < 48 && fr.y > me.y - 210 && fr.y < me.y + 14) {
        fr.done = 'got';
        S.collected++;
        S.mem = Math.max(0, S.mem - FRAG_DMG);
        sh.redHp = Math.max(sh.redHp, sh.hp);
        sh.hp = S.mem;
        if (this.floatText) this.floatText(sh.x, sh.y - 220, '-' + FRAG_DMG + ' MEMÓRIA', '#d8e8ff');
        if (this.registerHit) this.registerHit(me, sh, FRAG_DMG, false, 6);
        this.shardBurst(fr.x, fr.y, 14);
        S.flash = 6;
        if (this.audio && this.audio.play) this.audio.play('ice', { vol: 0.6 });
        if (sh.hp <= 0) { sh._shadowStun = 0; sh.status.paralyze = 0; oDefeat.call(sh, Math.sign(sh.x - me.x) || 1); }
      } else if (!fr.done && fr.y >= 0) {
        /* caiu no chao: estilhaça e a sombra fica 10 s atordoada */
        fr.done = 'fell';
        S.fallen++;
        this.shardBurst(fr.x, -4, 22);
        if (this.audio && this.audio.play) this.audio.play('ice', { vol: 0.8 });
        if (this.shake) this.shake(8);
        if (!(sh._shadowStun > 0) && sh.alive) {
          sh._shadowStun = STUN;
          sh.status.paralyze = sh.now + STUN;
          sh.vx = 0; sh.state = 'hit'; sh.stateTime = 0; sh.attack = null; sh.cast = null;
          S.lastStunAt = this.time;
          if (this.announce) this.announce('A MEMÓRIA CAIU', '#d8e8ff', 'Ele está paralisado por 10 segundos!');
        }
      }
    }
    S.frags = S.frags.filter((fr) => !fr.done);
    /* clima: sussurros, olhos, glitch */
    S.whisperT--;
    if (S.whisperT <= 0) { S.whisperT = 700 + Math.floor(rnd(this) * 600); S.whisper = { text: WHISPERS[Math.floor(rnd(this) * WHISPERS.length) % WHISPERS.length], t: 0, x: 200 + rnd(this) * 560, y: 190 + rnd(this) * 180 }; }
    if (S.whisper) { S.whisper.t++; if (S.whisper.t > 90) S.whisper = null; }
    if (rnd(this) < 0.004 && S.eyes.length < 4) S.eyes.push({ x: rnd(this) < 0.5 ? 30 + rnd(this) * 140 : 790 + rnd(this) * 140, y: 90 + rnd(this) * 240, t: 0, life: 150 + Math.floor(rnd(this) * 150) });
    for (const e of S.eyes) e.t++;
    S.eyes = S.eyes.filter((e) => e.t < e.life);
    if (S.flash > 0) S.flash--;
    if (rnd(this) < 0.006) S.glitch = 8 + Math.floor(rnd(this) * 10);
    if (S.glitch > 0) S.glitch--;
    this.shadowHud();
  };
  G.shardBurst = function (x, y, n) {
    if (this.reduced || !this.sparks) return;
    for (let k = 0; k < n && this.sparks.length < 220; k++) {
      const a = rnd(this) * Math.PI * 2, v = 1.5 + rnd(this) * 5;
      this.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 26 + rnd(this) * 14, color: k % 3 ? 'rgba(210,230,255,0.9)' : 'rgba(255,255,255,1)', size: 2.2, glow: true, gravity: 0.22, fade: true });
    }
  };

  const S0 = (g) => g.shadow || (g.shadow = { mem: 0, frags: [], eyes: [] });
  /* tempo acabou = sobreviveu = venceu */
  const oTimeUp = G.timeUp;
  G.timeUp = function () {
    if (this.cfg && this.cfg.shadowFight) {
      const sh = this.shadowEnemy();
      if (this.announce) this.announce('VOCÊ SOBREVIVEU', '#d8e8ff', '10 minutos contra si mesmo');
      if (sh && sh.alive) { sh._shadowStun = 0; sh.status.paralyze = 0; S0(this).mem = 0; sh.hp = 0; oDefeat.call(sh, 1); }
      return;
    }
    return oTimeUp.call(this);
  };

  /* ---------- HUD da luta (vidas, memoria, tempo, atordoamento) ---------- */
  G.shadowHud = function () {
    if (typeof document === 'undefined' || !document.getElementById) return;
    let el = document.getElementById('shadow-hud');
    if (!el) {
      const app = document.getElementById('app');
      if (!app || !document.createElement) return;
      el = document.createElement('div');
      el.id = 'shadow-hud';
      el.className = 'shadow-hud';
      el.innerHTML = '<span class="sh-lives"></span><span class="sh-time"></span><span class="sh-mem"></span><span class="sh-stun"></span>';
      app.appendChild(el);
    }
    if (!el.querySelector) return;
    el.hidden = !(this.running && this.cfg && this.cfg.shadowFight);
    if (el.hidden) return;
    const me = this.shadowPlayer(), sh = this.shadowEnemy();
    const lives = me ? (me.shadowLives || 0) : 0;
    const set = (sel, v) => { const n = el.querySelector(sel); if (n && n._v !== v) { n._v = v; n.textContent = v; } };
    set('.sh-lives', '♥'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, LIVES - lives)));
    const secs = Math.max(0, Math.ceil(this.roundTimer || 0));
    set('.sh-time', Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0'));
    set('.sh-mem', 'MEMÓRIA ' + Math.max(0, Math.ceil(sh ? sh.hp : 0)) + '/' + SHADOW_HP);
    set('.sh-stun', sh && sh._shadowStun > 0 ? 'PARALISADO ' + Math.ceil(sh._shadowStun / 60) + 's — BATA AGORA!' : '');
  };
  G.shadowHudOff = function () { const el = typeof document !== 'undefined' && document.getElementById && document.getElementById('shadow-hud'); if (el) el.hidden = true; };

  /* ---------- a sombra fala com a propria voz ---------- */
  const SHADOW_LINES = ['Eu sou o que você esconde.', 'Eu já sei o seu próximo golpe.', 'Você treinou. Eu lembrei.', 'Não existe golpe que eu não conheça.', 'Fica. Ninguém sai daqui.', 'Você ainda acha que é o original?'];
  const oSay = G.say;
  G.say = function (f, text, file) {
    if (this.shadow && f && f.shadowSelf) {
      const k = (this.shadow.lineK = (this.shadow.lineK || 0) + 1);
      return oSay.call(this, f, SHADOW_LINES[(k - 1) % SHADOW_LINES.length], null);
    }
    return oSay.call(this, f, text, file);
  };

  /* ---------- efeitos da sombra saem escuros ---------- */
  G.darkDraw = function (ctx, o, fn) {
    if (!(o && (o.shadowSelf || o.dark)) || !ctx.save) return fn();
    ctx.save();
    try { ctx.filter = ATTACK_FILTER; } catch (e) { /* sem filtro */ }
    try { fn(); } finally { ctx.restore(); }
  };
  const oBurst = G.spawnBurst;
  G.spawnBurst = function (...a) {
    oBurst.apply(this, a);
    if (this._darkFx && this.bursts.length) this.bursts[this.bursts.length - 1].dark = true;
  };
  const oImg = G.spawnImgFx;
  if (oImg) G.spawnImgFx = function (...a) {
    const r = oImg.apply(this, a);
    if (this._darkFx && this.imgFx && this.imgFx.length) this.imgFx[this.imgFx.length - 1].dark = true;
    return r;
  };
  const oImpact = G.spawnAbilityImpact;
  G.spawnAbilityImpact = function (owner, ...a) {
    const prev = this._darkFx;
    this._darkFx = !!(this.shadow && owner && owner.shadowSelf);
    try { return oImpact.call(this, owner, ...a); } finally { this._darkFx = prev; }
  };
  const oUpd = F.update;
  F.update = function (...a) {
    const g = this.game;
    if (!g || !g.shadow) return oUpd.apply(this, a);
    const prev = g._darkFx;
    g._darkFx = !!this.shadowSelf;
    try { return oUpd.apply(this, a); } finally { g._darkFx = prev; }
  };

  /* ---------- DESENHO ---------- */
  /* fundo: mapa descolorido, escuro e arroxeado (os lutadores vem depois) */
  G.drawShadowBackdrop = function (ctx, W, H) {
    if (!this.shadow || !ctx.fillRect) return;
    ctx.save();
    try { ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = 0.78; ctx.fillStyle = '#808080'; ctx.fillRect(-20, -20, W + 40, H + 40); } catch (e) { /* sem blend */ }
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgb(120,96,150)';
    ctx.fillRect(-20, -20, W + 40, H + 40);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.22 + 0.06 * Math.sin((this.time || 0) * 0.02);
    ctx.fillStyle = '#05000c';
    ctx.fillRect(-20, -20, W + 40, H + 40);
    ctx.restore();
  };
  /* fragmentos de vidro + aura da sombra (espaco do chao) */
  G.drawShadowWorld = function (ctx, layer) {
    const S = this.shadow;
    if (!S || !ctx.save) return;
    if (layer === 'front') { for (const fr of S.frags) this.drawShard(ctx, fr); return; }
    const sh = this.shadowEnemy();
    /* aura escura subindo da sombra (atras dela) */
    if (sh && !this.reduced && ctx.createRadialGradient) {
      ctx.save();
      const t = this.time || 0;
      const g = ctx.createRadialGradient(sh.x, sh.y - 100, 10, sh.x, sh.y - 100, 120);
      g.addColorStop(0, 'rgba(20,0,40,0.55)');
      g.addColorStop(0.6, 'rgba(60,0,90,0.25)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(sh.x - 130, sh.y - 230, 260, 260);
      for (let k = 0; k < 10; k++) {
        const c = ((t * (0.9 + (k % 3) * 0.3) + k * 37) % 160) / 160;
        ctx.globalAlpha = (1 - c) * 0.6;
        ctx.fillStyle = k % 2 ? '#1a0030' : '#3a0a5a';
        const x = sh.x + Math.sin(k * 2.1 + t * 0.05) * 34;
        if (ctx.arc) { ctx.beginPath(); ctx.arc(x, sh.y - 10 - c * 190, 6 + c * 10, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.restore();
    }
    /* correntes de memoria na sombra paralisada */
    if (sh && sh._shadowStun > 0 && ctx.strokeRect) {
      ctx.save();
      ctx.globalAlpha = 0.6 + 0.3 * Math.sin((this.time || 0) * 0.2);
      ctx.strokeStyle = '#d8e8ff'; ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) { if (ctx.ellipse) { ctx.beginPath(); ctx.ellipse(sh.x, sh.y - 60 - k * 45, 46, 12, 0, 0, Math.PI * 2); ctx.stroke(); } }
      ctx.restore();
    }
  };
  /* VIDRO: preenchimento quase transparente (o mapa aparece atras), bordas
     claras, reflexo diagonal correndo e o eco do retrato do lutador dentro. */
  const SHAPES = [
    [[0, -46], [30, -14], [20, 38], [-22, 44], [-34, -6]],
    [[-8, -50], [28, -30], [36, 18], [4, 48], [-30, 24], [-26, -24]],
    [[0, -54], [24, 4], [8, 50], [-20, 40], [-28, -12]],
  ];
  G.drawShard = function (ctx, fr) {
    if (!ctx.save || !ctx.moveTo) return;
    const pts = SHAPES[fr.shape % SHAPES.length];
    const t = this.time || 0;
    ctx.save();
    ctx.translate(fr.x, fr.y);
    if (ctx.rotate) ctx.rotate(Math.sin(fr.rot) * 0.4);
    const path = () => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };
    /* brilho de fundo (halo) */
    if (ctx.createRadialGradient) {
      const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, 70);
      halo.addColorStop(0, 'rgba(200,225,255,0.22)');
      halo.addColorStop(1, 'rgba(200,225,255,0)');
      ctx.fillStyle = halo; ctx.fillRect(-70, -70, 140, 140);
    }
    /* corpo de vidro: so 10% de opacidade -> o mapa aparece atras */
    path();
    ctx.fillStyle = 'rgba(215,232,255,0.10)';
    ctx.fill();
    /* eco da memoria: retrato do lutador bem fraquinho dentro do vidro */
    const me = this.shadowPlayer();
    if (me && typeof SpriteGen !== 'undefined' && ctx.clip) {
      ctx.save();
      path(); ctx.clip();
      ctx.globalAlpha = 0.22 + 0.08 * Math.sin(t * 0.08 + fr.ph);
      try { SpriteGen.blit(ctx, me.spriteKey(), 'idle', 0, 1, 0, 48, false, 0.32); } catch (e) { /* sem folha */ }
      ctx.restore();
    }
    /* reflexo diagonal passando */
    if (ctx.clip && ctx.createLinearGradient) {
      ctx.save();
      path(); ctx.clip();
      const k = ((t * 1.4 + fr.ph * 40) % 160) - 80;
      const lg = ctx.createLinearGradient(k - 18, -60, k + 18, 60);
      lg.addColorStop(0, 'rgba(255,255,255,0)');
      lg.addColorStop(0.5, 'rgba(255,255,255,0.55)');
      lg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = lg; ctx.fillRect(-60, -60, 120, 120);
      ctx.restore();
    }
    /* bordas de vidro + aresta interna */
    path();
    ctx.lineWidth = 2.2; ctx.strokeStyle = 'rgba(235,245,255,0.9)';
    ctx.stroke();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(150,190,255,0.7)';
    ctx.beginPath(); ctx.moveTo(pts[0][0] * 0.5, pts[0][1] * 0.5); ctx.lineTo(pts[2][0] * 0.5, pts[2][1] * 0.5); ctx.stroke();
    ctx.restore();
  };
  /* overlay creepypasta (espaco de tela, por cima de tudo) */
  let grain = null;
  G.drawShadowOverlay = function (ctx, W, H) {
    const S = this.shadow;
    if (!S || !ctx.save) return;
    const t = this.time || 0;
    ctx.save();
    /* vinheta pesada pulsando */
    if (ctx.createRadialGradient) {
      const v = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.22, W / 2, H * 0.5, W * 0.62);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, 'rgba(8,0,14,' + (0.62 + 0.08 * Math.sin(t * 0.03)).toFixed(3) + ')');
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    }
    /* granulado de fita velha */
    if (!this.reduced && typeof document !== 'undefined' && document.createElement) {
      if (!grain) {
        try {
          const c = document.createElement('canvas'); c.width = 240; c.height = 136;
          const x = c.getContext('2d');
          if (x && x.createImageData) {
            const im = x.createImageData(240, 136);
            for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 34; }
            x.putImageData(im, 0, 0);
            grain = c;
          } else grain = false;
        } catch (e) { grain = false; }
      }
      if (grain) { ctx.globalAlpha = 0.5; ctx.drawImage(grain, -(t * 37 % 240), -(t * 23 % 136), W + 480, H + 272); ctx.globalAlpha = 1; }
    }
    /* olhos abrindo no escuro das bordas */
    for (const e of S.eyes) {
      const open = Math.min(1, e.t / 20) * Math.min(1, (e.life - e.t) / 20);
      const blink = (e.t % 90) > 84 ? 0.1 : 1;
      const h = 4 * open * blink;
      ctx.globalAlpha = 0.85 * open;
      ctx.fillStyle = '#ff2a3a';
      if (ctx.ellipse) { ctx.beginPath(); ctx.ellipse(e.x - 9, e.y, 5, h, 0, 0, Math.PI * 2); ctx.ellipse(e.x + 9, e.y, 5, h, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    /* sussurro subliminar */
    if (S.whisper && ctx.fillText) {
      const w = S.whisper;
      const a = w.t < 6 ? w.t / 6 : w.t > 70 ? Math.max(0, (90 - w.t) / 20) : 1;
      ctx.globalAlpha = 0.55 * a;
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#e8dcff';
      ctx.fillText(w.text, w.x + Math.sin(t * 0.9) * 2, w.y);
    }
    /* falha de imagem: faixas deslocadas + vermelho invertido rapido */
    if (S.glitch > 0 && !this.reduced) {
      ctx.globalAlpha = 0.35;
      for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? 'rgba(255,0,60,0.6)' : 'rgba(0,255,220,0.5)'; ctx.fillRect(0, (t * 53 + k * 97) % H, W, 2 + (k % 3) * 3); }
    }
    if (S.flash > 0) { ctx.globalAlpha = S.flash / 30; ctx.fillStyle = '#e8e0ff'; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  };
})();
