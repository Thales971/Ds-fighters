/* ============================================================
   DS FIGHTERS — Clima aleatório por mapa.
   kind: clear | rain | wind | storm | snow | aurora | heatwave
   - wind: força horizontal que muda de direção (empurra lutadores e projéteis)
   - rain/storm: bônus de água/raio, fogo mais fraco, chão escorregadio
   - storm: raios caem com aviso e causam dano a qualquer lutador
   - snow: movimento mais lento; aurora: medidor +8%; heatwave: bônus elemental leve
   O clima pode mudar no meio do round (frente fria / tempestade chegando).
   ============================================================ */
class Weather {
  constructor(game, stage) {
    this.game = game;
    this.stage = stage;
    this.pool = (stage && stage.weather && stage.weather.length) ? stage.weather : ['clear'];
    this.kind = 'clear';
    this.wind = 0;
    this.windTarget = 0;
    this.intensity = 0;
    this.drops = [];
    this.flash = 0;
    this.nextBolt = 400;
    this.changeAt = 0;
    this.t = 0;
  }
  roll(forceKind) {
    const k = forceKind || this.pool[((this.game.rnd ? this.game.rnd() : Math.random()) * this.pool.length) | 0];
    this.set(k);
    this.changeAt = 900 + (((this.game.rnd ? this.game.rnd() : Math.random()) * 900) | 0);
  }
  set(kind) {
    this.kind = kind;
    this.intensity = kind === 'storm' ? 1 : kind === 'clear' ? 0 : 0.6 + (this.game.rnd ? this.game.rnd() : Math.random()) * 0.4;
    this.windTarget = (kind === 'wind' || kind === 'storm') ? ((this.game.rnd ? this.game.rnd() : Math.random()) < 0.5 ? -1 : 1) * (1.2 + (this.game.rnd ? this.game.rnd() : Math.random()) * 1.4) : 0;
    if (kind !== 'wind' && kind !== 'storm') this.wind = 0;
    this.nextBolt = 240 + (((this.game.rnd ? this.game.rnd() : Math.random()) * 200) | 0);
    const a = this.game.audio;
    a.loop('rain_loop', kind === 'rain' || kind === 'storm', kind === 'storm' ? 0.5 : 0.32);
    a.loop('wind_loop', kind === 'wind' || kind === 'storm' || kind === 'snow', 0.3);
    if (this.game.onWeather) this.game.onWeather(kind);
  }
  stop() {
    this.game.audio.loop('rain_loop', false);
    this.game.audio.loop('wind_loop', false);
  }
  friction() {
    if (this.kind === 'rain' || this.kind === 'storm') return 1.25;
    return 1;
  }
  update(fighting) {
    this.t++;
    // rajadas
    if (this.kind === 'wind' || this.kind === 'storm') {
      if (this.t % 300 === 0) this.windTarget = -Math.sign(this.windTarget || 1) * (1.1 + (this.game.rnd ? this.game.rnd() : Math.random()) * 1.6);
      const gust = Math.sin(this.t * 0.03) * 0.35;
      this.wind += (this.windTarget * (1 + gust) - this.wind) * 0.02;
    } else this.wind *= 0.95;
    if (this.game.stageDef && this.game.stageDef.mech === 'gusts') this.wind *= 1.002;
    // mudança de clima no meio do round
    if (fighting && this.pool.length > 1) {
      this.changeAt--;
      if (this.changeAt <= 0) {
        const opts = this.pool.filter((k) => k !== this.kind);
        const next = opts[((this.game.rnd ? this.game.rnd() : Math.random()) * opts.length) | 0];
        this.set(next);
        this.changeAt = 1100 + (((this.game.rnd ? this.game.rnd() : Math.random()) * 900) | 0);
        const info = WEATHER_INFO[next];
        this.game.announce(info.icon + ' ' + info.name.toUpperCase(), '#9adcff', info.desc);
        if (next === 'storm') this.game.audio.voice('storm');
      }
    }
    // raios da tempestade
    if (this.kind === 'storm' && fighting) {
      this.nextBolt--;
      if (this.nextBolt <= 0) {
        this.nextBolt = 300 + (((this.game.rnd ? this.game.rnd() : Math.random()) * 260) | 0);
        const fs = this.game.fighters().filter((f) => f.alive);
        const f = fs[((this.game.rnd ? this.game.rnd() : Math.random()) * fs.length) | 0];
        const x = f ? f.x + ((this.game.rnd ? this.game.rnd() : Math.random()) - 0.5) * 120 : 480;
        this.game.strikes.push(new Strike(null, {
          x, delay: 50, w: 80, h: 600, dmg: 9, stun: 22, launch: -5, element: 'ia', label: 'RAIO!', warnColor: '#ffe14d',
          sheet: { key: 'fx2:lightning', row: 1, frames: 4 }, scale: 4.2, sound: 'thunder', shake: 10, fromSky: false,
          onHit: (v) => v.addStatus('slow', 60),
        }));
        setTimeout(() => { this.flash = 8; }, 0);
      }
    }
    if (this.flash > 0) this.flash--;
    else if (this.kind === 'storm' && (this.game.rnd ? this.game.rnd() : Math.random()) < 0.004) { this.flash = 5; this.game.audio.play('thunder', { vol: 0.35 }); }
    this.updateParticles();
  }
  updateParticles() {
    const W = this.game.W;
    const reduced = this.game.reduced;
    const want = this.kind === 'rain' ? 140 : this.kind === 'storm' ? 220 : this.kind === 'snow' ? 120 : this.kind === 'wind' ? 40 : this.kind === 'aurora' ? 60 : this.kind === 'heatwave' ? 28 : 0;
    const max = Math.floor(want * this.intensity * (reduced ? 0.35 : 1));
    while (this.drops.length < max) {
      const r = this.game.rnd ? this.game.rnd() : Math.random();
      const y = this.kind === 'aurora' ? -330 + r * 130 : this.kind === 'heatwave' ? -40 - r * 55 : -540 + r * 540;
      this.drops.push({ x: (this.game.rnd ? this.game.rnd() : Math.random()) * (W + 200) - 100, y, s: (this.game.rnd ? this.game.rnd() : Math.random()) });
    }
    if (this.drops.length > max) this.drops.length = max;
    for (const d of this.drops) {
      if (this.kind === 'aurora') {
        d.x += reduced ? 0 : 0.35 + d.s * 0.7;
        d.y = -320 + d.s * 100 + (reduced ? 0 : Math.sin((this.t + d.x) * 0.015) * 4);
        if (d.x > W + 60) d.x = -60;
        continue;
      }
      if (this.kind === 'heatwave') {
        d.x += reduced ? 0 : this.wind * 0.15 + Math.sin((this.t + d.s * 50) * 0.03) * 0.35;
        d.y -= reduced ? 0 : 0.35 + d.s * 0.45;
        if (d.y < -145) {
          d.y = -40 - (this.game.rnd ? this.game.rnd() : Math.random()) * 55;
          d.x = (this.game.rnd ? this.game.rnd() : Math.random()) * (W + 120) - 60;
        }
        continue;
      }
      if (this.kind === 'snow') {
        d.y += 0.8 + d.s * 1.2;
        d.x += this.wind * 1.4 + Math.sin((this.t + d.s * 100) * 0.03) * 0.6;
      } else if (this.kind === 'wind') {
        d.x += (this.wind || 1) * (8 + d.s * 8);
        d.y += 0.3;
      } else {
        d.y += 11 + d.s * 6;
        d.x += this.wind * 2.5;
      }
      if (d.y > 0) {
        if ((this.kind === 'rain' || this.kind === 'storm') && (this.game.rnd ? this.game.rnd() : Math.random()) < 0.3 && !reduced) this.game.splash(d.x);
        d.y = -540 - (this.game.rnd ? this.game.rnd() : Math.random()) * 40;
        d.x = (this.game.rnd ? this.game.rnd() : Math.random()) * (W + 200) - 100;
      }
      if (d.x > W + 120) d.x = -100;
      if (d.x < -120) d.x = W + 100;
    }
  }
  draw(ctx) {
    if (!this.drops.length && !this.flash) return;
    ctx.save();
    if (this.kind === 'aurora') {
      const colors = ['rgba(75,255,202,0.42)', 'rgba(119,124,255,0.38)', 'rgba(79,211,255,0.38)', 'rgba(224,113,255,0.32)'];
      const bands = this.game.reduced ? 2 : 4;
      ctx.lineCap = 'round';
      for (let i = 0; i < bands; i++) {
        ctx.beginPath();
        for (let x = -10; x <= this.game.W + 20; x += 32) {
          const y = -305 + i * 20 + (this.game.reduced ? 0 : Math.sin((x + this.t * 2 + i * 60) * 0.012) * 9);
          if (x < 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.globalAlpha = 0.42;
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = 14 + (i % 2) * 5;
        ctx.stroke();
      }
      ctx.globalAlpha = 0.8;
      for (const d of this.drops) {
        ctx.fillStyle = d.s > 0.5 ? '#b8fff0' : '#d9c8ff';
        ctx.fillRect(Math.round(d.x), Math.round(d.y), 2, 2);
      }
    } else if (this.kind === 'heatwave') {
      ctx.strokeStyle = 'rgba(255,190,112,0.52)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const d of this.drops) {
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + 9, d.y + (this.game.reduced ? 0 : Math.sin((this.t + d.x) * 0.08) * 3));
        ctx.lineTo(d.x + 18, d.y);
      }
      ctx.stroke();
    } else if (this.kind === 'snow') {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (const d of this.drops) ctx.fillRect(Math.round(d.x), Math.round(d.y), 2 + (d.s > 0.7 ? 1 : 0), 2 + (d.s > 0.7 ? 1 : 0));
    } else if (this.kind === 'wind') {
      ctx.strokeStyle = 'rgba(230,245,255,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const d of this.drops) {
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - Math.sign(this.wind || 1) * (30 + d.s * 40), d.y);
      }
      ctx.stroke();
    } else {
      ctx.strokeStyle = this.kind === 'storm' ? 'rgba(180,210,255,0.55)' : 'rgba(170,200,255,0.42)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const d of this.drops) {
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - this.wind * 3, d.y - 12 - d.s * 8);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  drawOverlay(ctx, W, H) {
    if (this.kind === 'rain' || this.kind === 'storm') {
      ctx.fillStyle = this.kind === 'storm' ? 'rgba(10,20,50,0.28)' : 'rgba(20,40,70,0.16)';
      ctx.fillRect(0, 0, W, H);
    } else if (this.kind === 'snow') {
      ctx.fillStyle = 'rgba(200,230,255,0.10)';
      ctx.fillRect(0, 0, W, H);
    } else if (this.kind === 'aurora') {
      const glow = ctx.createLinearGradient(0, 0, 0, H * 0.58);
      glow.addColorStop(0, 'rgba(70,235,205,0.09)');
      glow.addColorStop(0.55, 'rgba(137,104,255,0.07)');
      glow.addColorStop(1, 'rgba(20,25,70,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H * 0.58);
    } else if (this.kind === 'heatwave') {
      ctx.fillStyle = 'rgba(255,145,65,0.035)';
      ctx.fillRect(0, H * 0.58, W, H * 0.42);
    }
    if (this.flash > 0 && !this.game.reduced) {
      ctx.fillStyle = `rgba(235,240,255,${0.08 * this.flash})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
}
