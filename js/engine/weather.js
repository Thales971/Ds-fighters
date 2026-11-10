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
    /* Sprites de clima (pixel art gerada em assets/weather/):
       flocos de neve, folhas pro vento e brasas pra onda de calor. */
    this.sprites = {};
    this._loadSprite('flakes', 'assets/weather/snowflakes.png', 28);
    this._loadSprite('leaf', 'assets/weather/leaf.png', 16);
    this._loadSprite('spark', 'assets/weather/spark.png', 8);
    this._chimeAt = 240;
  }
  _loadSprite(name, src, cell) {
    if (this.sprites[name]) return;
    try {
      const img = new Image();
      img.onload = () => { this.sprites[name] = { img, cell }; };
      img.src = src + '?v=v33-weather';
    } catch (e) { /* sem DOM (teste): clima cai no fallback vetorial */ }
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
    /* trilha ambiente por clima: sino cristalino na aurora, crepitar na onda
       de calor — bem baixinho, so pra dar presenca. */
    if (fighting && (this.kind === 'aurora' || this.kind === 'heatwave')) {
      this._chimeAt--;
      if (this._chimeAt <= 0) {
        this._chimeAt = 420 + (((this.game.rnd ? this.game.rnd() : Math.random()) * 380) | 0);
        if (this.kind === 'aurora') this.game.audio.play('magic', { vol: 0.10 });
        else this.game.audio.play('fire', { vol: 0.08 });
      }
    }
    this.updateParticles();
  }
  updateParticles() {
    const W = this.game.W;
    const reduced = this.game.reduced;
    const want = this.kind === 'rain' ? 150 : this.kind === 'storm' ? 240 : this.kind === 'snow' ? 140 : this.kind === 'wind' ? 34 : this.kind === 'aurora' ? 70 : this.kind === 'heatwave' ? 26 : this.kind === 'clear' ? 14 : 0;
    const max = Math.floor(want * this.intensity * (reduced ? 0.35 : 1));
    while (this.drops.length < max) {
      const r = this.game.rnd ? this.game.rnd() : Math.random();
      const y = this.kind === 'aurora' ? -330 + r * 130 : this.kind === 'heatwave' ? -40 - r * 55 : this.kind === 'clear' ? -300 + r * 300 : -540 + r * 540;
      const d = { x: (this.game.rnd ? this.game.rnd() : Math.random()) * (W + 200) - 100, y, s: (this.game.rnd ? this.game.rnd() : Math.random()) };
      /* NEVE: cada floco tem design (0-5 do atlas), rotacao, camada de
         profundidade (0 = fundo pequeno/lento, 2 = frente grande/rapido). */
      if (this.kind === 'snow') {
        d.design = ((this.game.rnd ? this.game.rnd() : Math.random()) * 6) | 0;
        d.rot = (this.game.rnd ? this.game.rnd() : Math.random()) * Math.PI * 2;
        d.rotV = ((this.game.rnd ? this.game.rnd() : Math.random()) - 0.5) * 0.04;
        d.layer = d.s < 0.4 ? 0 : d.s < 0.75 ? 1 : 2;
      }
      /* VENTO: parte das particulas sao FOLHAS girando. */
      if (this.kind === 'wind') {
        d.leaf = (this.game.rnd ? this.game.rnd() : Math.random()) < 0.45;
        d.rot = (this.game.rnd ? this.game.rnd() : Math.random()) * Math.PI * 2;
        d.rotV = 0.1 + (this.game.rnd ? this.game.rnd() : Math.random()) * 0.22;
      }
      /* ONDA DE CALOR: algumas sao EMBERS subindo. */
      if (this.kind === 'heatwave') d.ember = (this.game.rnd ? this.game.rnd() : Math.random()) < 0.4;
      this.drops.push(d);
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
        if (d.ember) {
          /* brasa: sobe tremendo e morre no alto */
          d.y -= reduced ? 0 : 0.8 + d.s * 0.9;
          d.x += (reduced ? 0 : Math.sin((this.t + d.s * 90) * 0.09) * 0.8) + this.wind * 0.3;
        } else {
          d.x += reduced ? 0 : this.wind * 0.15 + Math.sin((this.t + d.s * 50) * 0.03) * 0.35;
          d.y -= reduced ? 0 : 0.35 + d.s * 0.45;
        }
        if (d.y < -145) {
          d.y = -40 - (this.game.rnd ? this.game.rnd() : Math.random()) * 55;
          d.x = (this.game.rnd ? this.game.rnd() : Math.random()) * (W + 120) - 60;
        }
        continue;
      }
      if (this.kind === 'snow') {
        /* camadas de profundidade: fundo cai devagar, frente rapido */
        const spd = d.layer === 0 ? 0.55 : d.layer === 1 ? 1.1 : 1.9;
        d.y += spd + Math.sin((this.t + d.s * 100) * 0.05) * 0.25;
        d.x += this.wind * (0.7 + d.layer * 0.5) + Math.sin((this.t + d.s * 100) * 0.03) * (0.5 + d.layer * 0.25);
        d.rot += d.rotV;
      } else if (this.kind === 'wind') {
        d.x += (this.wind || 1) * (8 + d.s * 8);
        d.y += (d.leaf ? Math.sin((this.t + d.s * 60) * 0.08) * 1.6 : 0.3);
        d.rot += d.rotV * Math.sign(this.wind || 1);
      } else if (this.kind === 'clear') {
        d.y += 0.12 + d.s * 0.2;
        d.x += Math.sin((this.t + d.s * 50) * 0.01) * 0.3;
        if (d.y > 0) { d.y = -300 - (this.game.rnd ? this.game.rnd() : Math.random()) * 60; d.x = (this.game.rnd ? this.game.rnd() : Math.random()) * (W + 120) - 60; }
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
      /* AURORA: cortinas verticais com gradiente (verde -> teal -> roxo ->
         magenta), ondulando devagar, + estrelas piscando. */
      const W = this.game.W;
      const reduced = this.game.reduced;
      const bands = reduced ? 2 : 4;
      const tops = ['rgba(96,255,214,0.34)', 'rgba(80,225,255,0.30)', 'rgba(140,130,255,0.28)', 'rgba(228,120,255,0.24)'];
      const bots = ['rgba(30,120,110,0)', 'rgba(40,90,160,0)', 'rgba(80,60,160,0)', 'rgba(120,60,160,0)'];
      for (let i = 0; i < bands; i++) {
        for (let x = -20; x <= W + 40; x += 26) {
          const base = -320 + i * 24 + (reduced ? 0 : Math.sin((x + this.t * 1.6 + i * 70) * 0.011) * 14);
          const hgt = 130 + Math.sin((x * 0.02) + this.t * 0.01 + i) * 36;
          const g = ctx.createLinearGradient(0, base, 0, base + hgt);
          g.addColorStop(0, tops[i]);
          g.addColorStop(1, bots[i]);
          ctx.fillStyle = g;
          ctx.fillRect(x, base, 27, hgt);
        }
      }
      /* estrelas piscando */
      ctx.globalAlpha = 1;
      for (const d of this.drops) {
        const tw = 0.35 + 0.65 * Math.abs(Math.sin((this.t + d.s * 240) * 0.03));
        ctx.globalAlpha = tw;
        ctx.fillStyle = d.s > 0.5 ? '#c8fff2' : '#dcc9ff';
        ctx.fillRect(Math.round(d.x), Math.round(d.y), 2, 2);
      }
      ctx.globalAlpha = 1;
    } else if (this.kind === 'heatwave') {
      /* ONDA DE CALOR: linhas de miragem + BRASAS subindo com sprite. */
      ctx.strokeStyle = 'rgba(255,190,112,0.52)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const d of this.drops) {
        if (d.ember) continue;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + 9, d.y + (this.game.reduced ? 0 : Math.sin((this.t + d.x) * 0.08) * 3));
        ctx.lineTo(d.x + 18, d.y);
      }
      ctx.stroke();
      const spk = this.sprites.spark;
      for (const d of this.drops) {
        if (!d.ember) continue;
        if (spk && spk.img.width) {
          ctx.save();
          ctx.globalAlpha = 0.5 + d.s * 0.5;
          ctx.drawImage(spk.img, Math.round(d.x) - 4, Math.round(d.y) - 4, 8, 8);
          ctx.restore();
        } else {
          ctx.fillStyle = 'rgba(255,150,60,0.7)';
          ctx.fillRect(Math.round(d.x), Math.round(d.y), 2, 2);
        }
      }
    } else if (this.kind === 'snow') {
      /* NEVE: flocos SPRITE com rotacao e 3 camadas de profundidade;
         fundo pequeno/transparente, frente grande/nitido. */
      const sp = this.sprites.flakes;
      for (const d of this.drops) {
        const scale = d.layer === 0 ? 0.5 : d.layer === 1 ? 0.9 : 1.5;
        const alpha = d.layer === 0 ? 0.45 : d.layer === 1 ? 0.75 : 0.95;
        if (sp && sp.img.width) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(d.x, d.y);
          ctx.rotate(d.rot);
          ctx.drawImage(sp.img, d.design * sp.cell, 0, sp.cell, sp.cell, -sp.cell * scale / 2, -sp.cell * scale / 2, sp.cell * scale, sp.cell * scale);
          ctx.restore();
        } else {
          /* fallback vetorial (sem sprite carregado): floco em cruz */
          ctx.globalAlpha = Math.min(1, alpha + 0.1);
          ctx.fillStyle = '#f4faff';
          const sz = Math.max(2, Math.round(4 * scale));
          const x = Math.round(d.x), y = Math.round(d.y);
          ctx.fillRect(x - sz, y, sz * 2 + 1, 1);
          ctx.fillRect(x, y - sz, 1, sz * 2 + 1);
          ctx.globalAlpha = 1;
        }
      }
    } else if (this.kind === 'wind') {
      /* VENTO: rajadas em curva + FOLHAS girando no ar. */
      ctx.strokeStyle = 'rgba(230,245,255,0.30)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const d of this.drops) {
        if (d.leaf) continue;
        ctx.moveTo(d.x, d.y);
        const len = 30 + d.s * 40;
        const sgn = Math.sign(this.wind || 1);
        ctx.quadraticCurveTo(d.x - sgn * len * 0.5, d.y - 6, d.x - sgn * len, d.y);
      }
      ctx.stroke();
      const lf = this.sprites.leaf;
      for (const d of this.drops) {
        if (!d.leaf) continue;
        if (lf && lf.img.width) {
          ctx.save();
          ctx.globalAlpha = 0.85;
          ctx.translate(d.x, d.y);
          ctx.rotate(d.rot);
          ctx.drawImage(lf.img, -8, -8, 16, 16);
          ctx.restore();
        } else {
          ctx.fillStyle = 'rgba(140,180,90,0.7)';
          ctx.fillRect(Math.round(d.x), Math.round(d.y), 3, 2);
        }
      }
    } else if (this.kind === 'clear') {
      /* Ceu limpo: poeira dourada flutuando bem sutil. */
      ctx.fillStyle = 'rgba(255,240,200,0.30)';
      for (const d of this.drops) ctx.fillRect(Math.round(d.x), Math.round(d.y), 2, 2);
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
      /* frio azulado + neblina baixa no chao + vinheta gelada */
      ctx.fillStyle = 'rgba(200,230,255,0.10)';
      ctx.fillRect(0, 0, W, H);
      const fog = ctx.createLinearGradient(0, H * 0.72, 0, H);
      fog.addColorStop(0, 'rgba(225,240,255,0)');
      fog.addColorStop(1, 'rgba(228,242,255,0.16)');
      ctx.fillStyle = fog;
      ctx.fillRect(0, H * 0.72, W, H * 0.28);
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
