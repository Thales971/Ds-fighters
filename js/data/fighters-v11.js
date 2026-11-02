/* DS Fighters V11 — Mis, Grika e Dev Senior. Carregado após V10. */
(() => {
  const ids = ['mis', 'grika', 'dev-senior', 'dev-senior-nano'];
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

  const moves = {
    punch: { dmg: 7, range: 52, startup: 5, active: 4, recovery: 11 },
    kick: { dmg: 10, range: 65, startup: 8, active: 4, recovery: 14 },
  };
  FIGHTERS.push(
    {
      id: 'mis',
      name: 'MIS, A BRASA MISTRAL',
      title: 'A Nerd da Chama Dourada',
      bio: 'Feiticeira adulta, estudiosa e kawaii. O vestido preto de detalhes laranja, a gravata vermelha e o cabelo dourado em fogo anunciam as chamas que ela escreve no ar.',
      colors: { skin: '#f0c5a6', hair: '#ff9b31', shirt: '#1b1720', pants: '#25202a', shoes: '#17151b', accent: '#ff7b25' },
      traits: { hairGradient: ['#ffdf62', '#ff9b31', '#ed4b27'], nerd: true, fireMage: true },
      stats: { power: 1.37, speed: 1.10, weight: 0.98, hp: 126, meterRate: 1.18 },
      quotes: {
        intro: ['Anote: combustão controlada.', 'O experimento começa agora.'],
        win: ['Hipótese confirmada.', 'A chama ficou no ponto.'],
        special: ['BRASA MISTRAL!', 'CHAMA DE CACHE!', 'FOGO, EM LETRAS GRANDES!'],
        super: ['VÓRTICE DE CABEÇA PARA BAIXO!'],
      },
      moves,
      special: {
        name: 'Brasa Mistral', type: 'projectile', cost: 25,
        proj: { row: 0, speed: 10, dmg: 12, w: 28, h: 24, color: '#ff8427', shape: 'orb', visualSheet: 'mis', visualRow: 0 },
      },
      super: { name: 'Vórtice de Cabeça para Baixo', type: 'aoe', dmg: 30, radius: 210, visualSheet: 'mis', visualRow: 4 },
    },
    {
      id: 'grika',
      name: 'GRIKA, A SONHADORA SOMBRIA',
      title: 'A Voz Debaixo da Cama',
      bio: 'Combatente gótica adulta de camiseta de rock, legging e correntes prateadas. Seus pesadelos ganham garras, correntes de sombra e um buraco negro no chão.',
      colors: { skin: '#e4c7bf', hair: '#17131f', shirt: '#201c28', pants: '#16151d', shoes: '#100f15', accent: '#a24ce8' },
      traits: { gothic: true, nightmare: true, longHair: true },
      stats: { power: 1.37, speed: 1.03, weight: 1.08, hp: 128, meterRate: 1.16 },
      quotes: {
        intro: ['Apague a luz. O sonho começa.', 'Não olhe para o fundo.'],
        win: ['O pesadelo era seu.', 'Acorde quando puder.'],
        special: ['GARRA DO PESADELO!', 'NOITE SEM FIM!', 'SOMBRA, PRENDA!'],
        super: ['SINGULARIDADE DO PESADELO!'],
      },
      moves,
      special: {
        name: 'Estilhaço Onírico', type: 'projectile', cost: 25,
        proj: { row: 0, speed: 9, dmg: 12, w: 28, h: 24, color: '#9d4ce9', shape: 'orb', visualSheet: 'grika', visualRow: 0 },
      },
      super: { name: 'Buraco Negro do Pesadelo', type: 'aoe', dmg: 31, radius: 205, visualSheet: 'grika', visualRow: 4 },
    },
    {
      id: 'dev-senior',
      name: 'DEV SENIOR, ENGENHEIRO DE NANOS',
      title: 'O Último Deploy',
      bio: 'Veterano de ombros largos, cabeça raspada e barba cinza. Resolve tudo no braço — e, no overdrive, libera nanomáquinas que reforçam o corpo e cada impacto.',
      colors: { skin: '#c98f69', hair: '#b9b3aa', shirt: '#22232a', pants: '#17191d', shoes: '#101114', accent: '#f29438' },
      traits: { veteran: true, nanomachines: true, heavyBrawler: true },
      stats: { power: 1.38, speed: 1.0, weight: 1.1, hp: 140, meterRate: 1.35 },
      quotes: {
        intro: ['Já vi esse bug antes.', 'Sem camisa, sem desculpas.'],
        win: ['Patch aplicado.', 'Pode subir para produção.'],
        special: ['PIPELINE DE IMPACTO!', 'NANOMÁQUINAS!', 'SEM DÍVIDA TÉCNICA!'],
        super: ['NANOMACHINES, RELEASE TOTAL!'],
      },
      moves,
      special: {
        name: 'Punho de Pipeline', type: 'projectile', cost: 25,
        proj: { row: 0, speed: 10, dmg: 13, w: 32, h: 26, color: '#f29438', shape: 'bolt', visualSheet: 'dev-senior', visualRow: 0 },
      },
      super: { name: 'Nano Overdrive', type: 'aoe', dmg: 34, radius: 200, visualSheet: 'dev-senior', visualRow: 4 },
    },
  );
})();
