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

/* Ajuste só do torneio, por degrau (1 médio, 2 difícil, 3 extremo).
   O Versus continua nos AI_LEVELS. */
const TOURNEY_AI = {
  1: { react: 14, block: 0.5, lowRead: 0.58, antiAir: 0.22, punish: 0.5, combo: 3, ability: 0.05, ult: 0.04, aggro: 0.12, mistake: 0.09, dodge: 0.06, spacing: 124 },
  2: { react: 8, block: 0.74, lowRead: 0.8, antiAir: 0.48, punish: 0.8, combo: 4, ability: 0.09, ult: 0.08, aggro: 0.18, mistake: 0.03, dodge: 0.12, spacing: 112 },
  3: { react: 5, block: 0.84, lowRead: 0.86, antiAir: 0.62, punish: 0.86, combo: 5, ability: 0.12, ult: 0.12, aggro: 0.2, mistake: 0.02, dodge: 0.16, spacing: 110 },
};
const TOURNEY_BODY = {
  1: { dmg: 1.04, taken: 1 },
  2: { dmg: 1.12, taken: 0.94 },
  3: { dmg: 1.18, taken: 0.92 },
};

const AI = {
  _mem: new WeakMap(),
  tourneyTune(level) { return TOURNEY_AI[level] || null; },
  tourneyBody(level) { return TOURNEY_BODY[level] || null; },
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
  blank() {
    const o = { left: false, right: false, up: false, down: false, punch: false, kick: false, tag: false };
    for (let i = 0; i < 10; i++) o['a' + i] = false;
    return o;
  },

  /** Rota de combo conforme o nível; pode terminar com habilidade (cancel). */
  routes(me, L) {
    const ps = me.currentKit().map((_, i) => me.powerState(i));
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
    let L = AI_LEVELS[lvl];
    if (me.aiTune) L = Object.assign({}, L, me.aiTune);
    const m = this.mind(me);
    // percepção atrasada: lê o estado do rival de L.react quadros atrás
    m.hist.push({ x: opp.x, st: opp.state, atk: opp.attack ? opp.attack.height : null, ground: opp.onGround });
    if (m.hist.length > 40) m.hist.shift();
    const seen = m.hist[Math.max(0, m.hist.length - 1 - L.react)];
    const dist = Math.abs(seen.x - me.x);
    if (opp.state === 'attack' || opp.state === 'cast' || opp.state === 'rush') m.spam = Math.min(90, (m.spam || 0) + 1);
    else m.spam = Math.max(0, (m.spam || 0) - 2);
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
      const atkNow = opp.attack;
      const activeNow = (atkNow && (atkNow.startup || 0) + (atkNow.active || 0)) || 0;
      const oppRecover = opp.state === 'attack' && atkNow && opp.stateTime > activeNow;
      if (!oppRecover) {
        m.planT--;
        back();
        input.down = m.low;
        return input;
      }
      m.plan = '';
      m.planT = 0;
    }
    const seenAtk = seen.st === 'attack' || seen.st === 'cast' || seen.st === 'rush';
    if (me.def.id === 'merc' && m.plan === 'dodge' && m.planT > 0) {
      m.planT--;
      if (m.planT === 2) { if (m.dodgeSign < 0) input.left = true; else input.right = true; }
      return input;
    }
    if (me.def.id === 'merc' && seenAtk && dist < 180 && me.onGround && me.canAct() && Math.random() < 0.2 + L.dodge) {
      m.plan = 'dodge';
      m.planT = 4;
      m.dodgeSign = Math.random() < 0.55 ? (toRight ? -1 : 1) : (toRight ? 1 : -1);
      if (m.dodgeSign < 0) input.left = true; else input.right = true;
      return input;
    }
    const atk = opp.attack;
    const activeFrames = (atk && (atk.startup || 0) + (atk.active || 0)) || 0;
    const recovering = (opp.state === 'attack' && atk && opp.stateTime > activeFrames) || (opp.state === 'cast' && opp.cast && opp.cast.fired);
    const punishP = me.aiTune ? L.punish : L.punish * 0.5;
    if (!recovering) m.punished = false;
    /* Uma punição por buraco, não um teste a cada quadro (isso virava 100%). */
    /* TORNEIO: quem so aperta habilidade fica parado no cast. A CPU encurta
       a distancia enquanto o rival conjura e pune de mais longe. */
    if (me.aiTune && opp.state === 'cast' && !recovering && dist > 110 && dist < 320 && me.onGround && me.canAct() && Math.random() < 0.35 + lvl * 0.15) { fwd(); return input; }
    const punishRange = me.aiTune && opp.state === 'cast' ? 230 : 160;
    if (!m.punished && recovering && dist < punishRange && me.onGround && me.canAct() && Math.random() < punishP) {
      m.punished = true;
      m.combo = this.routes(me, L);
      m.step = 1;
      m.wait = 12;
      this.press(input, m.combo[0]);
      fwd();
      return input;
    }
    const threat = (seenAtk || (opp.state === 'attack' && !recovering)) && !recovering;
    if (threat && dist < 220 && me.onGround && me.canAct() && Math.random() < L.block) {
      m.plan = 'block';
      m.planT = 6 + Math.min(8, L.react);
      m.low = (seen.atk === 'low' || (atk && atk.height === 'low')) ? Math.random() < L.lowRead : Math.random() < (me.aiTune ? 0.08 : 0.15);
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
    const airP = me.aiTune ? Math.min(1, L.antiAir) : L.antiAir * 0.5;
    if (!opp.onGround && dist < 180 && me.onGround && Math.random() < airP) {
      input.down = true; input.punch = true; return input;
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
    const ps = me.currentKit().map((_, i) => me.powerState(i));
    const cast = (i) => { input['a' + i] = true; m.cd = me.aiTune ? (8 + (3 - lvl) * 4) : (18 + (3 - lvl) * 14); return input; };
    const auto = me.autoAim();
    /* 2a ultimate (IALES: Acao Final, indice 9) — a mais forte do jogo, a IA
       prioriza assim que ela fica pronta. */
    /* KERNOR (chefe): fase 1 só padrões com buraco; a 2ª ult (buraco negro)
       espera a fase 2 e não sai no quadro em que enche — sobra abertura. */
    const kernor = me.def && me.def.id === 'kernor';
    const kPhase = !kernor ? 0 : (me.hp > me.maxHp * 0.5 ? 1 : me.hp > me.maxHp * 0.28 ? 2 : 3);
    if (kernor) {
      if (ps[9] && ps[9].ready) { if (m.kUltAt == null) m.kUltAt = me.frame; }
      else m.kUltAt = null;
    }
    if (ps[9] && ps[9].ready && ps[9].p.slot === 'ultimate') {
      if (!kernor) return cast(9);
      if (kPhase >= 2 && m.kUltAt != null && me.frame - m.kUltAt >= 36 && Math.random() < (kPhase === 3 ? 0.45 : 0.18)) return cast(9);
    }
    if (ps[5] && ps[5].ready && ps[5].p.slot !== 'ultimate' && Math.random() < L.ult) return cast(5);
    if (ps[4] && ps[4].ready && Math.random() < L.ult && (dist < 300 || auto || ['blast', 'rain', 'barrage', 'pillar', 'steal', 'quake', 'afo2'].includes(ps[4].p.kind))) return cast(4);
    /* IALES tem 10 habilidades (0-9); a IA antes ignorava as 6-9 (Vírus,
       Format C:, Agarrão) — metade do kit do campeão ficava parada.
       Agora a IA considera TODOS os slots extras, na ordem 8..6 (as ultimates
       seguem pelo galho do ps[4]/ps[5] acima). */
    for (const i of [8, 7, 6, 3, 2, 1, 0]) {
      const st = ps[i];
      if (!st || !st.ready || st.p.slot === 'ultimate' || Math.random() > L.ability) continue;
      const k = st.p.kind;
      if (k === 'aura') { if (me.hp < me.maxHp * 0.75 || Math.random() < 0.3) return cast(i); continue; }
      if (k === 'steal') return cast(i);
      if ((k === 'pull' || k === 'beam') && dist < (st.p.range || 280)) return cast(i);
      if ((k === 'dash' || k === 'grabsteal') && dist > 90 && dist < 320) return cast(i);
      if (k === 'shadowport' && dist < 380) return cast(i);
      if (k === 'kspikes' && dist > 70) return cast(i);
      if (['shot', 'pillar', 'zone', 'wall', 'blast', 'rain', 'barrage'].includes(k) && (dist > 150 || auto)) return cast(i);
      if (k === 'rush' && dist < 200) return cast(i);
      if (k === 'quake' && dist < (st.p.range || 150) + 20) return cast(i);
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
    const ideal = auto ? 100 : L.spacing + Math.sin(me.frame * 0.013 + (m.spam || 0)) * (me.aiTune ? 18 : 30);
    const wallL = me.x < 150;
    const wallR = me.x > (me.game.W || 960) - 150;
    if (wallL && dist > 70) input.right = true;
    else if (wallR && dist > 70) input.left = true;
    else if (dist > ideal) fwd();
    else if (dist < 64 && Math.random() < 0.35) back();
    if (me.onGround && Math.random() < 0.004 + L.aggro * 0.02) { input.up = true; if (dist > 120) fwd(); }
    /* DOUBLE JUMP: no ar, usa o pulo extra pra perseguir, pressionar ou escapar */
    if (!me.onGround && !me._doubleJumped && me.canAct && me.canAct() && Math.random() < 0.05 + L.aggro * 0.05) {
      const fugindo = me.hp < opp.hp * 0.5;
      const inimigoAcima = opp.y < me.y - 30;
      const pressao = Math.abs(opp.x - me.x) < 220 && opp.onGround && !fugindo;
      if (inimigoAcima || pressao || (fugindo && opp.y > me.y)) input.up = true;
    }
    if (!me.onGround && dist < 110 && Math.random() < 0.2) input.kick = true;
    return input;
  },
};
