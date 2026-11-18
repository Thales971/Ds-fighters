/* DS Fighters — KIRA, "A Marteleira".
   Arte do dono (milena-personagem/Kira personagem/): cabelo azul longo,
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
      theme: 'kira: martelo azul — pancada com shock, muralha que reduz dano, investida com o martelo, chuva de explosoes e ult de marteladas em sequencia',
      powers: [
        Object.assign({
          id: 'marretada', name: 'Marretada', slot: 'simple', row: 0,
          kind: 'blast', at: 'target', dmg: 18, stun: 36, launch: -6, radius: 200, cd: 90, sfx: 'heavy',
          fx: { shock: 40 },
          desc: 'Martelada no alvo: 18 de dano + stun + ELETRIZADO por ~0,7s.',
        }, visual(0, '#3B82F6')),
        Object.assign({
          id: 'muralha-azul', name: 'Muralha Azul', slot: 'simple', row: 1,
          kind: 'aura', time: 300, defMult: 0.5, cd: 140, sfx: 'magic',
          desc: 'Escudo azul de impacto: reduz 50% do dano recebido por 5s.',
        }, visual(1, '#5EB8FF')),
        Object.assign({
          id: 'avanco-martelo', name: 'Avanço do Martelo', slot: 'simple', row: 2,
          kind: 'dash', dmg: 14, speed: 16, stun: 26, cd: 80, whiffRecovery: 18, sfx: 'dash',
          fx: { shock: 24 },
          desc: 'Investida com o martelo: 14 de dano + stun + ELETRIZADO. Errou? recovery longo (punição).',
        }, visual(2, '#93C5FD')),
        Object.assign({
          id: 'erupcao', name: 'Erupção', slot: 'charge', meter: 0, row: 3,
          kind: 'rain', count: 6, dmg: 24, cd: 120, sfx: 'explosion',
          fx: { burn: 160 },
          desc: 'Seis explosoes de martelo caem no rival (~24 de dano total) e ele fica QUEIMANDO por ~2,7s.',
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
      desc: 'Bruiser pesada: pancadas de martelo que atordoam mais (stun x1,2), muralha azul (-50% dano) e ult de marteladas em sequencia com explosao final.',
      basic: {},
      ability: {},
      stunMult: 1.2,   /* martelo atordoa mais que o normal */
    },
  });
})();
