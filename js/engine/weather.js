/* ============================================================
   DS FIGHTERS — Clima aleatório por mapa.
   kind: clear | rain | wind | storm | snow
   - wind: força horizontal que muda de direção (empurra lutadores e projéteis)
   - rain/storm: bônus de água/raio, fogo mais fraco, chão escorregadio
   - storm: raios caem com aviso e causam dano a qualquer lutador
   - snow: movimento mais lento
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
    const want = this.kind === 'rain' ? 140 : this.kind === 'storm' ? 220 : this.kind === 'snow' ? 120 : this.kind === 'wind' ? 40 : 0;
    const max = Math.floor(want * this.intensity * (reduced ? 0.35 : 1));
    while (this.drops.length < max) {
      this.drops.push({ x: (this.game.rnd ? this.game.rnd() : Math.random()) * (W + 200) - 100, y: -540 + (this.game.rnd ? this.game.rnd() : Math.random()) * 540, s: (this.game.rnd ? this.game.rnd() : Math.random()) });
    }
    if (this.drops.length > max) this.drops.length = max;
    for (const d of this.drops) {
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
    if (this.kind === 'snow') {
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
    }
    if (this.flash > 0 && !this.game.reduced) {
      ctx.fillStyle = `rgba(235,240,255,${0.08 * this.flash})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
}
