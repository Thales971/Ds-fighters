/* DS Fighters — DOMADOR DE PGADMIN (nov/2026).
   Arte do dono (bugs/Novos-personagens/Domador *.jpg): mestre de picadeiro
   de cartola e bigode, casaca azul com dragonas douradas, chicote vermelho
   e o ELEFANTE AZUL do PostgreSQL flutuando no ombro.
     poses   -> tools/integrate_fighter.py domador
     poderes -> tools/build_domador_fx.py (atlas animado + extra)
   Peso-pesado de controle: chicote rapido, query arremessada, estouro do
   elefante, indice B-tree que prende e a ult PISAO DO ELEFANTE com onda de
   choque no chao. */
(() => {
  const id = 'domador';
  SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
  SPRITE_LAYOUT.ver = SPRITE_LAYOUT.ver || {};
  SPRITE_LAYOUT.ver[id] = 'v68-domador';
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    headScan: true, /* acessorio: cabeca medida pelo tronco (sprites.js _headScanBody) */
    accHide: ['jump', 'jpunch', 'ko'],
  });
  const visual = (row, color) => ({
    visualSheet: id, visualRow: row, impactSheets: ['domador-extra'], impactColor: color,
  });

  FIGHTERS.push({
    id,
    name: 'DOMADOR',
    title: 'O Domador de pgAdmin',
    bio: 'Respeitável público! O mestre do picadeiro domou o elefante mais teimoso do mundo: o PostgreSQL. Com um estalo do chicote o banco obedece — queries voam, índices brotam do chão e, no grande número, a pata do elefante desce do céu.',
    colors: { skin: '#E8B48E', hair: '#151010', shirt: '#14204A', pants: '#101A3C', shoes: '#0C0C10', accent: '#4FB4FF' },
    traits: { topHat: true, mustache: true, whip: true, elephantPet: true },
    stats: { power: 1.2, speed: 1.02, weight: 1.12, hp: 170, meterRate: 1.15 },
    secret: false,
    quotes: {
      intro: ['Respeitável público!', 'O elefante obedece. E você?'],
      win: ['Aplausos para o elefante!', 'COMMIT. Fim do espetáculo.'],
      lose: ['O elefante... fugiu do picadeiro...', 'Deadlock no picadeiro...'],
      taunt: ['SELECT * FROM aplausos;'],
      special: ['CHICOTADA!', 'QUERY NA CARA!', 'ESTOURO DO ELEFANTE!', 'ÍNDICE B-TREE!'],
      super: ['PISÃO DO ELEFANTE!!'],
    },
    moves: {
      punch: { dmg: 8, range: 58, startup: 6, active: 4, recovery: 10 },
      kick: { dmg: 13, range: 70, startup: 9, active: 5, recovery: 13 },
    },
    special: {
      name: 'Chicotada', type: 'projectile', cost: 25,
      proj: { row: 0, speed: 15, dmg: 10, w: 30, h: 20, color: '#FFC34D', shape: 'bolt', visualSheet: id, visualRow: 0 },
    },
    super: { name: 'Pisão do Elefante', type: 'buff', visualSheet: id, visualRow: 4 },
  });

  Object.assign(POWERS, {
    [id]: {
      element: 'agua',
      theme: 'postgres: chicote, query arremessada, estouro do elefante, índice B-tree e o pisão do elefante',
      powers: [
        Object.assign({
          id: 'chicotada', name: 'Chicotada', slot: 'simple', row: 0,
          kind: 'shot', dmg: 10, speed: 15, cd: 44, sfx: 'whoosh',
          fx: { vuln: 90, dizzy: 24 },
          desc: 'Estalo do chicote: rápido, deixa o rival VULNERÁVEL e TONTO por um instante.',
        }, visual(0, '#FFC34D')),
        Object.assign({
          id: 'query-arremessada', name: 'Query Arremessada', slot: 'simple', row: 1,
          kind: 'shot', dmg: 13, speed: 10, big: true, cd: 66, sfx: 'heavy',
          fx: { slow: 90, meterSlow: 80 },
          desc: 'Arremessa um cilindro do banco: pesado, deixa LENTO e com o MEDIDOR LENTO (consulta travada).',
        }, visual(1, '#4FB4FF')),
        Object.assign({
          id: 'estouro-elefante', name: 'Estouro do Elefante', slot: 'charge', meter: 0, row: 2,
          kind: 'dash', dmg: 22, speed: 15, stun: 30, cd: 70, sfx: 'dash',
          fx: { launch: -10 },
          desc: 'O elefante azul dispara pela arena e ATROPELA o rival, jogando ele pra cima.',
        }, visual(2, '#5AC8FF')),
        Object.assign({
          id: 'indice-btree', name: 'Índice B-Tree', slot: 'charge', meter: 1, row: 3,
          kind: 'pillar', at: 'target', dmg: 14, stun: 20, launch: 0, delay: 18, trap: 70, cd: 100, sfx: 'magic',
          fx: { slow: 60 },
          desc: 'Uma árvore B-tree brota embaixo do rival e PRENDE ele nas raízes (~1s) + LENTO.',
        }, visual(3, '#7AD8FF')),
        Object.assign({
          id: 'pisao-elefante', name: 'Pisão do Elefante', slot: 'ultimate', row: 4,
          kind: 'blast', at: 'target', dmg: 30, stun: 36, launch: -12, cd: 150, sfx: 'ultimate',
          fx: { vuln: 180, slow: 120 },
          zoneAfter: { key: 'fx2:domador-extra', row: 0, w: 280, time: 200, dmg: 0.06, slow: 50 },
          desc: 'O elefante invocado pisa no rival: dano pesado, LANÇA, VULNERÁVEL + LENTO, e a onda de choque fica no chão (~3s).',
        }, visual(4, '#4FB4FF')),
      ],
    },
  });

  Object.assign(ELEMENT_FX, { [id]: { sheet: id, color: '#4FB4FF' } });
  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'PICADEIRO',
      desc: 'Peso-pesado de controle: chicote rápido, query que trava o medidor, elefante que atropela, B-tree que prende e o pisão do elefante na ult.',
      basic: {},
      ability: {},
    },
  });
})();
