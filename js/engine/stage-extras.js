/* ============================================================
   DS FIGHTERS — Palcos mais vivos + ESPECIAIS DE EVENTO (nov/2026).
   So visual (nao mexe em hitbox, rede ou dano).

   drawLife (TODOS os mapas):
     - sombras de nuvem atravessando o chao (mapas abertos)
     - brilho que varre o piso de tempos em tempos
     (as camadas de fundo tambem oscilam devagar: drift em stage.js drawBack)

   drawEventBack / drawEventFront (mapas de evento; na semana do evento, uma
   versao leve em QUALQUER mapa):
     natal     varal de luzinhas, neve grande girando, treno do Papai Noel
     halloween revoada de morcegos, fantasmas, bruxa cruzando a lua
     carnaval  serpentinas caindo
     pascoa    borboletas e coelho pulando no fundo
     junina    bandeirinhas balancando, baloes subindo, fagulhas
     criancas  baloes coloridos e bolhas de sabao
     anonovo   fogos de artificio de verdade (estouro em particulas)
   eventKO: no K.O. o mapa de evento solta uma chuva tematica.
   Tudo some no movimento reduzido / qualidade baixa / perf nivel 2.
   ============================================================ */
(() => {
  if (typeof StageRenderer === 'undefined') return;
  const P = StageRenderer.prototype;

  /* emoji -> sprite em canvas (fillText de emoji a cada frame e caro) */
  const EMO = {};
  function emo(ch, size) {
    const key = ch + '|' + size;
    if (EMO[key] !== undefined) return EMO[key];
    EMO[key] = null;
    try {
      if (typeof document === 'undefined') return null;
      const c = document.createElement('canvas');
      c.width = c.height = Math.ceil(size * 1.4);
      const x = c.getContext('2d');
      if (!x || !x.fillText) return null;
      x.font = size + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(ch, c.width / 2, c.height / 2);
      EMO[key] = c;
    } catch (e) { /* sem canvas */ }
    return EMO[key];
  }
  function drawEmo(ctx, ch, size, x, y, alpha, rot, flip) {
    const s = emo(ch, size);
    if (!s) return;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(s, -s.width / 2, -s.height / 2);
    ctx.restore();
  }

  /* vida dos mapas: some ja no perf 1 (celular fraco) */
  P._fxOff = function () {
    return this.reducedFlag || this.perfVignetteOff || (this.game && this.game.qFxOn === false) || (this.game && this.game.photo);
  };
  /* especiais de evento: so somem no perf 2 / movimento reduzido (o celular
     comeca no perf 1 e precisa ver o evento) */
  P._evOff = function () {
    return this.reducedFlag || this.perfVignetteOff || (this.game && this.game.photo);
  };

  /* ---------------- vida em todos os mapas ---------------- */
  const INDOOR = /lab|salao|loja|cafe|mansao|fabrica|datacenter|underwater|abismo|biblioteca|dojo|ginasio|quadra|escritorio|server|caverna|cave|catedral|metro|subsolo|arcade/;
  P.drawLife = function (ctx) {
    if (this._fxOff() || !ctx.createRadialGradient) return;
    const d = this.def || {};
    if (d.life === false) return;
    const W = this.W, H = this.H, gy = this.groundY, t = this.t;
    if (this._indoor == null) this._indoor = INDOOR.test(String(d.id || '') + ' ' + String(d.name || '').toLowerCase());
    ctx.save();
    /* sombras de nuvem: 2 manchas largas e suaves andando com o vento */
    if (!this._indoor) {
      if (!this._cloudShadow && typeof document !== 'undefined') {
        try {
          const c = document.createElement('canvas');
          c.width = 256; c.height = 64;
          const x = c.getContext('2d');
          const g = x.createRadialGradient(128, 32, 4, 128, 32, 128);
          g.addColorStop(0, 'rgba(0,0,0,0.16)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          x.fillStyle = g;
          x.fillRect(0, 0, 256, 64);
          this._cloudShadow = c;
        } catch (e) { this._cloudShadow = false; }
      }
      if (this._cloudShadow) {
        const wind = 0.35 + Math.abs(this._wind || 0) * 0.6;
        for (let i = 0; i < 2; i++) {
          const span = W + 700;
          const x = ((t * wind * (0.8 + i * 0.35) + i * 530) % span) - 350;
          ctx.drawImage(this._cloudShadow, x, gy - 40 + i * 18, 520 - i * 120, 90);
        }
      }
    }
    /* brilho que varre o piso a cada ~9s */
    const cyc = t % 540;
    if (cyc < 120) {
      const k = cyc / 120;
      const sx = -200 + k * (W + 400);
      const g = ctx.createLinearGradient(sx - 90, 0, sx + 90, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, 'rgba(255,248,220,0.07)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.fillRect(sx - 90, gy - 4, 180, H - gy + 4);
    }
    ctx.restore();
  };

  /* ---------------- especiais de evento ---------------- */
  P._eventInfo = function () {
    if (this._evInfo !== undefined) return this._evInfo;
    const d = this.def || {};
    let id = d.event || null, light = false;
    if (!id && typeof Events !== 'undefined' && Events.active) {
      try { const a = Events.active(); if (a) { id = a.id; light = true; } } catch (e) { /* sem calendario */ }
    }
    this._evInfo = id ? { id, light } : null;
    return this._evInfo;
  };

  const LIGHT_COLS = ['#ff3b30', '#ffd24a', '#2ec85a', '#3a8bff', '#ffffff', '#ff9a1a'];
  const FLAG_COLS = ['#ff3b30', '#ffd400', '#3a8bff', '#19b35a', '#ff9a1a', '#ffffff'];

  function catenary(ctx, x0, x1, y, sag, t, n, draw) {
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const x = x0 + (x1 - x0) * k;
      const yy = y + Math.sin(k * Math.PI) * sag + Math.sin(t * 0.03 + k * 6) * 1.5;
      draw(x, yy, i, k);
    }
  }

  P._evState = function () {
    if (!this._ev) this._ev = { parts: [], fw: [], next: 0, cross: 400 + Math.random() * 300 };
    return this._ev;
  };

  P.drawEventBack = function (ctx) {
    const info = this._eventInfo();
    if (!info || this._evOff() || !ctx.fillRect) return;
    const W = this.W, t = this.t, light = info.light, S = this._evState();
    ctx.save();
    switch (info.id) {
      case 'natal': {
        /* varal de luzinhas no alto, piscando em ondas */
        if (ctx.beginPath && ctx.quadraticCurveTo) {
          ctx.strokeStyle = 'rgba(30,60,30,0.9)';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(0, 74); ctx.quadraticCurveTo(W / 2, 122, W, 74); ctx.stroke();
        }
        catenary(ctx, 0, W, 74, 24, t, light ? 18 : 30, (x, y, i) => {
          const on = Math.sin(t * 0.08 - i * 0.7) > -0.2;
          const col = LIGHT_COLS[i % LIGHT_COLS.length];
          ctx.globalAlpha = on ? 1 : 0.35;
          ctx.fillStyle = col;
          ctx.fillRect(x - 3, y + 2, 6, 8);
          if (on && ctx.createRadialGradient) {
            ctx.globalAlpha = 0.35;
            const g = ctx.createRadialGradient(x, y + 6, 0, x, y + 6, 14);
            g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(x - 14, y - 8, 28, 28);
          }
        });
        ctx.globalAlpha = 1;
        /* treno do Papai Noel cruzando o ceu */
        if (!light) {
          const c = (t + 200) % 1500;
          if (c < 420) {
            const x = W + 80 - c * ((W + 260) / 420);
            const y = 150 + Math.sin(c * 0.03) * 10;
            drawEmo(ctx, '🛷', 30, x, y, 0.95, 0, true);
            drawEmo(ctx, '🦌', 26, x - 44, y - 6, 0.95, 0, true);
            drawEmo(ctx, '🦌', 26, x - 80, y - 10, 0.95, 0, true);
            for (let k = 0; k < 6; k++) { ctx.globalAlpha = 0.6 - k * 0.09; ctx.fillStyle = '#fff6c8'; ctx.fillRect(x + 20 + k * 12, y + 6 + Math.sin(t * 0.3 + k) * 3, 3, 3); }
          }
        }
        break;
      }
      case 'halloween': {
        /* revoada de morcegos atravessando */
        const n = light ? 3 : 7;
        for (let i = 0; i < n; i++) {
          const sp = 1.2 + (i % 3) * 0.5;
          const x = ((t * sp + i * 173) % (W + 200)) - 100;
          const y = 90 + (i * 37) % 140 + Math.sin(t * 0.12 + i) * 10;
          drawEmo(ctx, '🦇', 24 + (i % 3) * 6, x, y, 0.9, Math.sin(t * 0.2 + i) * 0.2);
        }
        if (!light) {
          /* fantasmas subindo e sumindo */
          for (let i = 0; i < 2; i++) {
            const c = (t + i * 260) % 520;
            const a = Math.sin((c / 520) * Math.PI) * 0.55;
            drawEmo(ctx, '👻', 40, 120 + i * 640 + Math.sin(t * 0.02 + i) * 30, 300 - c * 0.35, a);
          }
          /* bruxa cruzando */
          const c = (t + 600) % 1300;
          if (c < 380) drawEmo(ctx, '🧙‍♀️', 34, -60 + c * ((W + 120) / 380), 120 + Math.sin(c * 0.05) * 14, 0.95, -0.15, true);
        }
        break;
      }
      case 'junina': {
        /* bandeirinhas balancando em 2 varais */
        for (let row = 0; row < (light ? 1 : 2); row++) {
          catenary(ctx, -20, W + 20, 70 + row * 30, 22, t + row * 40, 34, (x, y, i) => {
            ctx.fillStyle = FLAG_COLS[(i + row) % FLAG_COLS.length];
            const sw = Math.sin(t * 0.06 + i) * 2;
            if (ctx.beginPath && ctx.closePath) {
              ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y); ctx.lineTo(x + 9 + sw, y + 16); ctx.lineTo(x + sw, y + 11); ctx.lineTo(x - 9 + sw, y + 16); ctx.closePath(); ctx.fill();
            }
          });
        }
        /* baloes juninos subindo devagar */
        if (!light) for (let i = 0; i < 3; i++) {
          const c = (t * 0.5 + i * 230) % 700;
          drawEmo(ctx, '🏮', 22, 140 + i * 300 + Math.sin(t * 0.01 + i) * 20, 460 - c, Math.min(1, (700 - c) / 120) * 0.9);
        }
        break;
      }
      case 'criancas': {
        const n = light ? 3 : 7;
        const cols = ['🎈'];
        for (let i = 0; i < n; i++) {
          const c = (t * (0.6 + (i % 3) * 0.2) + i * 150) % 760;
          drawEmo(ctx, cols[0], 22 + (i % 3) * 6, 60 + (i * 137) % (W - 120) + Math.sin(t * 0.02 + i) * 14, 520 - c, 0.9, Math.sin(t * 0.03 + i) * 0.15);
        }
        if (!light && ctx.arc) {
          ctx.strokeStyle = 'rgba(200,240,255,0.55)';
          ctx.lineWidth = 1.5;
          for (let i = 0; i < 8; i++) {
            const c = (t * 0.8 + i * 90) % 520;
            ctx.beginPath(); ctx.arc(80 + (i * 113) % (W - 160) + Math.sin(t * 0.04 + i) * 18, 470 - c, 5 + (i % 4) * 2, 0, 6.28); ctx.stroke();
          }
        }
        break;
      }
      case 'pascoa': {
        const n = light ? 2 : 5;
        for (let i = 0; i < n; i++) {
          const x = ((t * (0.5 + (i % 2) * 0.3) + i * 211) % (W + 100)) - 50;
          drawEmo(ctx, '🦋', 18, x, 120 + (i * 53) % 200 + Math.sin(t * 0.08 + i * 2) * 16, 0.9, Math.sin(t * 0.1 + i) * 0.3);
        }
        if (!light) {
          const c = (t + 300) % 900;
          if (c < 360) {
            const x = -40 + c * ((W + 80) / 360);
            const hop = Math.abs(Math.sin(c * 0.09)) * 22;
            drawEmo(ctx, '🐇', 30, x, this.groundY - 60 - hop, 0.85, 0, true);
          }
        }
        break;
      }
      case 'anonovo': {
        /* fogos: um a cada ~1s, estoura em particulas douradas/coloridas */
        if (t >= S.next) {
          S.next = t + (light ? 110 : 55) + ((Math.random() * 40) | 0);
          const col = ['#ffd27d', '#ff6a4a', '#7ec8ff', '#9dff8a', '#ffffff'][(Math.random() * 5) | 0];
          const cx = 80 + Math.random() * (W - 160), cy = 100 + Math.random() * 130;
          for (let k = 0; k < 28; k++) {
            const a = (k / 28) * 6.283, v = 1.6 + Math.random() * 1.6;
            S.fw.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 60 + Math.random() * 20, col });
          }
          if (S.fw.length > 300) S.fw.splice(0, S.fw.length - 300);
        }
        S.fw = S.fw.filter((p) => {
          p.x += p.vx; p.y += p.vy; p.vy += 0.035; p.vx *= 0.985; p.life--;
          ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 40));
          ctx.fillStyle = p.col;
          ctx.fillRect(p.x, p.y, 2, 2);
          return p.life > 0;
        });
        ctx.globalAlpha = 1;
        break;
      }
      default: break;
    }
    ctx.restore();
  };

  P.drawEventFront = function (ctx) {
    const info = this._eventInfo();
    if (!info || this._evOff() || !ctx.fillRect) return;
    const W = this.W, H = this.H, t = this.t, light = info.light, S = this._evState();
    ctx.save();
    if (info.id === 'natal') {
      /* flocos grandes girando na frente (poucos: nao atrapalham a luta) */
      const n = light ? 4 : 9;
      for (let i = 0; i < n; i++) {
        const sp = 0.5 + (i % 3) * 0.25;
        const y = ((t * sp + i * 97) % (H + 40)) - 20;
        drawEmo(ctx, '❄️', 10 + (i % 3) * 5, (i * 131) % W + Math.sin(t * 0.02 + i) * 24, y, 0.75, t * 0.01 + i);
      }
    } else if (info.id === 'carnaval') {
      /* serpentinas: fitas onduladas caindo */
      const n = light ? 3 : 7;
      const cols = ['#ff5a5a', '#ffd400', '#19d36a', '#3fd0ff', '#ff9a1a']; /* sem rosa-magenta: os testes visuais contam magenta */
      ctx.lineWidth = 3;
      for (let i = 0; i < n; i++) {
        const y0 = ((t * (0.9 + (i % 3) * 0.3) + i * 113) % (H + 120)) - 80;
        const x0 = (i * 149) % W;
        ctx.strokeStyle = cols[i % cols.length];
        ctx.globalAlpha = 0.85;
        if (ctx.beginPath && ctx.lineTo && ctx.stroke) {
          ctx.beginPath();
          for (let k = 0; k <= 10; k++) {
            const yy = y0 + k * 6;
            const xx = x0 + Math.sin(t * 0.08 + k * 0.8 + i) * 8;
            if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
          }
          ctx.stroke();
        }
      }
    } else if (info.id === 'junina' && !light) {
      /* fagulhas da fogueira subindo */
      for (let i = 0; i < 16; i++) {
        const c = (t * (1 + (i % 4) * 0.3) + i * 41) % 260;
        ctx.globalAlpha = Math.max(0, 1 - c / 260);
        ctx.fillStyle = i % 2 ? '#ffd27d' : '#ff8a2a';
        ctx.fillRect((i * 61) % W + Math.sin(t * 0.05 + i) * 10, H - 30 - c, 2, 2);
      }
    } else if (info.id === 'anonovo' && !light) {
      for (let i = 0; i < 14; i++) {
        ctx.globalAlpha = 0.3 + 0.6 * Math.abs(Math.sin(t * 0.05 + i));
        ctx.fillStyle = '#ffe7a0';
        ctx.fillRect((i * 71 + t * 0.2) % W, 60 + (i * 47) % 300, 2, 2);
      }
    }
    /* chuva tematica do K.O. */
    if (S.parts.length) {
      S.parts = S.parts.filter((p) => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.rot += p.vr; p.life--;
        drawEmo(ctx, p.ch, p.size, p.x, p.y, Math.max(0, Math.min(1, p.life / 30)), p.rot);
        return p.life > 0 && p.y < H + 40;
      });
    }
    ctx.restore();
  };

  const KO_RAIN = {
    natal: ['🎁', '❄️', '⭐', '🎄'], halloween: ['🎃', '🦇', '👻', '🍬'], carnaval: ['🎉', '🎭', '🎊', '⭐'],
    pascoa: ['🥚', '🐣', '🌷', '🍫'], junina: ['🌽', '🔥', '🎉', '🍿'], criancas: ['🎈', '🍭', '🧸', '⭐'], anonovo: ['🥂', '✨', '🎆', '⭐'],
  };
  P.eventKO = function (x, y) {
    const info = this._eventInfo();
    if (!info || info.light || this._evOff()) return;
    const set = KO_RAIN[info.id];
    if (!set) return;
    const S = this._evState();
    for (let k = 0; k < 22; k++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const v = 4 + Math.random() * 6;
      S.parts.push({ ch: set[k % set.length], size: 18 + ((Math.random() * 12) | 0), x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: 0, vr: (Math.random() - 0.5) * 0.2, life: 110 + Math.random() * 40 });
    }
  };
})();
