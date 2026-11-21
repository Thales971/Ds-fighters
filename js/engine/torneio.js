/* ============================================================
   DS FIGHTERS — MAPAS DO TORNEIO (arte do dono em mapas-torneio/,
   recortada por tools/build_mapas_novos.py). Cada mapa tem clima,
   luz, ambientacao e EVENTOS de batalha so dele. O torneio percorre
   os mapas em ordem e termina na Fortaleza do Dev contra o chefe.
   Carregado depois de weather.js e mechanics.js (usa WEATHER_EXT,
   MECHS, MECH_INFO, WEATHER_INFO e STAGE_LIST).
   ============================================================ */
/* ordem do torneio (ui.js launchArcade): 6 rivais nos 6 mapas, chefe na Fortaleza */
var TORNEIO = { stages: [], boss: 'kernor' };
(() => {
  const R = (w) => (w.game.rnd ? w.game.rnd() : Math.random());
  const RG = (g) => (g.rnd ? g.rnd() : Math.random());
  const fx2 = (ctx, sheet, row, col, x, y, o) => (typeof Art !== 'undefined' ? Art.cell(ctx, 'fx2:' + sheet, row, col, x, y, o) : false);
  const glowDot = (ctx, x, y, r, rgb, a) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill();
  };
  const W = 960;

  /* ---------------- CLIMAS EXCLUSIVOS ---------------- */
  Object.assign(WEATHER_EXT, {
    /* PRACA HELLO WORLD: por do sol dourado, simbolos de codigo dourados
       subindo e passaros ao longe. Calor bom: medidor +5%. */
    hellosol: {
      want: 26,
      spawn(d, w, first) { d.x = R(w) * W; d.y = first ? -R(w) * 480 : 10; d.g = ['{ }', '</>', '()', ';', '=>', 'Hi'][(R(w) * 6) | 0]; d.s = R(w); },
      move(d, w) { d.y -= 0.35 + d.s * 0.35; d.x += Math.sin((w.t + d.s * 200) * 0.02) * 0.35; if (d.y < -500) { d.y = 10; d.x = R(w) * W; } },
      draw(ctx, w) {
        ctx.font = 'bold 12px monospace';
        for (const d of w.drops) {
          ctx.globalAlpha = Math.max(0, 0.75 * (1 + d.y / 500)) * (0.5 + d.s * 0.5);
          ctx.fillStyle = d.s > 0.6 ? '#ffe7a0' : '#ffc860';
          ctx.fillText(d.g, d.x, d.y);
        }
        ctx.globalAlpha = 1;
      },
      overlay(ctx, Wd, H, w) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, 'rgba(255,170,60,0.16)');
        g.addColorStop(0.55, 'rgba(255,200,120,0.05)');
        g.addColorStop(1, 'rgba(255,140,40,0.10)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, Wd, H);
        /* raios de sol saindo do horizonte (esquerda) */
        ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 5; k++) {
          const a = 0.06 + 0.03 * Math.sin(w.t * 0.01 + k);
          ctx.fillStyle = 'rgba(255,210,120,' + a.toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(150, 70); ctx.lineTo(150 + 900, 40 + k * 95); ctx.lineTo(150 + 900, 80 + k * 95); ctx.closePath(); ctx.fill();
        }
      },
    },
    /* FLORESTA DE DEPENDENCIAS: feixes de luz entre as arvores, vagalumes
       verdes e folhas. Ar puro: cura bem lenta pros dois. */
    vagafloresta: {
      want: 34,
      spawn(d, w, first) { d.x = R(w) * W; d.y = -40 - R(w) * 400; d.leaf = R(w) < 0.35; d.s = R(w); d.ph = R(w) * 6.28; if (d.leaf && !first) d.y = -520; },
      move(d, w) {
        d.ph += 0.03;
        if (d.leaf) { d.y += 0.7 + d.s * 0.6; d.x += Math.sin(d.ph) * 0.8; if (d.y > 10) { d.y = -520; d.x = R(w) * W; } }
        else { d.x += Math.sin(d.ph) * 0.6; d.y += Math.cos(d.ph * 0.7) * 0.4; if (d.y > -30) d.y = -300; if (d.y < -440) d.y = -100; }
      },
      draw(ctx, w) {
        for (const d of w.drops) {
          if (d.leaf) { ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.ph); ctx.fillStyle = d.s > 0.5 ? '#6fbf3a' : '#9ad04a'; ctx.fillRect(-4, -2, 8, 4); ctx.restore(); }
          else glowDot(ctx, d.x, d.y, 7, '170,255,120', (0.35 + 0.5 * Math.abs(Math.sin(w.t * 0.08 + d.ph))).toFixed(2));
        }
      },
      overlay(ctx, Wd, H, w) {
        ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 4; k++) {
          const x = 380 + k * 70 + Math.sin(w.t * 0.006 + k) * 20;
          const a = 0.05 + 0.025 * Math.sin(w.t * 0.02 + k * 2);
          ctx.fillStyle = 'rgba(255,255,190,' + a.toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 50, 0); ctx.lineTo(x - 60 + k * 30, H); ctx.lineTo(x - 140 + k * 30, H); ctx.closePath(); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
        const v = ctx.createRadialGradient(Wd / 2, H / 2, H * 0.35, Wd / 2, H / 2, H);
        v.addColorStop(0, 'rgba(10,40,10,0)'); v.addColorStop(1, 'rgba(10,40,10,0.30)');
        ctx.fillStyle = v; ctx.fillRect(0, 0, Wd, H);
      },
      effect(w, fighting) {
        if (!fighting) return;
        w._ar = (w._ar || 150) - 1;
        if (w._ar <= 0) { w._ar = 150; for (const f of w.game.fighters()) if (f.alive && f.hp < f.maxHp) f.hp = Math.min(f.maxHp, f.hp + 1); }
      },
    },
    /* PONTE DO CACHE: nevoa azul subindo das cachoeiras, gotas brilhando e
       um brilho azul que pulsa de baixo da ponte. Chao molhado (escorrega). */
    nevoacache: {
      want: 40,
      spawn(d, w) { d.x = R(w) * W; d.y = R(w) * 40; d.s = R(w); d.r = 20 + R(w) * 40; d.mist = R(w) < 0.4; },
      move(d, w) {
        d.y -= d.mist ? 0.25 + d.s * 0.2 : 0.8 + d.s;
        d.x += Math.sin((w.t + d.s * 300) * 0.015) * 0.3;
        if (d.y < (d.mist ? -220 : -380)) { d.y = R(w) * 30; d.x = R(w) * W; }
      },
      draw(ctx, w) {
        for (const d of w.drops) {
          if (d.mist) { ctx.globalAlpha = Math.max(0, 0.16 * (1 + d.y / 220)); glowDot(ctx, d.x, d.y, d.r, '150,210,255', 0.6); }
          else { ctx.globalAlpha = Math.max(0, 0.9 * (1 + d.y / 380)); ctx.fillStyle = '#bfe9ff'; ctx.fillRect(Math.round(d.x), Math.round(d.y), 2, 2); }
        }
        ctx.globalAlpha = 1;
      },
      overlay(ctx, Wd, H, w) {
        const p = 0.10 + 0.05 * Math.sin(w.t * 0.04);
        const g = ctx.createLinearGradient(0, H * 0.75, 0, H);
        g.addColorStop(0, 'rgba(60,160,255,0)'); g.addColorStop(1, 'rgba(60,170,255,' + p.toFixed(3) + ')');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = g; ctx.fillRect(0, H * 0.75, Wd, H * 0.25);
      },
      friction: 1.2,
    },
    /* FABRICA DE BUILDS: fagulhas saindo da prensa, vapor dos canos e a luz
       laranja da fornalha pulsando. */
    fornalha: {
      want: 44,
      spawn(d, w) { d.steam = R(w) < 0.3; d.x = d.steam ? (R(w) < 0.5 ? 190 : 860) + (R(w) - 0.5) * 20 : 600 + (R(w) - 0.5) * 120; d.y = d.steam ? -390 : -150 + R(w) * 30; d.vx = (R(w) - 0.5) * 3; d.vy = -1.5 - R(w) * 3; d.s = R(w); d.r = 8; },
      move(d, w) {
        if (d.steam) { d.y -= 0.6; d.x += 0.2; d.r += 0.25; if (d.y < -520) Object.assign(d, { y: -390, r: 8 }); return; }
        d.x += d.vx; d.y += d.vy; d.vy += 0.08;
        if (d.y > 0) { d.steam = false; d.x = 600 + (R(w) - 0.5) * 120; d.y = -150; d.vx = (R(w) - 0.5) * 3; d.vy = -1.5 - R(w) * 3; }
      },
      draw(ctx, w) {
        for (const d of w.drops) {
          if (d.steam) { ctx.globalAlpha = Math.max(0, 0.2 * (1 - (d.r - 8) / 40)); ctx.fillStyle = '#e8e4e0'; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.3); ctx.fill(); }
          else { ctx.globalAlpha = 0.9; ctx.fillStyle = d.s > 0.5 ? '#ffd27a' : '#ff8a2a'; ctx.fillRect(Math.round(d.x), Math.round(d.y), 2, 2); }
        }
        ctx.globalAlpha = 1;
      },
      overlay(ctx, Wd, H, w) {
        const p = 0.13 + 0.06 * Math.sin(w.t * 0.09) + (w.game._prensa > 0 ? 0.12 : 0);
        const g = ctx.createRadialGradient(Wd * 0.63, H * 0.68, 20, Wd * 0.63, H * 0.68, Wd * 0.55);
        g.addColorStop(0, 'rgba(255,140,40,' + p.toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,140,40,0)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = g; ctx.fillRect(0, 0, Wd, H);
      },
    },
    /* CIDADE GIT DESTRUIDA: cinzas caindo, brasas subindo, fumaca e o ceu
       vermelho. Ar pesado: medidor um pouco mais lento nao — fogo +10%. */
    cinzasgit: {
      want: 60,
      spawn(d, w, first) { d.ember = R(w) < 0.35; d.x = R(w) * W; d.y = d.ember ? -R(w) * 40 : (first ? -R(w) * 520 : -540); d.s = R(w); d.ph = R(w) * 6; },
      move(d, w) {
        d.ph += 0.04;
        if (d.ember) { d.y -= 1 + d.s * 1.5; d.x += Math.sin(d.ph) * 0.7; if (d.y < -520) { d.y = 0; d.x = R(w) * W; } }
        else { d.y += 0.5 + d.s * 0.6; d.x += Math.sin(d.ph) * 0.5 + 0.2; if (d.y > 5) { d.y = -540; d.x = R(w) * W; } }
      },
      draw(ctx, w) {
        for (const d of w.drops) {
          if (d.ember) { ctx.globalAlpha = Math.max(0, 1 + d.y / 520); ctx.fillStyle = d.s > 0.5 ? '#ffb347' : '#ff4a1a'; ctx.fillRect(Math.round(d.x), Math.round(d.y), 2, 2); }
          else { ctx.globalAlpha = 0.6; ctx.fillStyle = '#6a6460'; ctx.fillRect(Math.round(d.x), Math.round(d.y), 3, 2); }
        }
        ctx.globalAlpha = 1;
      },
      overlay(ctx, Wd, H, w) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, 'rgba(255,70,20,0.16)'); g.addColorStop(1, 'rgba(60,10,0,0.18)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, Wd, H);
        const v = ctx.createRadialGradient(Wd / 2, H / 2, H * 0.3, Wd / 2, H / 2, H);
        v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(20,0,0,0.38)');
        ctx.fillStyle = v; ctx.fillRect(0, 0, Wd, H);
      },
    },
    /* FORTALEZA DO DEV (chefe): cristais vermelhos/roxos flutuando, raios
       roxos no ceu e o feixe do nucleo pulsando no alto da torre. */
    nucleo: {
      want: 30,
      spawn(d, w) { d.x = R(w) * W; d.y = -120 - R(w) * 380; d.s = R(w); d.ph = R(w) * 6.28; d.red = R(w) < 0.5; },
      move(d, w) { d.ph += 0.02; d.y += Math.sin(d.ph) * 0.3; d.x += Math.cos(d.ph * 0.7) * 0.2; },
      draw(ctx, w) {
        for (const d of w.drops) {
          const sz = 3 + d.s * 5;
          ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.ph);
          ctx.globalAlpha = 0.75;
          ctx.fillStyle = d.red ? '#ff3a5a' : '#a35bff';
          ctx.beginPath(); ctx.moveTo(0, -sz); ctx.lineTo(sz * 0.6, 0); ctx.lineTo(0, sz); ctx.lineTo(-sz * 0.6, 0); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      },
      overlay(ctx, Wd, H, w) {
        /* feixe do nucleo descendo da torre (pulsa; mais forte no evento) */
        const boost = w.game._nucleo > 0 ? 0.25 : 0;
        const p = 0.10 + 0.06 * Math.sin(w.t * 0.07) + boost;
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(Wd / 2 - 30, 0, Wd / 2 + 30, 0);
        g.addColorStop(0, 'rgba(255,40,90,0)'); g.addColorStop(0.5, 'rgba(255,60,110,' + p.toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,40,90,0)');
        ctx.fillStyle = g; ctx.fillRect(Wd / 2 - 30, 0, 60, H * 0.62);
        /* raio roxo de vez em quando */
        if ((w.t % 260) < 6) {
          ctx.strokeStyle = 'rgba(200,140,255,0.8)'; ctx.lineWidth = 2;
          const x0 = (w.t * 37) % Wd;
          ctx.beginPath(); ctx.moveTo(x0, 0); for (let k = 1; k < 6; k++) ctx.lineTo(x0 + ((k * 53) % 40) - 20, k * 30); ctx.stroke();
          ctx.fillStyle = 'rgba(160,90,255,0.08)'; ctx.fillRect(0, 0, Wd, H);
        }
        ctx.globalCompositeOperation = 'source-over';
        const v = ctx.createRadialGradient(Wd / 2, H / 2, H * 0.3, Wd / 2, H / 2, H);
        v.addColorStop(0, 'rgba(30,0,40,0)'); v.addColorStop(1, 'rgba(30,0,40,0.40)');
        ctx.fillStyle = v; ctx.fillRect(0, 0, Wd, H);
      },
    },
  });
  /* chao molhado da ponte escorrega igual chuva */
  const fr = Weather.prototype.friction;
  Weather.prototype.friction = function () { const e = WEATHER_EXT[this.kind]; return e && e.friction ? e.friction : fr.call(this); };
  /* medidor: sol da praca +5%, nucleo da fortaleza +8% (pros dois) */
  if (typeof Fighter !== 'undefined') {
    const mr = Fighter.prototype.meterRate;
    Fighter.prototype.meterRate = function () {
      let m = mr.call(this);
      const k = this.game && this.game.weather && this.game.weather.kind;
      if (k === 'hellosol') m *= 1.05;
      if (k === 'nucleo') m *= 1.08;
      return m;
    };
  }

  Object.assign(WEATHER_INFO, {
    hellosol: { name: 'Pôr do Sol do Hello World', icon: '🌅', desc: 'Luz dourada e símbolos de código no ar. Medidor +5% para os dois.' },
    vagafloresta: { name: 'Luz da Floresta', icon: '🌿', desc: 'Feixes de sol, vagalumes e folhas. O ar puro cura bem devagar.' },
    nevoacache: { name: 'Névoa do Cache', icon: '💧', desc: 'Névoa azul das cachoeiras. A ponte molhada escorrega.' },
    fornalha: { name: 'Fornalha Acesa', icon: '🔥', desc: 'Fagulhas, vapor e a luz da fornalha pulsando.' },
    cinzasgit: { name: 'Cinzas do Repositório', icon: '🌋', desc: 'Cinzas caindo, brasas subindo e o céu em chamas.' },
    nucleo: { name: 'Núcleo Instável', icon: '💠', desc: 'Cristais flutuantes, raios roxos e o feixe do núcleo. Medidor +8%.' },
  });

  /* ---------------- EVENTOS DE BATALHA (mecanicas) ---------------- */
  const pick = (g) => { const v = g.fighters().filter((f) => f.alive); return v[(RG(g) * v.length) | 0]; };
  Object.assign(MECHS, {
    /* PRACA: o chafariz do meio dispara um jato que lanca quem estiver nele */
    chafariz: {
      every: 480,
      fire(g) {
        g.hazard({ x: 480, label: 'CHAFARIZ!', sheet: ['fx2:water', 2], dmg: 5, w: 120, launch: -12, warnColor: '#7ad8ff', delay: 50, sound: 'water', scale: 2 });
      },
    },
    /* FLORESTA: raizes de DEPENDENCIA CIRCULAR prendem um lutador */
    raizes: {
      every: 520,
      fire(g) {
        const a = pick(g);
        if (!a) return;
        g.hazard({ x: a.x, label: 'DEPENDÊNCIA CIRCULAR!', sheet: ['fx2:arcane', 1], dmg: 4, trap: 70, launch: 0, w: 120, warnColor: '#7dff6a', delay: 46, sound: 'hazard' });
      },
    },
    /* PONTE: CACHE HIT (recarga dos dois cai pela metade) ou CACHE MISS
       (jato da cachoeira por baixo da ponte) */
    cachehit: {
      every: 540,
      fire(g) {
        if (RG(g) < 0.5) {
          for (const f of g.fighters()) for (let i = 0; i < f.cd.length; i++) f.cd[i] = Math.floor(f.cd[i] / 2);
          g.floatText(480, -330, 'CACHE HIT! recargas pela metade', '#7ad8ff');
          g.audio.play('magic', { vol: 0.25 });
        } else {
          const a = pick(g);
          if (a) g.hazard({ x: a.x, label: 'CACHE MISS!', sheet: ['fx2:water', 1], dmg: 6, w: 110, launch: -10, warnColor: '#4ab8ff', delay: 48, sound: 'water', scale: 2 });
        }
      },
    },
    /* FABRICA: esteira empurra pro lado e a PRENSA desce no meio-direita */
    esteira: {
      every: 460,
      tick(g, t) {
        g.pushX = Math.sin(t * 0.004) > 0 ? 0.35 : -0.35;
        if (g._prensa > 0) g._prensa--;
      },
      fire(g) {
        g._prensa = 60;
        g.hazard({ x: 610, label: 'BUILD FAILED!', sheet: ['fx2:fire', 1], dmg: 9, w: 150, launch: -8, burn: 90, warnColor: '#ff8a2a', delay: 56, sound: 'explosion', fromSky: true, scale: 2.2 });
      },
    },
    /* CIDADE GIT: MERGE CONFLICT (meteoro em chamas num lutador) e as vezes
       REBASE (os dois trocam de lugar) */
    mergeconflict: {
      every: 500,
      fire(g) {
        if (RG(g) < 0.3) {
          const [a, b] = g.activePair ? g.activePair() : g.fighters();
          if (a && b && a.alive && b.alive) {
            const t = a.x; a.x = b.x; b.x = t;
            a.dir = b.x >= a.x ? 1 : -1; b.dir = -a.dir;
            g.floatText(480, -320, 'REBASE! trocaram de lugar', '#ffb347');
            g.audio.play('whoosh', { vol: 0.3 });
            return;
          }
        }
        const a = pick(g);
        if (a) g.hazard({ x: a.x, label: 'MERGE CONFLICT!', sheet: ['fx2:fire', 1], dmg: 8, w: 110, launch: -7, burn: 80, warnColor: '#ff4a1a', fromSky: true, delay: 54, sound: 'fire', scale: 2 });
      },
    },
    /* FORTALEZA: SOBRECARGA DO NUCLEO — 3 raios roxos caem com aviso */
    sobrecarga: {
      every: 560,
      tick(g) { if (g._nucleo > 0) g._nucleo--; },
      fire(g) {
        g._nucleo = 70;
        g.floatText(480, -340, 'SOBRECARGA DO NÚCLEO!', '#ff4a8a');
        const base = 120 + RG(g) * 200;
        for (let k = 0; k < 3; k++) g.hazard({ x: base + k * 260, label: null, sheet: ['fx2:lightning', 3], dmg: 7, w: 100, launch: -6, warnColor: '#c06bff', fromSky: true, delay: 50 + k * 10, sound: k === 0 ? 'thunder_cast' : null, scale: 1.9 });
      },
    },
  });
  Object.assign(MECH_INFO, {
    chafariz: 'CHAFARIZ: o jato do meio dispara de tempos em tempos e lança quem estiver nele.',
    raizes: 'DEPENDÊNCIA CIRCULAR: raízes brotam embaixo de um lutador e prendem.',
    cachehit: 'CACHE: ou as recargas caem pela metade (HIT) ou um jato sobe da cachoeira (MISS).',
    esteira: 'FÁBRICA: a esteira empurra e a prensa desce no meio-direita (BUILD FAILED).',
    mergeconflict: 'GIT: meteoros de MERGE CONFLICT e REBASE que troca os lutadores de lugar.',
    sobrecarga: 'NÚCLEO: sobrecarga solta três raios roxos pela arena.',
  });

  /* ---------------- MAPAS ---------------- */
  const TOR = [
    { id: 'torneio-praca-hello-world', name: 'Praça Hello World', weather: ['hellosol'], mech: 'chafariz', tint: '#ffc070', fauna: ['pigeons', 'birds'], lights: [{ x: 90, y: 60, r: 120, color: '255,220,140', pulse: 0.4 }, { x: 455, y: 110, r: 90, color: '255,220,140', pulse: 0.4 }], ambient: 'amb_park' },
    { id: 'torneio-floresta-dependencias', name: 'Floresta de Dependências', weather: ['vagafloresta'], mech: 'raizes', tint: '#8aff8a', fauna: ['butterfly', 'bird'], lights: [{ x: 560, y: 260, r: 120, color: '255,230,140', pulse: 0.5 }, { x: 880, y: 230, r: 90, color: '255,230,140', pulse: 0.5 }], ambient: 'amb_park' },
    { id: 'torneio-ponte-do-cache', name: 'Ponte do Cache', weather: ['nevoacache'], mech: 'cachehit', tint: '#6ad0ff', fauna: ['birds'], lights: [{ x: 480, y: 520, r: 240, color: '70,170,255', pulse: 0.8 }, { x: 60, y: 420, r: 60, color: '255,200,120', pulse: 0.4 }, { x: 900, y: 420, r: 60, color: '255,200,120', pulse: 0.4 }], ambient: 'amb_rain' },
    { id: 'torneio-fabrica-de-builds', name: 'Fábrica de Builds', weather: ['fornalha'], mech: 'esteira', tint: '#ff9a3a', fauna: [], sparks: true, lights: [{ x: 620, y: 360, r: 220, color: '255,140,40', pulse: 0.9 }], ambient: 'amb_workshop' },
    { id: 'torneio-cidade-git', name: 'Cidade Git Destruída', weather: ['cinzasgit'], mech: 'mergeconflict', tint: '#ff6a3a', fauna: ['bat'], embers: true, lights: [{ x: 300, y: 420, r: 90, color: '255,120,40', pulse: 0.9 }, { x: 650, y: 400, r: 90, color: '255,120,40', pulse: 0.9 }], ambient: 'amb_night' },
    { id: 'torneio-fortaleza-do-dev', name: 'Fortaleza do Dev', weather: ['nucleo'], mech: 'sobrecarga', tint: '#ff4a8a', fauna: ['bat'], embers: true, lights: [{ x: 480, y: 120, r: 200, color: '255,40,100', pulse: 0.8 }, { x: 40, y: 460, r: 70, color: '255,120,40', pulse: 0.9 }, { x: 920, y: 460, r: 70, color: '255,120,40', pulse: 0.9 }], ambient: 'amb_night' },
  ];
  for (const s of TOR) {
    if (STAGE_LIST.some((x) => x.id === s.id)) continue;
    STAGE_LIST.push(Object.assign({ image: 'assets/maps/' + s.id + '.jpg', group: 'Torneio', motes: true }, s));
  }
  /* ordem do torneio: 6 rivais nos 6 mapas e o chefe na Fortaleza */
  TORNEIO.stages = TOR.map((s) => s.id);
})();
