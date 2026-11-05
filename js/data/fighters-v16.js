/* DS Fighters V16 — Odette: elegante, bolsa de mao e golpes precisos.
   Arte do dono em bugs/Novos-personagens/, recortada por
   tools/integrate_fighter.py. Carregado apos o V15. */
(() => {
  const id = 'odette';
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
      name: 'ODETTE',
      title: 'A Elegância em Pessoa',
      bio: 'Executiva impecável de afro grande, argolas douradas, blazer marrom e bolsa de mão que bate como martelo. Luta com postura, precisão e um desfile de golpes.',
      colors: { skin: '#8a5a3a', hair: '#1a1018', shirt: '#6a2430', pants: '#181420', shoes: '#e8e4dc', accent: '#e8b84a' },
      traits: { stylish: true, handbag: true, afroHair: true },
      stats: { power: 1.26, speed: 1.12, weight: 0.98, hp: 130, meterRate: 1.14 },
      secret: false,
      quotes: {
        intro: ['Postura primeiro.', 'Isso não vai ficar barato.'],
        win: ['Desfile encerrado.', 'Elegância venceu.'],
        special: ['BOLSADA!', 'SALTO ESCARPIN!', 'CARTEIRA DE GOLPES!'],
        super: ['DEFILE FINAL!!'],
      },
      moves: {
        punch: { dmg: 6, range: 52, startup: 4, active: 4, recovery: 9 },
        kick: { dmg: 9, range: 66, startup: 6, active: 4, recovery: 11 },
      },
      special: {
        name: 'Bolsada Voadora', type: 'projectile', cost: 25,
        proj: { row: 0, speed: 10, dmg: 13, w: 26, h: 22, color: '#e8b84a', shape: 'orb', visualSheet: id, visualRow: 0 },
      },
      super: { name: 'Desfile Final', type: 'melee-rush', dmg: 32, hits: 7, visualSheet: id, visualRow: 4 },
    },
  );
  Object.assign(POWERS, {
    [id]: {
      element: 'estilo',
      theme: 'bolsa de mão, escarpins e golpes de desfile',
      powers: [
        Object.assign({
          id: 'flying-handbag', name: 'Bolsada Voadora', slot: 'simple', row: 0,
          kind: 'shot', dmg: 13, speed: 10, stun: 16, cd: 42,
          fx: { meterSlow: 35 }, sfx: 'heavy',
          desc: 'A bolsa voa na cara do rival e atrasa o medidor dele.',
        }, visual(0, '#e8b84a')),
        Object.assign({
          id: 'heel-hop', name: 'Salto Escarpin', slot: 'simple', row: 1,
          kind: 'dash', dmg: 15, speed: 14, stun: 24, cd: 48,
          fx: { bleed: 110 }, sfx: 'dash',
          desc: 'Avanço com escarpin: rasga e deixa o rival SANGRANDO.',
        }, visual(1, '#ff6a6a')),
        Object.assign({
          id: 'wallet-strikes', name: 'Carteira de Golpes', slot: 'charge', meter: 0, row: 2,
          kind: 'pillar', at: 'target', delay: 14, dmg: 20, stun: 32, launch: -7, cd: 70,
          fx: { stun: 12 }, sfx: 'explosion',
          desc: 'Rajada de golpes precisos que enche a barra de tontura do rival.',
        }, visual(2, '#e8b84a')),
        Object.assign({
          id: 'runway-walk', name: 'Passe de Moda', slot: 'charge', meter: 1, row: 3,
          kind: 'zone', at: 'target', time: 110, w: 220, dmg: 0.09, slow: 35, cd: 80,
          fx: { vuln: 60 }, sfx: 'magic',
          desc: 'A passarela domina a área: lentidão e vulnerabilidade.',
        }, visual(3, '#ffb84a')),
        Object.assign({
          id: 'final-runway', name: 'Desfile Final', slot: 'ultimate', row: 4,
          kind: 'rush', dmg: 32, hits: 7, cd: 126,
          fx: { vuln: 70 }, sfx: 'ultimate',
          desc: 'Desfile de socos de perto — cada passo é um golpe.',
        }, visual(4, '#ffd84a')),
      ],
    },
  });
  Object.assign(ELEMENT_FX, {
    estilo: { sheet: id, color: '#e8b84a' },
    [id]: { sheet: id, color: '#e8b84a' },
  });
  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'ELEGÂNCIA',
      desc: 'Bolsa que voa, escarpin que rasga e um desfile de golpes que deixa o rival vulnerável.',
      basic: {},
      ability: {},
    },
  });
})();
