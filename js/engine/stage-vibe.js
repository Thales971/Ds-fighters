/* ============================================================
   DS FIGHTERS — VIBE DOS MAPAS (nov/2026). So visual.
   Cada mapa ganha uma "cara de cinema" pelo TEMA (lido do id/nome/grupo):

   drawVibeBack (atras dos lutadores):
     - nevoa de horizonte: faixa de luz sobre a linha do chao (profundidade)
     - luz rebatida do piso na cor do tema
     - particulas de fundo menores e mais apagadas (paralaxe)
   drawVibeFront (na frente):
     - particulas tematicas: polen, vaga-lumes, brasas, bolhas, cristais de
       neve, poeira neon, areia, poeira de luz
   drawVibeGrade (por cima da cena, antes do HUD/textos):
     - gradacao de cor do tema (soft-light: topo e base com cores diferentes)
     - luz chave suave vinda do lado do sol/luz do mapa
     - granulado de filme bem leve (so no ALTO)

   Qualidade: BAIXO = nada; MEDIO = versao leve; ALTO ("maximo") = tudo e
   mais forte. Movimento reduzido e modo performance desligam.
   ============================================================ */
(() => {
  if (typeof StageRenderer === 'undefined') return;
  const P = StageRenderer.prototype;

  /* tema: grade [topo, base] (rgb), hz = nevoa, mote = particula, n = quantidade base */
  const THEMES = [
    [/underwater|abismo|baleia|submarino|aquario|oceano/, { name: 'agua', grade: ['40,140,210', '0,40,90'], ga: 0.34, hz: '90,190,255', ha: 0.16, mote: 'bubble', n: 34, key: '150,220,255' }],
    [/kernel|neve|snow|artico|artic|ice|gelo|granizo|hail|inverno|natal/, { name: 'gelo', grade: ['200,225,255', '120,160,220'], ga: 0.3, hz: '225,240,255', ha: 0.2, mote: 'glint', n: 40, key: '220,240,255' }],
    [/volcan|forja|lava|fundi|molten|inferno|magma/, { name: 'fogo', grade: ['255,150,70', '130,30,10'], ga: 0.36, hz: '255,140,70', ha: 0.18, mote: 'ember', n: 46, key: '255,170,90' }],
    [/deserto|dunas|lencois|caatinga|canyon|sertao|areia|praia|beach/, { name: 'sol', grade: ['255,225,160', '200,120,60'], ga: 0.3, hz: '255,235,200', ha: 0.2, mote: 'sand', n: 34, key: '255,230,170' }],
    [/noite|noturn|night|biblioteca|madrugada|halloween|cemiterio|pantano|lua|sombra|creepy|escuro/, { name: 'noite', grade: ['70,60,170', '15,10,50'], ga: 0.34, hz: '120,110,200', ha: 0.14, mote: 'firefly', n: 30, key: '170,180,255' }],
    [/neon|cyber|chrome|cromada|codigo|datacenter|glitch|exe|placa-mae|hack|kali|orbital|digital|pixel|deploy|docker|servidor/, { name: 'neon', grade: ['255,70,210', '30,190,255'], ga: 0.3, hz: '140,90,255', ha: 0.14, mote: 'neon', n: 36, key: '120,200,255' }],
    [/storm|tempestade/, { name: 'tempestade', grade: ['80,90,140', '20,25,50'], ga: 0.32, hz: '150,160,200', ha: 0.14, mote: 'dust', n: 20, key: '190,200,240' }],
    [/sakura|japan|parque|lago|floresta|forest|jardim|spring|python|manguezal|doca|iguacu|tijuca|bosque|sitio|cafezal|paraty|bonito|serra|mirante|chapada|campos|vale|represa|rio|ponte|trilha|mata|fazenda|campo|pascoa|criancas|ibirapuera|morro|feira|quintal/, { name: 'natureza', grade: ['255,220,160', '70,130,80'], ga: 0.3, hz: '255,240,210', ha: 0.2, mote: 'pollen', n: 40, key: '255,235,190' }],
    [/circo|pizzaria|cafe|mercado|terminal|metro|oficina|sesi|senai|quadra|escola|pista|estacao|trabalho|area|hive|colmeia|porto|dojo|treino|arquibancada|estudio|telhado|rua|centro/, { name: 'cidade', grade: ['255,205,150', '50,60,100'], ga: 0.26, hz: '255,225,190', ha: 0.14, mote: 'dust', n: 26, key: '255,225,180' }],
  ];

  function rgbOfTint(tint) {
    const m = /^#([0-9a-f]{6})$/i.exec(tint || '');
    if (!m) return '200,200,220';
    return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).join(',');
  }

  P.vibeTheme = function () {
    if (this._vibe) return this._vibe;
    const d = this.def || {};
    const text = (String(d.id || '') + ' ' + String(d.name || '') + ' ' + String(d.group || '')).toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
    let th = null;
    for (const [re, t] of THEMES) if (re.test(text)) { th = t; break; }
    if (!th) {
      const c = rgbOfTint(d.tint);
      th = { name: 'tint', grade: [c, '40,40,70'], ga: 0.24, hz: c, ha: 0.12, mote: 'dust', n: 22, key: c };
    }
    if (d.vibe && typeof d.vibe === 'object') th = Object.assign({}, th, d.vibe); /* mapa pode ajustar o proprio clima */
    /* lado da luz chave: segue o lado dos raios de sol (drawRays) */
    let h = 0; for (const ch of String(d.id || 'x')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    this._vibe = Object.assign({ keyLeft: (h & 1) === 0, seed: h }, th);
    return this._vibe;
  };

  /* 0 = desligado, 1 = medio, 2 = alto (maximo) */
  P.vibeLevel = function () {
    const g = this.game;
    if (!g || this.reducedFlag || g.reduced) return 0;
    /* modo performance (celular comeca no nivel 1, ou fps caiu): desliga — a
       gradacao e um passe de tela cheia e derrubava o fps no celular */
    if (g.quality === 'low' || (g.perfLevel || 0) >= 1) return 0;
    if (g.shadow) return 0; /* luta sombria tem a propria cor */
    return g.quality === 'high' ? 2 : 1;
  };

  function mkMotes(th, count, W, H, seed, back) {
    let s = seed || 1;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({ x: rnd() * W, y: rnd() * H, s: back ? 0.45 + rnd() * 0.35 : 0.8 + rnd() * 0.9, ph: rnd() * 6.28, v: rnd(), hue: rnd() });
    }
    return list;
  }

  P._vibeMotes = function (back) {
    const lv = this.vibeLevel();
    const th = this.vibeTheme();
    const k = back ? '_vmB' : '_vmF';
    const want = Math.round(th.n * (lv === 2 ? 1 : 0.5) * (back ? 0.6 : 1));
    if (!this[k] || this[k].length !== want) this[k] = mkMotes(th, want, this.W, this.H, th.seed + (back ? 7 : 3), back);
    return this[k];
  };

  /* desenha UMA particula do tema; a = alpha base, sc = escala */
  function drawMote(ctx, kind, m, t, W, H, gy, wind, a) {
    const s = m.s;
    let x, y, al = a;
    switch (kind) {
      case 'bubble': {
        y = (m.y - t * (0.5 + m.v) * s + H * 4) % (H + 20) - 10;
        x = m.x + Math.sin(t * 0.03 + m.ph) * 6;
        const r = 2 + s * 3;
        ctx.globalAlpha = al * 0.7;
        ctx.strokeStyle = 'rgba(200,240,255,1)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.stroke();
        ctx.globalAlpha = al;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - r * 0.4, y - r * 0.5, 1.5, 1.5);
        return;
      }
      case 'ember': {
        y = (m.y - t * (0.6 + m.v * 1.2) * s + H * 4) % (H + 20) - 10;
        x = m.x + Math.sin(t * 0.04 + m.ph) * 10 + wind * 6;
        const f = 0.55 + 0.45 * Math.sin(t * 0.2 + m.ph * 3);
        ctx.globalAlpha = al * f;
        ctx.fillStyle = m.hue > 0.5 ? '#ffb347' : '#ff6a2a';
        const r = 1 + s * 1.6;
        ctx.fillRect(x - r / 2, y - r / 2, r, r);
        ctx.globalAlpha = al * f * 0.25;
        ctx.beginPath(); ctx.arc(x, y, r * 3, 0, 6.28); ctx.fill();
        return;
      }
      case 'firefly': {
        x = m.x + Math.sin(t * 0.011 + m.ph) * 40 + Math.sin(t * 0.037 + m.ph * 2) * 10;
        y = gy - 40 - (m.y % (gy * 0.6)) + Math.sin(t * 0.017 + m.ph) * 20;
        const blink = Math.max(0, Math.sin(t * 0.05 + m.ph * 5));
        if (blink < 0.05) return;
        ctx.globalAlpha = al * blink;
        ctx.fillStyle = '#e8ff8a';
        ctx.fillRect(x - 1, y - 1, 2.5, 2.5);
        ctx.globalAlpha = al * blink * 0.3;
        ctx.beginPath(); ctx.arc(x, y, 7 * s, 0, 6.28); ctx.fill();
        return;
      }
      case 'glint': {
        y = (m.y + t * (0.25 + m.v * 0.4) * s + H * 4) % (H + 20) - 10;
        x = m.x + Math.sin(t * 0.02 + m.ph) * 14 + wind * 10;
        const tw = Math.max(0, Math.sin(t * 0.09 + m.ph * 4));
        ctx.globalAlpha = al * (0.35 + tw * 0.65);
        ctx.fillStyle = '#ffffff';
        const r = 1 + s;
        ctx.fillRect(x - r / 2, y - r / 2, r, r);
        if (tw > 0.85) { ctx.fillRect(x - r * 2, y - 0.5, r * 4, 1); ctx.fillRect(x - 0.5, y - r * 2, 1, r * 4); }
        return;
      }
      case 'sand': {
        x = (m.x + t * (0.8 + m.v * 1.4) * s + wind * t * 0.3 + W * 4) % (W + 40) - 20;
        y = gy - 10 - (m.y % 160) + Math.sin(t * 0.03 + m.ph) * 6;
        ctx.globalAlpha = al * 0.7;
        ctx.fillStyle = '#f3d9a4';
        ctx.fillRect(x, y, 1.5 + s, 1);
        return;
      }
      case 'neon': {
        y = (m.y + t * (0.15 + m.v * 0.3) * s + H * 4) % (H + 20) - 10;
        x = m.x + Math.sin(t * 0.015 + m.ph) * 8;
        const f = 0.5 + 0.5 * Math.sin(t * 0.07 + m.ph * 2);
        ctx.globalAlpha = al * f;
        ctx.fillStyle = m.hue > 0.5 ? '#ff4fd8' : '#3fd0ff';
        ctx.fillRect(x, y, 1.5 + s * 0.8, 1.5 + s * 0.8);
        ctx.globalAlpha = al * f * 0.22;
        ctx.beginPath(); ctx.arc(x, y, 5 * s, 0, 6.28); ctx.fill();
        return;
      }
      case 'pollen': {
        x = (m.x + t * (0.12 + m.v * 0.25) + wind * t * 0.25 + Math.sin(t * 0.013 + m.ph) * 16 + W * 4) % (W + 20) - 10;
        y = (m.y - t * 0.06 * s + Math.cos(t * 0.017 + m.ph) * 10 + H * 4) % (gy + 10);
        ctx.globalAlpha = al * (0.45 + 0.4 * Math.sin(t * 0.04 + m.ph));
        ctx.fillStyle = m.hue > 0.6 ? '#fff6c8' : '#ffe48a';
        const r = 1 + s * 0.9;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();
        return;
      }
      default: { /* poeira de luz */
        x = m.x + Math.sin(t * 0.008 + m.ph) * 20 + wind * 4;
        y = (m.y - t * 0.08 * s + H * 4) % (gy + 10);
        ctx.globalAlpha = al * (0.25 + 0.3 * Math.abs(Math.sin(t * 0.025 + m.ph)));
        ctx.fillStyle = '#fff4dc';
        ctx.fillRect(x, y, 1 + s * 0.8, 1 + s * 0.8);
      }
    }
  }

  P.drawVibeBack = function (ctx) {
    const lv = this.vibeLevel();
    if (!lv || !ctx.createLinearGradient) return;
    const th = this.vibeTheme();
    const W = this.W, H = this.H, gy = this.groundY || 458, t = this.t;
    ctx.save();
    /* nevoa de horizonte: luz difusa logo acima do chao, some pra cima */
    if (!this._vHaze) {
      const g = ctx.createLinearGradient(0, gy - 200, 0, gy + 30);
      g.addColorStop(0, 'rgba(' + th.hz + ',0)');
      g.addColorStop(0.7, 'rgba(' + th.hz + ',1)');
      g.addColorStop(1, 'rgba(' + th.hz + ',0)');
      this._vHaze = g;
      const b = ctx.createLinearGradient(0, gy - 4, 0, H);
      b.addColorStop(0, 'rgba(' + th.key + ',1)');
      b.addColorStop(1, 'rgba(' + th.key + ',0)');
      this._vBounce = b;
    }
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = th.ha * (lv === 2 ? 0.75 : 0.5) * (0.9 + 0.1 * Math.sin(t * 0.006));
    ctx.fillStyle = this._vHaze;
    ctx.fillRect(-20, gy - 200, W + 40, 230);
    /* luz rebatida no piso */
    ctx.globalAlpha = (lv === 2 ? 0.09 : 0.05);
    ctx.fillStyle = this._vBounce;
    ctx.fillRect(-20, gy - 4, W + 40, H - gy + 4);
    ctx.globalCompositeOperation = 'source-over';
    /* particulas de fundo (menores, mais apagadas) */
    const wind = this._wind || 0;
    const ms = this._vibeMotes(true);
    for (const m of ms) drawMote(ctx, th.mote, m, t * 0.7, W, H, gy, wind, 0.35);
    ctx.restore();
  };

  P.drawVibeFront = function (ctx) {
    const lv = this.vibeLevel();
    if (!lv) return;
    const th = this.vibeTheme();
    const W = this.W, H = this.H, gy = this.groundY || 458;
    ctx.save();
    const ms = this._vibeMotes(false);
    const wind = this._wind || 0;
    for (const m of ms) drawMote(ctx, th.mote, m, this.t, W, H, gy, wind, lv === 2 ? 0.85 : 0.6);
    ctx.restore();
  };

  function grainCanvas() {
    if (P._grain !== undefined) return P._grain;
    P._grain = null;
    try {
      if (typeof document === 'undefined') return null;
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const x = c.getContext('2d');
      const im = x.createImageData(128, 128);
      for (let i = 0; i < im.data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
        im.data[i + 3] = 255;
      }
      x.putImageData(im, 0, 0);
      P._grain = c;
    } catch (e) { P._grain = null; }
    return P._grain;
  }

  P.drawVibeGrade = function (ctx) {
    const lv = this.vibeLevel();
    if (!lv || !ctx.createLinearGradient) return;
    const th = this.vibeTheme();
    const W = this.W, H = this.H;
    ctx.save();
    if (ctx.setTransform) ctx.setTransform(1, 0, 0, 1, 0, 0);
    const cv = ctx.canvas;
    const cw = (cv && cv.width) || W, ch = (cv && cv.height) || H;
    if (!this._vGrade || this._vGradeH !== ch) {
      const g = ctx.createLinearGradient(0, 0, 0, ch);
      g.addColorStop(0, 'rgb(' + th.grade[0] + ')');
      g.addColorStop(1, 'rgb(' + th.grade[1] + ')');
      this._vGrade = g;
      const kx = th.keyLeft ? cw * 0.12 : cw * 0.88;
      const k = ctx.createRadialGradient(kx, -ch * 0.1, 10, kx, -ch * 0.1, Math.hypot(cw, ch) * 0.8);
      k.addColorStop(0, 'rgba(' + th.key + ',1)');
      k.addColorStop(1, 'rgba(' + th.key + ',0)');
      this._vKey = k;
      this._vGradeH = ch;
    }
    try {
      /* MAXIMO: passe de cor de verdade — mais saturacao e contraste na tela
         inteira (copia num canvas de apoio e devolve com filtro) */
      if (lv === 2 && cv && ctx.filter !== undefined && typeof document !== 'undefined' && !this._noPop) {
        if (!this._pop || this._pop.width !== cw || this._pop.height !== ch) {
          this._pop = document.createElement('canvas'); this._pop.width = cw; this._pop.height = ch;
        }
        const px = this._pop.getContext('2d');
        px.globalCompositeOperation = 'copy';
        px.drawImage(cv, 0, 0);
        ctx.globalCompositeOperation = 'copy';
        ctx.filter = 'saturate(' + (th.sat || 1.16) + ') contrast(' + (th.con || 1.07) + ')';
        ctx.drawImage(this._pop, 0, 0);
        ctx.filter = 'none';
        ctx.globalCompositeOperation = 'source-over';
      }
      /* gradacao: soft-light mexe no contraste e na cor sem lavar a imagem */
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = th.ga * (lv === 2 ? 1 : 0.55);
      ctx.fillStyle = this._vGrade;
      ctx.fillRect(0, 0, cw, ch);
      /* luz chave vinda do canto do sol */
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = lv === 2 ? 0.07 : 0.045;
      ctx.fillStyle = this._vKey;
      ctx.fillRect(0, 0, cw, ch);
      /* granulado de filme (so no maximo) */
      if (lv === 2) {
        const gc = grainCanvas();
        if (gc && ctx.createPattern) {
          const pat = ctx.createPattern(gc, 'repeat');
          if (pat) {
            ctx.globalCompositeOperation = 'overlay';
            ctx.globalAlpha = 0.05;
            ctx.fillStyle = pat;
            const ox = (this.t * 37) % 128, oy = (this.t * 53) % 128;
            ctx.translate(-ox, -oy);
            ctx.fillRect(0, 0, cw + 128, ch + 128);
          }
        }
      }
    } catch (e) { this.drawVibeGrade = () => {}; /* navegador sem blend: desliga */ }
    ctx.restore();
  };
})();
