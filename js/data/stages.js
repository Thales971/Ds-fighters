/* ============================================================
   DS FIGHTERS — 6 cenários com parallax, clima e obstáculos.
   cam desloca as camadas em velocidades diferentes.
   ============================================================ */

function stageFloorY(h) { return h - 60; }

function fillSky(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  const n = stops.length - 1;
  stops.forEach((c, i) => g.addColorStop(n === 0 ? 0 : i / n, c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function wrap(v, m) {
  return ((v % m) + m) % m;
}

function stars(ctx, w, h, t, count, cam, alpha) {
  for (let i = 0; i < count; i++) {
    const x = wrap(i * 173.3 - cam * 0.08 + (i % 5) * 3, w);
    const y = (i * 97.7) % (h * 0.62);
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.4 + i));
    ctx.fillStyle = `rgba(255,255,255,${alpha * tw})`;
    ctx.fillRect(x, y, i % 9 === 0 ? 2 : 1, i % 9 === 0 ? 2 : 1);
  }
}

function crowdRow(ctx, x0, y, n, gap, t, colors) {
  for (let i = 0; i < n; i++) {
    const bob = Math.sin(t * 2.4 + i * 0.7) * 2.2;
    const cx = x0 + i * gap;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(cx, y + 8 + bob, gap - 3, 16);
    ctx.fillStyle = i % 3 === 0 ? '#f0c8a0' : '#c68642';
    ctx.beginPath();
    ctx.arc(cx + (gap - 3) / 2, y + 6 + bob, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

const STAGES = [
  {
    id: 'server-room',
    name: 'Sala de Servidores',
    sky: ['#070b18', '#12305c', '#081018'],
    draw(ctx, w, h, t, cam) {
      const floor = stageFloorY(h);
      fillSky(ctx, w, h, this.sky);
      ctx.fillStyle = '#05070f';
      ctx.fillRect(0, 0, w, 28);
      for (let i = 0; i < 14; i++) {
        const x = wrap(i * 90 - cam * 0.05, w + 40) - 20;
        ctx.strokeStyle = 'rgba(80,140,180,0.25)';
        ctx.beginPath();
        ctx.moveTo(x, 18);
        ctx.quadraticCurveTo(x + 30, 36 + (i % 3) * 6, x + 70, 18);
        ctx.stroke();
      }
      for (let r = 0; r < 9; r++) {
        const rx = wrap(r * 140 - cam * 0.22, w + 120) - 60;
        const rh = 150 + (r % 3) * 36;
        const ry = floor - rh - 30;
        ctx.fillStyle = '#0c1424';
        ctx.fillRect(rx, ry, 78, rh);
        ctx.fillStyle = '#18243a';
        ctx.fillRect(rx + 4, ry + 4, 70, rh - 8);
        for (let s = 0; s < 7; s++) {
          ctx.fillStyle = '#070b12';
          ctx.fillRect(rx + 8, ry + 10 + s * 20, 62, 12);
          for (let l = 0; l < 5; l++) {
            const on = Math.sin(t * 3.2 + r * 2 + s * 1.7 + l) > 0.05;
            ctx.fillStyle = on ? (l % 2 ? '#39ffb0' : '#ffb020') : '#122033';
            ctx.fillRect(rx + 12 + l * 11, ry + 14 + s * 20, 6, 4);
          }
        }
      }
      ctx.fillStyle = 'rgba(120,220,255,0.05)';
      ctx.fillRect(w * 0.3, 0, 80, floor);
      ctx.fillRect(w * 0.62, 0, 50, floor);
      const g = ctx.createLinearGradient(0, floor - 50, 0, floor);
      g.addColorStop(0, 'rgba(80,180,255,0)');
      g.addColorStop(1, 'rgba(80,180,255,0.16)');
      ctx.fillStyle = g;
      ctx.fillRect(0, floor - 50, w, 50);
      ctx.fillStyle = '#070b12';
      ctx.fillRect(-40, floor, w + 80, h - floor);
      ctx.strokeStyle = 'rgba(80,255,190,0.28)';
      ctx.lineWidth = 1;
      for (let x = -40; x < w + 40; x += 36) {
        const sx = x - wrap(cam, 36);
        ctx.beginPath();
        ctx.moveTo(sx, floor);
        ctx.lineTo(sx - 28, h);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(0,255,170,0.35)';
      ctx.fillRect(0, floor, w, 2);
    },
    drawFg(ctx, w, h) {
      const floor = stageFloorY(h);
      ctx.fillStyle = 'rgba(4,8,16,0.55)';
      ctx.fillRect(0, floor - 220, 26, 220);
      ctx.fillRect(w - 26, floor - 240, 26, 240);
    },
    obstacles: [
      {
        x: 0.28, w: 0.08, type: 'server-rack', label: 'RACK FRIO',
        onEnter(f) { f.slowUntil = f.now + 100; f.flashText('Ping alto!'); },
      },
      {
        x: 0.66, w: 0.08, type: 'server-rack', label: 'RACK QUENTE',
        onEnter(f) { f.burnUntil = f.now + 160; f.flashText('CPU fervendo!'); },
      },
    ],
  },
  {
    id: 'github-arena',
    name: 'Arena do Commit',
    sky: ['#140824', '#2a1258', '#1a0a28'],
    draw(ctx, w, h, t, cam) {
      const floor = stageFloorY(h);
      fillSky(ctx, w, h, this.sky);
      stars(ctx, w, h * 0.7, t, 70, cam, 0.8);
      ctx.fillStyle = '#1a0c30';
      ctx.beginPath();
      ctx.moveTo(0, floor - 40);
      ctx.lineTo(0, floor - 150);
      ctx.lineTo(w, floor - 170);
      ctx.lineTo(w, floor - 30);
      ctx.fill();
      const standX = -((cam * 0.35) % (36 * 4));
      for (let row = 0; row < 3; row++) {
        const y = floor - 250 + row * 26;
        const colors = ['#3a2068', '#542878', '#2a1848'];
        crowdRow(ctx, standX + (row % 2) * 10 - 20, y, 30, 34, t + row, colors);
      }
      const cx = w * 0.5 - cam * 0.12;
      const cy = h * 0.3;
      const R = 78 + Math.sin(t * 1.6) * 6;
      ctx.strokeStyle = 'rgba(255,90,160,0.85)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(120,220,255,0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx - R * 0.72, cy + R * 0.42, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + R * 0.72, cy + R * 0.42, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - R * 0.72, cy + R * 0.42);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + R * 0.72, cy + R * 0.42);
      ctx.stroke();
      ctx.fillStyle = '#100818';
      ctx.fillRect(-20, floor, w + 40, h - floor);
      ctx.strokeStyle = 'rgba(255,80,150,0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const off = -cam;
      ctx.moveTo(-20, floor + 18);
      for (let x = -20; x <= w + 20; x += 16) ctx.lineTo(x + off * 0, floor + 18 + Math.sin(x * 0.04 + t * 2) * 5);
      ctx.stroke();
      for (let i = 0; i < 7; i++) {
        const x = wrap(t * 70 + i * 160 - cam, w + 40) - 20;
        ctx.fillStyle = i % 2 ? '#ff4f8b' : '#7ad7ff';
        ctx.beginPath();
        ctx.arc(x, floor + 28, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,120,180,0.45)';
      ctx.fillRect(0, floor, w, 2);
    },
    obstacles: [
      {
        x: 0.46, w: 0.1, type: 'merge-conflict', label: 'CONFLITO',
        onEnter(f) { f.stunUntil = f.now + 36; f.flashText('Conflito de merge!'); },
      },
    ],
  },
  {
    id: 'matrix-rain',
    name: 'Chuva de Código',
    sky: ['#010805', '#042014', '#010805'],
    draw(ctx, w, h, t, cam) {
      const floor = stageFloorY(h);
      ctx.fillStyle = '#010805';
      ctx.fillRect(0, 0, w, h);
      const glow = ctx.createRadialGradient(w / 2, floor, 40, w / 2, floor, h * 0.8);
      glow.addColorStop(0, 'rgba(0,80,40,0.45)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#02140c';
      ctx.beginPath();
      ctx.moveTo(0, floor - 10);
      for (let x = 0; x <= w; x += 40) {
        const y = floor - 80 - ((x * 3 + 40) % 70) - cam * 0.02;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, floor);
      ctx.fill();
      const layers = [
        { cols: 28, speed: 90, size: 11, alpha: 0.28, factor: 0.15 },
        { cols: 36, speed: 150, size: 14, alpha: 0.55, factor: 0.35 },
        { cols: 22, speed: 220, size: 16, alpha: 0.9, factor: 0.55 },
      ];
      layers.forEach((layer) => {
        ctx.font = layer.size + 'px monospace';
        for (let c = 0; c < layer.cols; c++) {
          const x = wrap(c * (w / layer.cols) - cam * layer.factor, w);
          const speed = layer.speed + (c % 4) * 20;
          const head = ((t * speed + c * 137) % (h + 80)) - 40;
          for (let k = 0; k < 10; k++) {
            const ch = String.fromCharCode(0x30a0 + ((c * 17 + k * 9 + ((t * 8) | 0)) % 80));
            const a = layer.alpha * (1 - k / 10);
            ctx.fillStyle = k === 0 ? `rgba(210,255,230,${a})` : `rgba(0,255,120,${a})`;
            ctx.fillText(ch, x, head - k * layer.size);
          }
        }
      });
      ctx.fillStyle = '#02140c';
      ctx.fillRect(0, floor, w, h - floor);
      ctx.fillStyle = 'rgba(0,255,140,0.08)';
      for (let c = 0; c < 18; c++) {
        const x = c * (w / 18);
        ctx.fillRect(x, floor + 4, 10, 8 + (c % 5) * 6);
      }
      ctx.fillStyle = 'rgba(80,255,170,0.55)';
      ctx.fillRect(0, floor, w, 2);
    },
    drawFg(ctx, w, h, t) {
      ctx.font = '18px monospace';
      for (let i = 0; i < 8; i++) {
        const x = (i * 137 + t * 40) % w;
        const y = (i * 90 + t * 80) % (h * 0.5);
        ctx.fillStyle = 'rgba(180,255,210,0.35)';
        ctx.fillText(String.fromCharCode(0x30a0 + ((i * 13 + (t * 6 | 0)) % 50)), x, y);
      }
    },
    obstacles: [
      {
        x: 0.24, w: 0.07, type: 'glitch', label: 'GLITCH',
        onEnter(f) { f.invertControlsUntil = f.now + 110; f.flashText('Controles invertidos!'); },
      },
      {
        x: 0.7, w: 0.07, type: 'glitch', label: 'BUG',
        onEnter(f) { f.bugUntil = f.now + 140; f.flashText('Dano dobrado!'); },
      },
    ],
  },
  {
    id: 'dev-desk',
    name: 'Mesa do Dev',
    sky: ['#1c130c', '#3a2616', '#24160e'],
    draw(ctx, w, h, t, cam) {
      const floor = stageFloorY(h);
      fillSky(ctx, w, h, this.sky);
      ctx.fillStyle = '#0e1c30';
      ctx.fillRect(w * 0.68 - cam * 0.08, h * 0.06, w * 0.26, h * 0.36);
      ctx.strokeStyle = '#5a3a22';
      ctx.lineWidth = 6;
      ctx.strokeRect(w * 0.68 - cam * 0.08, h * 0.06, w * 0.26, h * 0.36);
      ctx.fillStyle = '#f4e2b0';
      ctx.beginPath();
      ctx.arc(w * 0.82 - cam * 0.08, h * 0.16, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (let i = 0; i < 10; i++) {
        ctx.fillRect(w * 0.7 + (i * 23) % (w * 0.2), h * 0.1 + (i * 17) % (h * 0.2), 2, 2);
      }
      ctx.fillStyle = '#2a180e';
      ctx.fillRect(40 - cam * 0.12, 50, 110, 130);
      ctx.fillStyle = '#ff5a4a';
      ctx.font = 'bold 28px monospace';
      ctx.fillText('404', 62 - cam * 0.12, 100);
      ctx.fillStyle = '#ffd7a8';
      ctx.font = '11px monospace';
      ctx.fillText('sem café', 58 - cam * 0.12, 122);
      const mx = w * 0.34 - cam * 0.2;
      const my = 70;
      ctx.fillStyle = '#1a120c';
      ctx.fillRect(mx - 16, my - 16, 250, 160);
      ctx.fillStyle = '#07120c';
      ctx.fillRect(mx, my, 218, 128);
      ctx.font = '12px monospace';
      const lines = ['function luta() {', '  if (hp <= 0)', '    return ko;', '  return soco();', '}', '// deploy?'];
      lines.forEach((line, i) => {
        ctx.fillStyle = i % 2 ? '#8dffb0' : '#7fd0ff';
        ctx.fillText(line, mx + 10, my + 22 + i * 18);
      });
      const caret = Math.sin(t * 6) > 0;
      if (caret) {
        ctx.fillStyle = '#d6ffe6';
        ctx.fillRect(mx + 108, my + 108, 8, 12);
      }
      const keyY = floor - 150;
      for (let i = 0; i < 16; i++) {
        const kx = 30 + i * 58 - wrap(cam * 0.45, 58);
        const wave = Math.sin(t * 3 + i * 0.45);
        ctx.fillStyle = `hsl(${(i * 24 + t * 40) % 360} 80% ${42 + wave * 10}%)`;
        ctx.fillRect(kx, keyY, 48, 18);
        ctx.fillStyle = '#22180f';
        ctx.fillRect(kx + 4, keyY + 18, 40, 70);
        ctx.fillStyle = '#3a2a1c';
        ctx.fillRect(kx + 8, keyY + 26, 32, 28);
      }
      ctx.fillStyle = '#6b4428';
      ctx.fillRect(-30, floor - 8, w + 60, 10);
      ctx.fillStyle = '#4a3018';
      ctx.fillRect(-30, floor, w + 60, h - floor);
      for (let i = 0; i < 8; i++) {
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        const x = i * (w / 7) - wrap(cam, w / 7);
        ctx.beginPath();
        ctx.moveTo(x, floor);
        ctx.lineTo(x + 10, h);
        ctx.stroke();
      }
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(w * 0.78, floor - 36, 22, 28);
      ctx.strokeStyle = '#e8e8e8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w * 0.78 + 26, floor - 24, 6, -1, 1);
      ctx.stroke();
      for (let s = 0; s < 3; s++) {
        const sy = floor - 48 - ((t * 28 + s * 14) % 26);
        ctx.fillStyle = `rgba(230,230,230,${0.45 - s * 0.12})`;
        ctx.fillRect(w * 0.78 + 6 + s * 4, sy, 3, 10);
      }
    },
    obstacles: [
      {
        x: 0.22, w: 0.08, type: 'coffee', label: 'CAFÉ',
        onEnter(f) { f.speedBoostUntil = f.now + 180; f.flashText('Café! Mais rápido'); },
      },
      {
        x: 0.58, w: 0.08, type: 'energy-drink', label: 'ENERGÉTICO',
        onEnter(f) { f.gainSuper(28); f.flashText('+ super'); },
      },
    ],
  },
  {
    id: 'cloud-sky',
    name: 'Nuvem',
    sky: ['#7ec8ff', '#d8f0ff', '#f8e2b0'],
    draw(ctx, w, h, t, cam) {
      const floor = stageFloorY(h);
      fillSky(ctx, w, h, ['#5eb0f0', '#b9e2ff', '#ffe7b0']);
      ctx.fillStyle = '#ffe28a';
      ctx.beginPath();
      ctx.arc(w * 0.8 - cam * 0.05, h * 0.16, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,220,140,0.35)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + t * 0.2;
        ctx.beginPath();
        ctx.moveTo(w * 0.8 + Math.cos(a) * 44, h * 0.16 + Math.sin(a) * 44);
        ctx.lineTo(w * 0.8 + Math.cos(a) * 70, h * 0.16 + Math.sin(a) * 70);
        ctx.stroke();
      }
      for (let i = 0; i < 4; i++) {
        const nx = wrap(t * (12 + i * 8) + i * 280 - cam * (0.15 + i * 0.08), w + 280) - 140;
        const ny = 70 + i * 48;
        ctx.fillStyle = 'rgba(255,255,255,0.82)';
        ctx.beginPath();
        ctx.arc(nx, ny, 26, 0, Math.PI * 2);
        ctx.arc(nx + 28, ny - 10, 20, 0, Math.PI * 2);
        ctx.arc(nx + 52, ny, 22, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 5; i++) {
        const ix = wrap(i * 220 - cam * 0.25 + 40, w + 160) - 80;
        const iy = floor - 120 - (i % 3) * 24;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.ellipse(ix, iy, 50, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7d5a3a';
        ctx.fillRect(ix - 8, iy - 28, 16, 22);
        ctx.fillStyle = '#3d8f4a';
        ctx.beginPath();
        ctx.arc(ix, iy - 34, 12, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 8; i++) {
        const px = wrap(i * 130 + t * (28 + i * 6) - cam * 0.4, w);
        const py = floor - 40 - ((t * (24 + i * 9) + i * 50) % 220);
        ctx.fillStyle = i % 2 ? '#7dffa8' : '#8fd4ff';
        ctx.fillRect(px, py, 12, 8);
      }
      for (let i = 0; i < 4; i++) {
        const bx = wrap(t * 30 + i * 200 - cam * 0.2, w);
        const by = 50 + (i % 3) * 20 + Math.sin(t * 2 + i) * 6;
        ctx.strokeStyle = 'rgba(40,60,80,0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx - 8, by + 6);
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + 8, by + 6);
        ctx.stroke();
      }
      const fg = ctx.createLinearGradient(0, floor - 36, 0, h);
      fg.addColorStop(0, '#ffffff');
      fg.addColorStop(0.25, '#d5e9fb');
      fg.addColorStop(1, '#8eb4d8');
      ctx.fillStyle = fg;
      ctx.fillRect(-20, floor - 18, w + 40, h - floor + 18);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 10; i++) {
        const x = wrap(i * 110 - cam, w + 80) - 40;
        ctx.beginPath();
        ctx.ellipse(x, floor - 8, 40, 16, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    drawFg(ctx, w, h, t, cam) {
      const x = wrap(t * 18 - cam * 1.15, w + 200) - 100;
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.beginPath();
      ctx.ellipse(x, 36, 70, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    },
    obstacles: [
      {
        x: 0.48, w: 0.12, type: 'cloud-platform', label: 'BUCKET',
        onEnter(f) {
          f.vy = -12.5;
          f.y = -0.2;
          f.state = 'jump';
          f.flashText('Upload!');
        },
      },
    ],
  },
  {
    id: 'neon-city',
    name: 'Cidade Neon',
    sky: ['#12061f', '#2a0a3e', '#07030f'],
    draw(ctx, w, h, t, cam) {
      const floor = stageFloorY(h);
      fillSky(ctx, w, h, this.sky);
      stars(ctx, w, h * 0.4, t, 40, cam, 0.55);
      ctx.fillStyle = '#f2e6c0';
      ctx.beginPath();
      ctx.arc(w * 0.14 - cam * 0.04, 54, 14, 0, Math.PI * 2);
      ctx.fill();
      for (let b = 0; b < 10; b++) {
        const bw = 54 + (b % 4) * 18;
        const bh = 120 + ((b * 47) % 90);
        const bx = wrap(b * 110 - cam * 0.18, w + bw) - bw;
        ctx.fillStyle = '#140818';
        ctx.fillRect(bx, floor - bh, bw, bh);
      }
      const signs = [
        { text: '404', color: '#ff3d8a' },
        { text: 'DEPLOY', color: '#3dfff0' },
        { text: 'BUG', color: '#ffe14a' },
        { text: 'JS', color: '#b388ff' },
        { text: 'NULL', color: '#ff7a3d' },
      ];
      for (let b = 0; b < 8; b++) {
        const bw = 70 + (b % 3) * 26;
        const bh = 180 + ((b * 53) % 120);
        const bx = wrap(b * 130 - cam * 0.45, w + bw) - 20;
        ctx.fillStyle = '#0c0614';
        ctx.fillRect(bx, floor - bh, bw, bh);
        for (let wy = 16; wy < bh - 24; wy += 22) {
          for (let wx = 8; wx < bw - 14; wx += 16) {
            const on = Math.sin(t * 2 + b + wx * 0.2 + wy) > 0;
            ctx.fillStyle = on ? (b % 2 ? 'rgba(0,240,255,0.9)' : 'rgba(255,60,200,0.85)') : 'rgba(30,16,40,0.9)';
            ctx.fillRect(bx + wx, floor - bh + wy, 8, 12);
          }
        }
        if (b % 2 === 0) {
          const sign = signs[(b / 2) % signs.length];
          const on = Math.sin(t * 5 + b) > -0.15;
          ctx.fillStyle = on ? sign.color : '#221018';
          ctx.font = 'bold 16px monospace';
          ctx.fillText(sign.text, bx + 8, floor - bh + 18);
        }
      }
      const neonOn = Math.sin(t * 4) > -0.2;
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = neonOn ? '#39fff2' : '#0a3a40';
      ctx.fillText('DEV CITY', w / 2 - cam * 0.1, 108);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#07040e';
      ctx.fillRect(0, floor, w, h - floor);
      for (let x = 0; x < w; x += 22) {
        const hh = 10 + Math.abs(Math.sin(t * 2 + x * 0.05)) * 26;
        ctx.fillStyle = x % 44 < 22 ? 'rgba(0,240,255,0.14)' : 'rgba(255,60,200,0.12)';
        ctx.fillRect(wrap(x - cam, w), floor + 4, 8, hh);
      }
      ctx.fillStyle = 'rgba(80,255,255,0.35)';
      ctx.fillRect(0, floor, w, 2);
      for (let i = 0; i < 2; i++) {
        const cx = wrap(t * (90 + i * 40) + i * 400 - cam, w + 80) - 40;
        ctx.fillStyle = 'rgba(255,240,180,0.35)';
        ctx.fillRect(cx, floor - 8, 36, 4);
      }
    },
    drawFg(ctx, w, h, t) {
      ctx.strokeStyle = 'rgba(190,220,255,0.28)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 70; i++) {
        const x = wrap(i * 47 + t * 220, w + 30) - 10;
        const y = wrap(i * 31 + t * 460, h + 30) - 10;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 5, y + 14);
        ctx.stroke();
      }
    },
    obstacles: [
      {
        x: 0.32, w: 0.07, type: 'neon-sign', label: 'CHOQUE',
        onEnter(f) {
          f.shockUntil = f.now + 28;
          f.hp = Math.max(1, f.hp - 4);
          f.flashText('Choque!');
          if (f.game) {
            f.game.spawnSparks(f.x, -60, '#7ef6ff', 12);
            f.game.shake(5);
          }
        },
      },
      {
        x: 0.68, w: 0.07, type: 'neon-sign', label: 'FÚRIA',
        onEnter(f) { f.rageUntil = f.now + 160; f.flashText('Fúria: dano x2'); },
      },
    ],
  },
];
