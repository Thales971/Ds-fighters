/* ============================================================
   DS FIGHTERS — Sprites procedurais em pixel-art (desenhados em
   canvas, sem imagens externas). Cada lutador é montado a partir
   da paleta + traços físicas declarados em fighters.js.
   ============================================================ */

const SpriteGen = {
  cache: new Map(),

  key(def, pose, frame, dir) {
    return def.id + '|' + pose + '|' + frame + '|' + dir;
  },

  get(def, pose, frame, dir) {
    const k = this.key(def, pose, frame, dir);
    if (this.cache.has(k)) return this.cache.get(k);
    const c = document.createElement('canvas');
    c.width = 96; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    this.drawFighter(ctx, def, pose, frame, dir);
    this.cache.set(k, c);
    return c;
  },

  getFlash(def, pose, frame, dir) {
    const k = this.key(def, pose, frame, dir) + '|flash';
    if (this.cache.has(k)) return this.cache.get(k);
    const src = this.get(def, pose, frame, dir);
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(src, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    this.cache.set(k, c);
    return c;
  },

  clear() { this.cache.clear(); },

  drawFighter(ctx, def, pose, frame, dir) {
    const C = def.colors, T = def.traits || {};
    ctx.save();
    ctx.translate(48, 124);
    if (dir === -1) ctx.scale(-1, 1);
    const bob = (pose === 'idle' || pose === 'walk') ? Math.sin(frame * 0.5) * 2 : 0;
    const crouch = pose === 'crouch' ? 10 : 0;
    ctx.translate(0, -bob - crouch);

    const punchExt = pose === 'punch' ? 14 + Math.sin(Math.min(frame / 8, 1) * Math.PI) * 10 : 0;
    const kickExt = pose === 'kick' ? 18 + Math.sin(Math.min(frame / 10, 1) * Math.PI) * 12 : 0;
    const jumpY = pose === 'jump' ? -26 : 0;
    const hitTilt = pose === 'hit' ? -6 : 0;
    const koRot = pose === 'ko' ? -1.4 : 0;
    ctx.rotate(hitTilt * Math.PI / 180 + koRot * (pose === 'ko' ? Math.min(frame / 20, 1) : 0));
    ctx.translate(0, jumpY);

    const W = T.muscular || T.tank ? 1.25 : 1.0;   // largura do tronco
    const legSpread = pose === 'walk' ? Math.sin(frame) * 6 : 0;

    // pernas
    ctx.fillStyle = C.pants;
    ctx.fillRect(-10 * W + legSpread * 0.4, -46, 9, 46);
    ctx.fillRect(2 * W - legSpread * 0.4, -46, 9, 46);
    // sapatos
    ctx.fillStyle = C.shoes;
    ctx.fillRect(-12 * W + legSpread * 0.4, -6, 13, 6);
    ctx.fillRect(0 * W - legSpread * 0.4, -6, 13, 6);

    // tronco (camisa / terno / jaleco / moletom)
    ctx.fillStyle = C.shirt;
    const torsoH = 44;
    ctx.fillRect(-13 * W, -46 - torsoH + 4, 26 * W, torsoH);
    if (T.suit) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(-3, -46 - torsoH + 6, 6, torsoH - 12);
      ctx.fillStyle = C.accent;
      ctx.fillRect(-2, -46 - torsoH + 10, 4, 12);
    }
    if (T.hoodie) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(-13 * W, -46 - torsoH + 4, 26 * W, 8);
    }
    if (T.cardigan) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(-13 * W, -46 - torsoH + 4, 5, torsoH);
      ctx.fillRect(8 * W, -46 - torsoH + 4, 5, torsoH);
    }
    if (T.vest) {
      ctx.fillStyle = C.accent;
      ctx.fillRect(-13 * W, -46 - torsoH + 4, 26 * W, 6);
    }

    // braços
    const armY = -46 - torsoH + 10;
    ctx.fillStyle = C.skin;
    if (pose === 'punch') {
      ctx.fillRect(8 * W, armY, 10 + punchExt, 9);
      ctx.fillStyle = C.shirt;
      ctx.fillRect(-12 * W, armY, 8, 9);
    } else if (pose === 'kick') {
      ctx.fillRect(-12 * W, armY, 8, 9);
      ctx.fillRect(8 * W - kickExt * 0.3, armY, 8, 9);
    } else if (pose === 'block') {
      ctx.fillStyle = C.shirt;
      ctx.fillRect(4 * W, armY - 6, 12, 10);
      ctx.fillRect(-14 * W, armY, 8, 9);
    } else {
      const swing = Math.sin(frame * 0.5) * 3;
      ctx.fillStyle = C.shirt;
      ctx.fillRect(-15 * W, armY + swing, 8, 9);
      ctx.fillRect(8 * W, armY - swing, 8, 9);
      ctx.fillStyle = C.skin;
      ctx.fillRect(-15 * W, armY + 8 + swing, 7, 12);
      ctx.fillRect(8 * W, armY + 8 - swing, 7, 12);
    }
    // soco na mão estendida
    if (pose === 'punch') {
      ctx.fillStyle = C.skin;
      ctx.fillRect(16 * W + punchExt, armY - 2, 10, 13);
    }
    // chute na perna estendida
    if (pose === 'kick') {
      ctx.fillStyle = C.pants;
      ctx.fillRect(4, -34, 10 + kickExt, 9);
      ctx.fillStyle = C.shoes;
      ctx.fillRect(12 + kickExt, -36, 10, 12);
    }

    // cabeça
    const headY = -46 - torsoH - 16;
    ctx.fillStyle = C.skin;
    ctx.fillRect(-11, headY, 22, 20);
    // cabelo / careca
    if (T.bald) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(-11, headY, 22, 4);
    } else if (T.hairStyle === 'long') {
      ctx.fillStyle = C.hair;
      ctx.fillRect(-13, headY - 4, 26, 26);
      ctx.fillRect(-13, headY, 4, 18);
      ctx.fillRect(9, headY, 4, 18);
    } else if (T.hairStyle === 'slick' || T.hairStyle === 'bun') {
      ctx.fillStyle = C.hair;
      ctx.fillRect(-11, headY - 3, 22, 7);
      if (T.hairStyle === 'bun') { ctx.beginPath(); ctx.arc(0, headY - 6, 6, 0, Math.PI * 2); ctx.fill(); }
    } else if (T.ponytail) {
      ctx.fillStyle = C.hair;
      ctx.fillRect(-11, headY - 3, 22, 7);
      ctx.fillRect(-16, headY + 2, 6, 16);
    } else {
      ctx.fillStyle = C.hair;
      ctx.fillRect(-11, headY - 4, 22, 8);
    }
    // touca / capuz / capacete
    if (T.hood) {
      ctx.fillStyle = C.shirt;
      ctx.fillRect(-13, headY - 6, 26, 10);
    }
    if (T.helmet) {
      ctx.fillStyle = '#f5c542';
      ctx.fillRect(-12, headY - 6, 24, 9);
      ctx.fillStyle = '#b8860b';
      ctx.fillRect(-12, headY + 1, 24, 3);
    }
    if (T.cap) {
      ctx.fillStyle = '#2b2b2b';
      ctx.fillRect(-11, headY - 6, 22, 6);
      ctx.fillRect(2, headY - 4, 12, 4); // aba pra trás
    }
    // barba
    if (T.beard === 'full') {
      ctx.fillStyle = C.hair;
      ctx.fillRect(-11, headY + 10, 22, 12);
      ctx.fillRect(-8, headY + 20, 16, 6);
    } else if (T.beard === 'short') {
      ctx.fillStyle = C.hair;
      ctx.fillRect(-10, headY + 12, 20, 8);
    }
    // óculos
    if (T.glasses) {
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      if (T.glasses === 'round') {
        ctx.beginPath(); ctx.arc(-5, headY + 7, 5, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(6, headY + 7, 5, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, headY + 7); ctx.lineTo(1, headY + 7); ctx.stroke();
      } else {
        ctx.strokeRect(-10, headY + 3, 8, 8);
        ctx.strokeRect(3, headY + 3, 8, 8);
        ctx.beginPath(); ctx.moveTo(-2, headY + 7); ctx.lineTo(3, headY + 7); ctx.stroke();
      }
    }
    // visor / múltiplos olhos
    if (T.visor) {
      ctx.fillStyle = 'rgba(255,215,0,0.85)';
      ctx.fillRect(-10, headY + 4, 20, 6);
    }
    if (T.multipleEyes) {
      ctx.fillStyle = '#000';
      for (let i = -1; i <= 1; i++) { ctx.fillRect(i * 7 - 1, headY + 7, 3, 3); }
      // tubos do All For One
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-13, headY + 20); ctx.lineTo(-18, headY + 40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(13, headY + 20); ctx.lineTo(18, headY + 40); ctx.stroke();
    }
    // máscara ninja
    if (T.mask) {
      ctx.fillStyle = 'rgba(20,20,25,0.9)';
      ctx.fillRect(-11, headY + 4, 22, 10);
      ctx.fillStyle = C.accent;
      ctx.fillRect(-10, headY + 7, 20, 3);
    }
    // cicatriz (Du)
    if (T.scar) {
      ctx.strokeStyle = 'rgba(180,40,40,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-8, headY + 2); ctx.lineTo(-2, headY + 14); ctx.stroke();
    }
    // corrente (Felipinho)
    if (T.chain) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-10, -46 - torsoH + 6); ctx.quadraticCurveTo(0, -46 - torsoH + 20, 10, -46 - torsoH + 6); ctx.stroke();
      ctx.fillStyle = '#ffd700';
      ctx.beginPath(); ctx.arc(0, -46 - torsoH + 17, 4, 0, Math.PI * 2); ctx.fill();
    }
    // prancheta (QA)
    if (T.clipboard) {
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(-22, -30, 12, 16);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-20, -28, 8, 12);
    }
    // giz (Senpai)
    if (T.chalk) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(14 * W, -20, 8, 4);
    }

    // aura do super
    if (pose === 'super') {
      ctx.globalAlpha = 0.5 + Math.sin(frame * 0.8) * 0.2;
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, -50, 40 + Math.sin(frame * 0.8) * 5, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  },
};
