/* ============================================================
   DS FIGHTERS — CLIMA REAGINDO A LUTA (nov/2026). So visual.
   - chuva/tempestade ou piso molhado (mare): cada passo espirra agua;
     pouso faz poca espirrar forte
   - neve (clima neve/granizo ou mapa gelado/nevado): pegadas que ficam no
     chao e somem devagar; pouso levanta poeira de neve
   - folhas (clima de folhas/vento ou mapa com flora): dash e pouso pesado
     levantam folhas que voam e caem girando
   Pegadas e folhas ficam no espaco do chao (y = 0 no piso).
   ============================================================ */
(() => {
  if (typeof Game === 'undefined') return;
  const P = Game.prototype;
  const rnd = (g) => (g.rnd ? g.rnd() : Math.random());
  const SNOWY = /kernel|natal|neve|snow|artic|gelo|ice|campos-jordao|telhado-nevando/;
  const LEAFY = /parque|floresta|forest|spring|bosque|jardim|tijuca|sitio|cafezal|japan|sakura|python|roca|ibirapuera|chapada|playground|varzea/;

  P._wxGround = function () {
    if (this._wxKey === (this.weather && this.weather.kind) + '|' + (this.stageDef && this.stageDef.id)) return this._wx;
    const kind = (this.weather && this.weather.kind) || 'clear';
    const key = String((this.stageDef && this.stageDef.id) || '') + ' ' + String((this.stageDef && this.stageDef.name) || '').toLowerCase();
    this._wxKey = kind + '|' + (this.stageDef && this.stageDef.id);
    this._wxr = null; /* mapa/clima novo: some com pegadas e folhas da partida anterior */
    this._wx = {
      wet: kind === 'rain' || kind === 'storm' || !!(this.stageDef && (this.stageDef.mech === 'tide' || this.stageDef.swim)),
      snow: kind === 'snow' || kind === 'hail' || SNOWY.test(key),
      leaves: kind === 'leaves' || kind === 'wind' || LEAFY.test(key) || !!(this.stageDef && (this.stageDef.flora || this.stageDef.flowers)),
    };
    return this._wx;
  };

  P.weatherReact = function () {
    if (this.reduced || this.qFxOn === false || this.mode === 'demo') return;
    const G = this._wxGround();
    if (!G.wet && !G.snow && !G.leaves) return;
    if (!this._wxr) this._wxr = { prints: [], leaves: [] };
    const R = this._wxr;
    for (const f of this.fighters()) {
      if (!f || f.hidden || f.benched || !f.alive) continue;
      const st = f._wxs || (f._wxs = { ground: true, step: 0 });
      const onGround = f.y >= -1;
      const moving = Math.abs(f.vx || 0) > 0.8;
      const dashing = f.state === 'dash' || f.state === 'backdash' || f.state === 'rush';
      /* passos: a cada ~11 quadros andando no chao */
      if (onGround && moving) {
        st.step++;
        if (st.step % (dashing ? 5 : 11) === 0) {
          const fx = f.x - (f.dir || 1) * 6;
          if (G.wet && this.splash) { this.splash(fx); this.splash(fx + 4); if (dashing) this.splash(fx - 4); }
          if (G.snow) {
            R.prints.push({ x: fx + ((st.step / 11) % 2 ? 7 : -7), dir: f.dir || 1, life: 420 });
            if (R.prints.length > 40) R.prints.shift();
          }
        }
      }
      /* folhas no dash */
      if (G.leaves && dashing && onGround && st.step % 4 === 0) this._leafBurst(R, f.x, 2, f.dir);
      /* pouso */
      if (onGround && !st.ground) {
        if (G.wet && this.splash) for (let k = 0; k < 6; k++) this.splash(f.x + (k - 3) * 6);
        if (G.snow && this.sparks.length < 200) for (let k = 0; k < 8; k++) this.sparks.push({ x: f.x + (rnd(this) - 0.5) * 40, y: -2, vx: (rnd(this) - 0.5) * 3, vy: -1 - rnd(this) * 2, life: 22, color: 'rgba(240,248,255,0.85)', dust: true, size: 2.4, gravity: 0.08, fade: true });
        if (G.leaves) this._leafBurst(R, f.x, 5, 0);
      }
      st.ground = onGround;
    }
    for (const p of R.prints) p.life--;
    R.prints = R.prints.filter((p) => p.life > 0);
    for (const l of R.leaves) {
      l.x += l.vx + Math.sin(l.ph + l.life * 0.08) * 0.8 + ((this.weather && this.weather.wind) || 0) * 0.6;
      l.y += l.vy; l.vy = Math.min(1.4, l.vy + 0.06); l.rot += l.vr; l.life--;
      if (l.y > 0) { l.y = 0; l.vy = 0; l.vx *= 0.8; }
    }
    R.leaves = R.leaves.filter((l) => l.life > 0);
  };

  P._leafBurst = function (R, x, n, dir) {
    const cols = ['#6ab04c', '#8fc85a', '#d9a441', '#c46b2e'];
    for (let k = 0; k < n; k++) {
      R.leaves.push({ x: x + (rnd(this) - 0.5) * 20, y: -4, vx: (rnd(this) - 0.5) * 4 - (dir || 0) * 1.5, vy: -2.5 - rnd(this) * 3, rot: rnd(this) * 6, vr: (rnd(this) - 0.5) * 0.3, ph: rnd(this) * 6, col: cols[(rnd(this) * cols.length) | 0], life: 90 + rnd(this) * 50 });
    }
    if (R.leaves.length > 80) R.leaves.splice(0, R.leaves.length - 80);
  };

  /* desenha pegadas (atras dos lutadores) */
  P.drawWeatherGround = function (ctx) {
    const R = this._wxr;
    if (!R || !R.prints.length || !ctx.ellipse) return;
    ctx.save();
    for (const p of R.prints) {
      ctx.globalAlpha = Math.min(1, p.life / 120) * 0.5;
      ctx.fillStyle = 'rgba(120,140,170,0.9)';
      ctx.beginPath(); ctx.ellipse(p.x, 3, 6, 2.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.ellipse(p.x + p.dir, 2, 5, 1.4, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };

  /* desenha folhas voando (na frente dos lutadores) */
  P.drawWeatherFront = function (ctx) {
    const R = this._wxr;
    if (!R || !R.leaves.length) return;
    ctx.save();
    for (const l of R.leaves) {
      ctx.globalAlpha = Math.min(1, l.life / 30);
      ctx.fillStyle = l.col;
      ctx.save();
      ctx.translate(l.x, l.y);
      if (ctx.rotate) ctx.rotate(l.rot);
      if (ctx.ellipse) { ctx.beginPath(); ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2); ctx.fill(); } else ctx.fillRect(-3, -1, 6, 3);
      ctx.restore();
    }
    ctx.restore();
  };
})();
