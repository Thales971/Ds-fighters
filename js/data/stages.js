/* ============================================================
   DS FIGHTERS — Estágios (6 cenários animados + obstáculos)
   Cada estágio define paleta, camadas de fundo animadas (draw),
   e obstáculos com comportamento (onTouch = função chamada quando
   um lutador passa por cima / bate no obstáculo).
   ============================================================ */

const STAGES = [
  {
    id: 'server-room',
    name: 'Sala de Servidores',
    sky: ['#0b1030', '#16205c', '#0b1030'],
    draw(ctx, w, h, t) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, this.sky[0]);
      g.addColorStop(0.6, this.sky[1]);
      g.addColorStop(1, this.sky[2]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // estrellas / LEDs piscando
      for (let i = 0; i < 40; i++) {
        const x = (i * 173.3) % w;
        const y = (i * 97.7) % (h * 0.5);
        const blink = Math.sin(t * 2 + i) > 0.4;
        ctx.fillStyle = blink ? 'rgba(0,255,170,0.9)' : 'rgba(0,255,170,0.15)';
        ctx.fillRect(x, y, 2, 2);
      }
      // racks de servidor com LEDs animados
      for (let r = 0; r < 5; r++) {
        const rx = 30 + r * (w / 5.4);
        const rh = h * 0.55, ry = h - rh - 60;
        ctx.fillStyle = '#101828';
        ctx.fillRect(rx, ry, w / 6.5, rh);
        ctx.strokeStyle = '#1f2c47';
        ctx.strokeRect(rx, ry, w / 6.5, rh);
        for (let s = 0; s < 8; s++) {
          ctx.fillStyle = '#05080f';
          ctx.fillRect(rx + 6, ry + 8 + s * (rh / 9), w / 6.5 - 12, rh / 11);
          for (let l = 0; l < 4; l++) {
            const on = Math.sin(t * 3 + r * 7 + s * 3 + l * 1.7) > 0;
            ctx.fillStyle = on ? (l % 2 ? '#00ffaa' : '#ffb300') : '#12202f';
            ctx.fillRect(rx + 9 + l * 9, ry + 10 + s * (rh / 9), 4, 3);
          }
        }
      }
      // piso
      ctx.fillStyle = '#0a0f1c';
      ctx.fillRect(0, h - 60, w, 60);
      ctx.strokeStyle = 'rgba(0,255,170,0.25)';
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, h - 60); ctx.lineTo(x - 20, h); ctx.stroke();
      }
    },
    obstacles: [
      {
        x: 0.30, w: 0.07, type: 'server-rack',
        label: 'RACK FRIO',
        onEnter(f) { f.slowUntil = f.now + 1200; f.flashText('SLOW! Ping alto...'); },
      },
      {
        x: 0.62, w: 0.07, type: 'server-rack',
        label: 'RACK QUENTE',
        onEnter(f) { f.burnUntil = f.now + 2500; f.flashText('Throttling de CPU!'); },
      },
    ],
  },
  {
    id: 'github-arena',
    name: 'Arena GitHub',
    sky: ['#160b2e', '#2a1152', '#160b2e'],
    draw(ctx, w, h, t) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, this.sky[0]);
      g.addColorStop(0.6, this.sky[1]);
      g.addColorStop(1, this.sky[2]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // círculo do git (merge) pulsante
      const cx = w / 2, cy = h * 0.32, R = 70 + Math.sin(t * 1.5) * 8;
      ctx.strokeStyle = 'rgba(240,80,140,0.8)';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(120,220,255,0.8)';
      ctx.beginPath(); ctx.arc(cx - R * 0.7, cy + R * 0.5, 14, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + R * 0.7, cy + R * 0.5, 14, 0, Math.PI * 2); ctx.stroke();
      // estrelas
      for (let i = 0; i < 50; i++) {
        const x = (i * 211.7) % w, y = (i * 131.3) % (h * 0.6);
        ctx.fillStyle = `rgba(255,255,255,${0.2 + 0.5 * Math.abs(Math.sin(t + i))})`;
        ctx.fillRect(x, y, 2, 2);
      }
      // piso de commits (linhas git)
      ctx.fillStyle = '#120a24';
      ctx.fillRect(0, h - 60, w, 60);
      ctx.strokeStyle = 'rgba(240,80,140,0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, h - 45);
      for (let x = 0; x <= w; x += 20) {
        ctx.lineTo(x, h - 45 + Math.sin(x * 0.05 + t * 2) * 6);
      }
      ctx.stroke();
      // "commits" rolando no chão
      for (let i = 0; i < 6; i++) {
        const x = ((t * 60 + i * 180) % (w + 60)) - 30;
        ctx.fillStyle = '#f0508c';
        ctx.beginPath(); ctx.arc(x, h - 25, 6, 0, Math.PI * 2); ctx.fill();
      }
    },
    obstacles: [
      {
        x: 0.42, w: 0.08, type: 'merge-conflict',
        label: 'MERGE CONFLICT',
        onEnter(f) { f.stunUntil = f.now + 900; f.flashText('CONFLITO DE MERGE!'); },
      },
    ],
  },
  {
    id: 'matrix-rain',
    name: 'Chuva de Código',
    sky: ['#020a06', '#04160c', '#020a06'],
    draw(ctx, w, h, t) {
      ctx.fillStyle = this.sky[0];
      ctx.fillRect(0, 0, w, h);
      ctx.font = '14px monospace';
      for (let c = 0; c < 60; c++) {
        const x = c * 16;
        const speed = 40 + (c % 5) * 25;
        const y = ((t * speed + c * 137) % (h + 100)) - 50;
        for (let k = 0; k < 12; k++) {
          const ch = String.fromCharCode(0x30A0 + ((c * 31 + k * 7 + (t * 10 | 0)) % 90));
          const a = 1 - k / 12;
          ctx.fillStyle = k === 0 ? '#baffdc' : `rgba(0,255,110,${a * 0.8})`;
          ctx.fillText(ch, x, y - k * 14);
        }
      }
      ctx.fillStyle = '#03130a';
      ctx.fillRect(0, h - 50, w, 50);
    },
    obstacles: [
      {
        x: 0.25, w: 0.06, type: 'glitch',
        label: 'GLITCH',
        onEnter(f) { f.invertControlsUntil = f.now + 1500; f.flashText('GLITCH! Controles invertidos'); },
      },
      {
        x: 0.70, w: 0.06, type: 'glitch',
        label: 'BUG',
        onEnter(f) { f.bugUntil = f.now + 2000; f.flashText('BUG! Dano dobrado'); },
      },
    ],
  },
  {
    id: 'dev-desk',
    name: 'Mesa do Dev',
    sky: ['#1a120b', '#3a2415', '#1a120b'],
    draw(ctx, w, h, t) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, this.sky[0]);
      g.addColorStop(0.7, this.sky[1]);
      g.addColorStop(1, this.sky[2]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // janela com luar
      ctx.fillStyle = '#0d1b2e';
      ctx.fillRect(w * 0.72, h * 0.08, w * 0.22, h * 0.4);
      ctx.fillStyle = '#cfe8ff';
      ctx.beginPath(); ctx.arc(w * 0.83, h * 0.18, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (let i = 0; i < 8; i++) ctx.fillRect(w * 0.74 + (i * 37) % (w * 0.18), h * 0.1 + (i * 53) % (h * 0.3), 2, 2);
      // pôster "404"
      ctx.fillStyle = '#241408';
      ctx.fillRect(w * 0.08, h * 0.12, 90, 110);
      ctx.fillStyle = '#ff5544';
      ctx.font = 'bold 26px monospace';
      ctx.fillText('404', w * 0.08 + 22, h * 0.12 + 50);
      ctx.fillStyle = '#ffd27d';
      ctx.font = '10px monospace';
      ctx.fillText('PAINEL NOT FOUND', w * 0.08 + 8, h * 0.12 + 70);
      // mesa
      ctx.fillStyle = '#4a2f18';
      ctx.fillRect(0, h - 110, w, 14);
      ctx.fillStyle = '#33200f';
      ctx.fillRect(0, h - 96, w, 96);
      // monitor piscando código
      const mx = w * 0.38, my = h - 190;
      ctx.fillStyle = '#0a0f0a';
      ctx.fillRect(mx, my, 150, 80);
      ctx.strokeStyle = '#3a2a18';
      ctx.lineWidth = 4;
      ctx.strokeRect(mx, my, 150, 80);
      ctx.font = '9px monospace';
      for (let l = 0; l < 7; l++) {
        const line = 'const x=' + ((t * 20 + l * 13) % 100) + '; // ' + 'abcdef'.repeat(2 + (l % 3));
        ctx.fillStyle = l % 2 ? '#7dffb0' : '#4fc3f7';
        ctx.fillText(line.slice(0, 24), mx + 6, my + 12 + l * 10);
      }
      // caneca de café fumegante
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(w * 0.62, h - 132, 18, 22);
      for (let s = 0; s < 3; s++) {
        const sy = h - 140 - ((t * 30 + s * 12) % 30);
        ctx.fillStyle = `rgba(200,200,200,${0.5 - s * 0.15})`;
        ctx.fillRect(w * 0.62 + 4 + s * 3, sy, 3, 8);
      }
    },
    obstacles: [
      {
        x: 0.55, w: 0.05, type: 'coffee',
        label: 'CAFÉ',
        onEnter(f) { f.speedBoostUntil = f.now + 2000; f.flashText('CAFÉ! Velocidade +'); },
      },
      {
        x: 0.36, w: 0.05, type: 'energy-drink',
        label: 'ENERGÉTICO',
        onEnter(f) { f.superGain = (f.superGain || 0) + 30; f.flashText('+30 SUPER!'); },
      },
    ],
  },
  {
    id: 'cloud-sky',
    name: 'Nuvem (Cloud)',
    sky: ['#0a2a4a', '#1a5a8a', '#0a2a4a'],
    draw(ctx, w, h, t) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, this.sky[0]);
      g.addColorStop(0.6, this.sky[1]);
      g.addColorStop(1, this.sky[2]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // sol
      ctx.fillStyle = '#ffd76e';
      ctx.beginPath(); ctx.arc(w * 0.85, h * 0.15, 26, 0, Math.PI * 2); ctx.fill();
      // nuvens em movimento
      for (let i = 0; i < 5; i++) {
        const nx = ((t * (10 + i * 6) + i * 260) % (w + 240)) - 120;
        const ny = h * (0.12 + i * 0.1);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(nx, ny, 22, 0, Math.PI * 2);
        ctx.arc(nx + 24, ny - 8, 18, 0, Math.PI * 2);
        ctx.arc(nx + 48, ny, 20, 0, Math.PI * 2);
        ctx.fill();
      }
      // "pacotes" trafegando (dados subindo)
      ctx.font = '12px monospace';
      for (let i = 0; i < 8; i++) {
        const px = (i * 149.3) % w;
        const py = h - 80 - ((t * (30 + i * 12) + i * 90) % (h * 0.6));
        ctx.fillStyle = 'rgba(140,255,190,0.9)';
        ctx.fillRect(px, py, 12, 8);
        ctx.fillStyle = 'rgba(20,60,40,0.9)';
        ctx.fillText('▚', px + 2, py + 7);
      }
      // plataforma flutuante (nuvem sólida)
      ctx.fillStyle = '#0d3a5c';
      ctx.fillRect(0, h - 60, w, 60);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(0, h - 60, w, 6);
    },
    obstacles: [
      {
        x: 0.47, w: 0.09, type: 'cloud-platform',
        label: 'BUCKET S3',
        onEnter(f) { f.bounceUntil = f.now + 800; f.vy = -14; f.flashText('Upload! Subindo no bucket'); },
      },
    ],
  },
  {
    id: 'neon-city',
    name: 'Cidade Neon',
    sky: ['#12041f', '#2d0a4a', '#12041f'],
    draw(ctx, w, h, t) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, this.sky[0]);
      g.addColorStop(0.65, this.sky[1]);
      g.addColorStop(1, this.sky[2]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // prédios com janelas neon piscando
      for (let b = 0; b < 8; b++) {
        const bw = 70 + (b % 3) * 25;
        const bx = b * (w / 7.4);
        const bh = h * (0.35 + ((b * 37) % 30) / 100);
        ctx.fillStyle = '#0d0618';
        ctx.fillRect(bx, h - 60 - bh, bw, bh);
        for (let wy = 0; wy < bh - 20; wy += 22) {
          for (let wx = 8; wx < bw - 12; wx += 18) {
            const on = Math.sin(t * 1.8 + b * 5 + wx * 0.7 + wy) > 0.1;
            ctx.fillStyle = on ? (b % 2 ? 'rgba(0,240,255,0.9)' : 'rgba(255,60,220,0.9)') : 'rgba(40,20,60,0.8)';
            ctx.fillRect(bx + wx, h - 60 - bh + 10 + wy, 10, 14);
          }
        }
      }
      // letreiro gigante piscando
      const neonOn = Math.sin(t * 4) > -0.2;
      ctx.font = 'bold 30px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = neonOn ? '#00f0ff' : '#083a44';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = neonOn ? 22 : 0;
      ctx.fillText('DEV CITY', w / 2, h * 0.16);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
      // chão molhado refletindo
      ctx.fillStyle = '#0a0512';
      ctx.fillRect(0, h - 60, w, 60);
      ctx.fillStyle = 'rgba(0,240,255,0.12)';
      for (let x = 0; x < w; x += 24) {
        const hh = 8 + Math.abs(Math.sin(t * 2 + x)) * 20;
        ctx.fillRect(x, h - 58 + (x % 48), 6, hh);
      }
    },
    obstacles: [
      {
        x: 0.33, w: 0.05, type: 'neon-sign',
        label: 'PLACA NEON',
        onEnter(f) { f.shockUntil = f.now + 1200; f.flashText('CHOQUE 220V!'); },
      },
      {
        x: 0.64, w: 0.05, type: 'neon-sign',
        label: 'OUTDOOR',
        onEnter(f) { f.rageUntil = f.now + 2500; f.flashText('MODO FÚRIA: dano x2'); },
      },
    ],
  },
];
