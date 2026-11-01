/* ============================================================
   DS FIGHTERS — IA da CPU.
   Espaçamento, defesa alta/baixa, anti-aéreo, punição, agarrão,
   desvio de projéteis e uso inteligente das 5 habilidades.
   difficulty: 0.6 (fácil) .. 1 (normal) .. 1.6 (difícil) .. 2.2 (insano)
   ============================================================ */
const AI = {
  _mem: new WeakMap(),
  mind(f) {
    let m = this._mem.get(f);
    if (!m) { m = { cd: 0, plan: '', planT: 0, low: false, react: 0 }; this._mem.set(f, m); }
    return m;
  },
  blank() { return { left: false, right: false, up: false, down: false, punch: false, kick: false, a0: false, a1: false, a2: false, a3: false, a4: false, tag: false }; },
  think(me, opp, difficulty = 1) {
    const input = this.blank();
    if (!opp || !me.alive) return input;
    const m = this.mind(me);
    const diff = Math.max(0.5, Math.min(2.4, difficulty));
    const dist = Math.abs(opp.x - me.x);
    const toRight = opp.x > me.x;
    const fwd = (on) => { if (toRight) input.right = on; else input.left = on; };
    const back = (on) => { if (toRight) input.left = on; else input.right = on; };
    const r = Math.random();
    const oppAtk = opp.state === 'attack' || opp.state === 'cast' || opp.state === 'rush';
    if (m.cd > 0) m.cd--;
    // bloqueio planejado
    if (m.plan === 'block' && m.planT > 0) {
      m.planT--;
      back(true);
      input.down = m.low;
      return input;
    }
    // reagir a golpes do rival
    if (oppAtk && dist < 190 && me.onGround && r < 0.08 * diff + 0.05) {
      m.plan = 'block';
      m.planT = 10 + ((diff * 6) | 0);
      m.low = !!(opp.attack && opp.attack.height === 'low');
      back(true);
      input.down = m.low;
      return input;
    }
    // projéteis chegando
    const shots = (me.game.projectiles || []).filter((p) => p.owner !== me && p.owner.team !== me.team && Math.abs(p.x - me.x) < 260 && Math.sign(p.vx) === Math.sign(me.x - p.x));
    if (shots.length && me.onGround && r < 0.06 * diff) {
      if (Math.random() < 0.5) input.up = true, fwd(true);
      else { m.plan = 'block'; m.planT = 14; m.low = shots[0].p.ground; }
      return input;
    }
    // anti-aéreo
    if (!opp.onGround && dist < 130 && me.onGround && r < 0.08 * diff) { input.kick = true; return input; }
    if (m.cd > 0 || !me.canAct()) return input;
    // habilidades
    const ps = [0, 1, 2, 3, 4].map((i) => me.powerState(i));
    const tryIdx = (i) => { input['a' + i] = true; m.cd = Math.max(10, 50 - diff * 16); return input; };
    const auto = me.autoAim();
    if (ps[4].ready && (dist < 320 || auto || ['blast', 'rain', 'barrage', 'pillar'].includes(ps[4].p.kind)) && r < 0.05 * diff) return tryIdx(4);
    for (const i of [2, 3]) {
      const st = ps[i];
      if (!st.ready) continue;
      const k = st.p.kind;
      if (k === 'aura' && me.hp < me.maxHp * 0.7 && r < 0.03 * diff) return tryIdx(i);
      if (k === 'steal' && r < 0.04 * diff) return tryIdx(i);
      if ((k === 'pull' || k === 'beam') && dist < (st.p.range || 300) && r < 0.04 * diff) return tryIdx(i);
      if (['shot', 'pillar', 'zone', 'wall', 'blast', 'rain'].includes(k) && r < 0.025 * diff) return tryIdx(i);
    }
    for (const i of [0, 1]) {
      const st = ps[i];
      if (!st.ready) continue;
      const k = st.p.kind;
      if (k === 'dash' && dist < 260 && dist > 80 && r < 0.03 * diff) return tryIdx(i);
      if ((k === 'beam') && dist < (st.p.range || 220) && r < 0.04 * diff) return tryIdx(i);
      if (['shot', 'pillar'].includes(k) && dist > 160 && r < 0.03 * diff) return tryIdx(i);
    }
    // perto: combo / agarrão
    if (dist < 86 && me.onGround) {
      if (r < 0.035 * diff && opp.onGround) { fwd(true); input.punch = true; m.cd = 18; return input; }
      if (r < 0.22 * diff) {
        if (Math.random() < 0.3) input.down = true;
        if (Math.random() < 0.55) input.punch = true; else input.kick = true;
        m.cd = Math.max(4, 16 - diff * 5);
        return input;
      }
    }
    // movimentação
    const ideal = auto ? 110 : 120 + Math.sin(me.frame * 0.02) * 40;
    if (dist > ideal) fwd(true);
    else if (dist < 70 && r < 0.3) back(true);
    if (me.onGround && r < 0.006 * diff) input.up = true;
    if (opp.has('dizzy') && dist < 140) { fwd(true); input.kick = true; }
    return input;
  },
};
