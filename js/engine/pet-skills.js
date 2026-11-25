/* ============================================================
   DS FIGHTERS — HABILIDADES ATIVAS DOS PETS DEV (nov/2026).
   Os pets antigos so davam numero (+defesa, +dano...). Estes AGEM na luta:
     postgres      ROLLBACK: 1x por round, golpe pesado (18+) perde metade do dano
     npm           NPM INSTALL: a cada 12s, pacote aleatorio por 5s
                   (velocidade +25% | dano +18% | defesa +18% | medidor +25)
     mysql         SONAR: a cada 7s, pulso no rival (ate 520px): 6 de dano + LENTO
     stackoverflow RESPOSTA ACEITA: 15% de chance de tomar so 25% do dano
     gopher-go     GOROUTINES: a cada 4o acerto do dono, 2 golpes extras de 3
     pato          DEBUG: com debuff, em 1s limpa tudo e cura 6 (recarga 9s)
   Ganchos no fighter.js: petBeforeDamage (takeHit), petOnHit (acerto do
   dono), petTick (update), petResetRound (applyPet), petRow (desenho).
   Sorteios usam game.rnd quando existe (online deterministico).
   ============================================================ */
(() => {
  if (typeof Fighter === 'undefined') return;
  const P = Fighter.prototype;
  const rnd = (f) => (f.game.rnd ? f.game.rnd() : Math.random());
  const DEBUFFS = ['burn', 'poison', 'slow', 'trap', 'freeze', 'locked', 'blind', 'shock', 'chill', 'bleed', 'vuln', 'dizzy', 'meterSlow', 'glitch', 'shuffled'];
  const NPM_PKGS = [
    { k: 'speed', v: 0.25, txt: 'npm i turbo-speed', c: '#ffd84b' },
    { k: 'dmg', v: 0.18, txt: 'npm i mega-dano', c: '#ff6a4a' },
    { k: 'def', v: 0.18, txt: 'npm i escudo-js', c: '#4ba3ff' },
    { k: 'meter', v: 25, txt: 'npm i ult-booster', c: '#b06bff' },
  ];

  P.petResetRound = function () {
    this._rollbackUsed = false;
    this._npmPkg = null;
    this._petT = { npm: (this.now || 0) + 300, sonar: (this.now || 0) + 240, debugCd: 0, debugAt: 0 };
    this._goq = [];
    this._goCount = 0;
  };

  P.petCheer = function (txt, color) {
    this._petCheerUntil = (this.now || 0) + 50;
    if (txt) this.game.floatText(this.x - (this.dir || 1) * 70, this.y - 240, txt, color || '#ffd27d');
  };

  /* bonus temporario do pacote npm entra no pfx (lido em dano/defesa/velocidade) */
  P.petTempFx = function () {
    const p = this._npmPkg;
    if (!p || (this.now || 0) >= p.until || p.k === 'meter') return null;
    return { [p.k]: p.v };
  };

  P.petBeforeDamage = function (d, o, atk) {
    const fx = this.pfx;
    if (!d || d <= 0) return d;
    if (fx.owlGuard && !(o && o.unblockable) && rnd(this) < fx.owlGuard) {
      this.petCheer('RESPOSTA ACEITA!', '#ffb347');
      this.petFx('owl', { life: 32 });
      this.game.spawnBurst('arcane', 2, this.x, this.y - 100, 1, 1.6);
      return d * 0.25;
    }
    if (fx.rollback && !this._rollbackUsed && d >= 18) {
      this._rollbackUsed = true;
      this.petCheer('ROLLBACK!', '#7ec8ff');
      this.petFx('rollback', { life: 44 });
      this.game.spawnBurst('water', 2, this.x, this.y - 100, 1, 1.9);
      return d * (1 - fx.rollback);
    }
    return d;
  };

  P.petOnHit = function (victim, d) {
    const n = this.pfx.goroutines;
    if (!n || !victim || !victim.alive) return;
    this._goCount = (this._goCount || 0) + 1;
    if (this._goCount % 4 !== 0) return;
    const t = this.now || 0;
    this._goq = (this._goq || []).concat([{ at: t + 8, v: victim }, { at: t + 16, v: victim }]);
    const px = this.x - (this.dir || 1) * 78, py = this.y - 150;
    this.petFx('go', { life: 18, x0: px, y0: py, x1: victim.x, y1: victim.y - 90 });
    this.petFx('go', { life: 26, x0: px, y0: py + 10, x1: victim.x, y1: victim.y - 70 });
    this.petCheer('go func()!', '#7fe3ff');
  };

  P.petTick = function () {
    const fx = this.pet && this.pet.fx;
    if (!fx || !this.alive || !this.game || this.game.roundState !== 'fight') return;
    if (!this._petT) this.petResetRound();
    const t = this.now || 0;
    const T = this._petT;
    const game = this.game;
    /* GOROUTINES: golpes extras agendados */
    if (this._goq && this._goq.length) {
      const due = this._goq.filter((g) => g.at <= t);
      this._goq = this._goq.filter((g) => g.at > t);
      for (const g of due) {
        if (!g.v || !g.v.alive) continue;
        g.v.chip(fx.goroutines, this);
        game.floatText(g.v.x, g.v.y - 190, '-' + fx.goroutines, '#7fe3ff');
        for (let k = 0; k < 4; k++) game.spark(g.v.x + (rnd(this) - 0.5) * 30, g.v.y - 90 - rnd(this) * 40, '#7fe3ff');
      }
    }
    /* NPM INSTALL */
    if (fx.npm && t >= T.npm) {
      T.npm = t + 720;
      const pkg = NPM_PKGS[Math.floor(rnd(this) * NPM_PKGS.length) % NPM_PKGS.length];
      this._npmPkg = { k: pkg.k, v: pkg.v, until: t + 300 };
      if (pkg.k === 'meter') {
        this.charge[0] = Math.min(100, this.charge[0] + pkg.v);
        this.charge[1] = Math.min(100, this.charge[1] + pkg.v);
        this.ultimate = Math.min(100, this.ultimate + pkg.v * 0.4);
      }
      this.petCheer(pkg.txt, pkg.c);
      this.petFx('npm', { life: 46, x: this.x - (this.dir || 1) * 78, y: this.y - 160, c: pkg.c });
      game.spawnBurst('arcane', 2, this.x - (this.dir || 1) * 78, this.y - 170, 1, 1.4);
    }
    /* SONAR */
    if (fx.sonar && t >= T.sonar) {
      const foe = this.enemy && this.enemy();
      if (foe && foe.alive && !foe.hidden && Math.abs(foe.x - this.x) <= 520) {
        T.sonar = t + 420;
        const px = this.x - (this.dir || 1) * 78, py = this.y - 168;
        this.petFx('sonar', { life: 34, x0: px, y0: py, x1: foe.x, y1: foe.y - 100 });
        foe.takeHit(fx.sonar, { attacker: this, kx: 1.5, dirSign: Math.sign(foe.x - this.x) || 1, stun: 6, slow: 45, ability: true });
        this.petCheer('SONAR!', '#8fd8ff');
      } else T.sonar = t + 30;
    }
    /* DEBUG (pato) */
    if (fx.debug && t >= T.debugCd) {
      const bad = DEBUFFS.some((s) => this.left && this.left(s) > 0);
      if (bad && !T.debugAt) T.debugAt = t + 60;
      if (!bad) T.debugAt = 0;
      if (T.debugAt && t >= T.debugAt) {
        DEBUFFS.forEach((s) => { this.status[s] = 0; });
        this.heal(fx.debug);
        T.debugAt = 0;
        T.debugCd = t + 540;
        this.petCheer('DEBUGADO!', '#ffe14a');
        this.petFx('duck', { life: 50 });
      }
    }
  };

  /* linha do atlas do pet: 0 parado, 1 susto (dono apanhou/caiu), 2 comemora */
  P.petRow = function () {
    if (this.state === 'win' || (this._petCheerUntil && (this.now || 0) < this._petCheerUntil)) return 2;
    if (this.state === 'hit' || this.state === 'thrown' || this.state === 'down' || !this.alive) return 1;
    return 0;
  };

  /* ---------- EFEITOS VISUAIS das habilidades (cada pet tem o seu) ---------- */
  P.petFx = function (kind, o) {
    if (this.game.reduced) return;
    if (!this._pfxl) this._pfxl = [];
    const base = { kind, t: 0, life: 40, x: this.x, y: this.y };
    this._pfxl.push(Object.assign(base, o || {}));
    if (this._pfxl.length > 12) this._pfxl.shift();
  };
  P.drawPetFx = function (ctx) {
    const L = this._pfxl;
    if (!L || !L.length || !ctx.save) return;
    const game = this.game;
    ctx.save();
    for (const e of L) {
      e.t++;
      const k = e.t / e.life;
      const fade = Math.min(1, (e.life - e.t) / 12);
      if (e.kind === 'rollback') {
        /* relogio girando pra tras em volta do dono + setas de rewind */
        const cx = this.x, cy = this.y - 100, R = 70 + k * 20;
        ctx.globalAlpha = 0.85 * fade;
        ctx.strokeStyle = '#7ec8ff'; ctx.lineWidth = 4;
        if (ctx.arc) { ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); }
        const a = -k * Math.PI * 4;
        ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff';
        if (ctx.moveTo) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R * 0.75, cy + Math.sin(a) * R * 0.75); ctx.stroke(); }
        ctx.fillStyle = '#7ec8ff';
        for (let i = 0; i < 3; i++) { const x = cx + 40 + i * 18 - k * 80; if (ctx.moveTo) { ctx.beginPath(); ctx.moveTo(x, cy - 10); ctx.lineTo(x - 14, cy); ctx.lineTo(x, cy + 10); ctx.closePath(); ctx.fill(); } }
      } else if (e.kind === 'sonar') {
        /* 3 ondas de sonar viajando do golfinho ate o rival */
        for (let i = 0; i < 3; i++) {
          const q = Math.min(1, k * 1.6 - i * 0.18);
          if (q <= 0 || q >= 1) continue;
          const x = e.x0 + (e.x1 - e.x0) * q, y = e.y0 + (e.y1 - e.y0) * q;
          ctx.globalAlpha = 0.8 * (1 - q * 0.6) * fade;
          ctx.strokeStyle = '#8fd8ff'; ctx.lineWidth = 3;
          const dir = Math.sign(e.x1 - e.x0) || 1;
          if (ctx.arc) { ctx.beginPath(); ctx.arc(x, y, 12 + i * 6, dir > 0 ? -1 : Math.PI - 1, dir > 0 ? 1 : Math.PI + 1); ctx.stroke(); }
        }
        if (k > 0.55 && ctx.arc) { ctx.globalAlpha = 0.6 * fade; ctx.strokeStyle = '#d8f4ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x1, e.y1, 20 + (k - 0.55) * 90, 0, Math.PI * 2); ctx.stroke(); }
      } else if (e.kind === 'npm') {
        /* caixa do pacote npm pulando do unicornio e abrindo */
        const bx = e.x, by = e.y - 30 - Math.sin(Math.min(1, k * 2) * Math.PI) * 30 - k * 20;
        ctx.globalAlpha = fade;
        ctx.fillStyle = '#cb3837'; ctx.fillRect(bx - 14, by - 14, 28, 24);
        ctx.fillStyle = '#ffffff'; if (ctx.fillText) { ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillText('npm', bx, by + 2); }
        if (k > 0.45) for (let i = 0; i < 6; i++) { const a = i * 1.05 + k * 3; ctx.fillStyle = e.c || '#ffd84b'; ctx.fillRect(bx + Math.cos(a) * (k - 0.45) * 90, by - 20 + Math.sin(a) * (k - 0.45) * 60, 3, 3); }
      } else if (e.kind === 'owl') {
        /* escudo hexagonal com o check verde de resposta aceita */
        const cx = this.x + (this.dir || 1) * 36, cy = this.y - 105;
        ctx.globalAlpha = 0.75 * fade;
        ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 4; ctx.fillStyle = 'rgba(255,179,71,0.18)';
        if (ctx.moveTo) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; const px = cx + Math.cos(a) * 46, py = cy + Math.sin(a) * 58; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
        ctx.strokeStyle = '#5aff7a'; ctx.lineWidth = 6;
        if (ctx.moveTo) { ctx.beginPath(); ctx.moveTo(cx - 16, cy); ctx.lineTo(cx - 4, cy + 14); ctx.lineTo(cx + 18, cy - 14); ctx.stroke(); }
      } else if (e.kind === 'go') {
        /* mini-gophers (goroutines) correndo do pet ate o alvo */
        const q = Math.min(1, k * 1.4);
        const x = e.x0 + (e.x1 - e.x0) * q, y = e.y0 + (e.y1 - e.y0) * q - Math.sin(q * Math.PI) * 30;
        ctx.globalAlpha = fade;
        if (typeof Art !== 'undefined') Art.cell(ctx, 'pet-gopher', 2, Math.floor(e.t / 4), x, y, { scale: 0.34, dir: Math.sign(e.x1 - e.x0) || 1 });
      } else if (e.kind === 'duck') {
        /* bolhas de sabao subindo em volta do dono */
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const x = this.x + Math.sin(i * 2.1 + e.t * 0.08) * 40, y = this.y - 20 - ((i * 23 + e.t * 3) % 180);
          ctx.globalAlpha = 0.7 * fade;
          if (ctx.arc) { ctx.beginPath(); ctx.arc(x, y, 5 + (i % 3) * 3, 0, Math.PI * 2); ctx.stroke(); }
        }
      }
    }
    this._pfxl = L.filter((e) => e.t < e.life);
    ctx.restore();
  };
})();
