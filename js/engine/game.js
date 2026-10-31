/* ============================================================
   DS FIGHTERS — Game core: telas, rounds, HUD, partículas,
   fala dos personagens,KO, timer.
   ============================================================ */

const W = 960, H = 540;
const GROUND_Y = H - 60;
const ROUND_TIME = 99;

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.W = W; this.H = H;
    this.audio = AudioSys;
    this.time = 0;
    this.screen = 'title';       // title|menu|select|vs|fight|roundEnd|gameover
    this.mode = 'arcade';        // arcade (vs CPU) ou versus (2 jogadores)
    this.menuIdx = 0;
    this.menuOptions = ['MODO ARCADE (vs CPU)', 'VERSUS (2 JOGADORES)', 'COMO JOGAR'];
    this.selIdx = [0, 0];        // seleção P1, P2
    this.selConfirmed = [false, false];
    this.stageIdx = (Math.random() * STAGES.length) | 0;
    this.p1 = null; this.p2 = null;
    this.stage = null;
    this.projectiles = [];
    this.particles = [];
    this.speech = null;          // {fighter, text, until}
    this.round = 1;
    this.roundTimer = ROUND_TIME * 60;
    this.roundState = 'intro';   // intro|fight|ko|end
    this.roundStateTime = 0;
    this.shakeMag = 0;
    this.flashColor = null;
    this.flashUntil = 0;
    this.countdown = 3;
    this.message = null;         // texto grande central (FIGHT!, K.O.!, etc.)
    this.messageUntil = 0;
    this.difficulty = 1;
    this.hitstop = 0;            // frames de "congelamento" no impacto
    this.slowmo = 0;             // slow motion (KO)
    this.dmgNumbers = [];        // números de dano flutuando
    this.combo = { owner: null, count: 0, until: 0 };
    this.camX = 0;               // câmera que acompanha a ação
    this.ghostHp = [100, 100];   // dano fantasma das barras
  }

  registerHit(attacker, victim, dmg, blocked) {
    this.hitstop = blocked ? 3 : (dmg >= 14 ? 7 : 4);
    if (attacker) {
      if (this.combo.owner === attacker && this.time < this.combo.until) this.combo.count++;
      else { this.combo = { owner: attacker, count: 1, until: this.time + 90 }; }
      this.combo.until = this.time + 90;
    }
    this.dmgNumbers.push({
      x: victim.x + (Math.random() - 0.5) * 30,
      y: victim.y - victim.height - 10,
      vy: -1.6,
      life: 45,
      text: (blocked ? 'BLOCK ' : '') + Math.round(dmg),
      color: blocked ? '#9adcff' : (dmg >= 14 ? '#ff5030' : '#ffe14d'),
    });
  }

  spawnHitStar(x, y, color) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * 6, vy: Math.sin(a) * 6,
        life: 16, color, size: 5, star: true,
      });
    }
  }

  say(fighter, text) {
    this.speech = { fighter, text, until: this.time + 2200 };
  }

  showMessage(text, ms = 1200, color = '#fff') {
    this.message = { text, color };
    this.messageUntil = this.time + ms;
  }

  shake(n) { this.shakeMag = Math.max(this.shakeMag, n); }

  flashScreen(color) {
    this.flashColor = color;
    this.flashUntil = this.time + 250;
  }

  spawnSparks(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 7 - 2,
        life: 30 + Math.random() * 20,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  spawnProjectile(owner, spec, delay) {
    this.projectiles.push(new Projectile(owner, spec, delay));
  }

  aoeBlast(owner, radius, dmg, heal) {
    const target = owner === this.p1 ? this.p2 : this.p1;
    if (target && target.alive && Math.abs(target.x - owner.x) < radius) {
      target.takeHit(dmg, { kx: 10, attacker: owner });
    }
    if (heal) owner.heal(heal);
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      this.particles.push({
        x: owner.x, y: -70,
        vx: Math.cos(a) * 7, vy: Math.sin(a) * 7 - 2,
        life: 40, color: owner.def.colors.accent, size: 4,
      });
    }
    this.shake(12);
  }

  onKO(loser) {
    if (this.roundState !== 'fight') return;
    this.roundState = 'ko';
    this.roundStateTime = 0;
    this.slowmo = 150; // slow motion no K.O.
    const winner = loser === this.p1 ? this.p2 : this.p1;
    winner.state = 'win';
    winner.wins++;
    const q = winner.def.quotes.win;
    this.say(winner, q[(Math.random() * q.length) | 0]);
    this.showMessage('K.O.!', 2200, '#ff3b30');
    this.shake(16);
  }

  startFight() {
    const d1 = FIGHTERS[this.selIdx[0]];
    const d2 = FIGHTERS[this.selIdx[1]];
    this.p1 = new Fighter(d1, W * 0.3, 1, this);
    this.p2 = new Fighter(d2, W * 0.7, -1, this);
    this.stage = new StageFX(STAGES[this.stageIdx], W, H);
    this.projectiles = [];
    this.particles = [];
    this.speech = null;
    this.roundTimer = ROUND_TIME * 60;
    this.round = 1;
    this.p1.wins = 0; this.p2.wins = 0;
    this.ghostHp = [100, 100];
    this.dmgNumbers = [];
    this.combo = { owner: null, count: 0, until: 0 };
    this.slowmo = 0; this.hitstop = 0; this.camX = 0;
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
    this.round++;
    const hp1 = this.p1.hp, hp2 = this.p2.hp;
    this.p1 = new Fighter(this.p1.def, W * 0.3, 1, this);
    this.p2 = new Fighter(this.p2.def, W * 0.7, -1, this);
    this.p1.wins = hp1 > 0 ? this.p1.wins : this.p1.wins; // preserva
    this.stage = new StageFX(STAGES[(Math.random() * STAGES.length) | 0], W, H);
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
  }

  update() {
    this.time++;
    if (this.hitstop > 0) { this.hitstop--; Input.endFrame(); return; }  // congela tudo no impacto
    if (this.slowmo > 0) {
      this.slowmo--;
      if (this.slowmo % 3 !== 0) { Input.endFrame(); return; }          // roda 1 a cada 3 frames
    }
    const t = this.time / 60;

    if (this.screen === 'title') {
      if (Input.hit('Enter') || Input.hit('Space') || Input.hit('KeyA')) {
        this.screen = 'menu';
        this.audio.ensure();
        this.audio.cursor();
      }
      return;
    }

    if (this.screen === 'menu') {
      if (Input.hit('ArrowUp') || Input.hit('KeyW')) { this.menuIdx = (this.menuIdx + this.menuOptions.length - 1) % this.menuOptions.length; this.audio.cursor(); }
      if (Input.hit('ArrowDown') || Input.hit('KeyS')) { this.menuIdx = (this.menuIdx + 1) % this.menuOptions.length; this.audio.cursor(); }
      if (Input.hit('Enter') || Input.hit('Space') || Input.hit('KeyA')) {
        this.audio.select();
        if (this.menuIdx === 0) { this.mode = 'arcade'; this.difficulty = 1; this.screen = 'select'; this.selIdx = [0, (Math.random() * FIGHTERS.length) | 0]; this.selConfirmed = [false, false]; }
        else if (this.menuIdx === 1) { this.mode = 'versus'; this.screen = 'select'; this.selIdx = [0, 1]; this.selConfirmed = [false, false]; }
        else { this.screen = 'help'; }
      }
      return;
    }

    if (this.screen === 'help') {
      if (Input.hit('Enter') || Input.hit('Space') || Input.hit('Escape') || Input.hit('KeyA')) { this.screen = 'menu'; this.audio.cursor(); }
      return;
    }

    if (this.screen === 'select') {
      const nav = (i, dir) => {
        let n = this.selIdx[i] + dir;
        if (n < 0) n = FIGHTERS.length - 1;
        if (n >= FIGHTERS.length) n = 0;
        if (this.mode === 'versus' && n === this.selIdx[1 - i] && !this.selConfirmed[1 - i]) n = (n + dir + FIGHTERS.length) % FIGHTERS.length;
        this.selIdx[i] = n;
        this.audio.cursor();
      };
      if (!this.selConfirmed[0]) {
        if (Input.hit('ArrowLeft')) nav(0, -1);
        if (Input.hit('ArrowRight')) nav(0, 1);
        if (Input.hit('KeyA')) { this.selConfirmed[0] = true; this.audio.select(); }
      } else if (this.mode === 'arcade') {
        if (Input.hit('Enter') || Input.hit('Space')) { this.audio.select(); this.startFight(); }
      } else if (!this.selConfirmed[1]) {
        if (Input.hit('KeyJ')) nav(1, -1);
        if (Input.hit('KeyL')) nav(1, 1);
        if (Input.hit('Digit1')) { this.selConfirmed[1] = true; this.audio.select(); this.startFight(); }
      }
      if (Input.hit('Escape')) { this.screen = 'menu'; }
      return;
    }

    if (this.screen === 'vs') {
      this.roundStateTime++;
      if (this.roundStateTime > 150 || Input.hit('Enter') || Input.hit('Space')) {
        this.screen = 'fight';
        this.roundState = 'intro';
        this.roundStateTime = 0;
        this.showMessage('ROUND ' + this.round, 1000, '#ffd27d');
      }
      this.drawScene(t);
      this.drawVS(t);
      return;
    }

    if (this.screen === 'fight') {
      this.updateFight(t);
      this.drawScene(t);
      this.drawHUD(t);
      this.drawSpeech();
      this.drawMessage();
      return;
    }

    if (this.screen === 'gameover') {
      if (Input.hit('Enter') || Input.hit('Space') || Input.hit('KeyA')) {
        this.audio.select();
        this.screen = 'title';
        this.audio.stopMusic();
      }
      this.drawScene(t);
      this.drawGameOver(t);
      return;
    }
  }

  updateFight(t) {
    this.roundStateTime++;

    if (this.roundState === 'intro') {
      if (this.roundStateTime === 1) { this.showMessage('ROUND ' + this.round, 900, '#ffd27d'); this.audio.round(); }
      if (this.roundStateTime === 60) this.showMessage('FIGHT!', 700, '#7dff5e');
      if (this.roundStateTime > 100) { this.roundState = 'fight'; this.roundStateTime = 0; }
      this.p1.update({ left: false, right: false, up: false, down: false, punch: false, kick: false, special: false, super: false }, this.p2);
      this.p2.update({ left: false, right: false, up: false, down: false, punch: false, kick: false, special: false, super: false }, this.p1);
      return;
    }

    if (this.roundState === 'fight') {
      this.roundTimer--;
      const p1Input = Input.read(Input.p1);
      const p2Input = this.mode === 'versus' ? Input.read(Input.p2) : AI.think(this.p2, this.p1, this.difficulty);
      this.p1.update(p1Input, this.p2);
      this.p2.update(p2Input, this.p1);

      // limites da arena
      for (const f of [this.p1, this.p2]) {
        f.x = Math.max(40, Math.min(W - 40, f.x));
        // colisão entre lutadores
        const other = f === this.p1 ? this.p2 : this.p1;
        const minDist = 46;
        if (Math.abs(f.x - other.x) < minDist && Math.abs(f.y - other.y) < 60) {
          const push = (minDist - Math.abs(f.x - other.x)) / 2;
          f.x += f.x < other.x ? -push : push;
        }
        // obstáculos do estágio
        this.stage.check(f);
      }

      // projéteis
      for (const p of this.projectiles) {
        p.update(this, p.owner === this.p1 ? this.p2 : this.p1);
      }
      this.projectiles = this.projectiles.filter((p) => !p.dead);

      this.tickFx();

      // fim de round por tempo
      if (this.roundTimer <= 0) {
        this.roundState = 'end';
        this.roundStateTime = 0;
        const w = this.p1.hp === this.p2.hp ? null : (this.p1.hp > this.p2.hp ? this.p1 : this.p2);
        if (w) {
          w.wins++;
          this.showMessage('TIME UP!', 1200, '#ffd27d');
          const other = w === this.p1 ? this.p2 : this.p1;
          if (other.alive) { other.state = 'ko'; }
          w.state = 'win';
          this.audio.ko();
        } else {
          this.showMessage("DRAW!", 1200, '#9adcff');
        }
      }
      return;
    }

    if (this.roundState === 'ko' || this.roundState === 'end') {
      this.p1.update({ left: false, right: false, up: false, down: false, punch: false, kick: false, special: false, super: false }, this.p2);
      this.p2.update({ left: false, right: false, up: false, down: false, punch: false, kick: false, special: false, super: false }, this.p1);
      for (const p of this.projectiles) p.update(this, p.owner === this.p1 ? this.p2 : this.p1);
      this.projectiles = this.projectiles.filter((p) => !p.dead);
      this.tickFx();
      if (this.roundStateTime > 170) {
        if (this.p1.wins >= 2 || this.p2.wins >= 2) {
          this.screen = 'gameover';
          this.audio.stopMusic();
        } else {
          this.nextRound();
        }
      }
    }
  }

  tickFx() {
    // partículas
    for (const pt of this.particles) {
      pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.4; pt.life--;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    // números de dano
    for (const d of this.dmgNumbers) { d.y += d.vy; d.life--; }
    this.dmgNumbers = this.dmgNumbers.filter((d) => d.life > 0);
    // dano fantasma das barras de vida (desce devagar até o hp real)
    for (let i = 0; i < 2; i++) {
      const f = i === 0 ? this.p1 : this.p2;
      if (this.ghostHp[i] > f.hp) this.ghostHp[i] = Math.max(f.hp, this.ghostHp[i] - 0.6);
    }
    // câmera segue o meio dos dois lutadores
    if (this.p1 && this.p2) {
      const mid = (this.p1.x + this.p2.x) / 2;
      const target = Math.max(0, Math.min(W - W, 0)); // arena fixa, câmera sutil
      this.camX += ((mid - W / 2) * 0.04 - this.camX) * 0.1;
      this.camX = Math.max(-40, Math.min(40, this.camX));
    }
  }

  drawScene(t) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(-this.camX, 0);
    if (this.shakeMag > 0) {
      ctx.translate((Math.random() - 0.5) * this.shakeMag, (Math.random() - 0.5) * this.shakeMag);
      this.shakeMag *= 0.85;
      if (this.shakeMag < 0.5) this.shakeMag = 0;
    }
    const stageDef = this.stage ? this.stage.def : STAGES[this.stageIdx];
    stageDef.draw(ctx, W, H, t);
    if (this.stage) this.stage.draw(ctx, t);
    else {
      // fundo do menu
    }
    if (this.p1) {
      for (const p of this.projectiles) p.draw(ctx);
      this.p1.draw(ctx);
      this.p2.draw(ctx);
      for (const pt of this.particles) {
        ctx.globalAlpha = Math.min(1, pt.life / 20);
        ctx.fillStyle = pt.color;
        if (pt.star) {
          ctx.save();
          ctx.translate(pt.x, pt.y);
          ctx.rotate(this.time * 0.15);
          ctx.fillRect(-pt.size, -1.5, pt.size * 2, 3);
          ctx.fillRect(-1.5, -pt.size, 3, pt.size * 2);
          ctx.restore();
        } else {
          ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
        }
      }
      ctx.globalAlpha = 1;
      // números de dano flutuando
      for (const d of this.dmgNumbers) {
        ctx.globalAlpha = Math.min(1, d.life / 25);
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000';
        ctx.fillText(d.text, d.x + 2, d.y + 2);
        ctx.fillStyle = d.color;
        ctx.fillText(d.text, d.x, d.y);
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    }
    ctx.restore();
    // vinheta estilo arcade
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    if (this.flashColor && this.time < this.flashUntil) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }

  bar(x, y, w, h, pct, color, flip, ghostPct = null) {
    const ctx = this.ctx;
    // moldura estilo arcade
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
    ctx.fillStyle = '#2a0808';
    ctx.fillRect(x, y, w, h);
    // dano fantasma (amarelo) por cima do vermelho vazio
    if (ghostPct !== null && ghostPct > pct) {
      const gw = w * ghostPct;
      ctx.fillStyle = '#ffd24d';
      if (flip) ctx.fillRect(x + w - gw, y, gw, h);
      else ctx.fillRect(x, y, gw, h);
    }
    const fillW = Math.max(0, w * pct);
    // gradiente da vida: verde → amarelo → vermelho conforme cai
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#baff9e');
    g.addColorStop(0.5, color);
    g.addColorStop(1, color);
    ctx.fillStyle = g;
    if (flip) ctx.fillRect(x + w - fillW, y, fillW, h);
    else ctx.fillRect(x, y, fillW, h);
    // brilho no topo
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x, y, w, 3);
  }

  drawHUD(t) {
    const ctx = this.ctx;
    // barras de vida com dano fantasma
    this.bar(20, 18, 380, 22, this.p1.hp / this.p1.maxHp, this.p1.hp > 30 ? '#4ddb3a' : '#ff3b30', false, this.ghostHp[0] / 100);
    this.bar(W - 400, 18, 380, 22, this.p2.hp / this.p2.maxHp, this.p2.hp > 30 ? '#4ddb3a' : '#ff3b30', true, this.ghostHp[1] / 100);
    // super segmentada que brilha quando cheia
    const drawSuper = (x, pct, flip) => {
      const full = pct >= 1;
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(x - 3, 46 - 3, 380 + 6, 10 + 6);
      ctx.strokeStyle = full && Math.sin(t * 8) > 0 ? '#ff7de0' : '#666';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 3, 46 - 3, 380 + 6, 10 + 6);
      for (let i = 0; i < 10; i++) {
        const segW = 38;
        const segPct = Math.max(0, Math.min(1, pct * 10 - i));
        ctx.fillStyle = '#1a1030';
        ctx.fillRect(x + i * segW, 46, segW - 2, 10);
        if (segPct > 0) {
          ctx.fillStyle = full ? (Math.sin(t * 10 + i) > 0 ? '#ffffff' : '#ff7de0') : '#b26bff';
          ctx.fillRect(x + i * segW, 46, (segW - 2) * segPct, 10);
        }
      }
    };
    drawSuper(20, this.p1.super / 100, false);
    drawSuper(W - 400, this.p2.super / 100, true);
    // nomes
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(this.p1.def.name, 22, 14);
    ctx.textAlign = 'right';
    ctx.fillText(this.p2.def.name, W - 22, 14);
    ctx.textAlign = 'left';
    // timer
    const secs = Math.max(0, Math.ceil(this.roundTimer / 60));
    ctx.font = 'bold 30px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = secs <= 10 ? '#ff3b30' : '#fff';
    ctx.fillText(String(secs).padStart(2, '0'), W / 2, 44);
    ctx.textAlign = 'left';
    // wins (rounds)
    ctx.fillStyle = '#ffd27d';
    for (let i = 0; i < this.p1.wins; i++) { ctx.beginPath(); ctx.arc(30 + i * 18, 70, 6, 0, Math.PI * 2); ctx.fill(); }
    for (let i = 0; i < this.p2.wins; i++) { ctx.beginPath(); ctx.arc(W - 30 - i * 18, 70, 6, 0, Math.PI * 2); ctx.fill(); }
    // nome do estágio
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'center';
    ctx.fillText('— ' + this.stage.def.name + ' —', W / 2, H - 8);
    // contador de combo estilo arcade
    if (this.combo.count >= 2 && this.time < this.combo.until) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 26px monospace';
      ctx.shadowColor = '#ff7b1c';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffe14d';
      const cx = this.combo.owner === this.p1 ? 160 : W - 160;
      ctx.fillText(this.combo.count + ' HITS!', cx, 110);
      ctx.shadowBlur = 0;
    }
    ctx.textAlign = 'left';
  }

  drawSpeech() {
    if (!this.speech || this.time > this.speech.until) return;
    const ctx = this.ctx;
    const f = this.speech.fighter;
    ctx.font = 'bold 13px monospace';
    const tw = ctx.measureText(this.speech.text).width + 16;
    const bx = Math.max(8, Math.min(W - tw - 8, f.x - tw / 2));
    const by = f.y - f.height - 58;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(bx, by, tw, 22);
    ctx.strokeStyle = f.def.colors.accent;
    ctx.strokeRect(bx, by, tw, 22);
    ctx.fillStyle = '#fff';
    ctx.fillText(this.speech.text, bx + 8, by + 15);
  }

  drawMessage() {
    if (!this.message || this.time > this.messageUntil) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 56px monospace';
    ctx.shadowColor = this.message.color;
    ctx.shadowBlur = 24;
    ctx.fillStyle = this.message.color;
    ctx.fillText(this.message.text, W / 2, H / 2 - 40);
    ctx.restore();
  }

  drawTitle(t) {
    const ctx = this.ctx;
    // fundo estilo arcade: gradiente escuro + horizonte
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#070b1e');
    g.addColorStop(0.55, '#1a1040');
    g.addColorStop(0.8, '#3d0f3d');
    g.addColorStop(1, '#12081f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // código caindo leve no fundo
    ctx.font = '12px monospace';
    for (let c = 0; c < 30; c++) {
      const x = c * 32;
      const y = ((t * 30 + c * 173) % (H + 60)) - 30;
      ctx.fillStyle = 'rgba(0,255,140,0.22)';
      ctx.fillText('01<>{}#;'.charAt((c + ((t * 3) | 0)) % 8), x, y);
    }
    // sol neon ao fundo (vaporwave arcade)
    const sunY = H * 0.62;
    const sg = ctx.createLinearGradient(0, sunY - 120, 0, sunY + 120);
    sg.addColorStop(0, '#ffe14d');
    sg.addColorStop(0.5, '#ff7b1c');
    sg.addColorStop(1, '#ff3cdc');
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, sunY - 130, W, 260);
    ctx.clip();
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(W / 2, sunY, 130, Math.PI, 0); ctx.fill();
    // listras horizontais cortando o sol
    ctx.fillStyle = '#12081f';
    for (let i = 0; i < 6; i++) {
      const ly = sunY - 20 + i * 16 + Math.sin(t) * 0;
      ctx.fillRect(0, ly, W, 3 + i);
    }
    ctx.restore();
    // logo estilo arcade com contorno e gradiente
    ctx.textAlign = 'center';
    ctx.font = 'bold 78px monospace';
    const pulse = 1 + Math.sin(t * 3) * 0.02;
    ctx.save();
    ctx.translate(W / 2, H / 2 - 70);
    ctx.scale(pulse, pulse);
    // contorno grosso preto
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#000';
    ctx.strokeText('DS FIGHTERS', 0, 0);
    // preenchimento com gradiente dourado→rosa
    const lg = ctx.createLinearGradient(0, -60, 0, 10);
    lg.addColorStop(0, '#fff6b0');
    lg.addColorStop(0.45, '#ffd24d');
    lg.addColorStop(0.75, '#ff7b1c');
    lg.addColorStop(1, '#ff3cdc');
    ctx.fillStyle = lg;
    ctx.shadowColor = '#ff9d2e';
    ctx.shadowBlur = 34;
    ctx.fillText('DS FIGHTERS', 0, 0);
    ctx.restore();
    // subtítulo em placa
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(W / 2 - 240, H / 2 - 34, 480, 34);
    ctx.strokeStyle = '#00ffc8';
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 240, H / 2 - 34, 480, 34);
    ctx.fillStyle = '#7dffd4';
    ctx.font = 'bold 19px monospace';
    ctx.fillText('★ TORNEIO DOS DESENVOLVEDORES ★', W / 2, H / 2 - 11);
    // "pressione enter" piscando
    ctx.fillStyle = Math.sin(t * 4) > 0 ? '#fff' : '#777';
    ctx.font = 'bold 17px monospace';
    ctx.fillText('PRESSIONE ENTER / TOCAR PARA COMEÇAR', W / 2, H / 2 + 40);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '12px monospace';
    ctx.fillText('13 lutadores • 6 cenários • obstáculos interativos • specials e supers', W / 2, H / 2 + 66);
    // scanlines de CRT
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);
    ctx.textAlign = 'left';
  }

  drawMenu(t) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7dffd4';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('MENU', W / 2, 140);
    this.menuOptions.forEach((opt, i) => {
      ctx.font = (i === this.menuIdx ? 'bold 24px monospace' : '20px monospace');
      ctx.fillStyle = i === this.menuIdx ? '#ffd27d' : '#aaa';
      ctx.fillText((i === this.menuIdx ? '▶ ' : '') + opt, W / 2, 210 + i * 46);
    });
    ctx.textAlign = 'left';
  }

  drawHelp() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7dffd4';
    ctx.font = 'bold 30px monospace';
    ctx.fillText('COMO JOGAR', W / 2, 90);
    ctx.font = '16px monospace';
    ctx.fillStyle = '#ddd';
    const lines = [
      'P1: ← → ↑ ↓  |  A = soco   S = chute   D = special   F = super',
      'P2 (versus): J L I K  |  1 = soco   2 = chute   3 = special   4 = super',
      '',
      '• Super enche causing/recebendo dano — encha até 100% para o SUPER',
      '• Special gasta parte da barra de super',
      '• Ande sobre os obstáculos do cenário: cada um tem um efeito!',
      '• Vença 2 rounds para ganhar a luta',
      '',
      'ENTER / VOLTAR',
    ];
    lines.forEach((l, i) => ctx.fillText(l, W / 2, 150 + i * 32));
    ctx.textAlign = 'left';
  }

  drawSelect(t) {
    const ctx = this.ctx;
    ctx.fillStyle = '#070a14';
    ctx.fillRect(0, 0, W, H);
    // fundo animado
    ctx.font = '14px monospace';
    for (let c = 0; c < 24; c++) {
      const y = ((t * 40 + c * 211) % (H + 40)) - 20;
      ctx.fillStyle = 'rgba(0,255,170,0.12)';
      ctx.fillText('{}<>#'.charAt((c + ((t * 2) | 0)) % 5), c * 40, y);
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7dffd4';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(this.mode === 'arcade' ? 'P1 — ESCOLHA SEU LUTADOR' : (this.selConfirmed[0] ? 'P2 — ESCOLHA SEU LUTADOR' : 'P1 — ESCOLHA SEU LUTADOR (A p/ confirmar)'), W / 2, 46);

    const cols = 6, rows = 2;
    const cw = 140, ch = 150;
    const ox = (W - cols * cw) / 2, oy = 80;
    FIGHTERS.forEach((f, i) => {
      const cx = ox + (i % cols) * cw + cw / 2;
      const cy = oy + Math.floor(i / cols) * ch + ch / 2;
      const isP1 = this.selIdx[0] === i;
      const isP2 = this.selIdx[1] === i;
      // retrato procedural
      const spr = SpriteGen.get(f, 'idle', (this.time + i * 7) | 0, 1);
      ctx.save();
      if (isP1 || isP2) {
        ctx.shadowColor = isP1 ? '#00ffc8' : '#ff7de0';
        ctx.shadowBlur = 18;
      }
      ctx.fillStyle = 'rgba(10,16,28,0.9)';
      ctx.fillRect(cx - 56, cy - 62, 112, 124);
      ctx.strokeStyle = isP1 ? '#00ffc8' : isP2 ? '#ff7de0' : '#2a3a55';
      ctx.lineWidth = isP1 || isP2 ? 3 : 1;
      ctx.strokeRect(cx - 56, cy - 62, 112, 124);
      ctx.drawImage(spr, cx - 40, cy - 62, 80, 106);
      ctx.restore();
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = isP1 || isP2 ? '#fff' : '#9fb4d8';
      ctx.fillText(f.name, cx, cy + 78);
      if (isP1) { ctx.fillStyle = '#00ffc8'; ctx.font = '11px monospace'; ctx.fillText('P1', cx, cy - 70); }
      if (isP2) { ctx.fillStyle = '#ff7de0'; ctx.font = '11px monospace'; ctx.fillText('P2', cx, cy - 70); }
    });

    // painel de detalhes do personagem sob o cursor
    const f = FIGHTERS[this.selIdx[this.selConfirmed[0] && this.mode === 'versus' ? 1 : 0]];
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(W / 2 - 330, H - 118, 660, 100);
    ctx.strokeStyle = f.colors.accent;
    ctx.strokeRect(W / 2 - 330, H - 118, 660, 100);
    ctx.fillStyle = f.colors.accent;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(f.name + ' — ' + f.title, W / 2, H - 92);
    ctx.fillStyle = '#cfe0ff';
    ctx.font = '13px monospace';
    ctx.fillText(f.bio, W / 2, H - 70);
    ctx.fillStyle = '#ffd27d';
    const s = f.stats;
    ctx.fillText(`PODER ${'█'.repeat(Math.round(s.power * 5))}  VELOCIDADE ${'█'.repeat(Math.round(s.speed * 5))}  PESO ${'█'.repeat(Math.round(s.weight * 5))}`, W / 2, H - 48);
    ctx.fillStyle = '#8affc1';
    ctx.font = '12px monospace';
    ctx.fillText(`SPECIAL: ${f.special.name} (${f.special.cost} super)   |   SUPER: ${f.super.name} (100 super)`, W / 2, H - 28);
    ctx.textAlign = 'left';
  }

  drawVS(t) {
    const ctx = this.ctx;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const f1 = FIGHTERS[this.selIdx[0]], f2 = FIGHTERS[this.selIdx[1]];
    // VS central pulsante
    ctx.textAlign = 'center';
    ctx.font = 'bold 90px monospace';
    ctx.shadowColor = '#ff3b30';
    ctx.shadowBlur = 30 + Math.sin(t * 6) * 12;
    ctx.fillStyle = '#ffd27d';
    ctx.fillText('VS', W / 2, H / 2 + 30);
    ctx.shadowBlur = 0;
    // retratos grandes
    const s1 = SpriteGen.get(f1, 'idle', (this.time) | 0, 1);
    const s2 = SpriteGen.get(f2, 'idle', (this.time + 5) | 0, -1);
    const bob = Math.sin(t * 4) * 6;
    ctx.drawImage(s1, W / 2 - 260, H / 2 - 130 + bob, 150, 200);
    ctx.drawImage(s2, W / 2 + 110, H / 2 - 130 - bob, 150, 200);
    ctx.font = 'bold 26px monospace';
    ctx.fillStyle = f1.colors.accent;
    ctx.fillText(f1.name, W / 2 - 185, H / 2 + 110);
    ctx.fillStyle = f2.colors.accent;
    ctx.fillText(f2.name, W / 2 + 185, H / 2 + 110);
    ctx.fillStyle = '#fff';
    ctx.font = '15px monospace';
    ctx.fillText(f1.title, W / 2 - 185, H / 2 + 136);
    ctx.fillText(f2.title, W / 2 + 185, H / 2 + 136);
    ctx.textAlign = 'left';
  }

  drawGameOver(t) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, W, H);
    const winner = this.p1.wins >= 2 ? this.p1 : this.p2;
    const loser = winner === this.p1 ? this.p2 : this.p1;
    ctx.textAlign = 'center';
    ctx.font = 'bold 52px monospace';
    ctx.shadowColor = winner.def.colors.accent;
    ctx.shadowBlur = 25;
    ctx.fillStyle = winner.def.colors.accent;
    ctx.fillText(winner.def.name + ' VENCE!', W / 2, H / 2 - 30);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(loser.def.name + ' foi derrotado em ' + this.round + ' round(s)', W / 2, H / 2 + 14);
    ctx.fillStyle = Math.sin(t * 4) > 0 ? '#ffd27d' : '#999';
    ctx.font = '16px monospace';
    ctx.fillText('ENTER para voltar ao título', W / 2, H / 2 + 60);
    ctx.textAlign = 'left';
  }

  draw() {
    const t = this.time / 60;
    if (this.screen === 'title') this.drawTitle(t);
    else if (this.screen === 'menu') { this.drawScene(t); this.drawMenu(t); }
    else if (this.screen === 'help') { this.drawScene(t); this.drawHelp(); }
    else if (this.screen === 'select') this.drawSelect(t);
    else if (this.screen === 'vs') { /* desenhado no update via drawScene+drawVS */ }
    else if (this.screen === 'gameover') { /* desenhado no update */ }
    else if (this.screen === 'fight') { /* desenhado no update */ }
  }
}
