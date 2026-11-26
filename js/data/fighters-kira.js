/* DS Fighters — KIRA, "A Marteleira".
   Arte do dono (arte-fonte/milena-personagem/Kira personagem/): cabelo azul longo,
   casaco preto com detalhes brancos, saia, botas e um martelo azul com
   simbolo de seta. Bruiser pesado: pancada de martelo que atordoa, muralha
   azul que reduz dano, investida com o martelo e ult de marteladas em
   sequencia terminando em explosao. Todas as poses olham pra direita. */
(() => {
  const id = 'kira';
  SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    poseScale: { idle: 0.92, walk: 0.92, jump: 0.9, crouch: 0.78, punch: 0.92, kick: 0.95, cpunch: 0.8, ckick: 0.82, jpunch: 0.9, jkick: 0.9, special: 0.92, hit: 0.88, block: 0.82, ko: 0.85, win: 0.92 },
  });
  const visual = (row, color) => ({
    visualSheet: id, visualRow: row, impactSheets: [], impactColor: color,
  });

  FIGHTERS.push(
    {
      id,
      name: 'KIRA',
      title: 'A Marteleira',
      bio: 'Cabelo azul longo, casaco preto e o martelo azul com simbolo de seta na mão: bruiser pesada que resolve no impacto. Pancadas que atordoam, muralha azul que segura o tranco e uma ultimate de marteladas que termina em explosão.',
      colors: { skin: '#F5DFC8', hair: '#1E3A8A', shirt: '#14141C', pants: '#1C1C26', shoes: '#2A2A35', accent: '#3B82F6' },
      traits: {},
      stats: { power: 1.25, speed: 0.95, weight: 1.25, hp: 200, meterRate: 1.0 },
      secret: false,
      quotes: {
        intro: ['Martelo carregado. Vamos resolver no impacto.', 'A seta do meu martelo aponta pra sua cara.'],
        win: ['Impacto confirmado.', 'Cabeça de martelo não perdoa.'],
        lose: ['...meu martelo pesa demais hoje.', 'Preciso recalibrar a mira.'],
        taunt: ['Vem pro alcance do martelo.'],
        special: ['MARRETADA!', 'Impacto!'],
        super: ['MARTELADA FINAL!!'],
      },
      moves: {
        punch: { dmg: 9, range: 58, startup: 5, active: 4, recovery: 10 },   /* jab com o cabo do martelo */
        kick: { dmg: 14, range: 72, startup: 9, active: 4, recovery: 13 },   /* giro do martelo (alcance maior) */
      },
      special: {
        name: 'Marretada', type: 'melee-rush', dmg: 14, hits: 1,
        proj: { speed: 0, dmg: 14, w: 34, h: 34, color: '#3B82F6', shape: 'orb', visualSheet: id, visualRow: 0 },
      },
      super: { name: 'Martelada Final', type: 'melee-rush', dmg: 16, hits: 4 },
    },
  );

  Object.assign(POWERS, {
    [id]: {
      element: 'metal',
      theme: 'kira: marteleira tank — marretada que racha o ar (quake), muralha azul tank, gancho que puxa o rival, chuva de explosões e ult de marteladas',
      powers: [
        Object.assign({
          id: 'marretada', name: 'Marretada', slot: 'simple', row: 0,
          kind: 'quake', range: 170, dmg: 20, lock: 34, kx: 20, launch: -8, cd: 95, sfx: 'explosion',
          fx: { shock: 50 },
          desc: 'Martelada que racha o ar: 20 de dano, trava o rival (freeze ~0,6s), arremessa longe e deixa ELETRIZADO.',
        }, visual(0, '#3B82F6')),
        Object.assign({
          id: 'muralha-azul', name: 'Muralha Azul', slot: 'simple', row: 1,
          kind: 'aura', time: 300, defMult: 0.5, heal: 15, cd: 140, sfx: 'magic',
          desc: 'Escudo azul de impacto: reduz 50% do dano por 5s e cura 15 HP na hora.',
        }, visual(1, '#5EB8FF')),
        Object.assign({
          id: 'gancho-do-martelo', name: 'Gancho do Martelo', slot: 'simple', row: 2,
          kind: 'pull', range: 380, dmg: 10, stun: 46, cd: 80, sfx: 'dash',
          fx: { vuln: 120, shock: 40 },
          desc: 'Gancho que puxa o rival até perto de você: 10 de dano + stun + VULNERÁVEL + ELETRIZADO.',
        }, visual(2, '#93C5FD')),
        Object.assign({
          id: 'erupcao', name: 'Erupção', slot: 'charge', meter: 0, row: 3,
          kind: 'rain', count: 6, dmg: 24, cd: 120, sfx: 'explosion',
          fx: { burn: 160, shock: 80 },
          desc: 'Seis explosões de martelo caem no rival (~24 de dano): QUEIMANDO (~2,7s) + ELETRIZADO.',
        }, visual(3, '#F59E0B')),
        Object.assign({
          id: 'martelada-final', name: 'Martelada Final', slot: 'ultimate', row: 4,
          kind: 'rush', hits: 4, dmg: 18, teleport: true, cd: 150, whiffRecovery: 20, sfx: 'ultimate',
          fx: { explode: 3, shock: 160, vuln: 240 },
          desc: 'Sequencia de 4 marteladas que empurra o rival pela tela terminando em explosao: ELETRIZADO + VULNERAVEL (+20% dano, 4s).',
        }, visual(4, '#FFD24D')),
      ],
    },
  });

  Object.assign(ELEMENT_FX, { [id]: { sheet: id, color: '#3B82F6' } });

  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'A MARTELEIRA',
      desc: 'Bruiser tank: marretada em área que trava e arremessa, muralha azul (-50% dano + cura), gancho que puxa o rival para perto e ult de marteladas em sequência. stun x1,2.',
      basic: {},
      ability: {},
      stunMult: 1.2,   /* martelo atordoa mais que o normal */
    },
  });
})();
