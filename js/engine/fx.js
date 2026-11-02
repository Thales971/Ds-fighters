/* ============================================================
   DS FIGHTERS — Carregador de arte e blit de spritesheets.
   Art.cell() é o único caminho de desenho de sprites de efeito:
   nada de formas desenhadas à mão para poderes.
   ============================================================ */
const ART_SHEETS = {
  // habilidades: 4 col x 5 lin, 128px
  ...Object.fromEntries(['du', 'iales', 'felipinho', 'stack', 'gitmaster', 'bughunter', 'frontend', 'backend', 'devops', 'qa', 'scrum', 'fullstack', 'kotlin', 'hacker', 'java', 'merc', 'bhm', 'zoya', 'rin', 'noir', 'xeon', 'urbano', 'qwen', 'dolynho', 'thl', 'lobao']
    .map((id) => ['abil:' + id, { src: 'assets/abilities/' + id + '.png', size: 128, cols: 4 }])),
  ...Object.fromEntries([['kimi', 'water'], ['deepseek', 'water'], ['dandara-query', 'platforms']]
    .map(([id, art]) => ['abil:' + id, { src: 'assets/fx2/' + art + '.png', size: 64, cols: 4, rows: 4 }])),
  ...Object.fromEntries(['winx-exe', 'nina-vector']
    .map((id) => ['abil:' + id, { src: 'assets/abilities/' + id + '.png', size: 128, cols: 4, rows: 5 }])),
  // pacote retrô nativo: 4x4, 64px
  ...Object.fromEntries(['impact', 'fire', 'water', 'lightning', 'chaos', 'arcane', 'birds', 'ai-symbols', 'platforms']
    .map((id) => ['fx2:' + id, { src: 'assets/fx2/' + id + '.png', size: 64, cols: 4 }])),
  ...Object.fromEntries(['winx-exe', 'nina-vector']
    .map((id) => ['fx2:' + id, { src: 'assets/abilities/' + id + '.png', size: 128, cols: 4, rows: 5 }])),
  pets: { src: 'assets/pets/pets.png', size: 96, cols: 4 },
  pickups: { src: 'assets/pickups/pickups.png', size: 64, cols: 4 },
  fauna: { src: 'assets/fauna/fauna.png', size: 48, cols: 4 },
};

const Art = {
  images: {},
  url(src) {
    if (/(?:winx-exe|nina-vector)\.png$/.test(src)) return src + '?v=expansion-v8';
    return /(?:lobao|iales|pets)\.png$/.test(src) ? src + '?v=stable-loop-mistral-v1' : src;
  },
  load() {
    Object.entries(ART_SHEETS).forEach(([key, s]) => {
      const img = new Image();
      img.onload = () => { this.images[key] = img; };
      img.src = this.url(s.src);
    });
  },
  ready(key) { const i = this.images[key]; return !!(i && i.naturalWidth); },
  /* Desenha a célula (row, col) centrada em (x, y). */
  cell(ctx, key, row, col, x, y, opts = {}) {
    const img = this.images[key];
    const s = ART_SHEETS[key];
    if (!img || !s) return false;
    const n = s.cols;
    const c = ((col % n) + n) % n;
    const rowCount = s.rows || 5;
    const r = ((row % rowCount) + rowCount) % rowCount;
    const sc = opts.scale || 1;
    const dw = s.size * sc;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (opts.alpha != null) ctx.globalAlpha *= opts.alpha;
    if (opts.add) ctx.globalCompositeOperation = 'lighter';
    ctx.translate(Math.round(x), Math.round(y));
    if (opts.rot) ctx.rotate(opts.rot);
    if (opts.dir < 0) ctx.scale(-1, 1);
    if (opts.sy) ctx.scale(1, opts.sy);
    const ax = opts.anchor === 'bottom' ? -dw : -dw / 2;
    ctx.drawImage(img, c * s.size, r * s.size, s.size, s.size, Math.round(-dw / 2), Math.round(ax), dw, dw);
    ctx.restore();
    return true;
  },
  ability(ctx, fid, row, frame, x, y, opts) { return this.cell(ctx, 'abil:' + fid, row, frame, x, y, opts); },
  fx2(ctx, sheet, row, frame, x, y, opts) { return this.cell(ctx, 'fx2:' + sheet, row, frame, x, y, opts); },
  /* Ícone em CSS (para a HUD em HTML). */
  css(key, row, col, px) {
    const s = ART_SHEETS[key];
    if (!s) return '';
    const k = px / s.size;
    const img = this.images[key];
    const w = img ? img.naturalWidth : s.size * s.cols;
    const h = img ? img.naturalHeight : s.size * (s.rows || 5);
    const r = ((row % (s.rows || 5)) + (s.rows || 5)) % (s.rows || 5);
    return `background-image:url(${this.url(s.src)});background-size:${w * k}px ${h * k}px;background-position:${-col * px}px ${-r * px}px;`;
  },
};
Art.load();

