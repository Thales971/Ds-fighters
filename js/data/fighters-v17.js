/* DS Fighters V17 — John the Vibe Coder: herdeiro do fuzil, discipulo do Du.
   Inimigo do Lobao. One-For-All style: socos com efeitos variados.
   Arte do dono em bugs/Novos-personagens/, recortada por
   tools/integrate_fighter.py. Carregado apos o V16. */
(() => {
  const id = 'john-vibe';
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
      name: 'JOHN THE VIBE CODER',
      title: 'O Herdeiro do Fuzil',
      bio: 'Discípulo do Dev Veterano. Nasceu na periferia de Nexo City, entrou na milícia dev ainda moleque. Sem nenhum dom, só teimosia — herdou as duas pistolas de treino do mestre e a doutrina: disciplina, distância, nunca desperdiçar tiro. Odeia quem rouba o que não construiu. Fala pouco, mira melhor.',
      colors: { skin: '#d4a97e', hair: '#1a1418', shirt: '#e8e4dc', pants: '#1a1a20', shoes: '#101014', accent: '#f0c84a' },
      traits: { veteran: true, dualPistols: true, glowingFist: true, hairStyle: 'short' },
      stats: { power: 1.36, speed: 1.10, weight: 1.05, hp: 140, meterRate: 1.20 },
      secret: false,
      quotes: {
        intro: ['Treino é a única coisa que ninguém te rouba.', 'Dez horas por dia. Sem desculpa.'],
        win: ['Isso foi construído, não herdado.', 'Disciplina vence dom.'],
        special: ['SOCO VIBRACIONAL!', 'CARGA DE FUZIL!', 'MÃO QUE MIRA!'],
        super: ['HERANÇA DO FUZIL!!'],
      },
      moves: {
        punch: { dmg: 7, range: 54, startup: 4, active: 5, recovery: 10 },
        kick: { dmg: 10, range: 68, startup: 6, active: 5, recovery: 12 },
      },
      special: {
        name: 'Soco Vibracional', type: 'projectile', cost: 25,
        proj: { row: 0, speed: 11, dmg: 12, w: 26, h: 22, color: '#f0c84a', shape: 'bolt', visualSheet: id, visualRow: 0 },
      },
      super: { name: 'Herança do Fuzil', type: 'melee-rush', dmg: 34, hits: 6, visualSheet: id, visualRow: 4 },
    },
  );

  Object.assign(POWERS, {
    [id]: {
      element: 'vibe',
      theme: 'socos vibracionais, fuzil herdado e disciplina de aço',
      powers: [
        Object.assign({
          id: 'vibe-punch', name: 'Soco Vibracional', slot: 'simple', row: 0,
          kind: 'shot', dmg: 12, speed: 11, seek: true, stun: 16, cd: 40,
          fx: { shock: 50, vuln: 40 }, sfx: 'heavy',
          desc: 'Soco de energia vibracional AUTO-AIM que eletriza e deixa vulnerável.',
        }, visual(0, '#f0c84a')),
        Object.assign({
          id: 'rifle-charge', name: 'Carga de Fuzil', slot: 'simple', row: 1,
          kind: 'dash', dmg: 17, speed: 15, stun: 26, cd: 46,
          fx: { bleed: 100, burn: 60 }, sfx: 'dash',
          desc: 'Investida com as duas pistolas: SANGRA e QUEIMA no contato.',
        }, visual(1, '#ff8a3a')),
        Object.assign({
          id: 'aim-fist', name: 'Mão que Mira', slot: 'charge', meter: 0, row: 2,
          kind: 'pillar', at: 'target', delay: 12, dmg: 21, stun: 32, launch: -8, cd: 68,
          fx: { paralyze: 40, lock: 50 }, sfx: 'explosion',
          desc: 'Punho de precisão: PARALISA e TRAVA os poderes do alvo.',
        }, visual(2, '#f0c84a')),
        Object.assign({
          id: 'doctrine', name: 'Doutrina do Mestre', slot: 'charge', meter: 1, row: 3,
          kind: 'aura', time: 360, dmgMult: 1.3, speedMult: 1.2, defMult: 0.75, heal: 15, cd: 88,
          sfx: 'shield',
          desc: 'A doutrina do Dev Veterano: +30% dano, +20% velocidade, −25% dano recebido e cura.',
        }, visual(3, '#f0e0a0')),
        Object.assign({
          id: 'rifle-inheritance', name: 'Herança do Fuzil', slot: 'ultimate', row: 4,
          kind: 'rush', dmg: 34, hits: 6, cd: 122,
          fx: { bleed: 120, burn: 100, vuln: 80 }, sfx: 'ultimate',
          desc: 'Sequência de 6 socos com as duas pistolas: sangra, queima e deixa vulnerável.',
        }, visual(4, '#ffaa3a')),
      ],
    },
  });

  Object.assign(ELEMENT_FX, {
    vibe: { sheet: id, color: '#f0c84a' },
    [id]: { sheet: id, color: '#f0c84a' },
  });

  Object.assign(SIGNATURES, {
    [id]: {
      trait: 'HERDEIRO DO FUZIL',
      desc: 'Socos vibracionais que eletrizam, sangram, queimam e paralisam. O treino é a única coisa que ninguém rouba.',
      basic: {},
      ability: {},
    },
  });
})();
