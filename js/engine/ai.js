/* ============================================================
   DS FIGHTERS — IA: espaçamento, defesa, punição e especiais.
   ============================================================ */

const AI = {
  _mem: new WeakMap(),

  mind(f) {
    let m = this._mem.get(f);
    if (!m) {
      m = { cd: 0, plan: '', planT: 0, back: false, low: false };
      this._mem.set(f, m);
    }
    return m;
  },

  blank() {
    return {
      left: false, right: false, up: false, down: false,
      punch: false, kick: false, special: false, super: false,
    };
  },

  think(fighter, opponent, difficulty = 1) {
    const input = this.blank();
    const m = this.mind(fighter);
    const dist = Math.abs(opponent.x - fighter.x);
    const toRight = opponent.x > fighter.x;
    const diff = Math.max(0.4, Math.min(2.2, difficulty));
    const r = Math.random();
    const attacking = ['punch', 'kick', 'cpunch', 'ckick', 'jpunch', 'jkick', 'special', 'super'].includes(opponent.state);
    const startup = attacking && opponent.attack && opponent.stateTime < (opponent.attack.startup || 8);

    if (m.cd > 0) m.cd--;

    if (m.plan === 'block' && m.planT > 0) {
      m.planT--;
      if (toRight) input.left = true;
      else input.right = true;
      input.down = m.low;
      return input;
    }

    const shots = (fighter.game && fighter.game.projectiles) || [];
    for (const p of shots) {
      if (!p || p.dead || p.owner === fighter || p.age < 0) continue;
      const coming = (p.vx > 0 && p.x < fighter.x && fighter.x - p.x < 170)
        || (p.vx < 0 && p.x > fighter.x && p.x - fighter.x < 170);
      if (coming && Math.abs((p.y + 72)) < 50 && r < 0.5 + diff * 0.22) {
        input.up = true;
        m.cd = 12;
        return input;
      }
    }

    if (!fighter.busy && startup && dist < 130 && r < 0.28 + diff * 0.28) {
      m.plan = 'block';
      m.planT = 10 + ((r * 10) | 0);
      m.low = opponent.state === 'ckick' || opponent.attackHeight === 'low' || r < 0.35;
      m.back = true;
      if (toRight) input.left = true;
      else input.right = true;
      input.down = m.low;
      return input;
    }

    if (opponent.state === 'hit' && dist < 100 && m.cd === 0 && r < 0.55 + diff * 0.2) {
      input.punch = r < 0.5;
      input.kick = !input.punch;
      m.cd = 14;
      return input;
    }

    if (m.cd > 0) {
      if (dist > 80) {
        input.right = toRight;
        input.left = !toRight;
      } else if (r < 0.2) {
        input.left = toRight;
        input.right = !toRight;
      }
      return input;
    }

    const meter = fighter.super >= (fighter.def.special.cost || 25);
    const zoner = ['iales', 'stack', 'frontend', 'backend', 'devops', 'fullstack', 'senpai', 'felipinho', 'bughunter', 'qa'].includes(fighter.def.id);

    if (dist > 190) {
      input.right = toRight;
      input.left = !toRight;
      if (zoner && meter && r < 0.22 + diff * 0.08) input.special = true;
      else if (r < 0.08) input.up = true;
    } else if (dist > 78) {
      input.right = toRight;
      input.left = !toRight;
      if (r < 0.16) input.kick = true;
      else if (r < 0.26) input.punch = true;
      else if (r < 0.34 && meter) input.special = true;
      else if (r < 0.4) input.up = true;
    } else {
      if (r < 0.28) input.punch = true;
      else if (r < 0.48) input.kick = true;
      else if (r < 0.58) { input.down = true; input.kick = r < 0.53; input.punch = !input.kick; }
      else if (r < 0.7 && meter) input.special = true;
      else if (r < 0.78) { input.down = true; }
      else {
        input.left = toRight;
        input.right = !toRight;
      }
    }

    if (fighter.super >= 100 && dist < 150 && r < 0.18 + diff * 0.2) {
      input.super = true;
      input.punch = false;
      input.kick = false;
    }

    if (input.punch || input.kick || input.special || input.super) m.cd = 12 + ((Math.random() * 16) | 0);
    else m.cd = 3;
    return input;
  },
};
