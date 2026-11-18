/* DS Fighters — RAFAEL, "A Lâmina Pesada".
   Arte do dono (Pitoco-pet/Rafael-personagem/): cabelo loiro curto, outfit
   verde-escuro sem manga com armadura preta e uma arma preta pesada
   (espadona) segurada com as duas maos. Bruiser lento e pesado: cada golpe
   causa muito dano e debuffs; abaixo de 35% de vida entra em FÚRIA e causa
   ainda mais dano (hook lowHpRage). Todas as poses olham pra direita. */
(() => {
  const id = 'rafael';
  SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    poseScale: { idle: 0.95, walk: 0.95, jump: 0.92, crouch: 0.8, punch: 0.95, kick: 0.98, cpunch: 0.82, ckick: 0.85, jpunch: 0.92, jkick: 0.92, special: 0.95, hit: 0.9, block: 0.85, ko: 0.88, win: 0.95 },
  });
  const visual = (row, color) => ({
    visualSheet: id, visualRow: row, impactSheets: [], impactColor: color,
  });

  FIGHTERS.push(
    {
      id,
      name: 'RAFAEL',
      title: 'O Fixer de Night City',
      bio: 'Cabelo loiro, chrome preto sobre roupa verde e arma pesada nas duas mãos — o fixer de Night City. Monofio corta de longe, o dash overclocka, e com pouca vida o sistema entra em OVERCLOCK: +25% de dano.',
      colors: { skin: '#F5DFC8', hair: '#E8C95A', shirt: '#1E4D2B', pants: '#101014', shoes: '#2A2A32', accent: '#C0392B' },
      traits: {},
      stats: { power: 1.3, speed: 0.85, weight: 1.3, hp: 210, meterRate: 0.95 },
      secret: false,
      quotes: {
        intro: ['Night City não perdoa quem hesita.', 'Meu chrome não falha.'],
        win: ['Serviço entregue. Pago em eddies.', 'Seu ICE não me aguentou.'],
        lose: ['...sistema superaqueceu.', 'Vou fazer um tune-up e volto.'],
        taunt: ['Vem pro alcance do monofio.'],
        special: ['MONOFIO!', 'QUICKHACK!'],
        super: ['QUEBRA-ICE!!'],
      },
      moves: {
        punch: { dmg: 10, range: 60, startup: 6, active: 4, recovery: 12 },  /* coronhada da arma (jab) */
        kick: { dmg: 15, range: 74, startup: 10, active: 4, recovery: 14 },  /* chute com a arma de lado */
      },
      special: {
        name: 'Monofio', type: 'melee-rush', dmg: 15, hits: 1,
        proj: { speed: 0, dmg: 15, w: 36, h: 36, color: '#C0392B', shape: 'orb', visualSheet: id, visualRow: 0 },
      },
      super: { name: 'Quebra-ICE', type: 'melee-rush', dmg: 18, hits: 4 },
    },
  );

  Object.assign(POWERS, {
    [id]: {
      element: 'electric',
      theme: 'rafael cyberpunk (James Norris): monofio beam que sangra, soco de chassi em área, dash de overclock, chuva de estilhaços e ult Quebra-ICE (quake de tela inteira)',
      powers: [
        Object.assign({
          id: 'corte-espectral', name: 'Monofio', slot: 'simple', row: 0,
          kind: 'beam', range: 270, dmg: 16, stun: 26, launch: -6, cd: 90, sfx: 'heavy',
          fx: { bleed: 140 },
          desc: 'Fio mono que corta horizontalmente (270px): 16 de dano + stun + SANGRAMENTO (~2,3s).',
        }, visual(0, '#C0392B')),
        Object.assign({
          id: 'slam-no-chao', name: 'Soco de Chassi', slot: 'simple', row: 1,
          kind: 'blast', at: 'self', dmg: 14, stun: 30, radius: 210, cd: 110, sfx: 'explosion',
          fx: { shock: 40, slow: 100 },
          desc: 'Espadona no chao: dano em area ao redor (14) + ELETRIZADO + LENTO.',
        }, visual(1, '#FFD24D')),
        Object.assign({
          id: 'investida-brutal', name: 'Dash de Overclock', slot: 'simple', row: 2,
          kind: 'dash', dmg: 16, speed: 15, stun: 30, kx: 14, cd: 90, whiffRecovery: 20, sfx: 'dash',
          fx: { vuln: 150 },
          desc: 'Dash overclockado: 16 de dano + stun + knockback forte + VULNERÁVEL (2,5s). Errou? recovery longo.',
        }, visual(2, '#5EB8FF')),
        Object.assign({
          id: 'chuva-de-laminas', name: 'Chuva de Estilhaços', slot: 'charge', meter: 0, row: 3,
          kind: 'rain', count: 6, dmg: 22, cd: 130, sfx: 'hazard',
          fx: { bleed: 160, slow: 80 },
          desc: 'Seis laminas caem no rival (~22 de dano): SANGRAMENTO (~2,7s) + LENTO.',
        }, visual(3, '#FFB03B')),
        Object.assign({
          id: 'impacto-devastador', name: 'Quebra-ICE', slot: 'ultimate', row: 4,
          kind: 'quake', screen: true, both: true, range: 460, dmg: 42, lock: 40, kx: 26, launch: -12, cd: 150, sfx: 'ultimate',
          fx: { explode: 3, bleed: 240, vuln: 200 },
          desc: 'ULT: slam que racha a TELA inteira (até 460px): 42 de dano inbloqueável + trava + arremessa + explosão + SANGRAMENTO (~4s) + VULNERÁVEL.',
        }, visual(4, '#FF5A3C')),
      ],
    },
  });

  Object.assign(ELEMENT_FX, { [id]: { sheet: id, color: '#C0392B' } });

  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'OVERCLOCK DO FIXER',
      desc: 'Fixer cyberpunk: monofio beam longo que sangra, soco de chassi em área, dash de overclock e ult Quebra-ICE que racha a tela (inbloqueável). Passivas: ESQUIVA 15% com efeito SANDEVISTAN (slowmo + rastro ciano) + OVERCLOCK abaixo de 35% de vida: +25% dano.',
      basic: {},
      ability: {},
      lowHpRage: 1.25,   /* OVERCLOCK: +25% dano abaixo de 35% de vida */
      dodge: 0.15,       /* ESQUIVA DO FIXER: 15% dos golpes/projecteis desviam sozinhos (pesado e lento, compensa na defesa) */
      sandevistan: true, /* esquiva aciona efeito Sandevistan: slowmo + flash ciano + rastro */
    },
  });
})();
