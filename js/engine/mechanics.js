/* ============================================================
   DS FIGHTERS — Mecânicas exclusivas de cada mapa + power-ups.
   Cada mecânica tem tick(t) (lógica) e draw(ctx) (camada do chão).
   Perigos usam Strike(null, ...) — atingem qualquer lutador, com aviso.
   ============================================================ */
const MECHS = {
  overheat: {
    every: 360,
    fire(g) { g.hazard({ x: g.randX(), label: 'SUPERAQUECIMENTO', sheet: ['fx2:fire', 1], dmg: 7, burn: 120, warnColor: '#ff6a1c', sound: 'fire' }); },
  },
  glyphs: {
    every: 260,
    fire(g) {
      const x = g.randX();
      for (let k = 0; k < 3; k++) g.hazard({ x: x + (k - 1) * 70, delay: 50 + k * 8, label: k === 1 ? 'GLIFOS!' : null, sheet: ['fx2:arcane', 0], dmg: 4, slow: 150, warnColor: '#3dff7a', fromSky: true, scale: 1.8 });
    },
  },
  bsod: {
    every: 1000,
    fire(g) {
      g.bsod = 70;
      g.announce('TELA AZUL!', '#5fa8ff', 'Sistema travado — ambos ganham energia');
      g.audio.play('hazard');
      g.fighters().forEach((f) => { f.charge[0] = Math.min(100, f.charge[0] + 30); f.charge[1] = Math.min(100, f.charge[1] + 30); });
      g.spawnPickup();
    },
  },
  neonsign: {
    every: 330,
    fire(g) { g.hazard({ x: g.randX(), label: 'LETREIRO!', sheet: ['fx2:lightning', 3], dmg: 10, warnColor: '#ff4fd8', fromSky: true, sound: 'thunder_cast' }); },
  },
  glitch: {
    every: 760,
    fire(g) {
      const [a, b] = g.activePair();
      if (!a || !b) return;
      g.spawnBurst('arcane', 3, a.x, a.y - 90, 1, 2.2);
      g.spawnBurst('arcane', 3, b.x, b.y - 90, 1, 2.2);
      const t = a.x; a.x = b.x; b.x = t;
      g.announce('GLITCH!', '#ff3b5c', 'Posições trocadas');
      g.audio.play('magic');
      g.glitch = 18;
    },
  },
  conveyor: {
    init(g) { this.dir = 1; },
    tick(g, t) {
      if (t % 420 === 0) { this.dir = -this.dir; g.floatText(480, -300, this.dir > 0 ? 'ESTEIRA →' : '← ESTEIRA', '#ffb03b'); }
      g.pushX = this.dir * 0.9;
    },
    draw(ctx, g, t) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#ffb03b';
      for (let x = ((t * this.dir * 0.9) % 60) - 60; x < g.W + 60; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 6); ctx.lineTo(x + 18 * this.dir, 12); ctx.lineTo(x, 18);
        ctx.fill();
      }
      ctx.restore();
    },
  },
  pulse: {
    every: 480,
    fire(g) {
      g.floatText(480, -330, 'PULSO NO CHÃO — PULE!', '#39ffb0');
      for (let k = 0; k < 6; k++) g.hazard({ x: 80 + k * 160, delay: 60, w: 170, h: 46, dmg: 7, sheet: ['fx2:lightning', 2], scale: 1.6, warnColor: '#39ffb0', sound: k === 0 ? 'thunder_cast' : null, launch: -4 });
    },
  },
  coffee: { every: 520, fire(g) { g.spawnPickup('spd'); g.floatText(480, -330, 'CAFÉ CHEGOU!', '#ffc36b'); } },
  gusts: {
    every: 420,
    fire(g) {
      if (!g.weather) return;
      g.weather.windTarget = (Math.random() < 0.5 ? -1 : 1) * 3.6;
      g.announce('RAJADA!', '#a8e4ff', 'Vento forte ' + (g.weather.windTarget > 0 ? '→' : '←'));
      g.audio.play('whoosh');
    },
  },
  revert: {
    init() { this.hist = []; },
    tick(g, t) {
      const fs = g.activePair();
      this.hist.push(fs.map((f) => (f ? [f.x, f.y] : null)));
      if (this.hist.length > 180) this.hist.shift();
      if (t % 900 === 0 && this.hist.length >= 180) {
        const old = this.hist[0];
        fs.forEach((f, i) => { if (f && old[i]) { g.spawnBurst('arcane', 3, f.x, f.y - 90, 1, 2); f.x = old[i][0]; f.y = Math.min(0, old[i][1]); f.vy = 0; } });
        g.announce('GIT REVERT!', '#ff8a3b', 'Posições de 3 segundos atrás');
        g.audio.play('magic');
        g.glitch = 14;
      }
    },
  },
  spotlight: {
    tick(g, t) {
      this.x = 480 + Math.sin(t * 0.008) * 360;
      for (const f of g.fighters()) if (f.alive && Math.abs(f.x - this.x) < 80) f.addStatus('spot', 3);
    },
    draw(ctx, g) {
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#fff6a8';
      ctx.beginPath();
      ctx.moveTo(this.x - 14, -540); ctx.lineTo(this.x + 14, -540); ctx.lineTo(this.x + 84, 0); ctx.lineTo(this.x - 84, 0);
      ctx.fill();
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.ellipse(this.x, 0, 84, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
  },
  lava: { every: 300, fire(g) { g.hazard({ x: g.randX(), label: 'LAVA!', sheet: ['fx2:fire', 1], dmg: 9, burn: 180, warnColor: '#ff6a1c', sound: 'fire', scale: 2.2 }); } },
  lowgrav: {},
  lightning: {
    every: 250,
    fire(g) {
      const fs = g.fighters().filter((f) => f.alive && !f.benched);
      const f = fs[(Math.random() * fs.length) | 0];
      g.hazard({ x: f ? f.x : g.randX(), label: 'RAIO!', delay: 46, sheet: ['fx2:lightning', 1], dmg: 9, warnColor: '#ffe14d', sound: 'thunder', scale: 4.2, h: 600 });
    },
  },
  rift: {
    every: 560,
    init() { this.rifts = []; },
    fire(g) { this.rifts.push({ x: g.randX(), t: 260, used: new Set() }); g.floatText(480, -330, 'FENDA DO CAOS!', '#ff3355'); },
    tick(g) {
      this.rifts = this.rifts.filter((r) => --r.t > 0);
      for (const r of this.rifts) {
        for (const f of g.fighters()) {
          if (!f.alive || r.used.has(f) || Math.abs(f.x - r.x) > 40 || f.y < -60) continue;
          r.used.add(f);
          const good = Math.random() < 0.55;
          if (good) { f.addStatus('atk', 300); g.floatText(f.x, f.y - 220, 'BÊNÇÃO DO CAOS', '#ff4b4b'); } else { f.addStatus('poison', 200); f.addStatus('slow', 150); g.floatText(f.x, f.y - 220, 'MALDIÇÃO!', '#9dff4a'); }
          g.audio.play('magic');
        }
      }
    },
    draw(ctx, g, t) {
      for (const r of this.rifts) Art.fx2(ctx, 'chaos', 1, Math.floor(t / 5), r.x, -60, { scale: 1.8, alpha: Math.min(1, r.t / 30) });
    },
  },
  gong: {
    every: 900,
    fire(g) {
      g.announce('GONGO!', '#ffb3d1', 'Todos ganham energia');
      g.audio.play('hazard');
      g.fighters().forEach((f) => { f.charge[0] = Math.min(100, f.charge[0] + 35); f.charge[1] = Math.min(100, f.charge[1] + 35); f.ultimate = Math.min(100, f.ultimate + 15); });
      g.spawnBurst('impact', 3, 480, -260, 1, 5);
      g.shake(5);
    },
  },
  highjump: {},
  bounce: {},
  regen: {
    tick(g, t) {
      if (t % 4) return;
      for (const f of g.fighters()) if (f.alive && !f.benched && ['idle', 'walk', 'block', 'crouchblock'].includes(f.state)) f.hp = Math.min(f.maxHp, f.hp + 0.05);
    },
  },
  bees: {
    init(g) { this.x = 480; this.y = -260; this.target = null; this.bite = 0; g.audio.loop('bees_loop', true, 0.25); },
    tick(g, t) {
      const tgt = g.lastVictim && g.lastVictim.alive && !g.lastVictim.benched ? g.lastVictim : null;
      const tx = tgt ? tgt.x : 480 + Math.sin(t * 0.01) * 300;
      const ty = tgt ? tgt.y - 140 : -300;
      this.x += (tx - this.x) * 0.012;
      this.y += (ty - this.y) * 0.02;
      if (this.bite > 0) this.bite--;
      for (const f of g.fighters()) {
        if (!f.alive || f.benched || this.bite > 0) continue;
        if (Math.abs(f.x - this.x) < 50 && Math.abs((f.y - 120) - this.y) < 70) {
          f.chip(1.4, null);
          f.addStatus('slow', 50);
          this.bite = 30;
          g.floatText(f.x, f.y - 210, 'PICADA!', '#ffcf3b');
        }
      }
    },
    drawFront(ctx, g, t) {
      for (let k = 0; k < 7; k++) {
        const a = t * 0.13 + k * 0.9;
        Art.cell(ctx, 'fauna', 0, Math.floor(t / 3) + k, this.x + Math.cos(a) * (18 + k * 4), this.y + Math.sin(a * 1.3) * 16, { scale: 0.75, dir: Math.cos(a) > 0 ? -1 : 1 });
      }
    },
    stop(g) { g.audio.loop('bees_loop', false); },
  },
  honey: {
    every: 420,
    fire(g) {
      g.zones.push(new Zone(null, { x: g.randX(), w: 150, time: 420, dmg: 0, slow: 20, honey: true }));
      g.floatText(480, -330, 'MEL NO CHÃO!', '#ffcf3b');
    },
  },
  containers: { every: 320, fire(g) { g.hazard({ x: g.randX(), label: 'CONTAINER!', delay: 60, sheet: ['abil:devops', 2], dmg: 12, warnColor: '#ff9a5c', fromSky: true, sound: 'heavy', scale: 1.5, w: 130 }); } },
  ice: {
    tick(g) { g.groundDecay = 0.93; },
    draw(ctx, g, t) {
      // pinguins do kernel passeando
      for (let k = 0; k < 2; k++) {
        const x = ((t * (0.4 + k * 0.2) + k * 500) % (g.W + 200)) - 100;
        Art.cell(ctx, 'pets', 0, Math.floor(t / 10) + k, x, -26, { scale: 0.42, dir: -1 });
      }
    },
  },
  molten: {
    every: 280,
    init() { this.side = 0; },
    fire(g) {
      this.side = 1 - this.side;
      const x = this.side ? 140 + Math.random() * 200 : g.W - 140 - Math.random() * 200;
      g.hazard({ x, label: 'METAL QUENTE!', sheet: ['fx2:fire', 3], dmg: 10, burn: 200, warnColor: '#ff7a2a', sound: 'explosion', fromSky: true, scale: 2 });
    },
  },
  serpent: {
    every: 470,
    fire(g) {
      const left = Math.random() < 0.5;
      g.hazard({ x: left ? 90 : g.W - 90, label: 'SERPENTE!', sheet: ['fx2:chaos', 2], dmg: 11, poison: 200, warnColor: '#5cff8d', sound: 'hazard', scale: 2.4, w: 170 });
    },
  },
  tide: {
    init() { this.wave = 0; this.dir = 1; },
    every: 480,
    fire(g) {
      this.dir = Math.random() < 0.5 ? -1 : 1;
      this.wave = 130;
      g.announce('MARÉ ALTA!', '#7f52ff', this.dir > 0 ? 'A água empurra para a direita →' : '← A água empurra para a esquerda');
      g.audio.play('water');
    },
    tick(g) { if (this.wave > 0) { this.wave--; g.pushX = this.dir * 1.25; } },
    draw(ctx, g, t) {
      if (this.wave <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.min(0.5, this.wave / 60);
      ctx.fillStyle = '#5fb8ff';
      for (let x = -60; x < g.W + 60; x += 48) {
        const ox = (t * this.dir * 3) % 48;
        const h = 10 + Math.sin((x + t * 4) * 0.05) * 6;
        ctx.fillRect(x + ox, -h, 40, h + 8);
        ctx.fillStyle = '#e6f6ff';
        ctx.fillRect(x + ox, -h - 3, 40, 3);
        ctx.fillStyle = '#5fb8ff';
      }
      ctx.restore();
    },
  },
  hack: {
    every: 560,
    fire(g) {
      const fs = g.fighters().filter((f) => f.alive);
      if (!fs.length) return;
      const v = fs[(Math.random() * fs.length) | 0];
      v.addStatus('shock', 150);
      g.glitch = 22;
      g.announce('INVASÃO!', '#00ff66', v.def.name + ' foi hackeado: controles eletrizados');
      g.audio.play('magic');
    },
    draw(ctx, g, t) {
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = '#00ff66';
      ctx.font = '10px monospace';
      for (let k = 0; k < 6; k++) ctx.fillText((k % 2 ? '0x' : 'sudo ') + ((Math.floor(t / 6) * 13 + k * 31) % 9999).toString(16), (k * 173 + t) % g.W, -420 + ((t * 2 + k * 70) % 380));
      ctx.restore();
    },
  },
  gc: {
    every: 600,
    fire(g) {
      const n = g.projectiles.length + g.zones.length;
      g.projectiles.length = 0;
      g.zones.length = 0;
      for (const f of g.fighters()) { if (f.alive && f.onGround) f.vx += 480 - f.x > 0 ? 7 : -7; }
      g.announce('GARBAGE COLLECTOR!', '#f89820', n ? n + ' objetos coletados — arena limpa' : 'Todos puxados para o centro');
      g.audio.play('whoosh');
      if (Math.random() < 0.6) g.spawnPickup('spd');
    },
  },
  bench: {
    every: 340,
    fire(g) { g.hazard({ x: g.randX(), label: 'PEÇA!', sheet: ['fx2:impact', 1], dmg: 8, warnColor: '#ffc36b', sound: 'heavy' }); },
  },
  scroll: {
    every: 280,
    fire(g) {
      g.pushX = (Math.random() < 0.5 ? -1 : 1) * 1.4;
      g.floatText(480, -300, 'SCROLL', '#3dff7a');
    },
  },
  train: {
    every: 460,
    fire(g) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      g.fighters().forEach((f) => { if (f.alive && f.onGround) f.vx += dir * 7; });
      g.announce('TREM!', '#c8d4e4', 'O vagão empurra todo mundo');
      g.audio.play('whoosh');
    },
  },
  query: {
    every: 400,
    fire(g) {
      const x = g.W / 2;
      g.hazard({ x, label: 'SELECT *', sheet: ['fx2:arcane', 2], dmg: 8, w: 140, warnColor: '#ffd27d', sound: 'magic' });
    },
  },
  drones: {
    every: 300,
    fire(g) {
      const fs = g.fighters().filter((f) => f.alive);
      const tgt = fs[(Math.random() * fs.length) | 0];
      const x = tgt ? tgt.x : g.randX();
      g.hazard({ x, label: 'DRONE!', delay: 55, sheet: ['fx2:lightning', 3], dmg: 9, warnColor: '#ff4fd8', fromSky: true, sound: 'thunder_cast', scale: 1.4, w: 90 });
    },
    drawFront(ctx, g, t) {
      for (let k = 0; k < 2; k++) {
        const x = ((t * (1.1 + k * 0.5) + k * 420) % (g.W + 300)) - 150;
        const y = -400 + Math.sin(t * 0.03 + k) * 18 + k * 40;
        ctx.save();
        ctx.fillStyle = '#1b1030'; ctx.fillRect(x - 22, y - 5, 44, 10);
        ctx.fillStyle = k ? '#00f0ff' : '#ff4fd8'; ctx.fillRect(x - 26, y - 8, 10, 3); ctx.fillRect(x + 16, y - 8, 10, 3);
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 0.3); ctx.fillRect(x - 3, y + 5, 6, 4);
        ctx.restore();
      }
    },
  },
  /* SESI Valinhos: a torcida chuta bolas de futsal e o sinal do intervalo dá energia. */
  sesi: {
    every: 260,
    fire(g) {
      const n = (g.mech && g.mech.t) || 0;
      if (Math.floor(n / 260) % 3 === 2) {
        g.announce('SINAL DO INTERVALO!', '#e30613', '+ENERGIA PARA TODOS');
        g.audio.play('hazard');
        g.fighters().forEach((f) => { f.charge[0] = Math.min(100, f.charge[0] + 30); f.charge[1] = Math.min(100, f.charge[1] + 30); f.ultimate = Math.min(100, f.ultimate + 12); });
        g.spawnPickup();
        return;
      }
      const fs = g.fighters().filter((f) => f.alive);
      const tgt = fs[(Math.random() * fs.length) | 0];
      g.hazard({ x: tgt ? tgt.x : g.randX(), label: 'BOLA!', delay: 48, sheet: ['fx2:impact', 1], dmg: 7, warnColor: '#ffffff', fromSky: true, sound: 'heavy', scale: 1.1, w: 70 });
    },
    drawFront(ctx, g, t) {
      for (let k = 0; k < 14; k++) {
        const x = 40 + k * 68;
        const y = -330 + Math.sin(t * 0.05 + k) * 3;
        ctx.fillStyle = k % 2 ? '#e30613' : '#ffffff';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 18, y); ctx.lineTo(x + 9, y + 16 + Math.sin(t * 0.08 + k) * 2); ctx.closePath(); ctx.fill();
      }
    },
  },
};

