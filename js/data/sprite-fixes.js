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
    /* KIRA: folha regerada com o agachado de verdade (estocada baixa); a
       escala antiga do agachado (0.78) era pra pose em pe encolhida */
    kira: {
      poseScale: { crouch: 0.9, cpunch: 0.9, ckick: 0.9 },
    },
  };
  /* folhas regeradas (tools/integrate_fighter.py) nesta revisao: baixar de novo */
  SPRITE_LAYOUT.ver = SPRITE_LAYOUT.ver || {};
  for (const id of ['rafael', 'hana', 'kira']) SPRITE_LAYOUT.ver[id] = 'v98-sprites';
  for (const id of Object.keys(FIX)) {
    const f = FIX[id];
    const own = SPRITE_LAYOUT.perFighter[id] = SPRITE_LAYOUT.perFighter[id] || {};
    if (f.rows) own.rows = Object.assign({}, own.rows, f.rows);
    if (f.frames) own.frames = Object.assign({}, own.frames, f.frames);
    if (f.poseScale) own.poseScale = Object.assign({}, own.poseScale, f.poseScale);
    if (f.koFall) own.koFall = true;
  }
})();
