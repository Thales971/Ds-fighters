/* DS Fighters — JESTER, o Bobo da Corte (nov/2026).
   Arte do dono (arte-fonte/personagens/Jester *.jpg): bobo de chapéu de
   guizos, gola dourada, roupa vinho com losangos, malabares de ✓ e ✗.
     poses   -> tools/integrate_fighter.py jester
     poderes -> tools/build_jester_fx.py (atlas animado + extra de impacto)
   Pedido do dono: ataques bem diferentes, cada um com um efeito que ATRAPALHA
   e IRRITA o rival — tela embaçada, tela girando, controle que mexe sozinho,
   poderes travados e, na ult exclusiva, os botões de poder EMBARALHADOS. */
(() => {
  const id = 'jester';
  SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
  SPRITE_LAYOUT.ver = SPRITE_LAYOUT.ver || {};
  SPRITE_LAYOUT.ver[id] = 'v67-jester';
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    headScan: true, /* acessorio: cabeca medida pelo tronco (sprites.js _headScanBody) */
    accHide: ['jump', 'jpunch', 'jkick', 'ko'],
  });
  const visual = (row, color) => ({
    visualSheet: id, visualRow: row, impactSheets: ['jester-extra'], impactColor: color,
  });

  FIGHTERS.push({
    id,
    name: 'JESTER',
    title: 'O Bobo da Corte',
    bio: 'Aprovou seu PR com um ✓ e reprovou com um ✗ no mesmo segundo. O bobo da corte não quer ganhar: quer te ver errando. Torta na cara, sino na orelha, pirulito hipnótico e um code review que trava tudo — e no grande final, nenhum botão faz o que devia.',
    colors: { skin: '#F8F2EC', hair: '#1A1212', shirt: '#7A1222', pants: '#8A1426', shoes: '#141014', accent: '#FFD23A' },
    traits: { jesterHat: true, bells: true, clownNose: true },
    stats: { power: 1.15, speed: 1.15, weight: 0.95, hp: 160, meterRate: 1.3 },
    secret: false,
    quotes: {
      intro: ['Vamos brincar?', 'Seu PR? Reprovado. Hahaha!'],
      win: ['A plateia amou!', 'Erro seu, risada minha.'],
      lose: ['A piada... era eu...', 'Ninguém riu...'],
      taunt: ['Aperta o botão... qualquer um!'],
      special: ['TORTA NA CARA!', 'DING DONG!', 'OLHA O PIRULITO!', 'CODE REVIEW: ✗!'],
      super: ['GRANDE FINAL!!'],
    },
    moves: {
      punch: { dmg: 7, range: 56, startup: 5, active: 4, recovery: 9 },   /* empurrão com a luva */
      kick: { dmg: 11, range: 68, startup: 7, active: 5, recovery: 11 },  /* chute de corrida */
    },
    special: {
      name: 'Torta na Cara', type: 'projectile', cost: 25,
      proj: { row: 0, speed: 10, dmg: 9, w: 30, h: 22, color: '#FFD23A', shape: 'orb', visualSheet: id, visualRow: 0 },
    },
    super: { name: 'Grande Final', type: 'buff', visualSheet: id, visualRow: 4 },
  });

  Object.assign(POWERS, {
    [id]: {
      element: 'caos',
      theme: 'bobo da corte: torta, sino, pirulito hipnótico, code review ✗ e o grande final que embaralha os botões',
      powers: [
        Object.assign({
          id: 'torta-na-cara', name: 'Torta na Cara', slot: 'simple', row: 0,
          kind: 'shot', dmg: 9, speed: 10, cd: 52, sfx: 'whoosh',
          fx: { blind: 160, slow: 50 },
          desc: 'Torta voadora: o rival fica CEGO (tela embaçada) e LENTO.',
        }, visual(0, '#FFD23A')),
        Object.assign({
          id: 'sino-do-bobo', name: 'Sino do Bobo', slot: 'simple', row: 1,
          kind: 'blast', at: 'target', dmg: 10, stun: 18, launch: 0, cd: 74, sfx: 'magic',
          fx: { vertigo: 200, dizzy: 40 },
          desc: 'Sino toca na orelha do rival: VERTIGEM (a tela dele gira) e fica TONTO.',
        }, visual(1, '#FFC23A')),
        Object.assign({
          id: 'pirulito-hipnotico', name: 'Pirulito Hipnótico', slot: 'charge', meter: 0, row: 2,
          kind: 'shot', dmg: 8, speed: 11, boomerang: true, cd: 80, sfx: 'whoosh',
          fx: { shock: 160 },
          desc: 'Bastão listrado que vai e VOLTA: quem leva fica ELETRIZADO (os controles mexem sozinhos).',
        }, visual(2, '#FF4F6A')),
        Object.assign({
          id: 'code-review', name: 'Code Review ✗', slot: 'charge', meter: 1, row: 3,
          kind: 'barrage', dmg: 3, count: 5, seek: true, cd: 110, sfx: 'hazard',
          fx: { lock: 70, meterSlow: 150 },
          desc: '5 bolas ✗ teleguiadas: cada uma deixa o rival SEM PODERES e com o MEDIDOR LENTO.',
        }, visual(3, '#FF3B3B')),
        Object.assign({
          id: 'grande-final', name: 'Grande Final', slot: 'ultimate', row: 4,
          kind: 'jesterfinale', dmg: 26, shuffle: 480, cd: 150, sfx: 'ultimate',
          desc: 'EXCLUSIVA: marretada com explosão e chuva de confete. Os BOTÕES DE PODER do rival ficam EMBARALHADOS por 8s (1-5 viram outros poderes) + TRAVAMENTO.',
        }, visual(4, '#FF4FD8')),
      ],
    },
  });

  Object.assign(ELEMENT_FX, { [id]: { sheet: id, color: '#FFD23A' } });
  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'PALHAÇADA',
      desc: 'Cada golpe atrapalha de um jeito: cega, gira a tela, mexe nos controles, trava os poderes e, na ult, embaralha os botões do rival.',
      basic: {},
      ability: {},
    },
  });
})();
