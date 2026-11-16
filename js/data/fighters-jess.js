/* DS Fighters — JESS, a QA Tester.
   Ficha do dono: zoner técnica, a mais frágil do roster (paga pelos
   projéteis), melhor dash, dano individual baixo, aposta na distância.
   "Jess ganha o jogo cedo ou perde o jogo tarde." */
(() => {
  const id = 'jess';
  SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    poseScale: { idle: 0.85, walk: 0.85, jump: 0.85, crouch: 0.7, punch: 0.85, kick: 0.85, cpunch: 0.75, ckick: 0.75, jpunch: 0.85, jkick: 0.85, block: 0.7, special: 0.8, hit: 0.8, ko: 0.8, win: 0.75 },
  });
  const visual = (row, color) => ({
    visualSheet: id, visualRow: row, impactSheets: [], impactColor: color,
  });

  FIGHTERS.push(
    {
      id,
      name: 'JESS',
      title: 'A QA Tester',
      bio: 'QA de verdade: reproduz, isola e fecha. A jaqueta violeta é o uniforme, o ✓ verde é o veredito. Zona a tela com asserts e pune quem entra desligado.',
      colors: { skin: '#FFE8D0', hair: '#F5D76E', shirt: '#FFFFFF', pants: '#1E2A5A', shoes: '#F5F5F5', accent: '#7C3AED' },
      traits: { ponytail: true, glasses: true },
      stats: { power: 1.18, speed: 1.30, weight: 0.85, hp: 159, meterRate: 1.36 },
      secret: false,
      quotes: {
        intro: ['Mais um bug pra fechar.', 'Coverage 100%. Você, 0%.'],
        win: ['Reproduzido, corrigido, fechado.', 'Marcar como resolvido.'],
        special: ['TO BE!', 'ASSERT!', 'MOCK!'],
        super: ['DALTONIC MODE!!'],
      },
      moves: {
        punch: { dmg: 7, range: 52, startup: 4, active: 4, recovery: 8 },   /* jab: encadeia */
        kick: { dmg: 12, range: 66, startup: 8, active: 4, recovery: 10 },  /* cruzado */
      },
      special: {
        name: 'To Be', type: 'projectile', cost: 25,
        proj: { row: 0, speed: 10, dmg: 10, w: 26, h: 22, color: '#52D273', shape: 'orb', visualSheet: id, visualRow: 0 },
      },
      super: { name: 'Daltonic Mode', type: 'buff', visualSheet: id, visualRow: 4 },
    },
  );

  Object.assign(POWERS, {
    [id]: {
      element: 'terra',
      theme: 'qa: asserts, mocks, coverage e a ultimate que drena as cores',
      powers: [
        Object.assign({
          id: 'to-be', name: 'To Be', slot: 'simple', row: 0,
          kind: 'shot', dmg: 10, speed: 10, cd: 55, sfx: 'magic',
          fx: { vuln: 240 },
          desc: 'Projétil assert (✓ verde). Aplica ASSERTION FAILED: +10% de dano recebido por 4s.',
        }, visual(0, '#52D273')),
        Object.assign({
          id: 'mock', name: 'Mock', slot: 'simple', row: 1,
          kind: 'shot', dmg: 12, speed: 9, seek: true, cd: 80, sfx: 'magic',
          desc: 'Clone holograma cinza que repete o ÚLTIMO especial do oponente, com 75% do dano dele.',
        }, visual(1, '#9AA3B2')),
        Object.assign({
          id: 'watch-mode', name: 'Watch Mode', slot: 'charge', meter: 0, row: 2,
          kind: 'dash', dmg: 6, speed: 18, iFrames: 10, cd: 110, sfx: 'dash',
          desc: 'Hot reload: cancela a recovery num dash curto. 1x por combo.',
        }, visual(2, '#9ADCFF')),
        Object.assign({
          id: 'snapshot', name: 'Snapshot', slot: 'charge', meter: 1, row: 3,
          kind: 'blast', at: 'target', dmg: 14, stun: 20, radius: 150, cd: 160, sfx: 'heavy',
          fx: { freeze: 48 },
          desc: 'Flash de câmera: stun se o oponente estiver no ar ou em recovery.',
        }, visual(3, '#FFFFFF')),
        Object.assign({
          id: 'daltonic', name: 'Daltonic Mode', slot: 'ultimate', row: 4,
          kind: 'daltonic', dmg: 0, cd: 900, sfx: 'ultimate',
          desc: 'Por 6s o oponente vê tudo em cinza e turvo (gás rosa), fica lento constante e com os botões de movimento e de poder invertidos; Jess converte 25% do dano em vida.',
        }, visual(4, '#F0C24B')),
      ],
    },
  });

  Object.assign(ELEMENT_FX, { [id]: { sheet: id, color: '#52D273' } });
  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'ASSERTION FAILED',
      desc: 'Zoner técnica: projéteis que marcam, dash que cancela e a ultimate que drena as cores do rival.',
      basic: {},
      ability: { vuln: 240 },
    },
  });
})();
