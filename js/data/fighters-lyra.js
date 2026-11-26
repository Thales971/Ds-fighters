/* DS Fighters — LYRA, a Maga do JavaScript (nov/2026).
   Arte do dono (arte-fonte/personagens/Maga JS *.jpg): elfa de cabelo
   prateado, manto azul com bordado dourado e cajado com o orbe {}.
     poses   -> tools/integrate_fighter.py lyra
     poderes -> tools/build_lyra_fx.py (atlas animado + circulo/impacto extra)
   Zoner de controle: arrow function de longe, Promise.all em leque, Event
   Loop que prende o rival, try/catch que devolve projetil e a ULT EXCLUSIVA
   "Stack Overflow": estoura a pilha do rival — todos os poderes dele entram
   em recarga e as barras de carga caem pela metade. */
(() => {
  const id = 'lyra';
  SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
  SPRITE_LAYOUT.ver = SPRITE_LAYOUT.ver || {};
  SPRITE_LAYOUT.ver[id] = 'v65-lyra';
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    headScan: true, /* acessorio: cabeca medida pelo tronco (sprites.js _headScanBody) */
    accHide: ['kick', 'win'],
  });
  const visual = (row, color) => ({
    visualSheet: id, visualRow: row, impactSheets: ['lyra-extra'], impactColor: color,
  });

  FIGHTERS.push({
    id,
    name: 'LYRA',
    title: 'A Maga do JavaScript',
    bio: 'Elfa que aprendeu magia lendo a especificação do ECMAScript inteira. O cajado guarda um orbe { } que compila feitiço em tempo de execução: arrow functions, promessas em paralelo e um event loop que prende qualquer um. Quando ela perde a paciência, a pilha do rival estoura.',
    colors: { skin: '#F7E2D2', hair: '#E6E6F2', shirt: '#2B2F8C', pants: '#23266E', shoes: '#6B3F22', accent: '#FFC83D' },
    traits: { longHair: true, elfEars: true, staff: true },
    stats: { power: 1.12, speed: 1.08, weight: 0.9, hp: 150, meterRate: 1.25 },
    secret: false,
    quotes: {
      intro: ['const vitoria = await voce.cair();', 'Tudo é objeto. Inclusive você.'],
      win: ['return vitoria;', 'Promise resolvida.'],
      lose: ['undefined is not a function...', 'Esqueci o await...'],
      taunt: ['typeof voce === "bug"'],
      special: ['=> ARROW FUNCTION!', 'PROMISE.ALL!', 'EVENT LOOP!', 'TRY... CATCH!'],
      super: ['STACK OVERFLOW!!'],
    },
    moves: {
      punch: { dmg: 7, range: 70, startup: 5, active: 4, recovery: 10 },   /* estocada com o cajado */
      kick: { dmg: 11, range: 82, startup: 8, active: 5, recovery: 13 },   /* giro do cajado (arco) */
    },
    special: {
      name: 'Arrow Function', type: 'projectile', cost: 25,
      proj: { row: 0, speed: 13, dmg: 11, w: 28, h: 18, color: '#FFC83D', shape: 'bolt', visualSheet: id, visualRow: 0 },
    },
    super: { name: 'Stack Overflow', type: 'buff', visualSheet: id, visualRow: 4 },
  });

  Object.assign(POWERS, {
    [id]: {
      element: 'arcano',
      theme: 'javascript: arrow function, Promise.all, event loop, try/catch e o stack overflow',
      powers: [
        Object.assign({
          id: 'arrow-function', name: 'Arrow Function', slot: 'simple', row: 0,
          kind: 'shot', dmg: 11, speed: 13, cd: 48, sfx: 'magic',
          fx: { burn: 80 },
          desc: 'Cometa "=>" de fogo arcano: rápido, QUEIMA.',
        }, visual(0, '#FFC83D')),
        Object.assign({
          id: 'promise-all', name: 'Promise.all', slot: 'simple', row: 1,
          kind: 'shot', count: 3, spread: 0.22, dmg: 5, speed: 11, seek: true, cd: 62, sfx: 'magic',
          fx: { slow: 50 },
          desc: '3 setas roxas em paralelo que seguem o rival: cada uma deixa LENTO.',
        }, visual(1, '#A47BFF')),
        Object.assign({
          id: 'event-loop', name: 'Event Loop', slot: 'charge', meter: 0, row: 2,
          kind: 'zone', time: 300, dmg: 0.09, slow: 60, cd: 110, sfx: 'hazard',
          fx: { meterSlow: 60 },
          desc: 'Vórtice de ampulhetas no rival por ~5s: dano contínuo, LENTO e o medidor dele carrega devagar.',
        }, visual(2, '#6E5BFF')),
        Object.assign({
          id: 'try-catch', name: 'try { } catch', slot: 'charge', meter: 1, row: 3,
          kind: 'aura', time: 240, reflect: true, defMult: 0.7, heal: 10, cd: 120, sfx: 'shield',
          desc: 'Escudo hexagonal { } por 4s: DEVOLVE projéteis, reduz o dano recebido e cura um pouco.',
        }, visual(3, '#FFB04A')),
        Object.assign({
          id: 'stack-overflow', name: 'Stack Overflow', slot: 'ultimate', row: 4,
          kind: 'stackoverflow', dmg: 9, hits: 3, cd: 150, sfx: 'ultimate',
          desc: 'EXCLUSIVA: círculo de runas prende o rival e 3 raios caem nele. A pilha estoura: todos os poderes dele entram em recarga e as barras de carga caem pela metade.',
        }, visual(4, '#7DE0FF')),
      ],
    },
  });

  Object.assign(ELEMENT_FX, { [id]: { sheet: id, color: '#FFC83D' } });
  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'CALL STACK',
      desc: 'Zoner de controle: projéteis rápidos, setas teleguiadas, vórtice que prende, escudo que devolve e a ult que zera os poderes do rival.',
      basic: {},
      ability: {},
    },
  });
})();
