/* ============================================================
   DS FIGHTERS — MODO AJUDA NO TOQUE (nov/2026).
   No celular, andar com o dedo e acertar a distancia e o que mais falha.
   Quando o jogador 1 joga nos controles de toque (Input.touchUsed) e a opcao
   "Modo Ajuda" esta ligada (padrao), o input dele ganha duas ajudas:

   1) AVANCO AO ATACAR: apertar SOCO/CHUTE longe do rival faz o lutador
      andar ate ele e soltar o golpe quando chega (em vez de socar o ar).
      Mexer o direcional cancela na hora.
   2) DEFESA SOZINHO: parado (sem direcional e sem botao), se o rival ataca
      perto ou um projetil dele vem na sua direcao, o lutador segura pra tras
      (e agacha se o golpe for baixo). Basta mexer o direcional pra assumir.

   Nunca no online (seria vantagem), nem na demo, nem pra CPU ou jogador 2.
   ============================================================ */
(() => {
  if (typeof Game === 'undefined') return;
  const G = Game.prototype;
  const WALK = 150; /* ate 2,5 s indo atras do rival com o golpe guardado (o direcional cancela) */

  G.assistOn = function (ti) {
    if (ti !== 0 || !this.cfg || this.cfg.cpu[0]) return false;
    if (this.mode === 'online' || this.mode === 'demo') return false;
    if (typeof Input === 'undefined' || !Input.touchUsed) return false;
    if (typeof Profile !== 'undefined' && Profile.setting && Profile.setting('touchAssist') === false) return false;
    return true;
  };

  /* algo do rival esta pra acertar? devolve { low } ou null */
  G.assistThreat = function (me, opp) {
    const dist = Math.abs(opp.x - me.x);
    if (opp.state === 'attack' && opp.attack && dist < 210) {
      const a = opp.attack;
      if (opp.stateTime <= (a.startup || 6) + (a.active || 3) + 2) return { low: a.height === 'low' };
    }
    if ((opp.state === 'cast' || opp.state === 'rush') && dist < 260) return { low: false };
    for (const p of this.projectiles || []) {
      if (p.owner !== opp || p.dead) continue;
      const dx = me.x - p.x;
      if (Math.abs(dx) < 240 && Math.abs((p.y || 0) - (me.y - 100)) < 160 && Math.sign(p.vx || 0) === Math.sign(dx)) return { low: false };
    }
    return null;
  };

  G.touchAssist = function (ti, inp) {
    const me = this.activeOf(ti), opp = this.activeOf(1 - ti);
    if (!me || !opp || !me.alive || !opp.alive || this.roundState !== 'fight') { this._assist = null; return inp; }
    const S = this._assist || (this._assist = { walk: 0, buf: null, blocks: 0, approaches: 0 });
    const out = Object.assign({}, inp);
    const dist = Math.abs(opp.x - me.x);
    const toward = opp.x > me.x ? 'right' : 'left';
    const away = toward === 'right' ? 'left' : 'right';
    const moving = !!(inp.left || inp.right || inp.up || inp.down);
    let ability = false;
    for (let k = 0; k < 10; k++) if (inp['a' + k]) ability = true;
    const mv = (me.def && me.def.moves) || {};
    const reach = Math.max(90, Math.max((mv.punch && mv.punch.range) || 0, (mv.kick && mv.kick.range) || 0) + 46);

    /* 1) AVANCO AO ATACAR */
    if ((inp.punch || inp.kick) && !moving && dist > reach && me.onGround && me.canAct && me.canAct()) {
      if (!S.walk) { S.approaches++; S.dash = dist > 300 ? 3 : 0; } /* longe: comeca com arrancada (toque duplo) */
      S.walk = WALK;
      S.buf = inp.punch ? 'punch' : 'kick';
      out.punch = false; out.kick = false;
    }
    if (S.walk > 0) {
      if (moving || ability) { S.walk = 0; S.buf = null; return out; }
      S.walk--;
      if (dist > reach) {
        /* arrancada = frente, solta, frente (o mesmo toque duplo do teclado) */
        out[toward] = S.dash ? S.dash !== 2 : true; out[away] = false;
        if (S.dash) S.dash--;
      }
      else { if (S.buf) out[S.buf] = true; S.walk = 0; S.buf = null; }
      return out;
    }

    /* 2) DEFESA SOZINHO (parado, sem botao) */
    if (!moving && !inp.punch && !inp.kick && !ability && me.onGround) {
      const th = this.assistThreat(me, opp);
      if (th) {
        out[away] = true; out[toward] = false;
        if (th.low) out.down = true;
        S.blocks++;
      }
    }
    return out;
  };

  const oInput = G.inputFor;
  G.inputFor = function (ti) {
    const inp = oInput.call(this, ti);
    if (!this.assistOn(ti)) return inp;
    return this.touchAssist(ti, inp);
  };
})();