/* Folhas antigas por elemento (8x5, 96px) — mantidas para impactos e auras genéricas. */
const FX_LAYOUT = {
  frameW: 96,
  frameH: 96,
  cols: 8,
  clips: {
    projectile: { row: 0, frames: 8 },
    impact: { row: 1, frames: 6 },
    aura: { row: 2, frames: 8 },
    ultimate: { row: 3, frames: 8 },
    flash: { row: 4, frames: 4 },
    grab: { row: 0, frames: 8 },
  },
  sheets: {
    fogo: 'assets/fx/fogo.png', gelo: 'assets/fx/gelo.png', raio: 'assets/fx/raio.png', vento: 'assets/fx/vento.png',
    sombra: 'assets/fx/sombra.png', veneno: 'assets/fx/veneno.png', neon: 'assets/fx/neon.png', terra: 'assets/fx/terra.png',
    metal: 'assets/fx/metal.png', acido: 'assets/fx/acido.png', tempo: 'assets/fx/tempo.png', arcano: 'assets/fx/arcano.png',
    portal: 'assets/fx/portal.png', rastro: 'assets/fx/rastro.png', lata: 'assets/fx/lata.png', kernel: 'assets/fx/kernel.png', hackfx: 'assets/fx/hackfx.png', grabfx: 'assets/fx/grabfx.png',
  },
};
const ELEMENT_TO_OLD = { magma: 'fogo', ia: 'arcano', agua: 'gelo', vento: 'vento', sombra: 'sombra', veneno: 'veneno', neon: 'neon', terra: 'terra', metal: 'metal', acido: 'acido', tempo: 'tempo', arcano: 'arcano', lata: 'lata', kafka: 'arcano', shader: 'raio', cipher: 'arcano', hack: 'hackfx' };
Object.assign(ELEMENT_TO_OLD, { tremor: 'terra', termico: 'gelo', fizz: 'veneno', tactical: 'metal' });

const Fx = {
  images: {},
  load() {
    Object.entries(FX_LAYOUT.sheets).forEach(([id, src]) => {
      const img = new Image();
      img.onload = () => { this.images[id] = img; };
      img.src = src;
    });
  },
  blit(ctx, sheet, clip, frame, x, y, opts = {}) {
    const L = FX_LAYOUT;
    const img = this.images[ELEMENT_TO_OLD[sheet] || sheet];
    const spec = L.clips[clip];
    if (!img || !img.naturalWidth || !spec) return;
    const f = ((frame % spec.frames) + spec.frames) % spec.frames;
    const sc = opts.scale || 2;
    const dw = L.frameW * sc;
    const dh = L.frameH * sc;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha *= opts.alpha == null ? 1 : opts.alpha;
    if (opts.add) ctx.globalCompositeOperation = 'lighter';
    ctx.translate(Math.round(x), Math.round(y));
    if (opts.dir < 0) ctx.scale(-1, 1);
    ctx.drawImage(img, f * L.frameW, spec.row * L.frameH, L.frameW, L.frameH, Math.round(-dw / 2), Math.round(-dh / 2), dw, dh);
    ctx.restore();
  },
};
Fx.load();
