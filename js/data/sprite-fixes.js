/* DS Fighters — correcoes de aplicacao de sprite dos lutadores de folha antiga
   (nov/2026). As folhas destes lutadores tem linhas com a pose errada ou com o
   boneco minusculo: bloqueio do tamanho de uma crianca, KO que e um soco em pe,
   soco agachado que e um chute alto em pe, celulas cortadas na borda.
   Aqui so mudam DADOS de leitura da folha (nenhum PNG e alterado):
     rows      pose -> linha da folha que ela usa
     frames    quantos quadros da linha (corta quadro quebrado)
     poseScale escala da pose (pivo no pe). ATENCAO: substitui a escala geral
               do lutador (own.scale), entao ja vem multiplicada por ela
     koFall    o KO usa uma pose de dano e o boneco tomba de costas (giro no
               pe, fighter.motionXf) — pra quem nao tem pose deitada na folha
   Linhas da folha: 0 idle 1 walk 2 jump 3 crouch 4 punch 5 kick 6 cpunch
   7 ckick 8 jpunch 9 jkick 10 special 11 hit 12 block 13 ko 14 win */
(() => {
  if (typeof SPRITE_LAYOUT === 'undefined' || !SPRITE_LAYOUT.perFighter) return;
  const R = { idle: 0, crouch: 3, hit: 11 };
  const FIX = {
    /* YUMI: escala geral 1.22; bloqueio/dano minusculos; KO era a estocada em pe */
    kotlin: {
      rows: { ko: R.hit }, koFall: true,
      poseScale: { block: 1.6, hit: 1.4, special: 1.4, ko: 1.4 },
    },
    /* TRACY (bughunter): soco agachado era um chute alto em pe; bloqueio minusculo */
    bughunter: {
      rows: { cpunch: R.crouch },
      frames: { cpunch: 2, ckick: 1 },
      poseScale: { ckick: 0.68, block: 1.4, hit: 1.2, special: 1.2 },
    },
    /* NINA: bloqueio/vitoria eram close-ups cortados na borda, KO era a vitoria
       cortada pela metade, 3o quadro do dano cortado */
    'nina-vector': {
      rows: { block: R.idle, win: R.idle, ko: R.crouch },
      frames: { hit: 2 },
      poseScale: { block: 1, win: 1, ko: 0.8 },
    },
    /* DANDARA: o 2o quadro do KO era ela em pe pequena: fica so a caida de maos no chao */
    'dandara-query': {
      frames: { ko: 1 },
      poseScale: { ko: 1.35 },
    },
    /* ADA: bloqueio minusculo, agachado-chute com chute em pe, KO era a estocada */
    qa: {
      rows: { ko: R.hit }, koFall: true,
      frames: { ckick: 1 },
      poseScale: { block: 1.4, hit: 1.2, special: 1.3, ckick: 0.72, ko: 1.15 },
    },
    /* KAEL: agachados com chute alto em pe, 3o quadro do chute no ar cortado, KO era um soco */
    java: {
      rows: { cpunch: R.crouch, ko: R.hit }, koFall: true,
      frames: { ckick: 1, jkick: 2 },
      poseScale: { crouch: 1.15, cpunch: 1.15, ckick: 0.68, block: 1.15 },
    },
    /* TITAN: igual ao Kael (mesma familia de folha) e agachado pequeno */
    backend: {
      rows: { cpunch: R.crouch, ko: R.hit }, koFall: true,
      frames: { ckick: 1 },
      poseScale: { crouch: 1.2, cpunch: 1.2, ckick: 0.7, block: 1.2 },
    },
    /* MIRA: mesma familia de folha da Ada */
    frontend: {
      rows: { cpunch: R.crouch, ko: R.hit }, koFall: true,
      frames: { ckick: 1 },
      poseScale: { block: 1.3, special: 1.2, ckick: 0.66, ko: 1.1 },
    },
    /* KAIRO: o agachado inteiro era chute alto em pe; o 1o quadro do chute e
       um agachado grande de verdade: os agachados usam so ele */
    scrum: {
      rows: { crouch: 5, cpunch: 5, ckick: 5, ko: R.hit }, koFall: true,
      frames: { crouch: 1, cpunch: 1, ckick: 1, jkick: 3 },
      poseScale: { crouch: 0.7, cpunch: 0.72, ckick: 0.7, block: 1.15 },
    },
    /* OMNI: soco agachado era chute em pe, bloqueio minusculo, KO era o especial */
    fullstack: {
      rows: { cpunch: R.crouch, ko: R.hit }, koFall: true,
      frames: { ckick: 1 },
      poseScale: { ckick: 0.8, block: 1.3, special: 1.2, ko: 1.1 },
    },
    /* CROMO: KO era o especial, bloqueio pequeno, chute agachado em pe */
    merc: {
      rows: { ko: R.hit }, koFall: true,
      frames: { ckick: 1 },
      poseScale: { crouch: 1.1, cpunch: 1.1, ckick: 0.68, block: 1.1, punch: 1.15, jpunch: 1.15, special: 1.15 },
    },
    /* HENRICO: folha regerada com grade explicita; as escalas antigas
       (0.7-0.8) compensavam poses gigantes que nao existem mais */
    henrico: {
      poseScale: { block: 0.95, crouch: 1.05, cpunch: 1.0, ckick: 0.95, hit: 0.95, special: 0.95, win: 0.95 },
    },
    /* ===== revisao do resto do elenco (nov/2026) =====
       KO em pe/minusculo ou mostrando o especial -> tomba a pose de dano */
    jess: { rows: { ko: R.hit }, koFall: true },
    hacker: { /* ROOT PHANTOM: agachados com 2 bonecos colados; KO era o especial */
      rows: { crouch: 2, cpunch: 2, ckick: 2, ko: R.hit }, koFall: true,
      frameMap: { kick: [0, 2] },
    },
    iales: { rows: { ko: R.hit }, koFall: true, frameMap: { ckick: [1, 2], block: [1] } },
    gitmaster: { rows: { ko: R.hit }, koFall: true, frameMap: { ckick: [1, 2], block: [1] } },
    devops: { rows: { cpunch: R.crouch, ckick: R.crouch, ko: R.hit }, koFall: true, frameMap: { block: [1] } },
    felipinho: { rows: { ckick: R.crouch, ko: R.hit }, koFall: true, frameMap: { block: [1] }, poseScale: { win: 0.82 } },
    xeon: { rows: { cpunch: R.crouch, ckick: R.crouch, ko: R.hit }, koFall: true, frameMap: { block: [1] }, poseScale: { special: 1.2 } },
    bhm: { rows: { ckick: R.crouch, ko: R.hit }, koFall: true, frameMap: { block: [1] }, poseScale: { win: 0.82 } },
    'dev-virado': { rows: { ko: R.hit }, koFall: true, frameMap: { kick: [1, 3] } },
    milena: { frameMap: { hit: [1, 3] } },           /* 2 dos 4 quadros de dano eram ela ja deitada */
    stella: { rows: { ko: R.hit }, koFall: true },
    jester: { rows: { ko: R.hit }, koFall: true },
    domador: { rows: { ko: R.hit }, koFall: true },
    kuno: { rows: { ko: R.hit }, koFall: true },
    miko: { rows: { ko: R.hit, win: R.idle }, koFall: true },
    emilio: { rows: { ko: R.hit }, koFall: true },
    gemini: { rows: { ko: R.hit }, koFall: true },
    nunes: { rows: { ko: R.hit }, koFall: true, frameMap: { jpunch: [1, 3], hit: [0, 2] }, poseScale: { crouch: 1.35, cpunch: 1.35, ckick: 1.3 } },
    meta: { frameMap: { hit: [0, 1] } },
    'dev-senior': { frameMap: { hit: [0, 1] } },
    mis: { frameMap: { hit: [0, 1, 2], ko: [1, 3] } },
    ponteiro: { rows: { ko: R.hit }, koFall: true, frameMap: { crouch: [0, 2], win: [1, 3] }, poseScale: { crouch: 1.35, cpunch: 1.35, ckick: 1.3 } }, /* comemorava deitado */
    'guarda-digital': { rows: { punch: 10, jpunch: 10, ko: R.hit }, koFall: true }, /* soco com 2 bonecos por celula */
    /* KIRA: folha regerada com o agachado de verdade (estocada baixa); a
       escala antiga do agachado (0.78) era pra pose em pe encolhida */
    kira: {
      poseScale: { crouch: 0.9, cpunch: 0.9, ckick: 0.9 },
    },
  };
  /* NIVELAMENTO (nov/2026): multiplica a escala que a pose ja tinha (poseScale,
     ou a escala geral do lutador). Medido no jogo com tools de bbox:
     KO deitado mais largo que ~205 px (a altura de um boneco em pe) encolhe;
     agachado/bloqueio minusculos crescem; quem e menor que o resto cresce. */
  const MUL = {
    'captcha-guard': { ko: 0.81 },
    'dolynho': { ko: 0.87 },
    'du': { ko: 0.79 },
    'kira': { ko: 0.83 },
    'lia': { ko: 0.82 },
    'lobao': { ko: 0.71 },
    'maximilian': { ko: 0.82 },
    'meta': { ko: 0.76 },
    'nexo': { ko: 0.88 },
    'qwen': { ko: 0.73 },
    'stack': { ko: 0.8 },
    'thl': { ko: 0.79 },
    'urbano': { ko: 0.72 },
    'winx-exe': { ko: 0.82 },
    'winx-exe': { crouch: 1.45 }, grika: { crouch: 1.45 }, odette: { crouch: 1.45 },
    'john-vibe': { crouch: 1.45 }, nimbo: { crouch: 1.45 }, emilio: { crouch: 1.45 },
    du: { block: 1.45 }, iales: { block: 1.5 }, xeon: { block: 1.75 },
    'dev-virado': { '*': 1.18 }, milena: { '*': 1.18 },
  };
  const AFTER = { emilio: { frameMap: { crouch: [0, 2] } }, 'nina-vector': { rows: { ko: 11 }, koFall: true } };
  for (const id of Object.keys(AFTER)) {
    const own = SPRITE_LAYOUT.perFighter[id] = SPRITE_LAYOUT.perFighter[id] || {};
    const f = AFTER[id];
    if (f.rows) own.rows = Object.assign({}, own.rows, f.rows);
    if (f.frameMap) own.frameMap = Object.assign({}, own.frameMap, f.frameMap);
    if (f.koFall) own.koFall = true;
  }
  for (const id of Object.keys(MUL)) {
    const own = SPRITE_LAYOUT.perFighter[id] = SPRITE_LAYOUT.perFighter[id] || {};
    const base = own.scale || 1;
    const ps = own.poseScale = Object.assign({}, own.poseScale);
    const poses = MUL[id]['*'] ? SPRITE_LAYOUT.poses : Object.keys(MUL[id]);
    for (const pose of poses) {
      const m = MUL[id][pose] || MUL[id]['*'];
      ps[pose] = +((ps[pose] || base) * m).toFixed(3);
    }
  }
  /* folhas regeradas (tools/integrate_fighter.py) nesta revisao: baixar de novo */
  SPRITE_LAYOUT.ver = SPRITE_LAYOUT.ver || {};
  for (const id of ['rafael', 'hana', 'kira']) SPRITE_LAYOUT.ver[id] = 'v98-sprites';
  SPRITE_LAYOUT.ver.henrico = 'v99-henrico';
  for (const id of Object.keys(FIX)) {
    const f = FIX[id];
    const own = SPRITE_LAYOUT.perFighter[id] = SPRITE_LAYOUT.perFighter[id] || {};
    if (f.rows) own.rows = Object.assign({}, own.rows, f.rows);
    if (f.frames) own.frames = Object.assign({}, own.frames, f.frames);
    if (f.poseScale) own.poseScale = Object.assign({}, own.poseScale, f.poseScale);
    if (f.koFall) own.koFall = true;
    if (f.frameMap) own.frameMap = Object.assign({}, own.frameMap, f.frameMap);
  }
})();
