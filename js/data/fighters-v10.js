/* DS Fighters V10 — Gemini e Meta. Carregado após fighters.js e antes dos kits. */
(() => {
  const ids = ['gemini', 'meta'];
  const poseRows = {
    idle: 0, walk: 1, jump: 2, crouch: 3, block: 3,
    punch: 4, cpunch: 4, jpunch: 4,
    kick: 5, ckick: 5, jkick: 5,
    special: 6, hit: 7, ko: 7, win: 0,
  };
  ids.forEach((id) => {
    SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
    SPRITE_LAYOUT.perFighter[id] = {
      frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
      rows: Object.assign({}, poseRows),
    };
  });

  FIGHTERS.push(
    {
      id: 'gemini',
      name: 'GEMINI TWINBYTE',
      title: 'A Combatente das Duas Frequências',
      bio: 'Lutador adulto de presença andrógina, acompanhado por dois prismas espelhados. Alterna golpes ciano e violeta e marca o rival com Resonância.',
      colors: { skin: '#d9ad8d', hair: '#142344', shirt: '#edf4ff', pants: '#18233e', shoes: '#202c4c', accent: '#56eaff' },
      traits: { dualTone: true, prismDrones: true, hairStyle: 'short' },
      stats: { power: 1.35, speed: 1.2, weight: 0.96, hp: 122, meterRate: 1.15 },
      quotes: {
        intro: ['Duas ideias. Um só golpe.', 'Sincronizando os prismas.'],
        win: ['As duas frequências concordam.', 'Dueto concluído.'],
        special: ['RESSONÂNCIA!', 'PRISMA DUPLO!', 'ÓRBITA EM DUPLA!'],
        super: ['ECLIPSE GEMINADO!'],
      },
      moves: {
        punch: { dmg: 6, range: 50, startup: 5, active: 4, recovery: 10 },
        kick: { dmg: 9, range: 62, startup: 8, active: 4, recovery: 13 },
      },
      special: {
        name: 'Pulso de Dois Prismas', type: 'projectile', cost: 25,
        proj: { row: 0, speed: 10, dmg: 10, w: 26, h: 22, color: '#67eaff', shape: 'orb', visualSheet: 'gemini', visualRow: 0 },
      },
      super: { name: 'Eclipse Geminado', type: 'aoe', dmg: 34, radius: 210, visualSheet: 'gemini', visualRow: 4 },
    },
    {
      id: 'meta',
      name: 'META',
      title: 'A Conectora de Comunidades',
      bio: 'Mulher adulta de anime kawaii, cabelo azul-claro, óculos redondos cianos e presilhas de estrela. Usa ondas luminosas e protege-se com o Véu da Comunidade.',
      colors: { skin: '#f1c6ac', hair: '#75d9ff', shirt: '#f5f5ff', pants: '#25273a', shoes: '#eaf8ff', accent: '#62dfff' },
      traits: { glasses: 'round', starClips: true, longHair: true, kawaii: true },
      stats: { power: 1.35, speed: 1.2, weight: 0.96, hp: 122, meterRate: 1.15 },
      quotes: {
        intro: ['Todo mundo conectado?', 'Brilho, foco e movimento!'],
        win: ['A comunidade brilhou.', 'Conexão encerrada com estilo.'],
        special: ['REAÇÃO ESTELAR!', 'LAÇO DE FEED!', 'REPOST PRISMÁTICO!'],
        super: ['PULSO COLETIVO!'],
      },
      moves: {
        punch: { dmg: 6, range: 50, startup: 5, active: 4, recovery: 10 },
        kick: { dmg: 9, range: 62, startup: 8, active: 4, recovery: 13 },
      },
      special: {
        name: 'Reação Estelar', type: 'projectile', cost: 25,
        proj: { row: 0, speed: 10, dmg: 10, w: 25, h: 22, color: '#70dcff', shape: 'orb', visualSheet: 'meta', visualRow: 0 },
      },
      super: { name: 'Pulso Coletivo', type: 'aoe', dmg: 34, radius: 210, visualSheet: 'meta', visualRow: 4 },
    },
  );
})();
