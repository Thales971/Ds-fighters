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
      this.game.spawnBurst('arcane', 2, this.x, this.y - 100, 1, 1.6);
      return d * 0.25;
    }
    if (fx.rollback && !this._rollbackUsed && d >= 18) {
      this._rollbackUsed = true;
      this.petCheer('ROLLBACK!', '#7ec8ff');
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
      game.spawnBurst('arcane', 2, this.x - (this.dir || 1) * 78, this.y - 170, 1, 1.4);
    }
    /* SONAR */
    if (fx.sonar && t >= T.sonar) {
      const foe = this.enemy && this.enemy();
      if (foe && foe.alive && !foe.hidden && Math.abs(foe.x - this.x) <= 520) {
        T.sonar = t + 420;
        const px = this.x - (this.dir || 1) * 78, py = this.y - 168;
        for (let k = 0; k <= 10; k++) {
          const q = k / 10;
          game.spark(px + (foe.x - px) * q, py + (foe.y - 100 - py) * q + Math.sin(q * 12) * 8, '#8fd8ff');
        }
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
      }
    }
  };

  /* linha do atlas do pet: 0 parado, 1 susto (dono apanhou/caiu), 2 comemora */
  P.petRow = function () {
    if (this.state === 'win' || (this._petCheerUntil && (this.now || 0) < this._petCheerUntil)) return 2;
    if (this.state === 'hit' || this.state === 'thrown' || this.state === 'down' || !this.alive) return 1;
    return 0;
  };
})();
