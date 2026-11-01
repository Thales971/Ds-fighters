/* ============================================================
   DS FIGHTERS — IA da CPU (4 níveis).
   0 Fácil · 1 Normal · 2 Difícil · 3 Pesadelo
   Cada nível é um perfil: tempo de reação (a CPU "enxerga" o rival
   com atraso), chance de defender alto/baixo, anti-aéreo, punição,
   tamanho máximo do combo, uso das 5 habilidades e erros propositais.
   A CPU executa combos de verdade: aperta o próximo botão só quando
   o golpe anterior conectou (hit-confirm), como um jogador.
   ============================================================ */
const AI_LEVELS = [
  { name: 'Fácil', react: 26, block: 0.18, lowRead: 0.25, antiAir: 0.05, punish: 0.05, combo: 1, ability: 0.006, ult: 0.004, aggro: 0.05, mistake: 0.25, dodge: 0.02, throw: 0.002, spacing: 150 },
  { name: 'Normal', react: 15, block: 0.45, lowRead: 0.55, antiAir: 0.18, punish: 0.3, combo: 3, ability: 0.014, ult: 0.012, aggro: 0.1, mistake: 0.1, dodge: 0.06, throw: 0.006, spacing: 125 },
  { name: 'Difícil', react: 8, block: 0.72, lowRead: 0.8, antiAir: 0.45, punish: 0.65, combo: 5, ability: 0.026, ult: 0.03, aggro: 0.16, mistake: 0.03, dodge: 0.14, throw: 0.012, spacing: 110 },
  { name: 'Pesadelo', react: 3, block: 0.93, lowRead: 0.97, antiAir: 0.8, punish: 0.95, combo: 7, ability: 0.04, ult: 0.08, aggro: 0.22, mistake: 0, dodge: 0.3, throw: 0.02, spacing: 100 },
];

