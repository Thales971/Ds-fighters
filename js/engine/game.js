/* ============================================================
   DS FIGHTERS — Telas, rounds, HUD, câmera e efeitos.
   ============================================================ */

const W = 960;
const H = 540;
const GROUND_Y = H - 60;
const ROUND_TIME = 99;

const EMPTY_INPUT = {
  left: false, right: false, up: false, down: false,
  punch: false, kick: false, special: false, super: false,
};

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.W = W;
    this.H = H;
    this.audio = AudioSys;
    this.time = 0;
    this.screen = 'title';
    this.mode = 'arcade';
    this.menuIdx = 0;
    this.menuOptions = ['MODO ARCADE (vs CPU)', 'VERSUS (2 JOGADORES)', 'COMO JOGAR'];
    this.selIdx = [0, 1];
    this.selConfirmed = [false, false];
    this.stageIdx = (Math.random() * STAGES.length) | 0;
    this.p1 = null;
    this.p2 = null;
    this.stage = null;
    this.projectiles = [];
    this.particles = [];
    this.speech = null;
    this.round = 1;
    this.roundTimer = ROUND_TIME * 60;
    this.roundState = 'intro';
    this.roundStateTime = 0;
    this.shakeMag = 0;
    this.flashColor = null;
    this.flashUntil = 0;
    this.message = null;
    this.messageUntil = 0;
    this.difficulty = 1;
    this.hitstop = 0;
    this.slowmo = 0;
    this.dmgNumbers = [];
    this.combo = { owner: null, count: 0, until: 0 };
    this.camX = 0;
    this.ghostHp = [100, 100];
  }

  registerHit(attacker, victim, dmg, blocked, hitstop) {
    this.hitstop = Math.max(this.hitstop, hitstop || (blocked ? 3 : 5));
    if (attacker && !blocked) {
      if (this.combo.owner === attacker && this.time < this.combo.until) this.combo.count++;
      else this.combo = { owner: attacker, count: 1, until: 0 };
      this.combo.until = this.time + 42;
    }
    this.dmgNumbers.push({
      x: victim.x + (Math.random() - 0.5) * 24,
      y: victim.y - 118,
      vy: -1.4,
      life: 40,
      text: (blocked ? 'BLOQ ' : '') + Math.max(1, Math.round(dmg)),
      color: blocked ? '#9adcff' : (dmg >= 12 ? '#ff5a3c' : '#ffe14d'),
    });
    if (this.dmgNumbers.length > 24) this.dmgNumbers.shift();
  }

  spawnHitStar(x, y, color) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      this.particles.push({
        x, y, vx: Math.cos(a) * 5, vy: Math.sin(a) * 5,
        life: 14, color, size: 4, star: true,
      });
    }
  }

  spawnSlash(x, y, dir, color) {
    this.particles.push({
      x, y, vx: dir * 0.4, vy: -0.2, life: 10, color, slash: true, rot: dir > 0 ? -0.6 : 0.6,
    });
  }

  say(fighter, text) {
    this.speech = { fighter, text, until: this.time + 150 };
  }

  showMessage(text, ms = 800, color = '#fff', sub = '') {
    this.message = { text, color, sub };
    this.messageUntil = this.time + Math.max(8, Math.round(ms * 60 / 1000));
  }

  shake(n) { this.shakeMag = Math.max(this.shakeMag, n); }

  flashScreen(color) {
    this.flashColor = color;
    this.flashUntil = this.time + 10;
  }

  spawnSparks(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 7,
        vy: -Math.random() * 6 - 1.5,
        life: 22 + Math.random() * 14,
        color,
        size: 2 + Math.random() * 3,
      });
    }
    if (this.particles.length > 260) this.particles.splice(0, this.particles.length - 260);
  }

  spawnProjectile(owner, spec, delay) {
    this.projectiles.push(new Projectile(owner, spec, delay || 0));
  }

  aoeBlast(owner, radius, dmg, heal) {
    const target = owner === this.p1 ? this.p2 : this.p1;
    if (target && target.alive && Math.abs(target.x - owner.x) < radius) {
      target.takeHit(dmg, {
        kx: 8, attacker: owner, stun: 18, height: 'mid', launch: -3.5, hitstop: 8, superChip: true,
      });
    }
    if (heal) owner.heal(heal);
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      this.particles.push({
        x: owner.x, y: -70,
        vx: Math.cos(a) * 6.5, vy: Math.sin(a) * 6.5,
        life: 32, color: owner.def.colors.accent, size: 4,
      });
    }
    this.shake(10);
  }

  onKO(loser) {
    if (this.roundState !== 'fight') return;
    this.roundState = 'ko';
    this.roundStateTime = 0;
    this.slowmo = 80;
    const winner = loser === this.p1 ? this.p2 : this.p1;
    winner.state = 'win';
    winner.wins++;
    const q = winner.def.quotes.win;
    this.say(winner, q[(Math.random() * q.length) | 0]);
    const sub = winner.hp >= 99 ? 'PERFEITO!' : winner.def.name + ' levou o round';
    this.showMessage('K.O.!', 1100, '#ff3b30', sub);
    this.shake(14);
  }

  cycleStage(dir) {
    this.stageIdx = (this.stageIdx + dir + STAGES.length) % STAGES.length;
    this.audio.cursor();
  }

  startFight() {
    const d1 = FIGHTERS[this.selIdx[0]];
    const d2 = FIGHTERS[this.selIdx[1]];
    this.p1 = new Fighter(d1, W * 0.28, 1, this);
    this.p2 = new Fighter(d2, W * 0.72, -1, this);
    this.stage = new StageFX(STAGES[this.stageIdx], W, H);
    this.projectiles = [];
    this.particles = [];
    this.speech = null;
    this.roundTimer = ROUND_TIME * 60;
    this.round = 1;
    this.p1.wins = 0;
    this.p2.wins = 0;
    this.ghostHp = [100, 100];
    this.dmgNumbers = [];
    this.combo = { owner: null, count: 0, until: 0 };
    this.slowmo = 0;
    this.hitstop = 0;
    this.camX = 0;
    this.screen = 'vs';
    this.roundState = 'intro';
    this.roundStateTime = 0;
    this.time = 0;
    const q1 = d1.quotes.intro;
    this.say(this.p1, q1[(Math.random() * q1.length) | 0]);
    this.audio.ensure();
    this.audio.startMusic();
  }

  nextRound() {
    const w1 = this.p1.wins;
    const w2 = this.p2.wins;
    const d1 = this.p1.def;
    const d2 = this.p2.def;
    this.round++;
    this.difficulty = 1 + (this.round - 1) * 0.35;
    this.p1 = new Fighter(d1, W * 0.28, 1, this);
    this.p2 = new Fighter(d2, W * 0.72, -1, this);
    this.p1.wins = w1;
    this.p2.wins = w2;
    this.stageIdx = (this.stageIdx + 1) % STAGES.length;
    this.stage = new StageFX(STAGES[this.stageIdx], W, H);
    this.projectiles = [];
    this.particles = [];
    this.roundTimer = ROUND_TIME * 60;
    this.roundState = 'intro';
    this.roundStateTime = 0;
    this.screen = 'fight';
    this.speech = null;
    this.ghostHp = [100, 100];
    this.dmgNumbers = [];
    this.combo = { owner: null, count: 0, until: 0 };
    this.camX = 0;
    this.hitstop = 0;
    this.slowmo = 0;
  }

  freshInput(padIndex, map) {
    if (this.mode === 'demo') return null;
    if (this.mode === 'versus' || padIndex === 0) return Input.read(map, padIndex);
    return null;
  }

  update() {
    Input.pollPads();
    if (this.hitstop > 0) { this.hitstop--; return; }
    if (this.slowmo > 0) {
      this.slowmo--;
      if (this.slowmo % 3 !== 0) return;
    }
    this.time++;
    const t = this.time / 60;
    const pad = Input.pad(0);
    const confirm = Input.hit('Enter') || Input.hit('Space') || Input.hit('KeyA') || pad.kickHit || pad.startHit || pad.punchHit;

    if (this.screen === 'title') {
      if (confirm) {
        this.screen = 'menu';
        this.audio.ensure();
        this.audio.cursor();
      }
      return;
    }

    if (this.screen === 'menu') {
      if (Input.hit('ArrowUp') || Input.hit('KeyW') || pad.upHit) {
        this.menuIdx = (this.menuIdx + this.menuOptions.length - 1) % this.menuOptions.length;
        this.audio.cursor();
      }
      if (Input.hit('ArrowDown') || Input.hit('KeyS') || pad.downHit) {
        this.menuIdx = (this.menuIdx + 1) % this.menuOptions.length;
        this.audio.cursor();
      }
      if (confirm) {
        this.audio.select();
        if (this.menuIdx === 0) {
          this.mode = 'arcade';
          this.difficulty = 1;
          this.screen = 'select';
          this.selIdx = [0, (Math.random() * FIGHTERS.length) | 0];
          this.selConfirmed = [false, false];
        } else if (this.menuIdx === 1) {
          this.mode = 'versus';
          this.screen = 'select';
          this.selIdx = [0, 1];
          this.selConfirmed = [false, false];
        } else this.screen = 'help';
      }
      return;
    }

    if (this.screen === 'help') {
      if (confirm || Input.hit('Escape') || pad.specialHit) {
        this.screen = 'menu';
        this.audio.cursor();
      }
      return;
    }

    if (this.screen === 'select') {
      this.updateSelect(pad);
      return;
    }

    if (this.screen === 'vs') {
      this.roundStateTime++;
      if (this.p1 && this.p2) {
        this.p1.update(EMPTY_INPUT, this.p2);
        this.p2.update(EMPTY_INPUT, this.p1);
      }
      if (this.roundStateTime > 130 || Input.hit('Enter') || Input.hit('Space') || pad.startHit || pad.kickHit) {
        this.screen = 'fight';
        this.roundState = 'intro';
        this.roundStateTime = 0;
      }
      return;
    }

    if (this.screen === 'fight') {
      if (Input.hit('Escape')) {
        this.screen = 'menu';
        this.audio.stopMusic();
        return;
      }
      this.updateFight(t);
      return;
    }

    if (this.screen === 'gameover') {
      if (confirm) {
        this.audio.select();
        this.screen = 'title';
        this.audio.stopMusic();
      }
    }
  }

  updateSelect(pad) {
    const pad2 = Input.pad(1);
    const nav = (i, dir) => {
      let n = this.selIdx[i] + dir;
      if (n < 0) n = FIGHTERS.length - 1;
      if (n >= FIGHTERS.length) n = 0;
      this.selIdx[i] = n;
      this.audio.cursor();
    };
    const confirm = Input.hit('KeyA') || Input.hit('Enter') || pad.kickHit || pad.punchHit || pad.startHit;
    if (!this.selConfirmed[0]) {
      if (Input.hit('ArrowLeft') || pad.leftHit) nav(0, -1);
      if (Input.hit('ArrowRight') || pad.rightHit) nav(0, 1);
      if (Input.hit('ArrowUp') || pad.upHit) this.cycleStage(-1);
      if (Input.hit('ArrowDown') || pad.downHit) this.cycleStage(1);
      if (confirm) { this.selConfirmed[0] = true; this.audio.select(); }
    } else if (this.mode === 'arcade') {
      if (Input.hit('ArrowLeft') || pad.leftHit) nav(1, -1);
      if (Input.hit('ArrowRight') || pad.rightHit) nav(1, 1);
      if (Input.hit('ArrowUp') || pad.upHit) this.cycleStage(-1);
      if (Input.hit('ArrowDown') || pad.downHit) this.cycleStage(1);
      if (confirm) { this.audio.select(); this.startFight(); }
    } else if (!this.selConfirmed[1]) {
      if (Input.hit('KeyJ') || pad2.leftHit) nav(1, -1);
      if (Input.hit('KeyL') || pad2.rightHit) nav(1, 1);
      if (Input.hit('Digit1') || pad2.kickHit || pad2.punchHit || pad2.startHit) {
        this.selConfirmed[1] = true;
        this.audio.select();
        this.startFight();
      }
    }
    if (Input.hit('Escape')) { this.screen = 'menu'; this.selConfirmed = [false, false]; }
  }

  updateFight() {
    this.roundStateTime++;
    if (this.stage) this.stage.tick();

    if (this.roundState === 'intro') {
      if (this.roundStateTime === 1) { this.showMessage('ROUND ' + this.round, 800, '#ffd27d'); this.audio.round(); }
      if (this.roundStateTime === 48) this.showMessage('LUTA!', 650, '#7dff5e');
      if (this.roundStateTime > 88) { this.roundState = 'fight'; this.roundStateTime = 0; }
      this.p1.update(EMPTY_INPUT, this.p2);
      this.p2.update(EMPTY_INPUT, this.p1);
      this.tickFx();
      return;
    }

    if (this.roundState === 'fight') {
      this.roundTimer--;
      const p1Input = this.mode === 'demo' ? AI.think(this.p1, this.p2, this.difficulty) : Input.read(Input.p1, 0);
      const p2Input = this.mode === 'versus' ? Input.read(Input.p2, 1) : AI.think(this.p2, this.p1, this.difficulty);
      this.p1.update(p1Input, this.p2);
      this.p2.update(p2Input, this.p1);

      for (const f of [this.p1, this.p2]) {
        f.x = Math.max(48, Math.min(W - 48, f.x));
        const other = f === this.p1 ? this.p2 : this.p1;
        const minDist = 56;
        if (Math.abs(f.x - other.x) < minDist && Math.abs(f.y - other.y) < 70) {
          const push = (minDist - Math.abs(f.x - other.x)) / 2;
          if (f.x === other.x) f.x += f.dir;
          else f.x += f.x < other.x ? -push : push;
        }
        this.stage.check(f);
      }

      for (const p of this.projectiles) p.update(this, p.owner === this.p1 ? this.p2 : this.p1);
      this.resolveProjectileClashes();
      this.projectiles = this.projectiles.filter((p) => !p.dead);
      this.tickFx();

      if (this.roundTimer <= 0 && this.roundState === 'fight') {
        this.roundState = 'end';
        this.roundStateTime = 0;
        const w = this.p1.hp === this.p2.hp ? null : (this.p1.hp > this.p2.hp ? this.p1 : this.p2);
        if (w) {
          w.wins++;
          w.state = 'win';
          const other = w === this.p1 ? this.p2 : this.p1;
          if (other.alive) other.state = 'ko';
          this.showMessage('TEMPO!', 1000, '#ffd27d', w.def.name + ' vence no critério');
          this.audio.ko();
        } else this.showMessage('EMPATE!', 1000, '#9adcff');
      }
      return;
    }

    if (this.roundState === 'ko' || this.roundState === 'end') {
      this.p1.update(EMPTY_INPUT, this.p2);
      this.p2.update(EMPTY_INPUT, this.p1);
      for (const p of this.projectiles) p.update(this, p.owner === this.p1 ? this.p2 : this.p1);
      this.projectiles = this.projectiles.filter((p) => !p.dead);
      this.tickFx();
      if (this.roundStateTime > 120) {
        if (this.p1.wins >= 2 || this.p2.wins >= 2) {
          this.screen = 'gameover';
          this.audio.stopMusic();
        } else this.nextRound();
      }
    }
  }

  resolveProjectileClashes() {
    const list = this.projectiles;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if (a.dead || b.dead || a.owner === b.owner || a.age < 0 || b.age < 0) continue;
        if (Math.abs(a.x - b.x) < (a.w + b.w) * 0.45 && Math.abs(a.y - b.y) < (a.h + b.h) * 0.5) {
          if (a.spec.heavy && !b.spec.heavy) b.dead = true;
          else if (b.spec.heavy && !a.spec.heavy) a.dead = true;
          else { a.dead = true; b.dead = true; }
          this.spawnSparks((a.x + b.x) / 2, (a.y + b.y) / 2, '#ffffff', 12);
        }
      }
    }
  }

  tickFx() {
    for (const pt of this.particles) {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.28;
      pt.life--;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const d of this.dmgNumbers) { d.y += d.vy; d.life--; }
    this.dmgNumbers = this.dmgNumbers.filter((d) => d.life > 0);
    for (let i = 0; i < 2; i++) {
      const f = i === 0 ? this.p1 : this.p2;
      if (f && this.ghostHp[i] > f.hp) this.ghostHp[i] = Math.max(f.hp, this.ghostHp[i] - 0.7);
    }
    if (this.p1 && this.p2) {
      const mid = (this.p1.x + this.p2.x) / 2;
      const target = (mid - W / 2) * 0.45;
      this.camX += (target - this.camX) * 0.12;
      this.camX = Math.max(-90, Math.min(90, this.camX));
    }
  }

  draw() {
    const t = this.time / 60;
    if (this.screen === 'title') this.drawTitle(t);
    else if (this.screen === 'menu') { this.drawScene(t); this.drawMenu(t); }
    else if (this.screen === 'help') { this.drawScene(t); this.drawHelp(); }
    else if (this.screen === 'select') this.drawSelect(t);
    else if (this.screen === 'vs') { this.drawScene(t); this.drawVS(t); this.drawSpeech(); }
    else if (this.screen === 'fight') {
      this.drawScene(t);
      this.drawHUD(t);
      this.drawSpeech();
      this.drawMessage();
    } else if (this.screen === 'gameover') { this.drawScene(t); this.drawGameOver(t); }
  }

  drawScene(t) {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    const cam = this.camX;
    ctx.save();
    if (this.shakeMag > 0) {
      ctx.translate((Math.random() - 0.5) * this.shakeMag, (Math.random() - 0.5) * this.shakeMag);
      this.shakeMag *= 0.86;
      if (this.shakeMag < 0.4) this.shakeMag = 0;
    }
    const stageDef = this.stage ? this.stage.def : STAGES[this.stageIdx];
    stageDef.draw(ctx, W, H, t, cam);
    if (this.stage) this.stage.draw(ctx, t, cam);
    if (this.p1 && this.p2) {
      ctx.save();
      ctx.translate(-Math.round(cam), GROUND_Y);
      const order = this.p1.x < this.p2.x ? [this.p1, this.p2] : [this.p2, this.p1];
      for (const p of this.projectiles) p.draw(ctx);
      for (const f of order) f.draw(ctx);
      for (const pt of this.particles) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, pt.life / 16);
        ctx.fillStyle = pt.color;
        ctx.strokeStyle = pt.color;
        if (pt.slash) {
          ctx.translate(pt.x, pt.y);
          ctx.rotate(pt.rot || 0);
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 16, -0.2, 2.2);
          ctx.stroke();
          ctx.lineWidth = 1;
          ctx.strokeStyle = '#fff';
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0.2, 1.6);
          ctx.stroke();
        } else if (pt.star) {
          ctx.translate(pt.x, pt.y);
          ctx.rotate(this.time * 0.2);
          ctx.fillRect(-pt.size, -1, pt.size * 2, 2);
          ctx.fillRect(-1, -pt.size, 2, pt.size * 2);
        } else {
          ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
        }
        ctx.restore();
      }
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      for (const d of this.dmgNumbers) {
        ctx.globalAlpha = Math.min(1, d.life / 18);
        ctx.fillStyle = '#000';
        ctx.fillText(d.text, d.x + 1, d.y + 1);
        ctx.fillStyle = d.color;
        ctx.fillText(d.text, d.x, d.y);
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
      ctx.restore();
    }
    if (stageDef.drawFg) stageDef.drawFg(ctx, W, H, t, cam);
    ctx.restore();

    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, H * 0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    if (this.flashColor && this.time < this.flashUntil) {
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }

  bar(x, y, w, h, pct, color, flip, ghostPct = null) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
    ctx.strokeStyle = '#f2f2f2';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
    ctx.fillStyle = '#2a0808';
    ctx.fillRect(x, y, w, h);
    if (ghostPct !== null && ghostPct > pct) {
      const gw = w * ghostPct;
      ctx.fillStyle = '#ffd24d';
      if (flip) ctx.fillRect(x + w - gw, y, gw, h);
      else ctx.fillRect(x, y, gw, h);
    }
    const fillW = Math.max(0, w * Math.max(0, Math.min(1, pct)));
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#d8ffc4');
    g.addColorStop(1, color);
    ctx.fillStyle = g;
    if (flip) ctx.fillRect(x + w - fillW, y, fillW, h);
    else ctx.fillRect(x, y, fillW, h);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(x, y, w, 3);
  }

  drawHUD(t) {
    const ctx = this.ctx;
    this.bar(24, 28, 360, 18, this.p1.hp / this.p1.maxHp, this.p1.hp > 30 ? '#3dde45' : '#ff3b30', false, this.ghostHp[0] / 100);
    this.bar(W - 384, 28, 360, 18, this.p2.hp / this.p2.maxHp, this.p2.hp > 30 ? '#3dde45' : '#ff3b30', true, this.ghostHp[1] / 100);
    const drawSuper = (x, pct) => {
      const full = pct >= 1;
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.fillRect(x - 2, 50, 360 + 4, 12);
      ctx.strokeStyle = full && Math.sin(t * 8) > 0 ? '#ff7de0' : '#5a5a6a';
      ctx.strokeRect(x - 2, 50, 360 + 4, 12);
      const fw = 360 * Math.max(0, Math.min(1, pct));
      ctx.fillStyle = full ? (Math.sin(t * 10) > 0 ? '#ffffff' : '#ff7de0') : '#b26bff';
      ctx.fillRect(x, 52, fw, 8);
    };
    drawSuper(24, this.p1.super / 100);
    ctx.save();
    ctx.translate(W - 384 + 360, 0);
    ctx.scale(-1, 1);
    drawSuper(0, this.p2.super / 100);
    ctx.restore();

    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(this.p1.def.name, 24, 20);
    ctx.textAlign = 'right';
    ctx.fillText(this.p2.def.name, W - 24, 20);
    ctx.textAlign = 'center';
    const secs = Math.max(0, Math.ceil(this.roundTimer / 60));
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = secs <= 10 ? '#ff3b30' : '#fff';
    ctx.fillText(String(secs).padStart(2, '0'), W / 2, 42);
    ctx.fillStyle = '#ffd27d';
    for (let i = 0; i < this.p1.wins; i++) {
      ctx.beginPath();
      ctx.arc(36 + i * 16, 74, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < this.p2.wins; i++) {
      ctx.beginPath();
      ctx.arc(W - 36 - i * 16, 74, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(this.stage.def.name, W / 2, H - 10);
    if (this.combo.count >= 2 && this.time < this.combo.until) {
      ctx.font = 'bold 22px monospace';
      ctx.fillStyle = '#ffe14d';
      const cx = this.combo.owner === this.p1 ? 180 : W - 180;
      ctx.fillText(this.combo.count + ' HITS', cx, 100);
    }
    ctx.textAlign = 'left';
  }

  drawSpeech() {
    if (!this.speech || this.time > this.speech.until || !this.speech.fighter) return;
    const ctx = this.ctx;
    const f = this.speech.fighter;
    ctx.font = 'bold 13px monospace';
    const tw = Math.min(W - 24, ctx.measureText(this.speech.text).width + 18);
    const sx = Math.max(8, Math.min(W - tw - 8, f.x - this.camX - tw / 2));
    const sy = Math.max(78, GROUND_Y + f.y - 198);
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(sx, sy, tw, 22);
    ctx.strokeStyle = f.def.colors.accent;
    ctx.strokeRect(sx, sy, tw, 22);
    ctx.fillStyle = '#fff';
    ctx.fillText(this.speech.text, sx + 8, sy + 15);
  }

  drawMessage() {
    if (!this.message || this.time > this.messageUntil) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 54px monospace';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#000';
    ctx.strokeText(this.message.text, W / 2, H / 2 - 24);
    ctx.fillStyle = this.message.color;
    ctx.fillText(this.message.text, W / 2, H / 2 - 24);
    if (this.message.sub) {
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText(this.message.sub, W / 2, H / 2 + 12);
    }
    ctx.restore();
  }

  drawTitle(t) {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#070b1e');
    g.addColorStop(0.55, '#1a1040');
    g.addColorStop(1, '#12081f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.font = '12px monospace';
    for (let c = 0; c < 28; c++) {
      const x = c * 36;
      const y = ((t * 36 + c * 90) % (H + 40)) - 20;
      ctx.fillStyle = 'rgba(0,255,170,0.16)';
      ctx.fillText('{}</>#;'.charAt((c + (t * 2 | 0)) % 6), x, y);
    }
    const floor = H - 48;
    ctx.fillStyle = '#12081c';
    ctx.fillRect(0, floor, W, H - floor);
    ctx.fillStyle = '#ff4fa3';
    ctx.fillRect(0, floor, W, 3);
    const frame = Math.floor(this.time / 8);
    if (typeof SpriteGen !== 'undefined') {
      SpriteGen.blit(ctx, 'du', 'idle', frame, 1, 150, floor + 2, false, 2);
      SpriteGen.blit(ctx, 'frontend', 'idle', frame + 2, -1, W - 150, floor + 2, false, 2);
    }
    ctx.textAlign = 'center';
    ctx.font = 'bold 68px monospace';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#000';
    ctx.strokeText('DS FIGHTERS', W / 2, 168);
    const lg = ctx.createLinearGradient(0, 100, 0, 180);
    lg.addColorStop(0, '#fff6b0');
    lg.addColorStop(0.5, '#ffd24d');
    lg.addColorStop(1, '#ff4fa3');
    ctx.fillStyle = lg;
    ctx.fillText('DS FIGHTERS', W / 2, 168);
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#9dffdf';
    ctx.fillText('TORNEIO DOS DESENVOLVEDORES', W / 2, 204);
    ctx.fillStyle = Math.sin(t * 4) > 0 ? '#fff' : '#888';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('ENTER  ·  X DO CONTROLE  ·  TOQUE', W / 2, 250);
    if (Input.padCount > 0) {
      ctx.fillStyle = '#7dffb0';
      ctx.font = '13px monospace';
      ctx.fillText('CONTROLE DETECTADO', W / 2, 274);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    ctx.textAlign = 'left';
  }

  drawMenu() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7dffd4';
    ctx.font = 'bold 34px monospace';
    ctx.fillText('MENU', W / 2, 150);
    this.menuOptions.forEach((opt, i) => {
      const on = i === this.menuIdx;
      ctx.font = on ? 'bold 22px monospace' : '18px monospace';
      ctx.fillStyle = on ? '#ffd27d' : '#b7c0d4';
      ctx.fillText((on ? '▶ ' : '') + opt, W / 2, 230 + i * 48);
    });
    ctx.font = '13px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText('↑↓ escolhe   ·   ENTER / X confirma', W / 2, 420);
    ctx.textAlign = 'left';
  }

  drawHelp() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(4,6,12,0.88)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7dffd4';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('COMO JOGAR', W / 2, 48);
    ctx.font = '15px monospace';
    ctx.fillStyle = '#e8e8f0';
    const lines = [
      'P1: setas movem    A soco    S chute    D especial    F super',
      'P2: J L I K        1 soco    2 chute    3 especial    4 super',
      'Controle: direcional / analógico    □ soco    X chute',
      '○ ou L2 especial    △ ou R2 super    Options confirma',
      '',
      'Segure para trás para bloquear em pé (segura o pulo).',
      'Segure para baixo para bloquear agachado (segura a rasteira).',
      'Pulo + ataque é golpe alto. Agachado + chute é golpe baixo.',
      '↓ ↘ → + soco solta o especial. ↓ ↙ ← + chute solta o super.',
      'Toque duplo para frente corre. Soco acertado cancela no chute.',
      'A barra roxa enche ao bater e ao apanhar. Primeiro a 2 rounds vence.',
      '',
      'ENTER volta    ·    Esc no meio da luta volta ao menu',
    ];
    lines.forEach((line, i) => {
      ctx.fillStyle = line.startsWith('Segure') || line.startsWith('Pulo') || line.startsWith('↓') || line.startsWith('Toque') || line.startsWith('A barra') ? '#ffd27d' : '#eee';
      ctx.fillText(line, W / 2, 88 + i * 28);
    });
    ctx.textAlign = 'left';
  }

  drawSelect(t) {
    const ctx = this.ctx;
    ctx.fillStyle = '#070a14';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7dffd4';
    ctx.font = 'bold 20px monospace';
    const pickingP2 = this.selConfirmed[0] && this.mode === 'versus' && !this.selConfirmed[1];
    const title = !this.selConfirmed[0]
      ? 'P1 — ESCOLHA SEU LUTADOR'
      : (this.mode === 'arcade' ? 'ESCOLHA O ADVERSÁRIO E O CENÁRIO' : (pickingP2 ? 'P2 — ESCOLHA SEU LUTADOR' : 'PRONTO'));
    ctx.fillText(title, W / 2, 28);
    const cols = 7;
    const cw = 128;
    const ch = 118;
    const ox = (W - cols * cw) / 2;
    const oy = 42;
    const focus = this.selConfirmed[0] && this.mode === 'versus' ? 1 : (this.selConfirmed[0] ? 1 : 0);
    FIGHTERS.forEach((f, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = ox + col * cw + cw / 2;
      const cy = oy + row * ch;
      const isP1 = this.selIdx[0] === i;
      const isP2 = this.selIdx[1] === i;
      ctx.fillStyle = 'rgba(10,16,28,0.92)';
      ctx.fillRect(cx - 46, cy + 4, 92, 100);
      ctx.strokeStyle = isP1 ? '#3dffe0' : isP2 ? '#ff7de0' : '#24344e';
      ctx.lineWidth = isP1 || isP2 ? 3 : 1;
      ctx.strokeRect(cx - 46, cy + 4, 92, 100);
      const footY = oy + row * ch + ch - 4;
      SpriteGen.blit(ctx, f.id, 'idle', Math.floor(this.time / 8) + i, 1, cx, footY, false, 1);
      if (isP1) { ctx.fillStyle = '#3dffe0'; ctx.font = 'bold 11px monospace'; ctx.fillText('P1', cx - 28, cy + 16); }
      if (isP2) { ctx.fillStyle = '#ff7de0'; ctx.font = 'bold 11px monospace'; ctx.fillText('P2', cx + 28, cy + 16); }
    });

    const f = FIGHTERS[this.selIdx[focus]];
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(12, 292, W - 24, 236);
    ctx.strokeStyle = f.colors.accent;
    ctx.strokeRect(12, 292, W - 24, 236);
    SpriteGen.blit(ctx, f.id, 'idle', Math.floor(t * 8), 1, 120, 510, false, 2);
    ctx.textAlign = 'left';
    ctx.fillStyle = f.colors.accent;
    ctx.font = 'bold 20px monospace';
    ctx.fillText(f.name, 230, 328);
    ctx.fillStyle = '#d5e4ff';
    ctx.font = '14px monospace';
    ctx.fillText(f.title, 230, 352);
    this.wrapText(ctx, f.bio, 230, 378, 500, 18);
    ctx.fillStyle = '#ffd27d';
    ctx.font = '13px monospace';
    ctx.fillText('FORÇA', 230, 430);
    this.statBar(ctx, 300, 420, f.stats.power / 1.35);
    ctx.fillText('VEL.', 430, 430);
    this.statBar(ctx, 490, 420, f.stats.speed / 1.4);
    ctx.fillText('PESO', 620, 430);
    this.statBar(ctx, 680, 420, f.stats.weight / 1.35);
    ctx.fillStyle = '#9dffc9';
    ctx.font = '13px monospace';
    ctx.fillText('ESPECIAL: ' + f.special.name + '  (' + f.special.cost + ')', 230, 468);
    ctx.fillText('SUPER: ' + f.super.name, 230, 490);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText('CENÁRIO: ' + STAGES[this.stageIdx].name + '     ↑↓ troca', W / 2, 516);
    ctx.textAlign = 'left';
  }

  statBar(ctx, x, y, pct) {
    ctx.fillStyle = '#1c2433';
    ctx.fillRect(x, y, 90, 8);
    ctx.fillStyle = '#ffd27d';
    ctx.fillRect(x, y, 90 * Math.max(0, Math.min(1, pct)), 8);
  }

  wrapText(ctx, text, x, y, maxW, lh) {
    const words = text.split(' ');
    let line = '';
    let yy = y;
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW) {
        ctx.fillText(line, x, yy);
        line = word;
        yy += lh;
      } else line = test;
    }
    if (line) ctx.fillText(line, x, yy);
  }

  drawVS(t) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 70, W, 86);
    ctx.fillRect(0, H - 120, W, 70);
    const f1 = this.p1.def;
    const f2 = this.p2.def;
    ctx.textAlign = 'center';
    ctx.font = 'bold 64px monospace';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#000';
    ctx.strokeText('VS', W / 2, 128);
    ctx.fillStyle = '#ffd27d';
    ctx.fillText('VS', W / 2, 128);
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = f1.colors.accent;
    ctx.fillText(f1.name, W * 0.25, H - 78);
    ctx.fillStyle = f2.colors.accent;
    ctx.fillText(f2.name, W * 0.75, H - 78);
    ctx.fillStyle = '#ddd';
    ctx.font = '13px monospace';
    ctx.fillText(f1.title, W * 0.25, H - 56);
    ctx.fillText(f2.title, W * 0.75, H - 56);
    ctx.fillStyle = 'rgba(255,255,255,' + (0.45 + Math.sin(t * 5) * 0.35) + ')';
    ctx.fillText(STAGES[this.stageIdx].name, W / 2, H - 56);
    ctx.textAlign = 'left';
  }

  drawGameOver(t) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(0, 0, W, H);
    const winner = this.p1.wins >= 2 ? this.p1 : this.p2;
    const loser = winner === this.p1 ? this.p2 : this.p1;
    SpriteGen.blit(ctx, winner.def.id, 'win', Math.floor(this.time / 7), 1, 210, H - 70, false, 2);
    ctx.textAlign = 'left';
    ctx.font = 'bold 42px monospace';
    ctx.fillStyle = winner.def.colors.accent;
    ctx.fillText(winner.def.name, 400, H / 2 - 20);
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('VENCEU', 400, H / 2 + 18);
    ctx.font = '16px monospace';
    ctx.fillStyle = '#ddd';
    ctx.fillText(loser.def.name + ' caiu em ' + this.round + ' round(s).', 400, H / 2 + 52);
    ctx.fillStyle = Math.sin(t * 4) > 0 ? '#ffd27d' : '#aaa';
    ctx.fillText('ENTER volta ao título', 400, H / 2 + 84);
  }
}
