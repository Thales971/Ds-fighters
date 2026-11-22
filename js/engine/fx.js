/* ============================================================
   DS FIGHTERS — Carregador de arte e blit de spritesheets.
   Art.cell() é o único caminho de desenho de sprites de efeito:
   nada de formas desenhadas à mão para poderes.
   ============================================================ */
const ART_SHEETS = {
  // habilidades: 4 col x 5 lin, 128px
  ...Object.fromEntries(['du', 'felipinho', 'stack', 'gitmaster', 'bughunter', 'frontend', 'backend', 'devops', 'qa', 'scrum', 'fullstack', 'kotlin', 'hacker', 'java', 'merc', 'bhm', 'xeon', 'urbano', 'qwen', 'dolynho', 'thl', 'lobao']
    .map((id) => ['abil:' + id, { src: 'assets/abilities/' + id + '.png', size: 128, cols: 4 }])),
  ...Object.fromEntries(['winx-exe', 'nina-vector', 'dandara-query', 'gemini', 'meta', 'mis', 'dev-senior', 'dev-veterano', 'hana', 'cyber-psicopata', 'grika', 'guarda-digital', 'engenheira-prompt', 'odette', 'john-vibe', 'nimbo', 'emilio', 'emilio-trans', 'nunes', 'ponteiro']
    .map((id) => ['abil:' + id, { src: 'assets/abilities/' + id + '.png', size: 128, cols: 4, rows: 5 }])),
  ...Object.fromEntries(['henrico']
    .map((id) => ['abil:' + id, { src: 'assets/abilities/' + id + '.png', size: 128, cols: 4, rows: 5 }])),
  'fx2:henrico': { src: 'assets/abilities/henrico.png', size: 128, cols: 4, rows: 5 },
  'abil:jess': { src: 'assets/abilities/jess.png', size: 128, cols: 4, rows: 5 },
  'fx2:jess': { src: 'assets/abilities/jess.png', size: 128, cols: 4, rows: 5 },
  'abil:dev-virado': { src: 'assets/abilities/dev-virado.png', size: 128, cols: 4, rows: 5 },
  'fx2:dev-virado': { src: 'assets/abilities/dev-virado.png', size: 128, cols: 4, rows: 5 },
  'abil:milena': { src: 'assets/abilities/milena.png', size: 128, cols: 4, rows: 5 },
  'fx2:milena': { src: 'assets/abilities/milena.png', size: 128, cols: 4, rows: 5 },
  'abil:kira': { src: 'assets/abilities/kira.png', size: 128, cols: 4, rows: 5 },
  'fx2:kira': { src: 'assets/abilities/kira.png', size: 128, cols: 4, rows: 5 },
  'abil:cracker': { src: 'assets/abilities/cracker.png', size: 128, cols: 4, rows: 5, v: 'v62-cracker' },
  'fx2:cracker': { src: 'assets/abilities/cracker.png', size: 128, cols: 4, rows: 5, v: 'v62-cracker' },
  'abil:rafael': { src: 'assets/abilities/rafael.png', size: 128, cols: 4, rows: 5 },
  'fx2:rafael': { src: 'assets/abilities/rafael.png', size: 128, cols: 4, rows: 5 },
  ...Object.fromEntries(['lia', 'nexo', 'maximilian']
    .map((id) => ['abil:' + id, { src: 'assets/abilities/' + id + '.png', size: 128, cols: 4, rows: 5 }])),
  // pacote retrô nativ18-balance: rebalanceamento geral + cromo buff
  ...Object.fromEntries(['impact', 'fire', 'water', 'lightning', 'chaos', 'arcane', 'birds', 'ai-symbols', 'platforms']
    .map((id) => ['fx2:' + id, { src: 'assets/fx2/' + id + '.png', size: 64, cols: 4 }])),
  ...Object.fromEntries(['winx-exe', 'nina-vector', 'dandara-query', 'gemini', 'meta', 'mis', 'dev-senior', 'dev-veterano', 'hana', 'cyber-psicopata', 'grika', 'guarda-digital', 'engenheira-prompt', 'odette', 'john-vibe', 'nimbo', 'emilio', 'emilio-trans', 'nunes', 'ponteiro']
    .map((id) => ['fx2:' + id, { src: 'assets/abilities/' + id + '.png', size: 128, cols: 4, rows: 5 }])),
  ...Object.fromEntries(['lia', 'nexo', 'maximilian']
    .map((id) => ['fx2:' + id + '-fx', { src: 'assets/fx/' + id + '.png', size: 128, cols: 4, rows: 5 }])),
  'abil:iales': { src: 'assets/abilities/iales.png', size: 128, cols: 4, rows: 10 },
  'fx2:iales': { src: 'assets/abilities/iales.png', size: 128, cols: 4, rows: 10 },
  /* CYBER-PSICOPATA v2 (tools/build_ciber_fx.py): atlas novo + explosao de impacto */
  'abil:cyber-psicopata': { src: 'assets/abilities/cyber-psicopata.png', size: 128, cols: 4, rows: 5, v: 'v63-ciber' },
  'fx2:cyber-psicopata': { src: 'assets/abilities/cyber-psicopata.png', size: 128, cols: 4, rows: 5, v: 'v63-ciber' },
  'fx2:cyber-psicopata-hit': { src: 'assets/abilities/cyber-psicopata-hit.png', size: 128, cols: 4, rows: 1, v: 'v63-ciber' },
  /* KERNOR, chefe final do torneio (tools/build_kernor_fx.py) — 10 linhas */
  'abil:kernor': { src: 'assets/abilities/kernor.png', size: 128, cols: 4, rows: 10, v: 'v74-kernor' },
  'fx2:kernor': { src: 'assets/abilities/kernor.png', size: 128, cols: 4, rows: 10, v: 'v74-kernor' },
  'fx2:kernor-extra': { src: 'assets/abilities/kernor-extra.png', size: 128, cols: 4, rows: 2, v: 'v74-kernor' },
  /* STELLA, Maga do Front-end (tools/build_stella_fx.py) */
  'abil:stella': { src: 'assets/abilities/stella.png', size: 128, cols: 4, rows: 5, v: 'v73-stella' },
  'fx2:stella': { src: 'assets/abilities/stella.png', size: 128, cols: 4, rows: 5, v: 'v73-stella' },
  'fx2:stella-extra': { src: 'assets/abilities/stella-extra.png', size: 128, cols: 4, rows: 2, v: 'v73-stella' },
  /* KUNO (tools/build_kuno_fx.py) */
  'abil:kuno': { src: 'assets/abilities/kuno.png', size: 128, cols: 4, rows: 5, v: 'v72-kuno' },
  'fx2:kuno': { src: 'assets/abilities/kuno.png', size: 128, cols: 4, rows: 5, v: 'v72-kuno' },
  'fx2:kuno-extra': { src: 'assets/abilities/kuno-extra.png', size: 128, cols: 4, rows: 2, v: 'v72-kuno' },
  /* MIKO (tools/build_miko_fx.py) */
  'abil:miko': { src: 'assets/abilities/miko.png', size: 128, cols: 4, rows: 5, v: 'v71-miko' },
  'fx2:miko': { src: 'assets/abilities/miko.png', size: 128, cols: 4, rows: 5, v: 'v71-miko' },
  'fx2:miko-extra': { src: 'assets/abilities/miko-extra.png', size: 128, cols: 4, rows: 2, v: 'v71-miko' },
  /* DOMADOR DE PGADMIN (tools/build_domador_fx.py) */
  'abil:domador': { src: 'assets/abilities/domador.png', size: 128, cols: 4, rows: 5, v: 'v68-domador' },
  'fx2:domador': { src: 'assets/abilities/domador.png', size: 128, cols: 4, rows: 5, v: 'v68-domador' },
  'fx2:domador-extra': { src: 'assets/abilities/domador-extra.png', size: 128, cols: 4, rows: 2, v: 'v68-domador' },
  /* JESTER, bobo da corte (tools/build_jester_fx.py) */
  'abil:jester': { src: 'assets/abilities/jester.png', size: 128, cols: 4, rows: 5, v: 'v67-jester' },
  'fx2:jester': { src: 'assets/abilities/jester.png', size: 128, cols: 4, rows: 5, v: 'v67-jester' },
  'fx2:jester-extra': { src: 'assets/abilities/jester-extra.png', size: 128, cols: 4, rows: 2, v: 'v67-jester' },
  /* LARPER, veneno (tools/build_larper_fx.py) */
  'abil:larper': { src: 'assets/abilities/larper.png', size: 128, cols: 4, rows: 5, v: 'v66-larper' },
  'fx2:larper': { src: 'assets/abilities/larper.png', size: 128, cols: 4, rows: 5, v: 'v66-larper' },
  'fx2:larper-extra': { src: 'assets/abilities/larper-extra.png', size: 128, cols: 4, rows: 2, v: 'v66-larper' },
  /* LYRA, a Maga do JavaScript (tools/build_lyra_fx.py) */
  'abil:lyra': { src: 'assets/abilities/lyra.png', size: 128, cols: 4, rows: 5, v: 'v65-lyra' },
  'fx2:lyra': { src: 'assets/abilities/lyra.png', size: 128, cols: 4, rows: 5, v: 'v65-lyra' },
  'fx2:lyra-extra': { src: 'assets/abilities/lyra-extra.png', size: 128, cols: 4, rows: 2, v: 'v65-lyra' },
  'fx2:dev-senior-electric': { src: 'assets/abilities/dev-senior-electric.png', size: 128, cols: 4, rows: 1 },
  /* CAPTCHA GUARD (tools/build_captcha_fx.py) — so com login */
  'abil:captcha-guard': { src: 'assets/abilities/captcha-guard.png', size: 128, cols: 4, rows: 5, v: 'v82-captcha' },
  'fx2:captcha-guard': { src: 'assets/abilities/captcha-guard.png', size: 128, cols: 4, rows: 5, v: 'v82-captcha' },
  'fx2:captcha-guard-extra': { src: 'assets/abilities/captcha-guard-extra.png', size: 128, cols: 4, rows: 4, v: 'v82-captcha' },
  pets: { src: 'assets/pets/pets.png', size: 96, cols: 4 },
  firefox: { src: 'assets/pets/firefox.png', size: 96, cols: 4, v: 'v82-raposa' },
  pitoco: { src: 'assets/pets/pitoco.png', size: 96, cols: 4 },
  bichos: { src: 'assets/fauna/bichos.png', size: 96, cols: 4, rows: 10 },
  flora: { src: 'assets/fauna/flora.png', size: 128, cols: 4, rows: 5 },
  torcida: { src: 'assets/fauna/torcida.png', size: 256, cols: 5, rows: 1 },
  pickups: { src: 'assets/pickups/pickups.png', size: 64, cols: 4 },
  fauna: { src: 'assets/fauna/fauna.png', size: 48, cols: 4 },
  'fx2:firefly': { src: 'assets/fx/firefly.png', size: 16, cols: 6, rows: 2 },
};
/* Dev Veterano: atlas refeito (tools/build_devvet_fx.py) — objetos inteiros, sem corte */
ART_SHEETS["abil:dev-veterano"].v = "v80-devvet-fx";
ART_SHEETS["fx2:dev-veterano"].v = "v80-devvet-fx";

const Art = {
  images: {},
  /* s.v (opcional) troca a versao so daquela folha: arte nova nao obriga
     todo mundo a baixar de novo as outras ~50 folhas. */
  url(src, v) {
    return src + '?v=' + (v || 'v39-floraatlas');
  },
  load() {
    Object.entries(ART_SHEETS).forEach(([key, s]) => {
      const img = new Image();
      img.onload = () => { this.images[key] = img; };
      img.src = this.url(s.src, s.v);
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
    const rawScale = opts.scale || 1;
    const sc = rawScale;
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
    return `background-image:url(${this.url(s.src, s.v)});background-size:${w * k}px ${h * k}px;background-position:${-col * px}px ${-r * px}px;`;
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
Object.assign(ELEMENT_TO_OLD, { mis: 'fogo', 'dev-senior': 'metal' });

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