class StageMechanic {
  constructor(game, stage) {
    this.game = game;
    this.def = stage;
    this.m = stage && stage.mech ? Object.assign({}, MECHS[stage.mech] || {}) : {};
    this.t = 0;
    this.pickT = 500;
    if (this.m.init) this.m.init(game);
  }
  tick(fighting) {
    const g = this.game;
    g.pushX = 0;
    g.groundDecay = g.weather ? (g.weather.friction() > 1 ? 0.72 : 0.6) : 0.6;
    if (!fighting) return;
    this.t++;
    if (this.m.tick) this.m.tick(g, this.t);
    if (this.m.every && this.t % this.m.every === 0 && this.m.fire) this.m.fire(g);
    // power-ups do mapa
    this.pickT--;
    if (this.pickT <= 0) {
      this.pickT = 640 + ((Math.random() * 360) | 0);
      g.spawnPickup();
    }
  }
  draw(ctx) { if (this.m.draw) this.m.draw(ctx, this.game, this.t); }
  drawFront(ctx) { if (this.m.drawFront) this.m.drawFront(ctx, this.game, this.t); }
  stop() { if (this.m.stop) this.m.stop(this.game); }
}

class Pickup {
  constructor(game, kind) {
    this.def = PICKUPS.find((p) => p.id === kind) || PICKUPS[(Math.random() * PICKUPS.length) | 0];
    this.x = 120 + Math.random() * (game.W - 240);
    this.y = -520;
    this.vy = 0;
    this.age = 0;
    this.dead = false;
    this.id = ENTITY_SEQ++;
  }
  update(game) {
    this.age++;
    if (this.y < -54) { this.vy += 0.25; this.y = Math.min(-54, this.y + this.vy); }
    if (this.age > 900) this.dead = true;
    for (const f of game.fighters()) {
      if (!f.alive || f.benched) continue;
      if (Math.abs(f.x - this.x) < 46 && f.y - 170 < this.y + 20 && f.y > this.y - 40) {
        this.dead = true;
        const d = this.def;
        const time = Math.round(d.time * (1 + (f.pfx.pickup || 0)));
        if (d.id === 'nrg') {
          f.charge[0] = Math.min(100, f.charge[0] + 50);
          f.charge[1] = Math.min(100, f.charge[1] + 50);
          f.ultimate = Math.min(100, f.ultimate + 25);
        } else f.addStatus(d.id, time);
        game.floatText(f.x, f.y - 230, d.name, d.color);
        game.audio.play('pickup');
        if (Math.random() < 0.5) game.audio.voice('powerup');
        game.spawnBurst('arcane', 2, this.x, this.y, 1, 1.6);
        game.events.push({ t: 'pickup', who: f.slot, kind: d.id });
        return;
      }
    }
  }
  draw(ctx) {
    const bob = Math.sin(this.age * 0.08) * 5;
    const blink = this.age > 780 && this.age % 10 < 5;
    if (blink) return;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = this.def.color;
    ctx.beginPath();
    ctx.ellipse(this.x, -2, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    Art.cell(ctx, 'pickups', this.def.row, Math.floor(this.age / 7), this.x, this.y + bob, { scale: 0.9 });
  }
}
