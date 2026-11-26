/* ============================================================
   DS FIGHTERS — DETALHES DOS MAPAS URBANOS (nov/2026). So visual.
   Os mapas de RUA (ao ar livre) ganham vida propria no chao:
     - POCAS d'agua com reflexo: do ceu/neon do mapa (riscos de luz que
       tremem) e dos LUTADORES quando passam por cima; chuva faz aneis e o
       pe do lutador espirra
     - BUEIRO soltando VAPOR (nuvem que sobe e vai com o vento)
     - LIXO voando: papel, folha seca, latinha e (no carnaval) confete,
       arrastado pelo vento e por rajadas; o dash do lutador levanta
     - MATO nas RACHADURAS da calcada (deita quando o lutador pisa)
   Mapa de interior (dojo, escola, biblioteca, datacenter...) fica sem —
   bueiro e poca dentro de casa nao fazem sentido. Um mapa pode ligar/desligar
   pecas com def.urban = { puddles, steam, trash, weeds } ou def.urban = false.
   Qualidade: BAIXO nada; MEDIO metade; ALTO tudo. Modo performance: so o
   que e parado (pocas sem anel, rachaduras); movimento reduzido idem.
   ============================================================ */
(() => {
  if (typeof StageRenderer === 'undefined') return;
  const P = StageRenderer.prototype;

  /* mapas de rua: quais pecas cada um tem (n = neon no reflexo, d = dia) */
  const ALL = { puddles: 1, steam: 1, trash: 1, weeds: 1 };
  const MAPS = {
    '01-neon-rooftop': { puddles: 1, steam: 1, trash: 1, weeds: 0, neon: 1 },
    cyberpunk: Object.assign({ neon: 1 }, ALL),
    chrome: { puddles: 1, steam: 1, trash: 1, weeds: 0, neon: 1 },
    'rua-centro-noite': Object.assign({ neon: 1 }, ALL),
    'terminal-onibus': Object.assign({}, ALL),
    'estacao-valinhos': Object.assign({}, ALL),
    'metropole-dia-noite': Object.assign({ neon: 1 }, ALL),
    'pos-codigocalipse': { puddles: 1, steam: 1, trash: 1, weeds: 1, ruin: 1 },
    'datacenter-abandonado': { puddles: 1, steam: 0, trash: 1, weeds: 1, ruin: 1 },
    'beco-batman': Object.assign({}, ALL),
    'arcos-lapa': Object.assign({ neon: 1 }, ALL),
    'santa-teresa': { puddles: 1, steam: 0, trash: 1, weeds: 1, day: 1 },
    'ouro-preto': { puddles: 1, steam: 0, trash: 1, weeds: 1, day: 1 },
    'teatro-amazonas': { puddles: 1, steam: 0, trash: 1, weeds: 1, day: 1 },
    'carnaval-bloco': { puddles: 1, steam: 0, trash: 1, weeds: 1, confetti: 1 },
    'carnaval-ladeiras': { puddles: 0, steam: 0, trash: 1, weeds: 1, confetti: 1, day: 1 },
    'halloween-rua': { puddles: 1, steam: 1, trash: 1, weeds: 1, leaves: 1 },
    'anonovo-paulista': { puddles: 1, steam: 1, trash: 1, weeds: 0, neon: 1, confetti: 1 },
    docker: { puddles: 1, steam: 1, trash: 1, weeds: 1 },
    'churrasco-laje': { puddles: 0, steam: 0, trash: 1, weeds: 1, day: 1 },
    'telhado-escola': { puddles: 1, steam: 1, trash: 1, weeds: 1, day: 1 },
    'pista-skate': { puddles: 1, steam: 0, trash: 1, weeds: 1, day: 1 },
    'sesi-patio': { puddles: 0, steam: 0, trash: 1, weeds: 1, day: 1, leaves: 1 },
  };

  P.urbanProfile = function () {
    if (this._urb !== undefined) return this._urb;
    const d = this.def || {};
    let pr = d.urban === false ? null : (d.urban && typeof d.urban === 'object' ? d.urban : MAPS[d.id] || null);
    this._urb = pr ? Object.assign({}, pr) : null;
    return this._urb;
  };

  /* 0 = nada, 1 = so parado (perf/reduzido), 2 = medio, 3 = alto */
  P.urbanLevel = function () {
    const g = this.game;
    if (!this.urbanProfile() || !g) return 0;
    if (g.quality === 'low' || (g.perfLevel || 0) >= 2) return 0;
    if (this.reducedFlag || g.reduced || (g.perfLevel || 0) >= 1) return 1;
    if (g.shadow) return 0;
    return g.quality === 'high' ? 3 : 2;
  };

  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  P.urbanInit = function () {
    if (this._urbS) return this._urbS;
    const pr = this.urbanProfile();
    const W = this.W || 960;
    let h = 0; for (const ch of String(this.def.id || 'x')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const r = rng(h);
    const st = { puddles: [], cracks: [], weeds: [], trash: [], steam: [], manhole: null, ripples: [] };
    if (pr.puddles) {
      const n = 2 + ((r() * 2) | 0);
      for (let i = 0; i < n; i++) {
        /* no centro da tela (os cantos de baixo tem o HUD dos poderes) */
        st.puddles.push({ x: 260 + (i + r() * 0.8) * (440 / n), y: 14 + r() * 22, w: 120 + r() * 100, h: 12 + r() * 7, ph: r() * 6 });
      }
    }
    if (pr.steam) st.manhole = { x: 300 + r() * 360, y: 30 + r() * 10 };
    if (pr.weeds) {
      const n = 4 + ((r() * 3) | 0);
      for (let i = 0; i < n; i++) {
        const x0 = 60 + r() * (W - 120), y0 = 2 + r() * 40;
        const pts = [[x0, y0]];
        let x = x0, y = y0;
        const seg = 4 + ((r() * 4) | 0);
        for (let k = 0; k < seg; k++) { x += (r() - 0.3) * 22; y += (r() - 0.5) * 7; pts.push([x, Math.max(1, Math.min(70, y))]); }
        st.cracks.push(pts);
        /* tufo de mato na ponta e as vezes no meio da rachadura */
        const ends = [pts[0], pts[pts.length - 1]];
        if (r() < 0.6) ends.push(pts[(pts.length / 2) | 0]);
        for (const [wx, wy] of ends) st.weeds.push({ x: wx, y: wy, v: (r() * 4) | 0, s: 0.12 + r() * 0.08, ph: r() * 6, dir: r() < 0.5 ? -1 : 1, bend: 0 });
      }
    }
    if (pr.trash) {
      const n = 12;
      for (let i = 0; i < n; i++) {
        const kind = pr.confetti && r() < 0.6 ? 'confetti' : (pr.leaves || pr.ruin) && r() < 0.5 ? 'leaf' : r() < 0.7 ? 'paper' : 'can';
        st.trash.push({ kind, x: r() * W, y: 0, gy: 4 + r() * 50, vx: 0, vy: 0, rot: r() * 6, vr: 0, ph: r() * 6, front: r() < 0.35, hue: r(), air: 0 });
      }
    }
    this._urbS = st;
    return st;
  };

  P.urbanUpdate = function () {
    const lv = this.urbanLevel();
    if (lv < 2) return;
    const st = this.urbanInit();
    const g = this.game, t = this.t, W = this.W || 960;
    const wind = this._wind || 0;
    const fs = g && g.fighters ? g.fighters().filter(Boolean) : [];
    /* rajada de vento de tempos em tempos */
    const gust = Math.max(0, Math.sin(t * 0.004 + 1.3)) ** 6 * 2.2;
    for (const p of st.trash) {
      const push = (0.25 + wind * 0.6 + gust) * (p.kind === 'can' ? 0.4 : 1);
      p.vx += (push - p.vx) * 0.03;
      for (const f of fs) { /* lutador correndo/dash levanta o lixo */
        const dx = p.x - f.x;
        if (Math.abs(dx) < 50 && Math.abs(f.vx || 0) > 3 && f.y > -20 && p.air <= 0) { p.vy = -(2 + Math.abs(f.vx) * 0.4); p.vx += Math.sign(f.vx) * 2.5; p.air = 1; p.vr = (Math.random() - 0.5) * 0.4; }
      }
      if (p.kind !== 'can' && gust > 1.4 && p.air <= 0 && Math.random() < 0.02) { p.vy = -2.5 - Math.random() * 2; p.air = 1; p.vr = (Math.random() - 0.5) * 0.3; }
      if (p.air > 0) {
        p.vy += p.kind === 'can' ? 0.35 : 0.06;
        p.y += p.vy;
        if (p.kind !== 'can') p.x += Math.sin(t * 0.08 + p.ph) * 0.6;
        if (p.y >= 0) { p.y = 0; p.vy = 0; p.air = 0; }
        p.rot += p.vr;
      } else {
        p.rot += p.vx * (p.kind === 'can' ? 0.08 : 0.02);
      }
      p.x += p.vx;
      if (p.x > W + 30) p.x = -30;
      if (p.x < -30) p.x = W + 30;
    }
    if (st.manhole && lv >= 2) {
      const want = lv === 3 ? 14 : 8;
      if (st.steam.length < want && t % 9 === 0) st.steam.push({ x: st.manhole.x + (Math.random() - 0.5) * 16, y: 0, r: 8 + Math.random() * 6, life: 0, max: 120 + Math.random() * 60, ph: Math.random() * 6 });
      for (const s of st.steam) { s.life++; s.y -= 0.7; s.x += wind * 0.6 + Math.sin(s.life * 0.03 + s.ph) * 0.3 + 0.15; s.r += 0.25; }
      st.steam = st.steam.filter((s) => s.life < s.max);
    }
    for (const w of st.weeds) {
      let want = 0;
      for (const f of fs) { const dx = w.x - f.x; if (Math.abs(dx) < 36 && f.y > -30) want += (dx >= 0 ? 1 : -1) * (1 - Math.abs(dx) / 36) * 0.6; }
      w.bend += (Math.max(-0.7, Math.min(0.7, want)) - w.bend) * (want ? 0.25 : 0.06);
    }
    /* aneis nas pocas: chuva + pisada do lutador */
    const rain = g && g.weather && (g.weather.kind === 'rain' || g.weather.kind === 'storm');
    if (rain && t % 5 === 0) for (const pd of st.puddles) if (Math.random() < 0.6) st.ripples.push({ x: pd.x + (Math.random() - 0.5) * pd.w * 0.8, y: pd.y + (Math.random() - 0.5) * pd.h * 0.6, life: 0, max: 26, s: 0.6 });
    for (const f of fs) {
      if (!(f.y > -4) || Math.abs(f.vx || 0) < 1.5 || t % 8) continue;
      for (const pd of st.puddles) if (Math.abs(f.x - pd.x) < pd.w * 0.5) st.ripples.push({ x: f.x, y: pd.y, life: 0, max: 30, s: 1.2 });
    }
    for (const rp of st.ripples) rp.life++;
    st.ripples = st.ripples.filter((rp) => rp.life < rp.max).slice(-40);
  };

  function drawTrash(ctx, p, gy) {
    const y = gy + p.gy + p.y;
    ctx.save();
    ctx.translate(p.x, y);
    ctx.rotate(p.rot);
    if (p.kind === 'paper') {
      ctx.fillStyle = p.hue > 0.5 ? '#ecebe2' : '#f3e8c8';
      ctx.fillRect(-5, -3.5, 10, 7);
      ctx.fillStyle = 'rgba(60,70,90,0.35)';
      ctx.fillRect(-3.5, -1.5, 7, 0.8); ctx.fillRect(-3.5, 0.6, 5, 0.8);
    } else if (p.kind === 'leaf') {
      ctx.fillStyle = p.hue > 0.5 ? '#a0612c' : '#c08a3a';
      ctx.beginPath(); ctx.ellipse(0, 0, 5, 2.6, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = 'rgba(70,40,20,0.6)'; ctx.fillRect(-4, -0.3, 8, 0.6);
    } else if (p.kind === 'confetti') {
      const cs = ['#ff4fd8', '#ffd23a', '#3fd0ff', '#7dff6a', '#ff6a3a'];
      ctx.fillStyle = cs[(p.hue * cs.length) | 0];
      ctx.fillRect(-2.5, -1.2, 5, 2.4);
    } else { /* latinha */
      ctx.fillStyle = p.hue > 0.5 ? '#c8323a' : '#3a7ac8';
      ctx.fillRect(-4, -2.5, 8, 5);
      ctx.fillStyle = '#d8dce4';
      ctx.fillRect(-4, -2.5, 1.4, 5); ctx.fillRect(2.6, -2.5, 1.4, 5);
    }
    ctx.restore();
  }

  /* ATRAS dos lutadores (coordenada de mundo): vapor do bueiro + lixo de tras */
  P.drawUrbanBack = function (ctx) {
    const lv = this.urbanLevel();
    if (!lv) return;
    this.urbanUpdate();
    const st = this.urbanInit();
    const gy = this.groundY || 458;
    ctx.save();
    if (st.manhole && st.steam.length) {
      for (const s of st.steam) {
        const k = s.life / s.max;
        const a = Math.min(1, s.life / 20) * (1 - k) * (lv === 3 ? 0.32 : 0.24);
        const gr = ctx.createRadialGradient(s.x, gy + st.manhole.y + s.y, 0, s.x, gy + st.manhole.y + s.y, s.r);
        gr.addColorStop(0, 'rgba(235,240,250,' + a.toFixed(3) + ')');
        gr.addColorStop(1, 'rgba(235,240,250,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(s.x - s.r, gy + st.manhole.y + s.y - s.r, s.r * 2, s.r * 2);
      }
    }
    if (lv >= 2) for (const p of st.trash) if (!p.front && p.y < -2) drawTrash(ctx, p, gy);
    ctx.restore();
  };

  /* CHAO (origem na linha do chao, chamado em game.js junto do reflexo):
     rachaduras + mato, bueiro, pocas com reflexo, lixo no chao */
  P.drawUrbanFloor = function (ctx, fs, game) {
    const lv = this.urbanLevel();
    if (!lv) return;
    const st = this.urbanInit();
    const pr = this.urbanProfile();
    const t = this.t;
    ctx.save();
    /* rachaduras */
    if (st.cracks.length) {
      ctx.lineCap = 'round';
      for (const pts of st.cracks) {
        ctx.strokeStyle = 'rgba(10,10,16,0.55)'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1] + 1);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1] + 1);
        ctx.stroke();
      }
    }
    /* bueiro: tampa de ferro com grade */
    if (st.manhole) {
      const m = st.manhole;
      ctx.fillStyle = '#1b1c22';
      ctx.beginPath(); ctx.ellipse(m.x, m.y, 26, 7, 0, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#4a4c58'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(m.x, m.y, 26, 7, 0, 0, 6.28); ctx.stroke();
      ctx.strokeStyle = 'rgba(120,124,140,0.55)'; ctx.lineWidth = 1;
      for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(m.x + k * 8 - 3, m.y - 5); ctx.lineTo(m.x + k * 8 + 3, m.y + 5); ctx.stroke(); }
    }
    /* pocas */
    for (const pd of st.puddles) {
      ctx.save();
      ctx.beginPath(); ctx.ellipse(pd.x, pd.y, pd.w / 2, pd.h / 2, 0, 0, 6.28);
      ctx.clip();
      /* REFLEXO DE VERDADE: a poca espelha a propria cena (predios, letreiros,
         lutadores) achatada, como chao molhado — copia do canvas ja desenhado */
      const SQ = 0.35;
      const m = lv >= 2 && ctx.getTransform && ctx.canvas ? ctx.getTransform() : null;
      let mirrored = false;
      if (m && !m.b && !m.c) {
        const x0 = pd.x - pd.w / 2, yA = -(pd.y + pd.h / 2) / SQ, yB = -(pd.y - pd.h / 2) / SQ;
        const sx = m.a * x0 + m.e, sy = m.d * yA + m.f, sw = m.a * pd.w, sh = m.d * (yB - yA);
        if (sw > 1 && sh > 1 && sx > -sw && sy >= 0 && sx < ctx.canvas.width && sy + sh <= ctx.canvas.height) {
          try {
            ctx.save();
            ctx.scale(1, -SQ);
            ctx.globalAlpha = 0.78;
            ctx.drawImage(ctx.canvas, sx, sy, sw, sh, x0, yA, pd.w, yB - yA);
            ctx.restore();
            mirrored = true;
          } catch (e) { /* sem copia: fica so o ceu */ }
        }
      }
      const sky = ctx.createLinearGradient(0, pd.y - pd.h / 2, 0, pd.y + pd.h / 2);
      if (pr.day) { sky.addColorStop(0, 'rgba(160,205,245,0.55)'); sky.addColorStop(1, 'rgba(70,100,140,0.45)'); }
      else { sky.addColorStop(0, 'rgba(40,46,90,0.6)'); sky.addColorStop(1, 'rgba(10,12,30,0.55)'); }
      ctx.globalAlpha = mirrored ? 0.45 : 1;
      ctx.fillStyle = sky;
      ctx.fillRect(pd.x - pd.w / 2, pd.y - pd.h / 2, pd.w, pd.h);
      ctx.globalAlpha = 1;
      /* riscos de luz (letreiro neon / poste / sol) tremendo na agua */
      ctx.globalCompositeOperation = 'lighter';
      const cols = pr.neon ? ['255,79,216', '63,208,255', '255,210,90'] : pr.day ? ['255,255,240', '200,230,255'] : ['255,190,110', '200,220,255'];
      for (let k = 0; k < 5; k++) {
        const sx = pd.x - pd.w * 0.4 + ((k * 37 + pd.ph * 20) % (pd.w * 0.8));
        const wob = lv >= 2 ? Math.sin(t * 0.12 + k * 1.7 + pd.ph) * 2 : 0;
        ctx.fillStyle = 'rgba(' + cols[k % cols.length] + ',' + (pr.neon ? 0.38 : 0.22) + ')';
        ctx.fillRect(sx + wob, pd.y - pd.h / 2 + 1, 2 + (k % 2) * 2, pd.h - 2);
      }
      /* filete de brilho na borda de cima */
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(pd.x - pd.w * 0.35, pd.y - pd.h / 2 + 0.5, pd.w * 0.5, 1);
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
      /* borda: filete de luz bem fraco (agua parada), nao contorno escuro */
      ctx.strokeStyle = 'rgba(200,220,255,0.14)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(pd.x, pd.y, pd.w / 2, pd.h / 2, 0, 0, 6.28); ctx.stroke();
    }
    /* aneis na agua */
    if (lv >= 2) {
      for (const rp of st.ripples) {
        const k = rp.life / rp.max;
        ctx.strokeStyle = 'rgba(220,235,255,' + ((1 - k) * 0.45).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(rp.x, rp.y, 3 + k * 16 * rp.s, (3 + k * 16 * rp.s) * 0.3, 0, 0, 6.28); ctx.stroke();
      }
    }
    /* mato nas rachaduras (tufo pequeno do atlas de flora) */
    if (st.weeds.length) {
      const spr = typeof Art !== 'undefined' && Art.ready && Art.ready('flora');
      for (const w of st.weeds) {
        const sway = lv >= 2 ? Math.sin(t * 0.05 + w.ph) * 0.08 : 0;
        if (spr) {
          Art.cell(ctx, 'flora', 4, w.v, w.x, w.y + 1, { scale: w.s, dir: w.dir, anchor: 'bottom', rot: sway + w.bend });
        } else {
          ctx.save(); ctx.translate(w.x, w.y); ctx.rotate(sway + w.bend);
          ctx.fillStyle = '#5f9a32'; ctx.fillRect(-2, -8, 2, 8); ctx.fillRect(1, -6, 2, 6);
          ctx.restore();
        }
      }
    }
    /* lixo no chao (o de tras) */
    if (lv >= 2) for (const p of st.trash) if (!p.front && p.y >= -2) drawTrash(ctx, p, 0);
    ctx.restore();
  };

  /* NA FRENTE (coordenada de mundo): lixo da frente passando por cima */
  P.drawUrbanFront = function (ctx) {
    const lv = this.urbanLevel();
    if (lv < 2) return;
    const st = this.urbanInit();
    const gy = this.groundY || 458;
    ctx.save();
    for (const p of st.trash) if (p.front) drawTrash(ctx, p, gy);
    ctx.restore();
  };
})();
