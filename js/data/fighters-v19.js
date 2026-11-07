/* DS Fighters V19 — NUNES, a Fênix de Nexo City.
   Zoner de dano contínuo: cada chama que ele acende fica na arena, queimando
   e travando o oponente, enquanto ele se cura dentro do próprio fogo
   (Passiva: Fagulha Viva). Arte do dono em bugs/Novos-personagens/
   (nunes-*.jpg), recortada por tools/integrate_fighter.py. */
(() => {
  const id = 'nunes';
  SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    poseScale: { block: 0.7, crouch: 0.7, cpunch: 0.75, ckick: 0.75, hit: 0.8, special: 0.8, win: 0.75 },
  });
  const visual = (row, color) => ({
    visualSheet: id, visualRow: row, impactSheets: [], impactColor: color,
  });

  FIGHTERS.push(
    {
      id,
      name: 'NUNES',
      title: 'A Fênix de Nexo City',
      bio: 'Bombeiro aposentado que sobreviveu a um incêndio que não devia ter sobrevivido — 60% do corpo em cicatrizes de queimadura. Descobriu que o fogo reconhece quem ele não queima: as chamas dele obedecem. Agora luta ouvindo música no fone branco, calmo demais pra quem faz a arena pegar fogo.',
      colors: { skin: '#c8956b', hair: '#2a1a12', shirt: '#1A1216', pants: '#241a20', shoes: '#101014', accent: '#FF7A1A' },
      traits: { headphones: true, fireJacket: true, firefighter: true, scars: true },
      stats: { power: 1.42, speed: 1.10, weight: 1.04, hp: 146, meterRate: 1.30 },
      secret: false,
      quotes: {
        intro: ['O fogo não me queima. Você não é o fogo.', 'Relaxa. Vai doer só o tempo todo.'],
        win: ['Acendeu mais rápido do que apagou.', 'A cozinha fechou.'],
        special: ['ACENDE!', 'SÓ O RASTO!', 'PIÇA DE FOGO!'],
        super: ['RENASCE, FÊNIX!!'],
      },
      moves: {
        punch: { dmg: 7, range: 54, startup: 5, active: 4, recovery: 10 },
        kick: { dmg: 10, range: 66, startup: 6, active: 5, recovery: 12 },
      },
      special: {
        name: 'Bola de Fogo', type: 'projectile', cost: 25,
        proj: { row: 1, speed: 10, dmg: 14, w: 28, h: 24, color: '#FF7A1A', shape: 'orb', visualSheet: id, visualRow: 1 },
      },
      super: { name: 'Renascer das Cinzas', type: 'transform', visualSheet: id, visualRow: 4 },
    },
  );

  Object.assign(POWERS, {
    [id]: {
      element: 'fogo',
      theme: 'zoner de fogo persistente: poças, muralhas e rastros que queimam e travam',
      powers: [
        Object.assign({
          id: 'incendiary-bang', name: 'Bang Incendiária', slot: 'simple', row: 0,
          kind: 'shot', dmg: 12, speed: 7, arc: true, heavy: true,
          zone: { w: 180, time: 480, dmg: 0.13, burn: 220, slow: 110 },
          cd: 46, sfx: 'fire',
          desc: 'Granada em arco que vira POÇA DE FOGO PERSISTENTE: quem pisar QUEIMA e fica LENTO.',
        }, visual(0, '#FF7A1A')),
        Object.assign({
          id: 'fireball', name: 'Bola de Fogo', slot: 'simple', row: 1,
          kind: 'shot', dmg: 14, speed: 10, seek: false,
          zone: { w: 150, time: 360, dmg: 0.11, burn: 180, slow: 60 },
          fx: { explode: 3 }, cd: 40, sfx: 'fire',
          desc: 'Projétil direto que EXPLODE no impacto e deixa CHAMAS no chão.',
        }, visual(1, '#E8402A')),
        Object.assign({
          id: 'flame-wall', name: 'Muralha de Chamas', slot: 'charge', meter: 0, row: 2,
          kind: 'wall', time: 420, dmg: 12, burn: 200, slow: 90, cd: 58, sfx: 'fire',
          desc: 'Parede vertical de fogo PERSISTENTE: queima e desacelera quem atravessar.',
        }, visual(2, '#FFD24A')),
        Object.assign({
          id: 'flame-dash', name: 'Avanço Flamejante', slot: 'charge', meter: 1, row: 3,
          kind: 'dash', dmg: 15, speed: 16, stun: 24, fireTrail: 300, burn: 160,
          fx: { burn: 140, slow: 60 }, cd: 50, sfx: 'dash',
          desc: 'Investida envolta em fogo — o RASTRO DE CHAMAS fica queimando no chão.',
        }, visual(3, '#FF7A1A')),
        Object.assign({
          id: 'phoenix-rebirth', name: 'Renascer das Cinzas', slot: 'ultimate', row: 4,
          kind: 'aura', time: 660, grant: 'phoenix', armor: true, heal: 18,
          cd: 120, sfx: 'ultimate', /* +10% de força vem do status FÊNIX (dmgMult) */
          desc: 'Deixa um CLONE DE FOGO na arena: se morrer com a Fênix ativa, REVIVE no clone com 40% de vida. Enquanto dura: +10% de força, -10% de recarga e +25% de vampirismo.',
        }, visual(4, '#FFF8E0')),
      ],
    },
  });

  Object.assign(ELEMENT_FX, {
    fênix: { sheet: id, color: '#FF7A1A' },
    [id]: { sheet: id, color: '#FF7A1A' },
  });

  /* STATUS: todo acerto de habilidade do NUNES aplica QUEIMANDO + LENTO —
     o zoner transforma a arena numa cozinha. */
  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'FÊNIX DE NEXO CITY',
      desc: 'Zoner de fogo persistente: poças, muralhas e rastros que QUEIMAM e deixam LENTOS; dentro do próprio fogo ele regenera (Fagulha Viva).',
      basic: { burn: 40 },
      ability: { burn: 120, slow: 80 },
    },
  });
})();
