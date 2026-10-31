/* ============================================================
   DS FIGHTERS — IA do CPU: decide movimento e ataques por frame.
   ============================================================ */

const AI = {
  think(fighter, opponent, difficulty = 1) {
    const dist = Math.abs(opponent.x - fighter.x);
    const inAdvantage = fighter.hp > opponent.hp;
    const r = Math.random();
    const input = { left: false, right: false, up: false, down: false, punch: false, kick: false, special: false, super: false };

    const aggr = 0.35 + difficulty * 0.25 + (inAdvantage ? 0.1 : -0.1);

    if (dist > 150) {
      input.right = opponent.x > fighter.x;
      input.left = !input.right;
      if (r < aggr * 0.25 && fighter.super >= fighter.def.special.cost) input.special = true;
    } else if (dist > 80) {
      input.right = opponent.x > fighter.x;
      input.left = !input.right;
      if (r < aggr * 0.3) input.kick = true;
      if (r < 0.05) input.up = true;
    } else {
      if (r < aggr * 0.45) input.punch = true;
      else if (r < aggr * 0.7) input.kick = true;
      else if (r < aggr * 0.8 && fighter.super >= fighter.def.special.cost) input.special = true;
      else if (r < aggr * 0.85) input.down = true;
      else if (opponent.state === 'punch' || opponent.state === 'kick') input.down = true;
      else input.right = opponent.x > fighter.x, input.left = !input.right;
    }

    if (fighter.super >= 100 && r < 0.25 + difficulty * 0.2) input.super = true;
    if (opponent.state === 'special' || opponent.state === 'super') {
      if (r < 0.5) { input.left = opponent.x < fighter.x; input.right = !input.left; }
    }
    return input;
  },
};
