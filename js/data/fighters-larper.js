/* DS Fighters — LARPER, a toxicologista de rua (veneno), nov/2026.
   Arte do dono (bugs/Novos-personagens/Larper *.jpg): tranças com pontas
   verdes, mascara de gas, traje tatico preto com linhas verdes e cartuchos
   de gas na cintura.
     poses   -> tools/integrate_fighter.py larper
     poderes -> tools/build_larper_fx.py (atlas animado + nuvem/impacto extra)
   Pressao de veneno: tudo dela deixa o rival ENVENENADO; a granada e a ult
   deixam nuvem toxica no chao pra fechar espaco. */
(() => {
  const id = 'larper';
  SPRITE_LAYOUT.files[id] = `assets/sprites/${id}.png`;
  SPRITE_LAYOUT.ver = SPRITE_LAYOUT.ver || {};
  SPRITE_LAYOUT.ver[id] = 'v66-larper';
  SPRITE_LAYOUT.perFighter[id] = Object.assign(SPRITE_LAYOUT.perFighter[id] || {}, {
    frames: Object.fromEntries(SPRITE_LAYOUT.poses.map((pose) => [pose, 4])),
    headScan: true, /* acessorio: cabeca medida pelo tronco (sprites.js _headScanBody) */
    accHide: ['hit', 'ko'],
  });
  const visual = (row, color) => ({
    visualSheet: id, visualRow: row, impactSheets: ['larper-extra'], impactColor: color,
  });

  FIGHTERS.push({
    id,
    name: 'LARPER',
    title: 'A Toxicologista',
    bio: 'Ninguém sabe o rosto dela: só a máscara de gás e os olhos verdes acesos. Carrega cartuchos de toxina na cintura e transforma qualquer arena num laboratório a céu aberto. Respira fundo? Melhor não.',
    colors: { skin: '#7A4A2E', hair: '#141414', shirt: '#121612', pants: '#0E120E', shoes: '#0B0D0B', accent: '#9DFF2E' },
    traits: { gasMask: true, braids: true, toxinCanisters: true },
    stats: { power: 1.1, speed: 1.16, weight: 0.98, hp: 160, meterRate: 1.2 },
    secret: false,
    quotes: {
      intro: ['Respira fundo. Vai.', 'Esse ar já é meu.'],
      win: ['Área contaminada.', 'Devia ter trazido máscara.'],
      lose: ['O filtro... entupiu...', 'Vazamento no traje...'],
      taunt: ['Sente esse cheiro?'],
      special: ['BOLA TÓXICA!', 'GRANADA DE GÁS!', 'GARRA ÁCIDA!', 'POÇA CORROSIVA!'],
      super: ['NUVEM DA MORTE!!'],
    },
    moves: {
      punch: { dmg: 8, range: 56, startup: 5, active: 4, recovery: 9 },
      kick: { dmg: 12, range: 68, startup: 8, active: 5, recovery: 12 },
    },
    special: {
      name: 'Bola Tóxica', type: 'projectile', cost: 25,
      proj: { row: 0, speed: 11, dmg: 10, w: 26, h: 26, color: '#9DFF2E', shape: 'orb', visualSheet: id, visualRow: 0 },
    },
    super: { name: 'Nuvem da Morte', type: 'buff', visualSheet: id, visualRow: 4 },
  });

  Object.assign(POWERS, {
    [id]: {
      element: 'veneno',
      theme: 'veneno: bola tóxica, granada de gás, garras ácidas, poça corrosiva e a nuvem da morte',
      powers: [
        Object.assign({
          id: 'bola-toxica', name: 'Bola Tóxica', slot: 'simple', row: 0,
          kind: 'shot', dmg: 10, speed: 11, poison: 150, cd: 48, sfx: 'magic',
          fx: { poison: 150 },
          desc: 'Orbe de toxina: ENVENENA (~2,5s).',
        }, visual(0, '#9DFF2E')),
        Object.assign({
          id: 'granada-gas', name: 'Granada de Gás', slot: 'simple', row: 1,
          kind: 'shot', dmg: 8, speed: 9, arc: true, cd: 70, sfx: 'explosion', poison: 120,
          zone: { key: 'fx2:larper-extra', row: 0, w: 170, time: 180, dmg: 0.06, poison: 120, slow: 30 },
          desc: 'Granada que estoura numa nuvem de gás no chão: ENVENENA e deixa LENTO quem fica dentro.',
        }, visual(1, '#7CE61E')),
        Object.assign({
          id: 'garra-acida', name: 'Garra Ácida', slot: 'charge', meter: 0, row: 2,
          kind: 'dash', dmg: 18, speed: 16, stun: 26, cd: 70, sfx: 'dash',
          fx: { poison: 160, bleed: 90 },
          desc: 'Investida com garras de ácido: ENVENENA e deixa SANGRANDO.',
        }, visual(2, '#B6FF4A')),
        Object.assign({
          id: 'poca-corrosiva', name: 'Poça Corrosiva', slot: 'charge', meter: 1, row: 3,
          kind: 'zone', time: 300, dmg: 0.1, slow: 50, poison: 150, cd: 110, sfx: 'hazard',
          fx: { vuln: 60 },
          desc: 'Poça de ácido embaixo do rival por ~5s: dano contínuo, VENENO, LENTO e VULNERÁVEL.',
        }, visual(3, '#8BF02A')),
        Object.assign({
          id: 'nuvem-da-morte', name: 'Nuvem da Morte', slot: 'ultimate', row: 4,
          kind: 'blast', at: 'target', dmg: 30, stun: 34, launch: -8, cd: 150, sfx: 'ultimate',
          fx: { poison: 320, slow: 140, blind: 100 },
          zoneAfter: { key: 'fx2:larper-extra', row: 0, w: 260, time: 260, dmg: 0.09, poison: 160, slow: 40 },
          desc: 'Caveira de gás explode no rival: VENENO forte, LENTO e CEGO — e a nuvem tóxica fica no chão por ~4s.',
        }, visual(4, '#9DFF2E')),
      ],
    },
  });

  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'CONTAMINAÇÃO',
      desc: 'Tudo dela envenena: orbe de toxina de longe, granada e poça que fecham o espaço, garra ácida de perto e a nuvem da morte na ult.',
      basic: {},
      ability: {},
    },
  });
})();