const AI = {
  _mem: new WeakMap(),
  /** Converte o valor salvo (0..3 ou o antigo 0.6..2.2) em nível inteiro. */
  level(d) {
    if (d == null) return 1;
    const n = Number(d);
    if (Number.isInteger(n) && n >= 0 && n <= 3) return n;
    if (n <= 0.7) return 0;
    if (n <= 1.15) return 1;
    if (n <= 1.7) return 2;
    return 3;
  },
  mind(f) {
    let m = this._mem.get(f);
    if (!m) { m = { cd: 0, plan: '', planT: 0, low: false, hist: [], combo: [], step: 0, wait: 0 }; this._mem.set(f, m); }
    return m;
  },
  blank() { return { left: false, right: false, up: false, down: false, punch: false, kick: false, a0: false, a1: false, a2: false, a3: false, a4: false, tag: false }; },

  /** Rota de combo conforme o nível; pode terminar com habilidade (cancel). */
  routes(me, L) {
    const ps = [0, 1, 2, 3, 4].map((i) => me.powerState(i));
    const ender = [4, 3, 2, 1, 0].find((i) => ps[i].ready && ['shot', 'beam', 'pillar', 'dash', 'rush', 'blast', 'pull', 'barrage', 'steal'].includes(ps[i].p.kind));
    const base = [
      ['punch'],
      ['punch', 'kick'],
      ['cpunch', 'cpunch', 'ckick'],
      ['punch', 'punch', 'kick'],
      ['cpunch', 'punch', 'kick'],
    ];
    let r = base[Math.min(base.length - 1, Math.floor(Math.random() * Math.min(base.length, L.combo + 1)))].slice();
    if (L.combo >= 3 && ender != null && Math.random() < 0.5 + L.combo * 0.06) r.push('a' + ender);
    if (r.length > L.combo + 1) r = r.slice(0, L.combo + 1);
    return r;
  },
  press(input, btn) {
    if (btn === 'cpunch') { input.down = true; input.punch = true; }
    else if (btn === 'ckick') { input.down = true; input.kick = true; }
    else input[btn] = true;
  },

  think(me, opp, difficulty = 1) {
    const input = this.blank();
    if (!opp || !me.alive || me.benched) return input;
    const lvl = this.level(difficulty);
    const L = AI_LEVELS[lvl];
    const m = this.mind(me);
    // percepção atrasada: lê o estado do rival de L.react quadros atrás
    m.hist.push({ x: opp.x, st: opp.state, atk: opp.attack ? opp.attack.height : null, ground: opp.onGround });
    if (m.hist.length > 40) m.hist.shift();
    const seen = m.hist[Math.max(0, m.hist.length - 1 - L.react)];
    const dist = Math.abs(seen.x - me.x);
    const toRight = opp.x > me.x;
    const fwd = () => { if (toRight) input.right = true; else input.left = true; };
    const back = () => { if (toRight) input.left = true; else input.right = true; };
    if (m.cd > 0) m.cd--;

    // 1) combo em andamento (hit-confirm)
    if (m.combo.length) {
      if (me.state === 'attack' && me.hasHit && m.step < m.combo.length) {
        this.press(input, m.combo[m.step]);
        m.step++;
        return input;
      }
      if (me.state === 'attack' && !me.hasHit) return input;
      if (me.state === 'cast') { m.combo = []; return input; }
      if (me.canAct() && m.wait-- <= 0) { m.combo = []; m.step = 0; } else return input;
    }

    // 2) defesa planejada
    if (m.plan === 'block' && m.planT > 0) {
      m.planT--;
      back();
      input.down = m.low;
      return input;
    }
    const seenAtk = seen.st === 'attack' || seen.st === 'cast' || seen.st === 'rush';
    if (seenAtk && dist < 210 && me.onGround && me.canAct() && Math.random() < L.block) {
      m.plan = 'block';
      m.planT = 8 + L.react;
      m.low = seen.atk === 'low' ? Math.random() < L.lowRead : Math.random() < 0.15;
      back();
      input.down = m.low;
      return input;
    }
    // 3) projéteis chegando: pular ou defender
    const shots = (me.game.projectiles || []).filter((p) => p.owner && p.owner.team !== me.team && Math.abs(p.x - me.x) < 230 && Math.sign(p.vx || 0) === Math.sign(me.x - p.x));
    if (shots.length && me.onGround && me.canAct()) {
      if (Math.random() < L.dodge) { input.up = true; fwd(); return input; }
      if (Math.random() < L.block * 0.6) { m.plan = 'block'; m.planT = 16; m.low = !!shots[0].p.ground; back(); return input; }
    }
    if (!me.canAct()) return input;
    // 4) anti-aéreo
    if (!seen.ground && dist < 150 && me.onGround && Math.random() < L.antiAir * 0.5) {
      input.down = true; input.punch = true; return input;
    }
    // 5) punição de golpe errado / habilidade em recuperação
    const recovering = (opp.state === 'attack' && opp.attack && opp.stateTime > opp.attack.startup + opp.attack.active && !opp.hasHit) || (opp.state === 'cast' && opp.cast && opp.cast.fired);
    if (recovering && dist < 140 && me.onGround && Math.random() < L.punish * 0.5) {
      m.combo = this.routes(me, L);
      m.step = 1;
      m.wait = 14;
      this.press(input, m.combo[0]);
      fwd();
      return input;
    }
    // rival tonto: combo máximo
    if (opp.has('dizzy') && dist < 160) {
      if (dist > 80) { fwd(); return input; }
      m.combo = this.routes(me, Object.assign({}, L, { combo: Math.max(3, L.combo) }));
      m.step = 1; m.wait = 14;
      this.press(input, m.combo[0]);
      return input;
    }
    if (m.cd > 0) { if (dist > L.spacing + 40) fwd(); return input; }
    // 6) habilidades / ultimate
    const ps = [0, 1, 2, 3, 4].map((i) => me.powerState(i));
    const cast = (i) => { input['a' + i] = true; m.cd = 18 + (3 - lvl) * 14; return input; };
    const auto = me.autoAim();
    if (ps[4].ready && Math.random() < L.ult && (dist < 300 || auto || ['blast', 'rain', 'barrage', 'pillar', 'steal'].includes(ps[4].p.kind))) return cast(4);
    for (const i of [3, 2, 1, 0]) {
      const st = ps[i];
      if (!st.ready || Math.random() > L.ability) continue;
      const k = st.p.kind;
      if (k === 'aura') { if (me.hp < me.maxHp * 0.75 || Math.random() < 0.3) return cast(i); continue; }
      if (k === 'steal') return cast(i);
      if ((k === 'pull' || k === 'beam') && dist < (st.p.range || 280)) return cast(i);
      if (k === 'dash' && dist > 90 && dist < 300) return cast(i);
      if (['shot', 'pillar', 'zone', 'wall', 'blast', 'rain', 'barrage'].includes(k) && (dist > 150 || auto)) return cast(i);
      if (k === 'rush' && dist < 200) return cast(i);
    }
    // 7) perto: combo, agarrão ou erro proposital
    if (dist < 92 && me.onGround) {
      if (opp.onGround && Math.random() < L.throw) { fwd(); input.punch = true; input.kick = true; m.cd = 20; return input; }
      if (Math.random() < L.aggro) {
        if (Math.random() < L.mistake) { input.kick = true; m.cd = 24; return input; }
        m.combo = this.routes(me, L);
        m.step = 1;
        m.wait = 12;
        this.press(input, m.combo[0]);
        return input;
      }
    }
    // 8) movimentação e espaçamento
    const ideal = auto ? 100 : L.spacing + Math.sin(me.frame * 0.02) * 30;
    if (dist > ideal) fwd();
    else if (dist < 64 && Math.random() < 0.35) back();
    if (me.onGround && Math.random() < 0.004 + L.aggro * 0.02) { input.up = true; if (dist > 120) fwd(); }
    if (!me.onGround && dist < 110 && Math.random() < 0.2) input.kick = true;
    return input;
  },
};
