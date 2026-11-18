/* ============================================================
   DS FIGHTERS — Clima aleatório por mapa.
   kind: clear | rain | wind | storm | snow | aurora | heatwave | fireflies | leaves | hail | eclipse | rainbow
   - hail (granizo): pedras de gelo caem — dano de lasca ocasional em quem ficar parado
   - eclipse: escuridao — medidor +10%, ultimate carrega mais rapido
   - rainbow (arco-iris): depois da chuva, cura lenta pra TODOS (0.5 vida/s)
   - fireflies (vagalumes): noite magica — medidor +6%, brilho que guia
   - leaves (chuva de folhas): chao de folhas — dashes 10% mais longos
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
    this.intensityTarget = 0;
    this.drops = [];
    this.rings = []; /* aneis de impacto da chuva no chao */
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
    if (kind !== this.kind) this.drops = [];
    this.kind = kind;
    /* intensidade entra suave (lerp no update): chuva nao nasce do nada */
    this.intensityTarget = kind === 'storm' ? 1 : kind === 'clear' ? 0 : 0.6 + (this.game.rnd ? this.game.rnd() : Math.random()) * 0.4;
    this.windTarget = (kind === 'wind' || kind === 'storm') ? ((this.game.rnd ? this.game.rnd() : Math.random()) < 0.5 ? -1 : 1) * (1.2 + (this.game.rnd ? this.game.rnd() : Math.random()) * 1.4) : 0;
    if (kind !== 'wind' && kind !== 'storm') this.wind = 0;
    this.nextBolt = 240 + (((this.game.rnd ? this.game.rnd() : Math.random()) * 200) | 0);
    const a = this.game.audio;
    a.loop('rain_loop', kind === 'rain' || kind === 'storm', kind === 'storm' ? 0.5 : 0.32);
    const windy = kind === 'wind' || kind === 'storm' || kind === 'snow';
    const breeze = kind === 'fog' || kind === 'darkfog' || kind === 'hail' || kind === 'leaves';
    a.loop('wind_loop', windy || breeze, windy ? 0.3 : 0.15);
    /* som de entrada do clima */
    if (kind === 'hail') a.play('water', { vol: 0.22 });
    if (kind === 'eclipse') a.play('dragon', { vol: 0.16 });
    if (kind === 'rainbow') a.play('unlock', { vol: 0.2 });
    if (kind === 'fireflies') a.play('magic', { vol: 0.14 });
    if (kind === 'darkfog') a.play('dragon', { vol: 0.12 });
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
    /* transicao suave de intensidade (entra/sai devagar, como clima real) */
    this.intensity += (this.intensityTarget - this.intensity) * 0.04;
    if (Math.abs(this.intensityTarget - this.intensity) < 0.002) this.intensity = this.intensityTarget;
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
    /* GRANIZO: pedra ocasional machuca quem estiver no chao (lasca 2) */
    if (fighting && this.kind === 'hail') {
      this._hailAt = (this._hailAt || 300) - 1;
      if (this._hailAt <= 0) {
        this._hailAt = 260 + (((this.game.rnd ? this.game.rnd() : Math.random()) * 220) | 0);
        const alvo = this.game.fighters()[((this.game.rnd ? this.game.rnd() : Math.random()) * this.game.fighters().length) | 0];
        if (alvo && alvo.alive && Math.abs(alvo.y) < 20) {
          alvo.chip(2, null);
          this.game.floatText(alvo.x, alvo.y - 200, 'GRANIZO −2', '#bfe8ff');
          this.game.audio.play('water', { vol: 0.18 });
        }
      }
    }
    /* ARCO-IRIS: cura lenta pra todos */
    if (fighting && this.kind === 'rainbow') {
      this._rbAt = (this._rbAt || 120) - 1;
      if (this._rbAt <= 0) {
        this._rbAt = 120;
        for (const f of this.game.fighters()) {
          if (f.alive && f.hp < f.maxHp) f.hp = Math.min(f.maxHp, f.hp + 1);
        }
      }
    }
    /* sons ambiente dos climas novos */
    if (fighting && (this.kind === 'fireflies' || this.kind === 'leaves' || this.kind === 'aurora' || this.kind === 'heatwave' || this.kind === 'eclipse' || this.kind === 'darkfog' || this.kind === 'confetti' || this.kind === 'fireworks')) {
      this._chimeAt--;
      if (this._chimeAt <= 0) {
        this._chimeAt = 380 + (((this.game.rnd ? this.game.rnd() : Math.random()) * 380) | 0);
        if (this.kind === 'aurora') this.game.audio.play('magic', { vol: 0.10 });
        else if (this.kind === 'heatwave') this.game.audio.play('fire', { vol: 0.08 });
        else if (this.kind === 'fireflies') this.game.audio.play('magic', { vol: 0.07 });
        else if (this.kind === 'leaves') this.game.audio.play('whoosh', { vol: 0.06 });
        else if (this.kind === 'eclipse' || this.kind === 'darkfog') this.game.audio.play('dragon', { vol: 0.06 });
        else if (this.kind === 'confetti') this.game.audio.play('whoosh', { vol: 0.05 });
        else if (this.kind === 'fireworks') this.game.audio.play('explosion', { vol: 0.07 });
      }
    }
    this.updateParticles();
  }
  updateParticles() {
    /* aneis de impacto: expandem e apagam sozinhos */
    if (this.rings.length) {
      for (const rg of this.rings) { rg.r += 1.7; rg.life--; }
      this.rings = this.rings.filter((rg) => rg.life > 0);
    }
    const W = this.game.W;
    const reduced = this.game.reduced;
    const want = this.kind === 'rain' ? 110 : this.kind === 'storm' ? 150 : this.kind === 'snow' ? 120 : this.kind === 'wind' ? 28 : this.kind === 'aurora' ? 48 : this.kind === 'heatwave' ? 22 : this.kind === 'fog' ? 10 : this.kind === 'darkfog' ? 12 : this.kind === 'fireflies' ? 24 : this.kind === 'leaves' ? 34 : this.kind === 'confetti' ? 40 : this.kind === 'fireworks' ? 18 : this.kind === 'hail' ? 32 : this.kind === 'eclipse' ? 14 : this.kind === 'rainbow' ? 0 : this.kind === 'clear' ? 10 : 0;
    const max = Math.floor(want * this.intensity * (reduced ? 0.35 : 1) * (this.game.qWeather || 1)); /* qualidade baixa/alta muda a densidade do clima */
    while (this.drops.length < max) {
      const r = this.game.rnd ? this.game.rnd() : Math.random();
      const y = this.kind === 'aurora' ? -445 + r * 150 : this.kind === 'heatwave' ? -40 - r * 55 : this.kind === 'clear' ? -300 + r * 300 : this.kind === 'fireflies' ? -210 - r * 190 : this.kind === 'leaves' || this.kind === 'confetti' ? -30 - r * 380 : this.kind === 'fireworks' ? -200 - r * 240 : this.kind === 'rainbow' ? -200 - r * 200 : -540 - r * 60;
      const roll = this.game.rnd ? this.game.rnd() : Math.random();
      const d = { x: roll * (W + 200) - 100, y, s: (this.game.rnd ? this.game.rnd() : Math.random()), ph: roll * 6.28, rot: roll * 6.28, rotV: 0.05 + roll * 0.08 };
      /* NEVE: cada floco tem design (0-5 do atlas), rotacao, camada de
         profundidade (0 = fundo pequeno/lento, 2 = frente grande/rapido). */
      if (this.kind === 'snow') {
        d.design = ((this.game.rnd ? this.game.rnd() : Math.random()) * 6) | 0;
        d.rot = (this.game.rnd ? this.game.rnd() : Math.random()) * Math.PI * 2;
        d.rotV = ((this.game.rnd ? this.game.rnd() : Math.random()) - 0.5) * 0.04;
        d.layer = d.s < 0.4 ? 0 : d.s < 0.75 ? 1 : 2;
      }
      if (this.kind === 'confetti' || this.kind === 'fireworks') {
        d.design = ((this.game.rnd ? this.game.rnd() : Math.random()) * 5) | 0;
        d.rotV = 0.06 + roll * 0.12;
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
      if (this.kind === 'fireflies') {
        /* VAGALUMES: flutuam em onda, piscam, perseguem de leve o vento */
        d.ph += 0.05 + d.s * 0.06;
        d.x += Math.sin(d.ph) * 0.8 + this.wind * 0.4;
        d.y += Math.cos(d.ph * 0.7) * 0.6;
        if (d.x > W + 40) d.x = -40;
        if (d.x < -40) d.x = W + 40;
        if (d.y > -190) d.y = -360;
        if (d.y < -420) d.y = -220;
        continue;
      }
      if (this.kind === 'hail') {
        /* GRANIZO: cai rapido e reto, quica no chao */
        d.y += 7 + d.s * 3;
        d.x += this.wind * 0.8;
        if (d.y > 30) { d.y = -560 - Math.random() * 40; d.x = Math.random() * W; }
        continue;
      }
      if (this.kind === 'rainbow') {
        /* ARCO-IRIS: fitas de luz subindo devagar */
        d.y -= 0.35 + d.s * 0.3;
        d.x += Math.sin((this.t + d.x) * 0.01) * 0.3;
        if (d.y < -320) { d.y = 30; d.x = Math.random() * W; }
        continue;
      }
      if (this.kind === 'leaves' || this.kind === 'confetti') {
        /* FOLHAS e CONFETE: caem girando. Confete não altera o dash. */
        d.ph += 0.04 + d.s * 0.05;
        d.x += Math.sin(d.ph) * 1.4 + this.wind * 1.6;
        d.y += 1.1 + d.s * 0.8;
        if (d.y > 40) { d.y = -320 - Math.random() * 60; d.x = Math.random() * W; }
        if (d.x > W + 30) d.x = -30;
        if (d.x < -30) d.x = W + 30;
        continue;
      }
      if (this.kind === 'fireworks') {
        /* FOGOS: faíscas só no céu, acima dos lutadores. */
        d.ph += 0.09;
        d.y -= 0.4 + d.s * 0.35;
        d.x += Math.sin(d.ph) * 0.7;
        if (d.y < -500) { d.y = -170 - Math.random() * 50; d.x = Math.random() * W; }
        continue;
      }
      if (this.kind === 'aurora') {
        d.x += reduced ? 0 : 0.35 + d.s * 0.7;
        d.y = -440 + d.s * 130 + (reduced ? 0 : Math.sin((this.t + d.x) * 0.015) * 4);
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
      if (this.kind === 'darkfog') {
        /* NEBLINA SOMBRIA: só na faixa baixa, atrás dos pés, sem cobrir a cabeça. */
        d.x += (this.wind || 0.4) * (0.12 + d.s * 0.16);
        d.y = -22 - d.s * 36 + Math.sin((this.t + d.s * 200) * 0.006) * 6;
        if (d.x > W + 240) d.x = -240;
        if (d.x < -240) d.x = W + 200;
        continue;
      }
      if (this.kind === 'fog') {
        /* NEBLINA: bancos grandes e macios derivando devagar — cobre um pouco
           a visao no meio da tela de proposito (clima denso). */
        d.x += (this.wind || 0.4) * (0.14 + d.s * 0.22);
        d.y = -80 - d.s * 120 + Math.sin((this.t + d.s * 200) * 0.006) * 26;
        if (d.x > W + 240) d.x = -240;
        if (d.x < -240) d.x = W + 200;
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
        /* gota bateu no chao: anel de ondinha expandindo (proporcional a intensidade da chuva) */
        const qw = this.game.qWeather || 1;
        if ((this.kind === 'rain' || this.kind === 'storm') && (this.game.rnd ? this.game.rnd() : Math.random()) < Math.min(0.9, 0.3 * this.intensity * qw) && this.rings.length < Math.round((reduced ? 24 : 60) * qw)) {
          this.rings.push({ x: d.x, r: 2, life: 20, max: 20 });
        }
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
      /* AURORA BOREAL v2: cortinas em CAMADAS pendendo do topo do ceu.
         Cada cortina = caminho com borda inferior dupla-ondulada + gradiente
         vertical no padrao da aurora real (roxo em cima -> teal no meio ->
         VERDE BRILHANTE na borda inferior) + dezenas de raios verticais
         cintilando (intensidade varia no espaco e no tempo) + linha luminosa
         na borda. Composite 'lighter' soma tudo como luz. */
      const W = this.game.W;
      const reduced = this.game.reduced;
      const t = this.t;
      /* [top sumindo, meio, borda brilhante, base do raio, linha da borda] */
      const COL = [
        ['rgba(150,90,255,0.10)', 'rgba(60,235,190,0.22)', 'rgba(110,255,160,0.50)', 'rgba(225,255,240,0.95)', 'rgba(200,255,225,0.62)'],
        ['rgba(90,140,255,0.10)', 'rgba(60,215,255,0.22)', 'rgba(100,240,255,0.42)', 'rgba(215,250,255,0.95)', 'rgba(180,246,255,0.55)'],
        ['rgba(160,80,255,0.12)', 'rgba(120,120,255,0.20)', 'rgba(150,160,255,0.36)', 'rgba(235,225,255,0.95)', 'rgba(214,196,255,0.46)'],
        ['rgba(255,90,180,0.08)', 'rgba(200,110,255,0.16)', 'rgba(235,130,255,0.30)', 'rgba(255,225,250,0.95)', 'rgba(255,195,246,0.38)'],
      ];
      const defs = reduced
        ? [{ top: -560, hgt: 210, hue: 0, ph: 0.0 }, { top: -530, hgt: 300, hue: 2, ph: 3.4 }]
        : [
            { top: -560, hgt: 200, hue: 0, ph: 0.0 },
            { top: -548, hgt: 255, hue: 1, ph: 1.7 },
            { top: -536, hgt: 305, hue: 2, ph: 3.4 },
            { top: -522, hgt: 235, hue: 1, ph: 5.1 },
            { top: -508, hgt: 175, hue: 3, ph: 6.3 },
          ];
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const c of defs) {
        const col = COL[c.hue];
        const sway = t * (0.35 + (c.ph % 1) * 0.22);
        const edgeY = (x) => c.top + c.hgt + Math.sin(x * 0.013 - sway * 1.4 + c.ph * 2) * 34 + Math.sin(x * 0.031 + sway * 2.2 + c.ph) * 13;
        /* corpo da cortina: topo reto (fora da tela), base dupla-ondulada */
        ctx.beginPath();
        ctx.moveTo(-40, c.top - 14);
        for (let x = -40; x <= W + 40; x += 20) ctx.lineTo(x, c.top + Math.sin(x * 0.010 + sway + c.ph) * 10);
        for (let x = W + 40; x >= -40; x -= 20) ctx.lineTo(x, edgeY(x));
        ctx.closePath();
        const g = ctx.createLinearGradient(0, c.top - 14, 0, c.top + c.hgt + 55);
        g.addColorStop(0, col[0]);
        g.addColorStop(0.55, col[1]);
        g.addColorStop(0.92, col[2]);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fill();
        /* borda inferior luminosa e nitida (a parte mais viva da aurora) */
        ctx.beginPath();
        for (let x = -40; x <= W + 40; x += 20) { const by = edgeY(x); if (x === -40) ctx.moveTo(x, by); else ctx.lineTo(x, by); }
        ctx.strokeStyle = col[4];
        ctx.lineWidth = 2.6;
        ctx.stroke();
        /* raios verticais cintilando dentro da cortina */
        const nRays = reduced ? 16 : 56;
        for (let i = 0; i < nRays; i++) {
          const x = -20 + (i / nRays) * (W + 40) + Math.sin(i * 12.9898) * 18;
          const tw = 0.5 + 0.5 * Math.sin(x * 0.05 + t * (0.8 + (i % 5) * 0.23) + c.ph * 3 + i);
          if (tw < 0.25) continue;
          const ry = c.top + Math.sin(x * 0.010 + sway + c.ph) * 10;
          const rl = c.hgt * (0.35 + 0.55 * tw);
          const rg = ctx.createLinearGradient(0, ry, 0, ry + rl);
          rg.addColorStop(0, col[3]);
          rg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.globalAlpha = 0.14 + 0.42 * tw;
          ctx.fillStyle = rg;
          ctx.fillRect(x, ry, 4 + 4 * tw, rl);
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      /* estrelas piscando (as maiores fazem um brilinho em cruz) */
      ctx.globalAlpha = 1;
      for (const d of this.drops) {
        const tw = 0.5 + 0.5 * Math.abs(Math.sin((this.t + d.s * 240) * 0.03));
        ctx.globalAlpha = tw;
        ctx.fillStyle = d.s > 0.5 ? '#d8fff5' : '#e6d9ff';
        const s = d.s > 0.82 ? 3 : 2;
        ctx.fillRect(Math.round(d.x), Math.round(d.y), s, s);
        if (d.s > 0.82 && tw > 0.8) {
          ctx.fillRect(Math.round(d.x) - 2, Math.round(d.y), s + 4, 1);
          ctx.fillRect(Math.round(d.x), Math.round(d.y) - 2, 1, s + 4);
        }
      }
      ctx.globalAlpha = 1;
    } else if (this.kind === 'heatwave') {
      /* ONDA DE CALOR: linhas de miragem + BRASAS subindo com sprite. */
      ctx.strokeStyle = 'rgba(255,190,112,0.38)';
      ctx.lineWidth = 1.4;
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
    } else if (this.kind === 'fog') {
      /* NEBLINA: bancos macios em 2 camadas (blob radial em cache). O blur
         de tela vem da classe .fogged no canvas (CSS). */
      if (!this._fogBlob) {
        const c = document.createElement('canvas');
        c.width = 260; c.height = 160;
        const x = c.getContext('2d');
        const g = x.createRadialGradient(130, 80, 10, 130, 80, 128);
        g.addColorStop(0, 'rgba(215,225,238,0.34)');
        g.addColorStop(0.6, 'rgba(205,218,232,0.16)');
        g.addColorStop(1, 'rgba(200,212,226,0)');
        x.fillStyle = g;
        x.fillRect(0, 0, 260, 160);
        this._fogBlob = c;
      }
      for (const d of this.drops) {
        const sc = d.s < 0.5 ? 2.2 : 3.4;
        ctx.globalAlpha = d.s < 0.5 ? 0.38 : 0.55;
        ctx.drawImage(this._fogBlob, d.x - 130 * sc / 2, d.y - 80 * sc / 2, 260 * sc / 2, 160 * sc / 2);
      }
      ctx.globalAlpha = 1;
    } else if (this.kind === 'darkfog') {
      if (!this._darkFog) {
        const c = document.createElement('canvas');
        c.width = 260; c.height = 160;
        const x = c.getContext('2d');
        const g = x.createRadialGradient(130, 80, 8, 130, 80, 120);
        g.addColorStop(0, 'rgba(120,70,160,0.28)');
        g.addColorStop(0.6, 'rgba(90,40,120,0.12)');
        g.addColorStop(1, 'rgba(40,10,60,0)');
        x.fillStyle = g;
        x.fillRect(0, 0, 260, 160);
        this._darkFog = c;
      }
      for (const d of this.drops) {
        if (d.y < -90) continue;
        const sc = d.s < 0.5 ? 2.1 : 2.8;
        ctx.globalAlpha = d.s < 0.5 ? 0.18 : 0.28;
        ctx.drawImage(this._darkFog, d.x - 130 * sc / 2, d.y - 80 * sc / 2, 260 * sc / 2, 160 * sc / 2);
      }
      ctx.globalAlpha = 1;
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
          /* fallback vetorial (sem sprite): floco macio com gradiente radial (cache) */
          if (!this._flakeBlob) {
            const c = document.createElement('canvas');
            c.width = 32; c.height = 32;
            const x = c.getContext('2d');
            const g = x.createRadialGradient(16, 16, 1, 16, 16, 15);
            g.addColorStop(0, 'rgba(255,255,255,0.95)');
            g.addColorStop(0.45, 'rgba(238,246,255,0.55)');
            g.addColorStop(1, 'rgba(230,242,255,0)');
            x.fillStyle = g;
            x.fillRect(0, 0, 32, 32);
            this._flakeBlob = c;
          }
          const sz = Math.max(6, Math.round(16 * scale));
          ctx.globalAlpha = Math.min(1, alpha + 0.1);
          ctx.drawImage(this._flakeBlob, Math.round(d.x) - sz / 2, Math.round(d.y) - sz / 2, sz, sz);
          ctx.globalAlpha = 1;
        }
      }
    } else if (this.kind === 'wind') {
      /* VENTO: rajadas em curva + FOLHAS girando no ar. */
      ctx.strokeStyle = 'rgba(230,245,255,0.5)';
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
    } else if (this.kind === 'fireflies') {
      const blink = [0, 1, 2, 3, 2, 1];
      for (const d of this.drops) {
        const f = blink[Math.floor(this.t * 0.12 + d.ph * 3) % blink.length];
        const sc = d.s > 0.84 ? 2 : 1;
        Art.cell(ctx, 'fx2:firefly', 1, 0, d.x, d.y, { scale: sc, add: true, alpha: 0.85 });
        Art.cell(ctx, 'fx2:firefly', 0, f, d.x, d.y, { scale: sc });
      }
    } else if (this.kind === 'hail') {
      const sp = this.sprites.flakes;
      for (const d of this.drops) {
        const sc = 0.42 + d.s * 0.28;
        if (sp && sp.img.width) {
          ctx.save();
          ctx.globalAlpha = 0.92;
          ctx.translate(d.x, d.y);
          ctx.rotate(d.rot || 0);
          ctx.drawImage(sp.img, 4 * sp.cell, 0, sp.cell, sp.cell, -9 * sc, -9 * sc, 18 * sc, 18 * sc);
          ctx.restore();
        } else {
          if (!this._hailBlob) {
            const c = document.createElement('canvas');
            c.width = 24; c.height = 24;
            const x = c.getContext('2d');
            const g = x.createRadialGradient(9, 9, 1, 12, 12, 11);
            g.addColorStop(0, 'rgba(255,255,255,0.98)');
            g.addColorStop(0.55, 'rgba(214,234,252,0.85)');
            g.addColorStop(1, 'rgba(170,200,235,0.1)');
            x.fillStyle = g;
            x.beginPath(); x.arc(12, 12, 11, 0, 6.3); x.fill();
            this._hailBlob = c;
          }
          const sz = 10 + 8 * (0.42 + d.s * 0.28);
          ctx.globalAlpha = 0.92;
          ctx.drawImage(this._hailBlob, Math.round(d.x) - sz / 2, Math.round(d.y) - sz / 2, sz, sz);
          ctx.globalAlpha = 1;
        }
      }
    } else if (this.kind === 'leaves') {
      const lf = this.sprites.leaf;
      for (const d of this.drops) {
        const sc = 16 + d.s * 10;
        if (lf && lf.img.width) {
          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.rotate(d.ph || 0);
          ctx.drawImage(lf.img, -sc / 2, -sc / 2, sc, sc);
          ctx.restore();
        } else {
          ctx.fillStyle = '#7dae4a';
          ctx.fillRect(Math.round(d.x), Math.round(d.y), 4, 3);
        }
      }
    } else if (this.kind === 'eclipse') {
      for (const d of this.drops) {
        const tw = 0.25 + 0.75 * Math.abs(Math.sin((this.t + d.s * 90) * 0.03));
        ctx.globalAlpha = tw;
        ctx.fillStyle = '#e4e0ff';
        ctx.fillRect(Math.round(d.x), Math.round(d.y), 2, 2);
      }
      ctx.globalAlpha = 1;
    } else if (this.kind === 'rainbow') {
      /* o arco fica no overlay, longe dos lutadores */
    } else if (this.kind === 'confetti') {
      const cols = ['#ffd23a', '#ff4f8b', '#7ec8ff', '#7dff6a', '#fff'];
      for (const d of this.drops) {
        ctx.save();
        ctx.translate(Math.round(d.x), Math.round(d.y));
        ctx.rotate(d.ph || 0);
        ctx.fillStyle = cols[(d.design || 0) % cols.length];
        ctx.fillRect(-3, -1, 6, 2);
        ctx.restore();
      }
    } else if (this.kind === 'fireworks') {
      const cols = ['#ffe27a', '#ff4f8b', '#7ec8ff', '#fff', '#ff9a3c'];
      for (const d of this.drops) {
        const x = Math.round(d.x);
        const y = Math.round(d.y);
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = cols[(d.design || 0) % cols.length];
        ctx.fillRect(x, y, 2, 2);
        if (Math.sin((d.ph || 0) * 2) > 0) {
          ctx.fillRect(x - 4, y, 2, 2);
          ctx.fillRect(x + 4, y, 2, 2);
          ctx.fillRect(x, y - 4, 2, 2);
          ctx.fillRect(x, y + 4, 2, 2);
        }
      }
      ctx.globalAlpha = 1;
    } else {
      /* CHUVA/TEMPESTADE em 2 passagens: trilha larga e transparente + nucleo claro
         brilhante na cabeca da gota (parece vidro molhado, nao linha chapada). */
      const storm = this.kind === 'storm';
      const head = storm ? 'rgba(228,240,255,0.9)' : 'rgba(205,228,255,0.75)';
      const trail = storm ? 'rgba(170,200,255,0.20)' : 'rgba(160,195,255,0.16)';
      for (const d of this.drops) {
        const len = 12 + d.s * 8;
        // trilha (larga, sumindo pra tras)
        ctx.strokeStyle = trail;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(d.x - this.wind * 3, d.y - len);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();
        // nucleo claro
        ctx.strokeStyle = head;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(d.x - this.wind * 1.4, d.y - len * 0.55);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();
        // cabeca brilhante (2px)
        ctx.fillStyle = head;
        ctx.fillRect(Math.round(d.x) - 1, Math.round(d.y) - 1, 2, 2);
      }
      /* aneis de impacto no chao (elipse achatada = perspectiva) + splashzinho, alpha decai com a vida */
      if (this.rings.length) {
        for (const rg of this.rings) {
          const a = rg.life / rg.max;
          ctx.strokeStyle = 'rgba(196,224,255,' + (a * 0.65).toFixed(3) + ')';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(rg.x, 2.5, rg.r, rg.r * 0.32, 0, 0, 6.3);
          ctx.stroke();
          if (rg.r > 6) {
            ctx.strokeStyle = 'rgba(220,238,255,' + (a * 0.4).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(rg.x, 2.5, rg.r * 0.55, rg.r * 0.18, 0, 0, 6.3);
            ctx.stroke();
          }
        }
      }
    }
    ctx.restore();
  }
  drawOverlay(ctx, W, H) {
    if (this.kind === 'rain' || this.kind === 'storm') {
      ctx.fillStyle = this.kind === 'storm' ? 'rgba(10,20,50,0.16)' : 'rgba(20,40,70,0.1)';
      ctx.fillRect(0, 0, W, H);
    } else if (this.kind === 'fog') {
      ctx.fillStyle = 'rgba(206,216,228,0.13)';
      ctx.fillRect(0, 0, W, H);
    } else if (this.kind === 'darkfog') {
      /* só o chão e o fundo. O centro, onde estão os lutadores, fica limpo. */
      const fog = ctx.createLinearGradient(0, H * 0.78, 0, H);
      fog.addColorStop(0, 'rgba(80,36,120,0)');
      fog.addColorStop(1, 'rgba(72,28,110,0.16)');
      ctx.fillStyle = fog;
      ctx.fillRect(0, H * 0.78, W, H * 0.22);
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
      /* brilho ambiente do ceu inteiro em 'lighter' (reforca as cortinas) */
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const glow = ctx.createLinearGradient(0, 0, 0, H * 0.62);
      glow.addColorStop(0, 'rgba(80,255,210,0.11)');
      glow.addColorStop(0.5, 'rgba(140,110,255,0.09)');
      glow.addColorStop(1, 'rgba(20,25,70,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H * 0.62);
      ctx.restore();
    } else if (this.kind === 'heatwave') {
      /* shimmer: faixas verticais quentes que sobem ondulando (nao mais retangulo chapado) */
      const bands = this.game.reduced ? 3 : 6;
      for (let i = 0; i < bands; i++) {
        const bx = (((this.t * 0.9 + i * (W / bands)) % (W + 200)) - 100) + Math.sin(this.t * 0.02 + i * 2.1) * 18;
        const g = ctx.createLinearGradient(bx - 70, 0, bx + 70, 0);
        g.addColorStop(0, 'rgba(255,150,70,0)');
        g.addColorStop(0.5, 'rgba(255,165,85,0.10)');
        g.addColorStop(1, 'rgba(255,150,70,0)');
        ctx.fillStyle = g;
        ctx.fillRect(bx - 70, H * 0.42, 140, H * 0.58);
      }
      /* brilho quente subindo do horizonte */
      const hz = ctx.createLinearGradient(0, H * 0.55, 0, H);
      hz.addColorStop(0, 'rgba(255,150,70,0)');
      hz.addColorStop(1, 'rgba(255,150,70,0.09)');
      ctx.fillStyle = hz;
      ctx.fillRect(0, H * 0.55, W, H * 0.45);
    } else if (this.kind === 'fireflies') {
      /* noite dos vagalumes: vinheta azul escura */
      const night = ctx.createLinearGradient(0, 0, 0, H);
      night.addColorStop(0, 'rgba(8,12,36,0.30)');
      night.addColorStop(0.45, 'rgba(8,12,36,0.16)');
      night.addColorStop(1, 'rgba(8,12,36,0.07)');
      ctx.fillStyle = night;
      ctx.fillRect(0, 0, W, H);
    } else if (this.kind === 'leaves') {
      /* tapete de folhas no chao */
      ctx.fillStyle = 'rgba(190,120,50,0.10)';
      ctx.fillRect(0, H * 0.86, W, H * 0.14);
    } else if (this.kind === 'eclipse') {
      /* ECLIPSE SOLAR: disco escuro da lua no alto do ceu tapando o sol, com
         coroa dourada brilhando ao redor (brilho radial + raios + anel de
         fogo), alem de leve escuridao nas bordas. */
      const ex = W * 0.5, ey = H * 0.24;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const corona = ctx.createRadialGradient(ex, ey, 18, ex, ey, 130);
      corona.addColorStop(0, 'rgba(255,246,220,0.80)');
      corona.addColorStop(0.22, 'rgba(255,216,140,0.34)');
      corona.addColorStop(0.55, 'rgba(255,190,110,0.10)');
      corona.addColorStop(1, 'rgba(255,180,100,0)');
      ctx.fillStyle = corona;
      ctx.fillRect(ex - 130, ey - 130, 260, 260);
      if (!this.game.reduced) {
        /* raios da coroa girando devagar */
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2 + this.t * 0.005;
          const len = 44 + 30 * Math.abs(Math.sin(i * 2.7 + this.t * 0.012));
          ctx.strokeStyle = 'rgba(255,232,180,0.16)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ex + Math.cos(a) * 32, ey + Math.sin(a) * 32);
          ctx.lineTo(ex + Math.cos(a) * (32 + len), ey + Math.sin(a) * (32 + len));
          ctx.stroke();
        }
      }
      ctx.restore();
      /* disco escuro da lua + anel de fogo na borda */
      ctx.fillStyle = 'rgba(9,9,22,0.95)';
      ctx.beginPath(); ctx.arc(ex, ey, 30, 0, 6.3); ctx.fill();
      ctx.strokeStyle = 'rgba(255,238,196,0.95)';
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(ex, ey, 31.6, 0, 6.3); ctx.stroke();
      /* leve escuridao nas bordas (sombra do eclipse) */
      const dark = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.32, W / 2, H * 0.5, H * 0.9);
      dark.addColorStop(0, 'rgba(10,8,30,0)');
      dark.addColorStop(1, 'rgba(10,8,30,0.18)');
      ctx.fillStyle = dark;
      ctx.fillRect(0, 0, W, H);
    } else if (this.kind === 'rainbow') {
      /* ARCO-IRIS: arcos concentricos centrados abaixo do horizonte com 2
         passagens por faixa (halo largo e fraco + nucleo) em 'lighter', leve
         "respiracao" no raio, + arco secundario fraco de cores invertidas.
         Fica so no ceu (clip). */
      const cx = W * 0.5 + Math.sin(this.t * 0.004) * 30;
      const cy = H * 1.08;
      const breathe = 1 + Math.sin(this.t * 0.008) * 0.012;
      const R = H * 1.02 * breathe;
      const bands = [
        ['rgba(255,70,70,0.22)', 0], ['rgba(255,170,50,0.22)', 8], ['rgba(255,236,80,0.20)', 16],
        ['rgba(90,220,110,0.20)', 24], ['rgba(90,170,255,0.20)', 32], ['rgba(180,110,255,0.20)', 40],
      ];
      ctx.save();
      if (ctx.clip) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H * 0.8); ctx.lineTo(0, H * 0.8); ctx.closePath(); ctx.clip(); }
      ctx.globalCompositeOperation = 'lighter';
      for (const [col, off] of bands) {
        /* halo largo e fraco: suaviza a borda dura do arco */
        ctx.strokeStyle = col;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(cx, cy, R - off, Math.PI, 2 * Math.PI);
        ctx.stroke();
        /* nucleo da faixa */
        ctx.globalAlpha = 1;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(cx, cy, R - off, Math.PI, 2 * Math.PI);
        ctx.stroke();
      }
      /* arco secundario: mais fraco, raio maior, cores invertidas */
      ctx.globalAlpha = 0.42;
      for (let i = 0; i < bands.length; i++) {
        ctx.strokeStyle = bands[bands.length - 1 - i][0];
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.arc(cx, cy, R + 34 + bands[i][1], Math.PI, 2 * Math.PI);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    if (this.flash > 0 && !this.game.reduced) {
      ctx.fillStyle = `rgba(235,240,255,${0.08 * this.flash})`;
      ctx.fillRect(0, 0, W, H);
      /* RAIO: polilinha quebrada do ceu ate o chao, so durante o flash */
      if (!this._bolt || this._boltFlash !== this.flash) {
        this._boltFlash = this.flash;
        const bx = W * (0.15 + 0.7 * (this.game.rnd ? this.game.rnd() : Math.random()));
        const pts = [[bx, -10]];
        let px = bx, py = -10;
        const segs = 7;
        for (let k = 1; k <= segs; k++) {
          py = (H + 20) * k / segs;
          px = bx + ((this.game.rnd ? this.game.rnd() : Math.random()) - 0.5) * 90 * (k / segs);
          pts.push([px, py]);
        }
        this._bolt = pts;
      }
      if (this._bolt) {
        const a = Math.min(1, this.flash / 4);
        ctx.save();
        ctx.globalAlpha = a * 0.28;
        ctx.strokeStyle = '#cfe4ff';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(this._bolt[0][0], this._bolt[0][1]);
        for (const [px, py] of this._bolt) ctx.lineTo(px, py);
        ctx.stroke();
        ctx.globalAlpha = a;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(this._bolt[0][0], this._bolt[0][1]);
        for (const [px, py] of this._bolt) ctx.lineTo(px, py);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}
