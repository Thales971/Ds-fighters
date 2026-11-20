/* ============================================================
   DS FIGHTERS — Sprites em pixel art (sheets geradas + fallback).
   O layout vem de assets/sprites/layout.js.

   IMPORTANTE (bug dos "gigantes"): layout.js já mudou de geometria
   (96x128 com drawScale 2, depois 320x260 com drawScale 1) e o
   navegador de quem joga pode ficar com uma cópia velha em cache.
   Como as folhas agora são sempre 4 colunas x N poses, a geometria
   real é derivada da IMAGEM carregada — se o layout discordar, ele
   é corrigido na hora. Assim layout velho não deixa mais o boneco
   gigante, com o pé dentro do chão ou fatiado ao meio.
   ============================================================ */

const SpriteGen = {
  _preloaded: {},
  /* PRELOAD: aquece os sprites de todo o elenco (chamado no menu) —
     mata o hitch da primeira vez que cada lutador aparece na selecao. */
  preloadAll() {
    for (const [id, src] of Object.entries((typeof SPRITE_LAYOUT !== 'undefined' && SPRITE_LAYOUT.files) || {})) {
      if (this._preloaded[id]) continue;
      try {
        const img = new Image();
        img.onload = () => { this.images[id] = img; this._preloaded[id] = true; };
        img.src = src;
        this._preloaded[id] = img;
      } catch (e) { /* sem DOM */ }
    }
  },
  images: {},
  _flash: null,
  // Poses canônicas do motor — a ordem é a linha na folha (4x15).
  POSES: ['idle', 'walk', 'jump', 'crouch', 'punch', 'kick', 'cpunch', 'ckick',
    'jpunch', 'jkick', 'special', 'hit', 'block', 'ko', 'win'],
  COLS: 4,
  CELL_W: 320,
  CELL_H: 260,
  FEET_MARGIN: 14,   // na célula 320x260 o pé fica em y=246 (246 = 260 - 14)
  fixes: [],         // o que foi corrigido (diagnóstico na tela)

  url(id) {
    const src = (SPRITE_LAYOUT.files || {})[id] || 'assets/sprites/' + id + '.png';
    // v=... serve pra invalidar cache: SEMPRE bump quando o PNG mudar.
    // v18-balance: rebalanceamento geral + cromo buff
    return src + '?v=v47-maresprites';
  },
  faceUrl(id) {
    return `assets/ui/face-${id}.png?v=spritefix-4x15d`;
  },
  load() {
    const files = SPRITE_LAYOUT.files || {};
    // União layout + elenco: se o layout em cache for velho e não listar os
    // lutadores novos, as folhas deles ainda são pedidas pelo caminho padrão.
    const ids = new Set(Object.keys(files));
    if (typeof FIGHTERS !== 'undefined' && Array.isArray(FIGHTERS)) {
      FIGHTERS.forEach((f) => { if (f && f.id) ids.add(f.id); });
    }
    ids.forEach((id) => {
      const img = new Image();
      img.onload = () => { this.images[id] = img; this.reconcile(img, id); };
      img.onerror = () => { this.images[id] = null; };
      img.src = SpriteGen.url(id);
    });
  },

  /* Geometria canônica esperada pra uma imagem (w x h).
     Folha = COLS colunas x poses.length linhas. */
  geometryFor(w, h, poseCount) {
    const poses = poseCount || this.POSES.length;
    const cols = this.COLS;
    let rows = poses;
    if (h % rows !== 0) {
      // folha legada (ex.: 4x8 = 2080px): escolhe o número de linhas que
      // produz uma célula de altura plausível
      const cand = [poses, 8, 5, 4].filter((n) => n > 0 && h % n === 0 && (h / n) >= 150 && (h / n) <= 420);
      rows = cand[0] || rows;
    }
    const cellW = Math.round(w / cols);
    const cellH = Math.round(h / rows);
    return {
      cols, rows, poses: poses,
      frameW: cellW, frameH: cellH,
      baseline: Math.max(1, cellH - this.FEET_MARGIN),
      drawScale: 1,
    };
  },

  /* Compara a imagem real com o layout em cache e conserta o layout.
     Retorna true se precisou corrigir. */
  reconcile(img, id) {
    const L = SPRITE_LAYOUT;
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return false;
    const posesCount = (L.poses && L.poses.length) || this.POSES.length;
    const want = this.geometryFor(w, h, posesCount);
    const ok = L.frameW === want.frameW && L.frameH === want.frameH
      && L.baseline === want.baseline && (L.drawScale || 1) === 1
      && (L.cols || this.COLS) === want.cols
      && (L.poses ? L.poses.length === want.rows : true);
    if (ok) return false;
    const before = `${L.frameW}x${L.frameH}@${L.drawScale || 1} base ${L.baseline}`;
    L.cols = want.cols;
    L.frameW = want.frameW;
    L.frameH = want.frameH;
    L.baseline = want.baseline;
    L.drawScale = 1;
    if (!L.poses || L.poses.length !== want.rows) L.poses = this.POSES.slice(0, want.rows);
    const msg = `layout.js desatualizado (${before} -> ${want.frameW}x${want.frameH}@1 base ${want.baseline})`;
    if (!this.fixes.includes(msg)) this.fixes.push(msg);
    return true;
  },

  /* Altura esperada da folha com a geometria atual. */
  expectedHeight() {
    return ((SPRITE_LAYOUT.poses && SPRITE_LAYOUT.poses.length) || this.POSES.length) * SPRITE_LAYOUT.frameH;
  },

  count(pose, id) {
    const own = SPRITE_LAYOUT.perFighter && SPRITE_LAYOUT.perFighter[id];
    const n = (own && own.frames && own.frames[pose])
      || SPRITE_LAYOUT.frames[pose] || SPRITE_LAYOUT.frames.idle || 1;
    // nunca pedir mais frames do que colunas na folha (layout velho podia dizer 8)
    return Math.max(1, Math.min(n, SPRITE_LAYOUT.cols || this.COLS));
  },

  rowOf(pose, id) {
    const own = SPRITE_LAYOUT.perFighter && SPRITE_LAYOUT.perFighter[id];
    if (own && own.rows && Number.isInteger(own.rows[pose])) return own.rows[pose];
    const poses = SPRITE_LAYOUT.poses || this.POSES;
    const i = poses.indexOf(pose);
    return i < 0 ? Math.max(0, this.POSES.indexOf(pose)) : i;
  },

  /* Âncora da CABEÇA na célula da pose: primeira linha com pixel opaco,
     centro horizontal dela. Cacheada por lutador+pose (frame 0 basta).
     Fallback = centro-topo da célula. Usada pra pendurar acessórios
     universais (gorro de natal...) em qualquer lutador sem ajuste manual. */
  headAnchor(id, pose) {
    const key = id + '|' + pose;
    if (this._headCache && this._headCache[key]) return this._headCache[key];
    const L = SPRITE_LAYOUT;
    let a = { x: L.frameW / 2, y: 34 };
    const img = this.images[id];
    if (img && img.naturalWidth && typeof document !== 'undefined') {
      try {
        const row = Math.min(Math.max(0, this.rowOf(pose, id)), (L.poses ? L.poses.length : this.POSES.length) - 1);
        const c = document.createElement('canvas');
        c.width = L.frameW; c.height = L.frameH;
        const x = c.getContext('2d');
        if (x && x.getImageData) {
          x.drawImage(img, 0 * L.frameW, row * L.frameH, L.frameW, L.frameH, 0, 0, L.frameW, L.frameH);
          const d = x.getImageData(0, 0, L.frameW, L.frameH).data;
          scan:
          for (let yy = 0; yy < L.frameH; yy++) {
            let mn = -1, mx = -1;
            for (let xx = 0; xx < L.frameW; xx++) {
              if (d[(yy * L.frameW + xx) * 4 + 3] > 12) { if (mn < 0) mn = xx; mx = xx; }
            }
            if (mn >= 0) { a = { x: (mn + mx) / 2, y: yy }; break scan; }
          }
        }
      } catch (e) { /* sem canvas/readback: usa o fallback */ }
    }
    (this._headCache = this._headCache || {})[key] = a;
    return a;
  },

  /* CAIXA DA CABEÇA na célula da pose (frame 0): topo = 1ª linha com >= 4 px
     opacos (ignora pixel solto); largura = quartil inferior das larguras das
     linhas logo abaixo do topo (rabo de cavalo/mecha alargam só algumas linhas);
     centro = mediana dos centros dessas linhas estreitas. Usada pra encaixar os
     acessórios (gorro, boné, óculos...) do tamanho da cabeça de cada lutador. */
  headBox(id, pose) {
    const key = id + '|' + pose;
    if (this._headBoxCache && this._headBoxCache[key]) return this._headBoxCache[key];
    const L = SPRITE_LAYOUT;
    let box = { x: L.frameW / 2, y: 34, w: 46, h: 53 };
    const img = this.images[id];
    if (img && img.naturalWidth !== 0 && (img.naturalWidth || img.width) && typeof document !== 'undefined') {
      try {
        const row = Math.min(Math.max(0, this.rowOf(pose, id)), (L.poses ? L.poses.length : this.POSES.length) - 1);
        const c = document.createElement('canvas');
        c.width = L.frameW; c.height = L.frameH;
        const x = c.getContext('2d');
        if (x && x.getImageData) {
          x.drawImage(img, 0, row * L.frameH, L.frameW, L.frameH, 0, 0, L.frameW, L.frameH);
          const d = x.getImageData(0, 0, L.frameW, L.frameH).data;
          const rows = [];
          let top = -1;
          for (let yy = 0; yy < L.frameH; yy++) {
            let mn = -1, mx = -1, cnt = 0;
            for (let xx = 0; xx < L.frameW; xx++) {
              if (d[(yy * L.frameW + xx) * 4 + 3] > 40) { if (mn < 0) mn = xx; mx = xx; cnt++; }
            }
            if (top < 0 && cnt >= 4) top = yy;
            if (top >= 0) rows.push(cnt ? { w: mx - mn + 1, c: (mn + mx) / 2 } : null);
            if (top >= 0 && yy > top + 30) break;
          }
          const band = rows.slice(6, 26).filter(Boolean);
          if (top >= 0 && band.length >= 4) {
            const ws = band.map((r) => r.w).sort((a, b) => a - b);
            const w = Math.max(18, Math.min(90, ws[Math.floor(ws.length * 0.25)]));
            const narrow = band.filter((r) => r.w <= w * 1.25).map((r) => r.c).sort((a, b) => a - b);
            const cx = narrow.length ? narrow[Math.floor(narrow.length / 2)] : L.frameW / 2;
            box = { x: cx, y: top, w, h: w * 1.15 };
          }
        }
      } catch (e) { /* sem canvas/readback: usa o fallback */ }
    }
    (this._headBoxCache = this._headBoxCache || {})[key] = box;
    return box;
  },

  blit(ctx, id, pose, frame, dir, centerX, feetY, white = false, scale = null, xf = null, skinHue = 0) {
    const L = SPRITE_LAYOUT;
    // poseScale por lutador (ex.: hit compacto da Mis/Kimi, pivô no pé).
    const own = L.perFighter && L.perFighter[id];
    const poseScale = own && own.poseScale && own.poseScale[pose];
    const sc = scale || poseScale || L.drawScale;
    const fw = L.frameW;
    const fh = L.frameH;
    const n = this.count(pose, id);
    const col = ((frame % n) + n) % n;
    const rows = L.poses ? L.poses.length : this.POSES.length;
    const row = Math.min(Math.max(0, this.rowOf(pose, id)), Math.max(0, rows - 1));
    const dw = fw * sc;
    const dh = fh * sc;
    const top = Math.round(feetY - L.baseline * sc);

    ctx.save();
    if (skinHue === -1) { try { ctx.filter = 'grayscale(1)'; } catch (e) {} }
    else if (skinHue) { try { ctx.filter = `hue-rotate(${skinHue}deg)`; } catch (e) {} }
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(centerX + (xf ? xf.dx * dir : 0)), top + (xf ? xf.dy : 0));
    if (xf && (xf.sx !== 1 || xf.sy !== 1 || xf.rot)) {
      // pivô no pé: o boneco estica/achata/inclina sem sair do chão
      const py = L.baseline * sc;
      ctx.translate(0, py);
      if (xf.rot) ctx.rotate(xf.rot * dir);
      ctx.scale(xf.sx, xf.sy);
      ctx.translate(0, -py);
    }
    if (dir < 0) ctx.scale(-1, 1);

    const img = this.images[id];
    if (img) {
      if (white) {
        const c = this._flash || (this._flash = document.createElement('canvas'));
        if (c.width !== fw) { c.width = fw; c.height = fh; }
        const fx = c.getContext('2d');
        fx.clearRect(0, 0, fw, fh);
        fx.drawImage(img, col * fw, row * fh, fw, fh, 0, 0, fw, fh);
        fx.globalCompositeOperation = 'source-in';
        fx.fillStyle = '#ffffff';
        fx.fillRect(0, 0, fw, fh);
        fx.globalCompositeOperation = 'source-over';
        ctx.drawImage(c, Math.round(-dw / 2), 0, dw, dh);
      } else {
        ctx.drawImage(img, col * fw, row * fh, fw, fh, Math.round(-dw / 2), 0, dw, dh);
      }
    } else {
      this.drawFallback(ctx, id, pose, frame, dw, dh);
    }
    ctx.restore();
  },

  drawFallback(ctx, id, pose, frame, dw, dh) {
    const def = (typeof FIGHTERS !== 'undefined' && FIGHTERS.find((f) => f.id === id)) || null;
    const C = (def && def.colors) || {};
    const bob = (pose === 'idle' || pose === 'walk') ? Math.sin(frame) * 2 : 0;
    const kick = pose === 'kick' || pose === 'jkick' || pose === 'ckick';
    const punch = pose === 'punch' || pose === 'jpunch' || pose === 'cpunch' || pose === 'special';
    ctx.save();
    ctx.translate(0, bob);
    const s = dw / 96;
    const skin = C.skin || '#e0a56e';
    const shirt = C.shirt || '#335';
    const pants = C.pants || '#333';
    const shoe = C.shoes || '#111';
    const hair = C.hair || '#222';
    ctx.fillStyle = pants;
    ctx.fillRect(-8 * s, dh - 58 * s, 7 * s, 28 * s);
    ctx.fillRect(2 * s, dh - 58 * s, 7 * s, 28 * s);
    if (kick) ctx.fillRect(8 * s, dh - 70 * s, 26 * s, 6 * s);
    ctx.fillStyle = shoe;
    ctx.fillRect(-9 * s, dh - 32 * s, 8 * s, 6 * s);
    ctx.fillRect(2 * s, dh - 32 * s, 8 * s, 6 * s);
    ctx.fillStyle = shirt;
    ctx.fillRect(-12 * s, dh - 92 * s, 24 * s, 36 * s);
    ctx.fillStyle = skin;
    ctx.fillRect(-10 * s, dh - 118 * s, 20 * s, 22 * s);
    ctx.fillStyle = hair;
    ctx.fillRect(-10 * s, dh - 122 * s, 20 * s, 6 * s);
    ctx.fillStyle = skin;
    if (punch) ctx.fillRect(10 * s, dh - 84 * s, 22 * s, 6 * s);
    else ctx.fillRect(-20 * s, dh - 80 * s, 8 * s, 18 * s);
    ctx.fillRect(12 * s, dh - 80 * s, 8 * s, 18 * s);
    ctx.restore();
  },
};

SpriteGen.load();
